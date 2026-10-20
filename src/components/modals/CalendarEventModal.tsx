import React, { useState, useEffect } from "react";
import { CalendarEvent } from "../../types";

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  mode: "view" | "edit" | "add";
  onSave: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}

export function CalendarEventModal({
  isOpen,
  onClose,
  event,
  mode: initialMode,
  onSave,
  onDelete,
}: CalendarEventModalProps) {
  const [mode, setMode] = useState<"view" | "edit" | "add">(initialMode);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setMode(initialMode);
    if (event) {
      setTitle(event.title);
      setDate(event.date);
      setStartTime(event.startTime);
      setEndTime(event.endTime);
      setLocation(event.location || "");
      setDescription(event.description || "");
    } else {
      setTitle("");
      setDate(new Date().toISOString().slice(0, 10));
      setStartTime("09:00");
      setEndTime("10:00");
      setLocation("");
      setDescription("");
    }
  }, [event, initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    onSave({
      id: event?.id || `cal_${Date.now()}`,
      title: title.trim(),
      date,
      startTime,
      endTime,
      location: location.trim(),
      description: description.trim(),
      source: event?.source || "local",
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: "480px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>{mode === "view" ? "Event Details" : mode === "edit" ? "Edit Calendar Event" : "Add Calendar Event"}</h2>
          <button className="btn-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        {mode === "view" && event ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "14px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="badge neon-blue">{event.source === "google" ? "Google Calendar" : "Rumble Calendar"}</span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Confirmed</span>
            </div>
            <h3 style={{ margin: "4px 0", fontSize: "1.1rem", color: "#fff" }}>{event.title}</h3>
            <div style={{ fontSize: "0.9rem" }}>
              <strong style={{ color: "var(--neon-blue)" }}>When: </strong>
              <span>
                {event.date} • {event.startTime} - {event.endTime}
              </span>
            </div>
            {event.location && (
              <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                <strong style={{ color: "#fff" }}>Location: </strong>
                <span>{event.location}</span>
              </div>
            )}
            <div style={{ background: "rgba(0,0,0,0.25)", padding: "10px", borderRadius: "8px", border: "1px solid var(--glass-border)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <strong style={{ display: "block", color: "#fff", marginBottom: "4px" }}>Description:</strong>
              <div>{event.description || "No additional notes provided."}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px" }}>
              <button
                className="btn btn-sm btn-outline"
                style={{ color: "var(--neon-red)", borderColor: "rgba(255, 60, 60, 0.4)" }}
                type="button"
                onClick={() => {
                  onDelete(event.id);
                  onClose();
                }}
              >
                Delete Event
              </button>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-outline btn-sm" type="button" onClick={() => setMode("edit")}>
                  Edit Event
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
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Event Title *</label>
              <input
                type="text"
                className="glass-input"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hydrotherapy Session with Physiotherapist"
                style={{ width: "100%", padding: "8px 10px" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Date *</label>
                <input
                  type="date"
                  className="glass-input"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Location</label>
                <input
                  type="text"
                  className="glass-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Clinic / Aquatic Centre"
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Start Time *</label>
                <input
                  type="time"
                  className="glass-input"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>End Time *</label>
                <input
                  type="time"
                  className="glass-input"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Description & Notes</label>
              <textarea
                className="glass-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Agenda points or instructions..."
                style={{ width: "100%", padding: "8px 10px", resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-neon-blue">
                Save Event
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
