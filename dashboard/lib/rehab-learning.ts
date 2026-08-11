import fs from 'fs';
import path from 'path';

export interface PainLocationWeight {
  area: string;
  side?: 'left' | 'right' | 'unspecified';
  weight?: number;
  percentage?: number;
}

export interface PainLogInput {
  score: number;
  locations: PainLocationWeight[];
  mood?: string;
  notes?: string;
}

export interface PainLogEntry {
  id: string;
  score: number;
  locations: Array<{
    area: string;
    side: 'left' | 'right' | 'unspecified';
    weight: number;
  }>;
  mood?: string;
  notes?: string;
  timestamp: string;
}

export interface RoutineCompletionInput {
  routineId: string;
  routineTitle?: string;
  prePainScore: number;
  postPainScore: number;
  notes?: string;
}

export interface ChromaPreferenceRecord {
  id: string;
  routineId: string;
  routineTitle: string;
  prePainScore: number;
  postPainScore: number;
  reliefDelta: number;
  timestamp: string;
  notes?: string;
  chromaPath: string;
}

export type RejectionReason = 'Too tired' | 'Hurts' | 'Inconvenient' | string;

export interface RoutineDismissalInput {
  routineId: string;
  routineTitle?: string;
  reason: RejectionReason;
  notes?: string;
}

export interface RoutineDismissalEntry {
  id: string;
  routineId: string;
  routineTitle: string;
  reason: RejectionReason;
  notes?: string;
  timestamp: string;
}

