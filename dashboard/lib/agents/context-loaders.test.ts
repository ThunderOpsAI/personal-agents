import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  loadAgenda,
  loadNotes,
  loadPain,
  loadBudget,
  loadBills,
  loadExercisePrefs,
  loadSemanticMemory,
  loadSoulRules,
  loadCalendar,
  loadEmail,
  loadWashing,
  loadSms,
  INTENT_CONTEXT_MAP,
  ALL_LOADERS,
  LOADERS,
  contextLoaders,
} from "./context-loaders";
import * as db from "../db";
import * as googleAuth from "../google-auth";
import * as agendaEngine from "../agenda-engine";
import * as semanticMemory from "../semantic-memory";

describe("Context Loaders (context-loaders.ts)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("INTENT_CONTEXT_MAP", () => {
    it("maps ADD_TASK to agenda loader", () => {
      expect(INTENT_CONTEXT_MAP.ADD_TASK).toEqual(["agenda"]);
    });

    it("maps ADD_NOTE to notes loader", () => {
      expect(INTENT_CONTEXT_MAP.ADD_NOTE).toEqual(["notes"]);
    });

    it("maps LOG_PAIN to pain loader", () => {
      expect(INTENT_CONTEXT_MAP.LOG_PAIN).toEqual(["pain"]);
    });

    it("maps CHECK_EMAIL to email loader", () => {
      expect(INTENT_CONTEXT_MAP.CHECK_EMAIL).toEqual(["email"]);
    });

    it("maps CHECK_SMS to sms loader", () => {
      expect(INTENT_CONTEXT_MAP.CHECK_SMS).toEqual(["sms"]);
    });

    it("maps AGENDA_QUERY to calendar and agenda loaders", () => {
      expect(INTENT_CONTEXT_MAP.AGENDA_QUERY).toEqual(["calendar", "agenda"]);
    });

    it("maps BUDGET_QUERY to budget and bills loaders", () => {
      expect(INTENT_CONTEXT_MAP.BUDGET_QUERY).toEqual(["budget", "bills"]);
    });

    it("maps GENERAL to ALL_LOADERS", () => {
      expect(INTENT_CONTEXT_MAP.GENERAL).toEqual(ALL_LOADERS);
    });
  });

  describe("Failure handling - returns explicit unavailable string and no fake data", () => {
    it("loadAgenda returns unavailable on db failure", async () => {
      vi.spyOn(db, "getAgendaItems").mockRejectedValueOnce(new Error("Connection reset"));
      const result = await loadAgenda();
      expect(result).toContain("[ACTIVE AGENDA ITEMS]");
      expect(result).toContain("Agenda: unavailable (Connection reset)");
      expect(result).not.toContain("fake");
    });

    it("loadNotes returns unavailable on db failure", async () => {
      vi.spyOn(db, "getNotes").mockRejectedValueOnce(new Error("DB locked"));
      const result = await loadNotes();
      expect(result).toContain("[RECENT USER NOTES]");
      expect(result).toContain("Notes: unavailable (DB locked)");
    });

    it("loadPain returns unavailable on db failure", async () => {
      vi.spyOn(db, "getPainLogsFromDb").mockRejectedValueOnce(new Error("Query failed"));
      const result = await loadPain();
      expect(result).toContain("[LATEST HEALTH & PAIN LOG]");
      expect(result).toContain("Pain logs: unavailable (Query failed)");
    });

    it("loadBudget returns unavailable on error", async () => {
      vi.spyOn(db, "getBudgetItems").mockRejectedValueOnce(new Error("Disk IO error"));
      const result = await loadBudget();
      expect(result).toContain("[CURRENT MONTH BUDGET & EXPENSES]");
      expect(result).toContain("Budget: unavailable (Disk IO error)");
    });

    it("loadBills returns unavailable on db failure", async () => {
      vi.spyOn(db, "getBillsSubscriptions").mockRejectedValueOnce(new Error("Table corrupted"));
      const result = await loadBills();
      expect(result).toContain("[RECURRING BILLS & SUBSCRIPTIONS]");
      expect(result).toContain("Bills: unavailable (Table corrupted)");
    });

    it("loadExercisePrefs returns unavailable on db failure", async () => {
      vi.spyOn(db, "getExercisePreferences").mockRejectedValueOnce(new Error("DB error"));
      const result = await loadExercisePrefs();
      expect(result).toContain("[TOP HISTORICAL RELIEF DRIVERS]");
      expect(result).toContain("Exercise preferences: unavailable (DB error)");
    });

    it("loadSemanticMemory returns unavailable on vector search failure", async () => {
      vi.spyOn(semanticMemory, "searchSemanticMemories").mockRejectedValueOnce(new Error("Embedding timeout"));
      const result = await loadSemanticMemory("test query");
      expect(result).toContain("[RELEVANT SEMANTIC MEMORIES]");
      expect(result).toContain("Semantic memories: unavailable (Embedding timeout)");
    });

    it("loadSoulRules returns unavailable on db failure", async () => {
      vi.spyOn(db, "getSoulLearnedRules").mockRejectedValueOnce(new Error("File missing"));
      const result = await loadSoulRules();
      expect(result).toContain("[ACTIVE SOUL.MD LEARNED RULES]");
      expect(result).toContain("SOUL rules: unavailable (File missing)");
    });

    it("loadCalendar returns unavailable on fetch error", async () => {
      vi.spyOn(googleAuth, "fetchLiveCalendarEvents").mockRejectedValueOnce(new Error("503 Service Unavailable"));
      const result = await loadCalendar();
      expect(result).toContain("[LIVE GOOGLE CALENDAR]");
      expect(result).toContain("Google Calendar: unavailable (503 Service Unavailable)");
    });

    it("loadCalendar returns auth_required message when OAuth missing", async () => {
      vi.spyOn(googleAuth, "fetchLiveCalendarEvents").mockResolvedValueOnce({
        status: "auth_required",
        events: [],
      });
      const result = await loadCalendar();
      expect(result).toContain("OAuth authorization required at /api/v1/auth/google");
    });

    it("loadEmail returns unavailable on network error", async () => {
      vi.spyOn(googleAuth, "fetchLiveGmailMessages").mockRejectedValueOnce(new Error("DNS lookup failed"));
      const result = await loadEmail();
      expect(result).toContain("[LIVE GMAIL INBOX & ARCHIVE]");
      expect(result).toContain("Gmail: unavailable (DNS lookup failed)");
    });

    it("loadEmail returns auth_required message when OAuth missing", async () => {
      vi.spyOn(googleAuth, "fetchLiveGmailMessages").mockResolvedValueOnce({
        status: "auth_required",
        messages: [],
      });
      const result = await loadEmail();
      expect(result).toContain("OAuth authorization required at /api/v1/auth/google");
    });

    it("loadWashing returns unavailable on network error", async () => {
      vi.spyOn(agendaEngine, "selectWashingDays").mockRejectedValueOnce(new Error("Open-Meteo timeout"));
      const result = await loadWashing();
      expect(result).toContain("[WANGARATTA WEATHER & WASHING FORECAST]");
      expect(result).toContain("Weather: unavailable (Open-Meteo timeout)");
    });

    it("loadSms returns unavailable on db failure", async () => {
      vi.spyOn(db, "getSmsMessages").mockRejectedValueOnce(new Error("Permission denied"));
      const result = await loadSms();
      expect(result).toContain("[RECENT SMS / TEXT MESSAGES]");
      expect(result).toContain("SMS: unavailable (Permission denied)");
    });
  });

  describe("LOADERS registry execution", () => {
    it("executes loaders from registry and contextLoaders object", async () => {
      const agendaSpy = vi.spyOn(contextLoaders, "loadAgenda").mockResolvedValueOnce("[ACTIVE AGENDA ITEMS]\nAll clear");
      const res = await LOADERS.agenda();
      expect(agendaSpy).toHaveBeenCalledTimes(1);
      expect(res).toContain("All clear");
    });
  });
});
