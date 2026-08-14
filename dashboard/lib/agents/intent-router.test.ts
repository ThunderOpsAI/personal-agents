import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import {
  classifyIntent,
  parsePainLogDirective,
  parseNoteDirective,
  parseTaskDirective,
  routeChatMessage,
  executeConfirmedAction,
} from "./intent-router";
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
});
