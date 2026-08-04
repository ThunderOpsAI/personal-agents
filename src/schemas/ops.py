"""
Daily Operations Schemas.

Defines Pydantic models for Google Workspace integrations, scheduling,
spoon/energy tracking, medical billing EOB parsing, and briefing reports.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class EmailPriority(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    SPAM = "Spam"


class EmailSummary(BaseModel):
    id: str = Field(..., description="Unique message ID")
    sender: str = Field(..., description="Sender name or email address")
    sender_domain: Optional[str] = Field(default=None, description="Domain of sender, e.g. deakin.edu.au")
    subject: str = Field(..., description="Subject line")
    ticket_number: Optional[str] = Field(default=None, description="Explicit ticket or reference number, e.g. RITM1229647")
    status: str = Field(default="Unread", description="Read / Actioned Status, e.g. Unread, Action Pending, Actioned")
    snippet: str = Field(..., description="Short preview of email body")
    exact_body_summary: Optional[str] = Field(default=None, description="True un-truncated body summary or rationale")
    clear_action_required: Optional[str] = Field(default=None, description="Exact phone numbers, reference codes, or direct steps to resolve")
    priority: EmailPriority = Field(default=EmailPriority.MEDIUM, description="Triage priority level")
    action_required: bool = Field(default=False, description="Whether human action or response is required")
    is_imperative: bool = Field(default=False, description="Whether missing/delaying this email has severe consequences")
    summary: Optional[str] = Field(default=None, description="AI-generated summary of the email thread")


class CalendarEvent(BaseModel):
    id: Optional[str] = Field(default=None, description="Event ID")
    summary: str = Field(..., description="Event title or subject")
    start_time: str = Field(..., description="Start time ISO string")
    end_time: str = Field(..., description="End time ISO string")
    location: Optional[str] = Field(default=None, description="Location or meeting link")
    is_protected_block: bool = Field(default=False, description="Whether event is a recovery or focus block shielded from overrides")
    description: Optional[str] = Field(default=None, description="Detailed description")


class GuardrailDecision(BaseModel):
    allowed: bool = Field(..., description="Whether the calendar/email mutation is allowed")
    reason: str = Field(..., description="Explanation of why it was allowed or blocked")
    requires_human_confirmation: bool = Field(default=True, description="Enforces Human-In-The-Loop gate")


class SpoonState(BaseModel):
    energy_level: int = Field(..., ge=1, le=10, description="Current energy level (1-10 spoons)")
    pain_level: int = Field(..., ge=0, le=10, description="Current pain level (0-10 scale)")
    recommended_focus_hours: float = Field(..., description="Dynamically adjusted focus time limit in hours")
    advice: str = Field(..., description="Coaching advice tailored to spoon state")


class EOBRecord(BaseModel):
    claim_id: str = Field(..., description="Claim or Invoice ID")
    provider_name: str = Field(..., description="Healthcare provider or clinic name")
    patient_responsibility: float = Field(..., description="Amount owed by patient")
    insurance_paid: float = Field(..., description="Amount paid by insurance")
    service_date: str = Field(..., description="Date of service")
    flagged_discrepancy: bool = Field(default=False, description="Whether potential billing error or overcharge is detected")
    notes: Optional[str] = Field(default=None, description="Audit notes or line item details")


class BriefingReport(BaseModel):
    date: str = Field(..., description="Date of briefing")
    schedule_highlights: list[CalendarEvent] = Field(default_factory=list, description="Today's schedule")
    high_priority_emails: list[EmailSummary] = Field(default_factory=list, description="Triaged actionable emails")
    energy_coaching: SpoonState = Field(..., description="Habit coach energy adjustment")
    pending_medical_bills: list[EOBRecord] = Field(default_factory=list, description="Outstanding medical billing items")
    action_items: list[str] = Field(default_factory=list, description="Consolidated daily action items")
