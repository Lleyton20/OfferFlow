from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import func, select

from app.api import auth as auth_api
from app.database import get_db
from app.main import app
from app.models.application import Application
from app.models.user import User
from app.services import demo_service


@pytest.fixture(autouse=True)
def _reset_demo_limiter():
    auth_api.demo_limiter.reset()
    yield
    auth_api.demo_limiter.reset()


@pytest.fixture()
def db(client):
    session = next(app.dependency_overrides[get_db]())
    yield session
    session.close()


def _start_demo(client, ip="203.0.113.7"):
    return client.post("/auth/demo", headers={"X-Forwarded-For": ip})


def test_demo_creates_a_signed_in_account_with_a_realistic_search(client):
    response = _start_demo(client)
    assert response.status_code == 201
    user = response.json()
    assert user["is_demo"] is True
    assert user["digest_enabled"] is False
    assert user["email"].endswith("@demo.offerflow.invalid")

    applications = client.get("/applications").json()
    assert len(applications) == 12
    statuses = {a["status"] for a in applications}
    assert {"Applied", "Offer", "Rejected", "Final Round"} <= statuses
    offer = next(a for a in applications if a["status"] == "Offer")
    assert [e["status"] for e in offer["status_history"]][-1] == "Offer"
    assert len(offer["status_history"]) == 5

    resumes = client.get("/resumes").json()
    assert len(resumes) == 2
    assert all(r["ai_feedback_status"] == "ok" for r in resumes)
    # Scored by the real ATS checker, so the stronger draft really scores higher.
    v4 = next(r for r in resumes if r["filename"].endswith("v4.pdf"))
    v2 = next(r for r in resumes if r["filename"].endswith("v2.pdf"))
    assert v4["ats_score"] > v2["ats_score"]

    assert len(client.get("/contacts").json()) == 4
    interviews = client.get("/interviews").json()
    assert len(interviews) == 3
    assert any(i["mock_questions"] for i in interviews)
    assert len(client.get("/assistant/messages").json()) == 2


def test_each_visitor_gets_a_separate_demo(client):
    first = _start_demo(client).json()
    client.cookies.clear()
    second = _start_demo(client).json()
    assert first["id"] != second["id"]
    assert len(client.get("/applications").json()) == 12


def test_demo_accounts_cannot_use_paid_ai_features(client):
    _start_demo(client)
    resume_id = client.get("/resumes").json()[0]["id"]
    interview_id = client.get("/interviews").json()[0]["id"]

    for response in (
        client.post("/assistant/messages", json={"content": "Hi"}),
        client.post(f"/resumes/{resume_id}/tailor", json={"job_description": "Python role"}),
        client.post(f"/interviews/{interview_id}/generate-questions"),
    ):
        assert response.status_code == 403
        assert "free account" in response.json()["detail"]


def test_demo_resume_upload_scores_without_calling_ai(client, monkeypatch):
    from app.services import ai_feedback_service

    def fail(*args, **kwargs):
        raise AssertionError("AI must not be called for demo accounts")

    monkeypatch.setattr(ai_feedback_service, "get_ai_feedback", fail)
    _start_demo(client)
    response = client.post(
        "/resumes",
        files={
            "file": ("resume.txt", b"Jordan Rivera\nExperience\nPython, SQL, React", "text/plain")
        },
    )
    assert response.status_code == 201
    assert response.json()["ai_feedback_status"] == "requires_account"


def test_demo_data_is_editable_including_seeded_resumes(client):
    _start_demo(client)
    resume_id = client.get("/resumes").json()[0]["id"]
    assert client.delete(f"/resumes/{resume_id}").status_code == 204
    app_id = client.get("/applications").json()[0]["id"]
    assert client.patch(f"/applications/{app_id}", json={"status": "Offer"}).status_code == 200


def test_demo_creation_is_rate_limited_per_ip(client):
    for _ in range(5):
        assert _start_demo(client, ip="198.51.100.1").status_code == 201
    blocked = _start_demo(client, ip="198.51.100.1")
    assert blocked.status_code == 429
    assert "Retry-After" in blocked.headers
    assert _start_demo(client, ip="198.51.100.2").status_code == 201


def test_purge_removes_only_expired_demo_accounts(client, db):
    client.post(
        "/auth/register",
        json={
            "email": "real@example.com",
            "password": "password123",
            "full_name": "Real",
            "birthday": "2000-01-01",
        },
    )
    client.post(
        "/applications", json={"company": "Acme", "role": "Intern", "date_applied": "2026-10-01"}
    )
    client.cookies.clear()
    old_id = _start_demo(client).json()["id"]
    client.cookies.clear()
    fresh_id = _start_demo(client).json()["id"]

    old = db.get(User, old_id)
    old.created_at = datetime.now(timezone.utc) - timedelta(hours=25)
    db.commit()

    assert demo_service.purge_expired_demos(db) == 1
    db.expire_all()
    assert db.get(User, old_id) is None
    assert db.get(User, fresh_id) is not None
    assert (
        db.scalar(
            select(func.count()).select_from(Application).where(Application.user_id == old_id)
        )
        == 0
    )
    real = db.scalar(select(User).where(User.email == "real@example.com"))
    assert real is not None
    assert (
        db.scalar(
            select(func.count()).select_from(Application).where(Application.user_id == real.id)
        )
        == 1
    )


def test_demo_saves_discovered_jobs_when_there_are_some(client, monkeypatch):
    from app.services import job_sources
    from tests.test_jobs import _raw, _source

    monkeypatch.setenv("CRON_SECRET", "s")
    monkeypatch.setattr(
        job_sources,
        "configured_sources",
        lambda: [
            _source(
                "greenhouse:acme", [_raw("acme:1", "SWE Intern"), _raw("acme:2", "Data Intern")]
            )
        ],
    )
    refreshed = client.post("/internal/jobs/refresh", headers={"X-Cron-Secret": "s"}).json()
    assert refreshed["demo_accounts_purged"] == 0
    _start_demo(client)
    assert len(client.get("/jobs/saved").json()) == 2
