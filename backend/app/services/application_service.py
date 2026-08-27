from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.application import Application, ApplicationStatusEvent
from app.schemas.application import ApplicationCreate, ApplicationUpdate


def _with_history(stmt):
    return stmt.options(selectinload(Application.status_history))


def list_applications(db: Session, user_id: int) -> list[Application]:
    return list(
        db.scalars(
            _with_history(
                select(Application)
                .where(Application.user_id == user_id)
                .order_by(Application.created_at.desc())
            )
        )
    )


def get_application(db: Session, user_id: int, application_id: int) -> Application | None:
    return db.scalar(
        _with_history(
            select(Application).where(
                Application.id == application_id, Application.user_id == user_id
            )
        )
    )


def create_application(db: Session, user_id: int, data: ApplicationCreate) -> Application:
    application = Application(user_id=user_id, **data.model_dump())
    db.add(application)
    db.flush()
    db.add(
        ApplicationStatusEvent(
            application_id=application.id, user_id=user_id, status=application.status
        )
    )
    db.commit()
    db.refresh(application)
    return application


def update_application(
    db: Session, application: Application, data: ApplicationUpdate
) -> Application:
    changes = data.model_dump(exclude_unset=True)
    status_changed = "status" in changes and changes["status"] != application.status

    for field, value in changes.items():
        setattr(application, field, value)

    if status_changed:
        db.add(
            ApplicationStatusEvent(
                application_id=application.id,
                user_id=application.user_id,
                status=application.status,
            )
        )

    db.commit()
    db.refresh(application)
    return application


def delete_application(db: Session, application: Application) -> None:
    db.delete(application)
    db.commit()
