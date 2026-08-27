from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

CURRENT_YEAR = datetime.now().year


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1, max_length=120)
    birthday: date
    university: str | None = Field(default=None, max_length=160)
    grad_year: int | None = Field(default=None, ge=1950, le=CURRENT_YEAR + 8)

    @field_validator("full_name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Full name is required")
        return value

    @field_validator("university")
    @classmethod
    def _clean_university(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("birthday")
    @classmethod
    def _birthday_in_range(cls, value: date) -> date:
        today = date.today()
        if value > today:
            raise ValueError("Birthday can't be in the future")
        if value.year < today.year - 120:
            raise ValueError("That birthday doesn't look right")
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    birthday: date | None
    university: str | None
    grad_year: int | None
    created_at: datetime
