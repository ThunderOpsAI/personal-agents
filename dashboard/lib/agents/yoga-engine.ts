import { getPainLogsFromDb, createAgendaItem, getExercisePreferences } from '../db';
import { MEDICAL_GUARDRAIL } from './intent-router';
import { EXERCISE_DATABASE, ExerciseItem, ExerciseStep } from '../exercise-db';
import { getRoutineDismissals } from '../rehab-learning';

export type YogaRoutine = ExerciseItem;

export interface ScoredYogaRoutine extends YogaRoutine {
  score?: number;
  selection_reason?: string;
  adapted?: boolean;
  adapted_poses?: number;
}

export const YOGA_ROUTINE_DB: YogaRoutine[] = EXERCISE_DATABASE;

// Daily cache for locked routines
interface DailyLockedYoga {
  datePrefix: string;
  lockedAt: string;
  routines: ScoredYogaRoutine[];
  baselinePainScore: number;
}

let lockedDailyCache: DailyLockedYoga | null = null;

export function clearLockedYogaCache(): void {
  lockedDailyCache = null;
}

/**
 * Adapts individual contraindicated poses/steps inside a routine.
 * Returns new steps array, count of adapted poses, and adaptation note.
 */
export function adaptRoutinePoses(
  routine: YogaRoutine,
  activePainAreas: string[],
  maxPainScore: number
): { steps: ExerciseStep[]; adaptedCount: number; adaptationNote?: string } {
  let adaptedCount = 0;
  const newSteps: ExerciseStep[] = [];

  const isSevereLumbar = activePainAreas.includes("lumbar") || activePainAreas.includes("lower back") || activePainAreas.includes("sciatic");
  const isCervical = activePainAreas.includes("cervical") || activePainAreas.includes("neck");

  for (const step of routine.steps) {
    const stepTitle = step.title.toLowerCase();
    const cue = (step.cue || "").toLowerCase();

    // Lumbar acute contraindications: deep forward bends, unsupported twists, heavy bridge arches, planks
    const isLumbarContraindicated =
      stepTitle.includes("forward fold") ||
      stepTitle.includes("deep twist") ||
      stepTitle.includes("full bridge") ||
      cue.includes("deep fold") ||
      cue.includes("twist deeply") ||
      (maxPainScore >= 7 && (stepTitle.includes("fold") || stepTitle.includes("plank")));

    if (isSevereLumbar && isLumbarContraindicated) {
      newSteps.push({
        title: "Supported Child's Pose Decompression (Adapted)",
        duration: step.duration || 120,
        cue: "Gentle restorative decompression: knees wide, torso resting forward on bolster, completely relaxing lumbar spine.",
        frames: ["/exercises/supported_childs_pose.jpg"],
      });
      adaptedCount++;
      continue;
    }

    // Cervical acute contraindications: heavy neck extension or shoulder stands
    if (isCervical && (stepTitle.includes("neck extension") || stepTitle.includes("shoulder stand") || stepTitle.includes("plow"))) {
      newSteps.push({
        title: "Seated Axial Retraction - Chin Tuck (Adapted)",
        duration: step.duration || 120,
        cue: "Safe cervical lengthening: gently draw chin straight backwards, avoiding any neck extension.",
        frames: ["/exercises/cervical_chin_tuck.jpg"],
      });
      adaptedCount++;
      continue;
    }

    newSteps.push({ ...step });
  }

  const adaptationNote = adaptedCount > 0 ? `${adaptedCount} pose${adaptedCount > 1 ? "s" : ""} adapted for safety` : undefined;
  return { steps: newSteps, adaptedCount, adaptationNote };
}

/**
 * Scores a routine based on:
 * (a) Last 24h pain generators & severity score
 * (b) Historical pre/post relief deltas from exercise_preferences
 * (c) Dismissal history (Hurts, Too tired)
 * (d) Hard surgical guardrails (C5-C7 ACDF, Right L4-S1 radiculopathy)
 */
