import { Pool } from 'pg';
// import Database from 'better-sqlite3';
import {
  AgendaItem,
  AgendaItemStatus,
  CreateAgendaItemInput,
  DatabaseStatus,
  CREATE_AGENDA_ITEMS_TABLE_SQL,
  CREATE_NOTES_TABLE_SQL,
  CREATE_PAIN_LOGS_TABLE_SQL,
  CREATE_EXERCISE_PREFERENCES_TABLE_SQL,
  AuditTrailEntry,
  Note,
  CreateNoteInput,
  PainLogRecord,
  CreatePainLogInput,
  ExercisePreferenceRecord,
  BudgetItem,
  CreateBudgetItemInput,
  CREATE_BUDGET_ITEMS_TABLE_SQL,
  BudgetReportRecord,
  CreateBudgetReportInput,
  CREATE_BUDGET_REPORTS_TABLE_SQL,
  BillSubscription,
  CreateBillSubscriptionInput,
  CREATE_BILLS_SUBSCRIPTIONS_TABLE_SQL,
  MaintenanceRecord,
  CreateMaintenanceRecordInput,
  CREATE_MAINTENANCE_RECORDS_TABLE_SQL,
  MedicalReceipt,
  CreateMedicalReceiptInput,
  CREATE_MEDICAL_RECEIPTS_TABLE_SQL,
  EncyclopediaProgress,
  CREATE_LEARNING_PROGRESS_TABLE_SQL,
  ChatLogRecord,
  CREATE_CHAT_LOGS_TABLE_SQL,
  SmsMessage,
  CreateSmsMessageInput,
  CREATE_SMS_MESSAGES_TABLE_SQL,
  PendingChatAction,
  CREATE_PENDING_CHAT_ACTIONS_TABLE_SQL,
  TaskRecord,
  CreateTaskInput,
  TaskStatus,
  CREATE_TASKS_TABLE_SQL,
} from './schema';

let pgPool: Pool | null = null;
let sqliteDb: any = null; // mocked Database.Database | null
let currentStatus: DatabaseStatus | null = null;

export function getDbStatus(): DatabaseStatus {
  if (currentStatus) {
    return currentStatus;
  }

  const connectionString = process.env.NEON_DATABASE_URL;
  if (connectionString) {
    currentStatus = {
      isFallback: false,
      provider: 'neon',
    };
  } else {
    const warningMsg = 'SQLite local fallback active';
    console.warn(`[DB WARNING] ${warningMsg}`, {
      isFallback: true,
      warning: warningMsg,
    });
    currentStatus = {
      isFallback: true,
      warning: warningMsg,
      provider: 'sqlite',
    };
  }

  return currentStatus;
}

export function initDb(overrideDbPath?: string): void {
  const connectionString = process.env.NEON_DATABASE_URL;

  if (connectionString) {
    if (!pgPool) {
      pgPool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
      });
    }
    currentStatus = {
      isFallback: false,
      provider: 'neon',
    };
  } else {
    if (!sqliteDb) {
      const inMemoryTables: Record<string, any[]> = {
        agenda_items: [],
        notes: [],
        pain_logs: [],
        exercise_preferences: [],
        budget_items: [],
        budget_reports: [],
        bills_subscriptions: [],
        maintenance_records: [],
        medical_receipts: [],
        learning_progress: [],
        chat_logs: [],
        sms_messages: [],
        pending_chat_actions: [],
        tasks: [],
      };

      sqliteDb = {
        exec: () => {},
        close: () => {},
        prepare: (query: string) => {
          const q = query.trim();
          return {
            run: (...params: any[]) => {
              const insertMatch = q.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i);
              if (insertMatch) {
                const table = insertMatch[1].toLowerCase();
                const cols = insertMatch[2].split(',').map((c) => c.trim());
                const row: any = {};
                cols.forEach((col, idx) => {
                  row[col] = params[idx];
                });
                if (!inMemoryTables[table]) inMemoryTables[table] = [];
                inMemoryTables[table].unshift(row);
                return { changes: 1 };
              }
              const deleteMatch = q.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)\s+WHERE\s+(.+)/i);
              if (deleteMatch) {
                const table = deleteMatch[1].toLowerCase();
                const targetId = params[0];
                const rows = inMemoryTables[table] || [];
                const idx = rows.findIndex((r: any) => r.id === targetId);
                if (idx !== -1) {
                  rows.splice(idx, 1);
                  return { changes: 1 };
                }
                return { changes: 0 };
              }
              const updateMatch = q.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
              if (updateMatch) {
                const table = updateMatch[1].toLowerCase();
                const setClause = updateMatch[2].trim();
                const rows = inMemoryTables[table] || [];
                const targetId = params[params.length - 1];
                const row = rows.find((r: any) => r.id === targetId);
                if (row) {
                  if (table === 'notes') {
                    row.content = params[0];
                    row.pinned = Boolean(params[1]);
                    row.isArchived = Boolean(params[2]);
                    row.updated_at = params[3];
                    return { changes: 1 };
                  }
                  if (table === 'agenda_items' && setClause.includes('status =')) {
                    row.status = params[0];
                    row.completed_at = params[1];
                    row.dismissed_at = params[2];
                    row.audit_trail = params[3];
                    row.updated_at = params[4];
                    return { changes: 1 };
                  }
                  if (table === 'tasks') {
                    row.title = params[0];
                    row.notes = params[1];
                    row.status = params[2];
                    row.due = params[3];
                    row.completed_at = params[4];
                    row.deleted = Boolean(params[5]);
                    row.google_id = params[6];
                    row.updated_at = params[7];
                    return { changes: 1 };
                  }
                  if (setClause.includes('read =') || setClause.includes('read=')) {
                    row.read = true;
                  }
                  if (setClause.includes('resolved_at =') || setClause.includes('resolved_at=')) {
                    row.resolved_at = params[0];
                  }
                  return { changes: 1 };
                } else if (table === 'pending_chat_actions' && !q.includes('WHERE id =')) {
                  let c = 0;
                  rows.forEach((r: any) => {
                    if (!r.resolved_at) {
                      r.resolved_at = params[0];
                      c++;
                    }
                  });
                  return { changes: c };
                }
                return { changes: 0 };
              }
              return { changes: 1 };
            },
            all: (...params: any[]) => {
              const selectMatch = q.match(/FROM\s+([a-zA-Z0-9_]+)/i);
              if (selectMatch) {
                const table = selectMatch[1].toLowerCase();
                const rows = inMemoryTables[table] || [];
                if (table === 'sms_messages') {
                  let filtered = [...rows];
                  if (q.includes('read = false') || q.includes('read = FALSE')) {
                    filtered = filtered.filter((r) => !r.read);
                  }
                  filtered.sort((a, b) => new Date(b.received_at || b.created_at).getTime() - new Date(a.received_at || a.created_at).getTime());
                  const limitMatch = q.match(/LIMIT\s+(\d+)/i);
                  if (limitMatch) {
                    filtered = filtered.slice(0, parseInt(limitMatch[1], 10));
                  } else if (params.length === 1 && typeof params[0] === 'number') {
                    filtered = filtered.slice(0, params[0]);
                  }
                  return filtered;
                }
                if (table === 'pending_chat_actions') {
                  if (q.includes('resolved_at IS NULL')) {
                    return rows.filter((r) => !r.resolved_at);
                  }
                  return [...rows];
                }
                if (params.length === 2 && q.includes('created_at >=') && q.includes('created_at <=')) {
                  return rows.filter((r) => r.created_at >= params[0] && r.created_at <= params[1]);
                }
                if (params.length === 1 && q.includes('created_at >=')) {
                  return rows.filter((r) => r.created_at >= params[0]);
                }
                if (params.length === 1 && q.includes('period_type =')) {
                  return rows.filter((r) => r.period_type === params[0]);
                }
                return [...rows];
              }
              return [];
            },
            get: (...params: any[]) => {
              const selectMatch = q.match(/FROM\s+([a-zA-Z0-9_]+)/i);
              if (selectMatch) {
                const table = selectMatch[1].toLowerCase();
                const rows = inMemoryTables[table] || [];
                if (table === 'pending_chat_actions') {
                  return rows.find((r) => !r.resolved_at) || null;
                }
                if (params.length > 0) {
                  return rows.find((r) => r.id === params[0] || r.encyclopedia_id === params[0]) || null;
                }
                return rows[0] || null;
              }
              return null;
            },
          };
        },
      };
    }
    const warningMsg = 'SQLite local fallback active';
    console.warn(`[DB WARNING] ${warningMsg}`, {
      isFallback: true,
      warning: warningMsg,
    });
    currentStatus = {
      isFallback: true,
      warning: warningMsg,
      provider: 'sqlite',
    };
  }
}

