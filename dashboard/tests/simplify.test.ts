import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as simplifyRoute } from "../app/api/v1/learn/simplify/route";
import * as intentRouter from "../lib/agents/intent-router";

describe("POST /api/v1/learn/simplify", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 if encyclopediaId is missing or invalid", async () => {
    const req = new Request("http://localhost:3000/api/v1/learn/simplify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encyclopediaId: "nonexistent", chapterId: "cbt-ch1" }),
    });
    const res = await simplifyRoute(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid encyclopedia ID");
  });

  it("returns 400 if chapterId is missing or not found in encyclopedia", async () => {
    const req = new Request("http://localhost:3000/api/v1/learn/simplify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encyclopediaId: "cbt", chapterId: "invalid-ch" }),
    });
    const res = await simplifyRoute(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Chapter not found");
  });

  it("returns simplified bullets on valid request for non-medical encyclopedia", async () => {
    const mockBullets = [
      "Edge computing moves code closer to users.",
      "Isolates start in milliseconds without container overhead.",
      "Stateless functions handle HTTP requests across global nodes.",
      "Shared memory is limited between isolates.",
      "Ideal for lightweight API routing and personal dashboards."
    ];

    vi.spyOn(intentRouter, "callGemini").mockResolvedValueOnce(
      JSON.stringify({ bullets: mockBullets })
    );

    const req = new Request("http://localhost:3000/api/v1/learn/simplify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encyclopediaId: "tech", chapterId: "tech-ch1" }),
    });

    const res = await simplifyRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.bullets).toEqual(mockBullets);
    expect(data.note).toBeUndefined();
  });

  it("appends MEDICAL_GUARDRAIL as a final note for medical/health encyclopedias", async () => {
    const mockBullets = [
      "Pain is processed by nerves and the brain.",
      "Gradual movement trains the nervous system to relax.",
      "Pacing activity avoids protective muscle spasms.",
      "Deep breathing lowers sympathetic nervous system tone.",
      "Regular gentle mobility restores functional capacity."
    ];

    vi.spyOn(intentRouter, "callGemini").mockResolvedValueOnce(
      JSON.stringify({ bullets: mockBullets })
    );

    const req = new Request("http://localhost:3000/api/v1/learn/simplify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encyclopediaId: "pain", chapterId: "pain-ch1" }),
    });

    const res = await simplifyRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.bullets.length).toBe(mockBullets.length + 1);
    expect(data.bullets[data.bullets.length - 1]).toBe(intentRouter.MEDICAL_GUARDRAIL);
    expect(data.note).toBe(intentRouter.MEDICAL_GUARDRAIL);
  });

  it("returns 502 with error details when Gemini call fails without mock text", async () => {
    vi.spyOn(intentRouter, "callGemini").mockRejectedValueOnce(
      new Error("Gemini quota exhausted")
    );

    const req = new Request("http://localhost:3000/api/v1/learn/simplify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encyclopediaId: "pain", chapterId: "pain-ch1" }),
    });

    const res = await simplifyRoute(req);
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toContain("Gemini quota exhausted");
  });
});
