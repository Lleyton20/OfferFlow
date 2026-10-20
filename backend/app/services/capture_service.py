"""Turns a job page captured by the browser extension into an application and contacts."""

from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from urllib.parse import urlsplit, urlunsplit

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.application import Application, ApplicationStatusEvent
from app.models.contact import Contact
from app.models.job import JobInteraction, JobPosting
from app.schemas.capture import CapturedContact, CaptureRequest

# Two captures of the same company and role this close together are the same
# application seen twice (e.g. a job page and its separate confirmation page).
DUPLICATE_WINDOW = timedelta(days=30)


@dataclass
class CaptureResult:
    application: Application
    created: bool
    contacts_added: int


def normalize_job_url(url: str | None) -> str | None:
    """Strips query strings and fragments, which carry tracking params rather than identity."""
    if not url:
        return None
    parts = urlsplit(url.strip())
    if not parts.scheme or not parts.netloc:
        return None
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), parts.path.rstrip("/"), "", ""))


def _relationship_for(title: str | None) -> str:
    lowered = (title or "").lower()
    if "recruit" in lowered or "talent" in lowered or "sourcer" in lowered:
        return "Recruiter"
    if any(word in lowered for word in ("manager", "lead", "director", "head of", "vp")):
        return "Hiring Manager"
    return "Recruiter"


def _find_existing(db: Session, user_id: int, data: CaptureRequest, job_url: str | None):
    if job_url:
        match = db.scalar(
            select(Application).where(
                Application.user_id == user_id, Application.job_url == job_url
            )
        )
        if match is not None:
            return match
    cutoff = datetime.now(timezone.utc) - DUPLICATE_WINDOW
    return db.scalar(
        select(Application).where(
            Application.user_id == user_id,
            func.lower(Application.company) == data.company.strip().lower(),
            func.lower(Application.role) == data.role.strip().lower(),
            Application.created_at >= cutoff,
        )
    )


def _upsert_contacts(
    db: Session, user_id: int, company: str, role: str, contacts: list[CapturedContact]
) -> list[Contact]:
    added: list[Contact] = []
    for captured in contacts:
        name = captured.name.strip()
        exists = db.scalar(
            select(Contact).where(
                Contact.user_id == user_id,
                func.lower(Contact.name) == name.lower(),
                func.lower(Contact.company) == company.lower(),
            )
        )
        if exists is not None:
            continue
        contact = Contact(
            user_id=user_id,
            name=name,
            company=company,
            role=captured.title,
            email=captured.email,
            linkedin_url=captured.profile_url,
            relationship_type=_relationship_for(captured.title),
            notes=f"Listed on the {role} posting.",
        )
        db.add(contact)
        added.append(contact)
    return added


def _mark_discovered_job_applied(db: Session, user_id: int, job_url: str | None) -> None:
    if not job_url:
        return
    job = db.scalar(select(JobPosting).where(JobPosting.url == job_url))
    if job is None:
        return
    interaction = db.scalar(
        select(JobInteraction).where(
            JobInteraction.user_id == user_id, JobInteraction.job_id == job.id
        )
    )
    if interaction is None:
        db.add(JobInteraction(user_id=user_id, job_id=job.id, state="applied"))
    else:
        interaction.state = "applied"


def capture(db: Session, user_id: int, data: CaptureRequest) -> CaptureResult:
    company = data.company.strip()
    role = data.role.strip()
    job_url = normalize_job_url(data.job_url)

    application = _find_existing(db, user_id, data, job_url)
    created = application is None

    if application is None:
        application = Application(
            user_id=user_id,
            company=company,
            role=role,
            date_applied=data.date_applied or date.today().isoformat(),
            status=data.status,
            job_description=data.job_description,
            job_url=job_url,
            location=data.location,
            source=data.source,
            strengths=[],
            weaknesses=[],
        )
        db.add(application)
        db.flush()
        db.add(
            ApplicationStatusEvent(
                application_id=application.id, user_id=user_id, status=application.status
            )
        )
    else:
        # Fill gaps only; never overwrite what the user has edited by hand.
        application.job_description = application.job_description or data.job_description
        application.job_url = application.job_url or job_url
        application.location = application.location or data.location

    contacts = _upsert_contacts(db, user_id, company, role, data.contacts)
    if contacts and not application.contact_person:
        application.contact_person = contacts[0].name

    _mark_discovered_job_applied(db, user_id, job_url)

    db.commit()
    db.refresh(application)
    return CaptureResult(application=application, created=created, contacts_added=len(contacts))
