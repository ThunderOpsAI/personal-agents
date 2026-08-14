import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as painLogPost } from "./pain/log/route";
import { POST as rehabCompletePost } from "./rehab/complete/route";
import { POST as rehabDismissPost } from "./rehab/dismiss/route";
import { GET as briefingSundayGet, POST as briefingSundayPost } from "./briefing/sunday/route";
import { clearRehabLearningStore } from "../../../lib/rehab-learning";

describe("Rehab API Routes (dashboard/app/api/v1/rehab_routes.test.ts)", () => {
  beforeEach(() => {
    clearRehabLearningStore();
  });

  afterEach(() => {
    clearRehabLearningStore();
  });

  describe("1. POST /api/v1/pain/log", () => {
    it("successfully logs pain with score, multiple weighted locations, mood, and notes", async () => {
      const payload = {
        score: 6,
        locations: [
          { area: "lumbar", side: "unspecified", weight: 70 },
          { area: "right_hip", side: "right", weight: 30 },
        ],
        mood: "frustrated",
        notes: "Pain after prolonged walking",
      };

      const request = new Request("https://rumble.test/api/v1/pain/log", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const response = await painLogPost(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.status).toBe("success");
      expect(data.data.score).toBe(6);
      expect(data.data.mood).toBe("frustrated");
      expect(data.data.locations).toHaveLength(2);
    });

    it("returns 400 when pain score is invalid", async () => {
      const payload = {
        score: 15,
        locations: [{ area: "lumbar", weight: 100 }],
      };

      const request = new Request("https://rumble.test/api/v1/pain/log", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const response = await painLogPost(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.status).toBe("error");
      expect(data.error).toBe("Validation failed");
    });

    it("returns 400 when location weights do not sum to 100%", async () => {
      const payload = {
        score: 5,
        locations: [
          { area: "lumbar", weight: 40 },
          { area: "right_hip", weight: 40 },
        ],
      };

      const request = new Request("https://rumble.test/api/v1/pain/log", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const response = await painLogPost(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.status).toBe("error");
    });
  });

  describe("2. POST /api/v1/rehab/complete", () => {
    it("completes routine, calculates relief delta, and returns ChromaDB record", async () => {
      const payload = {
        routineId: "routine_lumbar_strengthening",
        routineTitle: "Lumbar Core Strengthening",
        prePainScore: 7,
        postPainScore: 2,
        notes: "Great improvement post exercise",
      };

      const request = new Request("https://rumble.test/api/v1/rehab/complete", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const response = await rehabCompletePost(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.status).toBe("success");
      expect(data.data.routineId).toBe("routine_lumbar_strengthening");
      expect(data.data.reliefDelta).toBe(5);
      expect(data.data.prePainScore).toBe(7);
      expect(data.data.postPainScore).toBe(2);
    });

    it("returns 400 on missing or invalid pain scores", async () => {
      const payload = {
        routineId: "routine_1",
        prePainScore: 0,
        postPainScore: 5,
      };

      const request = new Request("https://rumble.test/api/v1/rehab/complete", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const response = await rehabCompletePost(request);
      expect(response.status).toBe(400);
    });
  });

  describe("3. POST /api/v1/rehab/dismiss", () => {
    it("records routine dismissal reason ('Too tired')", async () => {
      const payload = {
        routineId: "routine_hip_flexor",
        routineTitle: "Hip Flexor Stretch",
        reason: "Too tired",
        notes: "Exhausted after work",
      };

      const request = new Request("https://rumble.test/api/v1/rehab/dismiss", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const response = await rehabDismissPost(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.status).toBe("success");
      expect(data.data.reason).toBe("Too tired");
      expect(data.data.routineId).toBe("routine_hip_flexor");
    });

    it("returns 400 when reason is missing", async () => {
      const payload = {
        routineId: "routine_hip_flexor",
        reason: "",
      };

      const request = new Request("https://rumble.test/api/v1/rehab/dismiss", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const response = await rehabDismissPost(request);
      expect(response.status).toBe(400);
    });
  });

  describe("4. GET & POST /api/v1/briefing/sunday", () => {
    it("GET surfaces learned exercise rules for user approval/rejection", async () => {
      // Create data that generates rules
      const completeReq = new Request("https://rumble.test/api/v1/rehab/complete", {
        method: "POST",
        body: JSON.stringify({
          routineId: "routine_glute_bridge",
          routineTitle: "Glute Bridges",
          prePainScore: 8,
          postPainScore: 3,
        }),
      });
      await rehabCompletePost(completeReq);

      const dismissReq = new Request("https://rumble.test/api/v1/rehab/dismiss", {
        method: "POST",
        body: JSON.stringify({
          routineId: "routine_heavy_deadlift",
          routineTitle: "Heavy Deadlifts",
          reason: "Hurts",
        }),
      });
      await rehabDismissPost(dismissReq);

      const response = await briefingSundayGet();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("success");
      expect(data.rules).toHaveLength(2);

      const ruleIds = data.rules.map((r: any) => r.routineId);
      expect(ruleIds).toContain("routine_glute_bridge");
      expect(ruleIds).toContain("routine_heavy_deadlift");
    });

    it("POST allows approving or rejecting a rule", async () => {
      // 1. Generate a rule via complete routine
      const completeReq = new Request("https://rumble.test/api/v1/rehab/complete", {
        method: "POST",
        body: JSON.stringify({
          routineId: "routine_cat_cow",
          routineTitle: "Cat Cow Stretch",
          prePainScore: 7,
          postPainScore: 2,
        }),
      });
      await rehabCompletePost(completeReq);

      // 2. Fetch rules to get ID
      const getRes = await briefingSundayGet();
      const getData = await getRes.json();
      const ruleId = getData.rules[0].id;

      // 3. Approve rule
      const approveReq = new Request("https://rumble.test/api/v1/briefing/sunday", {
        method: "POST",
        body: JSON.stringify({
          ruleId,
          action: "approve",
        }),
      });
      const approveRes = await briefingSundayPost(approveReq);
      expect(approveRes.status).toBe(200);
      const approveData = await approveRes.json();
      expect(approveData.status).toBe("success");
      expect(approveData.rule.status).toBe("approved");
    });
  });
});