export async function ensureTableExists(): Promise<void> {
  const status = getDbStatus();

  if (status.provider === 'neon') {
    if (!pgPool) {
      initDb();
    }
    if (pgPool) {
      await pgPool.query(CREATE_AGENDA_ITEMS_TABLE_SQL);
      await pgPool.query(CREATE_NOTES_TABLE_SQL);
      await pgPool.query(CREATE_PAIN_LOGS_TABLE_SQL);
      await pgPool.query(CREATE_EXERCISE_PREFERENCES_TABLE_SQL);
      await pgPool.query(CREATE_BUDGET_ITEMS_TABLE_SQL);
      await pgPool.query(CREATE_BUDGET_REPORTS_TABLE_SQL);
      await pgPool.query(CREATE_BILLS_SUBSCRIPTIONS_TABLE_SQL);
      await pgPool.query(CREATE_MAINTENANCE_RECORDS_TABLE_SQL);
      await pgPool.query(CREATE_MEDICAL_RECEIPTS_TABLE_SQL);
      await pgPool.query(CREATE_LEARNING_PROGRESS_TABLE_SQL);
      await pgPool.query(CREATE_CHAT_LOGS_TABLE_SQL);
      await pgPool.query(CREATE_SMS_MESSAGES_TABLE_SQL);
      await pgPool.query(CREATE_PENDING_CHAT_ACTIONS_TABLE_SQL);
      await pgPool.query(CREATE_TASKS_TABLE_SQL);
    }
  } else {
    if (!sqliteDb) {
      initDb();
    }
    if (sqliteDb) {
      sqliteDb.exec(CREATE_AGENDA_ITEMS_TABLE_SQL);
      sqliteDb.exec(CREATE_NOTES_TABLE_SQL);
      sqliteDb.exec(CREATE_PAIN_LOGS_TABLE_SQL);
      sqliteDb.exec(CREATE_EXERCISE_PREFERENCES_TABLE_SQL);
      sqliteDb.exec(CREATE_BUDGET_ITEMS_TABLE_SQL);
      sqliteDb.exec(CREATE_BUDGET_REPORTS_TABLE_SQL);
      sqliteDb.exec(CREATE_BILLS_SUBSCRIPTIONS_TABLE_SQL);
      sqliteDb.exec(CREATE_MAINTENANCE_RECORDS_TABLE_SQL);
      sqliteDb.exec(CREATE_MEDICAL_RECEIPTS_TABLE_SQL);
      sqliteDb.exec(CREATE_LEARNING_PROGRESS_TABLE_SQL);
      sqliteDb.exec(CREATE_CHAT_LOGS_TABLE_SQL);
      sqliteDb.exec(CREATE_SMS_MESSAGES_TABLE_SQL);
      sqliteDb.exec(CREATE_PENDING_CHAT_ACTIONS_TABLE_SQL);
      sqliteDb.exec(CREATE_TASKS_TABLE_SQL);
    }
  }
}

export async function createBudgetItem(input: CreateBudgetItemInput): Promise<BudgetItem> {
  await ensureTableExists();
  const id = input.id || `budget_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const created_at = new Date().toISOString();
  
  const newItem: BudgetItem = {
    id,
    description: input.description,
    amount: input.amount,
    category: input.category,
    type: input.type,
    created_at,
  };

  const status = getDbStatus();

  if (status.provider === 'neon' && pgPool) {
    const text = 'INSERT INTO budget_items(id, description, amount, category, type, created_at) VALUES($1, $2, $3, $4, $5, $6)';
    const values = [newItem.id, newItem.description, newItem.amount, newItem.category, newItem.type, newItem.created_at];
    await pgPool.query(text, values);
  } else if (status.provider === 'sqlite' && sqliteDb) {
    const stmt = sqliteDb.prepare(
      'INSERT INTO budget_items (id, description, amount, category, type, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run(newItem.id, newItem.description, newItem.amount, newItem.category, newItem.type, newItem.created_at);
  } else {
    throw new Error('Database not initialized');
  }

  return newItem;
}

export async function getBudgetItems(options?: { startDate?: string; endDate?: string }): Promise<BudgetItem[]> {
  await ensureTableExists();
  const status = getDbStatus();

  if (status.provider === 'neon' && pgPool) {
    let query = 'SELECT id, description, amount, category, type, created_at FROM budget_items';
    const params: any[] = [];
    if (options?.startDate && options?.endDate) {
      query += ' WHERE created_at >= $1 AND created_at <= $2';
      params.push(options.startDate, options.endDate);
    } else if (options?.startDate) {
      query += ' WHERE created_at >= $1';
      params.push(options.startDate);
    } else if (options?.endDate) {
      query += ' WHERE created_at <= $1';
      params.push(options.endDate);
    }
    query += ' ORDER BY created_at DESC';
    const res = await pgPool.query(query, params);
    return res.rows.map((row) => ({
      id: row.id,
      description: row.description,
      amount: Number(row.amount),
      category: row.category,
      type: row.type,
      created_at: row.created_at,
    }));
  } else if (sqliteDb) {
    let query = 'SELECT id, description, amount, category, type, created_at FROM budget_items';
    const params: any[] = [];
    if (options?.startDate && options?.endDate) {
      query += ' WHERE created_at >= ? AND created_at <= ?';
      params.push(options.startDate, options.endDate);
    } else if (options?.startDate) {
      query += ' WHERE created_at >= ?';
      params.push(options.startDate);
    } else if (options?.endDate) {
      query += ' WHERE created_at <= ?';
      params.push(options.endDate);
    }
    query += ' ORDER BY created_at DESC';
    const stmt = sqliteDb.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map((row) => ({
      id: row.id,
      description: row.description,
      amount: Number(row.amount),
      category: row.category,
      type: row.type,
      created_at: row.created_at,
    }));
  }
  return [];
}

export async function createBudgetReport(input: CreateBudgetReportInput): Promise<BudgetReportRecord> {
  await ensureTableExists();
  const id = input.id || `breport_${input.period_type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = input.created_at || new Date().toISOString();

  const record: BudgetReportRecord = {
    id,
    period_type: input.period_type,
    period_label: input.period_label,
    start_date: input.start_date,
    end_date: input.end_date,
    total_spent: Number(input.total_spent),
    breakdown_json: input.breakdown_json,
    report_markdown: input.report_markdown,
    created_at: now,
  };

  const status = getDbStatus();
  if (status.provider === 'neon' && pgPool) {
    const text = `INSERT INTO budget_reports(id, period_type, period_label, start_date, end_date, total_spent, breakdown_json, report_markdown, created_at)
                 VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
    const values = [record.id, record.period_type, record.period_label, record.start_date, record.end_date, record.total_spent, record.breakdown_json, record.report_markdown, record.created_at];
    await pgPool.query(text, values);
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      `INSERT INTO budget_reports(id, period_type, period_label, start_date, end_date, total_spent, breakdown_json, report_markdown, created_at)
       VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(record.id, record.period_type, record.period_label, record.start_date, record.end_date, record.total_spent, record.breakdown_json, record.report_markdown, record.created_at);
  }

  return record;
}

export async function getBudgetReports(options?: { periodType?: 'weekly' | 'monthly'; limit?: number }): Promise<BudgetReportRecord[]> {
  await ensureTableExists();
  const status = getDbStatus();
  const limit = options?.limit || 50;

  if (status.provider === 'neon' && pgPool) {
    let query = 'SELECT id, period_type, period_label, start_date, end_date, total_spent, breakdown_json, report_markdown, created_at FROM budget_reports';
    const params: any[] = [];
    if (options?.periodType) {
      query += ' WHERE period_type = $1';
      params.push(options.periodType);
      query += ` ORDER BY created_at DESC LIMIT $2`;
      params.push(limit);
    } else {
      query += ` ORDER BY created_at DESC LIMIT $1`;
      params.push(limit);
    }
    const res = await pgPool.query(query, params);
    return res.rows.map((row) => ({
      id: row.id,
      period_type: row.period_type,
      period_label: row.period_label,
      start_date: row.start_date,
      end_date: row.end_date,
      total_spent: Number(row.total_spent),
      breakdown_json: row.breakdown_json,
      report_markdown: row.report_markdown,
      created_at: row.created_at,
    }));
  } else if (sqliteDb) {
    let query = 'SELECT id, period_type, period_label, start_date, end_date, total_spent, breakdown_json, report_markdown, created_at FROM budget_reports';
    const params: any[] = [];
    if (options?.periodType) {
      query += ' WHERE period_type = ? ORDER BY created_at DESC LIMIT ?';
      params.push(options.periodType, limit);
    } else {
      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);
    }
    const stmt = sqliteDb.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map((row) => ({
      id: row.id,
      period_type: row.period_type,
      period_label: row.period_label,
      start_date: row.start_date,
      end_date: row.end_date,
      total_spent: Number(row.total_spent),
      breakdown_json: row.breakdown_json,
      report_markdown: row.report_markdown,
      created_at: row.created_at,
    }));
  }
  return [];
}

