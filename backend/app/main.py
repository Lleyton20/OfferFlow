from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="OfferFlow API")


class Application(BaseModel):
    company: str
    role: str
    date_applied: str
    status: str
    referral_used: bool
    contact_person: str | None = None
    job_description: str | None = None
    match_score: int | None = None
    strengths: list[str] = []
    weaknesses: list[str] = []
    notes: str | None = None


applications = [
    {
        "id": 1,
        "company": "Google",
        "role": "Software Engineering Intern",
        "date_applied": "2026-06-18",
        "status": "Applied",
        "referral_used": True,
        "contact_person": "John Smith",
        "job_description": "Build scalable software systems using Python, C++, and distributed systems.",
        "match_score": 7,
        "strengths": ["Python", "React", "Research experience"],
        "weaknesses": ["Distributed systems", "System design"],
        "notes": "Need to follow up about referral."
    }
]


@app.get("/")
def root():
    return {"message": "OfferFlow API is running"}


@app.get("/applications")
def get_applications():
    return applications


@app.post("/applications")
def create_application(application: Application):
    new_application = application.model_dump()
    new_application["id"] = len(applications) + 1
    applications.append(new_application)
    return new_application