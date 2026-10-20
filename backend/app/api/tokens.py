from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.token import TokenCreate, TokenCreated, TokenRead
from app.services import token_service

router = APIRouter(prefix="/tokens", tags=["tokens"])


@router.get("", response_model=list[TokenRead])
def list_tokens(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return token_service.list_tokens(db, current_user.id)


@router.post("", response_model=TokenCreated, status_code=201)
def create_token(
    data: TokenCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    token, raw = token_service.create_token(db, current_user.id, data.name)
    return TokenCreated.model_validate(
        {**TokenRead.model_validate(token).model_dump(), "token": raw}
    )


@router.delete("/{token_id}", status_code=204)
def revoke_token(
    token_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    token = token_service.get_token(db, current_user.id, token_id)
    if token is None:
        raise HTTPException(status_code=404, detail="Token not found")
    token_service.revoke_token(db, token)
