from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.api.routes.documents import get_db, pdf_path_for
from app.models.document import Document
from app.models.highlight import Highlight
from app.schemas.highlight import HighlightCreate, HighlightResponse
from app.services.llm_service import call_llm, format_comment

router = APIRouter()

@router.get("/documents/{doc_id}/highlights")
def get_document_highlights(doc_id: str, db: Session = Depends(get_db)):
    _ = pdf_path_for(doc_id)

    rows = (
        db.query(Highlight)
        .filter(Highlight.document_id == doc_id)
        .order_by(Highlight.created_at.desc())
        .all()
    )

    return [
        {
            "id": h.id,
            "documentId": h.document_id,
            "content": h.content,
            "position": h.position,
            "comment": h.comment,
            "aiData": h.ai_data,
            "createdAt": h.created_at.isoformat(),
        }
        for h in rows
    ]

@router.post("/documents/{doc_id}/highlights")
def create_highlight(
    doc_id: str,
    payload: HighlightCreate,
    db: Session = Depends(get_db),
):
    # Validate PDF exists on disk
    _ = pdf_path_for(doc_id)

    # Ensure document exists
    doc = db.get(Document, doc_id)
    if doc is None:
        doc = Document(id=doc_id, title=doc_id)
        db.add(doc)
        db.flush()

    selected_text = (payload.content or {}).get("text", "").strip()
    if not selected_text:
        raise HTTPException(status_code=400, detail="Selected text cannot be empty")

    try:
        llm_data = call_llm(selected_text)

        ai_data = {
            "meaning": llm_data.get("meaning", ""),
            "synonyms": llm_data.get("synonyms", []),
            "persianMeaning": llm_data.get("persian_meaning", ""),
            "exampleEn": llm_data.get("example_en", ""),
        }

        generated_comment = format_comment(llm_data)

        user_note = (payload.noteText or "").strip()
        if user_note and generated_comment:
            comment_text = f"{user_note}\n\n{generated_comment}"
        elif user_note:
            comment_text = user_note
        else:
            comment_text = generated_comment or ""

        comment = {
            "text": comment_text,
            "color": payload.color,
            "style": payload.style or "highlight",
        }

        status = "done"

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"LLM processing failed: {exc}") from exc

    highlight = Highlight(
        id=str(uuid.uuid4()),
        document_id=doc_id,
        content=payload.content,
        position=payload.position,
        comment=comment,
        ai_data=ai_data,
        status=status,
    )

    db.add(highlight)
    db.commit()
    db.refresh(highlight)

    return {
        "id": highlight.id,
        "backendId": highlight.id,
        "content": highlight.content,
        "position": highlight.position,
        "comment": highlight.comment,
        "aiData": highlight.ai_data,
        "status": highlight.status,
        "createdAt": highlight.created_at.isoformat(),
    }

@router.delete("/documents/{doc_id}/highlights/{highlight_id}")
def delete_document_highlight(
    doc_id: str,
    highlight_id: str,
    db: Session = Depends(get_db),
):
    _ = pdf_path_for(doc_id)

    row = (
        db.query(Highlight)
        .filter(
            Highlight.id == highlight_id,
            Highlight.document_id == doc_id,
        )
        .first()
    )

    if row is None:
        raise HTTPException(status_code=404, detail="Highlight not found")

    db.delete(row)
    db.commit()
    return {"ok": True, "id": highlight_id}