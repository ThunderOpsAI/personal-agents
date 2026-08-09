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


def test_multi_location_pain_log_requires_relative_weights():
    response = client.post("/api/symptoms/log", json={
        "pain_level": 6,
        "generators": [
            {"area": "ankle", "side": "right", "percentage": 80},
            {"area": "knee", "side": "left", "percentage": 20},
        ],
        "mood_level": 5,
        "mood_emoji": "Calm",
        "pain_notes": "After walking",
    })
    assert response.status_code == 200
    assert response.json()["log"]["mood_emoji"] == "Calm"

    invalid = client.post("/api/symptoms/log", json={
        "pain_level": 6,
        "generators": [{"area": "ankle", "side": "right", "percentage": 80}],
    })
    assert invalid.status_code == 422


def test_exercise_feedback_loop_and_recalibration():
    suggested = client.post("/api/exercises/suggest", json={
        "pain_level": 7,
        "generators": [{"area": "lumbar", "side": "right", "percentage": 100}],
    })
    assert suggested.status_code == 200
    exercise = suggested.json()["suggestions"][0]
    assert 3 <= len(suggested.json()["suggestions"]) <= 5

    delta = client.post("/api/exercises/relief-delta", json={
        "exercise_id": exercise["id"], "before_pain": 7, "after_pain": 4,
    })
    assert delta.status_code == 200
    assert delta.json()["relief_delta"] == 3

    rejected = client.post("/api/exercises/reject", json={
        "exercise_id": "wall_isometric", "reason": "Too tired",
    })
    assert rejected.status_code == 200
    recalibration = client.get("/api/exercises/recalibration")
    assert recalibration.status_code == 200
    assert recalibration.json()["status"] == "pending_approval"


def test_agenda_contains_nightly_meditation():
    response = client.get("/api/v1/agenda")
    assert response.status_code == 200
    meditation = [item for item in response.json()["daily"] if item["id"] == "meditation_nightly"]
    assert meditation and meditation[0]["time"] == "09:00 PM"


def test_weather_parses_exact_open_meteo_response(monkeypatch):
    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def read(self):
            return b'{"current":{"time":"2026-08-09T10:00","temperature_2m":12.5,"precipitation":0.2},"hourly":{"time":["2026-08-09T10:00"],"precipitation_probability":[35]}}'

    monkeypatch.setattr("src.api.server.urllib.request.urlopen", lambda *args, **kwargs: FakeResponse())
    response = client.get("/api/v1/weather")
    assert response.status_code == 200
    assert response.json()["location"] == "Wangaratta, Victoria, Australia"
    assert response.json()["temp_c"] == 12.5
    assert response.json()["rain_probability_pct"] == 35
