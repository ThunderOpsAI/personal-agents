import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateHydrotherapySessions,
  selectWashingDays,
  ensureStandingTasks,
} from './agenda-engine';
import { AgendaItem } from './schema';

describe('Agenda Engine (dashboard/lib/agenda-engine.ts)', () => {
  const baseDate = new Date('2026-08-11T10:00:00+10:00');

  describe('Rule 1: Hydrotherapy Schedule', () => {
    it('calculates 3 sessions when 0 sessions are completed this week (today, today+2, today+5)', () => {
      const sessions = calculateHydrotherapySessions(0, baseDate);
      expect(sessions).toHaveLength(3);
      expect(sessions[0]).toEqual({ date: '2026-08-11', offsetDays: 0 });
      expect(sessions[1]).toEqual({ date: '2026-08-13', offsetDays: 2 });
      expect(sessions[2]).toEqual({ date: '2026-08-16', offsetDays: 5 });
    });

    it('calculates 2 remaining sessions when 1 session is completed this week', () => {
      const sessions = calculateHydrotherapySessions(1, baseDate);
      expect(sessions).toHaveLength(2);
      expect(sessions[0]).toEqual({ date: '2026-08-13', offsetDays: 2 });
      expect(sessions[1]).toEqual({ date: '2026-08-16', offsetDays: 5 });
    });

    it('calculates 1 remaining session when 2 sessions are completed this week', () => {
      const sessions = calculateHydrotherapySessions(2, baseDate);
      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toEqual({ date: '2026-08-16', offsetDays: 5 });
    });

    it('returns 0 remaining sessions when 3 or more sessions are completed this week', () => {
      expect(calculateHydrotherapySessions(3, baseDate)).toEqual([]);
      expect(calculateHydrotherapySessions(4, baseDate)).toEqual([]);
    });

    it('handles negative completed count gracefully as 0', () => {
      const sessions = calculateHydrotherapySessions(-1, baseDate);
      expect(sessions).toHaveLength(3);
    });
  });

  describe('Rule 2: Washing Days Selection via Open-Meteo', () => {
    const mockOpenMeteoForecast = {
      daily: {
        time: [
          '2026-08-11',
          '2026-08-12',
          '2026-08-13',
          '2026-08-14',
          '2026-08-15',
          '2026-08-16',
          '2026-08-17',
        ],
        precipitation_probability_max: [45, 80, 10, 0, 95, 5, 60],
        temperature_2m_max: [15, 12, 16, 18, 11, 17, 14],
        temperature_2m_min: [5, 4, 6, 7, 3, 5, 4],
      },
    };

    it('selects exactly 2 days with the lowest precipitation probabilities', async () => {
      const result = await selectWashingDays(mockOpenMeteoForecast);
      expect(result.status).toBe('success');
      if ('days' in result && result.days) {
        expect(result.days).toHaveLength(2);
        // Lowest precipitation probabilities in mock are 0% (2026-08-14) and 5% (2026-08-16)
        expect(result.days[0].date).toBe('2026-08-14');
        expect(result.days[0].precipitationProbability).toBe(0);

        expect(result.days[1].date).toBe('2026-08-16');
        expect(result.days[1].precipitationProbability).toBe(5);
      }
    });

    it('supports array data structure for forecast input', async () => {
      const forecastArray = [
        { date: '2026-08-11', precipitation_probability: 50 },
        { date: '2026-08-12', precipitation_probability: 5 },
        { date: '2026-08-13', precipitation_probability: 20 },
        { date: '2026-08-14', precipitation_probability: 0 },
      ];

      const result = await selectWashingDays(forecastArray);
      expect(result.status).toBe('success');
      if ('days' in result && result.days) {
        expect(result.days).toHaveLength(2);
        expect(result.days[0].date).toBe('2026-08-14');
        expect(result.days[0].precipitationProbability).toBe(0);
        expect(result.days[1].date).toBe('2026-08-12');
        expect(result.days[1].precipitationProbability).toBe(5);
      }
    });

    it('fetches live forecast when no argument is passed and handles failure gracefully', async () => {
      const globalFetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response('Server Error', { status: 500 }));

      const result = await selectWashingDays();
      expect(result).toEqual({
        status: 'unavailable',
        error: 'Weather data service unavailable',
      });

      globalFetchSpy.mockRestore();
    });

    it('fetches live forecast successfully when fetch succeeds', async () => {
      const globalFetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockOpenMeteoForecast), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );

      const result = await selectWashingDays();
      expect(result.status).toBe('success');
      expect(globalFetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('api.open-meteo.com/v1/forecast')
      );

      globalFetchSpy.mockRestore();
    });
  });

  describe('Rule 3: Standing Task Maintenance', () => {
    const existingAgenda: AgendaItem[] = [
      {
        id: 'yoga_1',
        item_type: 'yoga',
        title: 'Morning Yoga',
        scheduled_time: '2026-08-11T09:00:00+10:00',
        status: 'completed',
        completed_at: '2026-08-11T09:30:00+10:00',
        dismissed_at: null,
        audit_trail: [],
        created_at: '2026-08-11T08:00:00+10:00',
      },
    ];

    it('auto-schedules "Call Deakin to unlock MFA" for tomorrow when missing', () => {
      const updatedAgenda = ensureStandingTasks(existingAgenda, baseDate);
      expect(updatedAgenda).toHaveLength(2);

      const deakinTask = updatedAgenda.find(
        (item) => item.title === 'Call Deakin to unlock MFA'
      );
      expect(deakinTask).toBeDefined();
      expect(deakinTask?.status).toBe('pending');
      expect(deakinTask?.scheduled_time).toBe('2026-08-12T09:00:00+10:00');
    });

    it('retains pending "Call Deakin to unlock MFA" if already in agenda', () => {
      const agendaWithPending: AgendaItem[] = [
        ...existingAgenda,
        {
          id: 'existing_deakin',
          item_type: 'task',
          title: 'Call Deakin to unlock MFA',
          scheduled_time: '2026-08-12T09:00:00+10:00',
          status: 'pending',
          completed_at: null,
          dismissed_at: null,
          audit_trail: [],
          created_at: '2026-08-11T08:00:00+10:00',
        },
      ];

      const updatedAgenda = ensureStandingTasks(agendaWithPending, baseDate);
      expect(updatedAgenda).toHaveLength(2);
      expect(updatedAgenda).toEqual(agendaWithPending);
    });

    it('does NOT re-add "Call Deakin to unlock MFA" if it was dismissed', () => {
      const agendaWithDismissed: AgendaItem[] = [
        ...existingAgenda,
        {
          id: 'existing_deakin_dismissed',
          item_type: 'task',
          title: 'Call Deakin to unlock MFA',
          scheduled_time: '2026-08-12T09:00:00+10:00',
          status: 'dismissed',
          completed_at: null,
          dismissed_at: '2026-08-11T11:00:00+10:00',
          audit_trail: [],
          created_at: '2026-08-11T08:00:00+10:00',
        },
      ];

      const updatedAgenda = ensureStandingTasks(agendaWithDismissed, baseDate);
      expect(updatedAgenda).toHaveLength(2);
      expect(updatedAgenda.find((i) => i.id === 'existing_deakin_dismissed')?.status).toBe(
        'dismissed'
      );
      // Ensure no second task was created
      const deakinTasks = updatedAgenda.filter(
        (i) => i.title === 'Call Deakin to unlock MFA'
      );
      expect(deakinTasks).toHaveLength(1);
    });
  });
});
