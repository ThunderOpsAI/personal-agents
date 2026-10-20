export type AgendaItemStatus = 'pending' | 'completed' | 'dismissed';

export interface AuditTrailEntry {
  timestamp: string;
  previous_status?: AgendaItemStatus | null;
  new_status: AgendaItemStatus;
  note?: string;
}

export interface AgendaItem {
  id: string;
  item_type: 'briefing' | 'learning' | 'insight' | 'yoga' | 'hydrotherapy' | 'meditation' | 'task' | 'general';
  title: string;
  scheduled_time: string; // e.g. "2026-10-19T09:00:00+11:00"
  status: AgendaItemStatus;
  completed_at: string | null;
  dismissed_at: string | null;
  audit_trail: AuditTrailEntry[];
  created_at: string;
  updated_at?: string;
  description?: string;
}

export interface DailyInsight {
  headline: string;
  summary: string;
  trajectoryTrend: string;
  severityLevel: string;
  averageScore: number;
  primaryDrivers: string[];
  keyPatterns: string[];
  aggravatorsIdentified?: string[];
  effectiveTherapies?: string[];
  pacingRecommendations: string[];
  suggestedProtocol?: string;
  isAiGenerated?: boolean;
  modelUsed?: string;
  generatedAt?: string;
  apiNotice?: string;
}

export interface PainAreaWeight {
  area: string;
  side?: 'left' | 'right' | 'unspecified';
  percentage: number;
  score?: number;
}

export interface PainLogRecord {
  id: string;
  score: number;
  locations: PainAreaWeight[];
  mood?: string | null;
  moodScore?: number;
  soreness?: string;
  therapies?: string[];
  aggravators?: string[];
  notes?: string | null;
  created_at: string;
}

export interface BudgetItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  notes?: string;
  created_at: string;
}

export interface BudgetReportRecord {
  id: string;
  period_type: 'weekly' | 'monthly';
  period_label: string;
  start_date: string;
  end_date: string;
  total_spent: number;
  total_income: number;
  breakdown_json: string;
  report_markdown: string;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  author: string;
  pinned: boolean;
  isArchived: boolean;
  tags?: string[];
  order?: number;
  attachment?: {
    name: string;
    size: string;
    url?: string;
    ocrText?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  source: 'google' | 'local';
}

export interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  dueTime?: string;
  status: 'needsAction' | 'completed';
  urgent: boolean;
  notes?: string;
  source: 'google' | 'local';
}

export interface SmsMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: string;
  read: boolean;
  direction: 'inbound' | 'outbound';
}

export interface WashingDay {
  date: string;
  precipitationProbability: number;
  precipitation_probability: number;
  tempMax?: number;
  tempMin?: number;
}

export interface WeatherData {
  temp: number;
  condition: string;
  washingDays: WashingDay[];
  city: string;
}
