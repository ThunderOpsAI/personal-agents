import { NextRequest, NextResponse } from 'next/server';
import { TelegramUpdate, telegramBot } from '../../../../../lib/telegram/bot';

export async function POST(req: NextRequest) {
  // Verify Telegram secret token
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
      const text = body.message.text;
      
      console.log(`Received message from ${chatId}: ${text}`);
      
      if (text === '/start') {
        await telegramBot.sendMessage(chatId, "Welcome to Rumble OS Telegram Bot! I will help sync your agenda and actions.");
      } else {
        await telegramBot.sendMessage(chatId, `Action recorded for: ${text}`);
      }
    }
    
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
