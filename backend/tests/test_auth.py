def test_register_sets_session_cookie(client):
    response = client.post(
        "/auth/register", json={"email": "new@example.com", "password": "password123"}
    )
    assert response.status_code == 201
    assert response.json()["email"] == "new@example.com"
    assert "access_token" in response.cookies


def test_register_duplicate_email_rejected(client):
    client.post("/auth/register", json={"email": "dup@example.com", "password": "password123"})
    response = client.post(
        "/auth/register", json={"email": "dup@example.com", "password": "password123"}
    )
    assert response.status_code == 400


def test_me_requires_auth(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_login_and_me(client):
    client.post("/auth/register", json={"email": "me@example.com", "password": "password123"})
    client.cookies.clear()

    login = client.post(
        "/auth/login", json={"email": "me@example.com", "password": "password123"}
    )
    assert login.status_code == 200

    me = client.get("/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == "me@example.com"


def test_login_wrong_password(client):
    client.post("/auth/register", json={"email": "wrong@example.com", "password": "password123"})
    client.cookies.clear()

    response = client.post(
        "/auth/login", json={"email": "wrong@example.com", "password": "nope12345"}
    )
    assert response.status_code == 401


def test_logout_clears_session(client):
    client.post("/auth/register", json={"email": "logout@example.com", "password": "password123"})
    assert client.get("/auth/me").status_code == 200

    logout = client.post("/auth/logout")
    assert logout.status_code == 204

    assert client.get("/auth/me").status_code == 401