export async function getBudgetReportById(id: string): Promise<BudgetReportRecord | null> {
  await ensureTableExists();
  const status = getDbStatus();

  if (status.provider === 'neon' && pgPool) {
    const res = await pgPool.query(
      'SELECT id, period_type, period_label, start_date, end_date, total_spent, breakdown_json, report_markdown, created_at FROM budget_reports WHERE id = $1',
      [id]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      period_type: row.period_type,
      period_label: row.period_label,
      start_date: row.start_date,
      end_date: row.end_date,
      total_spent: Number(row.total_spent),
      breakdown_json: row.breakdown_json,
      report_markdown: row.report_markdown,
      created_at: row.created_at,
    };
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      'SELECT id, period_type, period_label, start_date, end_date, total_spent, breakdown_json, report_markdown, created_at FROM budget_reports WHERE id = ?'
    );
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      period_type: row.period_type,
      period_label: row.period_label,
      start_date: row.start_date,
      end_date: row.end_date,
      total_spent: Number(row.total_spent),
      breakdown_json: row.breakdown_json,
      report_markdown: row.report_markdown,
      created_at: row.created_at,
    };
  }
  return null;
}

export async function closeDb(): Promise<void> {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
  currentStatus = null;
}

function parseAuditTrail(raw: any): AuditTrailEntry[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getAgendaItems(): Promise<AgendaItem[]> {
  await ensureTableExists();
  const status = getDbStatus();

  if (status.provider === 'neon' && pgPool) {
    const res = await pgPool.query(
      'SELECT id, item_type, title, scheduled_time, status, completed_at, dismissed_at, audit_trail, created_at, updated_at FROM agenda_items ORDER BY scheduled_time ASC'
    );
    return res.rows.map((row) => ({
      id: row.id,
      item_type: row.item_type,
      title: row.title,
      scheduled_time: row.scheduled_time,
      status: row.status as AgendaItemStatus,
      completed_at: row.completed_at || null,
      dismissed_at: row.dismissed_at || null,
      audit_trail: parseAuditTrail(row.audit_trail),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      'SELECT id, item_type, title, scheduled_time, status, completed_at, dismissed_at, audit_trail, created_at, updated_at FROM agenda_items ORDER BY scheduled_time ASC'
    );
    const rows = stmt.all() as any[];
    return rows.map((row) => ({
      id: row.id,
      item_type: row.item_type,
      title: row.title,
      scheduled_time: row.scheduled_time,
      status: row.status as AgendaItemStatus,
      completed_at: row.completed_at || null,
      dismissed_at: row.dismissed_at || null,
      audit_trail: parseAuditTrail(row.audit_trail),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  return [];
}

export async function createAgendaItem(
  input: CreateAgendaItemInput
): Promise<AgendaItem> {
  await ensureTableExists();
  const status = getDbStatus();

  const id = input.id || crypto.randomUUID();
  const item_type = input.item_type;
  const title = input.title;
  const scheduled_time = input.scheduled_time;
  const itemStatus: AgendaItemStatus = input.status || 'pending';
  const created_at = new Date().toISOString();
  const completed_at = itemStatus === 'completed' ? created_at : null;
  const updated_at = input.updated_at || created_at;
  const dismissed_at = itemStatus === 'dismissed' ? created_at : null;

  const initialAudit: AuditTrailEntry[] = input.audit_trail || [
    {
      timestamp: created_at,
      previous_status: null,
      new_status: itemStatus,
      note: 'Item created',
    },
  ];

  const audit_trail_json = JSON.stringify(initialAudit);

  if (status.provider === 'neon' && pgPool) {
    await pgPool.query(
      `INSERT INTO agenda_items (id, item_type, title, scheduled_time, status, completed_at, dismissed_at, audit_trail, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        item_type,
        title,
        scheduled_time,
        itemStatus,
        completed_at,
        dismissed_at,
        audit_trail_json,
        created_at,
        updated_at,
      ]
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      `INSERT INTO agenda_items (id, item_type, title, scheduled_time, status, completed_at, dismissed_at, audit_trail, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(
      id,
      item_type,
      title,
      scheduled_time,
      itemStatus,
      completed_at,
      dismissed_at,
      audit_trail_json,
      created_at,
      updated_at
    );
  }

  return {
    id,
    item_type,
    title,
    scheduled_time,
    status: itemStatus,
    completed_at,
    dismissed_at,
    audit_trail: initialAudit,
    created_at,
    updated_at,
  };
}

export async function updateAgendaItemStatus(
  id: string,
  newStatus: AgendaItemStatus,
  auditNote?: string,
  fallbackData?: { title?: string; item_type?: string; scheduled_time?: string }
): Promise<AgendaItem | null> {
  await ensureTableExists();
  const dbStatus = getDbStatus();
  const now = new Date().toISOString();

  let existing: AgendaItem | null = null;

  if (dbStatus.provider === 'neon' && pgPool) {
    const res = await pgPool.query('SELECT * FROM agenda_items WHERE id = $1', [id]);
    if (res.rows.length > 0) {
      const row = res.rows[0];
      existing = {
        id: row.id,
        item_type: row.item_type,
        title: row.title,
        scheduled_time: row.scheduled_time,
        status: row.status as AgendaItemStatus,
        completed_at: row.completed_at || null,
        dismissed_at: row.dismissed_at || null,
        audit_trail: parseAuditTrail(row.audit_trail),
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    }
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare('SELECT * FROM agenda_items WHERE id = ?');
    const row = stmt.get(id) as any;
    if (row) {
      existing = {
        id: row.id,
        item_type: row.item_type,
        title: row.title,
        scheduled_time: row.scheduled_time,
        status: row.status as AgendaItemStatus,
        completed_at: row.completed_at || null,
        dismissed_at: row.dismissed_at || null,
        audit_trail: parseAuditTrail(row.audit_trail),
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    }
  }

  if (!existing) {
    let inferredTitle = fallbackData?.title || 'Daily Protocol';
    let inferredType: any = fallbackData?.item_type || 'task';

    if (id.startsWith('yoga') || id.includes('yoga')) {
      inferredTitle = 'Daily Adaptive Yoga Routine';
      inferredType = 'yoga';
    } else if (id.startsWith('meditation_night') || id.includes('2100-meditation')) {
      inferredTitle = 'Night Meditation Protocol';
      inferredType = 'meditation';
    } else if (id.startsWith('meditation_midnight') || id.includes('2400-meditation')) {
      inferredTitle = 'Sleep & Relaxation Meditation';
      inferredType = 'meditation';
    } else if (id.startsWith('learning') || id.includes('learn')) {
      inferredTitle = 'Continuous Learning: Recovery & Neuroplasticity';
      inferredType = 'learning';
    } else if (id.startsWith('pain_log_reminder') || id.includes('pain')) {
      inferredTitle = 'Log Pain Level';
      inferredType = 'task';
    } else if (id.startsWith('hydro') || id.includes('hydro')) {
      inferredTitle = 'Hydrotherapy Pool Rehabilitation';
      inferredType = 'task';
    } else if (id.startsWith('wash') || id.includes('wash')) {
      inferredTitle = 'Weather-Optimized Washing';
      inferredType = 'task';
    } else if (id.startsWith('task_deakin') || id.includes('deakin')) {
      inferredTitle = 'Call Deakin to unlock MFA';
      inferredType = 'task';
    }

    const completed_at = newStatus === 'completed' ? now : null;
    const dismissed_at = newStatus === 'dismissed' ? now : null;

    return await createAgendaItem({
      id,
      title: inferredTitle,
      item_type: inferredType,
      scheduled_time: fallbackData?.scheduled_time || now,
      status: newStatus,
      audit_trail: [
        {
          timestamp: now,
          new_status: newStatus,
          note: auditNote || `Auto-created and set status to ${newStatus}`,
        },
      ],
    });
  }

  const prevStatus = existing.status;
  const completed_at =
    newStatus === 'completed' ? now : prevStatus === 'completed' ? existing.completed_at : null;
  const dismissed_at =
    newStatus === 'dismissed' ? now : prevStatus === 'dismissed' ? existing.dismissed_at : null;

  const newAuditEntry: AuditTrailEntry = {
    timestamp: now,
    previous_status: prevStatus,
    new_status: newStatus,
    note: auditNote || `Status updated from ${prevStatus} to ${newStatus}`,
  };

  const updatedAuditTrail = [...existing.audit_trail, newAuditEntry];
  const audit_trail_json = JSON.stringify(updatedAuditTrail);

  if (dbStatus.provider === 'neon' && pgPool) {
    await pgPool.query(
      `UPDATE agenda_items
       SET status = $1, completed_at = $2, dismissed_at = $3, audit_trail = $4, updated_at = $5
       WHERE id = $6`,
      [newStatus, completed_at, dismissed_at, audit_trail_json, now, id]
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      `UPDATE agenda_items
       SET status = ?, completed_at = ?, dismissed_at = ?, audit_trail = ?, updated_at = ?
       WHERE id = ?`
    );
    stmt.run(newStatus, completed_at, dismissed_at, audit_trail_json, now, id);
  }

  return {
    ...existing,
    status: newStatus,
    completed_at,
    dismissed_at,
    audit_trail: updatedAuditTrail,
    updated_at: now,
  };
}

// --- Notes persistence ---

export async function getNotes(): Promise<Note[]> {
  await ensureTableExists();
  const status = getDbStatus();

  if (status.provider === 'neon' && pgPool) {
    const res = await pgPool.query(
      'SELECT id, content, author, pinned, "isArchived", created_at, updated_at FROM notes ORDER BY created_at DESC'
    );
    return res.rows.map((row) => ({
      id: row.id,
      content: row.content,
      author: row.author,
      pinned: row.pinned,
      isArchived: row.isArchived,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      'SELECT id, content, author, pinned, isArchived, created_at, updated_at FROM notes ORDER BY created_at DESC'
    );
    const rows = stmt.all() as any[];
    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      author: row.author,
      pinned: Boolean(row.pinned),
      isArchived: Boolean(row.isArchived),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  return [];
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  await ensureTableExists();
  const status = getDbStatus();

  const id = input.id || crypto.randomUUID();
  const content = input.content;
  const author = input.author || 'user';
  const pinned = input.pinned || false;
  const isArchived = input.isArchived || false;
  const now = new Date().toISOString();

  if (status.provider === 'neon' && pgPool) {
    await pgPool.query(
      `INSERT INTO notes (id, content, author, pinned, "isArchived", created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, content, author, pinned, isArchived, now, now]
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      `INSERT INTO notes (id, content, author, pinned, isArchived, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    // SQLite stores booleans as 0 or 1 usually, but let's just pass boolean/number
    stmt.run(id, content, author, pinned ? 1 : 0, isArchived ? 1 : 0, now, now);
  }

  return {
    id,
    content,
    author,
    pinned,
    isArchived,
    created_at: now,
    updated_at: now,
  };
}

export async function updateNote(
  id: string,
  updates: Partial<{ content: string; pinned: boolean; isArchived: boolean }>
): Promise<Note | null> {
  await ensureTableExists();
  const status = getDbStatus();
  const now = new Date().toISOString();

  let existing: Note | null = null;
  if (status.provider === 'neon' && pgPool) {
    const res = await pgPool.query('SELECT * FROM notes WHERE id = $1', [id]);
    if (res.rows.length > 0) existing = {
      id: res.rows[0].id, content: res.rows[0].content, author: res.rows[0].author, 
      pinned: res.rows[0].pinned, isArchived: res.rows[0].isArchived, 
      created_at: res.rows[0].created_at, updated_at: res.rows[0].updated_at
    };
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare('SELECT * FROM notes WHERE id = ?');
    const row = stmt.get(id) as any;
    if (row) existing = {
      id: row.id, content: row.content, author: row.author,
      pinned: Boolean(row.pinned), isArchived: Boolean(row.isArchived),
      created_at: row.created_at, updated_at: row.updated_at
    };
  }

  if (!existing) return null;

  const newContent = updates.content !== undefined ? updates.content : existing.content;
  const newPinned = updates.pinned !== undefined ? updates.pinned : existing.pinned;
  const newIsArchived = updates.isArchived !== undefined ? updates.isArchived : existing.isArchived;

  if (status.provider === 'neon' && pgPool) {
    await pgPool.query(
      `UPDATE notes SET content = $1, pinned = $2, "isArchived" = $3, updated_at = $4 WHERE id = $5`,
      [newContent, newPinned, newIsArchived, now, id]
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      `UPDATE notes SET content = ?, pinned = ?, isArchived = ?, updated_at = ? WHERE id = ?`
    );
    stmt.run(newContent, newPinned ? 1 : 0, newIsArchived ? 1 : 0, now, id);
  }

  return {
    ...existing,
    content: newContent,
    pinned: newPinned,
    isArchived: newIsArchived,
    updated_at: now
  };
}

export async function deleteNote(id: string): Promise<boolean> {
  await ensureTableExists();
  const status = getDbStatus();

  if (status.provider === 'neon' && pgPool) {
    const res = await pgPool.query('DELETE FROM notes WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare('DELETE FROM notes WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  return false;
}

// --- Pain logs persistence ---

export async function getPainLogsFromDb(): Promise<PainLogRecord[]> {
  await ensureTableExists();
  const status = getDbStatus();

  if (status.provider === 'neon' && pgPool) {
    const res = await pgPool.query(
      'SELECT id, score, locations, mood, notes, created_at FROM pain_logs ORDER BY created_at DESC'
    );
    return res.rows.map((row) => ({
      id: row.id,
      score: Number(row.score),
      locations: typeof row.locations === 'string' ? JSON.parse(row.locations) : row.locations,
      mood: row.mood || null,
      notes: row.notes || null,
      created_at: row.created_at,
    }));
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      'SELECT id, score, locations, mood, notes, created_at FROM pain_logs ORDER BY created_at DESC'
    );
    const rows = stmt.all() as any[];
    return rows.map((row) => ({
      id: row.id,
      score: Number(row.score),
      locations: typeof row.locations === 'string' ? JSON.parse(row.locations) : row.locations,
      mood: row.mood || null,
      notes: row.notes || null,
      created_at: row.created_at,
    }));
  }

  return [];
}

export async function createPainLog(input: CreatePainLogInput): Promise<PainLogRecord> {
  await ensureTableExists();
  const status = getDbStatus();

  const id = input.id || crypto.randomUUID();
  const score = input.score;
  const locationsJson = JSON.stringify(
    input.locations.map((l) => ({
      area: l.area.trim(),
      side: l.side || 'unspecified',
      percentage: typeof l.percentage === 'number' ? l.percentage : l.weight || 0,
    }))
  );
  const mood = input.mood?.trim() || null;
  const notes = input.notes?.trim() || null;
  const createdAt = input.created_at || new Date().toISOString();

  if (status.provider === 'neon' && pgPool) {
    await pgPool.query(
      `INSERT INTO pain_logs (id, score, locations, mood, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, score, locationsJson, mood, notes, createdAt]
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      `INSERT INTO pain_logs (id, score, locations, mood, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    stmt.run(id, score, locationsJson, mood, notes, createdAt);
  }

  return {
    id,
    score,
    locations: JSON.parse(locationsJson),
    mood,
    notes,
    created_at: createdAt,
  };
}

export async function saveExercisePreference(record: {
  id?: string;
  routineId: string;
  routineTitle: string;
  prePainScore: number;
  postPainScore: number;
  reliefDelta: number;
  notes?: string;
  timestamp?: string;
}): Promise<ExercisePreferenceRecord> {
  await ensureTableExists();
  const status = getDbStatus();

  const id = record.id || `pref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const routineId = record.routineId;
  const routineTitle = record.routineTitle;
  const prePain = record.prePainScore;
  const postPain = record.postPainScore;
  const reliefDelta = record.reliefDelta;
  const notes = record.notes?.trim() || null;
  const now = record.timestamp || new Date().toISOString();

  if (status.provider === 'neon' && pgPool) {
    await pgPool.query(
      `INSERT INTO exercise_preferences (id, routine_id, routine_title, pre_pain_score, post_pain_score, relief_delta, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, routineId, routineTitle, prePain, postPain, reliefDelta, notes, now]
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      `INSERT INTO exercise_preferences (id, routine_id, routine_title, pre_pain_score, post_pain_score, relief_delta, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(id, routineId, routineTitle, prePain, postPain, reliefDelta, notes, now);
  }

  return {
    id,
    routine_id: routineId,
    routine_title: routineTitle,
    pre_pain_score: prePain,
    post_pain_score: postPain,
    relief_delta: reliefDelta,
    notes: notes || undefined,
    created_at: now,
  };
}

export async function getExercisePreferences(): Promise<ExercisePreferenceRecord[]> {
  await ensureTableExists();
  const status = getDbStatus();

  if (status.provider === 'neon' && pgPool) {
    const res = await pgPool.query(
      `SELECT id, routine_id, routine_title, pre_pain_score, post_pain_score, relief_delta, notes, created_at
       FROM exercise_preferences ORDER BY created_at DESC`
    );
    return res.rows.map((r: any) => ({
      id: r.id,
      routine_id: r.routine_id,
      routine_title: r.routine_title,
      pre_pain_score: Number(r.pre_pain_score),
      post_pain_score: Number(r.post_pain_score),
      relief_delta: Number(r.relief_delta),
      notes: r.notes || undefined,
      created_at: r.created_at,
    }));
  }

  if (sqliteDb) {
    const rows = sqliteDb
      .prepare(
        `SELECT id, routine_id, routine_title, pre_pain_score, post_pain_score, relief_delta, notes, created_at
         FROM exercise_preferences ORDER BY created_at DESC`
      )
      .all() as any[];

    return rows.map((r) => ({
      id: r.id,
      routine_id: r.routine_id,
      routine_title: r.routine_title,
      pre_pain_score: Number(r.pre_pain_score),
      post_pain_score: Number(r.post_pain_score),
      relief_delta: Number(r.relief_delta),
      notes: r.notes || undefined,
      created_at: r.created_at,
    }));
  }

  return [];
}




export async function rescheduleAgendaItem(
  id: string,
  newDate: string,
  fallbackData?: { title?: string; item_type?: string }
): Promise<AgendaItem | null> {
  await ensureTableExists();
  const dbStatus = getDbStatus();
  const now = new Date().toISOString();

  let existing: AgendaItem | null = null;
  if (dbStatus.provider === 'neon' && pgPool) {
    const res = await pgPool.query('SELECT * FROM agenda_items WHERE id = $1', [id]);
    if (res.rows.length > 0) {
      const row = res.rows[0];
      existing = { ...row, audit_trail: parseAuditTrail(row.audit_trail) };
    }
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare('SELECT * FROM agenda_items WHERE id = ?');
    const row = stmt.get(id) as any;
    if (row) {
      existing = { ...row, audit_trail: parseAuditTrail(row.audit_trail) };
    }
  }

  if (!existing) {
    let inferredTitle = fallbackData?.title || 'Daily Protocol';
    let inferredType: any = fallbackData?.item_type || 'task';

    if (id.startsWith('yoga')) {
      inferredTitle = 'Daily Adaptive Yoga Routine';
      inferredType = 'yoga';
    } else if (id.startsWith('meditation_night')) {
      inferredTitle = 'Night Meditation Protocol';
      inferredType = 'meditation';
    } else if (id.startsWith('meditation_midnight')) {
      inferredTitle = 'Sleep & Relaxation Meditation';
      inferredType = 'meditation';
    } else if (id.startsWith('learning')) {
      inferredTitle = 'Continuous Learning: Recovery & Neuroplasticity';
      inferredType = 'learning';
    } else if (id.startsWith('pain_log_reminder')) {
      inferredTitle = 'Log Pain Level';
      inferredType = 'task';
    } else if (id.startsWith('task_deakin')) {
      inferredTitle = 'Call Deakin to unlock MFA';
      inferredType = 'task';
    }

    return await createAgendaItem({
      id,
      title: inferredTitle,
      item_type: inferredType,
      scheduled_time: newDate,
      status: 'pending',
      audit_trail: [
        {
          timestamp: now,
          new_status: 'pending',
          note: `Auto-created and rescheduled to ${newDate}`,
        },
      ],
    });
  }

  const newAuditEntry: AuditTrailEntry = {
    timestamp: now,
    previous_status: existing.status,
    new_status: existing.status,
    note: `Rescheduled to ${newDate}`,
  };

  const updatedAuditTrail = [...existing.audit_trail, newAuditEntry];
  const audit_trail_json = JSON.stringify(updatedAuditTrail);

  if (dbStatus.provider === 'neon' && pgPool) {
    await pgPool.query(
      `UPDATE agenda_items SET scheduled_time = $1, updated_at = $2, audit_trail = $3 WHERE id = $4`,
      [newDate, now, audit_trail_json, id]
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      `UPDATE agenda_items SET scheduled_time = ?, updated_at = ?, audit_trail = ? WHERE id = ?`
    );
    stmt.run(newDate, now, audit_trail_json, id);
  }

  return { ...existing, scheduled_time: newDate, updated_at: now, audit_trail: updatedAuditTrail };
}

// --- Bills Subscriptions ---

export async function createBillSubscription(input: CreateBillSubscriptionInput): Promise<BillSubscription> {
  await ensureTableExists();
  const status = getDbStatus();
  const id = input.id || `bill_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const created_at = new Date().toISOString();
  const billStatus = input.status || 'active';
  
  if (status.provider === 'neon' && pgPool) {
    await pgPool.query(
      `INSERT INTO bills_subscriptions (id, title, amount, frequency, next_due_date, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, input.title, input.amount, input.frequency, input.next_due_date, billStatus, created_at]
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      `INSERT INTO bills_subscriptions (id, title, amount, frequency, next_due_date, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(id, input.title, input.amount, input.frequency, input.next_due_date, billStatus, created_at);
  } else {
    throw new Error('Database not initialized');
  }

  return {
    id,
    title: input.title,
    amount: input.amount,
    frequency: input.frequency,
    next_due_date: input.next_due_date,
    status: billStatus,
    created_at,
  };
}

export async function getBillSubscriptions(): Promise<BillSubscription[]> {
  await ensureTableExists();
  const status = getDbStatus();

  if (status.provider === 'neon' && pgPool) {
    const res = await pgPool.query(
      'SELECT id, title, amount, frequency, next_due_date, status, created_at FROM bills_subscriptions ORDER BY next_due_date ASC'
    );
    return res.rows.map((r) => ({
      id: r.id, title: r.title, amount: Number(r.amount), frequency: r.frequency, next_due_date: r.next_due_date, status: r.status, created_at: r.created_at
    }));
  } else if (sqliteDb) {
    const rows = sqliteDb.prepare(
      'SELECT id, title, amount, frequency, next_due_date, status, created_at FROM bills_subscriptions ORDER BY next_due_date ASC'
    ).all() as any[];
    return rows.map((r) => ({
      id: r.id, title: r.title, amount: Number(r.amount), frequency: r.frequency, next_due_date: r.next_due_date, status: r.status, created_at: r.created_at
    }));
  }
  return [];
}

// --- Maintenance Records ---

export async function createMaintenanceRecord(input: CreateMaintenanceRecordInput): Promise<MaintenanceRecord> {
  await ensureTableExists();
  const status = getDbStatus();
  const id = input.id || `maint_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const created_at = new Date().toISOString();
  
  if (status.provider === 'neon' && pgPool) {
    await pgPool.query(
      `INSERT INTO maintenance_records (id, title, description, maintenance_date, cost, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, input.title, input.description || null, input.maintenance_date, input.cost, created_at]
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      `INSERT INTO maintenance_records (id, title, description, maintenance_date, cost, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    stmt.run(id, input.title, input.description || null, input.maintenance_date, input.cost, created_at);
  } else {
    throw new Error('Database not initialized');
  }

  return {
    id,
    title: input.title,
    description: input.description || '',
    maintenance_date: input.maintenance_date,
    cost: input.cost,
    created_at,
  };
}

export async function getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
  await ensureTableExists();
  const status = getDbStatus();

  if (status.provider === 'neon' && pgPool) {
    const res = await pgPool.query(
      'SELECT id, title, description, maintenance_date, cost, created_at FROM maintenance_records ORDER BY maintenance_date DESC'
    );
    return res.rows.map((r) => ({
      id: r.id, title: r.title, description: r.description || '', maintenance_date: r.maintenance_date, cost: Number(r.cost), created_at: r.created_at
    }));
  } else if (sqliteDb) {
    const rows = sqliteDb.prepare(
      'SELECT id, title, description, maintenance_date, cost, created_at FROM maintenance_records ORDER BY maintenance_date DESC'
    ).all() as any[];
    return rows.map((r) => ({
      id: r.id, title: r.title, description: r.description || '', maintenance_date: r.maintenance_date, cost: Number(r.cost), created_at: r.created_at
    }));
  }
  return [];
}

// --- Medical Receipts ---

export async function createMedicalReceipt(input: CreateMedicalReceiptInput): Promise<MedicalReceipt> {
  await ensureTableExists();
  const status = getDbStatus();
  const id = input.id || `med_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const created_at = new Date().toISOString();
  
  if (status.provider === 'neon' && pgPool) {
    await pgPool.query(
      `INSERT INTO medical_receipts (id, provider, service, amount, receipt_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, input.provider, input.service, input.amount, input.receipt_date, created_at]
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      `INSERT INTO medical_receipts (id, provider, service, amount, receipt_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    stmt.run(id, input.provider, input.service, input.amount, input.receipt_date, created_at);
  } else {
    throw new Error('Database not initialized');
  }

  return {
    id,
    provider: input.provider,
    service: input.service,
    amount: input.amount,
    receipt_date: input.receipt_date,
    created_at,
  };
}

export async function getMedicalReceipts(): Promise<MedicalReceipt[]> {
  await ensureTableExists();
  const status = getDbStatus();

  if (status.provider === 'neon' && pgPool) {
    const res = await pgPool.query(
      'SELECT id, provider, service, amount, receipt_date, created_at FROM medical_receipts ORDER BY receipt_date DESC'
    );
    return res.rows.map((r) => ({
      id: r.id, provider: r.provider, service: r.service, amount: Number(r.amount), receipt_date: r.receipt_date, created_at: r.created_at
    }));
  } else if (sqliteDb) {
    const rows = sqliteDb.prepare(
      'SELECT id, provider, service, amount, receipt_date, created_at FROM medical_receipts ORDER BY receipt_date DESC'
    ).all() as any[];
    return rows.map((r) => ({
      id: r.id, provider: r.provider, service: r.service, amount: Number(r.amount), receipt_date: r.receipt_date, created_at: r.created_at
    }));
  }
  return [];
}

export async function getLearningProgress(encyclopediaId: string): Promise<EncyclopediaProgress | null> {
  await ensureTableExists();
  const status = getDbStatus();

  if (status.provider === 'neon' && pgPool) {
    const res = await pgPool.query(
      'SELECT encyclopedia_id, current_chapter_index, completed_chapters, last_read_at, created_at, updated_at FROM learning_progress WHERE encyclopedia_id = $1',
      [encyclopediaId]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      encyclopedia_id: r.encyclopedia_id,
      current_chapter_index: Number(r.current_chapter_index) || 0,
      completed_chapters: typeof r.completed_chapters === 'string' ? JSON.parse(r.completed_chapters) : (r.completed_chapters || []),
      last_read_at: r.last_read_at,
      created_at: r.created_at,
      updated_at: r.updated_at
    };
  } else if (sqliteDb) {
    const row = sqliteDb.prepare(
      'SELECT encyclopedia_id, current_chapter_index, completed_chapters, last_read_at, created_at, updated_at FROM learning_progress WHERE encyclopedia_id = ?'
    ).get(encyclopediaId) as any;
    if (!row) return null;
    return {
      encyclopedia_id: row.encyclopedia_id,
      current_chapter_index: Number(row.current_chapter_index) || 0,
      completed_chapters: typeof row.completed_chapters === 'string' ? JSON.parse(row.completed_chapters) : (row.completed_chapters || []),
      last_read_at: row.last_read_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
  return null;
}

export async function getAllLearningProgress(): Promise<Record<string, EncyclopediaProgress>> {
  await ensureTableExists();
  const status = getDbStatus();
  const result: Record<string, EncyclopediaProgress> = {};

  if (status.provider === 'neon' && pgPool) {
    const res = await pgPool.query('SELECT encyclopedia_id, current_chapter_index, completed_chapters, last_read_at, created_at, updated_at FROM learning_progress');
    for (const r of res.rows) {
      result[r.encyclopedia_id] = {
        encyclopedia_id: r.encyclopedia_id,
        current_chapter_index: Number(r.current_chapter_index) || 0,
        completed_chapters: typeof r.completed_chapters === 'string' ? JSON.parse(r.completed_chapters) : (r.completed_chapters || []),
        last_read_at: r.last_read_at,
        created_at: r.created_at,
        updated_at: r.updated_at
      };
    }
  } else if (sqliteDb) {
    const rows = sqliteDb.prepare('SELECT encyclopedia_id, current_chapter_index, completed_chapters, last_read_at, created_at, updated_at FROM learning_progress').all() as any[];
    for (const row of rows) {
      result[row.encyclopedia_id] = {
        encyclopedia_id: row.encyclopedia_id,
        current_chapter_index: Number(row.current_chapter_index) || 0,
        completed_chapters: typeof row.completed_chapters === 'string' ? JSON.parse(row.completed_chapters) : (row.completed_chapters || []),
        last_read_at: row.last_read_at,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    }
  }
  return result;
}

export async function saveLearningProgress(
  encyclopediaId: string,
  chapterIndex: number,
  completedChapterId?: string
): Promise<EncyclopediaProgress> {
  await ensureTableExists();
  const status = getDbStatus();
  const existing = await getLearningProgress(encyclopediaId);
  const now = new Date().toISOString();

  let completedList: string[] = existing?.completed_chapters || [];
  if (completedChapterId && !completedList.includes(completedChapterId)) {
    completedList = [...completedList, completedChapterId];
  }

  const record: EncyclopediaProgress = {
    encyclopedia_id: encyclopediaId,
    current_chapter_index: chapterIndex,
    completed_chapters: completedList,
    last_read_at: now,
    created_at: existing?.created_at || now,
    updated_at: now
  };

  if (status.provider === 'neon' && pgPool) {
    await pgPool.query(
      `INSERT INTO learning_progress (encyclopedia_id, current_chapter_index, completed_chapters, last_read_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (encyclopedia_id)
       DO UPDATE SET current_chapter_index = $2, completed_chapters = $3, last_read_at = $4, updated_at = $6`,
      [record.encyclopedia_id, record.current_chapter_index, JSON.stringify(record.completed_chapters), record.last_read_at, record.created_at, record.updated_at]
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      `INSERT INTO learning_progress (encyclopedia_id, current_chapter_index, completed_chapters, last_read_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(encyclopedia_id)
       DO UPDATE SET current_chapter_index = excluded.current_chapter_index, completed_chapters = excluded.completed_chapters, last_read_at = excluded.last_read_at, updated_at = excluded.updated_at`
    );
    stmt.run(record.encyclopedia_id, record.current_chapter_index, JSON.stringify(record.completed_chapters), record.last_read_at, record.created_at, record.updated_at);
  }

  return record;
}

export async function createChatLog(role: 'user' | 'rumble', text: string): Promise<ChatLogRecord> {
  await ensureTableExists();
  const id = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const created_at = new Date().toISOString();
  
  const status = getDbStatus();
  if (status.provider === 'neon' && pgPool) {
    await pgPool.query('INSERT INTO chat_logs(id, role, text, created_at) VALUES($1, $2, $3, $4)', [id, role, text, created_at]);
  } else if (sqliteDb) {
    sqliteDb.prepare('INSERT INTO chat_logs (id, role, text, created_at) VALUES (?, ?, ?, ?)').run(id, role, text, created_at);
  }
  
  return { id, role, text, created_at };
}

export async function getChatLogs(hours: number = 24): Promise<ChatLogRecord[]> {
  await ensureTableExists();
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const status = getDbStatus();
  
  if (status.provider === 'neon' && pgPool) {
    const res = await pgPool.query('SELECT id, role, text, created_at FROM chat_logs WHERE created_at >= $1 ORDER BY created_at ASC', [cutoff]);
    return res.rows;
  } else if (sqliteDb) {
    const rows = sqliteDb.prepare('SELECT id, role, text, created_at FROM chat_logs WHERE created_at >= ? ORDER BY created_at ASC').all(cutoff);
    return rows;
  }
  return [];
}

export async function createSmsMessage(input: CreateSmsMessageInput): Promise<SmsMessage> {
  await ensureTableExists();
  const id = `sms_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();
  const received_at = input.received_at || now;

  const newMessage: SmsMessage = {
    id,
    sender: input.sender,
    body: input.body,
    received_at,
    read: false,
    created_at: now,
  };

  const status = getDbStatus();
  if (status.provider === 'neon' && pgPool) {
    const text = 'INSERT INTO sms_messages(id, sender, body, received_at, read, created_at) VALUES($1, $2, $3, $4, $5, $6)';
    const values = [newMessage.id, newMessage.sender, newMessage.body, newMessage.received_at, newMessage.read, newMessage.created_at];
    await pgPool.query(text, values);
  } else if (status.provider === 'sqlite' && sqliteDb) {
    const stmt = sqliteDb.prepare(
      'INSERT INTO sms_messages (id, sender, body, received_at, read, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run(newMessage.id, newMessage.sender, newMessage.body, newMessage.received_at, newMessage.read, newMessage.created_at);
  } else {
    throw new Error('Database not initialized');
  }

  return newMessage;
}

export async function getSmsMessages(options?: { limit?: number; unreadOnly?: boolean }): Promise<SmsMessage[]> {
  await ensureTableExists();
  const status = getDbStatus();

  const unreadOnly = options?.unreadOnly || false;
  const limit = options?.limit;

  if (status.provider === 'neon' && pgPool) {
    let query = 'SELECT * FROM sms_messages';
    const params: any[] = [];
    if (unreadOnly) {
      query += ' WHERE read = FALSE';
    }
    query += ' ORDER BY received_at DESC';
    if (limit && limit > 0) {
      params.push(limit);
      query += ` LIMIT $${params.length}`;
    }
    const res = await pgPool.query(query, params);
    return res.rows.map((r: any) => ({
      ...r,
      read: Boolean(r.read),
    }));
  } else if (status.provider === 'sqlite' && sqliteDb) {
    let query = 'SELECT * FROM sms_messages';
    if (unreadOnly) {
      query += ' WHERE read = false';
    }
    query += ' ORDER BY received_at DESC';
    if (limit && limit > 0) {
      query += ` LIMIT ${limit}`;
    }
    const stmt = sqliteDb.prepare(query);
    const rows = stmt.all();
    return rows.map((r: any) => ({
      ...r,
      read: Boolean(r.read),
    }));
  } else {
    throw new Error('Database not initialized');
  }
}

export async function markSmsRead(id: string): Promise<boolean> {
  await ensureTableExists();
  const status = getDbStatus();

  if (status.provider === 'neon' && pgPool) {
    const res = await pgPool.query('UPDATE sms_messages SET read = TRUE WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  } else if (status.provider === 'sqlite' && sqliteDb) {
    const stmt = sqliteDb.prepare('UPDATE sms_messages SET read = TRUE WHERE id = ?');
    const result = stmt.run(id);
    return (result.changes ?? 0) > 0;
  } else {
    throw new Error('Database not initialized');
  }
}

export async function sendSms(to: string, body: string): Promise<{ sid: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials missing: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER');
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams();
  params.append('To', to);
  params.append('From', fromNumber);
  params.append('Body', body);

  const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Twilio SMS send failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  await createSmsMessage({
    sender: 'Rumble OS',
    body,
    received_at: new Date().toISOString(),
  });

  return { sid: data.sid };
}

export async function savePendingAction(actionData: any): Promise<PendingChatAction> {
  await ensureTableExists();
  const id = `action_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();
  const status = getDbStatus();

  const record: PendingChatAction = {
    id,
    action_data: actionData,
    created_at: now,
    resolved_at: null,
  };

  if (status.provider === 'neon' && pgPool) {
    await pgPool.query(
      'INSERT INTO pending_chat_actions(id, action_data, created_at, resolved_at) VALUES($1, $2::jsonb, $3, $4)',
      [id, JSON.stringify(actionData), now, null]
    );
  } else if (status.provider === 'sqlite' && sqliteDb) {
    sqliteDb.prepare(
      'INSERT INTO pending_chat_actions (id, action_data, created_at, resolved_at) VALUES (?, ?, ?, ?)'
    ).run(id, JSON.stringify(actionData), now, null);
  } else {
    throw new Error('Database not initialized');
  }

  return record;
}

export async function getPendingAction(): Promise<PendingChatAction | null> {
  await ensureTableExists();
  const status = getDbStatus();

  if (status.provider === 'neon' && pgPool) {
    const res = await pgPool.query(
      'SELECT id, action_data, created_at, resolved_at FROM pending_chat_actions WHERE resolved_at IS NULL ORDER BY created_at DESC LIMIT 1'
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      action_data: typeof r.action_data === 'string' ? JSON.parse(r.action_data) : r.action_data,
      created_at: r.created_at,
      resolved_at: r.resolved_at,
    };
  } else if (status.provider === 'sqlite' && sqliteDb) {
    const row: any = sqliteDb.prepare(
      'SELECT id, action_data, created_at, resolved_at FROM pending_chat_actions WHERE resolved_at IS NULL ORDER BY created_at DESC LIMIT 1'
    ).get();
    if (!row) return null;
    return {
      id: row.id,
      action_data: typeof row.action_data === 'string' ? JSON.parse(row.action_data) : row.action_data,
      created_at: row.created_at,
      resolved_at: row.resolved_at,
    };
  }
  return null;
}

export async function resolvePendingAction(id?: string): Promise<boolean> {
  await ensureTableExists();
  const status = getDbStatus();
  const now = new Date().toISOString();

  if (status.provider === 'neon' && pgPool) {
    if (id) {
      const res = await pgPool.query(
        'UPDATE pending_chat_actions SET resolved_at = $1 WHERE id = $2 AND resolved_at IS NULL',
        [now, id]
      );
      return (res.rowCount ?? 0) > 0;
    } else {
      const res = await pgPool.query(
        'UPDATE pending_chat_actions SET resolved_at = $1 WHERE resolved_at IS NULL',
        [now]
      );
      return (res.rowCount ?? 0) > 0;
    }
  } else if (status.provider === 'sqlite' && sqliteDb) {
    if (id) {
      const stmt = sqliteDb.prepare('UPDATE pending_chat_actions SET resolved_at = ? WHERE id = ? AND resolved_at IS NULL');
      const result = stmt.run(now, id);
      return (result.changes ?? 0) > 0;
    } else {
      const stmt = sqliteDb.prepare('UPDATE pending_chat_actions SET resolved_at = ? WHERE resolved_at IS NULL');
      const result = stmt.run(now);
      return (result.changes ?? 0) > 0;
    }
  }
  return false;
}

// --- Tasks persistence (Google Tasks 2-Way Sync) ---

export async function getTasksFromDb(options?: {
  taskListId?: string;
  includeCompleted?: boolean;
}): Promise<TaskRecord[]> {
  await ensureTableExists();
  const status = getDbStatus();
  const taskListId = options?.taskListId || '@default';
  const includeCompleted = options?.includeCompleted ?? true;

  if (status.provider === 'neon' && pgPool) {
    let query = 'SELECT id, google_id, task_list_id, title, notes, status, due, completed_at, deleted, isUrgent, created_at, updated_at FROM tasks WHERE deleted = FALSE AND task_list_id = $1';
    const params: any[] = [taskListId];
    if (!includeCompleted) {
      query += ' AND status = $2';
      params.push('needsAction');
    }
    query += ' ORDER BY due ASC NULLS LAST, created_at DESC';
    const res = await pgPool.query(query, params);
    return res.rows.map((row) => ({
      id: row.id,
      google_id: row.google_id || null,
      task_list_id: row.task_list_id,
      title: row.title,
      notes: row.notes || null,
      status: row.status,
      due: row.due || null,
      completed_at: row.completed_at || null,
      deleted: Boolean(row.deleted),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } else if (sqliteDb) {
    let query = 'SELECT id, google_id, task_list_id, title, notes, status, due, completed_at, deleted, created_at, updated_at FROM tasks WHERE deleted = 0 AND task_list_id = ?';
    const params: any[] = [taskListId];
    if (!includeCompleted) {
      query += ' AND status = ?';
      params.push('needsAction');
    }
    query += ' ORDER BY due ASC, created_at DESC';
    const stmt = sqliteDb.prepare(query);
    const rows = (stmt.all ? stmt.all(...params) : []) as any[];
    return rows.map((row) => ({
      id: row.id,
      google_id: row.google_id || null,
      task_list_id: row.task_list_id,
      title: row.title,
      notes: row.notes || null,
      status: row.status,
      due: row.due || null,
      completed_at: row.completed_at || null,
      deleted: Boolean(row.deleted),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  return [];
}

export async function createTaskInDb(input: CreateTaskInput): Promise<TaskRecord> {
  await ensureTableExists();
  const status = getDbStatus();

  const id = input.id || crypto.randomUUID();
  const google_id = input.google_id || null;
  const task_list_id = input.task_list_id || '@default';
  const title = input.title;
  const notes = input.notes || null;
  const taskStatus: TaskStatus = input.status || 'needsAction';
  const due = input.due || null;
  const completed_at = input.completed_at || (taskStatus === 'completed' ? new Date().toISOString() : null);
  const deleted = input.deleted || false;
  const isUrgent = input.isUrgent || false;
  const now = new Date().toISOString();

  if (status.provider === 'neon' && pgPool) {
    await pgPool.query(
      `INSERT INTO tasks (id, google_id, task_list_id, title, notes, status, due, completed_at, deleted, isUrgent, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [id, google_id, task_list_id, title, notes, taskStatus, due, completed_at, deleted, isUrgent, now, now]
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      `INSERT INTO tasks (id, google_id, task_list_id, title, notes, status, due, completed_at, deleted, isUrgent, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(id, google_id, task_list_id, title, notes, taskStatus, due, completed_at, deleted ? 1 : 0, isUrgent ? 1 : 0, now, now);
  }

  return {
    id,
    google_id,
    task_list_id,
    title,
    notes,
    status: taskStatus,
    due,
    completed_at,
    deleted,
    isUrgent,
    created_at: now,
    updated_at: now,
  };
}

export async function updateTaskInDb(
  id: string,
  updates: Partial<CreateTaskInput>
): Promise<TaskRecord | null> {
  await ensureTableExists();
  const status = getDbStatus();
  const now = new Date().toISOString();

  let existing: TaskRecord | null = null;
  if (status.provider === 'neon' && pgPool) {
    const res = await pgPool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (res.rows.length > 0) {
      const r = res.rows[0];
      existing = {
        id: r.id,
        google_id: r.google_id || null,
        task_list_id: r.task_list_id,
        title: r.title,
        notes: r.notes || null,
        status: r.status,
        due: r.due || null,
        completed_at: r.completed_at || null,
        deleted: Boolean(r.deleted),
        isUrgent: Boolean(r.isUrgent),
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    }
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare('SELECT * FROM tasks WHERE id = ?');
    const r = stmt.get ? stmt.get(id) : null;
    if (r) {
      existing = {
        id: r.id,
        google_id: r.google_id || null,
        task_list_id: r.task_list_id,
        title: r.title,
        notes: r.notes || null,
        status: r.status,
        due: r.due || null,
        completed_at: r.completed_at || null,
        deleted: Boolean(r.deleted),
        isUrgent: Boolean(r.isUrgent),
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    }
  }

  if (!existing) return null;

  const newTitle = updates.title !== undefined ? updates.title : existing.title;
  const newNotes = updates.notes !== undefined ? updates.notes : existing.notes;
  const newStatus = updates.status !== undefined ? updates.status : existing.status;
  const newDue = updates.due !== undefined ? updates.due : existing.due;
  let newCompletedAt = updates.completed_at !== undefined ? updates.completed_at : existing.completed_at;
  if (updates.status === 'completed' && !newCompletedAt) {
    newCompletedAt = now;
  } else if (updates.status === 'needsAction') {
    newCompletedAt = null;
  }
  const newDeleted = updates.deleted !== undefined ? updates.deleted : existing.deleted;
  const newIsUrgent = updates.isUrgent !== undefined ? updates.isUrgent : existing.isUrgent;
  const newGoogleId = updates.google_id !== undefined ? updates.google_id : existing.google_id;

  if (status.provider === 'neon' && pgPool) {
    await pgPool.query(
      `UPDATE tasks SET title = $1, notes = $2, status = $3, due = $4, completed_at = $5, deleted = $6, google_id = $7, updated_at = $8 WHERE id = $9`,
      [newTitle, newNotes, newStatus, newDue, newCompletedAt, newDeleted, newGoogleId, now, id]
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      `UPDATE tasks SET title = ?, notes = ?, status = ?, due = ?, completed_at = ?, deleted = ?, google_id = ?, updated_at = ? WHERE id = ?`
    );
    stmt.run(newTitle, newNotes, newStatus, newDue, newCompletedAt, newDeleted ? 1 : 0, newGoogleId, now, id);
  }

  return {
    ...existing,
    title: newTitle,
    notes: newNotes,
    status: newStatus,
    due: newDue,
    completed_at: newCompletedAt,
    deleted: newDeleted,
    google_id: newGoogleId,
    updated_at: now,
  };
}

export async function deleteTaskInDb(id: string): Promise<boolean> {
  await ensureTableExists();
  const status = getDbStatus();

  if (status.provider === 'neon' && pgPool) {
    const res = await pgPool.query('DELETE FROM tasks WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare('DELETE FROM tasks WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  return false;
}



