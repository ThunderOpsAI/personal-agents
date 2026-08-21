export type AgendaItemStatus = 'pending' | 'completed' | 'dismissed';

export interface AuditTrailEntry {
  timestamp: string;
  previous_status?: AgendaItemStatus | null;
  new_status: AgendaItemStatus;
  note?: string;
}

export interface AgendaItem {
  id: string;
  item_type: string;
  title: string;
  scheduled_time: string;
  status: AgendaItemStatus;
  completed_at: string | null;
  dismissed_at: string | null;
  audit_trail: AuditTrailEntry[];
  created_at: string;
  updated_at?: string;
}

export interface CreateAgendaItemInput {
  id?: string;
  item_type: string;
  title: string;
  scheduled_time: string;
  status?: AgendaItemStatus;
  audit_trail?: AuditTrailEntry[];
  updated_at?: string;
}

export interface DatabaseStatus {
  isFallback: boolean;
  warning?: string;
  provider: 'neon' | 'sqlite';
}

export const CREATE_AGENDA_ITEMS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS agenda_items (
    id TEXT PRIMARY KEY,
    item_type TEXT NOT NULL,
    title TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'dismissed')),
    completed_at TEXT,
    dismissed_at TEXT,
    audit_trail TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT
);
`;

export interface Note {
  id: string;
  content: string;
  author: string;
  pinned: boolean;
  isArchived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteInput {
  id?: string;
  content: string;
  author?: string;
  pinned?: boolean;
  isArchived?: boolean;
}

export const CREATE_NOTES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'user',
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    isArchived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
`;

export interface PainLogRecord {
  id: string;
  score: number;
  locations: Array<{
    area: string;
    side?: 'left' | 'right' | 'unspecified';
    percentage: number;
  }>;
  mood?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface CreatePainLogInput {
  id?: string;
  score: number;
  locations: Array<{
    area: string;
    side?: 'left' | 'right' | 'unspecified';
    percentage: number;
    weight?: number;
  }>;
  mood?: string;
  notes?: string;
}

export const CREATE_PAIN_LOGS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS pain_logs (
    id TEXT PRIMARY KEY,
    score REAL NOT NULL,
    locations TEXT NOT NULL,
    mood TEXT,
    notes TEXT,
    created_at TEXT NOT NULL
);
`;

export interface BudgetItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  created_at: string;
}

export interface CreateBudgetItemInput {
  id?: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
}

export const CREATE_BUDGET_ITEMS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS budget_items (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TEXT NOT NULL
);
`;

export interface ExercisePreferenceRecord {
  id: string;
  routine_id: string;
  routine_title: string;
  pre_pain_score: number;
  post_pain_score: number;
  relief_delta: number;
  notes?: string;
  created_at: string;
}

export const CREATE_EXERCISE_PREFERENCES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS exercise_preferences (
    id TEXT PRIMARY KEY,
    routine_id TEXT NOT NULL,
    routine_title TEXT NOT NULL,
    pre_pain_score REAL NOT NULL,
    post_pain_score REAL NOT NULL,
    relief_delta INTEGER NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL
);
`;

export interface BillSubscription {
  id: string;
  title: string;
  amount: number;
  frequency: string;
  next_due_date: string;
  status: string;
  created_at: string;
}

export interface CreateBillSubscriptionInput {
  id?: string;
  title: string;
  amount: number;
  frequency: string;
  next_due_date: string;
  status?: string;
}

export const CREATE_BILLS_SUBSCRIPTIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS bills_subscriptions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    frequency TEXT NOT NULL,
    next_due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL
);
`;

export interface MaintenanceRecord {
  id: string;
  title: string;
  description: string;
  maintenance_date: string;
  cost: number;
  created_at: string;
}

export interface CreateMaintenanceRecordInput {
  id?: string;
  title: string;
  description?: string;
  maintenance_date: string;
  cost: number;
}

export const CREATE_MAINTENANCE_RECORDS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS maintenance_records (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    maintenance_date TEXT NOT NULL,
    cost REAL NOT NULL,
    created_at TEXT NOT NULL
);
`;

export interface MedicalReceipt {
  id: string;
  provider: string;
  service: string;
  amount: number;
  receipt_date: string;
  created_at: string;
}

export interface CreateMedicalReceiptInput {
  id?: string;
  provider: string;
  service: string;
  amount: number;
  receipt_date: string;
}

export const CREATE_MEDICAL_RECEIPTS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS medical_receipts (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    service TEXT NOT NULL,
    amount REAL NOT NULL,
    receipt_date TEXT NOT NULL,
    created_at TEXT NOT NULL
);
`;
