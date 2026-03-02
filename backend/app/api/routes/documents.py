from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
from datetime import datetime

from app.core.config import settings
from app.db.session import SessionLocal, engine, Base
from app.models.document import Document

router = APIRouter()

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def pdf_path_for(doc_id: str) -> Path:
    p = Path(settings.pdf_dir) / doc_id
    if not p.exists() or not p.is_file():
        raise HTTPException(status_code=404, detail="PDF not found")
    if p.suffix.lower() != ".pdf":
        raise HTTPException(status_code=400, detail="Not a PDF")
    return p

@router.get("/documents")
def list_documents(db: Session = Depends(get_db)):
    pdf_dir = Path(settings.pdf_dir)
    pdf_dir.mkdir(parents=True, exist_ok=True)

    files = sorted([p.name for p in pdf_dir.glob("*.pdf")])
    # ensure DB rows exist (lightweight upsert behavior)
    for name in files:
        if db.get(Document, name) is None:
            db.add(Document(id=name, title=name))
    db.commit()

    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    return [{"id": d.id, "title": d.title, "lastOpenedAt": d.last_opened_at} for d in docs]

@router.get("/documents/{doc_id}/file")
def get_document_file(doc_id: str):
    p = pdf_path_for(doc_id)
    return FileResponse(path=str(p), media_type="application/pdf", filename=p.name)

@router.post("/documents/{doc_id}/open")
def mark_open(doc_id: str, db: Session = Depends(get_db)):
    # validate file exists
    _ = pdf_path_for(doc_id)

    doc = db.get(Document, doc_id)
    if doc is None:
        doc = Document(id=doc_id, title=doc_id)
        db.add(doc)

    doc.last_opened_at = datetime.utcnow()
    db.commit()
    return {"ok": True, "docId": doc_id}