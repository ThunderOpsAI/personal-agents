import { NextRequest, NextResponse } from 'next/server';
import { TelegramUpdate, telegramBot } from '../../../../../lib/telegram/bot';
import { createPainLog, getPainLogsFromDb } from '../../../../../lib/db';
import { exportPainReportToMarkdown } from '../../../../../lib/agents/intent-router';
import { parseTelegramPainMessage, DEFAULT_PAIN_DISTRIBUTION } from '../../../../../lib/telegram/parser';

export async function POST(req: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error("TELEGRAM_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const receivedSecret = req.headers.get("x-telegram-bot-api-secret-token");
  if (receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: TelegramUpdate = await req.json();

    // 1. Handle Inline Button Callback Queries
    if (body.callback_query) {
      const cb = body.callback_query;
      const chatId = cb.message?.chat.id || cb.from.id;
      const data = cb.data || '';

      await telegramBot.answerCallbackQuery(cb.id, "Processing selection...").catch(() => {});

      if (data.startsWith('pain_preset:')) {
        const score = parseFloat(data.replace('pain_preset:', '')) || 7.5;
        const locations = [...DEFAULT_PAIN_DISTRIBUTION];

        await createPainLog({
          score,
          locations,
          mood: score >= 8 ? 'stressed' : score <= 5 ? 'good' : 'neutral',
          notes: 'Logged via Telegram preset (Baseline distribution)',
        });

        exportPainReportToMarkdown({
          score,
          locations,
          mood: score >= 8 ? 'stressed' : score <= 5 ? 'good' : 'neutral',
          notes: 'Logged via Telegram preset (Baseline distribution)',
        });

        const locSummary = locations
          .map(l => `• ${l.side && l.side !== 'unspecified' ? l.side.toUpperCase() + ' ' : ''}${l.area.toUpperCase()}: ${l.percentage}%`)
          .join('\n');

        await telegramBot.sendMessage(
          chatId,
          `✅ *Pain Log Recorded!*\n\n• *Score:* ${score}/10\n• *Distribution:*\n${locSummary}\n\n📝 _Baseline distribution applied._`,
          { parse_mode: 'Markdown' }
        );
      } else if (data.startsWith('pain_lumbar_flare:')) {
        const score = parseFloat(data.replace('pain_lumbar_flare:', '')) || 9.0;
        const locations = [
          { area: 'lumbar', side: 'right' as const, percentage: 85 },
          { area: 'neck', side: 'unspecified' as const, percentage: 10 },
          { area: 'ankle', side: 'right' as const, percentage: 2.5 },
          { area: 'ankle', side: 'left' as const, percentage: 2.5 },
        ];

        await createPainLog({
          score,
          locations,
          mood: 'stressed',
          notes: 'Logged via Telegram (Lumbar flare preset)',
        });

        exportPainReportToMarkdown({
          score,
          locations,
          mood: 'stressed',
          notes: 'Logged via Telegram (Lumbar flare preset)',
        });

        await telegramBot.sendMessage(
          chatId,
          `🚨 *High Pain Alert Recorded!*\n\n• *Score:* ${score}/10 (Severe Lumbar Flare)\n• *Distribution:*\n• RIGHT LUMBAR: 85%\n• NECK: 10%\n• ANKLES: 5%\n\n⚠️ _Agenda adjustments initiated._`,
          { parse_mode: 'Markdown' }
        );
      } else if (data.startsWith('pain_neck_focus:')) {
        const score = parseFloat(data.replace('pain_neck_focus:', '')) || 6.5;
        const locations = [
          { area: 'neck', side: 'unspecified' as const, percentage: 60 },
          { area: 'lumbar', side: 'right' as const, percentage: 30 },
          { area: 'ankle', side: 'right' as const, percentage: 5 },
          { area: 'ankle', side: 'left' as const, percentage: 5 },
        ];

        await createPainLog({
          score,
          locations,
          mood: 'neutral',
          notes: 'Logged via Telegram (Neck tension preset)',
        });

        exportPainReportToMarkdown({
          score,
          locations,
          mood: 'neutral',
          notes: 'Logged via Telegram (Neck tension preset)',
        });

        await telegramBot.sendMessage(
          chatId,
          `✅ *Pain Log Recorded!*\n\n• *Score:* ${score}/10 (Neck Tension Focus)\n• *Distribution:*\n• NECK: 60%\n• RIGHT LUMBAR: 30%\n• ANKLES: 10%`,
          { parse_mode: 'Markdown' }
        );
      } else if (data.startsWith('pain_ankle_focus:')) {
        const score = parseFloat(data.replace('pain_ankle_focus:', '')) || 7.0;
        const locations = [
          { area: 'ankle', side: 'right' as const, percentage: 40 },
          { area: 'ankle', side: 'left' as const, percentage: 35 },
          { area: 'lumbar', side: 'right' as const, percentage: 20 },
          { area: 'neck', side: 'unspecified' as const, percentage: 5 },
        ];

        await createPainLog({
          score,
          locations,
          mood: 'neutral',
          notes: 'Logged via Telegram (Ankle/gait strain preset)',
        });

        exportPainReportToMarkdown({
          score,
          locations,
          mood: 'neutral',
          notes: 'Logged via Telegram (Ankle/gait strain preset)',
        });

        await telegramBot.sendMessage(
          chatId,
          `✅ *Pain Log Recorded!*\n\n• *Score:* ${score}/10 (Ankle/Gait Strain)\n• *Distribution:*\n• RIGHT ANKLE: 40%\n• LEFT ANKLE: 35%\n• RIGHT LUMBAR: 20%\n• NECK: 5%`,
          { parse_mode: 'Markdown' }
        );
      } else if (data === 'pain_help') {
        const helpText = [
          "📋 *How to Log Pain with Custom Area & %:*",
          "",
          "You can reply with your exact pain score and anatomical percentages, such as:",
          "",
          "• `7.5 75% right lumbar 10% neck 5% right ankle 5% left ankle 5% thoracic`",
          "• `8.0 80% lumbar, 20% neck, notes: flare after driving`",
          "• `6.5 right lumbar 85%, neck 15%`",
          "• Or just send a single score (e.g. `7.5` or `7 1/2`) to apply your signature distribution.",
        ].join('\n');

        await telegramBot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
      }

      return NextResponse.json({ status: 'ok' });
    }

    // 2. Handle Text Messages
    if (body.message?.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text.trim();
      
      console.log(`Received message from ${chatId}: ${text}`);
      
      if (text === '/start' || text.toLowerCase() === 'help') {
        const welcome = [
          "👋 *Welcome to Rumble OS Telegram Bot!*",
          "",
          "I will notify you every 3 hours with interactive buttons to log your pain.",
          "",
          "👉 *Ways to respond:*",
          "1. Tap any inline button in the 3-hour check-in reminder.",
          "2. Reply with a score: `7.5` (uses your default 75% R-Lumbar, 10% Neck, 5% R-Ankle, 5% L-Ankle, 5% Thoracic).",
          "3. Reply with a full breakdown: `7.5 75% right lumbar 10% neck 5% right ankle 5% left ankle 5% mid-back`.",
          "4. Type `/summary` to view recent entries.",
        ].join('\n');

        await telegramBot.sendMessage(chatId, welcome, { parse_mode: 'Markdown' });
      } else if (text === '/summary' || text.toLowerCase() === 'summary') {
        const recentLogs = await getPainLogsFromDb();
        if (!recentLogs || recentLogs.length === 0) {
          await telegramBot.sendMessage(chatId, "No pain logs recorded yet.");
        } else {
          const top5 = recentLogs.slice(0, 5);
          const lines = top5.map((l: any) => {
            const locs = (l.locations || []).map((x: any) => `${x.side !== 'unspecified' ? x.side + ' ' : ''}${x.area} (${x.percentage}%)`).join(', ');
            return `• *${l.score}/10* on ${new Date(l.created_at).toLocaleDateString()} ${new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n  ${locs}`;
          });
          await telegramBot.sendMessage(chatId, `📊 *Recent Pain Logs:*\n\n${lines.join('\n\n')}`, { parse_mode: 'Markdown' });
        }
      } else {
        const parsed = parseTelegramPainMessage(text);
        if (parsed) {
          await createPainLog({
            score: parsed.score,
            locations: parsed.locations,
            mood: parsed.mood,
            notes: parsed.notes,
          });

          exportPainReportToMarkdown({
            score: parsed.score,
            locations: parsed.locations,
            mood: parsed.mood,
            notes: parsed.notes,
          });

          const locSummary = parsed.locations
            .map(l => `• ${l.side && l.side !== 'unspecified' ? l.side.toUpperCase() + ' ' : ''}${l.area.toUpperCase()}: ${l.percentage}%`)
            .join('\n');

          const responseText = [
            `✅ *Pain Log Recorded!*`,
            "",
            `• *Score:* ${parsed.score}/10`,
            `• *Distribution:*`,
            locSummary,
            parsed.notes ? `\n📝 *Notes:* ${parsed.notes}` : "",
          ].filter(Boolean).join('\n');

          await telegramBot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
        } else {
          await telegramBot.sendMessage(
            chatId,
            `I didn't quite catch that. To log pain, reply with your score (e.g. \`7.5\`) or full breakdown (e.g. \`7.5 75% right lumbar 10% neck 5% right ankle 5% left ankle 5% mid-back\`). Type \`/start\` for options.`,
            { parse_mode: 'Markdown' }
          );
        }
      }
    }
    
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

