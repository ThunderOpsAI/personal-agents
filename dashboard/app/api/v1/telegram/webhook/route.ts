import { NextRequest, NextResponse } from 'next/server';
import { TelegramUpdate, telegramBot } from '../../../../../lib/telegram/bot';
import { createPainLog } from '../../../../../lib/db';

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
    
    if (body.message?.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text.trim();
      
      console.log(`Received message from ${chatId}: ${text}`);
      
      if (text === '/start') {
        await telegramBot.sendMessage(chatId, "Welcome to Rumble OS Telegram Bot! I will remind you every 3 hours to log your pain. Just reply to my messages with your pain score (0-10) and any notes (e.g., '6 lower back hurts').");
      } else {
        // Attempt to parse a pain score at the start of the message
        const match = text.match(/^(\d{1,2})(?:\s+(.*))?$/i);
        if (match) {
          const score = Math.min(10, Math.max(0, parseInt(match[1], 10)));
          const notes = match[2] || "Logged via Telegram";
          
          await createPainLog({
            score,
            locations: {}, // Can't easily parse locations without NLP here, left blank
            mood: "neutral",
            notes: notes
          });

          await telegramBot.sendMessage(chatId, `✅ Pain log recorded! Score: ${score}/10. Keep up the good work.`);
        } else {
          await telegramBot.sendMessage(chatId, `I didn't quite catch that. To log pain, please reply with a number from 0-10, optionally followed by notes. (e.g. "5 feeling stiff")`);
        }
      }
    }
    
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
