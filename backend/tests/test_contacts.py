def _sample_contact():
    return {
        "name": "Alex Recruiter",
        "company": "Netflix",
        "role": "Technical Recruiter",
        "email": "alex@netflix.com",
        "linkedin_url": "https://linkedin.com/in/alexrecruiter",
        "relationship_type": "Recruiter",
        "notes": "Met at career fair.",
        "last_contacted_date": "2026-08-01",
        "follow_up_date": "2026-09-01",
    }


def test_contacts_require_auth(client):
    assert client.get("/contacts").status_code == 401


def test_create_and_list_contact(auth_client):
    response = auth_client.post("/contacts", json=_sample_contact())
    assert response.status_code == 201
    created = response.json()
    assert created["name"] == "Alex Recruiter"
    assert created["interactions"] == []

    response = auth_client.get("/contacts")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_contact(auth_client):
    created = auth_client.post("/contacts", json=_sample_contact()).json()

    response = auth_client.get(f"/contacts/{created['id']}")
    assert response.status_code == 200
    assert response.json()["company"] == "Netflix"


def test_get_contact_not_found(auth_client):
    assert auth_client.get("/contacts/999").status_code == 404


def test_update_contact(auth_client):
    created = auth_client.post("/contacts", json=_sample_contact()).json()

    response = auth_client.patch(
        f"/contacts/{created['id']}", json={"relationship_type": "Hiring Manager"}
    )
    assert response.status_code == 200
    assert response.json()["relationship_type"] == "Hiring Manager"
    assert response.json()["name"] == "Alex Recruiter"


def test_delete_contact(auth_client):
    created = auth_client.post("/contacts", json=_sample_contact()).json()

    assert auth_client.delete(f"/contacts/{created['id']}").status_code == 204
    assert auth_client.get(f"/contacts/{created['id']}").status_code == 404


def test_add_and_list_interactions(auth_client):
    created = auth_client.post("/contacts", json=_sample_contact()).json()

    response = auth_client.post(
        f"/contacts/{created['id']}/interactions",
        json={"date": "2026-08-15", "note": "Coffee chat about the team."},
    )
    assert response.status_code == 201
    assert response.json()["note"] == "Coffee chat about the team."

    fetched = auth_client.get(f"/contacts/{created['id']}").json()
    assert len(fetched["interactions"]) == 1


def test_delete_interaction(auth_client):
    created = auth_client.post("/contacts", json=_sample_contact()).json()
    interaction = auth_client.post(
        f"/contacts/{created['id']}/interactions",
        json={"date": "2026-08-15", "note": "Follow-up email sent."},
    ).json()

    response = auth_client.delete(
        f"/contacts/{created['id']}/interactions/{interaction['id']}"
    )
    assert response.status_code == 204

    fetched = auth_client.get(f"/contacts/{created['id']}").json()
    assert fetched["interactions"] == []


def test_delete_interaction_not_found(auth_client):
    created = auth_client.post("/contacts", json=_sample_contact()).json()
    assert auth_client.delete(f"/contacts/{created['id']}/interactions/999").status_code == 404


def test_contact_isolated_between_users(client):
    client.post("/auth/register", json={"email": "contactA@example.com", "password": "password123"})
    created = client.post("/contacts", json=_sample_contact()).json()

    client.post("/auth/register", json={"email": "contactB@example.com", "password": "password123"})

    assert client.get(f"/contacts/{created['id']}").status_code == 404
    assert client.get("/contacts").json() == []
    assert (
        client.post(
            f"/contacts/{created['id']}/interactions",
            json={"date": "2026-08-15", "note": "hi"},
        ).status_code
        == 404
    )
