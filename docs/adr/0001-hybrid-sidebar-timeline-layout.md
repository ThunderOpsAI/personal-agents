# 1. Hybrid Persistent Sidebar & Chronological Timeline Dashboard Layout

Date: 2026-08-04

## Context

The Rumble OS Executive Command Center previously used a single long dual-column scrolling page. As features grew (3-hour pain logging, ESM tickets, physio routines, calendar barriers, pipeline controls), navigation required significant vertical scrolling and context switching between operational tasks and health tracking.

During prototype stress-testing (`/prototype`), three layout approaches were evaluated:
- Variant A: High-Density Command Tabs
- Variant B: Dual-Column Split Workspace with Persistent Sidebar
- Variant C: Chronological Timeline Stream

## Decision

We adopt a **Hybrid of Variant B and Variant C**:
1. **Persistent Quick-Log Sidebar (Variant B)**: A fixed 360px left sidebar housing the 3-hour Pain Logger, Doctor Report Exporter, and Pipeline Ingest Controls.
2. **Chronological Timeline Stream (Variant C)**: The main right canvas arranges daily tasks, physio routines, ESM tickets, and calendar barriers into sequential 3-hour protocol time nodes (09:00 AM Morning, 12:00 PM Midday, 03:00 PM Afternoon, 09:00 PM Night).

## Consequences

### Positive
- Zero context switching: Users can log symptoms or trigger pipeline ingests from anywhere on the page without losing track of their daily agenda stream.
- Structured daily flow: Time nodes align with the 3-hour medical logging protocol (9 AM, 12 PM, 3 PM, 9 PM).
- High visual clarity on desktop and mobile.

### Negative / Trade-offs
- Less horizontal space for timeline cards due to the 360px persistent sidebar on desktop.
- Requires responsive collapse to stacked mode on mobile screens below 1024px.
