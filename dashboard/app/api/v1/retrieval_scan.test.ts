import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST, GET } from "./retrieval/scan/route";
import { closeDb, initDb, getAgendaItems } from "../../../lib/db";
import * as gmailTools from "../../../../agent/tools/gmail";
import * as calendarTools from "../../../../agent/tools/calendar";
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
    vi.spyOn(gmailTools.getGmailMessages, "execute").mockResolvedValue({
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
      oauthStatus: { authenticated: true },
    });

    vi.spyOn(calendarTools.getCalendarEvents, "execute").mockResolvedValue({
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
      oauthStatus: { authenticated: true },
    });

    const response = await POST();
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
    vi.spyOn(gmailTools.getGmailMessages, "execute").mockResolvedValue({
      messages: [],
      oauthStatus: { authenticated: true },
    });
    vi.spyOn(calendarTools.getCalendarEvents, "execute").mockResolvedValue({
      events: [],
      oauthStatus: { authenticated: true },
    });

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("success");
    expect(data.injected_alerts).toEqual([]);
  });

  it("returns 500 error status if retrieval execution throws exception", async () => {
    vi.spyOn(gmailTools.getGmailMessages, "execute").mockRejectedValue(
      new Error("Gmail API error")
    );

    const response = await POST();
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.status).toBe("error");
    expect(data.error).toBe("Failed to execute retrieval scan");
  });
});
