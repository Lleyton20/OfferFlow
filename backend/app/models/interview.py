from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    application_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("applications.id"), nullable=True
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    interview_type: Mapped[str] = mapped_column(String, nullable=False, default="Behavioral")
    scheduled_date: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="Scheduled")
    prep_notes: Mapped[str | None] = mapped_column(String, nullable=True)
    performance_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    performance_notes: Mapped[str | None] = mapped_column(String, nullable=True)
    mock_questions: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    ai_feedback_status: Mapped[str] = mapped_column(
        String, nullable=False, default="not_configured"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )
