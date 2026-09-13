const fs = require('fs');
let code = fs.readFileSync('dashboard/lib/db.ts', 'utf8');

// createTaskInDb return
code = code.replace(/completed_at,\n    deleted,\n    created_at/g, "completed_at,\n    deleted,\n    isUrgent,\n    created_at");

// updateTaskInDb - read existing
code = code.replace(/deleted: Boolean\(r.deleted\),\n        created_at/g, "deleted: Boolean(r.deleted),\n        isUrgent: Boolean(r.isUrgent),\n        created_at");

// updateTaskInDb - update
code = code.replace(/const newDeleted = updates.deleted !== undefined \? updates.deleted : existing.deleted;/, "const newDeleted = updates.deleted !== undefined ? updates.deleted : existing.deleted;\n  const newIsUrgent = updates.isUrgent !== undefined ? updates.isUrgent : existing.isUrgent;");

code = code.replace(/newDeleted, now, id\]/, "newDeleted, newIsUrgent, now, id]");
code = code.replace(/completed_at = \$8, deleted = \$9, updated_at = \$10 WHERE id = \$11/, "completed_at = $8, deleted = $9, isUrgent = $10, updated_at = $11 WHERE id = $12");

code = code.replace(/newDeleted \? 1 : 0, now, id\)/, "newDeleted ? 1 : 0, newIsUrgent ? 1 : 0, now, id)");
code = code.replace(/completed_at = \?, deleted = \?, updated_at = \? WHERE id = \?/, "completed_at = ?, deleted = ?, isUrgent = ?, updated_at = ? WHERE id = ?");

// updateTaskInDb - return
code = code.replace(/deleted: newDeleted,\n    updated_at: now,/g, "deleted: newDeleted,\n    isUrgent: newIsUrgent,\n    updated_at: now,");

// getTasks - reading
code = code.replace(/deleted: Boolean\(r.deleted\),\n      created_at/g, "deleted: Boolean(r.deleted),\n      isUrgent: Boolean(r.isUrgent),\n      created_at");

// getTask - reading
code = code.replace(/deleted: Boolean\(r.deleted\),\n        created_at/g, "deleted: Boolean(r.deleted),\n        isUrgent: Boolean(r.isUrgent),\n        created_at");

fs.writeFileSync('dashboard/lib/db.ts', code);
