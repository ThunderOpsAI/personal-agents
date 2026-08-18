import type { ConfirmedPainLog, ExerciseSuggestionInput, PainLocation } from "./rumble-integrations";

const MAX_MESSAGE_LENGTH = 8_000;

export type ChatRequest = { message: string; history?: { role: string; content: string }[]; confirmedPainLog?: ConfirmedPainLog };

export function parseChatRequest(value: unknown): ChatRequest | null {
  if (!isRecord(value) || typeof value.message !== "string") return null;
  const message = value.message.trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH) return null;

  let history: { role: string; content: string }[] | undefined = undefined;
  if (Array.isArray(value.history)) {
    history = value.history.filter((h: any) => isRecord(h) && typeof h.role === "string" && typeof h.content === "string") as { role: string; content: string }[];
  }

  if (value.confirmedPainLog === undefined) return { message, history };
  const confirmedPainLog = parseConfirmedPainLog(value.confirmedPainLog);
  return confirmedPainLog ? { message, history, confirmedPainLog } : null;
}

export function parseExerciseSuggestionRequest(value: unknown): ExerciseSuggestionInput | null {
  if (!isRecord(value)) return null;
  const input: ExerciseSuggestionInput = {};
  if (value.pain_level !== undefined) {
    if (!isIntegerBetween(value.pain_level, 1, 10)) return null;
    input.pain_level = value.pain_level;
  }
  if (value.limit !== undefined) {
    if (!isIntegerBetween(value.limit, 3, 5)) return null;
    input.limit = value.limit;
  }
  if (value.generators !== undefined) {
    if (!Array.isArray(value.generators)) return null;
    const generators = value.generators.map(parsePainLocation);
    if (generators.some((location) => location === null)) return null;
    input.generators = generators as PainLocation[];
  }
  return input;
}

function parseConfirmedPainLog(value: unknown): ConfirmedPainLog | null {
  if (!isRecord(value) || !isIntegerBetween(value.score, 1, 10) || !Array.isArray(value.locations)) return null;
  const locations = value.locations.map(parsePainLocation);
  if (!locations.length || locations.some((location) => location === null)) return null;
  const validLocations = locations as PainLocation[];
  if (validLocations.reduce((total, location) => total + location.percentage, 0) !== 100) return null;
  if (value.mood !== undefined && typeof value.mood !== "string") return null;
  if (value.notes !== undefined && typeof value.notes !== "string") return null;
  return { score: value.score, locations: validLocations, ...(typeof value.mood === "string" ? { mood: value.mood } : {}), ...(typeof value.notes === "string" ? { notes: value.notes } : {}) };
}

function parsePainLocation(value: unknown): PainLocation | null {
  if (!isRecord(value) || typeof value.area !== "string" || !value.area.trim() || !isIntegerBetween(value.percentage, 1, 100)) return null;
  if (value.side !== undefined && value.side !== "left" && value.side !== "right" && value.side !== "unspecified") return null;
  return { area: value.area.trim(), percentage: value.percentage, ...(value.side ? { side: value.side } : {}) };
}

function isIntegerBetween(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= minimum && value <= maximum;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
