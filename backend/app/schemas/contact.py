from datetime import datetime

from pydantic import BaseModel, ConfigDict


class InteractionCreate(BaseModel):
    date: str
    note: str


class InteractionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: str
    note: str
    created_at: datetime


class ContactCreate(BaseModel):
    name: str
    company: str | None = None
    role: str | None = None
    email: str | None = None
    linkedin_url: str | None = None
    relationship_type: str = "Recruiter"
    notes: str | None = None
    last_contacted_date: str | None = None
    follow_up_date: str | None = None


class ContactUpdate(BaseModel):
    name: str | None = None
    company: str | None = None
    role: str | None = None
    email: str | None = None
    linkedin_url: str | None = None
    relationship_type: str | None = None
    notes: str | None = None
    last_contacted_date: str | None = None
    follow_up_date: str | None = None


class ContactRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company: str | None
    role: str | None
    email: str | None
    linkedin_url: str | None
    relationship_type: str
    notes: str | None
    last_contacted_date: str | None
    follow_up_date: str | None
    created_at: datetime
    updated_at: datetime
    interactions: list[InteractionRead]
