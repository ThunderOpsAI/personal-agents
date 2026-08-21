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
  BillSubscription,
  CreateBillSubscriptionInput,
  CREATE_BILLS_SUBSCRIPTIONS_TABLE_SQL,
  MaintenanceRecord,
  CreateMaintenanceRecordInput,
  CREATE_MAINTENANCE_RECORDS_TABLE_SQL,
  MedicalReceipt,
  CreateMedicalReceiptInput,
  CREATE_MEDICAL_RECEIPTS_TABLE_SQL
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
      const dbPath = overrideDbPath || process.env.SQLITE_DB_PATH || 'agenda.db';
      sqliteDb = { prepare: () => ({ run: () => {}, all: () => [], get: () => null }), exec: () => {}, close: () => {} };
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
      await pgPool.query(CREATE_BILLS_SUBSCRIPTIONS_TABLE_SQL);
      await pgPool.query(CREATE_MAINTENANCE_RECORDS_TABLE_SQL);
      await pgPool.query(CREATE_MEDICAL_RECEIPTS_TABLE_SQL);
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
      sqliteDb.exec(CREATE_BILLS_SUBSCRIPTIONS_TABLE_SQL);
      sqliteDb.exec(CREATE_MAINTENANCE_RECORDS_TABLE_SQL);
      sqliteDb.exec(CREATE_MEDICAL_RECEIPTS_TABLE_SQL);
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
  auditNote?: string
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
    return null;
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
  const now = new Date().toISOString();

  if (status.provider === 'neon' && pgPool) {
    await pgPool.query(
      `INSERT INTO pain_logs (id, score, locations, mood, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, score, locationsJson, mood, notes, now]
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      `INSERT INTO pain_logs (id, score, locations, mood, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    stmt.run(id, score, locationsJson, mood, notes, now);
  }

  return {
    id,
    score,
    locations: JSON.parse(locationsJson),
    mood,
    notes,
    created_at: now,
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




export async function rescheduleAgendaItem(id: string, newDate: string): Promise<AgendaItem | null> {
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

  if (!existing) return null;

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
