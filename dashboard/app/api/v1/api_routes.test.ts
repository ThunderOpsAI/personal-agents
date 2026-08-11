import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as chatPost } from "./rumble/chat/route";
import { POST as suggestPost } from "./exercises/suggest/route";
import { GET as exercisesGet } from "./exercises/route";
import { GET as calendarGet } from "./calendar/events/route";
import { GET as weatherGet } from "./weather/forecast/route";
import { GET as agendaGet, POST as agendaPost } from "./agenda/route";
import { GET as apiHealthzGet } from "../healthz/route";
import { GET as healthzGet } from "../../healthz/route";
import { closeDb, initDb } from "../../../lib/db";
import fs from "fs";
import path from "path";

const TEST_DB_PATH = path.join(process.cwd(), "test_api_routes.db");

describe("API Routes Suite (dashboard/app/api/v1/api_routes.test.ts)", () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    initDb(TEST_DB_PATH);
  });

  afterEach(async () => {
    global.fetch = originalFetch;
    await closeDb();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    process.env = originalEnv;
  });

  describe("1. POST /api/v1/rumble/chat", () => {
    it("returns chat response with medical guardrail disclaimer when GEMINI_API_KEY is configured", async () => {
      process.env.GEMINI_API_KEY = "test-gemini-key";

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: "Here is decision support info for your recovery." }],
              },
            },
          ],
        }),
      } as Response);

      const request = new Request("https://rumble.test/api/v1/rumble/chat", {
        method: "POST",
        body: JSON.stringify({ message: "What can I do for lower back pain?" }),
      });

      const response = await chatPost(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("success");
      expect(data.disclaimer).toContain("Medical output is decision support");
      expect(data.reply).toContain("Medical output is decision support");
    });

    it("handles confirmed pain log persistence", async () => {
      process.env.RUMBLE_EVE_PAIN_LOG_URL = "https://eve.test/pain-log";
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ entry_id: "pain-123" }),
      } as Response);

      const request = new Request("https://rumble.test/api/v1/rumble/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Please log pain",
          confirmedPainLog: {
            score: 6,
            locations: [{ area: "lumbar", side: "unspecified", percentage: 100 }],
          },
        }),
      });

      const response = await chatPost(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("success");
      expect(data.intent).toBe("LOG_PAIN");
    });

    it("returns 400 on invalid payload", async () => {
      const request = new Request("https://rumble.test/api/v1/rumble/chat", {
        method: "POST",
        body: JSON.stringify({ invalid: true }),
      });

      const response = await chatPost(request);
      expect(response.status).toBe(400);
    });
  });

  describe("2. Rehabilitation Exercises: POST /suggest and GET /exercises", () => {
    it("POST /api/v1/exercises/suggest calls live integration without hardcoded mock data", async () => {
      process.env.RUMBLE_EVE_REHAB_URL = "https://eve.test/rehab";
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestions: [{ id: "ex-1", name: "Glute Bridge" }],
        }),
      } as Response);

      const request = new Request("https://rumble.test/api/v1/exercises/suggest", {
        method: "POST",
        body: JSON.stringify({ pain_level: 3, limit: 3 }),
      });

      const response = await suggestPost(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("success");
      expect(data.suggestions).toEqual([{ id: "ex-1", name: "Glute Bridge" }]);
    });

    it("GET /api/v1/exercises fetches suggestions or returns 503 when live service unavailable", async () => {
      delete process.env.RUMBLE_EVE_REHAB_URL;

      const request = new Request("https://rumble.test/api/v1/exercises?pain_level=2");
      const response = await exercisesGet(request);
      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.status).toBe("unavailable");
    });
  });

  describe("3. GET /api/v1/calendar/events", () => {
    it("returns 401 auth_required when OAuth credentials are absent", async () => {
      delete process.env.GOOGLE_CALENDAR_ACCESS_TOKEN;
      delete process.env.GOOGLE_OAUTH_TOKEN;

      const request = new Request("https://rumble.test/api/v1/calendar/events");
      const response = await calendarGet(request);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.status).toBe("auth_required");
      expect(data.message).toBe("Google Calendar authorization required");
    });

    it("fetches events live when access token is provided", async () => {
      process.env.GOOGLE_CALENDAR_ACCESS_TOKEN = "valid-token";
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          items: [{ id: "evt-1", summary: "Physio Appointment" }],
        }),
      } as Response);

      const request = new Request("https://rumble.test/api/v1/calendar/events");
      const response = await calendarGet(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("success");
      expect(data.events).toEqual([{ id: "evt-1", summary: "Physio Appointment" }]);
    });
  });

  describe("4. GET /api/v1/weather/forecast", () => {
    it("fetches live Open-Meteo weather for Wangaratta", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        expect(url).toContain("latitude=-36.3536");
        expect(url).toContain("longitude=146.3225");
        expect(url).toContain("Australia%2FMelbourne");
        return Promise.resolve({
          ok: true,
          json: async () => ({
            current_weather: { temperature: 18.5, windspeed: 12 },
          }),
        } as Response);
      });

      const response = await weatherGet();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("success");
      expect(data.location).toBe("Wangaratta, Victoria, Australia");
      expect(data.forecast.current_weather.temperature).toBe(18.5);
    });

    it("returns explicit 503 unavailable state when network/API fails", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network Error"));

      const response = await weatherGet();
      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.status).toBe("unavailable");
      expect(data.error).toBe("Weather forecast service unreachable");
    });
  });

  describe("5. Agenda API: GET & POST /api/v1/agenda", () => {
    it("supports creating, listing, and updating agenda items", async () => {
      // 1. GET empty items
      const getRes1 = await agendaGet();
      expect(getRes1.status).toBe(200);
      const getData1 = await getRes1.json();
      expect(getData1.status).toBe("success");
      expect(getData1.items).toEqual([]);

      // 2. POST create item
      const createReq = new Request("https://rumble.test/api/v1/agenda", {
        method: "POST",
        body: JSON.stringify({
          title: "Morning Stretching Routine",
          item_type: "exercise",
          scheduled_time: "2026-08-12T08:00:00Z",
        }),
      });
      const createRes = await agendaPost(createReq);
      expect(createRes.status).toBe(201);
      const createData = await createRes.json();
      expect(createData.status).toBe("success");
      expect(createData.item.title).toBe("Morning Stretching Routine");
      const createdId = createData.item.id;

      // 3. GET list after creation
      const getRes2 = await agendaGet();
      const getData2 = await getRes2.json();
      expect(getData2.items).toHaveLength(1);
      expect(getData2.items[0].id).toBe(createdId);

      // 4. POST update status
      const updateReq = new Request("https://rumble.test/api/v1/agenda", {
        method: "POST",
        body: JSON.stringify({
          action: "update_status",
          id: createdId,
          status: "completed",
          note: "Completed routine at 8:15",
        }),
      });
      const updateRes = await agendaPost(updateReq);
      expect(updateRes.status).toBe(200);
      const updateData = await updateRes.json();
      expect(updateData.status).toBe("success");
      expect(updateData.item.status).toBe("completed");
    });

    it("validates missing fields on item creation", async () => {
      const createReq = new Request("https://rumble.test/api/v1/agenda", {
        method: "POST",
        body: JSON.stringify({ title: "Incomplete Item" }),
      });
      const response = await agendaPost(createReq);
      expect(response.status).toBe(400);
    });
  });

  describe("6. Health Endpoint Checks: /api/healthz and /healthz", () => {
    it("GET /api/healthz returns ok, timestamp, and DB status", async () => {
      const response = await apiHealthzGet();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("ok");
      expect(typeof data.timestamp).toBe("string");
      expect(data.db).toBeDefined();
    });

    it("GET /healthz returns ok, timestamp, and DB status", async () => {
      const response = await healthzGet();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("ok");
      expect(typeof data.timestamp).toBe("string");
      expect(data.db).toBeDefined();
    });
  });
});
