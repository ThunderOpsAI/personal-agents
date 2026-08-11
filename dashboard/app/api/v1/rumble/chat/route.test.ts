import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../lib/rumble-integrations", () => ({
  LiveIntegrationUnavailableError: class LiveIntegrationUnavailableError extends Error {
    integration: string;
    constructor(integration: string) {
      super();
      this.integration = integration;
    }
  },
  persistConfirmedPainLog: vi.fn(),
  sendConversationalChat: vi.fn(),
}));

import { persistConfirmedPainLog, sendConversationalChat } from "../../../../../lib/rumble-integrations";
import { POST } from "./route";

const chat = vi.mocked(sendConversationalChat);
const persist = vi.mocked(persistConfirmedPainLog);

describe("POST /api/v1/rumble/chat", () => {
  beforeEach(() => vi.resetAllMocks());

  it("passes each conversational message to the live agent instead of replaying saved symptom data", async () => {
    chat.mockResolvedValueOnce({ reply: "Live reply one" }).mockResolvedValueOnce({ reply: "Live reply two" });

    const first = await POST(jsonRequest({ message: "What is on my agenda today?" }));
    const second = await POST(jsonRequest({ message: "Can you explain pacing?" }));

    expect(chat).toHaveBeenNthCalledWith(1, "What is on my agenda today?");
    expect(chat).toHaveBeenNthCalledWith(2, "Can you explain pacing?");
    await expect(first.json()).resolves.toMatchObject({ reply: "Live reply one", intent: "CONVERSATION" });
    await expect(second.json()).resolves.toMatchObject({ reply: "Live reply two", intent: "CONVERSATION" });
    expect(persist).not.toHaveBeenCalled();
  });

  it("does not persist ambiguous pain discussion", async () => {
    chat.mockResolvedValue({ reply: "Live decision-support reply" });

    const response = await POST(jsonRequest({ message: "My shoulder hurts today." }));

    expect(response.status).toBe(200);
    expect(persist).not.toHaveBeenCalled();
    expect(chat).toHaveBeenCalledWith("My shoulder hurts today.");
  });

  it("routes only a valid confirmed structured pain log to live persistence", async () => {
    persist.mockResolvedValue({ entry_id: "live-entry" });

    const response = await POST(jsonRequest({
      message: "Please log this pain entry.",
      confirmedPainLog: { score: 5, locations: [{ area: "shoulder", side: "right", percentage: 100 }] },
    }));

    expect(response.status).toBe(200);
    expect(persist).toHaveBeenCalledWith({ score: 5, locations: [{ area: "shoulder", side: "right", percentage: 100 }] });
    expect(chat).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({ status: "success", intent: "LOG_PAIN" });
  });
});

function jsonRequest(body: unknown) {
  return new Request("https://rumble.test/api/v1/rumble/chat", { method: "POST", body: JSON.stringify(body) });
}
