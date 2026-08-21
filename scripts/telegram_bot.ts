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
  } else {
    console.log("Usage:");
    console.log("  ts-node scripts/telegram_bot.ts set-webhook <url>");
    console.log("  ts-node scripts/telegram_bot.ts send <chatId> <message>");
  }
}

main();
