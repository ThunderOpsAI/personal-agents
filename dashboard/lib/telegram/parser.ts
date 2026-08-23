export interface ParsedTelegramPainLog {
  score: number;
  locations: Array<{
    area: string;
    side: 'left' | 'right' | 'unspecified';
    percentage: number;
    weight?: number;
  }>;
  mood?: string;
  notes: string;
}

export const DEFAULT_PAIN_DISTRIBUTION = [
  { area: 'lumbar', side: 'right' as const, percentage: 75 },
  { area: 'neck', side: 'unspecified' as const, percentage: 10 },
  { area: 'ankle', side: 'right' as const, percentage: 5 },
  { area: 'ankle', side: 'left' as const, percentage: 5 },
  { area: 'thoracic', side: 'unspecified' as const, percentage: 5 },
];

const AREA_ALIAS_MAP: Record<string, string> = {
  'lumbar': 'lumbar',
  'lower back': 'lumbar',
  'low back': 'lumbar',
  'l-spine': 'lumbar',
  'neck': 'neck',
  'cervical': 'neck',
  'c-spine': 'neck',
  'ankle': 'ankle',
  'ankles': 'ankle',
  'thoracic': 'thoracic',
  'mid back': 'thoracic',
  'mid-back': 'thoracic',
  'upper back': 'thoracic',
  't-spine': 'thoracic',
  'knee': 'knee',
  'knees': 'knee',
  'shoulder': 'shoulder',
  'shoulders': 'shoulder',
  'hip': 'hip',
  'hips': 'hip',
  'glute': 'hip',
  'glutes': 'hip',
  'wrist': 'wrist',
  'wrists': 'wrist',
  'elbow': 'elbow',
  'elbows': 'elbow',
};

/**
 * Parses numeric score from text including decimals (7.5) and fractions (7 1/2).
 */
export function extractScore(text: string): number | null {
  const fractionMatch = text.match(/\b(\d+)\s+1\/2\b/);
  if (fractionMatch) {
    const base = parseFloat(fractionMatch[1]);
    return Math.min(10, Math.max(0, base + 0.5));
  }

  const explicitMatch = text.match(/(?:score|level|pain|rated)\s*[:=]?\s*(\d+(?:\.\d+)?)(?!\s*%)/i);
  if (explicitMatch) {
    const val = parseFloat(explicitMatch[1]);
    if (!isNaN(val)) return Math.min(10, Math.max(0, val));
  }

  const scoreOf10Match = text.match(/\b(\d+(?:\.\d+)?)\s*(?:\/\s*10|out\s*of\s*10)\b/i);
  if (scoreOf10Match) {
    const val = parseFloat(scoreOf10Match[1]);
    if (!isNaN(val)) return Math.min(10, Math.max(0, val));
  }

  const leadingNumberMatch = text.match(/^\s*(\d+(?:\.\d+)?)(?!\s*%)\b/);
  if (leadingNumberMatch) {
    const val = parseFloat(leadingNumberMatch[1]);
    if (!isNaN(val) && val <= 10) return val;
  }

  const anyNumberMatch = text.match(/\b(\d+(?:\.\d+)?)(?!\s*%)\b/);
  if (anyNumberMatch) {
    const val = parseFloat(anyNumberMatch[1]);
    if (!isNaN(val) && val <= 10) return val;
  }

  return null;
}

/**
 * Extracts percentage and area breakdown from text.
 */
