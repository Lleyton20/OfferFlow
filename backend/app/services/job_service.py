"""Job discovery: refreshing postings from public sources and recommending them.

Recommendations are deterministic and explainable — every score comes with the
reasons behind it — rather than an opaque model call, so a user can see why a
posting was suggested and the ranking is cheap enough to compute per request.
"""

import logging
import re
from collections import Counter
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.job import JobInteraction, JobPosting
from app.models.resume import Resume
from app.models.user import User
from app.services import job_sources
from app.services.capture_service import normalize_job_url

logger = logging.getLogger(__name__)

RECOMMENDATION_WINDOW = timedelta(days=45)
MAX_PER_COMPANY = 2
JOB_TYPES = ("internship", "new_grad", "fellowship")

# Skills and domains worth matching on. Kept deliberately small and specific:
# generic words ("team", "experience") would match everything and rank nothing.
SKILLS = {
    "python",
    "java",
    "javascript",
    "typescript",
    "react",
    "node",
    "sql",
    "c++",
    "c#",
    "go",
    "golang",
    "rust",
    "kotlin",
    "swift",
    "ruby",
    "scala",
    "aws",
    "gcp",
    "azure",
    "docker",
    "kubernetes",
    "linux",
    "pytorch",
    "tensorflow",
    "spark",
    "tableau",
    "excel",
    "figma",
    "ios",
    "android",
    "graphql",
    "postgres",
    "fastapi",
    "django",
    "flask",
    "machine learning",
    "deep learning",
    "nlp",
    "computer vision",
    "llm",
    "data science",
    "data engineering",
    "analytics",
    "statistics",
    "security",
    "embedded",
    "fpga",
    "verilog",
    "robotics",
    "distributed systems",
    "backend",
    "frontend",
    "full stack",
    "infrastructure",
    "devops",
    "product management",
    "product design",
    "ux",
    "finance",
    "trading",
    "quantitative",
    "marketing",
    "sales",
    "consulting",
    "operations",
    "research",
    "hardware",
    "mobile",
}

ROLE_WORDS = {
    "software",
    "engineer",
    "engineering",
    "developer",
    "data",
    "scientist",
    "analyst",
    "product",
    "design",
    "designer",
    "machine",
    "learning",
    "ai",
    "ml",
    "research",
    "quant",
    "quantitative",
    "security",
    "hardware",
    "mobile",
    "frontend",
    "backend",
    "infrastructure",
    "business",
    "finance",
    "marketing",
    "operations",
    "manager",
}

_WORD = re.compile(r"[a-z][a-z+#]*")


@dataclass
class RefreshStats:
    added: int = 0
    updated: int = 0
    deactivated: int = 0
    sources: dict[str, int | str] = field(default_factory=dict)


@dataclass
class Profile:
    skills: set[str]
    role_words: Counter
    keywords: set[str]
    job_types: set[str]
    applied: set[tuple[str, str]]
    applied_urls: set[str]


@dataclass
class Recommendation:
    job: JobPosting
    score: float
    reasons: list[str]
    state: str | None = None


def _skills_in(text: str) -> set[str]:
    lowered = f" {text.lower()} "
    return {skill for skill in SKILLS if f" {skill} " in lowered or f" {skill}," in lowered}


def _role_words(text: str) -> set[str]:
    return {w for w in _WORD.findall(text.lower()) if w in ROLE_WORDS}


# --- Refresh -----------------------------------------------------------------


def _store(
    db: Session,
    prefix: str,
    raw_jobs: list[job_sources.RawJob],
    now: datetime,
    stats: RefreshStats,
) -> int:
    """Upserts one source's postings and retires the ones that have disappeared from it."""
    platform = raw_jobs[0].source
    existing = {
        job.external_id: job
        for job in db.scalars(
            select(JobPosting).where(
                JobPosting.source == platform, JobPosting.external_id.like(f"{prefix}%")
            )
        )
    }
    known_urls = set(db.scalars(select(JobPosting.url)))

    seen: set[str] = set()
    for raw in raw_jobs:
        if raw.external_id in seen:
            continue
        seen.add(raw.external_id)
        url = normalize_job_url(raw.url) or raw.url
        job = existing.get(raw.external_id)
        if job is not None:
            job.title, job.location, job.url = raw.title, raw.location, url
            job.description = raw.description or job.description
            job.last_seen_at, job.is_active = now, True
            stats.updated += 1
            continue
        # The same opening often appears in a community list and on the company's own
        # board. Keep whichever arrived first.
        if url in known_urls:
            continue
        known_urls.add(url)
        db.add(
            JobPosting(
                source=raw.source,
                external_id=raw.external_id,
                company=raw.company,
                title=raw.title,
                location=raw.location,
                url=url,
                job_type=raw.job_type,
                category=raw.category,
                description=raw.description,
                tags=raw.tags,
                posted_at=raw.posted_at,
                first_seen_at=now,
                last_seen_at=now,
                is_active=True,
            )
        )
        stats.added += 1

    for external_id, job in existing.items():
        if external_id not in seen and job.is_active:
            job.is_active = False
            stats.deactivated += 1
    return len(seen)


