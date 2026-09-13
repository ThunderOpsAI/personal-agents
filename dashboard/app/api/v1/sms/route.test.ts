/** @vitest-environment node */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GET, PATCH } from "./route";
import { initDb, closeDb, createSmsMessage } from "../../../../lib/db";

describe("SMS Read & Status Routes: /api/v1/sms", () => {
  beforeEach(() => {
    initDb();
  });

  afterEach(async () => {
    if (closeDb) await closeDb();
  });

  it("retrieves messages and respects unread/limit filters", async () => {
    const msg1 = await createSmsMessage({
      sender: "Alice",
      body: "First message",
      received_at: "2026-09-01T10:00:00Z",
    });

    const msg2 = await createSmsMessage({
      sender: "Bob",
      body: "Second message",
      received_at: "2026-09-02T10:00:00Z",
    });

    const getReq = new Request("https://rumble.test/api/v1/sms?limit=10");
    const getRes = await GET(getReq);
    expect(getRes.status).toBe(200);
    const data = await getRes.json();
    expect(data.status).toBe("success");
    expect(data.messages.length).toBeGreaterThanOrEqual(2);
  });

  it("marks a message as read via PATCH", async () => {
    const msg = await createSmsMessage({
      sender: "Charlie",
      body: "Important code: 123456",
    });

    const patchReq = new Request("https://rumble.test/api/v1/sms", {
      method: "PATCH",
      body: JSON.stringify({ id: msg.id }),
    });

    const patchRes = await PATCH(patchReq);
    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.status).toBe("success");
    expect(patchData.read).toBe(true);
  });

  it("returns 404 when marking a non-existent message", async () => {
    const patchReq = new Request("https://rumble.test/api/v1/sms", {
      method: "PATCH",
      body: JSON.stringify({ id: "non_existent_sms_id" }),
    });

    const patchRes = await PATCH(patchReq);
    expect(patchRes.status).toBe(404);
    const data = await patchRes.json();
    expect(data.status).toBe("error");
  });
});