export function scoreRoutine(
  routine: YogaRoutine,
  context: {
    activePainAreas: string[];
    maxPainScore: number;
    reliefMap: Map<string, number>;
    dismissalCounts: Map<string, { hurts: number; tired: number }>;
  }
): { score: number; reason: string; adaptedRoutine: ScoredYogaRoutine } {
  let score = 50; // base score
  const reasons: string[] = [];

  const focusLower = (routine.focus_areas || []).map(f => f.toLowerCase());
  const routineCat = (routine.category || "").toLowerCase();

  // 1. Pain match & severity weighting
  const matchesPainArea = context.activePainAreas.some(area => focusLower.some(f => f.includes(area) || area.includes(f)));
  if (matchesPainArea) {
    score += 35;
    reasons.push(`Targeted for ${context.activePainAreas.join(", ")}`);
  }

  // Severe pain (>=7/10): Force gentle restorative, supine decompression, or hydrotherapy
  if (context.maxPainScore >= 7) {
    if (routine.intensity?.toLowerCase().includes("gentle") || routine.intensity?.toLowerCase().includes("restorative") || routineCat === "hydrotherapy") {
      score += 40;
      reasons.push("Gentle decompression priority (Score >= 7)");
    } else {
      score -= 50; // Penalize active/strenuous flows during acute flare
    }
  }

  // 2. Historical relief deltas from exercise_preferences
  const avgRelief = context.reliefMap.get(routine.id) || context.reliefMap.get(routine.title) || 0;
  if (avgRelief > 0) {
    score += Math.round(avgRelief * 15);
    reasons.push(`Avg relief: -${avgRelief.toFixed(1)} pts`);
  }

  // 3. Dismissal penalties
  const dismissals = context.dismissalCounts.get(routine.id) || { hurts: 0, tired: 0 };
  if (dismissals.hurts > 0) {
    score -= dismissals.hurts * 25;
  }
  if (dismissals.tired > 0) {
    score -= dismissals.tired * 10;
  }

  // 4. Hard surgical guardrails
  // C5-C7 ACDF: no neck hyperextension
  if (routine.contraindications?.some(c => c.toLowerCase().includes("cervical") || c.toLowerCase().includes("whiplash"))) {
    score -= 80;
  }
  // Right L4-S1 radiculopathy: no unsupported high impact
  if (routine.contraindications?.some(c => c.toLowerCase().includes("acute disc") || c.toLowerCase().includes("radiculopathy"))) {
    score -= 60;
  }

  // 5. Adapt contraindicated poses
  const { steps, adaptedCount } = adaptRoutinePoses(routine, context.activePainAreas, context.maxPainScore);
  const adaptedRoutine: ScoredYogaRoutine = {
    ...routine,
    steps,
    adapted: adaptedCount > 0,
    adapted_poses: adaptedCount,
  };

  if (adaptedCount > 0) {
    reasons.push(`${adaptedCount} pose${adaptedCount > 1 ? "s" : ""} adapted`);
  }

  const badgeReason = reasons.length > 0 ? reasons.join(" • ") : "Restorative spine balance";
  adaptedRoutine.selection_reason = badgeReason;
  adaptedRoutine.score = score;

  return { score, reason: badgeReason, adaptedRoutine };
}

/**
 * Returns suggested yoga routines scored dynamically and locked in by 07:00 AM.
 * Dynamically re-evaluates if a new intraday pain flare is recorded.
 */
