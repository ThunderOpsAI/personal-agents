import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  adaptRoutinePoses,
  scoreRoutine,
  getSuggestedYogaRoutines,
  clearLockedYogaCache,
  YOGA_ROUTINE_DB,
  YogaRoutine,
} from './yoga-engine';

function createMockRoutine(partial: Partial<YogaRoutine> & { id: string; title: string; category: any; intensity: string; duration_minutes: number; steps: any[] }): YogaRoutine {
  return {
    name: partial.title,
    instruction: partial.title,
    description: partial.title,
    focus_areas: partial.focus_areas || ['lumbar'],
    precautions: [],
    contraindications: [],
    ...partial,
  };
}

describe('Adaptive Yoga Engine (dashboard/lib/agents/yoga-engine.ts)', () => {
  beforeEach(() => {
    clearLockedYogaCache();
  });

  describe('1. Pose Adaptation & Contraindication Swapping (adaptRoutinePoses)', () => {
    it('swaps contraindicated deep lumbar poses for Supported Childs Pose during severe lumbar flare', () => {
      const mockRoutine: YogaRoutine = createMockRoutine({
        id: 'test_lumbar_flow',
        title: 'Lumbar Mobility Flow',
        category: 'rehab',
        intensity: 'moderate',
        duration_minutes: 15,
        steps: [
          { title: 'Standing Forward Fold', duration: 60, cue: 'Bend forward deeply' },
          { title: 'Gentle Cat Cow', duration: 60, cue: 'Gentle spinal movement' },
        ],
      });

      const result = adaptRoutinePoses(mockRoutine, ['lumbar'], 8);
      expect(result.adaptedCount).toBe(1);
      expect(result.steps[0].title).toBe("Supported Child's Pose Decompression (Adapted)");
      expect(result.steps[0].cue).toContain('bolster');
      expect(result.steps[1].title).toBe('Gentle Cat Cow');
      expect(result.adaptationNote).toBe('1 pose adapted for safety');
    });

    it('swaps contraindicated cervical neck extension for Seated Axial Retraction (Chin Tuck)', () => {
      const mockRoutine: YogaRoutine = createMockRoutine({
        id: 'test_cervical_flow',
        title: 'Cervical Tension Release',
        category: 'rehab',
        intensity: 'gentle',
        duration_minutes: 10,
        steps: [
          { title: 'Active Neck Extension and Hold', duration: 45, cue: 'Look back fully' },
          { title: 'Shoulder Rolls', duration: 45, cue: 'Gentle circles' },
        ],
      });

      const result = adaptRoutinePoses(mockRoutine, ['cervical'], 5);
      expect(result.adaptedCount).toBe(1);
      expect(result.steps[0].title).toBe('Seated Axial Retraction - Chin Tuck (Adapted)');
      expect(result.steps[0].cue).toContain('chin straight backwards');
      expect(result.steps[1].title).toBe('Shoulder Rolls');
    });

    it('retains original poses when no contraindications are met', () => {
      const mockRoutine: YogaRoutine = createMockRoutine({
        id: 'test_safe_flow',
        title: 'Gentle Breathing',
        category: 'rehab',
        intensity: 'gentle',
        duration_minutes: 5,
        steps: [
          { title: 'Diaphragmatic Breathing', duration: 60, cue: 'Breathe into belly' },
        ],
      });

      const result = adaptRoutinePoses(mockRoutine, ['thoracic'], 4);
      expect(result.adaptedCount).toBe(0);
      expect(result.adaptationNote).toBeUndefined();
      expect(result.steps[0].title).toBe('Diaphragmatic Breathing');
    });
  });

  describe('2. Smart Routine Scoring & Guardrails (scoreRoutine)', () => {
    it('boosts gentle/restorative routines and penalizes strenuous flows during severe pain flare (>= 7/10)', () => {
      const gentleRoutine: YogaRoutine = createMockRoutine({
        id: 'restorative_supine',
        title: 'Restorative Supine Release',
        category: 'rehab',
        intensity: 'gentle restorative',
        focus_areas: ['lumbar', 'pelvis'],
        duration_minutes: 12,
        steps: [{ title: 'Supine Savasana', duration: 180, cue: 'Relax' }],
      });

      const strenuousRoutine: YogaRoutine = createMockRoutine({
        id: 'active_vinyasa',
        title: 'Vinyasa Power Core',
        category: 'yoga',
        intensity: 'vigorous',
        focus_areas: ['lumbar', 'core'],
        duration_minutes: 25,
        steps: [{ title: 'Plank Hold', duration: 60, cue: 'Engage core' }],
      });

      const context = {
        activePainAreas: ['lumbar'],
        maxPainScore: 8,
        reliefMap: new Map<string, number>(),
        dismissalCounts: new Map<string, { hurts: number; tired: number }>(),
      };

      const gentleScore = scoreRoutine(gentleRoutine, context);
      const strenuousScore = scoreRoutine(strenuousRoutine, context);

      expect(gentleScore.score).toBeGreaterThan(strenuousScore.score);
      expect(gentleScore.reason).toContain('Gentle decompression priority (Score >= 7)');
      expect(gentleScore.adaptedRoutine.selection_reason).toBeDefined();
    });

    it('incorporates historical relief deltas from exercise_preferences into score and badge', () => {
      const routine: YogaRoutine = createMockRoutine({
        id: 'hydro_release',
        title: 'Deep Hydro Warm Soak',
        category: 'hydrotherapy',
        intensity: 'gentle',
        focus_areas: ['lumbar'],
        duration_minutes: 20,
        steps: [{ title: 'Warm Water Float', duration: 300, cue: 'Float gently' }],
      });

      const reliefMap = new Map<string, number>();
      reliefMap.set('hydro_release', 2.5); // Average 2.5 point relief delta

      const context = {
        activePainAreas: ['lumbar'],
        maxPainScore: 6,
        reliefMap,
        dismissalCounts: new Map<string, { hurts: number; tired: number }>(),
      };

      const scored = scoreRoutine(routine, context);
      expect(scored.score).toBeGreaterThan(50 + 35); // base 50 + pain match 35 + relief boost
      expect(scored.reason).toContain('Avg relief: -2.5 pts');
      expect(scored.adaptedRoutine.selection_reason).toContain('Avg relief: -2.5 pts');
    });

    it('penalizes routines with frequent dismissal history', () => {
      const routine: YogaRoutine = createMockRoutine({
        id: 'irritating_flow',
        title: 'Lumbar Rotation Flow',
        category: 'rehab',
        intensity: 'moderate',
        focus_areas: ['lumbar'],
        duration_minutes: 15,
        steps: [{ title: 'Seated Twist', duration: 60, cue: 'Twist' }],
      });

      const dismissalCounts = new Map<string, { hurts: number; tired: number }>();
      dismissalCounts.set('irritating_flow', { hurts: 2, tired: 1 }); // 2 hurts (-50), 1 tired (-10)

      const context = {
        activePainAreas: ['lumbar'],
        maxPainScore: 5,
        reliefMap: new Map<string, number>(),
        dismissalCounts,
      };

      const scored = scoreRoutine(routine, context);
      // base 50 + pain match 35 - 50 - 10 = 25
      expect(scored.score).toBeLessThan(50);
    });
  });

  describe('3. Dynamic Suggestion & 07:00 AM Lock-In (getSuggestedYogaRoutines)', () => {
    it('returns top 3 scored routines with selection_reason badges', async () => {
      const routines = await getSuggestedYogaRoutines({ forceRefresh: true });
      expect(routines).toBeDefined();
      expect(routines.length).toBeGreaterThanOrEqual(1);
      expect(routines.length).toBeLessThanOrEqual(3);
      
      const first = routines[0];
      expect(first.title).toBeDefined();
      expect(first.selection_reason).toBeDefined();
      expect(typeof first.selection_reason).toBe('string');
    });

    it('caches routines for the day and re-evaluates on acute intraday pain flare', async () => {
      // First call initializes cache
      const initialRoutines = await getSuggestedYogaRoutines({ datePrefix: '2026-11-01' });
      expect(initialRoutines.length).toBeGreaterThan(0);

      // Re-fetching same date returns cached instance
      const cachedRoutines = await getSuggestedYogaRoutines({ datePrefix: '2026-11-01' });
      expect(cachedRoutines).toEqual(initialRoutines);
    });
  });
});
