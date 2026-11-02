import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import {
  classifyIntent,
  parsePainLogDirective,
  parseNoteDirective,
  parseTaskDirective,
  parseMultiActionSentence,
  buildRumbleSystemPrompt,
  routeChatMessage,
  executeConfirmedAction,
  callGemini,
} from "./intent-router";
import * as intentRouterModule from "./intent-router";
import { contextLoaders } from "./context-loaders";
import { parseReceiptSplits, parseDocumentTextToExtraction } from "./ocr-parser";
import { initDb, closeDb, getNotes, getPainLogsFromDb, getAgendaItems } from "../db";
import path from "path";
import fs from "fs";

const TEST_DB = path.join(process.cwd(), "test_intent_router.db");

describe("TypeScript Intent Router (intent-router.ts)", () => {
  beforeEach(async () => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    initDb(TEST_DB);
  });

  afterEach(async () => {
    await closeDb();
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  describe("Intent Classification", () => {
    it("classifies GREETING", () => {
      expect(classifyIntent("hello")).toBe("GREETING");
      expect(classifyIntent("G'day Rumble")).toBe("GREETING");
      expect(classifyIntent("Good morning")).toBe("GREETING");
    });

    it("classifies LOG_PAIN", () => {
      expect(classifyIntent("Log pain score 6/10 in lumbar (80%) and neck (20%), mood 7, notes felt stiff after sitting.")).toBe("LOG_PAIN");
      expect(classifyIntent("Record pain 5/10 in shoulder 100%")).toBe("LOG_PAIN");
      expect(classifyIntent("Track pain 7 in lower back 100%")).toBe("LOG_PAIN");
    });

    it("classifies PAIN_DISCUSSION (non-write)", () => {
      expect(classifyIntent("My shoulder hurts today")).toBe("PAIN_DISCUSSION");
      expect(classifyIntent("Having some lumbar stiffness")).toBe("PAIN_DISCUSSION");
    });

    it("classifies ADD_NOTE", () => {
      expect(classifyIntent("Add this to notes: buy ergonomic lumbar roll")).toBe("ADD_NOTE");
      expect(classifyIntent("Add note: call Dr Anderson")).toBe("ADD_NOTE");
    });

    it("classifies ADD_TASK", () => {
      expect(classifyIntent("Add task: Call Dr. Anderson")).toBe("ADD_TASK");
      expect(classifyIntent("Remind me to do hydrotherapy tomorrow")).toBe("ADD_TASK");
      expect(classifyIntent("Add to agenda: pick up prescription")).toBe("ADD_TASK");
    });

    it("classifies CHECK_EMAIL", () => {
      expect(classifyIntent("Check my emails for urgent action items")).toBe("CHECK_EMAIL");
      expect(classifyIntent("Any new emails?")).toBe("CHECK_EMAIL");
    });

    it("classifies AGENDA_QUERY", () => {
      expect(classifyIntent("What's on my agenda today?")).toBe("AGENDA_QUERY");
      expect(classifyIntent("Show my schedule")).toBe("AGENDA_QUERY");
    });

    it("classifies WEATHER_QUERY", () => {
      expect(classifyIntent("What's the weather in Wangaratta?")).toBe("WEATHER_QUERY");
      expect(classifyIntent("What are the best washing days?")).toBe("WEATHER_QUERY");
    });
  });

  describe("Pain Log Parsing & Validation", () => {
    it("parses multi-location pain log with 100% total weight", () => {
      const res = parsePainLogDirective("Log pain score 6/10 in lumbar (80%) and neck (20%), mood 7, notes felt stiff after sitting.");
      expect(res.errors).toHaveLength(0);
      expect(res.parsed).toBeDefined();
      expect(res.parsed?.score).toBe(6);
      expect(res.parsed?.locations).toEqual([
        { area: "lumbar", side: "unspecified", percentage: 80 },
        { area: "neck", side: "unspecified", percentage: 20 },
      ]);
      expect(res.parsed?.mood).toBe("7");
      expect(res.parsed?.notes).toBe("felt stiff after sitting.");
    });

    it("defaults single location percentage to 100%", () => {
      const res = parsePainLogDirective("Log pain 5/10 in left shoulder, mood 8");
      expect(res.errors).toHaveLength(0);
      expect(res.parsed?.score).toBe(5);
      expect(res.parsed?.locations).toEqual([
        { area: "shoulder", side: "left", percentage: 100 },
      ]);
      expect(res.parsed?.mood).toBe("8");
    });

    it("rejects multi-location weights that do not sum to 100%", () => {
      const res = parsePainLogDirective("Log pain 6/10 in lumbar (60%) and neck (20%)");
      expect(res.errors.length).toBeGreaterThan(0);
      expect(res.errors[0]).toContain("Location percentage weights must sum to exactly 100%");
      expect(res.parsed).toBeUndefined();
    });

    it("rejects invalid pain score", () => {
      const res = parsePainLogDirective("Log pain score 15/10 in lumbar 100%");
      expect(res.errors.length).toBeGreaterThan(0);
      expect(res.parsed).toBeUndefined();
    });
  });

  describe("Notes and Task Parsing", () => {
    it("parses note content cleanly", () => {
      expect(parseNoteDirective("Add this to notes: buy ergonomic lumbar roll")).toBe("buy ergonomic lumbar roll");
      expect(parseNoteDirective("Add note: call Dr Anderson tomorrow")).toBe("call Dr Anderson tomorrow");
    });

    it("parses task directive cleanly", () => {
      const task = parseTaskDirective("Add task: Call Dr. Anderson");
      expect(task?.title).toBe("Call Dr. Anderson");
      expect(task?.scheduled_time).toBeDefined();
    });
  });

  describe("Confirm-Before-Write Execution", () => {
    it("returns a preview for LOG_PAIN requiring user confirmation", async () => {
      const res = await routeChatMessage("Log pain score 6/10 in lumbar (80%) and neck (20%), mood 7, notes felt stiff after sitting.");
      expect(res.intent).toBe("LOG_PAIN");
      expect(res.requires_confirmation).toBe(true);
      expect(res.preview).toBeDefined();
      expect(res.preview?.type).toBe("pain_log");
      expect(res.preview?.data.score).toBe(6);

      // Verify nothing is written to DB yet
      const logs = await getPainLogsFromDb();
      expect(logs).toHaveLength(0);
    });

    it("commits confirmed pain log to database when executed", async () => {
      const confirmAction = {
        type: "pain_log" as const,
        data: {
          score: 6,
          locations: [
            { area: "lumbar", side: "unspecified", percentage: 80 },
            { area: "neck", side: "unspecified", percentage: 20 },
          ],
          mood: "7",
          notes: "felt stiff after sitting.",
        },
      };

      const result = await executeConfirmedAction(confirmAction);
      expect(result.success).toBe(true);
      expect(result.message).toContain("Confirmed and saved pain log");

      const logs = await getPainLogsFromDb();
      expect(logs).toHaveLength(1);
      expect(logs[0].score).toBe(6);
      expect(logs[0].locations).toEqual([
        { area: "lumbar", side: "unspecified", percentage: 80 },
        { area: "neck", side: "unspecified", percentage: 20 },
      ]);
    });

    it("commits confirmed note to database when executed", async () => {
      const confirmAction = {
        type: "note" as const,
        data: { content: "buy ergonomic lumbar roll", author: "user" },
      };

      const result = await executeConfirmedAction(confirmAction);
      expect(result.success).toBe(true);

      const notes = await getNotes();
      expect(notes).toHaveLength(1);
      expect(notes[0].content).toBe("buy ergonomic lumbar roll");
    });

    it("commits confirmed task to agenda database when executed", async () => {
      const confirmAction = {
        type: "task" as const,
        data: { title: "Call Dr. Anderson", scheduled_time: "2026-08-15T09:00:00+10:00" },
      };

      const result = await executeConfirmedAction(confirmAction);
      expect(result.success).toBe(true);

      const agenda = await getAgendaItems();
      const created = agenda.find(i => i.title === "Call Dr. Anderson");
      expect(created).toBeDefined();
      expect(created?.item_type).toBe("task");
    });
  });

  describe("Phase 1: Omniscient Context Brain 3.0 & Multimodal Pipeline", () => {
    it("buildRumbleSystemPrompt includes all Brain 3.0 live context headers", async () => {
      const prompt = await buildRumbleSystemPrompt("Tell me about my budget and rehab");
      expect(prompt).toContain("[CURRENT MONTH BUDGET & EXPENSES]");
      expect(prompt).toContain("[RECURRING BILLS & SUBSCRIPTIONS]");
      expect(prompt).toContain("[7-DAY PAIN TREND & REHAB RELIEF DELTAS]");
      expect(prompt).toContain("[RELEVANT SEMANTIC MEMORIES]");
      expect(prompt).toContain("[ACTIVE SOUL.MD LEARNED RULES]");
    });

    it("buildRumbleSystemPrompt formats actual dollar amounts and category breakdown when budget items exist", async () => {
      const { createBudgetItem } = await import("../db");
      await createBudgetItem({
        category: "Groceries",
        description: "Weekly supermarket run",
        amount: 85.50,
        type: "expense",
      });
      await createBudgetItem({
        category: "Medical",
        description: "Chemist prescription",
        amount: 24.00,
        type: "expense",
      });

      const prompt = await buildRumbleSystemPrompt("What is my budget status?");
      expect(prompt).toContain("Total Spent");
      expect(prompt).toContain("$109.50");
      expect(prompt).toContain("Groceries: $85.50");
      expect(prompt).toContain("Medical: $24.00");
    });

    it("deterministically unpacks 1-sentence messy multi-action update", () => {
      const message = "Had hydro today, pain dropped from 7 to 5, cost $8.50 entry, and remind me to ask Dr. Riandito about the referral Friday";
      const res = parseMultiActionSentence(message);
      expect(res.isMultiAction).toBe(true);
      expect(res.actions.length).toBeGreaterThanOrEqual(4);

      const types = res.actions.map(a => a.type);
      expect(types).toContain("rehab_relief");
      expect(types).toContain("pain_log");
      expect(types).toContain("budget_item");
      expect(types).toContain("task");

      const rehab = res.actions.find(a => a.type === "rehab_relief");
      expect(rehab?.data.prePainScore).toBe(7);
      expect(rehab?.data.postPainScore).toBe(5);

      const budget = res.actions.find(a => a.type === "budget_item");
      expect(budget?.data.amount).toBe(8.50);
      expect(budget?.data.category).toBe("Medical");

      const task = res.actions.find(a => a.type === "task");
      expect(task?.data.title).toContain("Ask Dr. Riandito about the referral");
    });

    it("routes 1-sentence multi-action update through routeChatMessage as multi_action preview", async () => {
      const message = "Had hydro today, pain dropped from 7 to 5, cost $8.50 entry, and remind me to ask Dr. Riandito about the referral Friday";
      const routeRes = await routeChatMessage(message);
      expect(routeRes.requires_confirmation).toBe(true);
      expect(routeRes.preview?.type).toBe("multi_action");
      expect(routeRes.preview?.data.actions.length).toBeGreaterThanOrEqual(4);
      expect(routeRes.reply).toContain("Rehab Relief");
      expect(routeRes.reply).toContain("Hydrotherapy Entry");
    });

    it("splits mixed receipt into itemized categories", () => {
      const receiptText = `
        COLES SUPERMARKET WANGARATTA
        Milk 2L $4.50
        Bread Wholemeal $3.80
        Panadol Extra 24s $8.20
        Paper Towel 2pk $4.00
        TOTAL: $20.50
      `;
      const res = parseReceiptSplits(receiptText);
      expect(res.total).toBe(20.50);
      expect(res.splits.length).toBeGreaterThanOrEqual(3);

      const categories = res.splits.map(s => s.category);
      expect(categories).toContain("Groceries");
      expect(categories).toContain("Medical");
      expect(categories).toContain("Household");
    });

    it("extracts structured data from multimodal documents", () => {
      // Mixed receipt
      const mixed = parseDocumentTextToExtraction("Coles Supermarket receipt\nMilk $4.50\nPanadol $8.20\nTotal $12.70");
      expect(mixed.docType).toBe("mixed_receipt");
      expect(mixed.splits?.length).toBeGreaterThanOrEqual(2);

      // Clinical/Medical invoice
      const med = parseDocumentTextToExtraction("Dr. Reno Riandito Consultation Fee Total: $280.00 Date: 2026-10-31");
      expect(med.docType).toBe("medical_receipt");
      expect(med.amount).toBe(280.00);

      // Recurring utility bill
      const bill = parseDocumentTextToExtraction("Origin Energy Electricity Bill Total Due: $165.50 Due Date: 2026-11-20");
      expect(bill.docType).toBe("recurring_bill");
      expect(bill.amount).toBe(165.50);

      // Medication box
      const medBox = parseDocumentTextToExtraction("Lyrica 75mg capsules. Take 1 capsule twice daily with food.");
      expect(medBox.docType).toBe("medication_box");
      expect(medBox.medication?.name).toBe("Lyrica");
      expect(medBox.medication?.dosage).toBe("75mg");
    });
  });

  describe("Phase 2: Performance Tiering & Isolated Context Loaders", () => {
    it("each intent triggers only its mapped loaders", async () => {
      const agendaSpy = vi.spyOn(contextLoaders, "loadAgenda").mockResolvedValue("[ACTIVE AGENDA ITEMS]\nMock agenda");
      const emailSpy = vi.spyOn(contextLoaders, "loadEmail").mockResolvedValue("[LIVE GMAIL INBOX & ARCHIVE]\nMock email");
      const smsSpy = vi.spyOn(contextLoaders, "loadSms").mockResolvedValue("[RECENT SMS / TEXT MESSAGES]\nMock sms");
      const budgetSpy = vi.spyOn(contextLoaders, "loadBudget").mockResolvedValue("[CURRENT MONTH BUDGET & EXPENSES]\nMock budget");

      // ADD_TASK -> mapped to [agenda]
      const promptTask = await buildRumbleSystemPrompt("Add buy milk", "ADD_TASK");
      expect(agendaSpy).toHaveBeenCalled();
      expect(emailSpy).not.toHaveBeenCalled();
      expect(smsSpy).not.toHaveBeenCalled();
      expect(budgetSpy).not.toHaveBeenCalled();
      expect(promptTask).toContain("Mock agenda");
      expect(promptTask).not.toContain("Mock email");

      agendaSpy.mockClear();
      emailSpy.mockClear();
      smsSpy.mockClear();
      budgetSpy.mockClear();

      // CHECK_EMAIL -> mapped to [email]
      const promptEmail = await buildRumbleSystemPrompt("Check my emails", "CHECK_EMAIL");
      expect(emailSpy).toHaveBeenCalled();
      expect(agendaSpy).not.toHaveBeenCalled();
      expect(smsSpy).not.toHaveBeenCalled();
      expect(budgetSpy).not.toHaveBeenCalled();
      expect(promptEmail).toContain("Mock email");

      agendaSpy.mockClear();
      emailSpy.mockClear();
      smsSpy.mockClear();
      budgetSpy.mockClear();

      // CHECK_SMS -> mapped to [sms]
      const promptSms = await buildRumbleSystemPrompt("Check text messages", "CHECK_SMS");
      expect(smsSpy).toHaveBeenCalled();
      expect(agendaSpy).not.toHaveBeenCalled();
      expect(emailSpy).not.toHaveBeenCalled();
      expect(promptSms).toContain("Mock sms");
    });

    it("default intent still invokes all loaders", async () => {
      const agendaSpy = vi.spyOn(contextLoaders, "loadAgenda").mockResolvedValue("[ACTIVE AGENDA ITEMS]\nAll clear");
      const emailSpy = vi.spyOn(contextLoaders, "loadEmail").mockResolvedValue("[LIVE GMAIL INBOX & ARCHIVE]\nNo emails");
      const smsSpy = vi.spyOn(contextLoaders, "loadSms").mockResolvedValue("[RECENT SMS / TEXT MESSAGES]\nNo texts");
      const budgetSpy = vi.spyOn(contextLoaders, "loadBudget").mockResolvedValue("[CURRENT MONTH BUDGET & EXPENSES]\nNo budget");
      const washingSpy = vi.spyOn(contextLoaders, "loadWashing").mockResolvedValue("[WANGARATTA WEATHER & WASHING FORECAST]\nFine");

      await buildRumbleSystemPrompt("General conversational query");
      expect(agendaSpy).toHaveBeenCalled();
      expect(emailSpy).toHaveBeenCalled();
      expect(smsSpy).toHaveBeenCalled();
      expect(budgetSpy).toHaveBeenCalled();
      expect(washingSpy).toHaveBeenCalled();
    });

    it("fast path: 'add buy milk at 3pm to agenda' returns an action preview with zero Gemini calls", async () => {
      const geminiSpy = vi.spyOn(intentRouterModule, "callGemini");

      const res = await routeChatMessage("add buy milk at 3pm to agenda");
      expect(res.intent).toBe("ADD_TASK");
      expect(res.requires_confirmation).toBe(true);
      expect(res.preview).toBeDefined();
      expect(res.preview?.type).toBe("task");
      expect(res.preview?.data.title).toBe("Buy milk");
      expect(res.preview?.data.scheduled_time).toBeDefined();
      expect(res.preview?.data.scheduled_time).toContain("T15:00:00");
      expect(res.reply).toContain("Buy milk");

      expect(geminiSpy).not.toHaveBeenCalled();
    });

    it("fast path: 'add buy milk to notes' returns an action preview with zero Gemini calls", async () => {
      const geminiSpy = vi.spyOn(intentRouterModule, "callGemini");

      const res = await routeChatMessage("add buy milk to notes");
      expect(res.intent).toBe("ADD_NOTE");
      expect(res.requires_confirmation).toBe(true);
      expect(res.preview).toBeDefined();
      expect(res.preview?.type).toBe("note");
      expect(res.preview?.data.content).toBe("buy milk");

      expect(geminiSpy).not.toHaveBeenCalled();
    });

    it("fast path: simple SMS check returns summary with zero Gemini calls", async () => {
      const geminiSpy = vi.spyOn(intentRouterModule, "callGemini");

      const res = await routeChatMessage("show my text messages");
      expect(res.intent).toBe("CHECK_SMS");
      expect(res.requires_confirmation).toBe(false);
      expect(res.reply).toBeDefined();

      expect(geminiSpy).not.toHaveBeenCalled();
    });
  });
});
