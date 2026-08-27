from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.interview import (
    InterviewSessionCreate,
    InterviewSessionRead,
    InterviewSessionUpdate,
)
from app.services import application_service, interview_ai_service, interview_service

router = APIRouter(prefix="/interviews", tags=["interviews"])


def _get_session_or_404(db: Session, user_id: int, session_id: int):
    session = interview_service.get_session(db, user_id, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session


def _validate_application_id(db: Session, user_id: int, application_id: int | None) -> None:
    if application_id is not None and application_service.get_application(
        db, user_id, application_id
    ) is None:
        raise HTTPException(status_code=400, detail="Application not found")


@router.get("", response_model=list[InterviewSessionRead])
def get_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return interview_service.list_sessions(db, current_user.id)


@router.post("", response_model=InterviewSessionRead, status_code=201)
def create_session(
    session: InterviewSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_application_id(db, current_user.id, session.application_id)
    return interview_service.create_session(db, current_user.id, session)


@router.get("/{session_id}", response_model=InterviewSessionRead)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_session_or_404(db, current_user.id, session_id)


@router.patch("/{session_id}", response_model=InterviewSessionRead)
def update_session(
    session_id: int,
    session: InterviewSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = _get_session_or_404(db, current_user.id, session_id)
    _validate_application_id(db, current_user.id, session.application_id)
    return interview_service.update_session(db, existing, session)


@router.delete("/{session_id}", status_code=204)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = _get_session_or_404(db, current_user.id, session_id)
    interview_service.delete_session(db, existing)


@router.post("/{session_id}/generate-questions", response_model=InterviewSessionRead)
def generate_questions(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_session_or_404(db, current_user.id, session_id)

    role = session.title
    company = None
    job_description = None
    if session.application_id is not None:
        application = application_service.get_application(
            db, current_user.id, session.application_id
        )
        if application is not None:
            role = application.role
            company = application.company
            job_description = application.job_description

    question_set, status = interview_ai_service.generate_mock_questions(
        role=role,
        company=company,
        interview_type=session.interview_type,
        job_description=job_description,
    )
    return interview_service.save_mock_questions(db, session, question_set, status)
