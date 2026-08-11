-- PostgreSQL / SQLite schema definition for agenda_items table
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
