export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
}

export class TelegramBot {
  private token: string;
  private apiUrl: string;

  constructor(token?: string) {
    this.token = token || process.env.TELEGRAM_BOT_TOKEN || '';
    if (!this.token) {
      throw new Error("TelegramBot requires TELEGRAM_BOT_TOKEN environment variable");
    }
    this.apiUrl = `https://api.telegram.org/bot${this.token}`;
  }

  async sendMessage(chatId: string | number, text: string) {
    const res = await fetch(`${this.apiUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!res.ok) {
      throw new Error(`Telegram API Error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }
  
  async setWebhook(url: string, secretToken?: string) {
    const body: any = { url };
    if (secretToken) {
      body.secret_token = secretToken;
    }
    const res = await fetch(`${this.apiUrl}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      throw new Error(`Telegram API Error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }
}

export const telegramBot = new TelegramBot();
