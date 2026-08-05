import pytest
from fastapi.testclient import TestClient
from src.api.server import app

client = TestClient(app)

def test_voice_parse():
    response = client.post("/api/v1/voice/parse", json={"transcript": "Right lower back pain is 7 out of 10 after morning physio"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    
    parsed = data["parsed"]
    assert parsed["symptom"] == "lower_back"
    assert parsed["side"] == "right"
    assert parsed["severity"] == 7
    assert "after morning physio" in parsed["context"]
    assert data["budget_updated"] == True

def test_push_notification():
    response = client.post("/api/v1/notifications/push", json={"message": "High severity pain logged."})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["success", "failed"]

def test_protocols_complete():
    response = client.post("/api/v1/protocols/complete", json={"protocol_id": "physio_01"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

def test_usage_and_reflection():
    post_res = client.post("/api/v1/usage/log", json={"widget_id": "dash_01", "action": "click"})
    assert post_res.status_code == 200
    
    get_res = client.get("/api/v1/reflection/usage")
    assert get_res.status_code == 200
    assert "proposal" in get_res.json()

def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
