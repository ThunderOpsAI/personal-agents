"""
Alert Engine for Life OS.

Evaluates deterministic rules (Spoon energy depletion, SLA ticket deadlines, medical contraindications,
and billing errors) alongside LLM-driven urgency signals.
Generates prioritized `LifeAlert` objects and delivers native macOS notifications.
"""

from __future__ import annotations

import os
import subprocess
from datetime import datetime, timezone
from typing import Optional

from src.schemas.life_os import AlertCategory, AlertSeverity, LifeAlert
from src.schemas.medical import PersonalAdvisorBrief, RiskSeverity
from src.schemas.ops import BriefingReport, SpoonState


class AlertEngine:
    """Evaluates multi-domain inputs to extract actionable alerts and trigger notifications."""

    def __init__(self, enable_desktop_notifications: bool = True) -> None:
        self.enable_desktop_notifications = enable_desktop_notifications

    def evaluate_all(
        self,
        ops_report: BriefingReport,
        spoon_state: SpoonState,
        medical_brief: Optional[PersonalAdvisorBrief] = None,
    ) -> list[LifeAlert]:
        """Run all rule-based and synthesis alert checks."""
        alerts: list[LifeAlert] = []

        # 1. Symptom & High Pain Flare Alerts
        if spoon_state.pain_level >= 7:
            severity = AlertSeverity.CRITICAL if spoon_state.pain_level >= 8 else AlertSeverity.HIGH
            alerts.append(
                LifeAlert(
                    id=f"alert_symptom_{int(datetime.now(timezone.utc).timestamp())}",
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    severity=severity,
                    category=AlertCategory.SYMPTOMS,
                    title="Severe Anatomical Pain Flare Flag",
                    summary=f"Pain scale is {spoon_state.pain_level}/10.",
                    action_required=f"Schedule rest block & recovery routine. {spoon_state.advice}",
                )
            )


        # 2. Daily Operations & Actionable Email/Ticket Alerts
        for email in ops_report.high_priority_emails:
            if email.action_required:
                alerts.append(
                    LifeAlert(
                        id=f"alert_email_{email.id}",
                        timestamp=datetime.now(timezone.utc).isoformat(),
                        severity=AlertSeverity.HIGH if email.priority == "High" else AlertSeverity.INFO,
                        category=AlertCategory.OPS,
                        title=f"Action Required: {email.subject}",
                        summary=f"From: {email.sender}. {email.snippet}",
                        action_required=f"Review email {email.id} and resolve pending item.",
                    )
                )

        # 3. Medical Billing Discrepancy Alerts
        for bill in ops_report.pending_medical_bills:
            if bill.flagged_discrepancy:
                alerts.append(
                    LifeAlert(
                        id=f"alert_bill_{bill.claim_id}",
                        timestamp=datetime.now(timezone.utc).isoformat(),
                        severity=AlertSeverity.HIGH,
                        category=AlertCategory.FINANCE,
                        title=f"Billing Discrepancy: {bill.provider_name}",
                        summary=f"Claim {bill.claim_id}: Patient owes ${bill.patient_responsibility:.2f}, Insurance paid ${bill.insurance_paid:.2f}.",
                        action_required=f"Review EOB claim {bill.claim_id} for potential provider overcharge.",
                    )
                )

        # 4. Medical Contraindication & Safety Flags
        if medical_brief and medical_brief.contraindications_and_risks:
            for flag in medical_brief.contraindications_and_risks:
                if flag.severity in (RiskSeverity.HIGH, RiskSeverity.CRITICAL):
                    alerts.append(
                        LifeAlert(
                            id=f"alert_med_{int(datetime.now(timezone.utc).timestamp())}",
                            timestamp=datetime.now(timezone.utc).isoformat(),
                            severity=AlertSeverity.CRITICAL if flag.severity == RiskSeverity.CRITICAL else AlertSeverity.HIGH,
                            category=AlertCategory.MEDICAL,
                            title=f"Medical Warning: {flag.title}",
                            summary=flag.description,
                            action_required=f"Review affected items: {', '.join(flag.affected_items)} with primary care doctor.",
                        )
                    )

        # Send macOS desktop notifications for HIGH and CRITICAL alerts
        if self.enable_desktop_notifications:
            for alert in alerts:
                if alert.severity in (AlertSeverity.CRITICAL, AlertSeverity.HIGH):
                    self.send_macos_notification(
                        title=f"[{alert.severity.value}] {alert.title}",
                        message=alert.summary,
                    )

        return alerts

    def send_macos_notification(self, title: str, message: str) -> None:
        """Deliver native macOS system notification using osascript."""
        try:
            # Escape double quotes for AppleScript string literal
            safe_title = title.replace('"', '\\"')
            safe_message = message.replace('"', '\\"')
            cmd = f'display notification "{safe_message}" with title "{safe_title}"'
            subprocess.run(["osascript", "-e", cmd], check=False, capture_output=True)
        except Exception:
            pass  # Fallback gracefully if not running on GUI desktop