def refresh_jobs(db: Session, sources: list[job_sources.SourceFetch] | None = None) -> RefreshStats:
    """Pulls every configured source. One failing source never aborts the others."""
    stats = RefreshStats()
    now = datetime.now(timezone.utc)
    with job_sources.http_client() as client:
        for source in sources or job_sources.configured_sources():
            try:
                raw_jobs = source.run(client, now)
            except Exception as exc:  # noqa: BLE001 — any source failure is isolated and reported
                logger.warning("Job source %s failed: %s", source.name, exc)
                stats.sources[source.name] = f"error: {type(exc).__name__}"
                continue
            if not raw_jobs:
                stats.sources[source.name] = 0
                continue
            # Source names are "<platform>:<feed>" and external ids are "<feed>:<id>".
            prefix = source.name.partition(":")[2] + ":"
            stats.sources[source.name] = _store(db, prefix, raw_jobs, now, stats)
            db.commit()
    return stats


# --- Recommendations ---------------------------------------------------------


def _preferred_types(user: User, today: date) -> set[str]:
    if user.grad_year is None:
        return set(JOB_TYPES)
    years_left = user.grad_year - today.year
    if years_left >= 2:
        return {"internship", "fellowship"}
    if years_left == 1:
        return set(JOB_TYPES)
    return {"new_grad", "fellowship"}


def build_profile(db: Session, user: User) -> Profile:
    applications = list(db.scalars(select(Application).where(Application.user_id == user.id)))
    latest_resume = db.scalar(
        select(Resume).where(Resume.user_id == user.id).order_by(Resume.created_at.desc())
    )

    keywords = {k.strip().lower() for k in user.job_keywords if k.strip()}
    skills = {k for k in keywords if k in SKILLS}
    if latest_resume is not None:
        skills |= _skills_in(latest_resume.extracted_text or "")

    role_words: Counter = Counter()
    for application in applications:
        role_words.update(_role_words(application.role))
        skills |= _skills_in(application.job_description or "")
    for keyword in keywords:
        role_words.update(_role_words(keyword))

    return Profile(
        skills=skills,
        role_words=role_words,
        keywords=keywords,
        job_types=_preferred_types(user, date.today()),
        applied={(a.company.lower(), a.role.lower()) for a in applications},
        applied_urls={a.job_url for a in applications if a.job_url},
    )


def score_job(job: JobPosting, profile: Profile, now: datetime) -> tuple[float, list[str]]:
    reasons: list[str] = []
    score = 0.0
    title = job.title.lower()
    haystack = " ".join(filter(None, [job.title, job.category, job.description]))

    keyword_hits = sorted(k for k in profile.keywords if k in haystack.lower())
    if keyword_hits:
        score += 4 * len(keyword_hits)
        reasons.append(f"Matches your interest in {', '.join(keyword_hits[:3])}")

    title_words = _role_words(title)
    overlap = {w for w in title_words if profile.role_words[w]}
    if overlap:
        score += sum(min(profile.role_words[w], 3) for w in overlap)
        reasons.append("Similar to roles you've applied to")

    skill_hits = sorted(profile.skills & _skills_in(haystack))
    if skill_hits:
        score += 1.5 * min(len(skill_hits), 6)
        reasons.append(f"Uses {', '.join(skill_hits[:4])}")

    if job.job_type == "fellowship":
        score += 1
    posted = job.posted_at or job.first_seen_at
    if posted is not None:
        if posted.tzinfo is None:
            posted = posted.replace(tzinfo=timezone.utc)
        age_days = max(0, (now - posted).days)
        score += max(0.0, 3 - age_days / 7)
        if age_days <= 3:
            reasons.append("Posted in the last few days")
    return score, reasons


