def test_assistant_requires_auth(client):
    assert client.get("/assistant/messages").status_code == 401


def test_send_message_and_list(auth_client):
    response = auth_client.post("/assistant/messages", json={"content": "What should I do next?"})
    assert response.status_code == 201
    assistant_reply = response.json()
    assert assistant_reply["role"] == "assistant"
    assert assistant_reply["content"]

    history = auth_client.get("/assistant/messages").json()
    assert len(history) == 2
    assert history[0]["role"] == "user"
    assert history[0]["content"] == "What should I do next?"
    assert history[1]["role"] == "assistant"


def test_assistant_degrades_without_api_key(auth_client):
    response = auth_client.post("/assistant/messages", json={"content": "Hello"})
    assert response.status_code == 201
    assert "isn't configured" in response.json()["content"]


def test_clear_messages(auth_client):
    auth_client.post("/assistant/messages", json={"content": "Hi"})
    assert len(auth_client.get("/assistant/messages").json()) == 2

    assert auth_client.delete("/assistant/messages").status_code == 204
    assert auth_client.get("/assistant/messages").json() == []


def test_assistant_context_reflects_real_data(auth_client):
    auth_client.post(
        "/applications",
        json={
            "company": "Netflix",
            "role": "Backend Intern",
            "date_applied": "2026-08-01",
            "status": "Technical Interview",
        },
    )
    # Not asserting on AI output content (no API key in tests) — just that
    # sending a message with real data present doesn't error.
    response = auth_client.post("/assistant/messages", json={"content": "How's my search going?"})
    assert response.status_code == 201


def test_messages_isolated_between_users(client):
    client.post("/auth/register", json={"email": "chatA@example.com", "password": "password123", "full_name": "A", "birthday": "2000-01-01"})
    client.post("/assistant/messages", json={"content": "secret question"})

    client.post("/auth/register", json={"email": "chatB@example.com", "password": "password123", "full_name": "B", "birthday": "2000-01-01"})
    assert client.get("/assistant/messages").json() == []
