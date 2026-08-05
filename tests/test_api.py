import pytest
from fastapi.testclient import TestClient
from src.api.server import app

client = TestClient(app)

def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "db": "connected"}

def test_voice_parse():
    payload = {"transcript": "Left neck pain is 6 out of 10 after morning physio"}
    response = client.post("/api/v1/voice/parse", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["parsed"]["symptom"] == "neck pain"
    assert data["parsed"]["side"] == "left"
    assert data["parsed"]["severity"] == 6

def test_push_notification(monkeypatch):
    # Mock send_push_notification to avoid actual network calls
    def mock_send(*args, **kwargs):
        return True
    
    monkeypatch.setattr("src.api.server.send_push_notification", mock_send)
    
    payload = {
        "message": "Test Alert",
        "ntfy_topic": "test_topic"
    }
    response = client.post("/api/v1/notifications/push", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_usage_log_and_reflection():
    payload = {"widget_id": "health_widget", "action": "click"}
    response = client.post("/api/v1/usage/log", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    
    response2 = client.get("/api/v1/reflection/usage")
    assert response2.status_code == 200
    data2 = response2.json()
    assert data2["status"] == "success"
    assert "health_widget" in data2["proposal"] or "dash_01" in data2["proposal"]
