"""Keeps job postings fresh from inside the API process.

The free Render instance sleeps when idle, so a timer alone isn't enough: every
time the server wakes, this checks how old the postings are and refreshes them in
the background if they're stale. The GitHub Actions schedule still calls the
refresh endpoint as a backup and to wake the server.

On by default in production (ENV=production) and off elsewhere, so tests and local
runs never reach out to the network on startup. AUTO_REFRESH_JOBS=true/false overrides.
"""

import logging
import os
import threading
from collections.abc import Callable
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.job import JobPosting
from app.services import demo_service, job_service

logger = logging.getLogger(__name__)

STALE_AFTER = timedelta(hours=6)
CHECK_EVERY_SECONDS = 30 * 60


def last_refreshed_at(db: Session) -> datetime | None:
    latest = db.scalar(select(func.max(JobPosting.last_seen_at)))
    if latest is not None and latest.tzinfo is None:
        latest = latest.replace(tzinfo=timezone.utc)
    return latest


def refresh_if_stale(session_factory: Callable[[], Session], now: datetime | None = None) -> bool:
    """Returns True if a refresh ran."""
    now = now or datetime.now(timezone.utc)
    with session_factory() as db:
        latest = last_refreshed_at(db)
        if latest is not None and now - latest < STALE_AFTER:
            return False
        stats = job_service.refresh_jobs(db)
        purged = demo_service.purge_expired_demos(db)
    logger.info(
        "Job refresh: %d added, %d updated, %d closed; %d expired demos removed",
        stats.added,
        stats.updated,
        stats.deactivated,
        purged,
    )
    return True


def is_enabled() -> bool:
    explicit = os.getenv("AUTO_REFRESH_JOBS")
    if explicit is not None:
        return explicit.lower() == "true"
    return os.getenv("ENV") == "production"


def start(session_factory: Callable[[], Session]) -> threading.Event | None:
    """Starts the background loop and returns an event that stops it, or None if disabled."""
    if not is_enabled():
        return None
    stop = threading.Event()

    def loop() -> None:
        while not stop.is_set():
            try:
                refresh_if_stale(session_factory)
            except Exception:
                logger.exception("Background job refresh failed")
            stop.wait(CHECK_EVERY_SECONDS)

    threading.Thread(target=loop, name="job-refresh", daemon=True).start()
    return stop
