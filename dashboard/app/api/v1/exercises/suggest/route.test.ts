import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../lib/agents/yoga-engine", () => ({
  getSuggestedYogaRoutines: vi.fn(),
}));

import { getSuggestedYogaRoutines } from "../../../../../lib/agents/yoga-engine";
import { POST } from "./route";

const suggest = vi.mocked(getSuggestedYogaRoutines);

describe("POST /api/v1/exercises/suggest", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns routines received from the yoga engine", async () => {
    suggest.mockResolvedValue([{ id: "yoga-1", title: "Live routine", category: "yoga", focus_areas: [], duration_minutes: 10, intensity: "low", steps: [] }] as any);

    const response = await POST(new Request("https://rumble.test/api/v1/exercises/suggest", { method: "POST" }));

    expect(suggest).toHaveBeenCalled();
    const data = await response.json();
    expect(data.status).toBe("success");
    expect(data.suggestions[0].id).toBe("yoga-1");
  });
});
