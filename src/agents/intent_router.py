"""Route explicit structured commands without treating ordinary chat as a write."""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone


_BODY_AREAS = (
    "lumbar", "cervical", "knee", "shoulder", "neck", "back", "thoracic", "ankle", "elbow",
)
_PAIN_WORDS = ("pain", "hurts", "ache", "sore")


def _has_explicit_write_command(message: str, nouns: tuple[str, ...]) -> bool:
    """Whether the user deliberately asked the assistant to save a record."""
    lowered = message.lower().strip()
    return bool(
        re.search(r"\b(?:log|record|track|add)\b", lowered)
        and any(noun in lowered for noun in nouns)
    )


def _is_explicit_pain_log(message: str) -> bool:
    """Keep symptom discussion read-only unless a user expressly requests a log."""
    lowered = message.lower().strip()
    has_write_verb = bool(re.search(r"\b(?:log|record|track)\b", lowered))
    mentions_pain = any(word in lowered for word in _PAIN_WORDS) or _mentions_body_area(lowered)
    return has_write_verb and mentions_pain


def _mentions_body_area(message: str) -> bool:
    return any(re.search(rf"\b{re.escape(area)}\b", message) for area in _BODY_AREAS)


def _mentions_pain(message: str) -> bool:
    lowered = message.lower()
    return any(word in lowered for word in _PAIN_WORDS) or _mentions_body_area(lowered)


def classify_intent(message: str) -> str:
    """Classify chat without allowing a symptom mention to silently create data."""
    msg_lower = message.lower()

    medical_keywords = ("what should i do", "doctor", "specialist", "who should i see", "diagnosis", "treatment")
    if any(keyword in msg_lower for keyword in medical_keywords):
        return "MEDICAL_TRIAGE"

    if _is_explicit_pain_log(message):
        return "LOG_PAIN"

    if _mentions_pain(message):
        return "PAIN_DISCUSSION"

    if _has_explicit_write_command(message, ("expense", "spent", "bought", "paid", "cost")):
        return "ADD_EXPENSE"

    if re.search(r"\b(?:remind me|add task|create task)\b", msg_lower):
        return "ADD_TASK"

    return "GENERAL"


def _extract_pain_log(message: str) -> tuple[int | None, str | None, str]:
    """Extract only values that were supplied by the user; never invent a location."""
    lowered = message.lower()
    score_match = re.search(r"\b(\d{1,2})\s*(?:/10|out\s*of\s*10)\b", lowered)
    pain_score = int(score_match.group(1)) if score_match else None
    if pain_score is not None and not 1 <= pain_score <= 10:
        pain_score = None

    area = next((candidate for candidate in _BODY_AREAS if re.search(rf"\b{re.escape(candidate)}\b", lowered)), None)
    side = "left" if "left" in lowered else "right" if "right" in lowered else "unspecified"
    return pain_score, area, side


def _pain_discussion_reply(message: str) -> str:
    return (
        f"Rumble: I hear that you said: \"{message}\". I have not saved a pain entry. "
        "If you want to record it, explicitly say ‘log pain’ with a 1–10 score and body location. "
        "This is decision support, not a diagnosis; please follow clinician restrictions and seek clinician review for worsening or concerning symptoms."
    )


def _general_reply(message: str) -> str:
    return (
        f"Rumble: I’m responding to your message: \"{message}\". "
        "I can help you think through your agenda, recovery plan, or an explicit record you want to save."
    )


def route_message(message: str, store) -> dict:
    """Handle chat and persist data only after an explicit structured command."""
    intent = classify_intent(message)
    msg_lower = message.lower()
    data: dict = {}

    if intent == "LOG_PAIN":
        pain_score, area, side = _extract_pain_log(message)
        if pain_score is None or area is None:
            missing = []
            if pain_score is None:
                missing.append("a valid 1–10 score")
            if area is None:
                missing.append("a body location")
            reply = f"Rumble: I have not saved a pain entry yet. Please provide {' and '.join(missing)} to confirm the log."
        else:
            from src.schemas.life_os import SymptomPainState

            now_utc = datetime.now(timezone.utc)
            location = f"{side.capitalize()} {area.capitalize()}" if side != "unspecified" else area.capitalize()
            state = SymptomPainState(
                timestamp=now_utc.isoformat(),
                date=now_utc.date().isoformat(),
                time_slot="chat_log",
                total_pain_level=pain_score,
                primary_generator=location,
                primary_percentage=100,
                active_symptoms=[f"{location} (100%)"],
                notes=f"Logged via explicit chat request. {message}",
            )
            store.log_symptoms(state)
            reply = f"Rumble: Recorded {pain_score}/10 pain for {location}."
            data = state.model_dump()

    elif intent == "PAIN_DISCUSSION":
        reply = _pain_discussion_reply(message)

    elif intent == "ADD_EXPENSE":
        amount_match = re.search(r"\$?(\d+(?:\.\d+)?)(?:\s*dollars)?", msg_lower.replace("$", ""))
        amount = float(amount_match.group(1)) if amount_match else 0.0
        category = "General"
        if any(keyword in msg_lower for keyword in ("coles", "woolworths", "aldi", "supermarket", "grocery")):
            category = "Groceries"
        elif any(keyword in msg_lower for keyword in ("chemist warehouse", "chemist", "pharmacy", "priceline")):
            category = "Medical"
        elif any(keyword in msg_lower for keyword in ("ampol", "bp", "shell", "7-eleven", "fuel", "petrol")):
            category = "Fuel"

        from sqlalchemy import text
        from src.storage.db import engine

        with engine.connect() as conn:
            conn.execute(
                text("INSERT INTO budget_entries (timestamp, description, amount, category, notes) VALUES (:timestamp, :description, :amount, :category, :notes)"),
                {"timestamp": datetime.now(timezone.utc).isoformat(), "description": message, "amount": amount, "category": category, "notes": "Logged via explicit chat request"},
            )
            conn.commit()
        reply = f"Rumble: Added expense of ${amount:.2f} categorized as {category}."
        data = {"amount": amount, "category": category, "description": message}

    elif intent == "ADD_TASK":
        from src.schemas.life_os import ActionCategory, ActionItemRecord

        item = ActionItemRecord(id=f"act_chat_{uuid.uuid4().hex[:8]}", text=message, category=ActionCategory.OPS, completed=False)
        store.save_action_item(item)
        reply = "Rumble: Added to your tasks."
        data = {"task": message}

    elif intent == "MEDICAL_TRIAGE":
        # Do not frame this as diagnosis or use an old symptom record as a chat answer.
        reply = (
            f"Rumble: I can offer decision-support information about \"{message}\", not a diagnosis. "
            "Please review this with your clinician, especially if symptoms are worsening or conflict with surgery or rehabilitation restrictions."
        )

    else:
        reply = _general_reply(message)

    return {
        "reply": reply,
        "author": "RUMBLE",
        "intent": intent,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
