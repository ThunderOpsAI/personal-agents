const fs = require('fs');
let db = fs.readFileSync('dashboard/lib/db.ts', 'utf8');

db = db.replace(
  /SELECT id, google_id, task_list_id, title, notes, status, due, completed_at, deleted, created_at, updated_at FROM tasks/,
  'SELECT id, google_id, task_list_id, title, notes, status, due, completed_at, deleted, isUrgent, created_at, updated_at FROM tasks'
);

fs.writeFileSync('dashboard/lib/db.ts', db);
