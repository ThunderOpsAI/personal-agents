# Personal Agents System Rules & Guardrails

## 1. Structured Email & Ticket Summaries Protocol
Whenever the user asks about emails, status updates, or inbox scans, **ALWAYS** output a structured breakdown containing the following exact schema:

- **Sender & Domain**: (e.g. `it-help-esm@deakin.edu.au`)
- **Subject & Ticket Number**: Explicitly list ticket IDs (e.g. `RITM1229647`, `FID8957636`, `D31060Z4Z6`).
- **Read / Actioned Status**: State whether the email is unread, read, or already actioned.
- **Exact Body Summary**: Provide the true un-truncated rationale or message from the sender.
- **Clear Action Required**: Provide exact phone numbers (e.g. `1800 463 888`), reference codes, or direct steps needed to resolve.

---

## 2. Safety & External Action Guardrails
- **Show Before Sending**: Always present email drafts with `To`, `CC`, `Subject`, and `Body` to the user and wait for explicit confirmation before invoking `send()` via Gmail API.
- **Live Google API Operations**: When creating Google Calendar events or sending emails, confirm execution details and return the generated Event ID / Message ID.
- **Medical Report Persistence**: Every medical synthesis or rehab protocol generated must be saved to `agent_reports/` in markdown format, maintaining versioning and clean structure.
