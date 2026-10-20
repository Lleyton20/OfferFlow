from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class JobPostingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    company: str
    title: str
    location: str | None
    url: str
    job_type: str
    category: str | None
    tags: list[str]
    posted_at: datetime | None
    first_seen_at: datetime


class RecommendationRead(BaseModel):
    job: JobPostingRead
    score: float
    reasons: list[str]
    state: str | None


class DiscoveryStats(BaseModel):
    active: int
    new_this_week: int
    by_type: dict[str, int]
    last_refreshed_at: datetime | None


class JobPreferences(BaseModel):
    job_keywords: list[str] | None = Field(default=None, max_length=20)
    digest_enabled: bool | None = None