export async function getSuggestedYogaRoutines(options?: { forceRefresh?: boolean; datePrefix?: string }): Promise<ScoredYogaRoutine[]> {
  const now = new Date();
  const datePrefix = options?.datePrefix || now.toISOString().split("T")[0];

  // Fetch recent pain logs (last 24h)
  const logs = await getPainLogsFromDb().catch(() => []);
  const nowMs = now.getTime();
  const last24hLogs = logs.filter((l: any) => nowMs - new Date(l.created_at).getTime() <= 24 * 60 * 60 * 1000);
  
  const activePainAreas: string[] = [];
  let maxPainScore = 5;
  let latestIntradayPainScore = 0;

  if (last24hLogs.length > 0) {
    for (const l of last24hLogs) {
      if (l.score > maxPainScore) maxPainScore = l.score;
      if (Array.isArray(l.locations)) {
        for (const loc of l.locations) {
          if (loc.area && !activePainAreas.includes(loc.area.toLowerCase())) {
            activePainAreas.push(loc.area.toLowerCase());
          }
        }
      }
    }
    latestIntradayPainScore = last24hLogs[0]?.score || 0;
  }

  // Check 07:00 AM lock-in cache
  const isIntradayFlare = latestIntradayPainScore >= 7 && lockedDailyCache && latestIntradayPainScore > lockedDailyCache.baselinePainScore;

  if (
    !options?.forceRefresh &&
    !isIntradayFlare &&
    lockedDailyCache &&
    lockedDailyCache.datePrefix === datePrefix
  ) {
    return lockedDailyCache.routines;
  }

  // Fetch historical relief preferences
  const prefs = await getExercisePreferences().catch(() => []);
  const reliefMap = new Map<string, number>();
  const reliefCounts = new Map<string, number>();
  for (const p of prefs) {
    const delta = p.pre_pain_score - p.post_pain_score;
    const key = p.routine_id;
    reliefMap.set(key, (reliefMap.get(key) || 0) + delta);
    reliefCounts.set(key, (reliefCounts.get(key) || 0) + 1);
  }
  for (const [key, total] of reliefMap.entries()) {
    const count = reliefCounts.get(key) || 1;
    reliefMap.set(key, total / count);
  }

  // Fetch dismissals
  const dismissals = getRoutineDismissals();
  const dismissalCounts = new Map<string, { hurts: number; tired: number }>();
  for (const d of dismissals) {
    const cur = dismissalCounts.get(d.routineId) || { hurts: 0, tired: 0 };
    if (d.reason.toLowerCase().includes("hurt")) cur.hurts += 1;
    if (d.reason.toLowerCase().includes("tired")) cur.tired += 1;
    dismissalCounts.set(d.routineId, cur);
  }

  // Score all available routines
  const scoredRoutines = YOGA_ROUTINE_DB.map((routine) => {
    return scoreRoutine(routine, {
      activePainAreas: activePainAreas.length > 0 ? activePainAreas : ["lumbar"],
      maxPainScore,
      reliefMap,
      dismissalCounts,
    }).adaptedRoutine;
  });

  // Sort descending by score
  scoredRoutines.sort((a, b) => (b.score || 0) - (a.score || 0));
  const top3 = scoredRoutines.slice(0, 3);

  // Lock in to daily cache
  lockedDailyCache = {
    datePrefix,
    lockedAt: now.toISOString(),
    routines: top3,
    baselinePainScore: maxPainScore,
  };

  return top3;
}

export async function runMorningYogaEngine() {
  console.log("[Yoga Engine] Running morning synthesis (07:00 AM Lock-in)...");
  const routines = await getSuggestedYogaRoutines({ forceRefresh: true });
  await injectRoutinesToAgenda(routines);
}

async function injectRoutinesToAgenda(routines: ScoredYogaRoutine[]) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const scheduledTime = `${year}-${month}-${day}T09:00:00+10:00`;

  for (const r of routines) {
    const reasonSuffix = r.selection_reason ? ` • ${r.selection_reason}` : '';
    await createAgendaItem({
      item_type: "task",
      title: `Yoga Option: ${r.title} (${r.duration_minutes}m)${reasonSuffix}`,
      scheduled_time: scheduledTime,
      status: "pending",
    });
  }
}
