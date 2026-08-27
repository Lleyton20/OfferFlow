from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.application import Application
from app.schemas.application import ApplicationCreate, ApplicationUpdate


def list_applications(db: Session, user_id: int) -> list[Application]:
    return list(
        db.scalars(
            select(Application)
            .where(Application.user_id == user_id)
            .order_by(Application.created_at.desc())
        )
    )


def get_application(db: Session, user_id: int, application_id: int) -> Application | None:
    return db.scalar(
        select(Application).where(
            Application.id == application_id, Application.user_id == user_id
        )
    )


def create_application(db: Session, user_id: int, data: ApplicationCreate) -> Application:
    application = Application(user_id=user_id, **data.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def update_application(
    db: Session, application: Application, data: ApplicationUpdate
) -> Application:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(application, field, value)
    db.commit()
    db.refresh(application)
    return application


def delete_application(db: Session, application: Application) -> None:
    db.delete(application)
    db.commit()
