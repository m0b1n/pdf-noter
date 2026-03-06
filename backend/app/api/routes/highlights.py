from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.routes.documents import get_db, pdf_path_for
from app.models.document import Document
from app.models.highlight import Highlight
from app.schemas.highlight import HighlightCreate, HighlightResponse
from app.services.llm_service import call_llm, format_comment

router = APIRouter()


@router.post("/documents/{doc_id}/highlights", response_model=HighlightResponse)
def create_highlight(
    doc_id: str,
    payload: HighlightCreate,
    db: Session = Depends(get_db),
):
    # Validate PDF exists on disk
    _ = pdf_path_for(doc_id)

    # Validate document row exists
    doc = db.get(Document, doc_id)
    if doc is None:
        doc = Document(id=doc_id, title=doc_id)
        db.add(doc)
        db.commit()
        db.refresh(doc)

    selected_text = payload.selectedText.strip()
    if not selected_text:
        raise HTTPException(status_code=400, detail="selectedText cannot be empty")

    try:
        llm_data = call_llm(selected_text)
        comment = format_comment(llm_data)
        status = "done"
    except Exception as exc:
        llm_data = {
            "meaning": "",
            "synonyms": [],
            "persian_meaning": "",
            "example_en": "",
        }
        comment = None
        status = "failed"
        # For MVP, expose a simple error
        raise HTTPException(status_code=500, detail=f"LLM processing failed: {exc}") from exc

    highlight = Highlight(
        document_id=doc_id,
        page=payload.page,
        selected_text=selected_text,
        meaning=llm_data["meaning"],
        synonyms=", ".join(llm_data["synonyms"]),
        persian_meaning=llm_data["persian_meaning"],
        example_en=llm_data["example_en"],
        comment=comment,
        status=status,
    )

    db.add(highlight)
    db.commit()
    db.refresh(highlight)

    return HighlightResponse(
        id=highlight.id,
        documentId=doc_id,
        page=highlight.page,
        selectedText=highlight.selected_text,
        meaning=highlight.meaning,
        synonyms=llm_data["synonyms"],
        persianMeaning=highlight.persian_meaning,
        exampleEn=highlight.example_en,
        comment=highlight.comment,
        status=highlight.status,
    )