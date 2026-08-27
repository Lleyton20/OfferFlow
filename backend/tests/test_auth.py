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
