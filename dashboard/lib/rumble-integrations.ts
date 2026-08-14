/**
 * Edge-safe boundary for the configured Vercel Eve services.
 *
 * These URLs deliberately have no defaults. Production requests must reach the
 * live Eve workflows and must never fall back to the retired FastAPI service or
 * generated recommendations.
 */
export type PainLocation = {
  area: string;
  side?: "left" | "right" | "unspecified";
  percentage: number;
};

export type ConfirmedPainLog = {
  score: number;
  locations: PainLocation[];
  mood?: string;
  notes?: string;
};

export type EveChatInput = {
  message: string;
  confirmedPainLog?: ConfirmedPainLog;
};

export type EveChatResult = {
  reply: string;
  intent?: string;
  data?: unknown;
};

export type ExerciseSuggestionInput = {
  pain_level?: number;
  generators?: PainLocation[];
  limit?: number;
};

export type ExerciseSuggestion = {
  id: string;
  name: string;
  instruction?: string;
  duration_minutes?: number;
  intensity?: string;
  media_url?: string;
  image_url?: string;
  video_url?: string;
};

export class LiveIntegrationUnavailableError extends Error {
  constructor(public readonly integration: "chat" | "pain-log" | "exercises", message?: string) {
    super(message ?? `${integration} integration is unavailable`);
    this.name = "LiveIntegrationUnavailableError";
  }
}

export const MEDICAL_GUARDRAIL =
  "Medical output is decision support, not diagnosis. Preserve clinician restrictions; recommend clinician review for worsening or concerning symptoms.";

function configuredUrl(name: "RUMBLE_EVE_CHAT_URL" | "RUMBLE_EVE_PAIN_LOG_URL" | "RUMBLE_EVE_REHAB_URL", integration: "chat" | "pain-log" | "exercises") {
  const value = process.env[name];
  if (!value) throw new LiveIntegrationUnavailableError(integration, `${integration} integration is not configured`);
  return value;
}

async function postLiveJson(url: string, body: unknown, integration: "chat" | "pain-log" | "exercises"): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.RUMBLE_EVE_API_TOKEN ? { Authorization: `Bearer ${process.env.RUMBLE_EVE_API_TOKEN}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new LiveIntegrationUnavailableError(integration);
  }

  if (!response.ok) throw new LiveIntegrationUnavailableError(integration);
  try {
    return await response.json();
  } catch {
    throw new LiveIntegrationUnavailableError(integration);
  }
}

export async function sendConversationalChat(message: string): Promise<EveChatResult & { requires_confirmation?: boolean; preview?: any }> {
  if (process.env.RUMBLE_EVE_CHAT_URL && !process.env.GEMINI_API_KEY) {
    const result = await postLiveJson(
      configuredUrl("RUMBLE_EVE_CHAT_URL", "chat"),
      { message, mode: "conversation", safety: { medical_guardrail: MEDICAL_GUARDRAIL } },
      "chat",
    );
    if (!isRecord(result) || typeof result.reply !== "string" || !result.reply.trim()) {
      throw new LiveIntegrationUnavailableError("chat", "chat integration returned an invalid response");
    }
    return { reply: result.reply, intent: typeof result.intent === "string" ? result.intent : undefined, data: result.data };
  }

  // Use TypeScript Intent Router
  const { routeChatMessage } = await import("./agents/intent-router");
  const routed = await routeChatMessage(message);
  return {
    reply: routed.reply,
    intent: routed.intent,
    data: routed.data,
    requires_confirmation: routed.requires_confirmation,
    preview: routed.preview,
  };
}

export async function persistConfirmedPainLog(log: ConfirmedPainLog): Promise<unknown> {
  if (process.env.RUMBLE_EVE_PAIN_LOG_URL) {
    return postLiveJson(
      configuredUrl("RUMBLE_EVE_PAIN_LOG_URL", "pain-log"),
      { ...log, source: "rumble_chat", confirmed: true },
      "pain-log",
    );
  }

  const { executeConfirmedAction } = await import("./agents/intent-router");
  const res = await executeConfirmedAction({ type: "pain_log", data: log });
  return res.result;
}


export async function getLiveExerciseSuggestions(input: ExerciseSuggestionInput): Promise<ExerciseSuggestion[]> {
  const result = await postLiveJson(
    configuredUrl("RUMBLE_EVE_REHAB_URL", "exercises"),
    { ...input, safety: { medical_guardrail: MEDICAL_GUARDRAIL } },
    "exercises",
  );
  if (!isRecord(result) || !Array.isArray(result.suggestions) || !result.suggestions.every(isExerciseSuggestion)) {
    throw new LiveIntegrationUnavailableError("exercises", "rehabilitation integration returned an invalid response");
  }
  return result.suggestions;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isExerciseSuggestion(value: unknown): value is ExerciseSuggestion {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string";
}
