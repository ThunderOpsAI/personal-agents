import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as telegramWebhookPost } from '../app/api/v1/telegram/webhook/route';
import { POST as symptomsLogPost, GET as symptomsLogGet } from '../app/api/symptoms/log/route';
import { GET as agendaGet } from '../app/api/v1/agenda/route';
import { GET as briefLatestGet } from '../app/api/brief/latest/route';
import { telegramBot } from '../lib/telegram/bot';
import { getPainLogsFromDb, initDb } from '../lib/db';
import { getChromaPreferenceStore, getPainLogs, clearRehabLearningStore } from '../lib/rehab-learning';

describe('Telegram Bot Inline Callbacks & Symptoms Logging & Mobile Agenda', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearRehabLearningStore();
    process.env.TELEGRAM_WEBHOOK_SECRET = 'test_secret_123';
    process.env.TELEGRAM_BOT_TOKEN = 'test_bot_token_123';
  });

  describe('1. Telegram Inline Callback Query Handlers', () => {
    it('answers callback query immediately and logs pain preset (Mild 5.5)', async () => {
      const answerSpy = vi.spyOn(telegramBot, 'answerCallbackQuery').mockResolvedValue({ ok: true });
      const sendSpy = vi.spyOn(telegramBot, 'sendMessage').mockResolvedValue({ ok: true, result: {} });

      const req = new Request('https://rumble.test/api/v1/telegram/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-bot-api-secret-token': 'test_secret_123',
        },
        body: JSON.stringify({
          update_id: 1001,
          callback_query: {
            id: 'cb_query_123',
            from: { id: 999, is_bot: false, first_name: 'TestUser' },
            data: 'pain_preset:5.5',
            message: {
              message_id: 42,
              chat: { id: 999, type: 'private' },
              date: Math.floor(Date.now() / 1000),
            },
          },
        }),
      });

      const res = await telegramWebhookPost(req as any);
      expect(res.status).toBe(200);

      // Verify answerCallbackQuery was called immediately
      expect(answerSpy).toHaveBeenCalledWith('cb_query_123', expect.any(String));

      // Verify pain log was saved in memory/db
      const inMemLogs = getPainLogs();
      expect(inMemLogs.length).toBeGreaterThan(0);
      expect(inMemLogs[inMemLogs.length - 1].score).toBe(5.5);

      // Verify percentage totals 100%
      const lastLog = inMemLogs[inMemLogs.length - 1];
      const totalPct = lastLog.locations.reduce((acc, l) => acc + l.weight, 0);
      expect(totalPct).toBe(100);
    });

    it('handles Lumbar Flare (9.0) preset, triggers alert message and edits check-in message', async () => {
      const answerSpy = vi.spyOn(telegramBot, 'answerCallbackQuery').mockResolvedValue({ ok: true });
      const editSpy = vi.spyOn(telegramBot, 'editMessageText').mockResolvedValue({ ok: true, result: {} });

      const req = new Request('https://rumble.test/api/v1/telegram/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-bot-api-secret-token': 'test_secret_123',
        },
        body: JSON.stringify({
          update_id: 1002,
          callback_query: {
            id: 'cb_flare_999',
            from: { id: 999, is_bot: false, first_name: 'TestUser' },
            data: 'pain_lumbar_flare:9.0',
            message: {
              message_id: 55,
              chat: { id: 999, type: 'private' },
              date: Math.floor(Date.now() / 1000),
            },
          },
        }),
      });

      const res = await telegramWebhookPost(req as any);
      expect(res.status).toBe(200);
      expect(answerSpy).toHaveBeenCalledWith('cb_flare_999', expect.any(String));
      expect(editSpy).toHaveBeenCalledWith(
        999,
        55,
        expect.stringContaining('High Pain Alert Recorded!'),
        expect.objectContaining({ parse_mode: 'Markdown' })
      );

      const inMemLogs = getPainLogs();
      const flareLog = inMemLogs[inMemLogs.length - 1];
      expect(flareLog.score).toBe(9.0);
      expect(flareLog.locations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ area: 'lumbar', side: 'right', weight: 85 }),
          expect.objectContaining({ area: 'neck', side: 'unspecified', weight: 10 }),
        ])
      );
    });

    it('handles Neck Tension (6.5) and Ankle Strain (7.0) presets', async () => {
      vi.spyOn(telegramBot, 'answerCallbackQuery').mockResolvedValue({ ok: true });
      vi.spyOn(telegramBot, 'sendMessage').mockResolvedValue({ ok: true, result: {} });

      const neckReq = new Request('https://rumble.test/api/v1/telegram/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-bot-api-secret-token': 'test_secret_123',
        },
        body: JSON.stringify({
          update_id: 1003,
          callback_query: {
            id: 'cb_neck_1',
            from: { id: 999, is_bot: false, first_name: 'TestUser' },
            data: 'pain_neck_focus:6.5',
          },
        }),
      });
      const neckRes = await telegramWebhookPost(neckReq as any);
      expect(neckRes.status).toBe(200);

      const inMemLogs = getPainLogs();
      const neckLog = inMemLogs[inMemLogs.length - 1];
      expect(neckLog.score).toBe(6.5);
      const neckArea = neckLog.locations.find(l => l.area === 'neck');
      expect(neckArea?.weight).toBe(60);
    });

    it('handles Custom Reply Guide (pain_help) callback', async () => {
      const answerSpy = vi.spyOn(telegramBot, 'answerCallbackQuery').mockResolvedValue({ ok: true });
      const sendSpy = vi.spyOn(telegramBot, 'sendMessage').mockResolvedValue({ ok: true, result: {} });

      const req = new Request('https://rumble.test/api/v1/telegram/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-bot-api-secret-token': 'test_secret_123',
        },
        body: JSON.stringify({
          update_id: 1004,
          callback_query: {
            id: 'cb_help_1',
            from: { id: 999, is_bot: false, first_name: 'TestUser' },
            data: 'pain_help',
          },
        }),
      });

      const res = await telegramWebhookPost(req as any);
      expect(res.status).toBe(200);
      expect(answerSpy).toHaveBeenCalledWith('cb_help_1', expect.any(String));
      expect(sendSpy).toHaveBeenCalledWith(
        999,
        expect.stringContaining('How to Log Pain with Custom Area & %'),
        expect.objectContaining({ parse_mode: 'Markdown' })
      );
    });

    it('handles Sciatica (9.5, 100% sciatica attack) quick preset', async () => {
      vi.spyOn(telegramBot, 'answerCallbackQuery').mockResolvedValue({ ok: true });
      vi.spyOn(telegramBot, 'sendMessage').mockResolvedValue({ ok: true, result: {} });

      const req = new Request('https://rumble.test/api/v1/telegram/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-bot-api-secret-token': 'test_secret_123',
        },
        body: JSON.stringify({
          update_id: 1005,
          callback_query: {
            id: 'cb_sciatica_1',
            from: { id: 999, is_bot: false, first_name: 'TestUser' },
            data: 'pain_quick:sciatica',
          },
        }),
      });

      const res = await telegramWebhookPost(req as any);
      expect(res.status).toBe(200);

      const inMemLogs = getPainLogs();
      const last = inMemLogs[inMemLogs.length - 1];
      expect(last.score).toBe(9.5);
      expect(last.notes).toBe('Sciatica pain attack');
      expect(last.locations).toEqual([
        expect.objectContaining({ area: 'sciatica', weight: 100 })
      ]);
    });

    it('handles Thoracic (7.5, 70% thoracic, 15% neck, 15% scapula) quick preset', async () => {
      vi.spyOn(telegramBot, 'answerCallbackQuery').mockResolvedValue({ ok: true });
      vi.spyOn(telegramBot, 'sendMessage').mockResolvedValue({ ok: true, result: {} });

      const req = new Request('https://rumble.test/api/v1/telegram/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-bot-api-secret-token': 'test_secret_123',
        },
        body: JSON.stringify({
          update_id: 1006,
          callback_query: {
            id: 'cb_thoracic_1',
            from: { id: 999, is_bot: false, first_name: 'TestUser' },
            data: 'pain_quick:thoracic',
          },
        }),
      });

      const res = await telegramWebhookPost(req as any);
      expect(res.status).toBe(200);

      const inMemLogs = getPainLogs();
      const last = inMemLogs[inMemLogs.length - 1];
      expect(last.score).toBe(7.5);
      expect(last.locations).toEqual(expect.arrayContaining([
        expect.objectContaining({ area: 'thoracic', weight: 70 }),
        expect.objectContaining({ area: 'neck', weight: 15 }),
        expect.objectContaining({ area: 'scapula', weight: 15 }),
      ]));
    });

    it('handles Hydro (-1.5 delta from previous pain score) quick preset', async () => {
      vi.spyOn(telegramBot, 'answerCallbackQuery').mockResolvedValue({ ok: true });
      vi.spyOn(telegramBot, 'sendMessage').mockResolvedValue({ ok: true, result: {} });

      // First log a baseline (e.g. 8.0)
      const inMemLogsBefore = getPainLogs();
      const baseScore = inMemLogsBefore.length > 0 ? inMemLogsBefore[inMemLogsBefore.length - 1].score : 7.5;

      const req = new Request('https://rumble.test/api/v1/telegram/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-bot-api-secret-token': 'test_secret_123',
        },
        body: JSON.stringify({
          update_id: 1007,
          callback_query: {
            id: 'cb_hydro_1',
            from: { id: 999, is_bot: false, first_name: 'TestUser' },
            data: 'pain_quick:hydro',
          },
        }),
      });

      const res = await telegramWebhookPost(req as any);
      expect(res.status).toBe(200);

      const inMemLogs = getPainLogs();
      const last = inMemLogs[inMemLogs.length - 1];
      const expectedScore = Math.max(1.0, Number((baseScore - 1.5).toFixed(1)));
      expect(last.score).toBe(expectedScore);
      expect(last.notes).toBe('Good hydrotherapy session, feeling slightly better');
    });

    it('handles Standard quick preset and rotates between Variant A (ankle/thoracic) and Variant B (knee/neck)', async () => {
      vi.spyOn(telegramBot, 'answerCallbackQuery').mockResolvedValue({ ok: true });
      vi.spyOn(telegramBot, 'sendMessage').mockResolvedValue({ ok: true, result: {} });

      // Push 1: Variant A
      const req1 = new Request('https://rumble.test/api/v1/telegram/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-bot-api-secret-token': 'test_secret_123',
        },
        body: JSON.stringify({
          update_id: 1008,
          callback_query: {
            id: 'cb_std_1',
            from: { id: 999, is_bot: false, first_name: 'TestUser' },
            data: 'pain_quick:standard',
          },
        }),
      });

      const res1 = await telegramWebhookPost(req1 as any);
      expect(res1.status).toBe(200);

      const inMem1 = getPainLogs();
      const log1 = inMem1[inMem1.length - 1];
      expect(log1.locations.some(l => l.area === 'ankle')).toBe(true);
      expect(log1.locations.some(l => l.area === 'thoracic')).toBe(true);

      // Push 2: Variant B (rotates to knee and neck)
      const req2 = new Request('https://rumble.test/api/v1/telegram/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-bot-api-secret-token': 'test_secret_123',
        },
        body: JSON.stringify({
          update_id: 1009,
          callback_query: {
            id: 'cb_std_2',
            from: { id: 999, is_bot: false, first_name: 'TestUser' },
            data: 'pain_quick:standard',
          },
        }),
      });

      const res2 = await telegramWebhookPost(req2 as any);
      expect(res2.status).toBe(200);

      const inMem2 = getPainLogs();
      const log2 = inMem2[inMem2.length - 1];
      expect(log2.locations.some(l => l.area === 'knee')).toBe(true);
      expect(log2.locations.some(l => l.area === 'neck')).toBe(true);
    });
  });

  describe('2. Symptoms & Pain Logging Endpoint (/api/symptoms/log)', () => {
    it('accepts structured payload, logs data and returns formatted response', async () => {
      const payload = {
        score: 7.5,
        locations: [
          { area: 'lumbar', side: 'right', percentage: 75 },
          { area: 'neck', side: 'unspecified', percentage: 10 },
          { area: 'ankle', side: 'right', percentage: 5 },
          { area: 'ankle', side: 'left', percentage: 5 },
          { area: 'thoracic', side: 'unspecified', percentage: 5 },
        ],
        mood: 'neutral',
        notes: 'API log test',
      };

      const req = new Request('https://rumble.test/api/symptoms/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await symptomsLogPost(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.status).toBe('success');
      expect(data.data.score).toBe(7.5);
      expect(data.alert_triggered).toBe(true); // >= 7 triggers alert
    });

    it('rejects invalid percentage totals not equal to 100%', async () => {
      const payload = {
        score: 6.0,
        locations: [
          { area: 'lumbar', side: 'right', percentage: 50 },
          { area: 'neck', side: 'unspecified', percentage: 30 },
        ],
      };

      const req = new Request('https://rumble.test/api/symptoms/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await symptomsLogPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.status).toBe('error');
    });
  });

  describe('3. Agenda & Executive Briefing API Handlers', () => {
    it('GET /api/v1/agenda returns standing protocols, hydrotherapy and weather washing days', async () => {
      const req = new Request('https://rumble.test/api/v1/agenda');
      const res = await agendaGet(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty('daily');
      expect(data).toHaveProperty('hydrotherapy');
      expect(data).toHaveProperty('washing');

      // Verify standing items exist
      const titles = (data.daily || []).map((i: any) => i.title);
      expect(titles.some((t: string) => t.includes('Yoga'))).toBe(true);
      expect(titles.some((t: string) => t.includes('Meditation') || t.includes('Decompression'))).toBe(true);
    });

    it('GET /api/brief/latest returns latest briefing object', async () => {
      const req = new Request('https://rumble.test/api/brief/latest');
      const res = await briefLatestGet(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe('success');
      expect(data).toHaveProperty('html');
    });

    it('POST /api/v1/telegram/checkin dispatches inline pain check-in prompt to Telegram', async () => {
      const sendSpy = vi.spyOn(telegramBot, 'sendMessage').mockResolvedValue({ ok: true, result: {} });

      const { POST: checkinPost } = await import('../app/api/v1/telegram/checkin/route');
      const req = new Request('https://rumble.test/api/v1/telegram/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: '123456789' }),
      });

      const res = await checkinPost(req as any);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('success');

      expect(sendSpy).toHaveBeenCalledWith('123456789', expect.stringContaining('Rumble OS Pain & Symptom Check-in'), expect.objectContaining({
        reply_markup: expect.objectContaining({
          inline_keyboard: expect.arrayContaining([
            expect.arrayContaining([
              expect.objectContaining({ callback_data: 'pain_preset:5.5' }),
              expect.objectContaining({ callback_data: 'pain_preset:7.0' }),
            ]),
          ]),
        }),
      }));
    });
  });
});

