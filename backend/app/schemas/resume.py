from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ResumeCheck(BaseModel):
    check: str
    passed: bool
    detail: str


class AIFeedback(BaseModel):
    overall_summary: str
    strengths: list[str]
    weaknesses: list[str]
    suggestions: list[str]


class TailorRequest(BaseModel):
    job_description: str


class TailoringSuggestions(BaseModel):
    summary_rewrite: str
    bullets_to_emphasize: list[str]
    keywords_to_add: list[str]
    overall_advice: str


class TailorResponse(BaseModel):
    suggestions: TailoringSuggestions | None
    status: str


class ResumeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    job_description: str | None
    ats_score: int
    ats_checks: list[ResumeCheck]
    matched_keywords: list[str]
    missing_keywords: list[str]
    ai_feedback: AIFeedback | None
    ai_feedback_status: str
    created_at: datetime
