const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const dbPath = path.join(__dirname, 'dashboard', 'data', 'local.db');
const db = new DatabaseSync(dbPath);
try {
  db.exec('ALTER TABLE tasks ADD COLUMN isUrgent BOOLEAN NOT NULL DEFAULT FALSE;');
  console.log('Added isUrgent to tasks in sqlite');
} catch (e) {
  console.log('Column probably exists or error:', e.message);
}
db.close();
