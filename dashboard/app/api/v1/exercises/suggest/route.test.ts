import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../lib/rumble-integrations", () => ({
  LiveIntegrationUnavailableError: class LiveIntegrationUnavailableError extends Error {
    integration: string;
    constructor(integration: string) {
      super();
      this.integration = integration;
    }
  },
  getLiveExerciseSuggestions: vi.fn(),
}));

import { getLiveExerciseSuggestions } from "../../../../../lib/rumble-integrations";
import { POST } from "./route";

const suggest = vi.mocked(getLiveExerciseSuggestions);

describe("POST /api/v1/exercises/suggest", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns only routines received from the live rehabilitation integration", async () => {
    suggest.mockResolvedValue([{ id: "live-routine", name: "Live routine", image_url: "https://media.example/routine.jpg" }]);

    const response = await POST(jsonRequest({ pain_level: 4, limit: 3 }));

    expect(suggest).toHaveBeenCalledWith({ pain_level: 4, limit: 3 });
    await expect(response.json()).resolves.toEqual({ status: "success", suggestions: [{ id: "live-routine", name: "Live routine", image_url: "https://media.example/routine.jpg" }] });
  });

  it("rejects invalid requests without calling the integration", async () => {
    const response = await POST(jsonRequest({ pain_level: 11 }));

    expect(response.status).toBe(400);
    expect(suggest).not.toHaveBeenCalled();
  });
});

function jsonRequest(body: unknown) {
  return new Request("https://rumble.test/api/v1/exercises/suggest", { method: "POST", body: JSON.stringify(body) });
}
