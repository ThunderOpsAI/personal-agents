/** @vitest-environment node */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "./route";
import { initDb, closeDb, getSmsMessages } from "../../../../../lib/db";

describe("SMS Webhook Route: /api/v1/sms/webhook", () => {
  beforeEach(() => {
    initDb();
    delete process.env.SMS_WEBHOOK_SECRET;
  });

  afterEach(async () => {
    delete process.env.SMS_WEBHOOK_SECRET;
    if (closeDb) await closeDb();
  });

  it("successfully receives and stores an SMS message", async () => {
    const req = new Request("https://rumble.test/api/v1/sms/webhook", {
      method: "POST",
      body: JSON.stringify({
        sender: "+61400123456",
        body: "Your appointment is confirmed for 2pm",
        received_at: "1725345600",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.status).toBe("success");
    expect(data.id).toBeDefined();

    const messages = await getSmsMessages();
    const stored = messages.find((m) => m.id === data.id);
    expect(stored).toBeDefined();
    expect(stored?.sender).toBe("+61400123456");
    expect(stored?.body).toBe("Your appointment is confirmed for 2pm");
    expect(stored?.read).toBe(false);
  });

  it("validates secret when SMS_WEBHOOK_SECRET is set", async () => {
    process.env.SMS_WEBHOOK_SECRET = "correct_secret_pass";

    const unauthorizedReq = new Request("https://rumble.test/api/v1/sms/webhook", {
      method: "POST",
      body: JSON.stringify({
        sender: "+61400123456",
        body: "Test without secret",
      }),
    });

    const unauthRes = await POST(unauthorizedReq);
    expect(unauthRes.status).toBe(401);
    const unauthData = await unauthRes.json();
    expect(unauthData.status).toBe("error");

    const authorizedReq = new Request("https://rumble.test/api/v1/sms/webhook", {
      method: "POST",
      body: JSON.stringify({
        sender: "+61400123456",
        body: "Test with secret",
        secret: "correct_secret_pass",
      }),
    });

    const authRes = await POST(authorizedReq);
    expect(authRes.status).toBe(201);
    const authData = await authRes.json();
    expect(authData.status).toBe("success");
  });

  it("returns 400 when sender or body is missing", async () => {
    const req = new Request("https://rumble.test/api/v1/sms/webhook", {
      method: "POST",
      body: JSON.stringify({
        sender: "",
        body: "",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.status).toBe("error");
  });

  it("handles urlencoded form payload from Twilio with secret in query param", async () => {
    process.env.SMS_WEBHOOK_SECRET = "twilio_secret_123";

    const formData = new URLSearchParams();
    formData.append("From", "+61411222333");
    formData.append("Body", "Hi James, this is Dr. Smith confirming your appointment");
    formData.append("MessageSid", "SM1234567890");

    const req = new Request("https://rumble.test/api/v1/sms/webhook?secret=twilio_secret_123", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const messages = await getSmsMessages();
    const stored = messages.find((m) => m.sender === "+61411222333");
    expect(stored).toBeDefined();
    expect(stored?.body).toBe("Hi James, this is Dr. Smith confirming your appointment");
  });
});
