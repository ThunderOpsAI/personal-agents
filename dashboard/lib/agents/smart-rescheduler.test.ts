import { describe, it, expect, beforeEach } from 'vitest';
import {
  proposeFlareTriage,
  executeFlareTriage,
  proposeReschedule,
} from './smart-rescheduler';
import { createAgendaItem, getAgendaItems } from '../db';

describe('Proactive Autonomy & Low-Spoon Flare Triage (smart-rescheduler.ts)', () => {
  beforeEach(async () => {
    // Setup initial agenda items
    await createAgendaItem({
      id: 'task_quote_stickeroo',
      item_type: 'task',
      title: 'Reply to Reggie at Stickeroo with exact sticker dimensions',
      scheduled_time: '2026-11-01T15:30:00+11:00',
      status: 'pending',
    });
    await createAgendaItem({
      id: 'protocol_hydrotherapy',
      item_type: 'hydrotherapy',
      title: 'Hydrotherapy Pool Session (3 of 3)',
      scheduled_time: '2026-11-01T11:00:00+11:00',
      status: 'pending',
    });
    await createAgendaItem({
      id: 'task_student_connect',
      item_type: 'task',
      title: 'Verify S306 Computer Science minor selection in Deakin StudentConnect',
      scheduled_time: '2026-11-01T14:30:00+11:00',
      status: 'pending',
    });
  });

  it('1. Returns standard baseline when pain score < 7', async () => {
    const proposal = await proposeFlareTriage(5, ['lumbar'], { baseDate: '2026-11-01T08:00:00+11:00' });
    expect(proposal.isSevereFlare).toBe(false);
    expect(proposal.recommendedMode).toBe('Standard Mode');
    expect(proposal.deferredTasks).toHaveLength(0);
  });

  it('2. Low-Spoon Mode: triggers on pain >= 7 and proposes deferral of non-urgent tasks while protecting hydrotherapy', async () => {
    const proposal = await proposeFlareTriage(8, ['lumbar'], { baseDate: '2026-11-01T08:00:00+11:00' });
    
    expect(proposal.isSevereFlare).toBe(true);
    expect(proposal.recommendedMode).toBe('Low-Spoon Mode');
    expect(proposal.adaptedYogaRoutine).toContain('Supine Restorative');

    // Hydrotherapy must be protected
    expect(proposal.protectedProtocols.some(p => p.includes('Hydrotherapy'))).toBe(true);

    // Administrative tasks should be proposed for deferral
    expect(proposal.deferredTasks.length).toBeGreaterThanOrEqual(1);
    const deferredTitles = proposal.deferredTasks.map(t => t.taskTitle);
    expect(deferredTitles.some(t => t.includes('Stickeroo') || t.includes('StudentConnect'))).toBe(true);
  });

  it('3. Executes Flare Triage: reschedules deferred tasks in DB and creates Agenda Alert', async () => {
    const proposal = await proposeFlareTriage(8, ['lumbar'], { baseDate: '2026-11-01T08:00:00+11:00' });
    const result = await executeFlareTriage(proposal);

    expect(result.success).toBe(true);
    expect(result.rescheduledCount).toBeGreaterThan(0);
    expect(result.alertId).toBeDefined();

    // Verify alert item exists in DB
    const allItems = await getAgendaItems();
    const alertItem = allItems.find(i => i.id === result.alertId);
    expect(alertItem).toBeDefined();
    expect(alertItem?.item_type).toBe('alert');
    expect(alertItem?.title).toContain('Low-Spoon Flare Triage');
  });

  it('4. proposeReschedule: identifies task conflicts against busy calendar slots', async () => {
    const tasks = [
      {
        id: 'task_conflicted',
        title: 'Review medical invoices',
        scheduled_time: '2026-11-01T10:00:00+11:00',
      },
    ];
    const schedule = [
      {
        title: 'Doctor Specialist Consult',
        start: '2026-11-01T09:30:00+11:00',
        end: '2026-11-01T10:30:00+11:00',
      },
    ];

    const proposals = await proposeReschedule(tasks, schedule);
    expect(proposals).toHaveLength(1);
    expect(proposals[0].taskId).toBe('task_conflicted');
    expect(proposals[0].reason).toContain('Doctor Specialist Consult');
  });
});
