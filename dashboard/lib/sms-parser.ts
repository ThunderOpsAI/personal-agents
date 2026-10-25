/**
 * SMS Ingestion & Communication Parser
 * Handles payload normalization, template tag sanitization, zero-loss fallback,
 * timestamp normalization (UTC at rest, Australia/Melbourne at display),
 * and rate limiting for incoming webhooks.
 */

import { SmsParseStatus } from "./schema";

export interface ParsedSms {
  sender: string;
  body: string;
  received_at: string; // Always UTC ISO 8601
  provider_format: 'macrodroid' | 'tasker' | 'ntfy' | 'pushover' | 'twilio' | 'generic' | 'unknown';
  parse_status: SmsParseStatus;
  raw_payload: string;
}

// Known malformed / unexpanded automation template tags
const UNEXPANDED_BODY_TAGS = [
  "{sms_body}",
  "[sms_body]",
  "{sms_message}",
  "[sms_message]",
  "%SMSRB",
  "{body}",
  "[body]",
  "{message}",
  "[message]",
];

const UNEXPANDED_SENDER_TAGS = [
  "{sms_number}",
  "[sms_number]",
  "%SMSRF",
  "%SMSRN",
  "{sender}",
  "[sender]",
  "{from}",
  "[from]",
  "{phone}",
  "[phone]",
];

/**
 * Sanitizes template tags from body or sender strings.
 */
export function sanitizeTemplateTag(
  value: string,
  type: 'body' | 'sender'
): { sanitized: string; wasMalformed: boolean } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { sanitized: "", wasMalformed: false };
  }

  const tags = type === 'body' ? UNEXPANDED_BODY_TAGS : UNEXPANDED_SENDER_TAGS;

  // Exact match of unexpanded tag
  if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
    if (type === 'body') {
      return {
        sanitized: `[Malformed/Unexpanded template tag: ${trimmed} - check phone automation config]`,
        wasMalformed: true,
      };
    } else {
      return {
        sanitized: `Unknown (${trimmed})`,
        wasMalformed: true,
      };
    }
  }

  // Check if string contains embedded unexpanded tags
  let wasMalformed = false;
  let sanitized = trimmed;
  for (const tag of tags) {
    if (sanitized.includes(tag)) {
      wasMalformed = true;
      sanitized = sanitized.split(tag).join(`[unexpanded:${tag}]`);
    }
  }

  return { sanitized, wasMalformed };
}

/**
 * Normalizes any timestamp representation into a clean UTC ISO 8601 string.
 */
export function normalizeTimestampToUtc(rawTime: any): string {
  if (!rawTime) {
    return new Date().toISOString();
  }

  const str = String(rawTime).trim();

  // UNIX timestamp in seconds (e.g. Tasker %TIMES = 10 digits)
  if (/^\d{10}$/.test(str)) {
    const sec = parseInt(str, 10);
    return new Date(sec * 1000).toISOString();
  }

  // UNIX timestamp in milliseconds (13 digits)
  if (/^\d{13}$/.test(str)) {
    const ms = parseInt(str, 10);
    return new Date(ms).toISOString();
  }

  // Numeric epoch passed as number
  if (typeof rawTime === 'number' && Number.isFinite(rawTime)) {
    if (rawTime < 1e11) {
      return new Date(rawTime * 1000).toISOString();
    }
    return new Date(rawTime).toISOString();
  }

  // ISO or standard date string
  const parsed = Date.parse(str);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }

  // Fallback to now
  return new Date().toISOString();
}

/**
 * Formats a UTC ISO timestamp for display in Australia/Melbourne (DST-safe: AEST/AEDT).
 */
export function formatMelbourneSmsTimestamp(
  utcIso: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(utcIso);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    ...options,
  };
  return new Intl.DateTimeFormat("en-AU", defaultOptions).format(date);
}

/**
 * Parses raw webhook payloads from MacroDroid, Tasker, ntfy, Pushover, Twilio, or generic JSON/form.
 * Strictly guarantees ZERO LOSS: invalid payloads are stored with parse_status = 'failed' / 'malformed'.
 */
