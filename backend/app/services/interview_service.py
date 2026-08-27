from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.interview import InterviewSession
from app.schemas.interview import InterviewSessionCreate, InterviewSessionUpdate, MockQuestionSet


def list_sessions(db: Session, user_id: int) -> list[InterviewSession]:
    return list(
        db.scalars(
            select(InterviewSession)
            .where(InterviewSession.user_id == user_id)
            .order_by(InterviewSession.created_at.desc())
        )
    )


def get_session(db: Session, user_id: int, session_id: int) -> InterviewSession | None:
    return db.scalar(
        select(InterviewSession).where(
            InterviewSession.id == session_id, InterviewSession.user_id == user_id
        )
    )


def create_session(db: Session, user_id: int, data: InterviewSessionCreate) -> InterviewSession:
    session = InterviewSession(user_id=user_id, **data.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def update_session(
    db: Session, session: InterviewSession, data: InterviewSessionUpdate
) -> InterviewSession:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(session, field, value)
    db.commit()
    db.refresh(session)
    return session


def delete_session(db: Session, session: InterviewSession) -> None:
    db.delete(session)
    db.commit()


def save_mock_questions(
    db: Session, session: InterviewSession, question_set: MockQuestionSet | None, status: str
) -> InterviewSession:
    if question_set is not None:
        session.mock_questions = [q.model_dump() for q in question_set.questions]
    session.ai_feedback_status = status
    db.commit()
    db.refresh(session)
    return session
