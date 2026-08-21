# Calendar OAuth Auth Recovery Flow
Labels: wayfinder:task

## The Task
Implement an inline modal/flow for 1-click Google Calendar re-authorization when scraping fails.

## Context
The daily sync process will occasionally encounter expired or revoked OAuth tokens. The user approved the creation of an inline re-auth flow rather than failing silently.

## Requirements
- Detect OAuth token expiration during the 6am/2pm automated scrape or manual sync.
- Display a clear inline modal or banner requesting 1-click re-authorization.
- Do not silently invent events or fail without notifying the user, adhering strictly to the `CONTEXT.md` non-negotiable rule.
