import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchYogaRoutine,
  fetchFromTier1,
  fetchFromTier2,
  fetchFromTier3,
} from "./fetch_yoga_routine";

describe("3-Tier Fallback Mechanism for Daily Yoga Routines (Eve Tool)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("Tier 1: Successfully fetches and maps poses from primary LunaticPrakash yoga-api", async () => {
    const mockTier1Data = [
      {
        id: 1,
        english_name: "Cat-Cow Stretch",
        sanskrit_name: "Marjaryasana",
        pose_description: "Gentle spinal flow on all fours.",
        pose_benefits: "Decompresses lumbar spine.",
        target_muscles: ["spine", "core"],
        contraindications: ["wrist pain"],
        procedure: ["Step 1: On all fours", "Step 2: Arch back"],
        url_png: "https://example.com/cat_cow.png"
      }
    ];

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockTier1Data
    });

    const result = await fetchYogaRoutine.execute({ limit: 1 });
    expect(result.success).toBe(true);
    expect(result.tierUsed).toBe("tier1_primary_yoga_api");
    expect(result.poses.length).toBe(1);
    expect(result.poses[0].english_name).toBe("Cat-Cow Stretch");
    expect(result.poses[0].image_url).toBe("https://example.com/cat_cow.png");
    expect(result.auditLogs.some(log => log.includes("[Tier 1 SUCCESS]"))).toBe(true);
  });

  it("Tier 2 Fallback: Falls back to priyangsubanerjee yogism API when Tier 1 fails", async () => {
    const mockTier2Data = {
      featured: [
        {
          english_name: "Balasana",
          sanskrit_name: "Balasana",
          description: "Restorative resting pose.",
          benefits: "Relieves back fatigue.",
          target: "Spine and hips",
          steps: "Kneel on the floor.\nFold forward.",
          image: "https://example.com/balasana.jpg"
        }
      ]
    };

    // Tier 1 fails (e.g. 500 error), Tier 2 succeeds
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error("Tier 1 service unavailable (503)"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTier2Data
      });

    const result = await fetchYogaRoutine.execute({ limit: 1 });
    expect(result.success).toBe(true);
    expect(result.tierUsed).toBe("tier2_fallback_yogism");
    expect(result.poses.length).toBe(1);
    expect(result.poses[0].english_name).toBe("Balasana");
    expect(result.poses[0].image_url).toBe("https://example.com/balasana.jpg");
    expect(result.auditLogs.some(log => log.includes("[Tier 1 FAILED]"))).toBe(true);
    expect(result.auditLogs.some(log => log.includes("[Tier 2 SUCCESS]"))).toBe(true);
  });

  it("Tier 3 Failsafe: Falls back to local Kaggle Dataset mapped to /assets/yoga when Tier 1 and Tier 2 both fail", async () => {
    // Tier 1 fails, Tier 2 fails
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error("Tier 1 timeout"))
      .mockRejectedValueOnce(new Error("Tier 2 network error"));

    const result = await fetchYogaRoutine.execute({ limit: 3 });
    expect(result.success).toBe(true);
    expect(result.tierUsed).toBe("tier3_failsafe_kaggle");
    expect(result.poses.length).toBe(3);
    expect(result.poses[0].source_tier).toBe("tier3_failsafe_kaggle");
    expect(result.poses[0].image_url).toMatch(/^\/assets\/yoga\//);
    expect(result.auditLogs.some(log => log.includes("[Tier 1 FAILED]"))).toBe(true);
    expect(result.auditLogs.some(log => log.includes("[Tier 2 FAILED]"))).toBe(true);
    expect(result.auditLogs.some(log => log.includes("[Tier 3 SUCCESS]"))).toBe(true);
  });

  it("Filters contraindications safely in output routines", async () => {
    const poses = fetchFromTier3();
    expect(poses.length).toBeGreaterThanOrEqual(5);

    // Requesting with disc herniation contraindication should filter out Cobra pose
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error("Tier 1 off"))
      .mockRejectedValueOnce(new Error("Tier 2 off"));

    const result = await fetchYogaRoutine.execute({
      contraindications: ["disc herniation"],
      limit: 10
    });

    expect(result.success).toBe(true);
    const cobra = result.poses.find(p => p.english_name.toLowerCase().includes("cobra"));
    expect(cobra).toBeUndefined();
  });

  it("Live Integration: Successfully executes against live production endpoints without throwing", async () => {
    // Uses real network fetch
    const result = await fetchYogaRoutine.execute({ limit: 3 });
    expect(result.success).toBe(true);
    expect(["tier1_primary_yoga_api", "tier2_fallback_yogism", "tier3_failsafe_kaggle"]).toContain(result.tierUsed);
    expect(result.poses.length).toBeGreaterThanOrEqual(1);
    expect(result.auditLogs.length).toBeGreaterThanOrEqual(2);
    expect(result.poses[0].image_url).toBeDefined();
  });
});