export interface ExerciseRecalibrationRule {
  id: string;
  routineId: string;
  routineTitle: string;
  action: 'increase_frequency' | 'reduce_intensity' | 'change_schedule' | 'remove';
  recommendation: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// In-memory + ChromaDB file storage state
let painLogs: PainLogEntry[] = [];
let chromaPreferenceStore: ChromaPreferenceRecord[] = [];
let routineDismissals: RoutineDismissalEntry[] = [];
let SundayBriefingRules: ExerciseRecalibrationRule[] = [];

/**
 * Resets the in-memory learning store (useful before running tests).
 */
export function clearRehabLearningStore(): void {
  painLogs = [];
  chromaPreferenceStore = [];
  routineDismissals = [];
  SundayBriefingRules = [];
}

/**
 * Validates a pain log payload according to strict business rules:
 * 1. Pain score must be an integer or float between 1 and 10 (inclusive).
 * 2. Locations array must be non-empty.
 * 3. Each location must have an area string and weight/percentage number.
 * 4. Sum of location weights/percentages must equal 100%.
 */
export function validatePainLog(input: Partial<PainLogInput>): ValidationResult {
  const errors: string[] = [];

  if (typeof input.score !== 'number' || Number.isNaN(input.score)) {
    errors.push('Pain score must be a valid number.');
  } else if (input.score < 1 || input.score > 10) {
    errors.push('Pain score must be between 1 and 10.');
  }

  if (!Array.isArray(input.locations) || input.locations.length === 0) {
    errors.push('At least one anatomical location must be provided.');
  } else {
    let totalWeight = 0;
    for (let i = 0; i < input.locations.length; i++) {
      const loc = input.locations[i];
      if (!loc || typeof loc.area !== 'string' || !loc.area.trim()) {
        errors.push(`Location at index ${i} must have a valid area.`);
      }
      const weight = typeof loc.weight === 'number' ? loc.weight : loc.percentage;
      if (typeof weight !== 'number' || Number.isNaN(weight) || weight <= 0) {
        errors.push(`Location at index ${i} must have a positive weight/percentage.`);
      } else {
        totalWeight += weight;
      }
    }

    if (errors.length === 0 && Math.abs(totalWeight - 100) > 0.01) {
      errors.push(`Location weights must total exactly 100%. (Current total: ${totalWeight}%)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Logs a validated pain record into the store.
 */
export function logPain(input: PainLogInput): { success: boolean; entry?: PainLogEntry; errors?: string[] } {
  const validation = validatePainLog(input);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  const normalizedLocations = input.locations.map((loc) => ({
    area: loc.area.trim(),
    side: loc.side || 'unspecified',
    weight: typeof loc.weight === 'number' ? loc.weight : loc.percentage || 0,
  }));

  const entry: PainLogEntry = {
    id: `pain_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    score: input.score,
    locations: normalizedLocations,
    mood: input.mood?.trim(),
    notes: input.notes?.trim(),
    timestamp: new Date().toISOString(),
  };

  painLogs.push(entry);
  return { success: true, entry };
}

export function getPainLogs(): PainLogEntry[] {
  return [...painLogs];
}

/**
 * Completes a routine flow:
 * 1. Validates pre and post pain scores (1-10).
 * 2. Calculates relief delta = prePainScore - postPainScore.
 * 3. Persists record to ChromaDB preference store.
 * 4. Generates or updates Sunday Briefing exercise recalibration rules.
 */
export function completeRoutine(input: RoutineCompletionInput): {
  success: boolean;
  record?: ChromaPreferenceRecord;
  errors?: string[];
} {
  const errors: string[] = [];

  if (!input.routineId || typeof input.routineId !== 'string' || !input.routineId.trim()) {
    errors.push('routineId is required.');
  }

  if (typeof input.prePainScore !== 'number' || input.prePainScore < 1 || input.prePainScore > 10) {
    errors.push('prePainScore must be a number between 1 and 10.');
  }

  if (typeof input.postPainScore !== 'number' || input.postPainScore < 1 || input.postPainScore > 10) {
    errors.push('postPainScore must be a number between 1 and 10.');
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const reliefDelta = input.prePainScore - input.postPainScore;
  const chromaPath = process.env.RUMBLE_CHROMA_PATH || './data/chroma';
  const routineTitle = input.routineTitle || input.routineId;

  const record: ChromaPreferenceRecord = {
    id: `chroma_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    routineId: input.routineId,
    routineTitle,
    prePainScore: input.prePainScore,
    postPainScore: input.postPainScore,
    reliefDelta,
    timestamp: new Date().toISOString(),
    notes: input.notes?.trim(),
    chromaPath,
  };

  chromaPreferenceStore.push(record);
  persistToChromaStoreFile(record);

  // Generate Sunday Briefing Rule based on relief delta
  if (reliefDelta >= 2) {
    addOrUpdateRule({
      routineId: input.routineId,
      routineTitle,
      action: 'increase_frequency',
      recommendation: `Increase frequency of "${routineTitle}" (High relief delta: +${reliefDelta})`,
      reason: `Routine yielded a positive pain relief delta of ${reliefDelta} points.`,
    });
  } else if (reliefDelta <= 0) {
    addOrUpdateRule({
      routineId: input.routineId,
      routineTitle,
      action: 'reduce_intensity',
      recommendation: `Reduce intensity or modify "${routineTitle}" (No relief delta: ${reliefDelta})`,
      reason: `Routine resulted in no pain reduction (delta: ${reliefDelta}).`,
    });
  }

  return { success: true, record };
}

export function getChromaPreferenceStore(): ChromaPreferenceRecord[] {
  return [...chromaPreferenceStore];
}

/**
 * Dismisses a routine flow:
 * 1. Validates routineId and rejection reason.
 * 2. Records dismissal entry.
 * 3. Triggers Sunday briefing recalibration rule generation.
 */
export function dismissRoutine(input: RoutineDismissalInput): {
  success: boolean;
  entry?: RoutineDismissalEntry;
  errors?: string[];
} {
  const errors: string[] = [];

  if (!input.routineId || typeof input.routineId !== 'string' || !input.routineId.trim()) {
    errors.push('routineId is required.');
  }

  if (!input.reason || typeof input.reason !== 'string' || !input.reason.trim()) {
    errors.push('reason is required.');
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const routineTitle = input.routineTitle || input.routineId;

  const entry: RoutineDismissalEntry = {
    id: `dismiss_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    routineId: input.routineId,
    routineTitle,
    reason: input.reason.trim(),
    notes: input.notes?.trim(),
    timestamp: new Date().toISOString(),
  };

  routineDismissals.push(entry);

  // Generate Sunday Briefing Rule based on dismissal reason
  const reasonLower = input.reason.toLowerCase();
  if (reasonLower.includes('hurts') || reasonLower === 'hurts') {
    addOrUpdateRule({
      routineId: input.routineId,
      routineTitle,
      action: 'reduce_intensity',
      recommendation: `Reduce intensity or remove "${routineTitle}" due to pain during exercise`,
      reason: `Dismissed with reason: "${input.reason}"`,
    });
  } else if (reasonLower.includes('tired') || reasonLower === 'too tired') {
    addOrUpdateRule({
      routineId: input.routineId,
      routineTitle,
      action: 'change_schedule',
      recommendation: `Reschedule "${routineTitle}" to lower-fatigue time slot`,
      reason: `Dismissed with reason: "${input.reason}"`,
    });
  } else if (reasonLower.includes('inconvenient') || reasonLower === 'inconvenient') {
    addOrUpdateRule({
      routineId: input.routineId,
      routineTitle,
      action: 'change_schedule',
      recommendation: `Adjust duration or timing for "${routineTitle}"`,
      reason: `Dismissed with reason: "${input.reason}"`,
    });
  } else {
    addOrUpdateRule({
      routineId: input.routineId,
      routineTitle,
      action: 'remove',
      recommendation: `Review appropriateness of "${routineTitle}"`,
      reason: `Dismissed with reason: "${input.reason}"`,
    });
  }

  return { success: true, entry };
}

export function getRoutineDismissals(): RoutineDismissalEntry[] {
  return [...routineDismissals];
}

/**
 * Adds or updates a Sunday Briefing recalibration rule.
 */
function addOrUpdateRule(params: {
  routineId: string;
  routineTitle: string;
  action: ExerciseRecalibrationRule['action'];
  recommendation: string;
  reason: string;
}): void {
  const existingIdx = SundayBriefingRules.findIndex(
    (r) => r.routineId === params.routineId && r.action === params.action && r.status === 'pending'
  );

  if (existingIdx >= 0) {
    SundayBriefingRules[existingIdx].recommendation = params.recommendation;
    SundayBriefingRules[existingIdx].reason = params.reason;
  } else {
    const newRule: ExerciseRecalibrationRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      routineId: params.routineId,
      routineTitle: params.routineTitle,
      action: params.action,
      recommendation: params.recommendation,
      reason: params.reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    SundayBriefingRules.push(newRule);
  }
}

/**
 * Returns all learned exercise recalibration rules for Sunday briefing.
 */
export function getSundayBriefingRules(): ExerciseRecalibrationRule[] {
  return [...SundayBriefingRules];
}

/**
 * Explicitly approves or rejects a Sunday Briefing rule.
 */
export function updateSundayBriefingRule(
  ruleId: string,
  status: 'approved' | 'rejected'
): ExerciseRecalibrationRule | null {
  const rule = SundayBriefingRules.find((r) => r.id === ruleId);
  if (!rule) return null;
  rule.status = status;
  return { ...rule };
}

/**
 * Persists record to disk JSON store in chroma path directory if folder exists/is writable.
 */
function persistToChromaStoreFile(record: ChromaPreferenceRecord): void {
  try {
    const chromaDir = path.resolve(record.chromaPath);
    if (!fs.existsSync(chromaDir)) {
      fs.mkdirSync(chromaDir, { recursive: true });
    }
    const storePath = path.join(chromaDir, 'preferences.json');
    let existing: ChromaPreferenceRecord[] = [];
    if (fs.existsSync(storePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      } catch {
        existing = [];
      }
    }
    existing.push(record);
    fs.writeFileSync(storePath, JSON.stringify(existing, null, 2), 'utf8');
  } catch (err) {
    // Graceful fallback if filesystem access fails
    console.warn('[ChromaDB Store Warning] Could not write to disk:', err);
  }
}
