# PDF Noter

A modern, intelligent PDF annotation and summarization tool built with React. This application allows you to read PDFs, highlight text, and leverage AI-powered summaries using Ollama to extract key insights from your documents.

## Project Overview

**PDF Noter** is a web-based PDF reader with advanced features including:
- **PDF Viewing & Highlighting**: Interactive PDF viewer with text highlighting capabilities
- **AI-Powered Summarization**: Automatic summarization of selected text and pages using Ollama LLM
- **Local PDF Library**: Browse and manage PDFs from your local collection
- **Vector Embeddings**: Generate and store text embeddings for semantic search and analysis
- **Data Persistence**: All highlights and summaries are saved to localStorage for offline access
- **Semantic Search**: Search through PDFs using vector similarity

## Dependencies Installation

Before running the project, ensure you have the following prerequisites installed:

### System Requirements
- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **Ollama** - for local AI model execution

### Install Node Dependencies

Run the following command in the project directory:

```bash
npm install
```

This will install all required packages including:
- React & React DOM for the UI
- `react-pdf-highlighter` for PDF highlighting functionality
- `pdfjs-dist` for PDF rendering
- `@langchain/*` packages for AI/LLM integration
- `@orama/orama` for full-text search capabilities
- `voy-search` for vector similarity search
- And other dependencies listed in `package.json`

### Setup Ollama

Ollama is required for AI-powered text summarization. Follow these steps:

1. **Install Ollama** from [https://ollama.ai](https://ollama.ai)
2. **Start Ollama with CORS enabled**:
   ```bash
   OLLAMA_ORIGINS="*" ollama serve
   ```
   This command allows the React app to communicate with the Ollama API.
3. **Pull the required models** (in another terminal):
   ```bash
   ollama pull llama3.2:latest
   ollama pull mxbai-embed-large
   ```

## Execution Steps

### Development Mode

Start the development server:

```bash
npm start
```

The app will open automatically at [http://localhost:3000](http://localhost:3000).

**Features:**
- The page automatically reloads when you make changes
- Any lint errors appear in the browser console

### Production Build

Build the app for production:

```bash
npm run build
```

This creates an optimized production build in the `build/` folder with:
- Minified JavaScript
- Hashed filenames for caching
- Optimized bundle size

The app is ready for deployment after this step.

### Running Tests

Launch the test runner in watch mode:

```bash
npm test
```

See the [Create React App testing documentation](https://facebook.github.io/create-react-app/docs/running-tests) for more details.

## Project Structure

```
pdf-noter/
├── public/              # Static assets and HTML template
│   ├── index.html       # Main HTML file
│   ├── manifest.json    # PWA manifest
│   └── pdfs/            # Local PDF files directory
├── src/
│   ├── App.js           # Main application component
│   ├── App.css          # Application styles
│   ├── PdfLibrary.jsx   # PDF selection interface
│   ├── PdfHighlighterViewer.jsx  # PDF viewer with highlighting
│   ├── OllamaService.js # Ollama API integration
│   ├── VectorService.js # Vector embedding service
│   ├── Modal.jsx        # Modal component for summaries
│   └── index.js         # React entry point
└── package.json         # Project dependencies and scripts
```

## Usage

1. **Select a PDF**: Choose from your local PDF library
2. **Read & Highlight**: Open the PDF viewer and select text to highlight
3. **Summarize**: Request AI summaries of highlighted text or entire pages
4. **View Results**: Summaries appear in a modal with formatted bullet points
5. **Persistence**: All highlights and summaries are automatically saved

## Technology Stack

- **Frontend**: React 18.3, React PDF Highlighter
- **AI/LLM**: Ollama, LangChain
- **Search**: Orama, Voy
- **Data Storage**: LocalStorage, EntityDB
- **Utilities**: Chroma.js for color manipulation

## Notes

- Ensure Ollama is running before starting the app for summarization features
- PDFs should be placed in the `public/pdfs/` directory
- All data is stored locally in the browser (localStorage)
- The app works offline after initial load (except for AI summarization features)