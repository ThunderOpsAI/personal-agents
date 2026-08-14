import { describe, it, expect } from "vitest";
import {
  getCalendarEvents,
  createCalendarEvent,
  modifyCalendarEvent,
  deleteCalendarEvent,
} from "./calendar";
import { getGmailMessages, sendEmail } from "./gmail";

describe("needsApproval Safety Wrapper Tests", () => {
  describe("Calendar Write/Modify Operations", () => {
    it("verifiably blocks createCalendarEvent when approval is not granted", async () => {
      const result = await createCalendarEvent.execute({
        summary: "Hydrotherapy Session",
        start: "2026-08-12T10:00:00+10:00",
        end: "2026-08-12T11:00:00+10:00",
        description: "Pool rehab session",
      });

      expect(result.success).toBe(false);
      expect(result.needsApproval).toBeDefined();
      expect(result.needsApproval?.toolName).toBe("createCalendarEvent");
      expect(result.needsApproval?.action).toBe("create");
      expect(result.needsApproval?.status).toBe("pending_approval");
      expect(result.eventId).toBeUndefined();
    });

    it("allows createCalendarEvent execution when explicitly approved", async () => {
      const result = await createCalendarEvent.execute(
        {
          summary: "Hydrotherapy Session",
          start: "2026-08-12T10:00:00+10:00",
          end: "2026-08-12T11:00:00+10:00",
        },
        { approved: true, approvalId: "appr_12345" }
      );

      expect(result.success).toBe(true);
      expect(result.needsApproval).toBeUndefined();
      expect(result.eventId).toBeDefined();
      expect(typeof result.eventId).toBe("string");
    });

    it("verifiably blocks modifyCalendarEvent without approval", async () => {
      const result = await modifyCalendarEvent.execute({
        eventId: "evt_999",
        summary: "Rescheduled Session",
      });

      expect(result.success).toBe(false);
      expect(result.needsApproval).toBeDefined();
      expect(result.needsApproval?.toolName).toBe("modifyCalendarEvent");
      expect(result.needsApproval?.status).toBe("pending_approval");
    });

    it("allows modifyCalendarEvent with explicit approval", async () => {
      const result = await modifyCalendarEvent.execute(
        { eventId: "evt_999", summary: "Rescheduled Session" },
        { approved: true }
      );

      expect(result.success).toBe(true);
      expect(result.eventId).toBe("evt_999");
    });

    it("verifiably blocks deleteCalendarEvent without approval", async () => {
      const result = await deleteCalendarEvent.execute({
        eventId: "evt_888",
      });

      expect(result.success).toBe(false);
      expect(result.needsApproval).toBeDefined();
      expect(result.needsApproval?.toolName).toBe("deleteCalendarEvent");
    });

    it("allows deleteCalendarEvent with explicit approval", async () => {
      const result = await deleteCalendarEvent.execute(
        { eventId: "evt_888" },
        { approved: true }
      );

      expect(result.success).toBe(true);
      expect(result.eventId).toBe("evt_888");
    });
  });

  describe("Gmail Send Operations", () => {
    it("verifiably blocks sendEmail when approval is not granted", async () => {
      const result = await sendEmail.execute({
        to: "physio@clinic.com",
        subject: "Weekly Pain Progress",
        body: "Attached pain relief logs.",
      });

      expect(result.success).toBe(false);
      expect(result.needsApproval).toBeDefined();
      expect(result.needsApproval?.toolName).toBe("sendEmail");
      expect(result.needsApproval?.action).toBe("send");
      expect(result.needsApproval?.status).toBe("pending_approval");
      expect(result.messageId).toBeUndefined();
    });

    it("allows sendEmail execution when explicitly approved", async () => {
      const result = await sendEmail.execute(
        {
          to: "physio@clinic.com",
          subject: "Weekly Pain Progress",
          body: "Attached pain relief logs.",
        },
        { approved: true, approvalId: "appr_send_777" }
      );

      expect(result.success).toBe(true);
      expect(result.needsApproval).toBeUndefined();
      expect(result.messageId).toBeDefined();
      expect(typeof result.messageId).toBe("string");
    });
  });

  describe("Read Safety & OAuth Authorization State", () => {
    it("getCalendarEvents read tool does NOT require approval", async () => {
      const result = await getCalendarEvents.execute({ timeMin: "2026-08-11T00:00:00Z" });
      expect(result).toHaveProperty("events");
      expect(result).toHaveProperty("oauthStatus");
      expect(result.oauthStatus).toHaveProperty("authenticated");
    });

    it("getGmailMessages read tool does NOT require approval", async () => {
      const result = await getGmailMessages.execute({ query: "is:unread" });
      expect(result).toHaveProperty("messages");
      expect(result).toHaveProperty("oauthStatus");
      expect(result.oauthStatus).toHaveProperty("authenticated");
    });
  });
});
