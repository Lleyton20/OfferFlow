from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.application import ApplicationRead
from app.schemas.capture import CaptureRequest, CaptureResponse
from app.services import capture_service

router = APIRouter(prefix="/capture", tags=["capture"])


@router.post("", response_model=CaptureResponse)
def capture_application(
    data: CaptureRequest,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = capture_service.capture(db, current_user.id, data)
    response.status_code = 201 if result.created else 200
    return CaptureResponse(
        application=ApplicationRead.model_validate(result.application),
        created=result.created,
        contacts_added=result.contacts_added,
    )
