import { create, insert, search } from '@orama/orama'
import { ollama } from "./OllamaService";

const STORAGE_KEY = 'orama_vector_embeddings';

export class VectorService {
  constructor(db) {
    this.db = db;
    this.embeddings = []; // Store embeddings for persistence
  }

  static async init() {
    const schema = {
      text: 'string',
      page: 'number',
      source: 'string', // PDF URL or identifier to separate embeddings by source
      embedding: 'vector[1024]',
    };

    const db = await create({ schema });
    const service = new VectorService(db);
    
    // Restore embeddings from localStorage
    await service.restore();
    
    return service;
  }

  async restore() {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const embeddings = JSON.parse(savedData);
        this.embeddings = embeddings;
        
        // Rebuild database from saved embeddings
        for (const item of embeddings) {
          await insert(this.db, {
            text: item.text,
            page: item.page || 0,
            source: item.source || '',
            embedding: item.embedding,
          });
        }
        console.log(`Restored ${embeddings.length} embeddings from localStorage`);
      } else {
        console.log('No saved embeddings found, starting fresh');
      }
    } catch (error) {
      console.error('Error restoring embeddings:', error);
      this.embeddings = [];
    }
  }

  async save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.embeddings));
      console.log(`Saved ${this.embeddings.length} embeddings to localStorage`);
    } catch (error) {
      console.error('Error saving embeddings:', error);
      if (error.name === 'QuotaExceededError') {
        console.warn('LocalStorage is full. Consider clearing old data.');
      }
    }
  }

  async embedAndSave(text, page = 0, source = '') {
    const embedding = await ollama.getEmbedding(text);
    const result = await insert(this.db, { 
      text, 
      page, 
      source,
      embedding: embedding 
    });
    
    this.embeddings.push({
      text,
      page,
      source,
      embedding: embedding,
    });
    
    await this.save();
    return result;
  }

  async search(queryText, limit = 5, source = null) {
    try {
      const queryVector = await ollama.getEmbedding(queryText);
      
      const searchQuery = {
        mode: 'vector',
        vector: {
          value: queryVector,
          property: 'embedding',
        },
        limit: limit,
      };

      if (source) {
        searchQuery.where = {
          source: { eq: source }
        };
      }
      
      const results = await search(this.db, searchQuery);

      if (results && results.hits && results.hits.length > 0) {
        return results.hits.map(hit => ({
          text: hit.document?.text || '',
          page: hit.document?.page || 0,
          source: hit.document?.source || '',
          score: hit.score || 0,
        }));
      }
      
      // Fallback: try text search
      const textSearchQuery = {
        term: queryText,
        limit: limit,
      };
      
      if (source) {
        textSearchQuery.where = {
          source: { eq: source }
        };
      }
      
      const textResults = await search(this.db, textSearchQuery);
      
      if (textResults && textResults.hits && textResults.hits.length > 0) {
        return textResults.hits.map(hit => ({
          text: hit.document?.text || '',
          page: hit.document?.page || 0,
          source: hit.document?.source || '',
          score: hit.score || 0,
        }));
      }
      
      return [];
    } catch (error) {
      console.error("Vector search error:", error);
      return [];
    }
  }

  async isSourceEmbedded(sourceUrl) {
    try {
      if (!sourceUrl) return false;
      return this.embeddings.some(item => item.source === sourceUrl);
    } catch (error) {
      console.error('Error checking if source is embedded:', error);
      return false;
    }
  }

  async deleteSource(sourceUrl) {
    try {
      if (!sourceUrl) return;
      this.embeddings = this.embeddings.filter(item => item.source !== sourceUrl);
      
      const schema = {
        text: 'string',
        page: 'number',
        source: 'string',
        embedding: 'vector[1024]',
      };
      
      this.db = await create({ schema });
      
      for (const item of this.embeddings) {
        await insert(this.db, {
          text: item.text,
          page: item.page || 0,
          source: item.source || '',
          embedding: item.embedding,
        });
      }
      
      await this.save();
      console.log(`Deleted all embeddings for source: ${sourceUrl}`);
    } catch (error) {
      console.error('Error deleting source embeddings:', error);
    }
  }

  getSources() {
    const sources = new Set();
    this.embeddings.forEach(item => {
      if (item.source) {
        sources.add(item.source);
      }
    });
    return Array.from(sources);
  }
}
