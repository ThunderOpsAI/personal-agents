# 3-Day Agenda & Notification System
Labels: wayfinder:task

## The Task
Refactor the Agenda to support a persistent 3-day view (Yesterday, Today, Tomorrow), reinstate capabilities, and implement robust web/push notifications for recurring events.

## Context
The user stated: "should be both for notifications, reinstate to active agenda button, when that daily agenda is moved the dismissed task goes with it. There should realistically be 3 daily agendas available at all times. today, tomorrow, yesterday."

## Requirements
- Remove the static "6am daily pain log" agenda item.
- Implement web/push notifications + app banners prompting the pain log every 3 hours starting at 6am (EXCLUDING 3am). 
- Add a "Return to Yesterday" icon/button on the left side of "Continue to tomorrow".
- Support reinstating accidentally dismissed cards; reinstated items must return to the active agenda and stay with their assigned day.
- Ensure state persistence across the 3 views.
