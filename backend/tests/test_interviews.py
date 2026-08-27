def _sample_application():
    return {
        "company": "Netflix",
        "role": "Backend Intern",
        "date_applied": "2026-08-01",
        "status": "Technical Interview",
        "job_description": "Build scalable systems using Python and distributed systems.",
    }


def _sample_session(**overrides):
    data = {
        "title": "Technical Screen — Netflix",
        "interview_type": "Technical",
        "scheduled_date": "2026-09-01",
        "prep_notes": "Review system design basics.",
    }
    data.update(overrides)
    return data


def test_interviews_require_auth(client):
    assert client.get("/interviews").status_code == 401


def test_create_and_list_session(auth_client):
    response = auth_client.post("/interviews", json=_sample_session())
    assert response.status_code == 201
    created = response.json()
    assert created["title"] == "Technical Screen — Netflix"
    assert created["status"] == "Scheduled"
    assert created["mock_questions"] == []

    response = auth_client.get("/interviews")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_session_not_found(auth_client):
    assert auth_client.get("/interviews/999").status_code == 404


def test_update_session_performance(auth_client):
    created = auth_client.post("/interviews", json=_sample_session()).json()

    response = auth_client.patch(
        f"/interviews/{created['id']}",
        json={"status": "Completed", "performance_rating": 4, "performance_notes": "Went well."},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "Completed"
    assert body["performance_rating"] == 4
    assert body["performance_notes"] == "Went well."


def test_delete_session(auth_client):
    created = auth_client.post("/interviews", json=_sample_session()).json()

    assert auth_client.delete(f"/interviews/{created['id']}").status_code == 204
    assert auth_client.get(f"/interviews/{created['id']}").status_code == 404


def test_session_can_link_an_application(auth_client):
    application = auth_client.post("/applications", json=_sample_application()).json()

    created = auth_client.post(
        "/interviews", json=_sample_session(application_id=application["id"])
    ).json()
    assert created["application_id"] == application["id"]


def test_session_rejects_another_users_application(client):
    client.post("/auth/register", json={"email": "ivA@example.com", "password": "password123", "full_name": "A", "birthday": "2000-01-01"})
    application = client.post("/applications", json=_sample_application()).json()

    client.post("/auth/register", json={"email": "ivB@example.com", "password": "password123", "full_name": "B", "birthday": "2000-01-01"})
    response = client.post("/interviews", json=_sample_session(application_id=application["id"]))
    assert response.status_code == 400


def test_generate_questions_degrades_without_api_key(auth_client):
    created = auth_client.post("/interviews", json=_sample_session()).json()

    response = auth_client.post(f"/interviews/{created['id']}/generate-questions")
    assert response.status_code == 200
    body = response.json()
    assert body["ai_feedback_status"] in {"not_configured", "ok", "error"}
    if body["ai_feedback_status"] != "ok":
        assert body["mock_questions"] == []


def test_session_isolated_between_users(client):
    client.post("/auth/register", json={"email": "ivC@example.com", "password": "password123", "full_name": "C", "birthday": "2000-01-01"})
    created = client.post("/interviews", json=_sample_session()).json()

    client.post("/auth/register", json={"email": "ivD@example.com", "password": "password123", "full_name": "D", "birthday": "2000-01-01"})

    assert client.get(f"/interviews/{created['id']}").status_code == 404
    assert client.get("/interviews").json() == []
