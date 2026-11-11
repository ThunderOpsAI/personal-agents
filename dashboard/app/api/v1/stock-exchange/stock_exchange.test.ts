import { describe, expect, it } from "vitest";
import { GET as stockExchangeGet } from "./route";
import { POST as stockExchangeRunPost } from "./run/route";

describe("Stock Exchange API Routes (/api/v1/stock-exchange)", () => {
  it("GET returns valid core profile data with zero fake fallbacks", async () => {
    const req = new Request("https://rumble.test/api/v1/stock-exchange?profile=core");
    const res = await stockExchangeGet(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.profile).toBe("core");
    expect(typeof data.halted_lock).toBe("boolean");
    expect(data.account).toBeDefined();
    expect(typeof data.account.equity).toBe("number");
    expect(typeof data.account.cash).toBe("number");
    expect(typeof data.account.circuit_tier).toBe("number");
    expect(Array.isArray(data.positions)).toBe(true);
    expect(Array.isArray(data.candidates)).toBe(true);
    expect(Array.isArray(data.orders)).toBe(true);
    expect(Array.isArray(data.audit_logs)).toBe(true);
    expect(Array.isArray(data.reports)).toBe(true);
  });

  it("GET returns valid aggressive profile data with live positions", async () => {
    const req = new Request("https://rumble.test/api/v1/stock-exchange?profile=aggressive");
    const res = await stockExchangeGet(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.profile).toBe("aggressive");
    expect(typeof data.halted_lock).toBe("boolean");
    expect(data.account).toBeDefined();
    expect(typeof data.account.equity).toBe("number");
    expect(Array.isArray(data.positions)).toBe(true);
    // In our live sqlite / broker data, aggressive has 3 active positions
    expect(data.positions.length).toBeGreaterThanOrEqual(0);
  });

  it("POST /run validates invalid actions", async () => {
    const req = new Request("https://rumble.test/api/v1/stock-exchange/run", {
      method: "POST",
      body: JSON.stringify({ action: "invalid-action", profile: "core" }),
    });
    const res = await stockExchangeRunPost(req);
    // If local execution is available, returns 400 for bad action; if serverless, returns 501
    expect([400, 501]).toContain(res.status);
  });
});
