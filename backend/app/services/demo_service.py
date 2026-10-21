"""Throwaway demo accounts for visitors who want to try OfferFlow without signing up.

Each visitor gets their own account seeded with a realistic search in progress, so
nobody sees or overwrites anyone else's changes. Accounts are purged after
DEMO_LIFETIME. AI output in the seed is pre-written: demo accounts never call the
model, so a public demo button can't run up an API bill.
"""

import secrets
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.api_token import ApiToken
from app.models.application import Application, ApplicationStatusEvent
from app.models.chat import ChatMessage
from app.models.contact import Contact, ContactInteraction
from app.models.interview import InterviewSession
from app.models.job import JobInteraction, JobPosting
from app.models.resume import Resume
from app.models.user import User
from app.services import resume_service
from app.services.auth_service import hash_password

DEMO_LIFETIME = timedelta(hours=24)
DEMO_EMAIL_DOMAIN = "demo.offerflow.invalid"

_RESUME_V2 = """Jordan Rivera
jordan.rivera@example.com | linkedin.com/in/jordanrivera

Education
Grambling State University, B.S. Computer Science, expected May 2027

Experience
IT Help Desk Assistant, Grambling State University
Helped students and staff with computer problems.

Skills
Java, Python, HTML
"""

_RESUME_V4 = """Jordan Rivera
Software Engineer | jordan.rivera@example.com | (318) 555-0142
linkedin.com/in/jordanrivera | github.com/jrivera

Education
Grambling State University, B.S. Computer Science, GPA 3.7, expected May 2027
Coursework: Data Structures, Algorithms, Databases, Operating Systems, Software Engineering

Experience
Software Engineering Intern, Acme Logistics (Summer 2026)
- Designed and built REST APIs for a shipment reporting service in Python and FastAPI,
  cutting report generation time by 40% for 200 daily users
- Added PostgreSQL indexes and query rewrites that reduced p95 latency from 900ms to 120ms
- Shipped React and TypeScript features for a dispatch dashboard used by 35 dispatchers
- Containerized backend services with Docker and deployed them to AWS ECS with GitHub Actions
- Wrote pytest suites that raised coverage on the reporting service from 52% to 88%

Undergraduate Research Assistant, Grambling State University (2025 to present)
- Built a Python data pipeline that cleans and analyzes 2 million campus energy readings
- Presented results to the department and co-authored a poster at a regional conference

Projects
OfferFlow: a job search platform with a React frontend, FastAPI backend, PostgreSQL and
Docker. I designed the API, built the browser extension and set up CI.
Campus Eats: an iOS app in Swift for ordering from campus dining, with 1,200 student users
and a 4.8 App Store rating. I built the ordering flow and the backend services.

Leadership
Vice President, Association for Computing Machinery student chapter: organized 6 workshops
on Git, interviewing and web development attended by 150 students

Skills
Languages: Python, TypeScript, JavaScript, Go, Swift, SQL
Tools: React, FastAPI, PostgreSQL, Docker, AWS, Git, GitHub Actions, Linux
"""

_TARGET_JD = (
    "Software Engineer Intern. Build backend services in Python and Go, design REST APIs, "
    "work with PostgreSQL, Docker and AWS, and ship React features with TypeScript."
)

_FEEDBACK_V4 = {
    "overall_summary": (
        "A strong internship resume: concrete impact numbers, a modern stack that matches "
        "most backend and full-stack postings, and projects that show initiative."
    ),
    "strengths": [
        "Every experience bullet leads with an action and ends with a measurable result",
        "Projects section shows end-to-end ownership, from frontend to deployment",
        "Skills line mirrors the keywords recruiters search for in SWE intern roles",
    ],
    "weaknesses": [
        "No mention of testing or code review practices",
        "The Campus Eats project doesn't say what you personally built",
    ],
    "suggestions": [
        "Add one bullet about testing, e.g. the coverage you reached with pytest",
        "Name your contribution on Campus Eats: architecture, features or the backend",
        "Move Projects above Experience for roles that value side projects",
    ],
}

