from fastapi import Cookie, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services import token_service
from app.services.auth_service import decode_access_token, get_user_by_id

COOKIE_NAME = "access_token"


def get_current_user(
    access_token: str | None = Cookie(default=None, alias=COOKIE_NAME),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    # The web app authenticates with the session cookie; the browser extension sends
    # a personal access token as a bearer token instead.
    if authorization and authorization.lower().startswith("bearer "):
        user = token_service.authenticate(db, authorization[7:].strip())
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid or revoked access token")
        return user

    if access_token is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = decode_access_token(access_token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    return user


def get_full_account(current_user: User = Depends(get_current_user)) -> User:
    """For features that cost money per call (the AI ones): not available in demo accounts."""
    if current_user.is_demo:
        raise HTTPException(
            status_code=403,
            detail="AI features are available with a free account. Sign up to try them on your own data.",
        )
    return current_user
