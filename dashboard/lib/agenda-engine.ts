import { AgendaItem } from './schema';

export interface HydrotherapySession {
  date: string;
  offsetDays: number;
}

export interface WashingDay {
  date: string;
  precipitationProbability: number;
  precipitation_probability: number;
  tempMax?: number;
  tempMin?: number;
}

export type WashingDayResult =
  | (WashingDay[] & { status: 'success'; days: WashingDay[] })
  | { status: 'unavailable'; error: string };

/**
 * Calculates remaining hydrotherapy sessions to reach 3 total for the current week.
 * Default schedule offsets relative to today: today (+0), today+2 (+2), today+5 (+5).
 *
 * @param completedThisWeek Number of completed sessions in the current week.
 * @param baseDate Optional reference date (defaults to current date).
 */
export function calculateHydrotherapySessions(
  completedThisWeek: number,
  baseDate: Date | string = new Date()
): HydrotherapySession[] {
  const targetTotal = 3;
  const completed = Math.max(0, completedThisWeek);
  const remainingNeeded = Math.max(0, targetTotal - completed);

  if (remainingNeeded === 0) {
    return [];
  }

  const defaultOffsets = [0, 2, 5];
  // Select remaining offsets starting from completed index up to 3 total
  const selectedOffsets = defaultOffsets.slice(completed, targetTotal);

  const refDate = typeof baseDate === 'string' ? new Date(baseDate) : new Date(baseDate);

  return selectedOffsets.map((offsetDays) => {
    const sessionDate = new Date(refDate);
    sessionDate.setDate(sessionDate.getDate() + offsetDays);

    const year = sessionDate.getFullYear();
    const month = String(sessionDate.getMonth() + 1).padStart(2, '0');
    const day = String(sessionDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    return {
      date: dateStr,
      offsetDays,
    };
  });
}

/**
 * Parses live Open-Meteo 7-day forecast for Wangaratta (-36.3536, 146.3225)
 * and selects exactly 2 days with the lowest precipitation probability.
 *
 * @param forecastData Optional pre-fetched forecast data or raw Open-Meteo response.
 */
export async function selectWashingDays(
  forecastData?: any
): Promise<WashingDayResult> {
  let data = forecastData;

  if (!data) {
    try {
      const url =
        'https://api.open-meteo.com/v1/forecast?latitude=-36.3536&longitude=146.3225&daily=precipitation_probability_max,precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=Australia%2FMelbourne';
      const response = await fetch(url);
      if (!response.ok) {
        return {
          status: 'unavailable',
          error: 'Weather data service unavailable',
        };
      }
      data = await response.json();
    } catch {
      return {
        status: 'unavailable',
        error: 'Weather data service unavailable',
      };
    }
  }

  if (!data) {
    return {
      status: 'unavailable',
      error: 'Weather data service unavailable',
    };
  }

  let candidates: WashingDay[] = [];

  // Handle Open-Meteo standard daily format
  if (data.daily && Array.isArray(data.daily.time)) {
    const times: string[] = data.daily.time;
    const probs: number[] =
      data.daily.precipitation_probability_max ||
      data.daily.precipitation_probability ||
      data.daily.precipitation_probability_mean ||
      [];
    const tempMaxs: number[] = data.daily.temperature_2m_max || [];
    const tempMins: number[] = data.daily.temperature_2m_min || [];

    candidates = times.map((timeStr, idx) => {
      const prob = typeof probs[idx] === 'number' ? probs[idx] : 0;
      return {
        date: timeStr,
        precipitationProbability: prob,
        precipitation_probability: prob,
        tempMax: tempMaxs[idx],
        tempMin: tempMins[idx],
      };
    });
  } else if (Array.isArray(data.days)) {
    candidates = data.days.map((item: any) => {
      const prob =
        typeof item.precipitationProbability === 'number'
          ? item.precipitationProbability
          : typeof item.precipitation_probability === 'number'
          ? item.precipitation_probability
          : typeof item.precipitation_probability_max === 'number'
          ? item.precipitation_probability_max
          : 0;
      return {
        date: item.date || item.time,
        precipitationProbability: prob,
        precipitation_probability: prob,
        tempMax: item.tempMax ?? item.temperature_2m_max,
        tempMin: item.tempMin ?? item.temperature_2m_min,
      };
    });
  } else if (Array.isArray(data)) {
    candidates = data.map((item: any) => {
      const prob =
        typeof item.precipitationProbability === 'number'
          ? item.precipitationProbability
          : typeof item.precipitation_probability === 'number'
          ? item.precipitation_probability
          : typeof item.precipitation_probability_max === 'number'
          ? item.precipitation_probability_max
          : 0;
      return {
        date: item.date || item.time,
        precipitationProbability: prob,
        precipitation_probability: prob,
        tempMax: item.tempMax ?? item.temperature_2m_max,
        tempMin: item.tempMin ?? item.temperature_2m_min,
      };
    });
  }

  if (candidates.length === 0) {
    return {
      status: 'unavailable',
      error: 'Weather data service unavailable',
    };
  }

  // Sort by precipitation probability ascending, then date ascending
  const sorted = [...candidates].sort((a, b) => {
    if (a.precipitationProbability !== b.precipitationProbability) {
      return a.precipitationProbability - b.precipitationProbability;
    }
    return a.date.localeCompare(b.date);
  });

  // Select top 2 lowest precipitation risk days
  const selected = sorted.slice(0, 2);

  // Return as an array decorated with status and days properties
  const resultObj = Object.assign([...selected], {
    status: 'success' as const,
    days: selected,
  });

  return resultObj as WashingDayResult;
}

/**
 * Ensures "Call Deakin to unlock MFA" is present in tomorrow's agenda until dismissed.
 *
 * @param existingAgendaItems Current agenda items list.
 * @param baseDate Optional reference date (defaults to current date).
 */
export function ensureStandingTasks(
  existingAgendaItems: AgendaItem[] = [],
  baseDate: Date | string = new Date()
): AgendaItem[] {
  const TASK_TITLE = 'Call Deakin to unlock MFA';

  // Check if task already exists in agenda
  const existingTask = existingAgendaItems.find(
    (item) => item.title.toLowerCase() === TASK_TITLE.toLowerCase()
  );

  if (existingTask) {
    // If it exists and is dismissed, do not re-add or force scheduled
    if (existingTask.status === 'dismissed') {
      return [...existingAgendaItems];
    }
    // If pending or completed, retain current list
    return [...existingAgendaItems];
  }

  // Calculate tomorrow's ISO date string
  const refDate = typeof baseDate === 'string' ? new Date(baseDate) : new Date(baseDate);
  const tomorrow = new Date(refDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  const scheduledTimeStr = `${year}-${month}-${day}T09:00:00+10:00`;

  const nowISO = new Date().toISOString();

  const standingItem: AgendaItem = {
    id: `task_deakin_mfa_${tomorrow.getTime()}`,
    item_type: 'task',
    title: TASK_TITLE,
    scheduled_time: scheduledTimeStr,
    status: 'pending',
    completed_at: null,
    dismissed_at: null,
    audit_trail: [
      {
        timestamp: nowISO,
        new_status: 'pending',
        note: 'Standing task auto-scheduled for tomorrow',
      },
    ],
    created_at: nowISO,
  };

  return [...existingAgendaItems, standingItem];
}


/**
 * Ensures daily non-negotiable protocols (Learning, Yoga, Night Meditation, Midnight Meditation)
 * are populated for the given date.
 */
export function ensureDailyStandingProtocols(

  existingAgendaItems: AgendaItem[] = [],
  baseDate: Date | string = new Date()
): AgendaItem[] {
  const refDate = typeof baseDate === 'string' ? new Date(baseDate) : new Date(baseDate);
  const year = refDate.getFullYear();
  const month = String(refDate.getMonth() + 1).padStart(2, '0');
  const day = String(refDate.getDate()).padStart(2, '0');
  const datePrefix = `${year}-${month}-${day}`;
  const nowISO = new Date().toISOString();

  const requiredProtocols = [
    {
      id: `learning_${datePrefix}`,
      item_type: 'learning' as const,
      title: 'Continuous Learning: Recovery & Neuroplasticity',
      time: `${datePrefix}T07:30:00+10:00`,
    },
    {
      id: `yoga_am_${datePrefix}`,
      item_type: 'yoga' as const,
      title: 'Morning Adaptive Yoga Routine',
      time: `${datePrefix}T09:00:00+10:00`,
    },
    {
      id: `yoga_pm_${datePrefix}`,
      item_type: 'yoga' as const,
      title: 'Evening Adaptive Yoga Routine',
      time: `${datePrefix}T21:00:00+10:00`,
    },
    {
      id: `meditation_night_${datePrefix}`,
      item_type: 'meditation' as const,
      title: 'Sleep Meditation',
      time: `${datePrefix}T21:00:00+10:00`,
    },
    ...['00:00:00', '08:00:00', '12:00:00', '16:00:00', '20:00:00'].map((timeStr) => ({
      id: `pain_log_reminder_${timeStr.replace(/:/g, '')}_${datePrefix}`,
      item_type: 'task' as const,
      title: 'Log Pain Level',
      time: `${datePrefix}T${timeStr}+10:00`,
    })),
  ];

  let currentItems = [...existingAgendaItems];

  for (const protocol of requiredProtocols) {
    const exists = currentItems.some(
      (item) => item.id === protocol.id
    );

    if (!exists) {
      currentItems.push({
        id: protocol.id,
        item_type: protocol.item_type,
        title: protocol.title,
        scheduled_time: protocol.time,
        status: 'pending',
        completed_at: null,
        dismissed_at: null,
        audit_trail: [
          {
            timestamp: nowISO,
            new_status: 'pending',
            note: 'Daily standing protocol auto-injected',
          },
        ],
        created_at: nowISO,
      });
    }
  }

  return currentItems;
}

