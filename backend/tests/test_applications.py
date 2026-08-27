def _sample_application():
    return {
        "company": "Google",
        "role": "Software Engineering Intern",
        "date_applied": "2026-06-18",
        "status": "Applied",
        "referral_used": True,
        "contact_person": "John Smith",
        "job_description": "Build scalable software systems.",
        "match_score": 7,
        "strengths": ["Python", "React"],
        "weaknesses": ["System design"],
        "notes": "Need to follow up about referral.",
    }


def test_applications_require_auth(client):
    response = client.get("/applications")
    assert response.status_code == 401


def test_create_and_list_application(auth_client):
    response = auth_client.post("/applications", json=_sample_application())
    assert response.status_code == 201
    created = response.json()
    assert created["company"] == "Google"
    assert created["id"] is not None

    response = auth_client.get("/applications")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_application(auth_client):
    created = auth_client.post("/applications", json=_sample_application()).json()

    response = auth_client.get(f"/applications/{created['id']}")
    assert response.status_code == 200
    assert response.json()["company"] == "Google"


def test_get_application_not_found(auth_client):
    response = auth_client.get("/applications/999")
    assert response.status_code == 404


def test_update_application_status(auth_client):
    created = auth_client.post("/applications", json=_sample_application()).json()

    response = auth_client.patch(
        f"/applications/{created['id']}", json={"status": "Technical Interview"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "Technical Interview"
    assert response.json()["company"] == "Google"


def test_delete_application(auth_client):
    created = auth_client.post("/applications", json=_sample_application()).json()

    response = auth_client.delete(f"/applications/{created['id']}")
    assert response.status_code == 204

    response = auth_client.get(f"/applications/{created['id']}")
    assert response.status_code == 404


def test_application_isolated_between_users(client):
    client.post("/auth/register", json={"email": "userA@example.com", "password": "password123"})
    created = client.post("/applications", json=_sample_application()).json()

    client.post("/auth/register", json={"email": "userB@example.com", "password": "password123"})

    assert client.get(f"/applications/{created['id']}").status_code == 404
    assert (
        client.patch(f"/applications/{created['id']}", json={"status": "Offer"}).status_code
        == 404
    )
    assert client.delete(f"/applications/{created['id']}").status_code == 404
    assert client.get("/applications").json() == []
