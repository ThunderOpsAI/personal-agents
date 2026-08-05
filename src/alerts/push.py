import requests
import os
from typing import Optional
from datetime import datetime

def send_push_notification(message: str, telegram_token: Optional[str] = None, telegram_chat_id: Optional[str] = None, ntfy_topic: Optional[str] = None) -> bool:
    """
    Dispatches real-time alerts without emojis.
    Integrates Telegram Bot API and ntfy.sh.
    """
    success = False

    # Fetch env fallbacks
    t_token = telegram_token or os.getenv("TELEGRAM_BOT_TOKEN")
    t_chat = telegram_chat_id or os.getenv("TELEGRAM_CHAT_ID")
    n_topic = ntfy_topic or os.getenv("NTFY_TOPIC", "rumble_os_alerts")

    # Telegram notification
    if t_token and t_chat:
        url = f"https://api.telegram.org/bot{t_token}/sendMessage"
        try:
            resp = requests.post(url, json={"chat_id": t_chat, "text": message}, timeout=5)
            if resp.ok:
                success = True
        except Exception as e:
            print(f"Telegram push error: {e}")

    # ntfy notification
    if n_topic:
        url = f"https://ntfy.sh/{n_topic}"
        try:
            resp = requests.post(url, data=message.encode('utf-8'), timeout=5)
            if resp.ok:
                success = True
        except Exception as e:
            print(f"ntfy push error: {e}")

    return success


def check_3hr_logging_reminder() -> Optional[str]:
    """
    Returns reminder text if current hour matches 3-hour logging slots between 06:00 AM and 00:00 AM.
    Slots: 06:00, 09:00, 12:00, 15:00, 18:00, 21:00, 00:00.
    """
    now = datetime.now()
    hour = now.hour
    slots = {6: "06:00 AM", 9: "09:00 AM", 12: "12:00 PM", 15: "03:00 PM", 18: "06:00 PM", 21: "09:00 PM", 0: "12:00 AM"}
    if hour in slots:
        slot_str = slots[hour]
        message = f"Rumble OS Reminder ({slot_str}): Time for your scheduled pain, mood, and agenda log."
        send_push_notification(message)
        return message
    return None
