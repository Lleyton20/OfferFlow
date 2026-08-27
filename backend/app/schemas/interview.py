from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MockQuestionItem(BaseModel):
    question: str
    tip: str


class MockQuestionSet(BaseModel):
    questions: list[MockQuestionItem]


class InterviewSessionCreate(BaseModel):
    title: str
    interview_type: str = "Behavioral"
    application_id: int | None = None
    scheduled_date: str | None = None
    prep_notes: str | None = None


class InterviewSessionUpdate(BaseModel):
    title: str | None = None
    interview_type: str | None = None
    application_id: int | None = None
    scheduled_date: str | None = None
    status: str | None = None
    prep_notes: str | None = None
    performance_rating: int | None = None
    performance_notes: str | None = None


class InterviewSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: int | None
    title: str
    interview_type: str
    scheduled_date: str | None
    status: str
    prep_notes: str | None
    performance_rating: int | None
    performance_notes: str | None
    mock_questions: list[MockQuestionItem]
    ai_feedback_status: str
    created_at: datetime
    updated_at: datetime