export function extractLocations(text: string): Array<{
  area: string;
  side: 'left' | 'right' | 'unspecified';
  percentage: number;
}> {
  let cleaned = text.toLowerCase();

  // Strip leading score if present (ensuring it's not a percentage)
  cleaned = cleaned.replace(/^\s*\d+\s+1\/2\b/, '');
  cleaned = cleaned.replace(/^\s*\d+(?:\.\d+)?(?!\s*%)(?:\s*\/\s*10|\s*out\s*of\s*10)?\b(?:\s*[,;:\-])?/, '');

  const found: Array<{ area: string; side: 'left' | 'right' | 'unspecified'; percentage: number }> = [];

  // Pass 1: Prefix percentage format: "75% right lumbar", "10% neck", "5% right ankle"
  const prefixRegex = /(\d{1,3}(?:\.\d+)?)\s*%\s*(?:(right|left|r|l)\s+)?(lower back|low back|l-spine|lumbar|neck|cervical|c-spine|ankles?|thoracic|mid[- ]back|upper[- ]back|t-spine|knees?|shoulders?|hips?|glutes?|wrists?|elbows?)/gi;
  let match: RegExpExecArray | null;

  while ((match = prefixRegex.exec(cleaned)) !== null) {
    const pct = parseFloat(match[1]);
    const rawSide = match[2]?.toLowerCase();
    const rawArea = match[3]?.toLowerCase();

    if (!rawArea || !AREA_ALIAS_MAP[rawArea]) continue;
    const standardArea = AREA_ALIAS_MAP[rawArea];

    let side: 'left' | 'right' | 'unspecified' = 'unspecified';
    if (rawSide === 'right' || rawSide === 'r') side = 'right';
    if (rawSide === 'left' || rawSide === 'l') side = 'left';

    found.push({
      area: standardArea,
      side,
      percentage: pct,
    });
  }

  // Pass 2: If Pass 1 found nothing, try Postfix percentage format: "right lumbar 75%", "neck: 10%", "lumbar 75"
  if (found.length === 0) {
    const postfixRegex = /(?:(right|left|r|l)\s+)?(lower back|low back|l-spine|lumbar|neck|cervical|c-spine|ankles?|thoracic|mid[- ]back|upper[- ]back|t-spine|knees?|shoulders?|hips?|glutes?|wrists?|elbows?)(?:\s+(right|left|r|l))?(?:\s*[:=]?\s*(\d{1,3}(?:\.\d+)?)\s*%?)?/gi;

    while ((match = postfixRegex.exec(cleaned)) !== null) {
      const preSide = match[1]?.toLowerCase();
      const rawArea = match[2]?.toLowerCase();
      const postSide = match[3]?.toLowerCase();
      const pct = match[4] ? parseFloat(match[4]) : 0;

      if (!rawArea || !AREA_ALIAS_MAP[rawArea]) continue;
      const standardArea = AREA_ALIAS_MAP[rawArea];

      let side: 'left' | 'right' | 'unspecified' = 'unspecified';
      const sideToken = preSide || postSide;
      if (sideToken === 'right' || sideToken === 'r') side = 'right';
      if (sideToken === 'left' || sideToken === 'l') side = 'left';

      found.push({
        area: standardArea,
        side,
        percentage: pct,
      });
    }
  }

  if (found.length === 0) {
    return [];
  }

  const total = found.reduce((acc, curr) => acc + curr.percentage, 0);

  if (total === 0) {
    // Distribute evenly if no percentages specified
    const evenPct = Math.round((100 / found.length) * 10) / 10;
    found.forEach((f, idx) => {
      f.percentage = idx === found.length - 1 ? 100 - evenPct * (found.length - 1) : evenPct;
    });
  } else if (Math.abs(total - 100) > 0.01) {
    const remainder = 100 - total;
    if (remainder > 0 && !found.some(f => f.area === 'thoracic')) {
      found.push({
        area: 'thoracic',
        side: 'unspecified',
        percentage: remainder,
      });
    } else {
      const scale = 100 / total;
      found.forEach(f => {
        f.percentage = Math.round(f.percentage * scale * 10) / 10;
      });
    }
  }

  return found;
}

/**
 * Parses full Telegram pain log message.
 */
export function parseTelegramPainMessage(text: string): ParsedTelegramPainLog | null {
  const trimmed = text.trim();
  const score = extractScore(trimmed);

  if (score === null) {
    return null;
  }

  const locations = extractLocations(trimmed);
  const finalLocations = locations.length > 0 ? locations : [...DEFAULT_PAIN_DISTRIBUTION];

  // Extract optional notes
  let notes = 'Logged via Telegram';
  const notesMatch = trimmed.match(/(?:notes?|note)\s*[:=]?\s*(.+)$/i);
  if (notesMatch) {
    notes = notesMatch[1].trim();
  } else {
    // Check if there is extra text after score/locations
    const cleaned = trimmed
      .replace(/\b\d+(?:\.\d+)?\b/g, '')
      .replace(/%/g, '')
      .replace(/\b(score|level|pain|rated|out of 10|lumbar|neck|ankle|thoracic|knee|shoulder|hip|left|right)\b/gi, '')
      .replace(/[,\-:\/]/g, '')
      .trim();
    if (cleaned.length > 3) {
      notes = cleaned;
    }
  }

  return {
    score,
    locations: finalLocations,
    mood: score >= 8 ? 'stressed' : score <= 5 ? 'good' : 'neutral',
    notes,
  };
}
