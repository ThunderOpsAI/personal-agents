import re
import os

db_path = "dashboard/lib/db.ts"
with open(db_path, "r") as f:
    db_content = f.read()

# createAgendaItem
db_content = db_content.replace(
    "const completed_at = itemStatus === 'completed' ? created_at : null;",
    "const completed_at = itemStatus === 'completed' ? created_at : null;\n  const updated_at = input.updated_at || created_at;"
)
db_content = db_content.replace(
    "audit_trail_json,\n        created_at,\n      ]",
    "audit_trail_json,\n        created_at,\n        updated_at,\n      ]"
)
db_content = db_content.replace(
    "audit_trail, created_at)\n       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    "audit_trail, created_at, updated_at)\n       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)"
)
db_content = db_content.replace(
    "audit_trail_json,\n      created_at\n    );",
    "audit_trail_json,\n      created_at,\n      updated_at\n    );"
)
db_content = db_content.replace(
    "audit_trail, created_at)\n       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    "audit_trail, created_at, updated_at)\n       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
)
db_content = db_content.replace(
    "audit_trail: initialAudit,\n    created_at,\n  };",
    "audit_trail: initialAudit,\n    created_at,\n    updated_at,\n  };"
)

# updateAgendaItemStatus
db_content = db_content.replace(
    "created_at: row.created_at,\n      };",
    "created_at: row.created_at,\n        updated_at: row.updated_at,\n      };"
)
db_content = db_content.replace(
    "audit_trail: parseAuditTrail(row.audit_trail),\n        created_at: row.created_at,\n      };",
    "audit_trail: parseAuditTrail(row.audit_trail),\n        created_at: row.created_at,\n        updated_at: row.updated_at,\n      };"
)
db_content = db_content.replace(
    "SET status = $1, completed_at = $2, dismissed_at = $3, audit_trail = $4\n       WHERE id = $5",
    "SET status = $1, completed_at = $2, dismissed_at = $3, audit_trail = $4, updated_at = $5\n       WHERE id = $6"
)
db_content = db_content.replace(
    "[newStatus, completed_at, dismissed_at, audit_trail_json, id]",
    "[newStatus, completed_at, dismissed_at, audit_trail_json, now, id]"
)
db_content = db_content.replace(
    "SET status = ?, completed_at = ?, dismissed_at = ?, audit_trail = ?\n       WHERE id = ?",
    "SET status = ?, completed_at = ?, dismissed_at = ?, audit_trail = ?, updated_at = ?\n       WHERE id = ?"
)
db_content = db_content.replace(
    "stmt.run(newStatus, completed_at, dismissed_at, audit_trail_json, id);",
    "stmt.run(newStatus, completed_at, dismissed_at, audit_trail_json, now, id);"
)
db_content = db_content.replace(
    "dismissed_at,\n    audit_trail: updatedAuditTrail,\n  };",
    "dismissed_at,\n    audit_trail: updatedAuditTrail,\n    updated_at: now,\n  };"
)

# rescheduleAgendaItem
reschedule_func = """
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
"""

if "rescheduleAgendaItem" not in db_content:
    db_content += "\n" + reschedule_func

with open(db_path, "w") as f:
    f.write(db_content)

route_path = "dashboard/app/api/v1/agenda/route.ts"
with open(route_path, "r") as f:
    route_content = f.read()

if "rescheduleAgendaItem" not in route_content:
    route_content = route_content.replace(
        "import { createAgendaItem, getAgendaItems, getDbStatus, updateAgendaItemStatus } from \"../../../../lib/db\";",
        "import { createAgendaItem, getAgendaItems, getDbStatus, updateAgendaItemStatus, rescheduleAgendaItem } from \"../../../../lib/db\";"
    )

reschedule_handler = """
  if (body.action === "reschedule" && body.id && body.new_date) {
    try {
      const updated = await rescheduleAgendaItem(body.id, body.new_date);
      if (!updated) {
        return NextResponse.json({ status: "error", error: "Agenda item not found" }, { status: 404 });
      }
      return NextResponse.json({ status: "success", item: updated });
    } catch (error) {
      return NextResponse.json({ status: "error", error: "Failed to reschedule item" }, { status: 500 });
    }
  }
"""
if 'body.action === "reschedule"' not in route_content:
    route_content = route_content.replace(
        '  if (body.action === "update_status" || (body.id && body.status && !body.title)) {',
        reschedule_handler + '\n  if (body.action === "update_status" || (body.id && body.status && !body.title)) {'
    )

with open(route_path, "w") as f:
    f.write(route_content)

html_path = "dashboard/public/index.html"
with open(html_path, "r") as f:
    html_content = f.read()

