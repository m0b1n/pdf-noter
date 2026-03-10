# AI PDF Reader & Annotator

An AI-powered PDF reading and annotation platform that allows users to read PDFs, create highlights, attach notes, and use Large Language Models (LLMs) for contextual assistance such as translation and summarization.

The application is built with a React frontend, FastAPI backend, Ollama for local LLM inference, and Docker for containerized deployment.

------------------------

# Features

## PDF Management
- Automatically loads PDFs from a designated folder

- Serves PDFs through the backend

- Tracks document usage

## Highlighting & Notes
- Highlight text within PDFs

- Attach comments to highlights

- Store highlights persistently in the database

## AI Integration
- LLM-powered translation

- Future support for summarization

- Context extraction from highlighted text

# System Architecture

```
Browser
   │
   ▼
Frontend (React + Nginx)
   │
   └── /api requests
           │
           ▼
Backend (FastAPI)
   │
   ├── SQLite Database
   │
   ├── PDF Storage
   │
   └── Ollama LLM Server
```

The frontend communicates with the backend via /api endpoints.
Nginx acts as a reverse proxy to forward API calls to the backend container.
--------------------

# Tech Stack

Frontend
- React
- react-pdf-highlighter
- Nginx

Backend
- FastAPI
- SQLAlchemy
- Pydantic

AI / LLM
- Ollama
- Qwen2.5 7B model

Infrastructure
- Docker
- Docker Compose

Database
- SQLite

# Project Structure

```
pdf_noter/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── router.py
│   │   ├── document.py
│   │   └── session.py
│   │
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
│
├── pdfs/
│   └── (place PDF files here)
│
├── docker-compose.yml
│
└── README.md
```

----
# Prerequisites

Install the following tools:

Docker
https://www.docker.com/

# Running the Project (Docker)
From the project root:

```
docker compose up --build
```
This will start:

- frontend container
- backend container
- Ollama container
- model initialization container

# Access the Application

Run: 
> http://localhost:3000

# Adding PDFs
Place PDF files inside:
> ./pdfs

Example:
```
pdfs/
   research_paper.pdf
   ai_notes.pdf
```
The backend automatically scans this directory and registers new PDFs.

Refresh the frontend to see them.

# Development Mode (Without Docker)

Backend
```
cd backend
uvicorn app.main:app --reload
```

Frontend
```
cd frontend
npm install
npm start
```

# Troubleshooting

## Docker Rebuild
If containers behave unexpectedly:
```
docker compose down
docker compose up --build
```