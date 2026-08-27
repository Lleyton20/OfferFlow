from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationRead, ApplicationUpdate
from app.services import application_service

router = APIRouter(prefix="/applications", tags=["applications"])


def _get_application_or_404(db: Session, user_id: int, application_id: int):
    application = application_service.get_application(db, user_id, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return application


@router.get("", response_model=list[ApplicationRead])
def get_applications(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return application_service.list_applications(db, current_user.id)


@router.post("", response_model=ApplicationRead, status_code=201)
def create_application(
    application: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return application_service.create_application(db, current_user.id, application)


@router.get("/{application_id}", response_model=ApplicationRead)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_application_or_404(db, current_user.id, application_id)


@router.patch("/{application_id}", response_model=ApplicationRead)
def update_application(
    application_id: int,
    application: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = _get_application_or_404(db, current_user.id, application_id)
    return application_service.update_application(db, existing, application)


@router.delete("/{application_id}", status_code=204)
def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = _get_application_or_404(db, current_user.id, application_id)
    application_service.delete_application(db, existing)
