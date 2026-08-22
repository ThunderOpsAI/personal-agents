import { NextResponse } from 'next/server';
import { telegramBot } from '../../../../../lib/telegram/bot';

export async function GET(request: Request) {
  try {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!chatId) {
      console.error("TELEGRAM_CHAT_ID is not configured");
      return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
    }

    const message = "🩺 Reminder: It's time to log your pain and symptoms for this 3-hour window. How are you feeling right now?";
    await telegramBot.sendMessage(chatId, message);
    
    return NextResponse.json({ success: true, message: "Notification sent" });
  } catch (error: any) {
    console.error("Error sending pain notification via Telegram:", error);
    return NextResponse.json({ error: error.message || "Failed to send notification" }, { status: 500 });
  }
}
// Trigger Vercel build
