from datetime import datetime, timedelta, timezone

import pytest

from app.services import email_service, job_sources
from app.services.job_sources import RawJob, SourceFetch

NOW = datetime.now(timezone.utc)


def _raw(external_id, title, company="Acme", job_type="internship", **extra):
    return RawJob(
        source=extra.pop("source", "greenhouse"),
        external_id=external_id,
        company=company,
        title=title,
        url=extra.pop("url", f"https://jobs.example.com/{external_id}"),
        job_type=job_type,
        posted_at=extra.pop("posted_at", NOW - timedelta(days=1)),
        **extra,
    )


def _source(name, jobs):
    return SourceFetch(name=name, run=lambda client, now: list(jobs))


def _failing_source(name):
    def run(client, now):
        raise RuntimeError("upstream is down")

    return SourceFetch(name=name, run=run)


@pytest.fixture()
def cron(monkeypatch):
    monkeypatch.setenv("CRON_SECRET", "test-secret")
    return {"X-Cron-Secret": "test-secret"}


@pytest.fixture()
def with_sources(monkeypatch):
    def install(*sources):
        monkeypatch.setattr(job_sources, "configured_sources", lambda: list(sources))

    return install


def _refresh(client, cron):
    response = client.post("/internal/jobs/refresh", headers=cron)
    assert response.status_code == 200
    return response.json()


# --- Parsing -----------------------------------------------------------------


@pytest.mark.parametrize(
    ("title", "expected"),
    [
        ("Software Engineer Intern", "internship"),
        ("Summer 2027 Co-op, Data", "internship"),
        ("New Grad Software Engineer", "new_grad"),
        ("Software Engineer, Early Career", "new_grad"),
        ("Product Design Fellowship", "fellowship"),
        ("Senior Staff Engineer", None),
        ("Internal Tools Engineer", None),
    ],
)
def test_classify(title, expected):
    assert job_sources.classify(title) == expected


def test_parse_simplify_keeps_active_recent_listings():
    listings = [
        {
            "id": "a",
            "active": True,
            "is_visible": True,
            "title": "SWE Intern",
            "company_name": "Acme",
            "url": "https://a.example",
            "locations": ["NYC", "Remote"],
            "category": "Software",
            "terms": ["Summer 2027"],
            "date_posted": NOW.timestamp(),
        },
        {
            "id": "b",
            "active": False,
            "is_visible": True,
            "title": "Closed",
            "company_name": "Acme",
            "url": "https://b.example",
            "date_posted": NOW.timestamp(),
        },
        {
            "id": "c",
            "active": True,
            "is_visible": True,
            "title": "Old",
            "company_name": "Acme",
            "url": "https://c.example",
            "date_posted": (NOW - timedelta(days=90)).timestamp(),
        },
    ]
    jobs = list(job_sources.parse_simplify(listings, "internship", NOW))
    assert [j.external_id for j in jobs] == ["internship:a"]
    assert jobs[0].location == "NYC, Remote"
    assert jobs[0].tags == ["Summer 2027"]


def test_parse_greenhouse_filters_to_early_career_and_strips_html():
    payload = {
        "jobs": [
            {
                "id": 1,
                "title": "Software Engineer Intern",
                "absolute_url": "https://gh/1",
                "company_name": "Stripe",
                "location": {"name": "Remote"},
                "first_published": NOW.isoformat(),
                "content": "&lt;p&gt;Build &amp;amp; ship&lt;/p&gt;",
            },
            {
                "id": 2,
                "title": "Staff Engineer",
                "absolute_url": "https://gh/2",
                "first_published": NOW.isoformat(),
            },
        ]
    }
    jobs = list(job_sources.parse_greenhouse("stripe", payload, NOW))
    assert len(jobs) == 1
    assert jobs[0].external_id == "stripe:1"
    assert jobs[0].description == "Build & ship"


