import { NextResponse } from 'next/server';
import { telegramBot, TelegramInlineKeyboardMarkup } from '../../../../../lib/telegram/bot';

export async function GET(request: Request) {
  try {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!chatId) {
      console.error("TELEGRAM_CHAT_ID is not configured");
      return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
    }

    const message = [
      "🩺 *Rumble OS Pain & Symptom Check-in*",
      "",
      "Time for your 3-hour pain tracking log.",
      "",
      "👉 *Quick Log (75% R-Lumbar, 10% Neck, 5% R-Ankle, 5% L-Ankle, 5% Thoracic):*",
      "Tap a preset below, or reply with your custom score and breakdown (e.g. `7.5 75% right lumbar 10% neck 5% right ankle 5% left ankle 5% mid-back`)."
    ].join('\n');

    const replyMarkup: TelegramInlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "🟢 Mild (5.5)", callback_data: "pain_preset:5.5" },
          { text: "🟡 Mod (7.0)", callback_data: "pain_preset:7.0" },
          { text: "🟠 Avg (7.5)", callback_data: "pain_preset:7.5" },
          { text: "🔴 High (8.5)", callback_data: "pain_preset:8.5" },
        ],
        [
          { text: "⚡ Lumbar Flare (9.0)", callback_data: "pain_lumbar_flare:9.0" },
          { text: "💆 Neck Tension (6.5)", callback_data: "pain_neck_focus:6.5" },
        ],
        [
          { text: "🦶 Ankle/Gait Strain (7.0)", callback_data: "pain_ankle_focus:7.0" },
          { text: "📋 Custom Reply Guide", callback_data: "pain_help" },
        ],
      ],
    };

    await telegramBot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: replyMarkup,
    });
    
    return NextResponse.json({ success: true, message: "Notification sent with options" });
  } catch (error: any) {
    console.error("Error sending pain notification via Telegram:", error);
    return NextResponse.json({ error: error.message || "Failed to send notification" }, { status: 500 });
  }
}

