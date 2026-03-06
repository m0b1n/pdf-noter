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

    # 1) Scan disk once
    files = sorted(p.name for p in pdf_dir.glob("*.pdf"))
    disk_ids = set(files)

    # 2) Fetch DB ids once
    db_ids = {doc_id for (doc_id,) in db.query(Document.id).all()}

    # 3) Upsert missing rows in bulk-ish
    to_add = disk_ids - db_ids
    if to_add:
        db.add_all(Document(id=name, title=name) for name in to_add)

    # 4) Delete DB rows whose files no longer exist
    to_delete = db_ids - disk_ids
    if to_delete:
        (
            db.query(Document)
            .filter(Document.id.in_(to_delete))
            .delete(synchronize_session=False)
        )

    # Commit once for both add/delete (no-op if nothing changed)
    if to_add or to_delete:
        db.commit()

    # 5) Return only docs that exist on disk
    if not disk_ids:
        return []

    docs = (
        db.query(Document)
        .filter(Document.id.in_(disk_ids))
        .order_by(Document.last_opened_at.desc().nullslast())
        .all()
    )

    return [
        {"id": d.id, "title": d.title, "lastOpenedAt": d.last_opened_at}
        for d in docs
    ]

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