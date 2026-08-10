"""
Medical Billing Admin Agent.

Ingests Explanation of Benefits (EOB) and medical receipts via PDF parsing or raw text.
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Optional, Union

from agno.agent import Agent
from src.agents.model_config import DEFAULT_GEMINI_MODEL, gemini_model

from src.schemas.ops import EOBRecord

BILLING_ADMIN_PROMPT = """\
You are the Medical Billing Admin Agent.
Your job is to parse Explanation of Benefits (EOB) documents, clinic invoices, and medical receipts.
Extract key details (Claim ID, Provider, Patient Responsibility, Insurance Paid, Service Date)
and flag potential billing discrepancies or unexpected overcharges.
"""


class EOBParser:
    """PDF parser and line item extraction engine."""

    @staticmethod
    def parse_pdf(file_path: Union[str, Path]) -> str:
        """Extract plain text from a PDF file using pypdf."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"PDF file not found: {file_path}")

        try:
            import pypdf
            reader = pypdf.PdfReader(str(path))
            text_content = []
            for page in reader.pages:
                text_content.append(page.extract_text() or "")
            return "\n".join(text_content)
        except Exception as exc:
            return f"Error parsing PDF: {str(exc)}"

    @staticmethod
    def parse_raw_text(text: str) -> EOBRecord:
        """Fallback rule-based text parser for EOB documents."""
        claim_match = re.search(r"Claim\s*#?\s*:?\s*([A-Za-z0-9-]+)", text, re.IGNORECASE)
        claim_id = claim_match.group(1) if claim_match else "CLM-UNKNOWN"

        provider_match = re.search(r"Provider\s*:?\s*([A-Za-z0-9\s,\.]+)", text, re.IGNORECASE)
        provider = provider_match.group(1).strip() if provider_match else "General Medical Center"

        patient_owed_match = re.search(r"Patient\s*(?:Owes|Responsibility)\s*:?\s*\$?([0-9\.]+)", text, re.IGNORECASE)
        patient_resp = float(patient_owed_match.group(1)) if patient_owed_match else 0.0

        insurance_paid_match = re.search(r"Insurance\s*Paid\s*:?\s*\$?([0-9\.]+)", text, re.IGNORECASE)
        ins_paid = float(insurance_paid_match.group(1)) if insurance_paid_match else 0.0

        date_match = re.search(r"Date\s*(?:of Service)?\s*:?\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}/[0-9]{2}/[0-9]{4})", text, re.IGNORECASE)
        service_date = date_match.group(1) if date_match else "2026-07-01"

        flagged = patient_resp > 200.0 or "discrepancy" in text.lower() or "denied" in text.lower()

        return EOBRecord(
            claim_id=claim_id,
            provider_name=provider,
            patient_responsibility=patient_resp,
            insurance_paid=ins_paid,
            service_date=service_date,
            flagged_discrepancy=flagged,
            notes="Flagged for high patient responsibility or denial keyword." if flagged else "Clean EOB record.",
        )


def create_billing_admin_agent(
    *,
    model_id: Optional[str] = None,
    debug_mode: bool = False,
) -> Agent:
    """Build the Medical Billing Admin agent."""
    resolved_model = model_id or os.getenv("BILLING_MODEL_ID", DEFAULT_GEMINI_MODEL)

    return Agent(
        name="BillingAdmin",
        role="Medical Billing Admin — EOB & Receipt Parser",
        model=gemini_model(resolved_model),
        instructions=BILLING_ADMIN_PROMPT,
        output_schema=EOBRecord,
        debug_mode=debug_mode,
    )