def test_parse_lever_and_ashby():
    lever = [
        {
            "id": "x",
            "text": "Data Science Intern",
            "hostedUrl": "https://lever/x",
            "createdAt": NOW.timestamp() * 1000,
            "categories": {"location": "NYC", "team": "Data"},
            "descriptionPlain": "SQL and Python",
        }
    ]
    ashby = {
        "jobs": [
            {
                "id": "y",
                "title": "New Grad Engineer",
                "jobUrl": "https://ashby/y",
                "publishedAt": NOW.isoformat(),
                "location": "SF",
                "isListed": True,
            },
            {"id": "z", "title": "Hidden Intern", "jobUrl": "https://ashby/z", "isListed": False},
        ]
    }
    assert [j.job_type for j in job_sources.parse_lever("palantir", lever, NOW)] == ["internship"]
    assert [j.external_id for j in job_sources.parse_ashby("ramp", ashby, NOW)] == ["ramp:y"]


def test_configured_sources_reads_job_boards(monkeypatch):
    monkeypatch.setenv("JOB_BOARDS", "greenhouse:stripe, lever:palantir, bogus:thing, ashby:")
    names = [s.name for s in job_sources.configured_sources()]
    assert "greenhouse:stripe" in names and "lever:palantir" in names
    assert not any(n.startswith("bogus") for n in names)


# --- Refresh -----------------------------------------------------------------


def test_internal_endpoints_require_the_cron_secret(client, monkeypatch):
    monkeypatch.delenv("CRON_SECRET", raising=False)
    assert client.post("/internal/jobs/refresh").status_code == 503
    monkeypatch.setenv("CRON_SECRET", "s3cret")
    assert client.post("/internal/jobs/refresh").status_code == 401
    assert (
        client.post("/internal/jobs/refresh", headers={"X-Cron-Secret": "wrong"}).status_code == 401
    )


def test_refresh_adds_updates_and_retires_postings(client, cron, with_sources):
    with_sources(
        _source("greenhouse:acme", [_raw("acme:1", "SWE Intern"), _raw("acme:2", "Data Intern")]),
        _failing_source("lever:broken"),
    )
    first = _refresh(client, cron)
    assert first["added"] == 2
    assert first["sources"]["lever:broken"].startswith("error")

    with_sources(_source("greenhouse:acme", [_raw("acme:1", "SWE Intern (Summer 2027)")]))
    second = _refresh(client, cron)
    assert second == {**second, "added": 0, "updated": 1, "deactivated": 1}


def test_refresh_skips_the_same_url_from_a_second_source(client, cron, with_sources):
    url = "https://boards.greenhouse.io/acme/jobs/1"
    with_sources(
        _source(
            "internship:feed", [_raw("internship:a", "SWE Intern", source="simplify", url=url)]
        ),
        _source("greenhouse:acme", [_raw("acme:1", "SWE Intern", url=url + "?gh_src=x")]),
    )
    assert _refresh(client, cron)["added"] == 1


# --- Recommendations ---------------------------------------------------------


def _seed(client, cron, with_sources):
    with_sources(
        _source(
            "greenhouse:mix",
            [
                _raw(
                    "mix:1",
                    "Software Engineer Intern",
                    company="Stripe",
                    description="Python, React and SQL on payments.",
                ),
                _raw("mix:2", "Mechanical Engineering Intern", company="Tesla"),
                _raw("mix:3", "Software Engineer, New Grad", company="Ramp", job_type="new_grad"),
                _raw("mix:4", "Policy Fellowship", company="Anthropic", job_type="fellowship"),
                _raw("mix:5", "Backend Software Engineer Intern", company="Stripe"),
                _raw("mix:6", "Frontend Software Engineer Intern", company="Stripe"),
            ],
        )
    )
    _refresh(client, cron)


def _recommendations(client, **params):
    response = client.get("/jobs/recommendations", params=params)
    assert response.status_code == 200
    return response.json()


def test_recommendations_without_any_signal_rank_by_recency(auth_client, cron, with_sources):
    _seed(auth_client, cron, with_sources)
    assert len(_recommendations(auth_client)) >= 4


def test_recommendations_follow_keywords_and_explain_why(auth_client, cron, with_sources):
    _seed(auth_client, cron, with_sources)
    prefs = auth_client.patch(
        "/auth/me/preferences", json={"job_keywords": ["software", " python ", "python", ""]}
    )
    assert prefs.json()["job_keywords"] == ["python", "software"]

    recs = _recommendations(auth_client)
    assert recs[0]["job"]["company"] == "Stripe"
    assert any("python" in reason for reason in recs[0]["reasons"])
    assert all(r["job"]["company"] != "Tesla" for r in recs)
    assert sum(r["job"]["company"] == "Stripe" for r in recs) <= 2


