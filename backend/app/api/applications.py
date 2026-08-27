from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.application import ApplicationCreate, ApplicationRead, ApplicationUpdate
from app.services import application_service

router = APIRouter(prefix="/applications", tags=["applications"])


def _get_application_or_404(db: Session, application_id: int):
    application = application_service.get_application(db, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return application


@router.get("", response_model=list[ApplicationRead])
def get_applications(db: Session = Depends(get_db)):
    return application_service.list_applications(db)


@router.post("", response_model=ApplicationRead, status_code=201)
def create_application(application: ApplicationCreate, db: Session = Depends(get_db)):
    return application_service.create_application(db, application)


@router.get("/{application_id}", response_model=ApplicationRead)
def get_application(application_id: int, db: Session = Depends(get_db)):
    return _get_application_or_404(db, application_id)


@router.patch("/{application_id}", response_model=ApplicationRead)
def update_application(
    application_id: int, application: ApplicationUpdate, db: Session = Depends(get_db)
):
    existing = _get_application_or_404(db, application_id)
    return application_service.update_application(db, existing, application)


@router.delete("/{application_id}", status_code=204)
def delete_application(application_id: int, db: Session = Depends(get_db)):
    existing = _get_application_or_404(db, application_id)
    application_service.delete_application(db, existing)