_FEEDBACK_V2 = {
    "overall_summary": (
        "An early draft: it lists responsibilities rather than results and is light on the "
        "technical skills internship screens filter for."
    ),
    "strengths": ["Clear education section with an expected graduation date"],
    "weaknesses": [
        "The only experience bullet describes duties, not impact",
        "No projects, so there's little evidence of software engineering work",
        "Skills list is short and missing common tools like Git and SQL",
    ],
    "suggestions": [
        "Rewrite the help desk bullet with numbers: tickets per week, time to resolve",
        "Add two projects with the stack and a result for each",
        "Expand skills with the tools you actually use",
    ],
}

# (company, role, days ago applied, status path, resume version, referral, location)
_APPLICATIONS = [
    (
        "Stripe",
        "Software Engineer Intern",
        38,
        ["Applied", "Online Assessment", "Rejected"],
        2,
        False,
        "San Francisco, CA",
    ),
    (
        "Datadog",
        "Software Engineer Intern",
        34,
        ["Applied", "Recruiter Screen", "Technical Interview", "Final Round", "Offer"],
        4,
        True,
        "New York, NY",
    ),
    (
        "Ramp",
        "Software Engineer Intern",
        30,
        ["Applied", "Online Assessment", "Technical Interview"],
        4,
        False,
        "New York, NY",
    ),
    (
        "Figma",
        "Software Engineer Intern",
        27,
        ["Applied", "Recruiter Screen", "Final Round"],
        4,
        False,
        "San Francisco, CA",
    ),
    ("Notion", "Software Engineer Intern", 25, ["Applied"], 2, False, "San Francisco, CA"),
    (
        "Capital One",
        "Technology Internship Program",
        22,
        ["Applied", "Online Assessment"],
        4,
        False,
        "McLean, VA",
    ),
    (
        "Microsoft",
        "Software Engineer Intern",
        20,
        ["Applied", "Recruiter Screen"],
        4,
        True,
        "Redmond, WA",
    ),
    ("Plaid", "Backend Engineer Intern", 18, ["Applied", "Rejected"], 2, False, "Remote"),
    (
        "Duolingo",
        "Software Engineer Intern",
        12,
        ["Applied", "Online Assessment"],
        4,
        False,
        "Pittsburgh, PA",
    ),
    ("Cloudflare", "Software Engineer Intern", 9, ["Applied"], 4, False, "Austin, TX"),
    ("Robinhood", "Software Engineer Intern", 5, ["Applied"], 4, False, "Menlo Park, CA"),
    ("Coinbase", "Software Engineer Intern", 2, ["Applied"], 4, False, "Remote"),
]


def _days_ago(days: float) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days)


def _seed_resumes(db: Session, user_id: int) -> dict[int, Resume]:
    resumes = {}
    for version, text, feedback, age in (
        (2, _RESUME_V2, _FEEDBACK_V2, 45),
        (4, _RESUME_V4, _FEEDBACK_V4, 32),
    ):
        score, checks, matched, missing = resume_service.score_resume(text, _TARGET_JD)
        resume = Resume(
            user_id=user_id,
            filename=f"jordan_rivera_resume_v{version}.pdf",
            content_type="application/pdf",
            storage_path="",
            extracted_text=text,
            job_description=_TARGET_JD,
            ats_score=score,
            ats_checks=checks,
            matched_keywords=matched,
            missing_keywords=missing,
            ai_feedback=feedback,
            ai_feedback_status="ok",
            created_at=_days_ago(age),
        )
        db.add(resume)
        resumes[version] = resume
    db.flush()
    return resumes


