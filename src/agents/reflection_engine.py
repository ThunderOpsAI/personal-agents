from typing import Dict, List, Optional
from datetime import datetime, timezone

class ReflectionEngine:
    def __init__(self):
        self.usage_logs: List[Dict] = []
    
    def log_usage(self, widget_id: str, action: str):
        self.usage_logs.append({
            "widget_id": widget_id,
            "action": action,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        return True
    
    def analyze_usage(self, window_hours: int = 24) -> str:
        """
        Background analyzer evaluating usage frequency.
        Generates proposals from CLO.
        """
        if not self.usage_logs:
            return "CLO Proposal: No recent usage data to evaluate."
        
        freq = {}
        for log in self.usage_logs:
            w_id = log["widget_id"]
            freq[w_id] = freq.get(w_id, 0) + 1
            
        sorted_widgets = sorted(freq.items(), key=lambda x: x[1], reverse=True)
        top_widget = sorted_widgets[0][0]
        
        return f"CLO Proposal: Auto-add frequently used widget '{top_widget}' to main dashboard."

reflection_engine = ReflectionEngine()
