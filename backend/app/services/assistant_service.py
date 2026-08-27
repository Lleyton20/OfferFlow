from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.chat import ChatMessage
from app.services import application_service, contact_service, interview_service, resume_service

MAX_HISTORY = 20  # messages sent to Claude per turn — enough context, bounded cost

CLOSED_APPLICATION_STATUSES = {"Offer", "Rejected"}


def list_messages(db: Session, user_id: int) -> list[ChatMessage]:
    return list(
        db.scalars(
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id)
            .order_by(ChatMessage.created_at)
        )
    )


def add_message(db: Session, user_id: int, role: str, content: str) -> ChatMessage:
    message = ChatMessage(user_id=user_id, role=role, content=content)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def clear_messages(db: Session, user_id: int) -> None:
    for message in list_messages(db, user_id):
        db.delete(message)
    db.commit()


def build_context_summary(db: Session, user_id: int) -> str:
    """A compact, factual snapshot of the user's real data, injected into the
    assistant's system prompt so its advice is about *this* job search, not
    generic career coaching."""
    applications = application_service.list_applications(db, user_id)
    resumes = resume_service.list_resumes(db, user_id)
    contacts = contact_service.list_contacts(db, user_id)
    interviews = interview_service.list_sessions(db, user_id)

    lines = []

    if applications:
        active = [a for a in applications if a.status not in CLOSED_APPLICATION_STATUSES]
        offers = [a for a in applications if a.status == "Offer"]
        lines.append(
            f"Applications: {len(applications)} total, {len(active)} active, "
            f"{len(offers)} offer(s)."
        )
        for a in applications[:15]:
            lines.append(f"  - {a.company} ({a.role}): {a.status}, applied {a.date_applied}")
    else:
        lines.append("Applications: none logged yet.")

    if resumes:
        latest = max(resumes, key=lambda r: r.created_at)
        lines.append(f"Resumes: {len(resumes)} uploaded, latest ATS score {latest.ats_score}/100.")
    else:
        lines.append("Resumes: none uploaded yet.")

    if contacts:
        today = datetime.now(timezone.utc).date().isoformat()
        overdue = [c for c in contacts if c.follow_up_date and c.follow_up_date < today]
        lines.append(f"Contacts: {len(contacts)} total, {len(overdue)} with an overdue follow-up.")
        for c in overdue[:10]:
            lines.append(f"  - Overdue follow-up: {c.name} ({c.relationship_type})")
    else:
        lines.append("Contacts: none logged yet.")

    if interviews:
        upcoming = [i for i in interviews if i.status == "Scheduled"]
        lines.append(f"Interview prep: {len(interviews)} session(s), {len(upcoming)} upcoming.")
    else:
        lines.append("Interview prep: no sessions yet.")

    return "\n".join(lines)
