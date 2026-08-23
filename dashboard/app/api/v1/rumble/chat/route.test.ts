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

  describe("End-to-End Two-Turn Confirm-Before-Write Flows", () => {
    it("LOG_PAIN: Turn 1 produces preview with requires_confirmation=true, Turn 2 commits confirmed action", async () => {
      // Turn 1: User sends pain logging directive
      chat.mockResolvedValueOnce({
        reply: "Previewing pain log entry. Please confirm to commit.",
        intent: "LOG_PAIN",
        requires_confirmation: true,
        preview: {
          type: "pain_log",
          data: {
            score: 6,
            locations: [
              { area: "lumbar", side: "unspecified", percentage: 80 },
              { area: "neck", side: "unspecified", percentage: 20 },
            ],
            mood: "7",
            notes: "Stiff after long drive",
          },
        },
      });

      const turn1Res = await POST(
        jsonRequest({
          message: "Log pain score 6/10 in lumbar 80% and neck 20%, mood 7, notes Stiff after long drive",
        })
      );

      expect(turn1Res.status).toBe(200);
      const turn1Data = await turn1Res.json();
      expect(turn1Data.intent).toBe("LOG_PAIN");
      expect(turn1Data.requires_confirmation).toBe(true);
      expect(turn1Data.preview).toBeDefined();
      expect(turn1Data.preview.type).toBe("pain_log");
      expect(turn1Data.preview.data.score).toBe(6);

      // Turn 2: User explicitly confirms the action
      persist.mockResolvedValueOnce({
        id: "pain_12345",
        score: 6,
        locations: [
          { area: "lumbar", side: "unspecified", percentage: 80 },
          { area: "neck", side: "unspecified", percentage: 20 },
        ],
        mood: "7",
        notes: "Stiff after long drive",
        timestamp: new Date().toISOString(),
      });

      const turn2Res = await POST(
        jsonRequest({
          message: "Yes, please log this entry.",
          confirm_action: turn1Data.preview,
        })
      );

      expect(turn2Res.status).toBe(200);
      const turn2Data = await turn2Res.json();
      expect(turn2Data.status).toBe("success");
      expect(turn2Data.reply).toContain("Confirmed and saved pain log");
    });


    it("ADD_NOTE: Turn 1 produces preview, Turn 2 commits note to database", async () => {
      // Turn 1: User says add note
      chat.mockResolvedValueOnce({
        reply: "Previewing note. Please confirm to save.",
        intent: "ADD_NOTE",
        requires_confirmation: true,
        preview: {
          type: "note",
          data: { content: "Pick up medication from Wangaratta pharmacy", author: "user" },
        },
      });

      const turn1Res = await POST(
        jsonRequest({ message: "Add note: Pick up medication from Wangaratta pharmacy" })
      );

      expect(turn1Res.status).toBe(200);
      const turn1Data = await turn1Res.json();
      expect(turn1Data.intent).toBe("ADD_NOTE");
      expect(turn1Data.requires_confirmation).toBe(true);
      expect(turn1Data.preview.data.content).toBe("Pick up medication from Wangaratta pharmacy");

      // Turn 2: User confirms note
      const turn2Res = await POST(
        jsonRequest({
          message: "Confirm",
          confirm_action: turn1Data.preview,
        })
      );

      expect(turn2Res.status).toBe(200);
      const turn2Data = await turn2Res.json();
      expect(turn2Data.status).toBe("success");
    });

    it("ADD_TASK: Turn 1 produces preview, Turn 2 commits task to agenda", async () => {
      // Turn 1: User requests task creation
      chat.mockResolvedValueOnce({
        reply: "Previewing task. Please confirm to add to your agenda.",
        intent: "ADD_TASK",
        requires_confirmation: true,
        preview: {
          type: "task",
          data: {
            title: "Call Dr. Anderson clinic",
            scheduled_time: "2026-08-15T09:00:00+10:00",
          },
        },
      });

      const turn1Res = await POST(
        jsonRequest({ message: "Add task: Call Dr. Anderson clinic" })
      );

      expect(turn1Res.status).toBe(200);
      const turn1Data = await turn1Res.json();
      expect(turn1Data.intent).toBe("ADD_TASK");
      expect(turn1Data.requires_confirmation).toBe(true);
      expect(turn1Data.preview.data.title).toBe("Call Dr. Anderson clinic");

      // Turn 2: User confirms task
      const turn2Res = await POST(
        jsonRequest({
          message: "Yes add it",
          confirm_action: turn1Data.preview,
        })
      );

      expect(turn2Res.status).toBe(200);
      const turn2Data = await turn2Res.json();
      expect(turn2Data.status).toBe("success");
    });

    it("MULTI_ACTION: Turn 1 produces preview with multi-day events and tasks, Turn 2 commits all items", async () => {
      chat.mockResolvedValueOnce({
        reply: "I've drafted your schedule and tasks for next week.",
        intent: "GENERAL",
        requires_confirmation: true,
        preview: {
          type: "multi_action",
          data: {
            actions: [
              { type: "calendar_event", data: { summary: "GP Appointment", start: { dateTime: "2026-08-24T11:30:00+10:00" }, end: { dateTime: "2026-08-24T12:00:00+10:00" } } },
              { type: "task", data: { title: "Call Legal Aid", scheduled_time: "2026-08-25T09:00:00+10:00" } }
            ]
          }
        }
      });

      const turn1Res = await POST(
        jsonRequest({ message: "Add Monday 11:30am GP and Tuesday task Call Legal Aid" })
      );

      expect(turn1Res.status).toBe(200);
      const turn1Data = await turn1Res.json();
      expect(turn1Data.requires_confirmation).toBe(true);
      expect(turn1Data.preview.type).toBe("multi_action");
      expect(turn1Data.preview.data.actions).toHaveLength(2);

      const turn2Res = await POST(
        jsonRequest({
          message: "Confirm",
          confirm_action: turn1Data.preview,
        })
      );

      expect(turn2Res.status).toBe(200);
      const turn2Data = await turn2Res.json();
      expect(turn2Data.status).toBe("success");
      expect(turn2Data.reply).toContain("Rumble: Executed actions:");
    });
  });
});

function jsonRequest(body: unknown) {
  return new Request("https://rumble.test/api/v1/rumble/chat", { method: "POST", body: JSON.stringify(body) });
}

