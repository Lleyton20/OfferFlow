def _create_token(client):
    response = client.post("/tokens", json={"name": "Chrome"})
    assert response.status_code == 201
    return response.json()


def _bearer(token):
    return {"Authorization": f"Bearer {token}"}


CAPTURE = {
    "company": "Stripe",
    "role": "Software Engineer Intern",
    "job_url": "https://stripe.com/jobs/listing/swe-intern/123?utm_source=linkedin#apply",
    "job_description": "Build payments infrastructure in Python and Go.",
    "location": "San Francisco, CA",
    "source": "greenhouse",
    "date_applied": "2026-10-20",
    "contacts": [
        {"name": "Jordan Lee", "title": "University Recruiter"},
        {"name": "Sam Park", "title": "Engineering Manager, Payments"},
    ],
}


def test_token_is_shown_once_and_listed_by_prefix(auth_client):
    created = _create_token(auth_client)
    assert created["token"].startswith("of_")
    assert created["prefix"] == created["token"][:10]

    listed = auth_client.get("/tokens").json()
    assert len(listed) == 1
    assert "token" not in listed[0]
    assert listed[0]["last_used_at"] is None


def test_bearer_token_authenticates_without_cookie(auth_client):
    token = _create_token(auth_client)["token"]
    auth_client.cookies.clear()

    assert auth_client.get("/applications").status_code == 401
    response = auth_client.get("/applications", headers=_bearer(token))
    assert response.status_code == 200


def test_revoked_or_bogus_token_is_rejected(auth_client):
    created = _create_token(auth_client)
    assert auth_client.delete(f"/tokens/{created['id']}").status_code == 204
    auth_client.cookies.clear()

    assert auth_client.get("/applications", headers=_bearer(created["token"])).status_code == 401
    assert auth_client.get("/applications", headers=_bearer("of_not-a-token")).status_code == 401
    assert auth_client.get("/applications", headers=_bearer("garbage")).status_code == 401


def test_cannot_revoke_another_users_token(client):
    client.post(
        "/auth/register",
        json={
            "email": "a@example.com",
            "password": "password123",
            "full_name": "A",
            "birthday": "2000-01-01",
        },
    )
    token_id = client.post("/tokens", json={}).json()["id"]
    client.post(
        "/auth/register",
        json={
            "email": "b@example.com",
            "password": "password123",
            "full_name": "B",
            "birthday": "2000-01-01",
        },
    )
    assert client.delete(f"/tokens/{token_id}").status_code == 404


def test_capture_creates_application_and_contacts(auth_client):
    response = auth_client.post("/capture", json=CAPTURE)
    assert response.status_code == 201
    body = response.json()
    assert body["created"] is True
    assert body["contacts_added"] == 2

    application = body["application"]
    assert application["company"] == "Stripe"
    assert application["status"] == "Applied"
    assert application["source"] == "greenhouse"
    assert application["job_url"] == "https://stripe.com/jobs/listing/swe-intern/123"
    assert application["contact_person"] == "Jordan Lee"
    assert application["date_applied"] == "2026-10-20"

    contacts = {c["name"]: c for c in auth_client.get("/contacts").json()}
    assert contacts["Jordan Lee"]["relationship_type"] == "Recruiter"
    assert contacts["Sam Park"]["relationship_type"] == "Hiring Manager"
    assert contacts["Sam Park"]["company"] == "Stripe"


def test_capturing_the_same_job_twice_does_not_duplicate(auth_client):
    first = auth_client.post("/capture", json=CAPTURE).json()
    second = auth_client.post(
        "/capture",
        json={**CAPTURE, "job_url": "https://stripe.com/jobs/listing/swe-intern/123/"},
    )
    assert second.status_code == 200
    assert second.json()["created"] is False
    assert second.json()["contacts_added"] == 0
    assert second.json()["application"]["id"] == first["application"]["id"]
    assert len(auth_client.get("/applications").json()) == 1
    assert len(auth_client.get("/contacts").json()) == 2


def test_same_company_and_role_without_url_is_deduplicated(auth_client):
    payload = {"company": "Figma", "role": "Product Design Intern"}
    assert auth_client.post("/capture", json=payload).status_code == 201
    again = auth_client.post(
        "/capture", json={"company": " figma ", "role": "product design intern"}
    )
    assert again.json()["created"] is False


def test_capture_fills_gaps_without_overwriting_user_edits(auth_client):
    created = auth_client.post(
        "/capture",
        json={"company": "Ramp", "role": "SWE Intern", "job_url": "https://ramp.com/j/1"},
    ).json()
    app_id = created["application"]["id"]
    auth_client.patch(f"/applications/{app_id}", json={"location": "NYC (hybrid)"})

    updated = auth_client.post(
        "/capture",
        json={
            "company": "Ramp",
            "role": "SWE Intern",
            "job_url": "https://ramp.com/j/1",
            "job_description": "Full description",
            "location": "New York, NY",
        },
    ).json()["application"]
    assert updated["job_description"] == "Full description"
    assert updated["location"] == "NYC (hybrid)"


def test_capture_works_with_a_token_from_the_extension(auth_client):
    token = _create_token(auth_client)["token"]
    auth_client.cookies.clear()
    response = auth_client.post("/capture", json=CAPTURE, headers=_bearer(token))
    assert response.status_code == 201
    listed = auth_client.get("/tokens", headers=_bearer(token)).json()
    assert listed[0]["last_used_at"] is not None


def test_capture_validates_input(auth_client):
    assert auth_client.post("/capture", json={"company": "", "role": "x"}).status_code == 422
    assert (
        auth_client.post(
            "/capture", json={"company": "x", "role": "y", "date_applied": "10/20/2026"}
        ).status_code
        == 422
    )
