# Rumble OS - E2E Testing Specification

This document serves as the absolute source of truth for the QA Engineering Agent responsible for writing Playwright E2E tests for Rumble OS. 

**DO NOT execute tests. Your job is ONLY to read this spec and write the `.spec.ts` files in `dashboard/tests/e2e/`.**

## Environment Setup
- **Framework:** Playwright (Node.js)
- **Directory:** `dashboard/tests/e2e/`
- **Target:** `http://localhost:3000`

---

## Exhaustive Test Scenarios

### 1. Pain Logging System (Crucial)
Rumble OS heavily relies on accurate pain tracking. The tests must exhaustively verify the pain logging flow.
- **Triggering:** Verify pain logs can be triggered via the agenda card ("Log Pain") AND via natural language in Rumble Chat (e.g., "My lower back hurts at a 6/10 today").
- **UI Validation:** Ensure the modal correctly renders:
  - **Score Selector:** Sliders or buttons for 1-10 pain score.
  - **Location Multi-Select:** Ability to log multiple anatomical locations (e.g., lumbar, cervical) and assign them percentage weights totaling 100%.
  - **Modifiers:** Mood selector and notes text area.
- **Submission:** Verify that submitting the pain log fires the correct API call (`POST /api/v1/pain/log` or equivalent).
- **Persistence Validation:** Reload the page and ensure the new pain log appears in the "Recent Pain" section or agenda history.

### 2. Agenda & Task Management
- **Rendering:** Assert that Daily, Weekly, and Monthly streams populate correctly via `GET /api/v1/agenda`.
- **Standing Protocols:** Verify that `Morning Adaptive Yoga Routine` (9:00 AM), `Evening Adaptive Yoga Routine` (9:00 PM), and `Night Meditation Protocol` (9:30 PM) render at their strict designated times.
- **Task Lifecycle:** 
  - **Done:** Clicking the "Done" button strikes through the text, moves it to the bottom, and triggers `update_status: 'completed'`.
  - **Reschedule:** Clicking "Delay" or "Postpone", picking a new date/time, and verifying the item moves to the future date.

### 3. Rehab & Exercise Protocols
- **Explore Exercises:** Open an exercise or Yoga card.
  - Assert that the UI allows the user to dynamically swap or change yoga poses (testing the fallback/alternative exercise logic).
- **Meditation & Insight Loop:** 
  - Complete a "Night Meditation Protocol".
  - Assert that completing this triggers the backend Insight Engine. 
  - Verify that a `[Rumble Insight]` item eventually spawns in the agenda stream as a result of the completed meditation.

### 4. Rumble Insight Approval Flow
- **Rendering:** Ensure `item_type: 'insight'` cards (both episodic and weekly) render distinctly with **Approve** and **Reject** (or Dismiss/Done) buttons.
- **Actioning:** 
  - Click **Approve** and assert the card resolves to completed.
  - Verify this triggers the backend to commit the learning to ChromaDB/SOUL.md.
  - Click **Reject** and assert the card is dismissed.

### 5. Notes System
- **CRUD Operations:** 
  - Create a new note from the UI.
  - Edit the content of an existing note.
  - Delete a note and ensure it disappears from the DOM.
- **Pinning:** 
  - Pin a note and verify it visually moves to the top or gains a pinned CSS class.
  - Refresh the page and assert the pin state persists.
- **Agent Generation:** 
  - Open Rumble Chat and ask "Take a note that I need to buy more resistance bands."
  - Assert that Rumble effectively and accurately generates the note in the Notes panel without manual user entry.

### 6. Email Integration & Safeguards
- **Intent Extraction:** Open Rumble Chat and ask "Send an email to james.jones2086@gmail.com about my physical therapy."
- **Safety Check:** Assert that Rumble **does not** send the email immediately, but instead surfaces an explicit authorization/confirmation state (as per `needsApproval` architecture rules).
- **Execution:**
  - Click the confirmation/approval button.
  - **CRITICAL ASSERTION:** The test MUST ensure the dispatched email's Subject line begins with `RUMBLE TEST` so the user knows it was automated.
  - Assert the UI reflects a successful dispatch.

### 7. Encyclopedia & Continuous Learning
- **Progression Flow:** 
  - Open the Encyclopedia / Learning module.
  - Read/navigate all the way through a specific chapter.
  - Assert that finishing the chapter fires a completion event.
  - **Assertion:** Verify the system automatically unlocks or generates the subsequent chapter in the sequence.
- **API Tests:** Test `GET /api/v1/learn/topic` and `GET /api/v1/learn/rotate` endpoints to ensure topic rotation (e.g. 3 suggestions) works as intended.

### 8. Rumble Chat & Context Awareness
- **Context Persistence:** 
  - Open Rumble Chat modal.
  - Send: "Remember that my right shoulder is feeling stiff."
  - Wait for the LLM response.
  - Close the modal entirely.
  - Reopen the modal and assert the history is still visible in the DOM (verifying the 12-hour DB persistence).
- **Universal Intent Capture:** Verify that interacting with unassigned/fallback buttons opens Rumble Chat with the correct context pre-loaded.

---

## Agent Handoff Instructions

**Agent 1 (Test Writer):** Read this spec carefully. Create highly modular Playwright tests under `dashboard/tests/e2e/`. Use Page Object Models where appropriate. Ensure all assertions are strict and resilient to network delays (use Playwright's auto-waiting `expect`). 

**Agent 2 (Test Runner):** Execute `test_suite/run_tests.sh`. If tests fail, diagnose whether it is a flaky test or an application bug. If it is an application bug, fix the source code in `dashboard/` and re-run until all tests go green. Finally, output a summary report.
