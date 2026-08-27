from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    filename: Mapped[str] = mapped_column(String, nullable=False)
    content_type: Mapped[str] = mapped_column(String, nullable=False)
    storage_path: Mapped[str] = mapped_column(String, nullable=False)
    extracted_text: Mapped[str] = mapped_column(String, nullable=False)
    job_description: Mapped[str | None] = mapped_column(String, nullable=True)
    ats_score: Mapped[int] = mapped_column(Integer, nullable=False)
    ats_checks: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    matched_keywords: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    missing_keywords: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    ai_feedback: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ai_feedback_status: Mapped[str] = mapped_column(String, nullable=False, default="not_configured")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
