import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { extractTimeSlot, scanRetrievalForAlerts } from "./alert_scanner";
import { GmailMessage, CalendarEvent } from "./tools/types";
import { closeDb, initDb, getAgendaItems } from "../dashboard/lib/db";
import fs from "fs";
import path from "path";

const TEST_DB_PATH = path.join(process.cwd(), "test_alert_scanner.db");

describe("Retrieval Alert Scanner Tests (agent/alert_scanner.ts)", () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    initDb(TEST_DB_PATH);
  });

  afterEach(async () => {
    await closeDb();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe("extractTimeSlot utility", () => {
    it("extracts 12-hour PM time slot correctly (e.g., 1:30 PM for Hostplus notice)", () => {
      const text = "Hostplus notice due by 1:30 PM";
      const result = extractTimeSlot(text);
      expect(result.timeSlot).toBe("13:30");
      expect(result.hour).toBe(13);
      expect(result.minute).toBe(30);
    });

    it("extracts 12-hour AM time slot correctly", () => {
      const text = "Morning briefing scheduled for 9:15 AM";
      const result = extractTimeSlot(text);
      expect(result.timeSlot).toBe("09:15");
      expect(result.hour).toBe(9);
      expect(result.minute).toBe(15);
    });

    it("extracts 24-hour time slot correctly", () => {
      const text = "System maintenance at 14:45 local time";
      const result = extractTimeSlot(text);
      expect(result.timeSlot).toBe("14:45");
      expect(result.hour).toBe(14);
      expect(result.minute).toBe(45);
    });

    it("falls back to default 13:30 when no explicit time pattern is found", () => {
      const text = "Generic follow-up email with no time specified";
      const result = extractTimeSlot(text);
      expect(result.timeSlot).toBe("13:30");
    });
  });

  describe("scanRetrievalForAlerts", () => {
    it("scans Hostplus action email due by 1:30 PM and injects alert at 13:30 time slot into DB", async () => {
      const messages: GmailMessage[] = [
        {
          id: "msg_hostplus_789",
          threadId: "th_1",
          subject: "Hostplus notice due by 1:30 PM",
          snippet: "Please update your superannuation beneficiary details before 1:30 PM.",
          from: "admin@hostplus.com.au",
          date: "2026-08-11T08:00:00Z",
          bodySummary: "Action required for Hostplus super details.",
          actionRequired: true,
        },
      ];

      const calendarEvents: CalendarEvent[] = [];

      const injected = await scanRetrievalForAlerts(messages, calendarEvents, {
        baseDate: "2026-08-11",
      });

      expect(injected).toHaveLength(1);
      expect(injected[0].id).toBe("alert_msg_msg_hostplus_789");
      expect(injected[0].item_type).toBe("alert");
      expect(injected[0].title).toBe("[Rumble: Email Alert] Action Required: Hostplus notice due by 1:30 PM");
      expect(injected[0].scheduled_time).toBe("2026-08-11T13:30:00+10:00");
      expect(injected[0].status).toBe("pending");

      // Verify persistence in DB
      const dbItems = await getAgendaItems();
      expect(dbItems).toHaveLength(1);
      expect(dbItems[0].id).toBe("alert_msg_msg_hostplus_789");
    });

    it("scans action-required calendar events and injects agenda alerts at relevant time slots", async () => {
      const messages: GmailMessage[] = [];
      const calendarEvents: CalendarEvent[] = [
        {
          id: "evt_physio_456",
          summary: "Physio Follow-up - Action Required",
          description: "Complete pre-appointment questionnaire",
          start: "2026-08-11T14:30:00+10:00",
          end: "2026-08-11T15:30:00+10:00",
          status: "confirmed",
        },
      ];

      const injected = await scanRetrievalForAlerts(messages, calendarEvents, {
        baseDate: "2026-08-11",
      });

      expect(injected).toHaveLength(1);
      expect(injected[0].id).toBe("alert_evt_evt_physio_456");
      expect(injected[0].item_type).toBe("alert");
      expect(injected[0].title).toBe("[Rumble: Calendar Alert] Agenda Alert: Physio Follow-up - ACTION REQUIRED: Please fill out the pre-assessment form before arrival.");
      expect(injected[0].scheduled_time).toBe("2026-08-11T10:00:00+10:00");

      const dbItems = await getAgendaItems();
      expect(dbItems).toHaveLength(1);
      expect(dbItems[0].id).toBe("alert_evt_evt_physio_456");
    });

    it("guarantees idempotency on duplicate scans without creating duplicate DB records", async () => {
      const messages: GmailMessage[] = [
        {
          id: "msg_duplicate_1",
          threadId: "th_dup",
          subject: "Hostplus urgent action due by 1:30 PM",
          snippet: "Urgent response needed",
          from: "info@hostplus.com.au",
          date: "2026-08-11T09:00:00Z",
          bodySummary: "Hostplus notice",
          actionRequired: true,
        },
      ];

      // First scan
      const firstScan = await scanRetrievalForAlerts(messages, [], { baseDate: "2026-08-11" });
      expect(firstScan).toHaveLength(1);

      // Second scan with same message
      const secondScan = await scanRetrievalForAlerts(messages, [], { baseDate: "2026-08-11" });
      expect(secondScan).toHaveLength(1);

      // DB should contain only 1 item
      const dbItems = await getAgendaItems();
      expect(dbItems).toHaveLength(1);
    });
  });
});
