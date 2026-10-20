import hashlib
import secrets
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.api_token import ApiToken
from app.models.user import User

# A recognizable prefix makes leaked tokens easy to spot in logs and secret scanners.
TOKEN_PREFIX = "of_"


def _hash(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def create_token(db: Session, user_id: int, name: str) -> tuple[ApiToken, str]:
    """Returns the stored token and the raw value. The raw value is never persisted."""
    raw = TOKEN_PREFIX + secrets.token_urlsafe(32)
    token = ApiToken(user_id=user_id, name=name, token_hash=_hash(raw), prefix=raw[:10])
    db.add(token)
    db.commit()
    db.refresh(token)
    return token, raw


def list_tokens(db: Session, user_id: int) -> list[ApiToken]:
    return list(
        db.scalars(
            select(ApiToken).where(ApiToken.user_id == user_id).order_by(ApiToken.created_at.desc())
        )
    )


def get_token(db: Session, user_id: int, token_id: int) -> ApiToken | None:
    return db.scalar(select(ApiToken).where(ApiToken.id == token_id, ApiToken.user_id == user_id))


def revoke_token(db: Session, token: ApiToken) -> None:
    db.delete(token)
    db.commit()


def authenticate(db: Session, raw_token: str) -> User | None:
    if not raw_token.startswith(TOKEN_PREFIX):
        return None
    token = db.scalar(select(ApiToken).where(ApiToken.token_hash == _hash(raw_token)))
    if token is None:
        return None
    token.last_used_at = datetime.now(timezone.utc)
    db.commit()
    return db.get(User, token.user_id)
