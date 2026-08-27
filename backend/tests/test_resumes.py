SAMPLE_RESUME = """
Jane Student
jane.student@example.com | (555) 123-4567

EDUCATION
State University — B.S. Computer Science, expected 2027

EXPERIENCE
Software Engineering Intern, Acme Corp (Summer 2025)
- Improved API response time by 30% by optimizing database queries
- Built a React dashboard used by 500 internal users

SKILLS
Python, React, SQL, Git
""".strip()

SAMPLE_JOB_DESCRIPTION = "Looking for an intern experienced with Python, React, and SQL."


def _upload(client, text=SAMPLE_RESUME, job_description=SAMPLE_JOB_DESCRIPTION, filename="resume.txt"):
    return client.post(
        "/resumes",
        files={"file": (filename, text.encode("utf-8"), "text/plain")},
        data={"job_description": job_description} if job_description is not None else {},
    )


def test_resumes_require_auth(client):
    response = client.get("/resumes")
    assert response.status_code == 401


def test_upload_and_score_resume(auth_client):
    response = _upload(auth_client)
    assert response.status_code == 201
    body = response.json()
    assert body["filename"] == "resume.txt"
    assert 0 <= body["ats_score"] <= 100
    assert "python" in body["matched_keywords"]
    assert body["ai_feedback_status"] in {"not_configured", "ok", "error"}
    assert any(check["check"] == "Contact info" and check["passed"] for check in body["ats_checks"])


def test_upload_without_job_description(auth_client):
    response = _upload(auth_client, job_description=None)
    assert response.status_code == 201
    body = response.json()
    assert body["matched_keywords"] == []
    assert body["missing_keywords"] == []


def test_upload_rejects_unsupported_content_type(auth_client):
    response = auth_client.post(
        "/resumes",
        files={"file": ("resume.docx", b"not a real docx", "application/msword")},
    )
    assert response.status_code == 400


def test_list_and_get_resume(auth_client):
    created = _upload(auth_client).json()

    listed = auth_client.get("/resumes")
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    fetched = auth_client.get(f"/resumes/{created['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["id"] == created["id"]


def test_get_resume_not_found(auth_client):
    assert auth_client.get("/resumes/999").status_code == 404


def test_delete_resume(auth_client):
    created = _upload(auth_client).json()

    response = auth_client.delete(f"/resumes/{created['id']}")
    assert response.status_code == 204
    assert auth_client.get(f"/resumes/{created['id']}").status_code == 404


def test_resume_isolated_between_users(client):
    client.post("/auth/register", json={"email": "resA@example.com", "password": "password123", "full_name": "Test User", "birthday": "2000-01-01"})
    created = _upload(client).json()

    client.post("/auth/register", json={"email": "resB@example.com", "password": "password123", "full_name": "Test User", "birthday": "2000-01-01"})

    assert client.get(f"/resumes/{created['id']}").status_code == 404
    assert client.get("/resumes").json() == []
