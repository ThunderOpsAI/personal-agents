import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET as getPainAnalytics } from '../app/api/v1/pain/analytics/route';
import * as dbModule from '../lib/db';

describe('Pain Analytics Period Breakdown Engine (Day, Week, Month, All Time)', () => {
  const now = new Date();
  const mockLogs = [
    {
      id: 'log-1',
      score: 7.5,
      locations: [
        { area: 'lumbar', side: 'right', percentage: 75 },
        { area: 'cervical', side: 'unspecified', percentage: 25 },
      ],
      mood: 'Calm',
      notes: 'Morning stiffness after rest',
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago (Today)
    },
    {
      id: 'log-2',
      score: 6.0,
      locations: [
        { area: 'lumbar', side: 'right', percentage: 50 },
        { area: 'ankle', side: 'right', percentage: 50 },
      ],
      mood: 'Good',
      notes: 'Post-hydrotherapy relief',
      created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago (Today)
    },
    {
      id: 'log-3',
      score: 8.5,
      locations: [
        { area: 'lumbar', side: 'right', percentage: 80 },
        { area: 'thoracic', side: 'unspecified', percentage: 20 },
      ],
      mood: 'Flare',
      notes: 'High desk strain',
      created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago (Week)
    },
    {
      id: 'log-4',
      score: 5.0,
      locations: [
        { area: 'cervical', side: 'unspecified', percentage: 100 },
      ],
      mood: 'Calm',
      notes: 'Gentle mobility exercises',
      created_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago (Month)
    },
    {
      id: 'log-5',
      score: 9.0,
      locations: [
        { area: 'lumbar', side: 'right', percentage: 90 },
      ],
      mood: 'Flare',
      notes: 'Severe spasm',
      created_at: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago (All time only)
    },
  ];

  beforeEach(() => {
    vi.spyOn(dbModule, 'getPainLogsFromDb').mockResolvedValue(mockLogs as any);
  });

  it('1. Day Breakdown: filters to current day logs with intra-day trajectory', async () => {
    const req = new Request('http://localhost:3000/api/v1/pain/analytics?period=day');
    const res = await getPainAnalytics(req);
    const data = await res.json();

    expect(data.status).toBe('success');
    expect(data.period).toBe('day');
    expect(data.total_logs).toBe(2);
    expect(data.average_score).toBe(6.8); // (7.5 + 6.0) / 2 = 6.75 -> 6.8
    expect(data.min_score).toBe(6.0);
    expect(data.max_score).toBe(7.5);
    expect(data.intra_day_trends.length).toBe(2);
    expect(data.anatomical_distribution['Right Lumbar']).toBeGreaterThan(0);
  });

  it('2. Week Breakdown: aggregates logs from past 7 days including current day', async () => {
    const req = new Request('http://localhost:3000/api/v1/pain/analytics?period=week');
    const res = await getPainAnalytics(req);
    const data = await res.json();

    expect(data.status).toBe('success');
    expect(data.period).toBe('week');
    expect(data.total_logs).toBe(3); // log-1, log-2, log-3
    expect(data.min_score).toBe(6.0);
    expect(data.max_score).toBe(8.5);
    expect(data.daily_trends.length).toBeGreaterThanOrEqual(2);
  });

  it('3. Month Breakdown: aggregates logs from past 30 days', async () => {
    const req = new Request('http://localhost:3000/api/v1/pain/analytics?period=month');
    const res = await getPainAnalytics(req);
    const data = await res.json();

    expect(data.status).toBe('success');
    expect(data.period).toBe('month');
    expect(data.total_logs).toBe(4); // log-1, log-2, log-3, log-4
    expect(data.min_score).toBe(5.0);
    expect(data.max_score).toBe(8.5);
  });

  it('4. All-Time Breakdown: aggregates all historical logs', async () => {
    const req = new Request('http://localhost:3000/api/v1/pain/analytics?period=all');
    const res = await getPainAnalytics(req);
    const data = await res.json();

    expect(data.status).toBe('success');
    expect(data.period).toBe('all');
    expect(data.total_logs).toBe(5);
    expect(data.min_score).toBe(5.0);
    expect(data.max_score).toBe(9.0);
  });
});
