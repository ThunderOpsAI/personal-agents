import { describe, it, expect, vi } from "vitest";
import { generateBriefing } from "../lib/agents/briefing-engine";

describe("Briefing Engine", () => {
  it("should generate a morning briefing with OKC Thunder & NBA focus", async () => {
    const events = [
      { title: "Doctor Appointment", start: "2026-09-10T10:00:00+10:00" },
      { title: "Physio Review", start: "2026-09-10T14:00:00+10:00" }
    ];
    const briefing = await generateBriefing(events, "morning");
    expect(briefing).toContain("OKC Thunder");
    expect(briefing).toContain("NBA");
    expect(briefing).toContain("Doctor Appointment");
  });

  it("should generate an evening wrap-up briefing", async () => {
    const events = [
      { title: "Completed Physio", start: "2026-09-10T10:00:00+10:00" }
    ];
    const briefing = await generateBriefing(events, "evening");
    expect(briefing).toBeDefined();
    expect(typeof briefing).toBe("string");
    expect(briefing.length).toBeGreaterThan(50);
  });
});
