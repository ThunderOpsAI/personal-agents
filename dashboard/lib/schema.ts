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
}

export interface CreateAgendaItemInput {
  id?: string;
  item_type: string;
  title: string;
  scheduled_time: string;
  status?: AgendaItemStatus;
  audit_trail?: AuditTrailEntry[];
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
    created_at TEXT NOT NULL
);
`;
