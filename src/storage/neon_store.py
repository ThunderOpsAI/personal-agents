from typing import Optional, List
from datetime import datetime, timezone
import json
from src.storage.db import SessionLocal
from src.storage.models import SpoonLog, MedicalLog, MemoryEmbedding, ProtocolRun, DashboardUsageLog
from src.schemas.life_os import SymptomPainState
from src.storage.spoon_store import DailySpoonState

class NeonSpoonStore:
    def log_state(
        self,
        pain_level: int,
        focus_state: str,
        total_spoons: float = 12.0,
        spoons_remaining: Optional[float] = None,
        notes: str = "",
    ) -> DailySpoonState:
        remaining = spoons_remaining if spoons_remaining is not None else total_spoons
        now = datetime.now(timezone.utc)
        
        with SessionLocal() as db:
            log = SpoonLog(
                date=now.date(),
                budget=int(total_spoons),
                spent=int(total_spoons - remaining),
                remaining=int(remaining),
                details={"focus_state": focus_state, "pain_level": pain_level, "notes": notes},
                updated_at=now
            )
            db.add(log)
            db.commit()
            db.refresh(log)
            
            return DailySpoonState(
                id=log.id,
                timestamp=now.isoformat(),
                pain_level=pain_level,
                focus_state=focus_state,
                total_spoons=total_spoons,
                spoons_remaining=remaining,
                notes=notes
            )
            
    def spend_spoons(self, spoon_cost: float, activity: str) -> DailySpoonState:
        latest = self.get_latest_state()
        if not latest:
            latest = self.log_state(5, "balanced")
            
        return self.log_state(
            pain_level=latest.pain_level,
            focus_state=latest.focus_state,
            total_spoons=latest.total_spoons,
            spoons_remaining=max(0.0, latest.spoons_remaining - spoon_cost),
            notes=f"Spent {spoon_cost} spoons on: {activity}"
        )

    def recharge_spoons(self, spoon_gain: float, activity: str) -> DailySpoonState:
        latest = self.get_latest_state()
        if not latest:
            latest = self.log_state(5, "balanced")
            
        return self.log_state(
            pain_level=latest.pain_level,
            focus_state=latest.focus_state,
            total_spoons=latest.total_spoons,
            spoons_remaining=min(latest.total_spoons, latest.spoons_remaining + spoon_gain),
            notes=f"Recharged +{spoon_gain} spoons via: {activity}"
        )
        
    def get_latest_state(self) -> Optional[DailySpoonState]:
        with SessionLocal() as db:
            log = db.query(SpoonLog).order_by(SpoonLog.updated_at.desc()).first()
            if not log:
                return None
            return DailySpoonState(
                id=log.id,
                timestamp=log.updated_at.isoformat(),
                pain_level=log.details.get("pain_level", 5) if log.details else 5,
                focus_state=log.details.get("focus_state", "balanced") if log.details else "balanced",
                total_spoons=float(log.budget),
                spoons_remaining=float(log.remaining),
                notes=log.details.get("notes", "") if log.details else ""
            )
            
    def get_history(self, limit: int = 10) -> List[DailySpoonState]:
        with SessionLocal() as db:
            logs = db.query(SpoonLog).order_by(SpoonLog.updated_at.desc()).limit(limit).all()
            return [
                DailySpoonState(
                    id=log.id,
                    timestamp=log.updated_at.isoformat(),
                    pain_level=log.details.get("pain_level", 5) if log.details else 5,
                    focus_state=log.details.get("focus_state", "balanced") if log.details else "balanced",
                    total_spoons=float(log.budget),
                    spoons_remaining=float(log.remaining),
                    notes=log.details.get("notes", "") if log.details else ""
                ) for log in logs
            ]


class NeonLifeOSStore:
    def log_symptoms(self, state: SymptomPainState) -> SymptomPainState:
        now = datetime.now(timezone.utc)
        with SessionLocal() as db:
            log = MedicalLog(
                timestamp=now,
                symptom=state.primary_generator,
                severity=state.total_pain_level,
                side="Unknown",
                context=json.dumps(state.active_symptoms),
                notes=state.notes
            )
            db.add(log)
            db.commit()
            db.refresh(log)
            state.id = log.id
            return state

    def get_latest_symptoms(self) -> SymptomPainState:
        with SessionLocal() as db:
            log = db.query(MedicalLog).order_by(MedicalLog.timestamp.desc()).first()
            if not log:
                return SymptomPainState(
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    date=datetime.now().strftime("%Y-%m-%d"),
                    time_slot="12:00 PM",
                    total_pain_level=5,
                    primary_generator="Baseline",
                    primary_percentage=100,
                    active_symptoms=[],
                    notes=""
                )
            
            return SymptomPainState(
                id=log.id,
                timestamp=log.timestamp.isoformat() if log.timestamp else "",
                date=log.timestamp.strftime("%Y-%m-%d") if log.timestamp else "",
                time_slot="12:00 PM",
                total_pain_level=log.severity or 0,
                primary_generator=log.symptom or "",
                primary_percentage=100,
                active_symptoms=json.loads(log.context) if log.context else [],
                notes=log.notes or ""
            )
            
    def get_symptoms_history(self, limit: int = 20) -> List[SymptomPainState]:
        with SessionLocal() as db:
            logs = db.query(MedicalLog).order_by(MedicalLog.timestamp.desc()).limit(limit).all()
            return [
                SymptomPainState(
                    id=log.id,
                    timestamp=log.timestamp.isoformat() if log.timestamp else "",
                    date=log.timestamp.strftime("%Y-%m-%d") if log.timestamp else "",
                    time_slot="12:00 PM",
                    total_pain_level=log.severity or 0,
                    primary_generator=log.symptom or "",
                    primary_percentage=100,
                    active_symptoms=json.loads(log.context) if log.context else [],
                    notes=log.notes or ""
                ) for log in logs
            ]
