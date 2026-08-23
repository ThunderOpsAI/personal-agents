import { TelegramBot } from '../dashboard/lib/telegram/bot';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const bot = new TelegramBot();
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'set-webhook') {
    const url = args[1];
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!url) {
      console.error("Please provide a URL to set as the webhook.");
      process.exit(1);
    }
    try {
      const res = await bot.setWebhook(url, secret);
      console.log("Webhook set successfully:", res);
    } catch (err) {
      console.error("Error setting webhook:", err);
    }
  } else if (command === 'send') {
    const chatId = args[1];
    const text = args.slice(2).join(' ');
    if (!chatId || !text) {
      console.error("Usage: ts-node scripts/telegram_bot.ts send <chatId> <text...>");
      process.exit(1);
    }
    try {
      const res = await bot.sendMessage(chatId, text);
      console.log("Message sent:", res);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  } else if (command === 'send-checkin') {
    const chatId = args[1] || process.env.TELEGRAM_CHAT_ID;
    if (!chatId) {
      console.error("Usage: ts-node scripts/telegram_bot.ts send-checkin [chatId]");
      process.exit(1);
    }
    const message = [
      "🩺 *Rumble OS Pain & Symptom Check-in*",
      "",
      "Time for your 3-hour pain tracking log.",
      "",
      "👉 *Quick Log (75% R-Lumbar, 10% Neck, 5% R-Ankle, 5% L-Ankle, 5% Thoracic):*",
      "Tap a preset below, or reply with your custom score and breakdown (e.g. `7.5 75% right lumbar 10% neck 5% right ankle 5% left ankle 5% mid-back`)."
    ].join('\n');

    const replyMarkup = {
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

    try {
      const res = await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: replyMarkup,
      });
      console.log("Check-in prompt sent successfully:", res);
    } catch (err) {
      console.error("Error sending check-in message:", err);
    }
  } else {
    console.log("Usage:");
    console.log("  ts-node scripts/telegram_bot.ts set-webhook <url>");
    console.log("  ts-node scripts/telegram_bot.ts send <chatId> <message>");
    console.log("  ts-node scripts/telegram_bot.ts send-checkin [chatId]");
  }
}

main();