def _seed_applications(
    db: Session, user_id: int, resumes: dict[int, Resume]
) -> dict[str, Application]:
    by_company = {}
    for company, role, age, path, version, referral, location in _APPLICATIONS:
        applied = _days_ago(age)
        application = Application(
            user_id=user_id,
            company=company,
            role=role,
            date_applied=applied.date().isoformat(),
            status=path[-1],
            referral_used=referral,
            resume_id=resumes[version].id,
            location=location,
            source="greenhouse" if age < 15 else "manual",
            job_description=_TARGET_JD,
            strengths=[],
            weaknesses=[],
            created_at=applied,
        )
        db.add(application)
        db.flush()
        # Spread each stage change across the time since applying so the history
        # timeline and analytics look like a real search.
        step = age / (len(path) + 1)
        for i, status in enumerate(path):
            db.add(
                ApplicationStatusEvent(
                    application_id=application.id,
                    user_id=user_id,
                    status=status,
                    created_at=_days_ago(age - i * step),
                )
            )
        by_company[company] = application
    return by_company


def _seed_contacts(db: Session, user_id: int) -> None:
    today = date.today()
    contacts = [
        (
            "Maya Chen",
            "Datadog",
            "University Recruiter",
            "Recruiter",
            3,
            -1,
            [
                (
                    30,
                    "Met at the Grambling career fair; she suggested applying to the summer SWE role.",
                ),
                (12, "Final round scheduled. She shared the interview loop and what to prepare."),
            ],
        ),
        (
            "Marcus Johnson",
            "Microsoft",
            "Software Engineer II",
            "Referral",
            18,
            4,
            [
                (21, "Coffee chat about his team's work on Azure. Offered to refer me."),
            ],
        ),
        (
            "Priya Patel",
            "Figma",
            "Engineering Manager",
            "Hiring Manager",
            9,
            2,
            [
                (9, "Thanked her after the final round and asked about team placement."),
            ],
        ),
        (
            "Dr. Angela Brooks",
            "Grambling State University",
            "Career Services Director",
            "Alum",
            40,
            10,
            [
                (40, "Resume review. Recommended adding metrics to every bullet."),
            ],
        ),
    ]
    for name, company, role, relationship, last_contact, follow_up_in, interactions in contacts:
        contact = Contact(
            user_id=user_id,
            name=name,
            company=company,
            role=role,
            relationship_type=relationship,
            last_contacted_date=(today - timedelta(days=last_contact)).isoformat(),
            follow_up_date=(today + timedelta(days=follow_up_in)).isoformat(),
        )
        db.add(contact)
        db.flush()
        for age, note in interactions:
            db.add(
                ContactInteraction(
                    contact_id=contact.id,
                    user_id=user_id,
                    date=(today - timedelta(days=age)).isoformat(),
                    note=note,
                )
            )


def _seed_interviews(db: Session, user_id: int, applications: dict[str, Application]) -> None:
    today = date.today()
    db.add(
        InterviewSession(
            user_id=user_id,
            application_id=applications["Ramp"].id,
            title="Ramp — Technical interview",
            interview_type="Technical",
            scheduled_date=(today + timedelta(days=3)).isoformat(),
            status="Scheduled",
            prep_notes="Review hash maps and two pointers. Practice explaining trade-offs out loud.",
            ai_feedback_status="ok",
            mock_questions=[
                {
                    "question": "Design an API that records card transactions and flags duplicates.",
                    "tip": "Clarify idempotency first, then talk through the data model and how you'd detect a retry.",
                },
                {
                    "question": "Given a list of expenses, return the top k merchants by spend.",
                    "tip": "Start with a hash map plus sorting, then improve to a heap and state the complexity of each.",
                },
                {
                    "question": "Tell me about a time you made a system faster.",
                    "tip": "Use the PostgreSQL index story: baseline, what you measured, the change, the result.",
                },
            ],
        )
    )
    db.add(
        InterviewSession(
            user_id=user_id,
            application_id=applications["Datadog"].id,
            title="Datadog — Final round",
            interview_type="Behavioral",
            scheduled_date=(today - timedelta(days=8)).isoformat(),
            status="Completed",
            performance_rating=5,
            performance_notes="Strong STAR answers. The system design follow-up on alerting went well.",
            ai_feedback_status="ok",
        )
    )
    db.add(
        InterviewSession(
            user_id=user_id,
            application_id=applications["Figma"].id,
            title="Figma — Final round",
            interview_type="Technical",
            scheduled_date=(today - timedelta(days=10)).isoformat(),
            status="Completed",
            performance_rating=3,
            performance_notes="Ran short on time in the coding round. Practice timed problems.",
            ai_feedback_status="ok",
        )
    )