postpone_modal = """
        <!-- Postpone Modal Window -->
        <div class="modal-overlay hidden" id="postponeModal">
            <div class="modal-content glass-panel" style="max-width: 400px;">
                <div class="modal-header">
                    <h2>Postpone Agenda Item</h2>
                    <button class="btn-close" id="btnClosePostpone">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Select New Date</label>
                        <input type="date" id="postponeDate" class="glass-input" style="width: 100%; padding: 8px;" />
                    </div>
                </div>
                <div class="modal-footer" style="margin-top: 15px;">
                    <button class="btn btn-outline" id="btnCancelPostpone">Cancel</button>
                    <button class="btn btn-neon-blue" id="btnConfirmPostpone">Confirm Postpone</button>
                </div>
            </div>
        </div>
"""
if 'id="postponeModal"' not in html_content:
    html_content = html_content.replace("        <!-- Modals -->", "        <!-- Modals -->\n" + postpone_modal)
    with open(html_path, "w") as f:
        f.write(html_content)
    with open("dashboard/index.html", "w") as f:
        f.write(html_content)

app_js_path = "dashboard/public/app.js"
with open(app_js_path, "r") as f:
    app_content = f.read()

if 'id="postponeModal"' not in app_content:
    app_content = app_content.replace(
        "const btnDismissCro = document.getElementById('btnDismissCro');",
        "const btnDismissCro = document.getElementById('btnDismissCro');\n    const postponeModal = document.getElementById('postponeModal');\n    const btnClosePostpone = document.getElementById('btnClosePostpone');\n    const btnCancelPostpone = document.getElementById('btnCancelPostpone');\n    const btnConfirmPostpone = document.getElementById('btnConfirmPostpone');\n    const postponeDateInput = document.getElementById('postponeDate');\n    let itemToPostpone = null;"
    )

    app_content = app_content.replace(
        "if (btnCloseNotes) btnCloseNotes.addEventListener('click', () => notesModal.classList.add('hidden'));",
        "if (btnCloseNotes) btnCloseNotes.addEventListener('click', () => notesModal.classList.add('hidden'));\n    if (btnClosePostpone) btnClosePostpone.addEventListener('click', () => postponeModal.classList.add('hidden'));\n    if (btnCancelPostpone) btnCancelPostpone.addEventListener('click', () => postponeModal.classList.add('hidden'));\n    if (btnConfirmPostpone) btnConfirmPostpone.addEventListener('click', async () => {\n        if (!itemToPostpone || !postponeDateInput.value) return;\n        const payload = { action: 'reschedule', id: itemToPostpone, new_date: postponeDateInput.value + 'T09:00:00.000Z' };\n        try {\n            const res = await fetch(API_AGENDA, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });\n            if (res.ok) {\n                showToast('Item postponed', 'info');\n                postponeModal.classList.add('hidden');\n                loadAgenda();\n            } else {\n                showToast('Failed to postpone item');\n            }\n        } catch (e) {\n            showToast('Error postponing item');\n            console.error(e);\n        }\n    });"
    )

    app_content = app_content.replace(
        """<button class="btn btn-neon-green btn-done" data-id="${item.id}" data-type="${item.item_type || ''}" ${isCompleted ? 'disabled' : ''}>${isCompleted ? 'Done' : 'Done'}</button>
                            <button class="btn btn-outline btn-dismiss" data-id="${item.id}" data-type="${item.item_type || ''}" ${isCompleted ? '' : 'disabled'}>Dismiss</button>""",
        """<button class="btn btn-neon-green btn-done" data-id="${item.id}" data-type="${item.item_type || ''}" ${isCompleted ? 'disabled' : ''}>${isCompleted ? 'Done' : 'Done'}</button>
                            <button class="btn btn-outline btn-postpone" data-id="${item.id}" data-type="${item.item_type || ''}" ${isCompleted ? 'disabled' : ''}>Postpone</button>
                            <button class="btn btn-outline btn-dismiss" data-id="${item.id}" data-type="${item.item_type || ''}" ${isCompleted ? '' : 'disabled'}>Dismiss</button>"""
    )
    
    app_content = app_content.replace(
        "if (e.target.classList.contains('btn-dismiss')) {",
        "if (e.target.classList.contains('btn-postpone')) {\n            itemToPostpone = itemId;\n            postponeModal.classList.remove('hidden');\n        }\n        if (e.target.classList.contains('btn-dismiss')) {"
    )

    with open(app_js_path, "w") as f:
        f.write(app_content)
    with open("dashboard/app.js", "w") as f:
        f.write(app_content)

print("Done patching.")