def recommend(
    db: Session,
    user: User,
    job_type: str | None = None,
    limit: int = 30,
    since: datetime | None = None,
) -> list[Recommendation]:
    profile = build_profile(db, user)
    now = datetime.now(timezone.utc)
    types = {job_type} if job_type else profile.job_types

    interactions = {
        i.job_id: i.state
        for i in db.scalars(select(JobInteraction).where(JobInteraction.user_id == user.id))
    }
    stmt = select(JobPosting).where(
        JobPosting.is_active.is_(True),
        JobPosting.job_type.in_(types),
        JobPosting.first_seen_at >= (since or now - RECOMMENDATION_WINDOW),
    )

    has_signal = bool(profile.keywords or profile.skills or profile.role_words)
    ranked: list[Recommendation] = []
    for job in db.scalars(stmt):
        if interactions.get(job.id) in ("dismissed", "applied"):
            continue
        if (
            job.url in profile.applied_urls
            or (job.company.lower(), job.title.lower()) in profile.applied
        ):
            continue
        score, reasons = score_job(job, profile, now)
        # With nothing to personalize on yet, recency alone ranks a useful starter list.
        if has_signal and score < 3:
            continue
        ranked.append(
            Recommendation(
                job=job, score=round(score, 2), reasons=reasons, state=interactions.get(job.id)
            )
        )

    ranked.sort(key=lambda r: r.score, reverse=True)
    # A big employer can post dozens of near-identical roles; cap each company so one
    # name never crowds out the rest of the list.
    per_company: Counter = Counter()
    picks: list[Recommendation] = []
    for rec in ranked:
        key = rec.job.company.lower()
        if per_company[key] >= MAX_PER_COMPANY:
            continue
        per_company[key] += 1
        picks.append(rec)
        if len(picks) == limit:
            break
    return picks


def list_saved(db: Session, user_id: int) -> list[JobInteraction]:
    return list(
        db.scalars(
            select(JobInteraction)
            .where(JobInteraction.user_id == user_id, JobInteraction.state == "saved")
            .order_by(JobInteraction.created_at.desc())
        )
    )


def set_interaction(db: Session, user_id: int, job_id: int, state: str | None) -> bool:
    if db.get(JobPosting, job_id) is None:
        return False
    interaction = db.scalar(
        select(JobInteraction).where(
            JobInteraction.user_id == user_id, JobInteraction.job_id == job_id
        )
    )
    if state is None:
        if interaction is not None:
            db.delete(interaction)
    elif interaction is None:
        db.add(JobInteraction(user_id=user_id, job_id=job_id, state=state))
    else:
        interaction.state = state
    db.commit()
    return True


def discovery_stats(db: Session) -> dict:
    now = datetime.now(timezone.utc)
    active = list(db.scalars(select(JobPosting).where(JobPosting.is_active.is_(True))))
    week_ago = now - timedelta(days=7)

    def _aware(value: datetime) -> datetime:
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)

    last_seen = max((_aware(j.last_seen_at) for j in active), default=None)
    return {
        "active": len(active),
        "new_this_week": sum(1 for j in active if _aware(j.first_seen_at) >= week_ago),
        "by_type": dict(Counter(j.job_type for j in active)),
        "last_refreshed_at": last_seen,
    }


# --- Digests -----------------------------------------------------------------


@dataclass
class DigestStats:
    sent: int = 0
    skipped_no_matches: int = 0
    email_disabled: bool = False


def send_digests(db: Session, app_url: str, max_items: int = 8) -> DigestStats:
    """Emails each opted-in user the recommendations that appeared since their last digest."""
    from app.services import email_service

    stats = DigestStats(email_disabled=not email_service.is_configured())
    if stats.email_disabled:
        return stats

    now = datetime.now(timezone.utc)
    users = db.scalars(select(User).where(User.digest_enabled.is_(True)))
    for user in users:
        since = user.last_digest_at or now - timedelta(days=1)
        if since.tzinfo is None:
            since = since.replace(tzinfo=timezone.utc)
        picks = recommend(db, user, limit=max_items, since=since)
        if not picks:
            stats.skipped_no_matches += 1
            continue
        items = [
            email_service.DigestItem(
                company=p.job.company,
                title=p.job.title,
                location=p.job.location,
                url=p.job.url,
                reason=p.reasons[0] if p.reasons else None,
            )
            for p in picks
        ]
        first_name = (user.full_name or "there").split(" ")[0]
        if email_service.send_job_digest(user.email, first_name, items, app_url):
            user.last_digest_at = now
            stats.sent += 1
    db.commit()
    return stats
