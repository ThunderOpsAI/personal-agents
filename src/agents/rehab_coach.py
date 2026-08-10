"""Preference-aware, ad-hoc exercise recommendation and feedback loop."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from src.memory.vector_store import VectorPreferenceStore


EXERCISE_CATALOG: tuple[dict[str, Any], ...] = (
    {
        "id": "breathing_reset",
        "name": "Diaphragmatic Breathing Reset",
        "duration_minutes": 3,
        "intensity": "gentle",
        "targets": {"lumbar", "cervical", "thoracic", "shoulder", "hip"},
        "instruction": "Lie or sit supported. Breathe slowly into the lower ribs for six relaxed cycles.",
    },
    {
        "id": "ankle_pumps",
        "name": "Ankle Pumps",
        "duration_minutes": 2,
        "intensity": "gentle",
        "targets": {"ankle", "knee", "hip"},
        "instruction": "Move the ankle through a comfortable range without forcing the end position.",
    },
    {
        "id": "supported_cat_cow",
        "name": "Supported Cat-Cow",
        "duration_minutes": 4,
        "intensity": "gentle",
        "targets": {"lumbar", "thoracic", "cervical", "shoulder"},
        "instruction": "On hands and knees or seated, gently alternate spinal flexion and extension.",
    },
    {
        "id": "wall_isometric",
        "name": "Wall Sit Isometric",
        "duration_minutes": 3,
        "intensity": "moderate",
        "targets": {"knee", "hip"},
        "instruction": "Use a shallow, supported wall sit and stop before pain increases or form changes.",
    },
    {
        "id": "scapular_retraction",
        "name": "Scapular Retraction",
        "duration_minutes": 4,
        "intensity": "gentle",
        "targets": {"shoulder", "cervical", "thoracic"},
        "instruction": "With arms relaxed, draw the shoulder blades gently down and back, then release.",
    },
    {
        "id": "hip_hinge_practice",
        "name": "Supported Hip-Hinge Practice",
        "duration_minutes": 5,
        "intensity": "moderate",
        "targets": {"lumbar", "hip", "knee"},
        "instruction": "Use a bench or wall for support and practise a small, pain-free hip hinge.",
    },
)


class RehabCoach:
    """Select exercises and persist explicit outcomes as Chroma preferences."""

    def __init__(self, vector_store: VectorPreferenceStore | None = None) -> None:
        chroma_path = os.getenv("RUMBLE_CHROMA_PATH")
        if chroma_path is None:
            chroma_path = str(Path(__file__).resolve().parents[2] / "data" / "chroma")
        self.vector_store = vector_store or VectorPreferenceStore(
            collection_name="rehab_preferences",
            persist_directory=chroma_path,
        )

    def suggest(self, pain_level: int, generators: list[dict[str, Any]], limit: int = 5) -> list[dict[str, Any]]:
        areas = {str(item.get("area", "")).lower() for item in generators}
        query = f"pain {pain_level}/10; affected areas: {', '.join(sorted(areas)) or 'unspecified'}"
        try:
            self.vector_store.query_preferences(query=query, n_results=12)
        except Exception:
            # Fall back to the local preference store when embeddings are unavailable.
            pass
        learned_records = self.vector_store.get_all_preferences()
        rejected = {
            item.get("metadata", {}).get("exercise_id")
            for item in learned_records
            if item.get("metadata", {}).get("feedback") == "rejected"
        }
        relief_scores: dict[str, float] = {}
        for item in learned_records:
            metadata = item.get("metadata", {})
            exercise_id = metadata.get("exercise_id")
            if exercise_id and metadata.get("relief_delta") is not None:
                relief_scores.setdefault(exercise_id, 0.0)
                relief_scores[exercise_id] += float(metadata["relief_delta"])
        candidates = [
            dict(exercise)
            for exercise in EXERCISE_CATALOG
            if exercise["id"] not in rejected
            and (not areas or exercise["targets"] & areas)
            and (pain_level >= 7 or exercise["intensity"] != "gentle" or pain_level < 4)
        ]
        if len(candidates) < limit:
            candidates.extend(
                dict(exercise)
                for exercise in EXERCISE_CATALOG
                if exercise["id"] not in rejected and exercise not in candidates
            )

        # Keep the response JSON-safe and bias high-pain sessions toward gentle work.
        candidates.sort(key=lambda item: (
            0 if pain_level >= 7 and item["intensity"] == "gentle" else 1,
            -relief_scores.get(item["id"], 0.0),
            item["id"],
        ))
        for exercise in candidates[:limit]:
            exercise["targets"] = sorted(exercise["targets"])
            exercise["reason"] = f"Matched to {', '.join(sorted(areas)) or 'your current pain log'} at {pain_level}/10."
        return candidates[:limit]

    def log_relief_delta(self, exercise_id: str, before_pain: int, after_pain: int, context: str = "") -> str:
        delta = before_pain - after_pain
        return self.vector_store.add_preference(
            text=f"{exercise_id} changed pain from {before_pain}/10 to {after_pain}/10; relief delta {delta}.",
            category="exercise_relief_delta",
            metadata={
                "exercise_id": exercise_id,
                "feedback": "completed",
                "before_pain": before_pain,
                "after_pain": after_pain,
                "relief_delta": delta,
                "context": context[:500],
            },
        )

    def log_rejection(self, exercise_id: str, reason: str, context: str = "") -> str:
        return self.vector_store.add_preference(
            text=f"Rejected {exercise_id}: {reason}.",
            category="exercise_constraint",
            metadata={
                "exercise_id": exercise_id,
                "feedback": "rejected",
                "reason": reason,
                "context": context[:500],
            },
        )

    def weekly_recalibration(self) -> dict[str, Any]:
        records = self.vector_store.get_all_preferences()
        deltas = [r for r in records if r.get("metadata", {}).get("relief_delta") is not None]
        constraints = [r for r in records if r.get("metadata", {}).get("feedback") == "rejected"]
        by_exercise: dict[str, list[int]] = {}
        for record in deltas:
            meta = record["metadata"]
            by_exercise.setdefault(str(meta.get("exercise_id")), []).append(int(meta.get("relief_delta", 0)))
        rules = [
            {
                "exercise_id": exercise_id,
                "average_relief_delta": round(sum(values) / len(values), 2),
                "observations": len(values),
            }
            for exercise_id, values in sorted(by_exercise.items())
        ]
        return {
            "status": "pending_approval",
            "rules": rules,
            "constraints": [
                {"exercise_id": r["metadata"].get("exercise_id"), "reason": r["metadata"].get("reason")}
                for r in constraints
            ],
            "message": "Review these learned exercise rules and approve or reject them.",
        }

    def record_recalibration_decision(self, approved: bool, summary: str) -> str:
        return self.vector_store.add_preference(
            text=summary,
            category="exercise_recalibration_decision",
            metadata={"feedback": "approved" if approved else "rejected"},
        )
