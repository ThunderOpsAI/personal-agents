import { describe, it, expect } from "vitest";
import { generateBriefing } from "../lib/agents/briefing-engine";

describe("Briefing Engine", () => {
  it("should generate a morning briefing based on event count", async () => {
    const events = [{ id: 1 }, { id: 2 }];
    const briefing = await generateBriefing(events, "morning");
    expect(briefing).toContain("You have 2 events on the agenda today.");
  });

  it("should generate an evening briefing based on event count", async () => {
    const events = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const briefing = await generateBriefing(events, "evening");
    expect(briefing).toContain("You tracked 3 events today.");
  });
});
