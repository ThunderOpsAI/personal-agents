import { describe, it, expect, vi } from "vitest";

process.env.GEMINI_API_KEY = "test-key";

import { ensureDailyStandingProtocols, ensureStandingTasks, selectWashingDays } from "../lib/agenda-engine";
import { generateBriefing } from "../lib/agents/briefing-engine";
import { parseOCR } from "../lib/agents/ocr-parser";

describe("Life OS End-to-End Integration", () => {
  it("should assemble a complete daily agenda with briefings and protocols", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => {
      if (url.includes("generativelanguage.googleapis.com")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: "<h3>Morning Briefing</h3><p>You have 12 events scheduled today.</p>" }],
                },
              },
            ],
          }),
        });
      }
      if (url.includes("abc.net.au")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve("<rss></rss>"),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }));

    // 1. Generate Standing Protocols
    const baseDate = new Date("2026-08-21T12:00:00Z");
    let agenda = ensureDailyStandingProtocols([], baseDate);
    expect(agenda.length).toBeGreaterThan(0);
    
    // 2. Ensure Standing Tasks
    agenda = ensureStandingTasks(agenda, baseDate);
    const mfaTask = agenda.find((t) => t.title === "Call Deakin to unlock MFA");
    expect(mfaTask).toBeDefined();

    // 3. Generate Briefing for the agenda
    const morningBriefing = await generateBriefing(agenda, "morning");
    expect(morningBriefing).toContain("events");
  });

  it("should coordinate weather and OCR data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => {
      if (url.includes("open-meteo.com")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            daily: {
              time: ["2026-08-22", "2026-08-23", "2026-08-24"],
              precipitation_probability_max: [10, 80, 0],
              temperature_2m_max: [20, 22, 25],
              temperature_2m_min: [10, 12, 15]
            }
          })
        });
      }
      if (url.includes("example.com")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
          headers: { get: () => "image/png" },
        });
      }
      if (url.includes("generativelanguage.googleapis.com")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            candidates: [{ content: { parts: [{ text: "Mock OCR output text" }] } }]
          })
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }));

    const washingDays = await selectWashingDays();
    expect(washingDays.status).toBe("success");
    if (washingDays.status === "success") {
      expect(washingDays.days.length).toBe(2);
      expect(washingDays.days[0].date).toBe("2026-08-24"); // 0% prob
      expect(washingDays.days[1].date).toBe("2026-08-22"); // 10% prob
    }

    const ocrText = await parseOCR("https://example.com/doc.png", { mode: "document" });
    expect(ocrText).toBe("Mock OCR output text");
  });
});
