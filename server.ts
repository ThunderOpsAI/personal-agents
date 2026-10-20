import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: "5mb" }));

// Ensure GEMINI_API_KEY takes precedence and invalid GOOGLE_API_KEY is not picked up
if (process.env.GEMINI_API_KEY) {
  delete process.env.GOOGLE_API_KEY;
}

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Health endpoints
app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "healthy", service: "Rumble OS API", geminiConfigured: !!ai });
});

// Helper: Rule-based fallback summary if Gemini API is unreachable or key is not set
function generateRuleBasedInsight(painLogs: any[]) {
  if (!painLogs || painLogs.length === 0) {
    return {
      headline: "No Pain Logs Recorded Today",
      summary: "No clinical pain entries have been logged for this date yet. Log your current symptoms to activate real-time pattern analysis.",
      trajectoryTrend: "Baseline / Untracked",
      severityLevel: "Untracked",
      averageScore: 0,
      primaryDrivers: ["No active anatomical driver"],
      keyPatterns: ["Awaiting first symptom check-in of the day."],
      aggravatorsIdentified: [],
      effectiveTherapies: [],
      pacingRecommendations: [
        "Complete morning check-in after rising",
        "Keep fluid hydration steady and maintain gentle spinal neutral",
      ],
      suggestedProtocol: "Morning Adaptive Yoga: Gentle Lumbar Release",
      isAiGenerated: false,
    };
  }

  const scores = painLogs.map((l) => Number(l.score) || 0);
  const avgScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);

  // Anatomical breakdown
  const areaTotals: Record<string, { weight: number; count: number }> = {};
  painLogs.forEach((l) => {
    (l.locations || []).forEach((loc: any) => {
      const area = loc.area || "General";
      if (!areaTotals[area]) areaTotals[area] = { weight: 0, count: 0 };
      areaTotals[area].weight += Number(loc.percentage) || 50;
      areaTotals[area].count += 1;
    });
  });

  const sortedAreas = Object.entries(areaTotals)
    .sort((a, b) => b[1].weight - a[1].weight)
    .map(([area, data]) => {
      const avgWeight = Math.round(data.weight / painLogs.length);
      return `${area} (${avgWeight}% load)`;
    });

  // Aggravators & Therapies
  const allAggravators = Array.from(new Set(painLogs.flatMap((l) => l.aggravators || [])));
  const allTherapies = Array.from(new Set(painLogs.flatMap((l) => l.therapies || [])));

  let severityLevel = "Mild";
  if (avgScore >= 7) severityLevel = "Severe";
  else if (avgScore >= 5) severityLevel = "Moderate";

  let trajectoryTrend = "Stable baseline";
  if (scores.length >= 2) {
    const first = scores[0];
    const last = scores[scores.length - 1];
    if (last > first + 1) trajectoryTrend = "Escalating flare later in day";
    else if (last < first - 1) trajectoryTrend = "Easing symptom trajectory";
    else trajectoryTrend = "Persistent consistent load";
  }

  const patterns = [
    `Average daily pain rating of ${avgScore}/10 across ${painLogs.length} logged entry(s).`,
    sortedAreas[0] ? `Primary anatomical focal driver is ${sortedAreas[0]}.` : "Distributed diffuse symptoms.",
  ];
  if (allAggravators.length > 0) {
    patterns.push(`Aggravating exposure flagged: ${allAggravators.join(", ")}.`);
  }
  if (allTherapies.length > 0) {
    patterns.push(`Reported relief therapies: ${allTherapies.join(", ")}.`);
  }

  const recommendations = [
    avgScore >= 7
      ? "Prioritize horizontal lumbar decompression and restrict prolonged standing."
      : "Maintain scheduled 20-minute movement breaks and light spinal rotation.",
    allTherapies.includes("Hydrotherapy")
      ? "Hydrotherapy demonstrated positive delta; maintain scheduled pool session."
      : "Apply warm heat pack or gentle hydro aquatic decompression if tightness persists.",
  ];

  return {
    headline: `${severityLevel} Pain Burden (${avgScore}/10) – Focal on ${sortedAreas[0] || "Spine"}`,
    summary: `Today's clinical profile reflects an average score of ${avgScore}/10 across ${painLogs.length} entry(s). Symptoms are predominantly driven by ${sortedAreas[0] || "spinal load"}, with observed triggers including ${allAggravators.slice(0, 2).join(", ") || "daily exertion"}.`,
    trajectoryTrend,
    severityLevel,
    averageScore: avgScore,
    primaryDrivers: sortedAreas.slice(0, 3),
    keyPatterns: patterns,
    aggravatorsIdentified: allAggravators,
    effectiveTherapies: allTherapies,
    pacingRecommendations: recommendations,
    suggestedProtocol:
      avgScore >= 7
        ? "Gentle Supine Lumbar Decompression"
        : "Morning Adaptive Yoga: Gentle Lumbar Release",
    isAiGenerated: false,
  };
}

