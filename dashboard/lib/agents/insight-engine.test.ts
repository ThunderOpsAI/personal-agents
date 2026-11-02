import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateCrossDomainInsights,
  approveInsightToBrain,
} from './insight-engine';
import {
  createPainLog,
  saveExercisePreference,
  getSoulLearnedRules,
  createAgendaItem,
  getAgendaItems,
} from '../db';
import { resetInMemorySemanticMemories } from '../semantic-memory';

describe('Evidence-Backed Insight Engine (dashboard/lib/agents/insight-engine.ts)', () => {
  beforeEach(() => {
    resetInMemorySemanticMemories();
  });

  describe('1. Cross-Domain Pattern Detection (generateCrossDomainInsights)', () => {
    it('detects significant rehab relief pattern and classifies as [REHAB RULE]', async () => {
      // Seed two completed rehab sessions with significant pain drops
      await saveExercisePreference({
        routineId: 'hydro_core_soak',
        routineTitle: 'Hydrotherapy Core Decompression',
        prePainScore: 8,
        postPainScore: 5,
        reliefDelta: 3,
      });
      await saveExercisePreference({
        routineId: 'hydro_core_soak',
        routineTitle: 'Hydrotherapy Core Decompression',
        prePainScore: 7,
        postPainScore: 5,
        reliefDelta: 2,
      });

      const insights = await generateCrossDomainInsights();
      const rehabInsight = insights.find(i => i.category === 'REHAB RULE' && i.insight_text.includes('Hydrotherapy Core Decompression'));

      expect(rehabInsight).toBeDefined();
      expect(rehabInsight?.category).toBe('REHAB RULE');
      expect(rehabInsight?.evidence).toContain('-2.5');
      expect(rehabInsight?.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('detects severe pain clustering and classifies as [PAIN TRIGGER]', async () => {
      await createPainLog({
        score: 8,
        locations: [{ area: 'lumbar', percentage: 100, weight: 100 }],
        notes: 'Severe spasm after driving',
      });
      await createPainLog({
        score: 7,
        locations: [{ area: 'lumbar', percentage: 100, weight: 100 }],
        notes: 'Radiating pain down right leg',
      });
      await createPainLog({
        score: 8,
        locations: [{ area: 'lumbar', percentage: 100, weight: 100 }],
        notes: 'Lumbar flare in evening',
      });

      const insights = await generateCrossDomainInsights();
      const triggerInsight = insights.find(i => i.category === 'PAIN TRIGGER');

      expect(triggerInsight).toBeDefined();
      expect(triggerInsight?.category).toBe('PAIN TRIGGER');
      expect(triggerInsight?.evidence).toContain('severe flares');
    });
  });

  describe('2. Approve to Brain Persistence Loop (approveInsightToBrain)', () => {
    it('persists approved insight rule to SOUL.md, indexes to semantic memory, and completes agenda item', async () => {
      const agendaItem = await createAgendaItem({
        item_type: 'insight',
        title: '[REHAB RULE] Hydrotherapy sessions after 14:00 correlate with lowest evening spasm rate',
        scheduled_time: new Date().toISOString(),
        status: 'pending',
      });

      const result = await approveInsightToBrain(agendaItem.id, 'REHAB RULE');

      expect(result.success).toBe(true);
      expect(result.ruleId).toBeDefined();
      expect(result.persistedTo).toContain('SOUL.md');
      expect(result.persistedTo).toContain('semantic_memories');

      // Verify rule was added to SOUL rules
      const rules = await getSoulLearnedRules();
      const matchedRule = rules.find(r => r.includes('Hydrotherapy sessions after 14:00'));
      expect(matchedRule).toBeDefined();

      // Verify agenda item is marked completed
      const items = await getAgendaItems();
      const updatedAgenda = items.find(i => i.id === agendaItem.id);
      expect(updatedAgenda?.status).toBe('completed');
    });

    it('approves a raw text rule directly', async () => {
      const text = 'Walking for 10 minutes every 2 hours prevents lumbar stiffness';
      const result = await approveInsightToBrain(text, 'SCHEDULE HABIT');

      expect(result.success).toBe(true);
      expect(result.ruleId).toBeDefined();

      const rules = await getSoulLearnedRules();
      expect(rules.some(r => r.includes(text))).toBe(true);
    });
  });
});
