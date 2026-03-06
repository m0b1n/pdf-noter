from pydantic import BaseModel, Field


class HighlightCreate(BaseModel):
    page: int = Field(..., ge=1)
    selectedText: str = Field(..., min_length=1, max_length=2000)


class HighlightResponse(BaseModel):
    id: str
    documentId: str
    page: int
    selectedText: str
    meaning: str | None = None
    synonyms: list[str] = []
    persianMeaning: str | None = None
    exampleEn: str | None = None
    comment: str | None = None
    status: str

    class Config:
        from_attributes = True