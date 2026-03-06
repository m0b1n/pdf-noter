from datetime import datetime
import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Highlight(Base):
    __tablename__ = "highlights"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    document_id: Mapped[str] = mapped_column(
        ForeignKey("documents.id"),
        index=True,
        nullable=False,
    )
    page: Mapped[int] = mapped_column(Integer, nullable=False)
    selected_text: Mapped[str] = mapped_column(Text, nullable=False)

    meaning: Mapped[str | None] = mapped_column(Text, nullable=True)
    synonyms: Mapped[str | None] = mapped_column(Text, nullable=True)  # CSV for MVP
    persian_meaning: Mapped[str | None] = mapped_column(Text, nullable=True)
    example_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(String, default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)