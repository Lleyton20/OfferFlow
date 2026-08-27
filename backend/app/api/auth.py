import os

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.api.deps import COOKIE_NAME, get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserRead
from app.services.auth_service import (
    JWT_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    get_user_by_email,
    register_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_MAX_AGE = JWT_EXPIRE_MINUTES * 60

# Local dev: frontend/backend are different ports on the same "localhost" site,
# so Lax + non-Secure works over plain HTTP. Once deployed, frontend and backend
# live on different domains entirely (e.g. vercel.app vs onrender.com) — that's
# cross-site, so the cookie needs SameSite=None + Secure (HTTPS-only) or browsers
# will silently drop it on cross-origin requests. Toggle with ENV=production.
IS_PRODUCTION = os.getenv("ENV", "development") == "production"
COOKIE_SAMESITE = "none" if IS_PRODUCTION else "lax"
COOKIE_SECURE = IS_PRODUCTION


def _set_session_cookie(response: Response, user_id: int) -> None:
    token = create_access_token(user_id)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite=COOKIE_SAMESITE,
        secure=COOKIE_SECURE,
    )


@router.post("/register", response_model=UserRead, status_code=201)
def register(data: UserCreate, response: Response, db: Session = Depends(get_db)):
    if get_user_by_email(db, data.email) is not None:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = register_user(db, data)
    _set_session_cookie(response, user.id)
    return user


@router.post("/login", response_model=UserRead)
def login(data: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    _set_session_cookie(response, user.id)
    return user


@router.post("/logout", status_code=204)
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, samesite=COOKIE_SAMESITE, secure=COOKIE_SECURE)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user
