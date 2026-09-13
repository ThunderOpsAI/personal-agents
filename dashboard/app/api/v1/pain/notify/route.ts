import { NextResponse } from 'next/server';
import { telegramBot, TelegramInlineKeyboardMarkup } from '../../../../../lib/telegram/bot';

export async function GET(request: Request) {
  try {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!chatId) {
      console.error("TELEGRAM_CHAT_ID is not configured");
      return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
    }

    await telegramBot.sendCheckInPrompt(chatId);
    
    return NextResponse.json({ success: true, message: "Notification sent with options" });
  } catch (error: any) {
    console.error("Error sending pain notification via Telegram:", error);
    return NextResponse.json({ error: error.message || "Failed to send notification" }, { status: 500 });
  }
}

