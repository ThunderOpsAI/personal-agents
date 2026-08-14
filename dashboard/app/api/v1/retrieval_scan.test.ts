import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST, GET } from "./retrieval/scan/route";
import { closeDb, initDb, getAgendaItems } from "../../../lib/db";
import * as googleAuth from "../../../lib/google-auth";
import fs from "fs";
import path from "path";

const TEST_DB_PATH = path.join(process.cwd(), "test_retrieval_scan_route.db");

describe("API Route: POST /api/v1/retrieval/scan (dashboard/app/api/v1/retrieval/scan/route.ts)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    initDb(TEST_DB_PATH);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await closeDb();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    process.env = originalEnv;
  });

  it("executes retrieval scan, extracts action alerts, and injects them into daily agenda", async () => {
    vi.spyOn(googleAuth, "fetchLiveGmailMessages").mockResolvedValue({
      status: "success",
      messages: [
        {
          id: "msg_hostplus_due_1330",
          threadId: "th_hp",
          subject: "Hostplus notice due by 1:30 PM",
          snippet: "Please complete super choice form by 1:30 PM today.",
          from: "admin@hostplus.com.au",
          date: "2026-08-11T09:00:00Z",
          bodySummary: "Action required for Hostplus super notice.",
          actionRequired: true,
        },
      ],
    });

    vi.spyOn(googleAuth, "fetchLiveCalendarEvents").mockResolvedValue({
      status: "success",
      events: [
        {
          id: "evt_action_req_1",
          summary: "Hydrotherapy Preparation - Action Required",
          description: "Confirm towel and gear readiness before pool session",
          start: "2026-08-11T10:00:00+10:00",
          end: "2026-08-11T11:00:00+10:00",
          status: "confirmed",
        },
      ],
    });

    const response = await POST(new Request("https://rumble.test/api/v1/retrieval/scan"));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe("success");
    expect(data.timezone).toBe("Australia/Melbourne");
    expect(data.scanned_gmail_count).toBe(1);
    expect(data.scanned_calendar_count).toBe(1);
    expect(data.injected_alerts).toHaveLength(2);

    // Verify item injected into agenda DB at 13:30 slot for Hostplus
    const hostplusAlert = data.injected_alerts.find((item: any) =>
      item.id.includes("msg_hostplus_due_1330")
    );
    expect(hostplusAlert).toBeDefined();
    expect(hostplusAlert.title).toBe("Action Required: Hostplus notice due by 1:30 PM");
    expect(hostplusAlert.scheduled_time).toContain("T13:30:00+10:00");

    // Verify DB persistence
    const dbItems = await getAgendaItems();
    expect(dbItems.length).toBeGreaterThanOrEqual(2);
  });

  it("supports GET /api/v1/retrieval/scan as well", async () => {
    vi.spyOn(googleAuth, "fetchLiveGmailMessages").mockResolvedValue({
      status: "success",
      messages: [],
    });
    vi.spyOn(googleAuth, "fetchLiveCalendarEvents").mockResolvedValue({
      status: "success",
      events: [],
    });

    const response = await GET(new Request("https://rumble.test/api/v1/retrieval/scan"));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("success");
    expect(data.injected_alerts).toEqual([]);
  });

  it("returns 500 error status if retrieval execution throws exception", async () => {
    vi.spyOn(googleAuth, "fetchLiveGmailMessages").mockRejectedValue(
      new Error("Gmail API error")
    );

    const response = await POST(new Request("https://rumble.test/api/v1/retrieval/scan"));
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.status).toBe("error");
    expect(data.error).toBe("Failed to execute retrieval scan");
  });



  describe("DST-Safe Melbourne Timezone Handling", () => {
    it("correctly evaluates 06:00 Melbourne time in non-DST winter (AEST UTC+10)", async () => {
      const { getMelbourneHour, isRetrievalWindow } = await import("../../../lib/retrieval-schedule");
      // 2026-07-15 06:00 AEST is 2026-07-14 20:00 UTC
      const winterDate0600 = new Date("2026-07-14T20:00:00Z");
      expect(getMelbourneHour(winterDate0600)).toBe(6);
      expect(isRetrievalWindow(winterDate0600)).toBe(true);

      // 2026-07-15 14:00 AEST is 2026-07-15 04:00 UTC
      const winterDate1400 = new Date("2026-07-15T04:00:00Z");
      expect(getMelbourneHour(winterDate1400)).toBe(14);
      expect(isRetrievalWindow(winterDate1400)).toBe(true);

      // 2026-07-15 10:00 AEST is outside window
      const winterDate1000 = new Date("2026-07-15T00:00:00Z");
      expect(getMelbourneHour(winterDate1000)).toBe(10);
      expect(isRetrievalWindow(winterDate1000)).toBe(false);
    });

    it("correctly evaluates 06:00 Melbourne time in DST summer (AEDT UTC+11)", async () => {
      const { getMelbourneHour, isRetrievalWindow } = await import("../../../lib/retrieval-schedule");
      // 2026-01-15 06:00 AEDT is 2026-01-14 19:00 UTC
      const summerDate0600 = new Date("2026-01-14T19:00:00Z");
      expect(getMelbourneHour(summerDate0600)).toBe(6);
      expect(isRetrievalWindow(summerDate0600)).toBe(true);

      // 2026-01-15 14:00 AEDT is 2026-01-15 03:00 UTC
      const summerDate1400 = new Date("2026-01-15T03:00:00Z");
      expect(getMelbourneHour(summerDate1400)).toBe(14);
      expect(isRetrievalWindow(summerDate1400)).toBe(true);

      // 2026-01-15 10:00 AEDT is outside window
      const summerDate1000 = new Date("2026-01-14T23:00:00Z");
      expect(getMelbourneHour(summerDate1000)).toBe(10);
      expect(isRetrievalWindow(summerDate1000)).toBe(false);
    });
  });

});