def test_recommendations_filter_by_type_and_grad_year(client, cron, with_sources):
    client.post(
        "/auth/register",
        json={
            "email": "senior@example.com",
            "password": "password123",
            "full_name": "S",
            "birthday": "2003-01-01",
            "grad_year": datetime.now().year,
        },
    )
    _seed(client, cron, with_sources)
    types = {r["job"]["job_type"] for r in _recommendations(client)}
    assert types <= {"new_grad", "fellowship"}
    assert {r["job"]["job_type"] for r in _recommendations(client, job_type="internship")} == {
        "internship"
    }


def test_save_dismiss_and_clear(auth_client, cron, with_sources):
    _seed(auth_client, cron, with_sources)
    job_id = _recommendations(auth_client)[0]["job"]["id"]

    assert auth_client.post(f"/jobs/{job_id}/save").status_code == 204
    assert [j["id"] for j in auth_client.get("/jobs/saved").json()] == [job_id]
    assert (
        next(r for r in _recommendations(auth_client) if r["job"]["id"] == job_id)["state"]
        == "saved"
    )

    assert auth_client.post(f"/jobs/{job_id}/dismiss").status_code == 204
    assert all(r["job"]["id"] != job_id for r in _recommendations(auth_client))
    assert auth_client.get("/jobs/saved").json() == []

    assert auth_client.delete(f"/jobs/{job_id}/interaction").status_code == 204
    assert any(r["job"]["id"] == job_id for r in _recommendations(auth_client))
    assert auth_client.post("/jobs/99999/save").status_code == 404


def test_applying_through_capture_removes_the_job_from_recommendations(
    auth_client, cron, with_sources
):
    _seed(auth_client, cron, with_sources)
    target = _recommendations(auth_client)[0]["job"]
    auth_client.post(
        "/capture",
        json={"company": target["company"], "role": "Anything", "job_url": target["url"]},
    )
    assert all(r["job"]["id"] != target["id"] for r in _recommendations(auth_client))


def test_stats(auth_client, cron, with_sources):
    _seed(auth_client, cron, with_sources)
    stats = auth_client.get("/jobs/stats").json()
    assert stats["active"] == 6
    assert stats["new_this_week"] == 6
    assert stats["by_type"]["internship"] == 4
    assert stats["last_refreshed_at"] is not None


# --- Digests -----------------------------------------------------------------


def test_digest_is_skipped_when_email_is_not_configured(auth_client, cron, monkeypatch):
    monkeypatch.setattr(email_service, "SMTP_HOST", None)
    result = auth_client.post("/internal/digests/send", headers=cron).json()
    assert result["email_disabled"] is True


def test_digest_emails_new_matches_once(auth_client, cron, with_sources, monkeypatch):
    sent = []

    class FakeSMTP:
        def __init__(self, host, port):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

        def starttls(self):
            pass

        def login(self, user, password):
            pass

        def send_message(self, message):
            sent.append(message)

    monkeypatch.setattr(email_service, "SMTP_HOST", "smtp.example.com")
    monkeypatch.setattr(email_service, "SMTP_USER", "mailer@example.com")
    monkeypatch.setattr(email_service, "SMTP_PASSWORD", "app-password")
    monkeypatch.setattr(email_service.smtplib, "SMTP", FakeSMTP)

    _seed(auth_client, cron, with_sources)
    first = auth_client.post("/internal/digests/send", headers=cron).json()
    assert first["sent"] == 1
    assert sent[0]["To"] == "student@example.com"
    assert "picked for you" in sent[0]["Subject"]
    assert "Stripe" in sent[0].get_body(preferencelist=("plain",)).get_content()

    # Nothing new since the last digest, so no second email.
    second = auth_client.post("/internal/digests/send", headers=cron).json()
    assert second["sent"] == 0 and second["skipped_no_matches"] == 1


def test_users_can_opt_out_of_digests(auth_client):
    response = auth_client.patch("/auth/me/preferences", json={"digest_enabled": False})
    assert response.json()["digest_enabled"] is False
