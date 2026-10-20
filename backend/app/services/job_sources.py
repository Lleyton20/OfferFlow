"""Fetchers for public job sources.

Every source here is published for programmatic access: SimplifyJobs' community
listings on GitHub, and companies' own public job board APIs on Greenhouse, Lever
and Ashby. Scraping sites that forbid it (LinkedIn, Indeed) is deliberately out of
scope — it breaks their terms and gets blocked.
"""

import html
import logging
import os
import re
from collections.abc import Callable, Iterator
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

import httpx

logger = logging.getLogger(__name__)

MAX_AGE = timedelta(days=45)
DESCRIPTION_LIMIT = 6000
TIMEOUT = httpx.Timeout(30.0, connect=10.0)
USER_AGENT = "OfferFlow job discovery (+https://github.com/Lleyton20/OfferFlow)"

SIMPLIFY_FEEDS = {
    "internship": "https://raw.githubusercontent.com/SimplifyJobs/Summer2027-Internships/dev/.github/scripts/listings.json",
    "new_grad": "https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/.github/scripts/listings.json",
}

DEFAULT_JOB_BOARDS = (
    "greenhouse:stripe,greenhouse:figma,greenhouse:datadog,greenhouse:robinhood,"
    "greenhouse:airbnb,greenhouse:coinbase,greenhouse:cloudflare,greenhouse:databricks,"
    "greenhouse:anthropic,greenhouse:duolingo,greenhouse:pinterest,greenhouse:reddit,"
    "greenhouse:lyft,lever:palantir,lever:spotify,ashby:ramp,ashby:notion,ashby:openai,"
    "ashby:replit"
)

_FELLOWSHIP = re.compile(r"\bfellow(ship)?s?\b", re.I)
_INTERNSHIP = re.compile(r"\b(intern(ship)?s?|co-?op|apprentice(ship)?)\b", re.I)
_NEW_GRAD = re.compile(
    r"\b(new grad(uate)?|university grad(uate)?|early[- ]career|entry[- ]level|graduate|"
    r"campus|class of 20\d\d|junior)\b",
    re.I,
)
_TAG = re.compile(r"<[^>]+>")
_SPACE = re.compile(r"\s+")


@dataclass
class RawJob:
    source: str
    external_id: str
    company: str
    title: str
    url: str
    job_type: str
    location: str | None = None
    category: str | None = None
    description: str | None = None
    posted_at: datetime | None = None
    tags: list[str] = field(default_factory=list)


def classify(title: str, default: str | None = None) -> str | None:
    """Early-career type from a job title, or None when the role isn't early-career."""
    if _FELLOWSHIP.search(title):
        return "fellowship"
    if _INTERNSHIP.search(title):
        return "internship"
    if _NEW_GRAD.search(title):
        return "new_grad"
    return default


def html_to_text(raw: str | None) -> str | None:
    if not raw:
        return None
    text = _SPACE.sub(" ", _TAG.sub(" ", html.unescape(html.unescape(raw)))).strip()
    return text[:DESCRIPTION_LIMIT] or None


def _is_recent(posted_at: datetime | None, now: datetime) -> bool:
    return posted_at is None or now - posted_at <= MAX_AGE


def _parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def parse_simplify(listings: list[dict], default_type: str, now: datetime) -> Iterator[RawJob]:
    for item in listings:
        if not (item.get("active") and item.get("is_visible", True)):
            continue
        timestamp = item.get("date_posted")
        posted_at = datetime.fromtimestamp(timestamp, timezone.utc) if timestamp else None
        if not _is_recent(posted_at, now):
            continue
        title = item.get("title") or ""
        locations = item.get("locations") or []
        yield RawJob(
            source="simplify",
            # Prefixed with the feed so each feed's postings can be retired independently.
            external_id=f"{default_type}:{item['id']}",
            company=item.get("company_name") or "Unknown",
            title=title,
            url=item["url"],
            job_type=classify(title, default_type) or default_type,
            location=", ".join(locations[:3]) or None,
            category=item.get("category"),
            posted_at=posted_at,
            tags=[t for t in (item.get("terms") or []) if isinstance(t, str)][:3],
        )


