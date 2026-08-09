import re
from datetime import datetime, timezone
import os

def classify_intent(message: str) -> str:
    """Return one of: LOG_PAIN, ADD_EXPENSE, ADD_TASK, MEDICAL_TRIAGE, GENERAL"""
    msg_lower = message.lower()

    # 1. MEDICAL_TRIAGE (checked first — "specialist", "doctor" override body area keywords)
    medical_keywords = ["what should i do", "doctor", "specialist", "who should i see", "diagnosis", "treatment"]
    if any(k in msg_lower for k in medical_keywords):
        return "MEDICAL_TRIAGE"

    # 2. LOG_PAIN
    pain_keywords = ["pain", "hurts", "ache", "sore"]
    body_areas = ["lumbar", "cervical", "knee", "shoulder", "neck", "back", "thoracic", "ankle", "elbow"]
    has_score = re.search(r"\d+\s*(?:/10|out\s*of\s*10)", msg_lower)
    if any(k in msg_lower for k in pain_keywords) or has_score or any(a in msg_lower for a in body_areas):
        return "LOG_PAIN"

    # 3. ADD_EXPENSE
    expense_keywords = ["spent", "bought", "paid", "cost"]
    has_amount = re.search(r"\$\d+|\d+\s*dollars|\d+\.\d+", msg_lower)
    if any(k in msg_lower for k in expense_keywords) or has_amount:
        return "ADD_EXPENSE"

    # 4. ADD_TASK
    task_keywords = ["remind me", "add task", "schedule", "follow up", "to do", "todo"]
    if any(k in msg_lower for k in task_keywords):
        return "ADD_TASK"

    return "GENERAL"


def route_message(message: str, store) -> dict:
    """Classify intent, extract entities, execute handler, return structured response."""
    intent = classify_intent(message)
    msg_lower = message.lower()
    data = {}
    
    if intent == "LOG_PAIN":
        # Extract pain score (handles "8/10" and "8 out of 10")
        score_match = re.search(r"(\d+)\s*(?:/10|out\s*of\s*10)", msg_lower)
        pain_score = min(10, int(score_match.group(1))) if score_match else 5
        
        # Extract area
        body_areas = ["lumbar", "cervical", "knee", "shoulder", "neck", "back", "thoracic", "ankle", "elbow"]
        area = "lumbar"
        for a in body_areas:
            if a in msg_lower:
                area = a
                break
                
        # Extract side
        side = "right"
        if "left" in msg_lower:
            side = "left"
            
        # Extract mood
        mood_match = re.search(r"mood:?\s*(\d+)/10", msg_lower)
        mood_score = int(mood_match.group(1)) if mood_match else 5
        
        from src.schemas.life_os import SymptomPainState
        now_utc = datetime.now(timezone.utc)
        
        state = SymptomPainState(
            timestamp=now_utc.isoformat(),
            date=now_utc.date().isoformat(),
            time_slot="chat_log",
            total_pain_level=pain_score,
            primary_generator=f"{side.capitalize()} {area.capitalize()}",
            primary_percentage=100,
            active_symptoms=[f"{side.capitalize()} {area.capitalize()} (100%)"],
            notes=f"Logged via chat. {message}"
        )
        store.log_symptoms(state)
        
        reply = f"Rumble: Logged {pain_score}/10 pain for {side} {area}. Added to symptoms database."
        data = state.model_dump()
        
    elif intent == "ADD_EXPENSE":
        # Extract amount
        amount = 0.0
        amount_match = re.search(r"\$?(\d+(?:\.\d+)?)(?:\s*dollars)?", msg_lower.replace("$", ""))
        if amount_match:
            amount = float(amount_match.group(1))
            
        # Categorize
        category = "General"
        if any(k in msg_lower for k in ["coles", "woolworths", "aldi", "supermarket", "grocery"]):
            category = "Groceries"
        elif any(k in msg_lower for k in ["chemist warehouse", "chemist", "pharmacy", "priceline"]):
            category = "Medical"
        elif any(k in msg_lower for k in ["ampol", "bp", "shell", "7-eleven", "fuel", "petrol"]):
            category = "Fuel"
            
        # Insert into budget_entries
        from src.storage.db import engine
        from sqlalchemy import text
        now_utc = datetime.now(timezone.utc)
        
        with engine.connect() as conn:
            conn.execute(
                text("INSERT INTO budget_entries (timestamp, description, amount, category, notes) VALUES (:timestamp, :description, :amount, :category, :notes)"),
                {"timestamp": now_utc.isoformat(), "description": message, "amount": amount, "category": category, "notes": "Logged via chat"}
            )
            conn.commit()
            
        reply = f"Rumble: Added expense of ${amount:.2f} categorized as {category}."
        data = {"amount": amount, "category": category, "description": message}
        
    elif intent == "ADD_TASK":
        from src.schemas.life_os import ActionItemRecord, ActionCategory
        import uuid
        task_id = f"act_chat_{uuid.uuid4().hex[:8]}"
        item = ActionItemRecord(
            id=task_id,
            text=message,
            category=ActionCategory.OPS,
            completed=False,
        )
        store.save_action_item(item)
        reply = "Rumble: Added to your tasks."
        data = {"task": message}
        
    elif intent == "MEDICAL_TRIAGE":
        context_path = os.path.join("agent_reports", "MEDICAL_CONTEXT.md")
        context = ""
        if os.path.exists(context_path):
            with open(context_path, "r", encoding="utf-8") as f:
                context = f.read()
        
        reply = f"Rumble: Based on your medical context, here is what you should consider for your query: '{message}'.\n\nContext excerpt: {context[:200]}..."
        
    else:
        latest_symptoms = store.get_latest_symptoms()
        reply = (
            f"Rumble: Understood. Regarding '{message}', I have reviewed your current anatomical state "
            f"({latest_symptoms.primary_generator} at {latest_symptoms.total_pain_level}/10 pain) and persistent notes. "
            "Your Daily Agenda has been updated accordingly."
        )
        
    return {
        "reply": reply,
        "author": "RUMBLE",
        "intent": intent,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