def _seed_chat(db: Session, user_id: int) -> None:
    turns = [
        ("user", "What should I follow up on this week?"),
        (
            "assistant",
            "Three things stand out:\n\n"
            "1. Maya Chen at Datadog: your follow-up was due yesterday. Thank her and confirm "
            "your offer deadline.\n"
            "2. Your Ramp technical interview is in 3 days. Your prep notes cover hash maps; add "
            "one timed practice problem, since your Figma notes say time ran short.\n"
            "3. Notion has had no response in 25 days. A short note to the recruiting inbox is "
            "reasonable, or move it to rejected and focus on active applications.",
        ),
    ]
    for i, (role, content) in enumerate(turns):
        db.add(
            ChatMessage(
                user_id=user_id, role=role, content=content, created_at=_days_ago(1 - i * 0.01)
            )
        )


def _seed_saved_jobs(db: Session, user_id: int) -> None:
    jobs = db.scalars(
        select(JobPosting)
        .where(JobPosting.is_active.is_(True), JobPosting.job_type == "internship")
        .order_by(JobPosting.first_seen_at.desc())
        .limit(2)
    )
    for job in jobs:
        db.add(JobInteraction(user_id=user_id, job_id=job.id, state="saved"))


def create_demo_user(db: Session) -> User:
    user = User(
        email=f"{secrets.token_hex(6)}@{DEMO_EMAIL_DOMAIN}",
        # Nobody can sign in with this; the demo session cookie is the only way in.
        hashed_password=hash_password(secrets.token_urlsafe(32)),
        full_name="Jordan Rivera",
        university="Grambling State University",
        grad_year=date.today().year + 1,
        job_keywords=["software engineering", "python", "react"],
        digest_enabled=False,
        is_demo=True,
    )
    db.add(user)
    db.flush()

    resumes = _seed_resumes(db, user.id)
    applications = _seed_applications(db, user.id, resumes)
    _seed_contacts(db, user.id)
    _seed_interviews(db, user.id, applications)
    _seed_chat(db, user.id)
    _seed_saved_jobs(db, user.id)

    db.commit()
    db.refresh(user)
    return user


def purge_expired_demos(db: Session, now: datetime | None = None) -> int:
    """Deletes demo accounts older than DEMO_LIFETIME, with everything they own."""
    cutoff = (now or datetime.now(timezone.utc)) - DEMO_LIFETIME
    user_ids = list(
        db.scalars(select(User.id).where(User.is_demo.is_(True), User.created_at < cutoff))
    )
    if not user_ids:
        return 0

    for path in db.scalars(select(Resume.storage_path).where(Resume.user_id.in_(user_ids))):
        resume_service.delete_file(path)

    # Children before parents, so foreign keys hold on Postgres.
    owned = (
        ApplicationStatusEvent,
        ContactInteraction,
        InterviewSession,
        ChatMessage,
        JobInteraction,
        ApiToken,
        Application,
        Contact,
        Resume,
    )
    for model in owned:
        db.execute(delete(model).where(model.user_id.in_(user_ids)))
    db.execute(delete(User).where(User.id.in_(user_ids)))
    db.commit()
    return len(user_ids)
