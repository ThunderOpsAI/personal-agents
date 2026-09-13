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

  it('classifies text message queries as CHECK_SMS', async () => {
    const { classifyIntent } = await import('../lib/agents/intent-router');
    expect(classifyIntent('check my texts')).toBe('CHECK_SMS');
    expect(classifyIntent('did I get any texts?')).toBe('CHECK_SMS');
    expect(classifyIntent('did you get any text msgs?')).toBe('CHECK_SMS');
    expect(classifyIntent('read my sms messages')).toBe('CHECK_SMS');
    expect(classifyIntent('any new texts')).toBe('CHECK_SMS');
    expect(classifyIntent('unread sms')).toBe('CHECK_SMS');
    expect(classifyIntent('who texted me')).toBe('CHECK_SMS');
    expect(classifyIntent('show my texts')).toBe('CHECK_SMS');
  });

  it('formats SMS summary and detects unresolved MacroDroid tags', async () => {
    const { createSmsMessage } = await import('../lib/db');
    const { formatSmsMessagesSummary } = await import('../lib/agents/intent-router');

    await createSmsMessage({
      sender: '+61402564325',
      body: '{sms_body}',
      received_at: new Date().toISOString(),
    });

    const summary = await formatSmsMessagesSummary(5);
    expect(summary).toContain('+61402564325');
    expect(summary).toContain('MacroDroid phone tag issue');
    expect(summary).toContain('[sms_message]');
  });

  it('routeChatMessage returns CHECK_SMS with text message content even with polluted refusal history', async () => {
    const { routeChatMessage } = await import('../lib/agents/intent-router');
    const pollutedHistory = [
      { role: 'user', text: 'Did I get any texts?' },
      { role: 'rumble', text: 'I do not have access to your text messages. My capabilities are limited to...' },
      { role: 'user', text: 'Can u read my texts' },
      { role: 'rumble', text: 'I cannot read the content of these messages directly.' },
    ];

    const result = await routeChatMessage('Did I get any texts?', pollutedHistory);
    expect(result.intent).toBe('CHECK_SMS');
    expect(result.reply).not.toContain('I do not have access to your text messages');
    expect(result.reply).toContain('+61402564325');
  });

  it('webhook accepts sms_number and sms_message fields from MacroDroid', async () => {
    const { POST } = await import('../app/api/v1/sms/webhook/route');
    const req = new Request('http://localhost/api/v1/sms/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sms_number: '+61499888777',
        sms_message: 'Hello from MacroDroid with correct tag',
        secret: 'macrodroidsecret88',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.status).toBe('success');
  });

  it('executeConfirmedAction supports send_sms', async () => {
    const { executeConfirmedAction } = await import('../lib/agents/intent-router');
    // Without Twilio env credentials set, it should safely catch and return failure message
    const res = await executeConfirmedAction({
      type: 'send_sms',
      data: { to: '+61400000000', body: 'Test message' },
    });
    expect(res.success).toBe(false);
    expect(res.message).toContain('Twilio credentials missing');
  });
});
