from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TokenCreate(BaseModel):
    name: str = Field(default="Browser extension", min_length=1, max_length=60)


class TokenRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    prefix: str
    created_at: datetime
    last_used_at: datetime | None


class TokenCreated(TokenRead):
    token: str
