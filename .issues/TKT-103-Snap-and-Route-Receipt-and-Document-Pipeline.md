# Snap-and-Route Multimodal Receipt & Document Pipeline
Labels: wayfinder:prototype, status:completed
Parent: MAP-RumbleOS-Brain-3.0.md
Blocked-By: none
Blocks: none

## Status
**Completed & Verified** (Vitest: `ocr_parser.test.ts` & `intent-router.test.ts` passed, full suite 335/335 passed)

## Resolution & Implementation
1. **Multi-Category Receipt Splitting:** Implemented `parseReceiptSplits` and `StructuredDocumentExtraction` in `ocr-parser.ts`, breaking mixed dockets into category line-items.
2. **Medical & WorkCover Dual-Logging:** Automatic extraction of clinical dockets into both `budget_items` (`category: "Medical"`) and `medical_receipts` records with out-of-pocket tracking for WorkCover/Medicare accumulation.
3. **Recurring Bill Price-Creep Detection:** Implemented `upsertBillSubscription` with previous-amount comparison in `db.ts`, flagging price inflation in chat responses and generating due-date reminders.
4. **Clinical Letters & Medication Boxes:** Automatic document classification (`detectDocumentType`) routing appointment dates to calendar/task actions and dosage instructions to semantic memory notes.
5. **Interactive Confirmation UI:** Upgraded `renderPendingActionButtons` in `dashboard/app.js` with itemized split cards and "Confirm Itemized Splits" vs. "Merge as Single Total" actions.

## Question
What should the multimodal extraction schema (`ocr-parser.ts` / `intent-router.ts`) and interactive Chat Confirmation Card UI (`dashboard/app.js`) look like when the user snaps a photo of a receipt, medical invoice, utility bill, referral letter, or medication box in Rumble Chat?

Specifically:
1. **Multi-Category Receipt Splitter:** How should a mixed supermarket/pharmacy docket display editable category splits (e.g., `Groceries`, `Medical/Pharmacy`, `Household`) with a 1-tap "Confirm All Splits" vs. "Merge as Single Expense" toggle?
2. **Medical & WorkCover Dual-Logger:** How should clinical/pharmacy receipts automatically populate both `budget_items` (category: `Medical`) and `medical_receipts` (provider, service, out-of-pocket amount, receipt date)?
3. **Recurring Bill & Price-Creep Detector:** How should utility/subscription invoices match against `bills_subscriptions`, flag price increases against prior periods, and schedule due-date Agenda alerts?
4. **Clinical Letters & Medication Boxes:** How should appointment slips, specialist referrals, and prescription labels present combined Calendar + Agenda Task + Semantic Medical Note actions in a single clean confirmation card?
