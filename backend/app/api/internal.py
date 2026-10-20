"""Endpoints for scheduled jobs (see .github/workflows/scheduled-jobs.yml).

Protected by a shared secret rather than a user session. When CRON_SECRET isn't set
they're disabled entirely, so a fresh deployment never exposes them by accident.
"""

import hmac
import os
from dataclasses import asdict

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import job_service

router = APIRouter(prefix="/internal", tags=["internal"], include_in_schema=False)


def require_cron_secret(x_cron_secret: str | None = Header(default=None)) -> None:
    expected = os.getenv("CRON_SECRET")
    if not expected:
        raise HTTPException(status_code=503, detail="Scheduled jobs are not configured")
    if not x_cron_secret or not hmac.compare_digest(x_cron_secret, expected):
        raise HTTPException(status_code=401, detail="Invalid cron secret")


@router.post("/jobs/refresh", dependencies=[Depends(require_cron_secret)])
def refresh_jobs(db: Session = Depends(get_db)):
    return asdict(job_service.refresh_jobs(db))


@router.post("/digests/send", dependencies=[Depends(require_cron_secret)])
def send_digests(db: Session = Depends(get_db)):
    app_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    return asdict(job_service.send_digests(db, app_url))
