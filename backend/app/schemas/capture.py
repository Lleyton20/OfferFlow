from pydantic import BaseModel, Field

from app.schemas.application import ApplicationRead


class CapturedContact(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    title: str | None = Field(default=None, max_length=200)
    profile_url: str | None = Field(default=None, max_length=500)
    email: str | None = Field(default=None, max_length=200)


class CaptureRequest(BaseModel):
    company: str = Field(min_length=1, max_length=200)
    role: str = Field(min_length=1, max_length=300)
    job_url: str | None = Field(default=None, max_length=2000)
    job_description: str | None = Field(default=None, max_length=50_000)
    location: str | None = Field(default=None, max_length=300)
    source: str = Field(default="extension", max_length=40)
    status: str = Field(default="Applied", max_length=60)
    date_applied: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    contacts: list[CapturedContact] = Field(default_factory=list, max_length=10)


class CaptureResponse(BaseModel):
    application: ApplicationRead
    created: bool
    contacts_added: int
