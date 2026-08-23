import { describe, it, expect } from 'vitest';
import { extractScore, extractLocations, parseTelegramPainMessage, DEFAULT_PAIN_DISTRIBUTION } from '../lib/telegram/parser';

describe('Telegram Pain Parser', () => {
  describe('extractScore', () => {
    it('parses integer score', () => {
      expect(extractScore('7')).toBe(7);
      expect(extractScore('pain 8')).toBe(8);
      expect(extractScore('Score: 9')).toBe(9);
    });

    it('parses decimal score', () => {
      expect(extractScore('7.5')).toBe(7.5);
      expect(extractScore('pain is 6.5')).toBe(6.5);
      expect(extractScore('7.5/10')).toBe(7.5);
    });

    it('parses fraction score like 7 1/2', () => {
      expect(extractScore('7 1/2')).toBe(7.5);
      expect(extractScore('pain is 8 1/2 today')).toBe(8.5);
    });
  });

  describe('extractLocations', () => {
    it('extracts custom distribution with 75% right lumbar, 10% neck, 5% right ankle, 5% left ankle, 5% thoracic', () => {
      const text = '7.5 75% right lumbar 10% neck 5% right ankle 5% left ankle 5% thoracic';
      const locs = extractLocations(text);
      expect(locs).toHaveLength(5);
      expect(locs).toEqual(
        expect.arrayContaining([
          { area: 'lumbar', side: 'right', percentage: 75 },
          { area: 'neck', side: 'unspecified', percentage: 10 },
          { area: 'ankle', side: 'right', percentage: 5 },
          { area: 'ankle', side: 'left', percentage: 5 },
          { area: 'thoracic', side: 'unspecified', percentage: 5 },
        ])
      );
    });

    it('adds remainder to thoracic if total is 95%', () => {
      const text = '75% right lumbar 10% neck 5% right ankle 5% left ankle';
      const locs = extractLocations(text);
      expect(locs).toHaveLength(5);
      const thoracic = locs.find(l => l.area === 'thoracic');
      expect(thoracic?.percentage).toBe(5);
    });

    it('returns empty array when no known body areas are present', () => {
      expect(extractLocations('feeling fine today')).toEqual([]);
    });
  });

  describe('parseTelegramPainMessage', () => {
    it('applies default distribution when only score is provided', () => {
      const result = parseTelegramPainMessage('7.5');
      expect(result).not.toBeNull();
      expect(result?.score).toBe(7.5);
      expect(result?.locations).toEqual(DEFAULT_PAIN_DISTRIBUTION);
      expect(result?.notes).toBe('Logged via Telegram');
    });

    it('parses full breakdown text with custom notes', () => {
      const result = parseTelegramPainMessage('8.0 80% right lumbar, 20% neck, notes: flare after driving');
      expect(result).not.toBeNull();
      expect(result?.score).toBe(8.0);
      expect(result?.locations).toEqual(
        expect.arrayContaining([
          { area: 'lumbar', side: 'right', percentage: 80 },
          { area: 'neck', side: 'unspecified', percentage: 20 },
        ])
      );
      expect(result?.notes).toBe('flare after driving');
    });
  });
});
