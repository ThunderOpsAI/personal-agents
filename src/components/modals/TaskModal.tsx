import React, { useState, useEffect } from "react";
import { TaskItem } from "../../types";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  mode: "view" | "edit" | "add";
  onSave: (task: TaskItem) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (task: TaskItem) => void;
}

export function TaskModal({
  isOpen,
  onClose,
  task,
  mode: initialMode,
  onSave,
  onDelete,
  onToggleComplete,
}: TaskModalProps) {
  const [mode, setMode] = useState<"view" | "edit" | "add">(initialMode);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("09:00");
  const [urgent, setUrgent] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"needsAction" | "completed">("needsAction");

  useEffect(() => {
    setMode(initialMode);
    if (task) {
      setTitle(task.title);
      setDueDate(task.dueDate);
      setDueTime(task.dueTime || "09:00");
      setUrgent(task.urgent);
      setNotes(task.notes || "");
      setStatus(task.status);
    } else {
      setTitle("");
      setDueDate(new Date().toISOString().slice(0, 10));
      setDueTime("09:00");
      setUrgent(false);
      setNotes("");
      setStatus("needsAction");
    }
  }, [task, initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: task?.id || `task_${Date.now()}`,
      title: title.trim(),
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      dueTime,
      urgent,
      notes: notes.trim(),
      status,
      source: task?.source || "local",
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: "480px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>{mode === "view" ? "Task Details" : mode === "edit" ? "Edit Task" : "Add Task"}</h2>
          <button className="btn-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        {mode === "view" && task ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "14px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className={`badge ${task.status === "completed" ? "neon-green" : "neon-blue"}`}>
                {task.status === "completed" ? "Completed" : "Pending"}
              </span>
              {task.urgent && <span className="badge neon-red">Urgent</span>}
              <span className="badge" style={{ background: "rgba(255,255,255,0.08)" }}>
                {task.source === "google" ? "Google Tasks" : "Local Task"}
              </span>
            </div>
            <h3 style={{ margin: "4px 0", fontSize: "1.1rem", color: "#fff" }}>{task.title}</h3>
            <div style={{ fontSize: "0.9rem" }}>
              <strong style={{ color: "var(--neon-blue)" }}>Due: </strong>
              <span>
                {task.dueDate} {task.dueTime ? `at ${task.dueTime}` : ""}
              </span>
            </div>
            {task.notes && (
              <div style={{ background: "rgba(0,0,0,0.25)", padding: "10px", borderRadius: "8px", border: "1px solid var(--glass-border)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <strong style={{ display: "block", color: "#fff", marginBottom: "4px" }}>Notes:</strong>
                <div>{task.notes}</div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px", flexWrap: "wrap", gap: "8px" }}>
              <button
                className="btn btn-sm btn-outline"
                style={{ color: "var(--neon-red)", borderColor: "rgba(255,60,60,0.4)" }}
                type="button"
                onClick={() => {
                  onDelete(task.id);
                  onClose();
                }}
              >
                Delete Task
              </button>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  className={`btn btn-sm ${task.status === "completed" ? "btn-outline" : "btn-neon-green"}`}
                  type="button"
                  onClick={() => {
                    onToggleComplete(task);
                    onClose();
                  }}
                >
                  {task.status === "completed" ? "Mark Pending" : "Mark Complete"}
                </button>
                <button className="btn btn-outline btn-sm" type="button" onClick={() => setMode("edit")}>
                  Edit Task
                </button>
                <button className="btn btn-neon-blue btn-sm" type="button" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Task Title *</label>
              <input
                type="text"
                className="glass-input"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Confirm MRI imaging report"
                style={{ width: "100%", padding: "8px 10px" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Due Date</label>
                <input
                  type="date"
                  className="glass-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Due Time</label>
                <input
                  type="time"
                  className="glass-input"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "4px 0" }}>
              <input
                type="checkbox"
                id="taskUrgentCheckbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                style={{ accentColor: "var(--neon-red)", width: "16px", height: "16px" }}
              />
              <label htmlFor="taskUrgentCheckbox" style={{ fontSize: "0.85rem", color: "var(--neon-red)", fontWeight: "bold", cursor: "pointer" }}>
                Mark as Urgent
              </label>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Status</label>
              <select
                className="glass-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                style={{ width: "100%", padding: "8px 10px" }}
              >
                <option value="needsAction">Pending (Needs Action)</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Notes & Details</label>
              <textarea
                className="glass-input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Actionable notes or details..."
                style={{ width: "100%", padding: "8px 10px", resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-neon-blue">
                Save Task
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
