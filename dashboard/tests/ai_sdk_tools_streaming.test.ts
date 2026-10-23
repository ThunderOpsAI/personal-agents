import { describe, expect, it } from "vitest";
import {
  painLogSchema,
  agendaItemSchema,
  noteSchema,
  calendarActionSchema,
  emailActionSchema,
  smsActionSchema,
  budgetItemSchema,
  painLogTool,
  agendaItemTool,
  noteTool,
  calendarActionTool,
  emailActionTool,
  smsActionTool,
  budgetItemTool,
  createRumbleTools,
  getMelbourneOffset,
  formatMelbourneISO,
  routeChatMessage,
  buildRumbleSystemPrompt,
  MEDICAL_GUARDRAIL,
} from "../lib/agents/intent-router";

describe("Phase 1: Vercel AI SDK Tools & Modernized Intent Router", () => {
  describe("Zod Tool Schemas Validation", () => {
    it("painLogSchema: accepts valid multi-location pain log totaling 100%", () => {
      const valid = {
        score: 7,
        locations: [
          { area: "lumbar", side: "unspecified" as const, percentage: 70 },
          { area: "cervical", side: "left" as const, percentage: 30 },
        ],
        mood: "6",
        notes: "Morning stiffness",
      };
      const parsed = painLogSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it("painLogSchema: rejects multi-location percentages that do not sum to 100%", () => {
      const invalid = {
        score: 6,
        locations: [
          { area: "lumbar", side: "unspecified" as const, percentage: 60 },
          { area: "neck", side: "unspecified" as const, percentage: 20 },
        ],
      };
      const parsed = painLogSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toContain("Location percentage weights must sum to exactly 100%");
      }
    });

    it("painLogSchema: rejects score out of bounds (< 1 or > 10)", () => {
      expect(
        painLogSchema.safeParse({
          score: 0,
          locations: [{ area: "lumbar", percentage: 100 }],
        }).success
      ).toBe(false);

      expect(
        painLogSchema.safeParse({
          score: 11,
          locations: [{ area: "lumbar", percentage: 100 }],
        }).success
      ).toBe(false);
    });

    it("agendaItemSchema: validates task creation and rescheduling", () => {
      const validCreate = {
        action: "create" as const,
        title: "Hydrotherapy session at Wangaratta Indoor Pool",
        scheduled_time: "2026-10-25T10:00:00+11:00",
      };
      expect(agendaItemSchema.safeParse(validCreate).success).toBe(true);

      const validReschedule = {
        action: "reschedule" as const,
        title: "Physiotherapy follow-up",
        scheduled_time: "2026-10-26T14:30:00+11:00",
        existing_item_id: "task_12345",
      };
      expect(agendaItemSchema.safeParse(validReschedule).success).toBe(true);

      const invalidTime = {
        action: "create" as const,
        title: "Invalid date task",
        scheduled_time: "not-a-valid-date",
      };
      expect(agendaItemSchema.safeParse(invalidTime).success).toBe(false);
    });

    it("noteSchema: validates note content and author", () => {
      expect(noteSchema.safeParse({ content: "Pick up compounding prescription" }).success).toBe(true);
      expect(noteSchema.safeParse({ content: "" }).success).toBe(false);
    });

    it("calendarActionSchema: validates create, modify, and delete", () => {
      const validEvent = {
        action: "create" as const,
        summary: "Consultation with Prof. Cunningham",
        start_datetime: "2026-11-04T11:00:00+11:00",
        end_datetime: "2026-11-04T12:00:00+11:00",
      };
      expect(calendarActionSchema.safeParse(validEvent).success).toBe(true);

      const invalidEvent = {
        action: "create" as const,
        summary: "",
        start_datetime: "invalid-time",
      };
      expect(calendarActionSchema.safeParse(invalidEvent).success).toBe(false);
    });

    it("emailActionSchema: validates recipient, subject, and body", () => {
      const validEmail = {
        to: "coordinator@magistratescourt.vic.gov.au",
        subject: "Medical Certificate Update",
        body: "Please find attached the updated medical certificate.",
      };
      expect(emailActionSchema.safeParse(validEmail).success).toBe(true);
      expect(emailActionSchema.safeParse({ to: "", subject: "", body: "" }).success).toBe(false);
    });

    it("smsActionSchema: validates recipient and body", () => {
      expect(smsActionSchema.safeParse({ to: "+61400123456", body: "Arriving at 10:15 AM" }).success).toBe(true);
      expect(smsActionSchema.safeParse({ to: "", body: "" }).success).toBe(false);
    });

    it("budgetItemSchema: validates amount positivity and category", () => {
      const valid = {
        description: "Wangaratta Pharmacy pain medication",
        amount: 45.5,
        category: "medical",
        type: "expense" as const,
      };
      expect(budgetItemSchema.safeParse(valid).success).toBe(true);

      const invalidAmount = {
        description: "Refund",
        amount: -10,
        category: "medical",
        type: "income" as const,
      };
      expect(budgetItemSchema.safeParse(invalidAmount).success).toBe(false);
    });
  });

  describe("Typed Tools Parse -> Preview -> Confirm -> Commit Invariant", () => {
    it("painLogTool returns preview and requires_confirmation without committing", async () => {
      const result = await (painLogTool as any).execute({
        score: 6,
        locations: [{ area: "lumbar", side: "unspecified", percentage: 100 }],
        mood: "7",
        notes: "Mild ache after walking",
      });

      expect(result.requires_confirmation).toBe(true);
      expect(result.preview).toBeDefined();
      expect(result.preview.type).toBe("pain_log");
      expect(result.preview.data.score).toBe(6);
      expect(result.summary).toContain("Pain Score 6/10");
    });

    it("agendaItemTool returns preview for task creation without writing to DB", async () => {
      const result = await (agendaItemTool as any).execute({
        action: "create",
        title: "Review MRI scan results",
        scheduled_time: "2026-10-27T09:00:00+11:00",
      });

      expect(result.requires_confirmation).toBe(true);
      expect(result.preview.type).toBe("task");
      expect(result.preview.data.title).toBe("Review MRI scan results");
    });

    it("noteTool returns preview for note without writing to DB", async () => {
      const result = await (noteTool as any).execute({
        content: "Check pool temperature before session",
        author: "user",
      });

      expect(result.requires_confirmation).toBe(true);
      expect(result.preview.type).toBe("note");
      expect(result.preview.data.content).toBe("Check pool temperature before session");
    });

    it("emailActionTool enforces drafting mode with full preview", async () => {
      const result = await (emailActionTool as any).execute({
        to: "asmedley@shine.com.au",
        subject: "Medical Records Retrieval Update",
        body: "Hi Amanda, please proceed with the hospital records request.",
      });

      expect(result.requires_confirmation).toBe(true);
      expect(result.preview.type).toBe("send_email");
      expect(result.preview.data.to).toBe("asmedley@shine.com.au");
    });

    it("createRumbleTools exports all 7 typed tools", () => {
      const tools = createRumbleTools();
      expect(tools.painLog).toBeDefined();
      expect(tools.manageAgenda).toBeDefined();
      expect(tools.saveNote).toBeDefined();
      expect(tools.manageCalendar).toBeDefined();
      expect(tools.draftEmail).toBeDefined();
      expect(tools.draftSms).toBeDefined();
      expect(tools.logBudgetItem).toBeDefined();
    });
  });

  describe("DST-Safe Australia/Melbourne Time Handling", () => {
    it("dynamically computes AEST (+10:00) in winter and AEDT (+11:00) in summer without hardcoding", () => {
      // July 15 is winter in Melbourne (Standard Time: UTC+10)
      const winterDate = new Date("2026-07-15T12:00:00Z");
      const winterOffset = getMelbourneOffset(winterDate);
      expect(winterOffset).toBe("+10:00");

      // October 24 is summer in Melbourne (Daylight Saving Time: UTC+11)
      const summerDate = new Date("2026-10-24T12:00:00Z");
      const summerOffset = getMelbourneOffset(summerDate);
      expect(summerOffset).toBe("+11:00");
    });

    it("formatMelbourneISO formats dates with correct DST-aware offsets", () => {
      const winterDate = new Date("2026-07-15T02:30:00Z");
      const winterIso = formatMelbourneISO(winterDate);
      expect(winterIso).toBe("2026-07-15T12:30:00+10:00");

      const summerDate = new Date("2026-10-24T02:30:00Z");
      const summerIso = formatMelbourneISO(summerDate);
      expect(summerIso).toBe("2026-10-24T13:30:00+11:00");
    });
  });

  describe("Universal Intent Capture & Offline Fallback", () => {
    it("grounding system prompt includes medical disclaimer and live data headers", async () => {
      const prompt = await buildRumbleSystemPrompt("Tell me about my day");
      expect(prompt).toContain(MEDICAL_GUARDRAIL);
      expect(prompt).toContain("Wangaratta, Victoria, Australia");
      expect(prompt).toContain("LIVE USER DATA (SOURCE OF TRUTH)");
    });

    it("routeChatMessage safely provides decision support fallback when offline", async () => {
      const res = await routeChatMessage("How should I pace my rehabilitation today?");
      expect(res.reply).toBeDefined();
      expect(res.disclaimer).toBe(MEDICAL_GUARDRAIL);
      expect(res.intent).toBeDefined();
    });
  });
});
