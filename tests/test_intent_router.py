from src.agents.intent_router import route_message


class RecordingStore:
    def __init__(self):
        self.symptom_logs = []
        self.tasks = []

    def log_symptoms(self, state):
        self.symptom_logs.append(state)

    def save_action_item(self, item):
        self.tasks.append(item)


def test_unrelated_chat_messages_are_contextual_and_do_not_reuse_latest_symptom():
    store = RecordingStore()

    agenda = route_message("What is on my agenda this afternoon?", store)
    recovery = route_message("How can I pace my recovery today?", store)

    assert agenda["intent"] == "GENERAL"
    assert recovery["intent"] == "GENERAL"
    assert agenda["reply"] != recovery["reply"]
    assert "chiro" not in agenda["reply"].lower()
    assert "shoulder" not in recovery["reply"].lower()
    assert store.symptom_logs == []


def test_pain_discussion_never_persists_without_an_explicit_log_command():
    store = RecordingStore()

    result = route_message("My right shoulder is sore at 5/10 after my appointment. What should I do?", store)

    assert result["intent"] == "MEDICAL_TRIAGE"
    assert store.symptom_logs == []
    assert "not a diagnosis" in result["reply"]


def test_ambiguous_pain_statement_stays_in_conversation():
    store = RecordingStore()

    result = route_message("My shoulder is sore at 5/10 after the chiro appointment.", store)

    assert result["intent"] == "PAIN_DISCUSSION"
    assert store.symptom_logs == []
    assert "have not saved a pain entry" in result["reply"]


def test_explicit_pain_log_persists_only_the_user_supplied_values():
    store = RecordingStore()

    result = route_message("Please log pain: left shoulder 5/10 after exercise.", store)

    assert result["intent"] == "LOG_PAIN"
    assert len(store.symptom_logs) == 1
    logged = store.symptom_logs[0]
    assert logged.total_pain_level == 5
    assert logged.primary_generator == "Left Shoulder"
    assert result["data"]["total_pain_level"] == 5
