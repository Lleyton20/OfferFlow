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


def test_create_and_list_application(client):
    response = client.post("/applications", json=_sample_application())
    assert response.status_code == 201
    created = response.json()
    assert created["company"] == "Google"
    assert created["id"] is not None

    response = client.get("/applications")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_application(client):
    created = client.post("/applications", json=_sample_application()).json()

    response = client.get(f"/applications/{created['id']}")
    assert response.status_code == 200
    assert response.json()["company"] == "Google"


def test_get_application_not_found(client):
    response = client.get("/applications/999")
    assert response.status_code == 404


def test_update_application_status(client):
    created = client.post("/applications", json=_sample_application()).json()

    response = client.patch(
        f"/applications/{created['id']}", json={"status": "Technical Interview"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "Technical Interview"
    assert response.json()["company"] == "Google"


def test_delete_application(client):
    created = client.post("/applications", json=_sample_application()).json()

    response = client.delete(f"/applications/{created['id']}")
    assert response.status_code == 204

    response = client.get(f"/applications/{created['id']}")
    assert response.status_code == 404