def parse_greenhouse(board: str, payload: dict, now: datetime) -> Iterator[RawJob]:
    for job in payload.get("jobs", []):
        job_type = classify(job.get("title", ""))
        if job_type is None:
            continue
        posted_at = _parse_iso(job.get("first_published") or job.get("updated_at"))
        if not _is_recent(posted_at, now):
            continue
        yield RawJob(
            source="greenhouse",
            external_id=f"{board}:{job['id']}",
            company=job.get("company_name") or board.title(),
            title=job["title"],
            url=job["absolute_url"],
            job_type=job_type,
            location=(job.get("location") or {}).get("name"),
            description=html_to_text(job.get("content")),
            posted_at=posted_at,
        )


def parse_lever(company: str, payload: list[dict], now: datetime) -> Iterator[RawJob]:
    for job in payload:
        job_type = classify(job.get("text", ""))
        if job_type is None:
            continue
        created = job.get("createdAt")
        posted_at = datetime.fromtimestamp(created / 1000, timezone.utc) if created else None
        if not _is_recent(posted_at, now):
            continue
        categories = job.get("categories") or {}
        yield RawJob(
            source="lever",
            external_id=f"{company}:{job['id']}",
            company=company.title(),
            title=job["text"],
            url=job["hostedUrl"],
            job_type=job_type,
            location=categories.get("location"),
            category=categories.get("team"),
            description=(job.get("descriptionPlain") or "")[:DESCRIPTION_LIMIT] or None,
            posted_at=posted_at,
        )


def parse_ashby(org: str, payload: dict, now: datetime) -> Iterator[RawJob]:
    for job in payload.get("jobs", []):
        if job.get("isListed") is False:
            continue
        job_type = classify(job.get("title", ""))
        if job_type is None:
            continue
        posted_at = _parse_iso(job.get("publishedAt"))
        if not _is_recent(posted_at, now):
            continue
        yield RawJob(
            source="ashby",
            external_id=f"{org}:{job['id']}",
            company=org.title(),
            title=job["title"],
            url=job["jobUrl"],
            job_type=job_type,
            location=job.get("location"),
            category=job.get("department"),
            description=(job.get("descriptionPlain") or "")[:DESCRIPTION_LIMIT] or None,
            posted_at=posted_at,
        )


@dataclass
class SourceFetch:
    """One named source and how to fetch it. `run` returns parsed jobs or raises."""

    name: str
    run: Callable[[httpx.Client, datetime], list[RawJob]]


def _simplify_fetch(job_type: str, url: str) -> SourceFetch:
    def run(client: httpx.Client, now: datetime) -> list[RawJob]:
        response = client.get(url)
        response.raise_for_status()
        return list(parse_simplify(response.json(), job_type, now))

    return SourceFetch(name=f"simplify:{job_type}", run=run)


def _board_fetch(platform: str, token: str) -> SourceFetch | None:
    def greenhouse(client: httpx.Client, now: datetime) -> list[RawJob]:
        response = client.get(
            f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs", params={"content": "true"}
        )
        response.raise_for_status()
        return list(parse_greenhouse(token, response.json(), now))

    def lever(client: httpx.Client, now: datetime) -> list[RawJob]:
        response = client.get(f"https://api.lever.co/v0/postings/{token}", params={"mode": "json"})
        response.raise_for_status()
        return list(parse_lever(token, response.json(), now))

    def ashby(client: httpx.Client, now: datetime) -> list[RawJob]:
        response = client.get(f"https://api.ashbyhq.com/posting-api/job-board/{token}")
        response.raise_for_status()
        return list(parse_ashby(token, response.json(), now))

    runners = {"greenhouse": greenhouse, "lever": lever, "ashby": ashby}
    runner = runners.get(platform)
    return SourceFetch(name=f"{platform}:{token}", run=runner) if runner else None


def configured_sources() -> list[SourceFetch]:
    sources = [_simplify_fetch(job_type, url) for job_type, url in SIMPLIFY_FEEDS.items()]
    for entry in os.getenv("JOB_BOARDS", DEFAULT_JOB_BOARDS).split(","):
        platform, _, token = entry.strip().partition(":")
        fetch = _board_fetch(platform.lower(), token.strip()) if token else None
        if fetch is None:
            logger.warning("Ignoring unrecognized JOB_BOARDS entry %r", entry)
            continue
        sources.append(fetch)
    return sources


def http_client() -> httpx.Client:
    return httpx.Client(timeout=TIMEOUT, headers={"User-Agent": USER_AGENT}, follow_redirects=True)