export function parseIncomingSmsPayload(
  payload: Record<string, any>,
  rawText: string,
  contentType: string = ""
): ParsedSms {
  let provider_format: ParsedSms['provider_format'] = 'generic';
  let parse_status: SmsParseStatus = 'parsed';
  let hadMalformedTag = false;

  // 1. Detect provider format
  if (payload.AccountSid || payload.MessageSid || contentType.includes("application/x-www-form-urlencoded")) {
    if (payload.AccountSid || payload.MessageSid || payload.From) {
      provider_format = 'twilio';
    }
  }

  if (
    payload.event === 'message' &&
    (payload.topic !== undefined || payload.tags !== undefined)
  ) {
    provider_format = 'ntfy';
  } else if (payload.receipt !== undefined || (payload.token && payload.user)) {
    provider_format = 'pushover';
  } else if (
    payload.sms_number !== undefined ||
    payload.sms_message !== undefined ||
    payload.sms_body !== undefined ||
    payload["[sms_number]"] !== undefined ||
    payload["[sms_message]"] !== undefined
  ) {
    provider_format = 'macrodroid';
  } else if (
    payload["%SMSRF"] !== undefined ||
    payload["%SMSRB"] !== undefined ||
    (typeof payload.received_at === 'string' && payload.received_at === '%TIMES') ||
    (typeof payload.sender === 'string' && payload.sender.startsWith('%SMSR'))
  ) {
    provider_format = 'tasker';
  }

  // 2. Extract raw sender candidate
  let rawSender =
    payload.sender ||
    payload.From ||
    payload.from ||
    payload.sms_number ||
    payload["[sms_number]"] ||
    payload["{sms_number}"] ||
    payload.number ||
    payload.phone ||
    payload["%SMSRF"] ||
    payload["%SMSRN"];

  // Special extraction for ntfy / Pushover
  if (!rawSender) {
    if (provider_format === 'ntfy' && payload.title) {
      // e.g. "SMS from +61400123456" -> extract "+61400123456"
      const match = String(payload.title).match(/(?:\+?\d{8,15})/);
      rawSender = match ? match[0] : payload.title;
    } else if (provider_format === 'pushover' && payload.title) {
      rawSender = payload.title;
    }
  }

  // 3. Extract raw body candidate
  let rawBody =
    payload.body ||
    payload.Body ||
    payload.message ||
    payload.Message ||
    payload.sms_message ||
    payload.sms_body ||
    payload["[sms_message]"] ||
    payload["{sms_message}"] ||
    payload["[sms_body]"] ||
    payload["{sms_body}"] ||
    payload.text ||
    payload["%SMSRB"];

  // 4. Extract raw timestamp candidate
  const rawTime =
    payload.received_at ||
    payload.DateCreated ||
    payload.DateSent ||
    payload.date ||
    payload.time ||
    payload.timestamp ||
    payload["%TIMES"];

  // 5. Sanitize template tags
  const senderSanitization = sanitizeTemplateTag(
    rawSender !== undefined && rawSender !== null ? String(rawSender) : "",
    'sender'
  );
  if (senderSanitization.wasMalformed) hadMalformedTag = true;

  const bodySanitization = sanitizeTemplateTag(
    rawBody !== undefined && rawBody !== null ? String(rawBody) : "",
    'body'
  );
  if (bodySanitization.wasMalformed) hadMalformedTag = true;

  let sender = senderSanitization.sanitized;
  let body = bodySanitization.sanitized;

  // 6. Zero-loss guarantees: If missing sender or body, fallback gracefully and flag
  const isMissingSender = !sender;
  const isMissingBody = !body;

  if (isMissingSender) {
    sender = "Unknown";
    parse_status = 'failed';
  }

  if (isMissingBody) {
    // Zero loss: capture payload snippet rather than dropping
    body = rawText.trim()
      ? `[Raw unparsed payload: ${rawText.slice(0, 300)}]`
      : "[Empty SMS body received]";
    parse_status = 'failed';
  } else if (hadMalformedTag && parse_status !== 'failed') {
    parse_status = 'malformed';
  }

  const received_at = normalizeTimestampToUtc(rawTime);

  return {
    sender,
    body,
    received_at,
    provider_format,
    parse_status,
    raw_payload: rawText || JSON.stringify(payload),
  };
}

/**
 * In-memory sliding window rate limiter
 * Allows maxRequests within windowMs per identifier (e.g. IP or sender).
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count };
}

/**
 * Helper to reset rate limits (useful for testing)
 */
export function resetRateLimits(): void {
  rateLimitMap.clear();
}
