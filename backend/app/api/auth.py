import os

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.api.deps import COOKIE_NAME, get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserCreate,
    UserLogin,
    UserRead,
)
from app.services import email_service
from app.services.auth_service import (
    JWT_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    create_password_reset_token,
    get_user_by_email,
    get_user_by_reset_token,
    register_user,
    reset_password as reset_password_service,
)

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_MAX_AGE = JWT_EXPIRE_MINUTES * 60
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

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


@router.post("/forgot-password", status_code=204)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Always returns 204 regardless of whether the email exists — revealing
    # that would let anyone enumerate registered accounts.
    user = get_user_by_email(db, data.email)
    if user is not None:
        token = create_password_reset_token(db, user)
        reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
        email_service.send_password_reset_email(user.email, reset_url)


@router.post("/reset-password", status_code=204)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = get_user_by_reset_token(db, data.token)
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    reset_password_service(db, user, data.new_password)
