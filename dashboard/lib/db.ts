import { Pool } from 'pg';
import Database from 'better-sqlite3';
import {
  AgendaItem,
  AgendaItemStatus,
  CreateAgendaItemInput,
  DatabaseStatus,
  CREATE_AGENDA_ITEMS_TABLE_SQL,
  AuditTrailEntry,
} from './schema';

let pgPool: Pool | null = null;
let sqliteDb: Database.Database | null = null;
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
      sqliteDb = new Database(dbPath);
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
    }
  } else {
    if (!sqliteDb) {
      initDb();
    }
    if (sqliteDb) {
      sqliteDb.exec(CREATE_AGENDA_ITEMS_TABLE_SQL);
    }
  }
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
      'SELECT id, item_type, title, scheduled_time, status, completed_at, dismissed_at, audit_trail, created_at FROM agenda_items ORDER BY scheduled_time ASC'
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
    }));
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      'SELECT id, item_type, title, scheduled_time, status, completed_at, dismissed_at, audit_trail, created_at FROM agenda_items ORDER BY scheduled_time ASC'
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
      `INSERT INTO agenda_items (id, item_type, title, scheduled_time, status, completed_at, dismissed_at, audit_trail, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
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
      ]
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      `INSERT INTO agenda_items (id, item_type, title, scheduled_time, status, completed_at, dismissed_at, audit_trail, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      created_at
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
       SET status = $1, completed_at = $2, dismissed_at = $3, audit_trail = $4
       WHERE id = $5`,
      [newStatus, completed_at, dismissed_at, audit_trail_json, id]
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(
      `UPDATE agenda_items
       SET status = ?, completed_at = ?, dismissed_at = ?, audit_trail = ?
       WHERE id = ?`
    );
    stmt.run(newStatus, completed_at, dismissed_at, audit_trail_json, id);
  }

  return {
    ...existing,
    status: newStatus,
    completed_at,
    dismissed_at,
    audit_trail: updatedAuditTrail,
  };
}
