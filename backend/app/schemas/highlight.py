from pydantic import BaseModel, Field
from typing import Any


class HighlightCreate(BaseModel):
    id: str
    content: dict[str, Any]
    position: dict[str, Any]
    noteText: str | None = ""
    color: str | None = None
    style: str | None = "highlight"


class HighlightResponse(BaseModel):
    id: str
    content: dict[str, Any]
    position: dict[str, Any]
    comment: dict[str, Any] | None = None
    aiData: dict[str, Any] | None = None
    createdAt: str | None = None