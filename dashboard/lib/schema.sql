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

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Pain logs table
CREATE TABLE IF NOT EXISTS pain_logs (
    id TEXT PRIMARY KEY,
    score INTEGER NOT NULL,
    locations TEXT NOT NULL,
    mood TEXT,
    notes TEXT,
-- Exercise preferences table
CREATE TABLE IF NOT EXISTS exercise_preferences (
    id TEXT PRIMARY KEY,
    routine_id TEXT NOT NULL,
    routine_title TEXT NOT NULL,
    pre_pain_score INTEGER NOT NULL,
    post_pain_score INTEGER NOT NULL,
    relief_delta INTEGER NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL
);


