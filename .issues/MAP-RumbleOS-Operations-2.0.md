# Rumble OS Operations 2.0 Map
Labels: wayfinder:map

## Destination
Deliver a complete feature spec and implementation for Rumble OS Personal Operations 2.0: a robust, fully-accessible Notes CRUD with archiving; an interactive, calendar-month-based Weekly/Monthly Budget Analytics hub; a 3-day (Yesterday, Today, Tomorrow) Agenda stream with integrated push/web notifications for pain logging (3-hour intervals from 6am to 12am, excluding 3am) and reinstate capability; and a 1-click calendar sync auth recovery flow.

## Notes
- Domains: Notes, Budget Analytics, Agenda Notifications, Calendar Sync.
- Standing preferences: Maximum accessibility and functionality over token limits/speed. High interactivity for charts. Dual-layer notifications (push/web + agenda alerts). 3 persistent agenda views (Yesterday, Today, Tomorrow).
- Skills to consult: modern-web-guidance (for UI/layout), react/dashboard (Next.js).

## Decisions so far

## Not yet specified
- How will the 3-day Agenda state (Yesterday, Today, Tomorrow) be synced with the DB so that reinstated tasks are properly re-inserted without duplicating historical data?
- Charting library selection for the Budget view to ensure maximum interactivity and accessibility.
- Notification permission request flow: When and how do we prompt the user for Web Push permissions to handle the 6am-12am pain log reminders?
- Details of the schema migration required for Notes (adding `isArchived`, `pinned` fields) and how the Archive view is isolated from active.

## Out of scope
