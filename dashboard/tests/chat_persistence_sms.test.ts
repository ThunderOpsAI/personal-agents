import { describe, it, expect, vi, beforeEach } from 'vitest';
import { savePendingAction, getPendingAction, resolvePendingAction } from '../lib/db';
import { POST as sendSmsPost } from '../app/api/v1/sms/send/route';

describe('Chat Persistence & SMS Integration', () => {
  it('saves, retrieves, and resolves pending chat actions', async () => {
    const previewData = {
      type: 'budget_item',
      data: { description: 'Bandages', amount: 15.5, category: 'Medical' }
    };

    const saved = await savePendingAction(previewData);
    expect(saved).toBeDefined();
    expect(saved.id).toBeDefined();
    expect(saved.action_data).toEqual(previewData);
    expect(saved.resolved_at).toBeNull();

    const pending = await getPendingAction();
    expect(pending).not.toBeNull();
    expect(pending!.id).toBe(saved.id);
    expect(pending!.action_data).toEqual(previewData);

    const resolved = await resolvePendingAction(saved.id);
    expect(resolved).toBe(true);

    const afterResolve = await getPendingAction();
    if (afterResolve) {
      expect(afterResolve.id).not.toBe(saved.id);
    }
  });

  it('POST /api/v1/sms/send validates required fields', async () => {
    // Missing phone number
    const req1 = new Request('http://localhost/api/v1/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'Hello' }),
    });
    const res1 = await sendSmsPost(req1);
    expect(res1.status).toBe(400);

    // Missing body
    const req2 = new Request('http://localhost/api/v1/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: '+61400000000' }),
    });
    const res2 = await sendSmsPost(req2);
    expect(res2.status).toBe(400);

    // Invalid phone number
    const req3 = new Request('http://localhost/api/v1/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: 'abc', body: 'Test' }),
    });
    const res3 = await sendSmsPost(req3);
    expect(res3.status).toBe(400);
  });
});
