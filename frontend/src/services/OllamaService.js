/**
 * A dedicated service to handle all Ollama API interactions.
 * Ensure Ollama is running with: OLLAMA_ORIGINS="*" ollama serve
 */
class OllamaService {
  constructor(baseUrl = null) {
    this.baseUrl = baseUrl || process.env.REACT_APP_OLLAMA_BASE_URL || "http://localhost:11434";
  }

  /**
   * Method 1: Summarize specific page content
   * Uses a targeted system prompt for PDF context.
   */
  async summarizePage(text, pageNumber) {
    const prompt = `
      You are a professional assistant. 
      Summarize the following text from page ${pageNumber} of a PDF document.
      Focus on key concepts and actionable information. 
      Format as 3-4 bullet points.
      
      TEXT TO SUMMARIZE:
      "${text}"
    `;

    return this.generateResponse("llama3.2:latest", prompt);
  }

  /**
   * Method 2: Generate Vector Embeddings
   * Used for saving text into EntityDB or Voy.
   */
  async getEmbedding(text, model = "mxbai-embed-large") {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: "POST",
        body: JSON.stringify({ model, prompt: text }),
      });
      const data = await response.json();
      return data.embedding; // Returns the raw [0.1, 0.2, ...] array
    } catch (error) {
      console.error("Embedding Error:", error);
      throw error;
    }
  }

  /**
   * Method 3: Answer questions about PDF content
   * Uses context from vector search to answer questions.
   */
  async answerQuestion(question, context = null) {
    let prompt;

    if (context && context.length > 0) {
      // Build context string from search results
      const contextText = context
        .map((result) => {
          if (typeof result === 'string') return result;
          if (result.text) {
            const pageInfo = result.page ? ` (Page ${result.page})` : '';
            return `[${result.text}${pageInfo}]`;
          }
          if (result.document && result.document.text) {
            return result.document.text;
          }
          return JSON.stringify(result);
        })
        .filter(Boolean)
        .join("\n\n");

      prompt = `You are a helpful assistant answering questions about a PDF document. 
Use the following context from the document to answer the question. If the context doesn't contain enough information, say so.

Context from the document:
${contextText}

Question: ${question}

Answer:`;
    } else {
      prompt = `You are a helpful assistant answering questions about a PDF document. 
The user asked: "${question}"

Note: I couldn't find relevant context in the document. Please provide a helpful response based on general knowledge, or let the user know that the document may need to be processed/embedded first.

Answer:`;
    }

    return this.generateResponse("llama3.2:latest", prompt);
  }

  /**
   * Method 4: General Chat/Generation
   * The core engine for all text-based requests.
   */
  async generateResponse(model, prompt, stream = false) {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, stream }),
      });

      if (!response.ok) throw new Error("Ollama connection failed");

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Ollama API Error:", error);
      return "I couldn't reach your local Ollama instance. Is it running?";
    }
  }
}

export const ollama = new OllamaService();

