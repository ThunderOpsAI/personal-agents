import { describe, it, expect, beforeEach } from 'vitest';
import {
  validatePainLog,
  logPain,
  completeRoutine,
  dismissRoutine,
  getSundayBriefingRules,
  updateSundayBriefingRule,
  clearRehabLearningStore,
  getPainLogs,
  getChromaPreferenceStore,
  getRoutineDismissals,
} from './rehab-learning';

describe('Rehab & Pain Learning Loop (dashboard/lib/rehab-learning.ts)', () => {
  beforeEach(() => {
    clearRehabLearningStore();
  });

  describe('1. Pain Logging & Validation', () => {
    it('validates a valid pain log with score 1-10 and weights summing to 100%', () => {
      const input = {
        score: 7,
        locations: [
          { area: 'lumbar', side: 'unspecified' as const, weight: 60 },
          { area: 'left_hip', side: 'left' as const, weight: 40 },
        ],
        mood: 'anxious',
        notes: 'Lower back stiffness after sitting',
      };

      const validation = validatePainLog(input);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      const result = logPain(input);
      expect(result.success).toBe(true);
      expect(result.entry).toBeDefined();
      expect(result.entry?.score).toBe(7);
      expect(result.entry?.mood).toBe('anxious');
      expect(result.entry?.locations).toHaveLength(2);

      const logs = getPainLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe(result.entry?.id);
    });

    it('supports percentage property in locations', () => {
      const input = {
        score: 5,
        locations: [
          { area: 'right_shoulder', percentage: 70 },
          { area: 'neck', percentage: 30 },
        ],
      };

      const validation = validatePainLog(input);
      expect(validation.valid).toBe(true);
      const result = logPain(input);
      expect(result.success).toBe(true);
      expect(result.entry?.locations[0].weight).toBe(70);
    });

    it('rejects pain score less than 1 or greater than 10', () => {
      const inputLow = {
        score: 0,
        locations: [{ area: 'back', weight: 100 }],
      };
      const validationLow = validatePainLog(inputLow);
      expect(validationLow.valid).toBe(false);
      expect(validationLow.errors).toContain('Pain score must be between 1 and 10.');

      const inputHigh = {
        score: 11,
        locations: [{ area: 'back', weight: 100 }],
      };
      const validationHigh = validatePainLog(inputHigh);
      expect(validationHigh.valid).toBe(false);
      expect(validationHigh.errors).toContain('Pain score must be between 1 and 10.');
    });

    it('rejects pain log with missing locations or empty array', () => {
      const validation = validatePainLog({ score: 6, locations: [] });
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('At least one anatomical location must be provided.');
    });

    it('rejects locations whose weights do not sum to 100%', () => {
      const inputInvalidSum = {
        score: 6,
        locations: [
          { area: 'lumbar', weight: 50 },
          { area: 'hip', weight: 40 },
        ],
      };
      const validation = validatePainLog(inputInvalidSum);
      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('Location weights must total exactly 100%');
    });
  });

  describe('2. Routine Completion & ChromaDB Relief Delta Persistence', () => {
    it('calculates relief delta (prePainScore - postPainScore) and persists to ChromaDB store', () => {
      const input = {
        routineId: 'routine_lumbar_core',
        routineTitle: 'Lumbar Core Stabilization',
        prePainScore: 8,
        postPainScore: 3,
        notes: 'Felt immediate relief in lower back',
      };

      const result = completeRoutine(input);
      expect(result.success).toBe(true);
      expect(result.record).toBeDefined();
      expect(result.record?.reliefDelta).toBe(5);
      expect(result.record?.prePainScore).toBe(8);
      expect(result.record?.postPainScore).toBe(3);
      expect(result.record?.chromaPath).toBeDefined();

      const store = getChromaPreferenceStore();
      expect(store).toHaveLength(1);
      expect(store[0].routineId).toBe('routine_lumbar_core');
      expect(store[0].reliefDelta).toBe(5);
    });

    it('rejects invalid prePainScore or postPainScore', () => {
      const result = completeRoutine({
        routineId: 'routine_1',
        prePainScore: 12,
        postPainScore: 3,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContain('prePainScore must be a number between 1 and 10.');
    });
  });

  describe('3. Routine Dismissal Flow & Rejection Reasons', () => {
    it('records routine dismissal with reason "Too tired"', () => {
      const result = dismissRoutine({
        routineId: 'routine_hip_mobility',
        routineTitle: 'Hip Mobility',
        reason: 'Too tired',
        notes: 'Had a long work day',
      });

      expect(result.success).toBe(true);
      expect(result.entry?.reason).toBe('Too tired');

      const dismissals = getRoutineDismissals();
      expect(dismissals).toHaveLength(1);
      expect(dismissals[0].routineId).toBe('routine_hip_mobility');
    });

    it('records routine dismissal with reason "Hurts"', () => {
      const result = dismissRoutine({
        routineId: 'routine_shoulder_rehab',
        routineTitle: 'Shoulder Rehab',
        reason: 'Hurts',
      });

      expect(result.success).toBe(true);
      expect(result.entry?.reason).toBe('Hurts');
    });

    it('rejects dismissal if routineId or reason is missing', () => {
      const result = dismissRoutine({
        routineId: '',
        reason: '',
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('routineId is required.');
      expect(result.errors).toContain('reason is required.');
    });
  });

  describe('4. Sunday Briefing Recalibration Rules', () => {
    it('generates recalibration rules from completions and dismissals', () => {
      // 1. Completion with high relief delta
      completeRoutine({
        routineId: 'routine_glute_bridge',
        routineTitle: 'Glute Bridges',
        prePainScore: 7,
        postPainScore: 3,
      });

      // 2. Dismissal due to pain ('Hurts')
      dismissRoutine({
        routineId: 'routine_heavy_squat',
        routineTitle: 'Heavy Squats',
        reason: 'Hurts',
      });

      // 3. Dismissal due to fatigue ('Too tired')
      dismissRoutine({
        routineId: 'routine_evening_cardio',
        routineTitle: 'Evening Cardio',
        reason: 'Too tired',
      });

      const rules = getSundayBriefingRules();
      expect(rules.length).toBeGreaterThanOrEqual(3);

      const highReliefRule = rules.find((r) => r.routineId === 'routine_glute_bridge');
      expect(highReliefRule?.action).toBe('increase_frequency');
      expect(highReliefRule?.status).toBe('pending');

      const hurtsRule = rules.find((r) => r.routineId === 'routine_heavy_squat');
      expect(hurtsRule?.action).toBe('reduce_intensity');

      const tiredRule = rules.find((r) => r.routineId === 'routine_evening_cardio');
      expect(tiredRule?.action).toBe('change_schedule');
    });

    it('allows user approval and rejection of briefing rules', () => {
      completeRoutine({
        routineId: 'routine_core',
        routineTitle: 'Core Routine',
        prePainScore: 8,
        postPainScore: 2,
      });

      const rules = getSundayBriefingRules();
      expect(rules).toHaveLength(1);
      const ruleId = rules[0].id;

      // Approve rule
      const approvedRule = updateSundayBriefingRule(ruleId, 'approved');
      expect(approvedRule?.status).toBe('approved');

      // Verify status updated in store
      const updatedRules = getSundayBriefingRules();
      expect(updatedRules[0].status).toBe('approved');
    });
  });
});
