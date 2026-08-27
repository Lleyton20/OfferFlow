def test_register_sets_session_cookie(client):
    response = client.post(
        "/auth/register", json={"email": "new@example.com", "password": "password123", "full_name": "Test User", "birthday": "2000-01-01"}
    )
    assert response.status_code == 201
    assert response.json()["email"] == "new@example.com"
    assert "access_token" in response.cookies


def test_register_duplicate_email_rejected(client):
    client.post("/auth/register", json={"email": "dup@example.com", "password": "password123", "full_name": "Test User", "birthday": "2000-01-01"})
    response = client.post(
        "/auth/register", json={"email": "dup@example.com", "password": "password123", "full_name": "Test User", "birthday": "2000-01-01"}
    )
    assert response.status_code == 400


def test_me_requires_auth(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_login_and_me(client):
    client.post("/auth/register", json={"email": "me@example.com", "password": "password123", "full_name": "Test User", "birthday": "2000-01-01"})
    client.cookies.clear()

    login = client.post(
        "/auth/login", json={"email": "me@example.com", "password": "password123"}
    )
    assert login.status_code == 200

    me = client.get("/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == "me@example.com"


def test_login_wrong_password(client):
    client.post("/auth/register", json={"email": "wrong@example.com", "password": "password123", "full_name": "Test User", "birthday": "2000-01-01"})
    client.cookies.clear()

    response = client.post(
        "/auth/login", json={"email": "wrong@example.com", "password": "nope12345"}
    )
    assert response.status_code == 401


def test_logout_clears_session(client):
    client.post("/auth/register", json={"email": "logout@example.com", "password": "password123", "full_name": "Test User", "birthday": "2000-01-01"})
    assert client.get("/auth/me").status_code == 200

    logout = client.post("/auth/logout")
    assert logout.status_code == 204

    assert client.get("/auth/me").status_code == 401


def test_register_requires_full_name_and_birthday(client):
    response = client.post(
        "/auth/register", json={"email": "incomplete@example.com", "password": "password123"}
    )
    assert response.status_code == 422


def test_register_rejects_future_birthday(client):
    response = client.post(
        "/auth/register",
        json={
            "email": "future@example.com",
            "password": "password123",
            "full_name": "Time Traveler",
            "birthday": "2999-01-01",
        },
    )
    assert response.status_code == 422


def test_forgot_password_always_returns_204(client):
    # No account exists for this email — must not leak that via the response.
    response = client.post("/auth/forgot-password", json={"email": "nobody@example.com"})
    assert response.status_code == 204


def test_forgot_password_without_smtp_configured_does_not_error(client):
    client.post(
        "/auth/register",
        json={"email": "reset1@example.com", "password": "password123", "full_name": "R One", "birthday": "2000-01-01"},
    )
    response = client.post("/auth/forgot-password", json={"email": "reset1@example.com"})
    assert response.status_code == 204


def test_reset_password_with_invalid_token_rejected(client):
    response = client.post(
        "/auth/reset-password", json={"token": "not-a-real-token", "new_password": "newpassword123"}
    )
    assert response.status_code == 400


def test_full_reset_flow_with_smtp_mocked(client, monkeypatch):
    sent = {}

    class FakeSMTP:
        def __init__(self, host, port):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def starttls(self):
            pass

        def login(self, user, password):
            pass

        def send_message(self, message):
            sent["body"] = message.get_content()

    import app.services.email_service as email_service

    monkeypatch.setattr(email_service, "IS_CONFIGURED", True)
    monkeypatch.setattr(email_service.smtplib, "SMTP", FakeSMTP)

    client.post(
        "/auth/register",
        json={"email": "reset2@example.com", "password": "oldpassword123", "full_name": "R Two", "birthday": "2000-01-01"},
    )
    client.cookies.clear()

    forgot = client.post("/auth/forgot-password", json={"email": "reset2@example.com"})
    assert forgot.status_code == 204
    assert "reset-password?token=" in sent["body"]
    token = sent["body"].split("token=")[1].split("\n")[0].strip()

    reset = client.post(
        "/auth/reset-password", json={"token": token, "new_password": "newpassword123"}
    )
    assert reset.status_code == 204

    # Old password no longer works, new one does.
    assert client.post(
        "/auth/login", json={"email": "reset2@example.com", "password": "oldpassword123"}
    ).status_code == 401
    assert client.post(
        "/auth/login", json={"email": "reset2@example.com", "password": "newpassword123"}
    ).status_code == 200

    # Token is single-use.
    reused = client.post(
        "/auth/reset-password", json={"token": token, "new_password": "anotherpassword123"}
    )
    assert reused.status_code == 400


def test_register_stores_profile_fields(client):
    response = client.post(
        "/auth/register",
        json={
            "email": "profile@example.com",
            "password": "password123",
            "full_name": "Jordan Student",
            "birthday": "2003-05-14",
            "university": "Grambling State University",
            "grad_year": 2027,
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["full_name"] == "Jordan Student"
    assert body["birthday"] == "2003-05-14"
    assert body["university"] == "Grambling State University"
    assert body["grad_year"] == 2027
