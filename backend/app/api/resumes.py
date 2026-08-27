from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.resume import ResumeRead, TailorRequest, TailorResponse
from app.services import ai_feedback_service, resume_service

router = APIRouter(prefix="/resumes", tags=["resumes"])


def _get_resume_or_404(db: Session, user_id: int, resume_id: int):
    resume = resume_service.get_resume(db, user_id, resume_id)
    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.get("", response_model=list[ResumeRead])
def list_resumes(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return resume_service.list_resumes(db, current_user.id)


@router.post("", response_model=ResumeRead, status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    job_description: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in resume_service.ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Upload a PDF or plain text resume.",
        )

    content = await file.read()
    if len(content) > resume_service.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 5MB).")

    extracted_text = resume_service.extract_text(content, file.content_type)
    if not extracted_text.strip():
        raise HTTPException(
            status_code=400, detail="Couldn't extract any text from this file."
        )

    ats_score, ats_checks, matched_keywords, missing_keywords = resume_service.score_resume(
        extracted_text, job_description
    )
    ai_feedback, ai_feedback_status = ai_feedback_service.get_ai_feedback(
        extracted_text, job_description
    )

    storage_path = resume_service.save_upload(current_user.id, file.filename, content)

    return resume_service.create_resume(
        db,
        user_id=current_user.id,
        filename=file.filename,
        content_type=file.content_type,
        storage_path=storage_path,
        extracted_text=extracted_text,
        job_description=job_description,
        ats_score=ats_score,
        ats_checks=ats_checks,
        matched_keywords=matched_keywords,
        missing_keywords=missing_keywords,
        ai_feedback=ai_feedback.model_dump() if ai_feedback else None,
        ai_feedback_status=ai_feedback_status,
    )


@router.get("/{resume_id}", response_model=ResumeRead)
def get_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_resume_or_404(db, current_user.id, resume_id)


@router.delete("/{resume_id}", status_code=204)
def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = _get_resume_or_404(db, current_user.id, resume_id)
    resume_service.delete_resume(db, resume)


@router.post("/{resume_id}/tailor", response_model=TailorResponse)
def tailor_resume(
    resume_id: int,
    data: TailorRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = _get_resume_or_404(db, current_user.id, resume_id)
    suggestions, status = ai_feedback_service.get_tailoring_suggestions(
        resume.extracted_text, data.job_description
    )
    return TailorResponse(suggestions=suggestions, status=status)
