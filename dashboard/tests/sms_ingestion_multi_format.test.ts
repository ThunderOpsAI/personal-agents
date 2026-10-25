/** @vitest-environment node */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST } from "../app/api/v1/sms/webhook/route";
import { GET as heartbeatGet } from "../app/api/v1/sms/heartbeat/route";
import {
  initDb,
  closeDb,
  getSmsMessages,
  createSmsMessage,
  getSmsHeartbeatStatus,
} from "../lib/db";
import {
  parseIncomingSmsPayload,
  sanitizeTemplateTag,
  normalizeTimestampToUtc,
  formatMelbourneSmsTimestamp,
  checkRateLimit,
  resetRateLimits,
} from "../lib/sms-parser";

describe("Phase 2: Multi-Format SMS Ingestion, Sanitization & Heartbeat", () => {
  beforeEach(() => {
    initDb();
    resetRateLimits();
    delete process.env.SMS_WEBHOOK_SECRET;
  });

  afterEach(async () => {
    delete process.env.SMS_WEBHOOK_SECRET;
    resetRateLimits();
    if (closeDb) await closeDb();
    vi.restoreAllMocks();
  });

  describe("1. Template Tag Sanitization", () => {
    it("sanitizes unexpanded MacroDroid/Tasker body tags and flags them as malformed", () => {
      const tags = ["{sms_body}", "[sms_body]", "{sms_message}", "[sms_message]", "%SMSRB"];
      for (const tag of tags) {
        const result = sanitizeTemplateTag(tag, "body");
        expect(result.wasMalformed).toBe(true);
        expect(result.sanitized).toContain("Malformed/Unexpanded template tag");
      }
    });

    it("sanitizes unexpanded sender tags and replaces them cleanly", () => {
      const senderTags = ["{sms_number}", "[sms_number]", "%SMSRF", "%SMSRN"];
      for (const tag of senderTags) {
        const result = sanitizeTemplateTag(tag, "sender");
        expect(result.wasMalformed).toBe(true);
        expect(result.sanitized).toContain("Unknown");
      }
    });

    it("preserves legitimate SMS content without flagging as malformed", () => {
      const legitimate = "Your prescription is ready for pickup at Wangaratta Pharmacy";
      const result = sanitizeTemplateTag(legitimate, "body");
      expect(result.wasMalformed).toBe(false);
      expect(result.sanitized).toBe(legitimate);
    });
  });

  describe("2. Timestamp Normalization (UTC at rest, Australia/Melbourne at display)", () => {
    it("normalizes 10-digit UNIX timestamps (seconds) to UTC ISO", () => {
      // 1729700000 = 2024-10-23T16:13:20.000Z
      const normalized = normalizeTimestampToUtc("1729700000");
      expect(normalized).toBe(new Date(1729700000 * 1000).toISOString());
      expect(normalized.endsWith("Z")).toBe(true);
    });

    it("normalizes 13-digit UNIX timestamps (milliseconds) to UTC ISO", () => {
      const ms = 1729700000123;
      const normalized = normalizeTimestampToUtc(String(ms));
      expect(normalized).toBe(new Date(ms).toISOString());
    });

    it("handles fallback to current UTC time if timestamp is invalid or missing", () => {
      const normalized = normalizeTimestampToUtc(null);
      expect(normalized).toBeDefined();
      expect(Number.isNaN(Date.parse(normalized))).toBe(false);
    });

    it("formats UTC timestamps safely in Australia/Melbourne (DST-safe: AEST vs AEDT)", () => {
      // Summer date (AEDT: UTC+11)
      const summerUtc = "2026-01-15T00:00:00.000Z";
      const summerMelbourne = formatMelbourneSmsTimestamp(summerUtc);
      // 00:00 UTC + 11h = 11:00 AM
      expect(summerMelbourne).toContain("11:00");

      // Winter date (AEST: UTC+10)
      const winterUtc = "2026-07-15T00:00:00.000Z";
      const winterMelbourne = formatMelbourneSmsTimestamp(winterUtc);
      // 00:00 UTC + 10h = 10:00 AM
      expect(winterMelbourne).toContain("10:00");
    });
  });

  describe("3. Multi-Format Fixture Payload Ingestion", () => {
    it("successfully ingests MacroDroid payload with [sms_number] and [sms_message]", async () => {
      const req = new Request("https://rumble.test/api/v1/sms/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sms_number: "+61412345678",
          sms_message: "Hydrotherapy pool temp confirmed at 34C",
          received_at: "1729700000",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(data.provider_format).toBe("macrodroid");
      expect(data.parse_status).toBe("parsed");

      const messages = await getSmsMessages();
      const stored = messages.find((m) => m.id === data.id);
      expect(stored).toBeDefined();
      expect(stored?.sender).toBe("+61412345678");
      expect(stored?.body).toBe("Hydrotherapy pool temp confirmed at 34C");
      expect(stored?.parse_status).toBe("parsed");
    });

    it("successfully ingests Tasker payload with %SMSRF, %SMSRB, %TIMES", async () => {
      const req = new Request("https://rumble.test/api/v1/sms/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "+61499887766",
          body: "Dr. Matthews clinic: Reminder of appointment tomorrow",
          received_at: "1729700000",
          "%SMSRF": "+61499887766",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(data.provider_format).toBe("tasker");

      const messages = await getSmsMessages();
      const stored = messages.find((m) => m.id === data.id);
      expect(stored?.sender).toBe("+61499887766");
      expect(stored?.body).toContain("Dr. Matthews clinic");
    });

    it("successfully ingests ntfy payload extracting sender from title and message body", async () => {
      const req = new Request("https://rumble.test/api/v1/sms/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "ntfy_msg_1",
          time: 1729700000,
          event: "message",
          topic: "rumble_sms",
          title: "SMS from +61433221100",
          message: "Pathology results ready for collection",
          tags: ["sms"],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(data.provider_format).toBe("ntfy");

      const messages = await getSmsMessages();
      const stored = messages.find((m) => m.id === data.id);
      expect(stored?.sender).toBe("+61433221100");
      expect(stored?.body).toBe("Pathology results ready for collection");
    });

    it("successfully ingests Pushover payload format", async () => {
      const req = new Request("https://rumble.test/api/v1/sms/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "message",
          title: "+61455667788",
          message: "Physio appointment moved to Friday 9am",
          timestamp: 1729700000,
          receipt: "pushover_receipt_99",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(data.provider_format).toBe("pushover");

      const messages = await getSmsMessages();
      const stored = messages.find((m) => m.id === data.id);
      expect(stored?.sender).toBe("+61455667788");
      expect(stored?.body).toBe("Physio appointment moved to Friday 9am");
    });

    it("successfully ingests Twilio urlencoded webhook and returns valid TwiML XML", async () => {
      const formData = new URLSearchParams();
      formData.append("From", "+61411222333");
      formData.append("Body", "Your prescription has been filled");
      formData.append("MessageSid", "SM9988776655");
      formData.append("AccountSid", "AC1234567890");

      const req = new Request("https://rumble.test/api/v1/sms/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(res.headers.get("Content-Type")).toBe("text/xml");
      const text = await res.text();
      expect(text).toBe("<Response></Response>");

      const messages = await getSmsMessages();
      const stored = messages.find((m) => m.sender === "+61411222333");
      expect(stored).toBeDefined();
      expect(stored?.provider_format).toBe("twilio");
    });
  });

  describe("4. Zero-Loss Rule & Malformed Cases", () => {
    it("handles unexpanded template tags by sanitizing and recording parse_status as malformed", async () => {
      const req = new Request("https://rumble.test/api/v1/sms/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "[sms_number]",
          body: "{sms_body}",
          received_at: "%TIMES",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.parse_status).toBe("malformed");

      const messages = await getSmsMessages();
      const stored = messages.find((m) => m.id === data.id);
      expect(stored).toBeDefined();
      expect(stored?.parse_status).toBe("malformed");
      expect(stored?.sender).toContain("Unknown");
      expect(stored?.body).toContain("Malformed/Unexpanded template tag");
    });

    it("enforces zero-loss: corrupted non-JSON plain text is persisted with parse_status failed", async () => {
      const corruptedText = "CORRUPT_BUFFER_NON_JSON_DATA_FROM_PHONE_MODEM";
      const req = new Request("https://rumble.test/api/v1/sms/webhook", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: corruptedText,
      });

      const res = await POST(req);
      // Saved with parse_status: 'failed'
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.parse_status).toBe("failed");

      const messages = await getSmsMessages();
      const stored = messages.find((m) => m.id === data.id);
      expect(stored).toBeDefined();
      expect(stored?.raw_payload).toBe(corruptedText);
      expect(stored?.body).toContain("CORRUPT_BUFFER");
    });
  });

  describe("5. Authentication & Rate Limiting", () => {
    it("authenticates webhook via x-sms-secret header and rejects incorrect secret", async () => {
      process.env.SMS_WEBHOOK_SECRET = "super_secure_rumble_secret";

      const unauthReq = new Request("https://rumble.test/api/v1/sms/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sms-secret": "wrong_secret",
        },
        body: JSON.stringify({ sender: "+61400000000", body: "Hello" }),
      });

      const unauthRes = await POST(unauthReq);
      expect(unauthRes.status).toBe(401);

      const authReq = new Request("https://rumble.test/api/v1/sms/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sms-secret": "super_secure_rumble_secret",
        },
        body: JSON.stringify({ sender: "+61400000000", body: "Authorized test" }),
      });

      const authRes = await POST(authReq);
      expect(authRes.status).toBe(201);
    });

    it("authenticates webhook via Authorization: Bearer token", async () => {
      process.env.SMS_WEBHOOK_SECRET = "bearer_test_secret";

      const authReq = new Request("https://rumble.test/api/v1/sms/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer bearer_test_secret",
        },
        body: JSON.stringify({ sender: "+61400000000", body: "Bearer test" }),
      });

      const authRes = await POST(authReq);
      expect(authRes.status).toBe(201);
    });

    it("enforces rate limits when excessive requests arrive from same client", () => {
      const clientId = "spammer-ip-1.2.3.4";
      // Allow 5 requests in window
      for (let i = 0; i < 5; i++) {
        const res = checkRateLimit(clientId, 5, 60000);
        expect(res.allowed).toBe(true);
      }

      // 6th request is blocked
      const blocked = checkRateLimit(clientId, 5, 60000);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfter).toBeGreaterThan(0);
    });
  });

  describe("6. Heartbeat & Health Endpoint", () => {
    it("reports healthy status when an SMS message was received recently", async () => {
      await createSmsMessage({
        sender: "+61412345678",
        body: "Recent test message",
        received_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      });

      const req = new Request("https://rumble.test/api/v1/sms/heartbeat");
      const res = await heartbeatGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.healthy).toBe(true);
      expect(data.status).toBe("healthy");
      expect(data.hours_since_last_received).toBeLessThan(24);
    });

    it("flags warning/stale when no SMS message has arrived in over 24 hours", async () => {
      await createSmsMessage({
        sender: "+61412345678",
        body: "Stale message from 30 hours ago",
        received_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 30 hours ago
      });

      const req = new Request("https://rumble.test/api/v1/sms/heartbeat");
      const res = await heartbeatGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.healthy).toBe(false);
      expect(data.status).toBe("stale");
      expect(data.hours_since_last_received).toBeGreaterThan(24);
      expect(data.message).toContain("No phone webhook received in over 24 hours");
    });
  });

  describe("7. Privacy Invariant: Zero Full Body Logging", () => {
    it("never logs full SMS body text to console", async () => {
      const sensitiveBody = "CONFIDENTIAL_CLINICAL_CODE_XYZ_9988";
      const consoleLogSpy = vi.spyOn(console, "log");
      const consoleWarnSpy = vi.spyOn(console, "warn");
      const consoleInfoSpy = vi.spyOn(console, "info");

      const req = new Request("https://rumble.test/api/v1/sms/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "+61412345678",
          body: sensitiveBody,
        }),
      });

      await POST(req);

      // Verify sensitiveBody was never logged to console in plain text
      const allCalls = [
        ...consoleLogSpy.mock.calls,
        ...consoleWarnSpy.mock.calls,
        ...consoleInfoSpy.mock.calls,
      ].flat();

      for (const call of allCalls) {
        expect(String(call)).not.toContain(sensitiveBody);
      }
    });
  });
});