// POST /api/insights/daily
// Generates clinical insight summarizing key patterns from day's pain logs using Gemini API
app.post("/api/insights/daily", async (req, res) => {
  const { painLogs, date, weather } = req.body;

  if (!painLogs || !Array.isArray(painLogs) || painLogs.length === 0) {
    return res.status(200).json(generateRuleBasedInsight([]));
  }

  if (!ai) {
    console.warn("Gemini client not initialized (missing GEMINI_API_KEY). Providing rule-based clinical insight.");
    return res.status(200).json(generateRuleBasedInsight(painLogs));
  }

  try {
    const formattedLogs = painLogs.map((l: any, idx: number) => {
      const locStr = (l.locations || [])
        .map((loc: any) => `${loc.area}: ${loc.percentage}% (score ${loc.score || l.score})`)
        .join("; ");
      return `[Entry ${idx + 1} at ${l.created_at || "N/A"}]
- Pain Score: ${l.score}/10
- Soreness: ${l.soreness || "Unspecified"}
- Anatomical Allocation: ${locStr || "Unspecified"}
- Mood: ${l.mood || "Unspecified"} (${l.moodScore ?? "N/A"}/10)
- Aggravators: ${(l.aggravators || []).join(", ") || "None listed"}
- Therapies Used: ${(l.therapies || []).join(", ") || "None listed"}
- Clinical Notes: "${l.notes || "No notes"}"`;
    }).join("\n\n");

    const promptText = `Analyze the following pain and symptom logs recorded for ${date || "today"} in Rumble OS:

${formattedLogs}

${weather ? `Weather context in Wangaratta: ${weather.temp}°C, ${weather.condition}, Humidity: ${weather.humidity || "N/A"}%` : ""}

Task:
Synthesize the key physiological and mechanical patterns across these pain logs into a clinical Daily Insight. Identify:
1. Pain trajectory across the day (e.g. morning stiffness vs evening flare).
2. Primary anatomical drivers and percentage burdens.
3. Aggravator and therapy correlation patterns.
4. Actionable pacing recommendations and a matching gentle rehabilitation protocol.
Keep language professional, encouraging, objective, and conservative. Never diagnose. Provide clear decision support.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: promptText,
      config: {
        systemInstruction:
          "You are a specialist clinical rehabilitation, ergonomics, and pain pacing AI engine for Rumble OS. Analyze patient symptom logs and extract concise, high-value clinical patterns, biomechanical trends, and pacing guidance. Output strictly in the requested JSON structure.",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: {
              type: Type.STRING,
              description: "A punchy, clear 4-8 word title summarizing today's pain trajectory",
            },
            summary: {
              type: Type.STRING,
              description: "2-3 concise sentences summarizing key clinical patterns across the day's logs",
            },
            trajectoryTrend: {
              type: Type.STRING,
              description: "Pattern trend description e.g. 'Morning stiffness easing post-shower', 'Late-day neuropathic flare', 'Consistent low baseline'",
            },
            severityLevel: {
              type: Type.STRING,
              description: "Overall classification e.g. 'Mild', 'Moderate', 'Severe', 'Fluctuating'",
            },
            averageScore: {
              type: Type.NUMBER,
              description: "Computed or observed average pain score (0 to 10)",
            },
            primaryDrivers: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Top 1-3 anatomical drivers with percentage load (e.g. 'Right Lumbar (70% load)')",
            },
            keyPatterns: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-4 key physiological or behavioral patterns detected across entries",
            },
            aggravatorsIdentified: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Key triggers or aggravators extracted from the logs",
            },
            effectiveTherapies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Therapies or interventions that yielded positive relief or mitigation",
            },
            pacingRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-3 specific, conservative action points for pacing, rest, or movement",
            },
            suggestedProtocol: {
              type: Type.STRING,
              description: "Name of recommended matching routine from Rumble OS exercise database",
            },
          },
          required: [
            "headline",
            "summary",
            "trajectoryTrend",
            "severityLevel",
            "primaryDrivers",
            "keyPatterns",
            "pacingRecommendations",
          ],
        },
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);

    return res.status(200).json({
      ...parsed,
      isAiGenerated: true,
      modelUsed: "gemini-3.8-flash",
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.warn("Primary gemini-3.8-flash call failed, trying gemini-3.1-flash-lite fallback:", error?.message);
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: promptText,
        config: {
          systemInstruction:
            "You are a clinical rehabilitation and pain pacing AI for Rumble OS. Analyze patient symptom logs and extract clinical patterns. Output valid JSON.",
          responseMimeType: "application/json",
        },
      });
      const parsedFallback = JSON.parse(fallbackResponse.text || "{}");
      return res.status(200).json({
        ...parsedFallback,
        isAiGenerated: true,
        modelUsed: "gemini-3.1-flash-lite",
        generatedAt: new Date().toISOString(),
      });
    } catch (fallbackErr: any) {
      console.error("Gemini fallback also failed:", fallbackErr?.message);
      const fallback = generateRuleBasedInsight(painLogs);
      return res.status(200).json({
        ...fallback,
        isAiGenerated: false,
        apiNotice: "Gemini service temporarily unavailable; standard clinical telemetry applied.",
      });
    }
  }
});

// Setup Vite in development or serve static assets in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Rumble OS server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
