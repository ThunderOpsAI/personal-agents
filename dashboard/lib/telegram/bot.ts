export interface TelegramInlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface TelegramInlineKeyboardMarkup {
  inline_keyboard: TelegramInlineKeyboardButton[][];
}

export interface TelegramReplyKeyboardButton {
  text: string;
}

export interface TelegramReplyKeyboardMarkup {
  keyboard: TelegramReplyKeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
}

export type TelegramReplyMarkup = TelegramInlineKeyboardMarkup | TelegramReplyKeyboardMarkup;

export interface TelegramCallbackQuery {
  id: string;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
  message?: {
    message_id: number;
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
  data?: string;
}

export interface TelegramSendMessageOptions {
  parse_mode?: 'Markdown' | 'HTML' | 'MarkdownV2';
  reply_markup?: TelegramReplyMarkup;
}

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
  callback_query?: TelegramCallbackQuery;
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

  async sendMessage(chatId: string | number, text: string, options?: TelegramSendMessageOptions) {
    const payload: any = {
      chat_id: chatId,
      text,
      ...options,
    };

    const res = await fetch(`${this.apiUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Telegram API Error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string, showAlert = false) {
    const payload: any = {
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    };

    const res = await fetch(`${this.apiUrl}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
