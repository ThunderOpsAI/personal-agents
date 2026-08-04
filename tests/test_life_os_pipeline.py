"""
Unit tests for Life OS ChiefLifeOfficer orchestrator, SQLite store, and Alert Engine.
"""

import tempfile
from pathlib import Path
from src.agents.clo import ChiefLifeOfficer
from src.schemas.life_os import AlertSeverity, MasterLifeBrief
from src.storage.life_os_store import LifeOSStore


def test_life_os_full_pipeline():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test_life_os.db"
        clo = ChiefLifeOfficer(db_path=db_path, enable_desktop_notifications=False)

        brief = clo.run_life_briefing(energy_level=2, pain_level=8, use_mock_cmo=True)
        assert isinstance(brief, MasterLifeBrief)
        assert brief.id is not None
        assert brief.symptom_state.total_pain_level == 8


        # Verify active alerts generated
        assert len(brief.active_alerts) >= 1
        critical_alerts = [a for a in brief.active_alerts if a.severity == AlertSeverity.CRITICAL]
        assert len(critical_alerts) >= 1

        # Verify persistence in SQLite
        store = LifeOSStore(db_path=db_path)
        fetched_brief = store.get_latest_brief()
        assert fetched_brief is not None
        assert fetched_brief.headline_summary == brief.headline_summary

        # Verify resolving alert
        alert_id = brief.active_alerts[0].id
        resolved = store.resolve_alert(alert_id)
        assert resolved is True
