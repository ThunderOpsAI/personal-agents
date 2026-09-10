const fs = require('fs');
let schema = fs.readFileSync('dashboard/lib/schema.ts', 'utf8');

// Update schema.ts for Tasks
schema = schema.replace(
  /export interface TaskRecord \{([\s\S]*?)updated_at: string;\n\}/,
  (match, p1) => `export interface TaskRecord {${p1}isUrgent?: boolean;\n  updated_at: string;\n}`
);
schema = schema.replace(
  /export interface CreateTaskInput \{([\s\S]*?)deleted\?: boolean;\n\}/,
  (match, p1) => `export interface CreateTaskInput {${p1}deleted?: boolean;\n  isUrgent?: boolean;\n}`
);
schema = schema.replace(
  /deleted BOOLEAN NOT NULL DEFAULT FALSE,/,
  `deleted BOOLEAN NOT NULL DEFAULT FALSE,\n    isUrgent BOOLEAN NOT NULL DEFAULT FALSE,`
);

fs.writeFileSync('dashboard/lib/schema.ts', schema);

let db = fs.readFileSync('dashboard/lib/db.ts', 'utf8');

db = db.replace(
  /const deleted = input\.deleted \|\| false;/,
  `const deleted = input.deleted || false;\n  const isUrgent = input.isUrgent || false;`
);

db = db.replace(
  /VALUES \(\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10, \$11\)/,
  `VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`
);

db = db.replace(
  /status, due, completed_at, deleted, created_at, updated_at\)/g,
  `status, due, completed_at, deleted, isUrgent, created_at, updated_at)`
);

db = db.replace(
  /\[id, google_id, task_list_id, title, notes, taskStatus, due, completed_at, deleted, now, now\]/,
  `[id, google_id, task_list_id, title, notes, taskStatus, due, completed_at, deleted, isUrgent, now, now]`
);

db = db.replace(
  /VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?\)/,
  `VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

db = db.replace(
  /deleted \? 1 : 0, now, now\);/,
  `deleted ? 1 : 0, isUrgent ? 1 : 0, now, now);`
);

db = db.replace(
  /deleted,\n    created_at: now,\n    updated_at: now,/,
  `deleted,\n    isUrgent,\n    created_at: now,\n    updated_at: now,`
);

db = db.replace(
  /deleted: Boolean\(r\.deleted\),\n        created_at: r\.created_at,/g,
  `deleted: Boolean(r.deleted),\n        isUrgent: Boolean(r.isUrgent),\n        created_at: r.created_at,`
);
db = db.replace(
  /deleted: Boolean\(r\.deleted\),\n      created_at: r\.created_at,/g,
  `deleted: Boolean(r.deleted),\n      isUrgent: Boolean(r.isUrgent),\n      created_at: r.created_at,`
);


db = db.replace(
  /const newDeleted = updates\.deleted !== undefined \? updates\.deleted : existing\.deleted;/,
  `const newDeleted = updates.deleted !== undefined ? updates.deleted : existing.deleted;\n  const newIsUrgent = updates.isUrgent !== undefined ? updates.isUrgent : existing.isUrgent;`
);

db = db.replace(
  /completed_at = \$8, deleted = \$9, updated_at = \$10 WHERE id = \$11/,
  `completed_at = $8, deleted = $9, isUrgent = $10, updated_at = $11 WHERE id = $12`
);
db = db.replace(
  /\[newTitle, newNotes, newStatus, newDue, newCompletedAt, newDeleted, now, id\]/,
  `[newTitle, newNotes, newStatus, newDue, newCompletedAt, newDeleted, newIsUrgent, now, id]`
);

db = db.replace(
  /completed_at = \?, deleted = \?, updated_at = \? WHERE id = \?/,
  `completed_at = ?, deleted = ?, isUrgent = ?, updated_at = ? WHERE id = ?`
);
db = db.replace(
  /newDeleted \? 1 : 0, now, id\)/,
  `newDeleted ? 1 : 0, newIsUrgent ? 1 : 0, now, id)`
);

db = db.replace(
  /deleted: newDeleted,\n    updated_at: now,/,
  `deleted: newDeleted,\n    isUrgent: newIsUrgent,\n    updated_at: now,`
);

fs.writeFileSync('dashboard/lib/db.ts', db);
