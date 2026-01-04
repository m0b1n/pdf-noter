# PDF Noter

A modern, intelligent PDF annotation tool built with React and powered by local AI.

## ✨ Features
- **Local PDF Library**: Browse and manage documents locally.
- **Smart Highlighting**: Interactive viewer for text and area highlights.
- **AI Assistant**: Chat with your PDFs and get page-level summaries.
- **Vector Search**: Semantic search powered by Orama and Ollama embeddings.
- **Privacy First**: Everything runs locally. No data leaves your machine.

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18+)
- **Ollama**: [Download here](https://ollama.ai)

### 2. Setup Ollama
```bash
# Start Ollama with CORS enabled
OLLAMA_ORIGINS="*" ollama serve

# Pull required models
ollama pull llama3.2:latest
ollama pull mxbai-embed-large
```

### 3. Install & Run
```bash
npm install
npm start
```

## 📂 Project Structure
- `src/components`: UI components (PDF viewer, Chat, Library).
- `src/services`: Business logic (Ollama & Vector services).
- `src/hooks`: Reusable React hooks.
- `src/AppContext.jsx`: Global service state.
- `public/pdfs`: Place your PDF files here and update `index.json`.

## 🛠 Tech Stack
- **Frontend**: React, React PDF Highlighter
- **AI**: Ollama (Llama 3.2)
- **Database**: Orama (Vector Search)
- **Persistence**: LocalStorage
