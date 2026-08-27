from datetime import datetime

from pydantic import BaseModel, ConfigDict


class StatusEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    created_at: datetime


class ApplicationCreate(BaseModel):
    company: str
    role: str
    date_applied: str
    status: str = "Applied"
    referral_used: bool = False
    contact_person: str | None = None
    job_description: str | None = None
    match_score: int | None = None
    strengths: list[str] = []
    weaknesses: list[str] = []
    notes: str | None = None
    resume_id: int | None = None


class ApplicationUpdate(BaseModel):
    company: str | None = None
    role: str | None = None
    date_applied: str | None = None
    status: str | None = None
    referral_used: bool | None = None
    contact_person: str | None = None
    job_description: str | None = None
    match_score: int | None = None
    strengths: list[str] | None = None
    weaknesses: list[str] | None = None
    notes: str | None = None
    resume_id: int | None = None


class ApplicationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company: str
    role: str
    date_applied: str
    status: str
    referral_used: bool
    contact_person: str | None
    job_description: str | None
    match_score: int | None
    strengths: list[str]
    weaknesses: list[str]
    notes: str | None
    resume_id: int | None
    created_at: datetime
    updated_at: datetime
    status_history: list[StatusEventRead]
