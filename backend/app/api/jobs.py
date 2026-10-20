from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.job import DiscoveryStats, JobPostingRead, RecommendationRead
from app.services import job_service

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/recommendations", response_model=list[RecommendationRead])
def recommendations(
    job_type: Literal["internship", "new_grad", "fellowship"] | None = Query(default=None),
    limit: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return job_service.recommend(db, current_user, job_type=job_type, limit=limit)


@router.get("/saved", response_model=list[JobPostingRead])
def saved_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [interaction.job for interaction in job_service.list_saved(db, current_user.id)]


@router.get("/stats", response_model=DiscoveryStats)
def stats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return job_service.discovery_stats(db)


def _set_state(db: Session, user: User, job_id: int, state: str | None) -> None:
    if not job_service.set_interaction(db, user.id, job_id, state):
        raise HTTPException(status_code=404, detail="Job not found")


@router.post("/{job_id}/save", status_code=204)
def save_job(job_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _set_state(db, user, job_id, "saved")


@router.post("/{job_id}/dismiss", status_code=204)
def dismiss_job(job_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _set_state(db, user, job_id, "dismissed")


@router.delete("/{job_id}/interaction", status_code=204)
def clear_interaction(
    job_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    _set_state(db, user, job_id, None)
