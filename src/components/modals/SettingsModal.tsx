import React, { useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerRetrievalScan: () => void;
  onTriggerTelegramCheckin: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  onTriggerRetrievalScan,
  onTriggerTelegramCheckin,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "integrations">("profile");
  const [name, setName] = useState("James");
  const [email, setEmail] = useState("james@example.com");
  const [theme, setTheme] = useState("theme-default");
  const [notifications, setNotifications] = useState("Enabled");

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: "600px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Settings</h2>
          <button className="btn-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px", margin: "14px 0" }}>
          <button
            className={`btn btn-sm ${activeTab === "profile" ? "btn-neon-blue" : "btn-outline"}`}
            type="button"
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            className={`btn btn-sm ${activeTab === "preferences" ? "btn-neon-blue" : "btn-outline"}`}
            type="button"
            onClick={() => setActiveTab("preferences")}
          >
            Preferences
          </button>
          <button
            className={`btn btn-sm ${activeTab === "integrations" ? "btn-neon-blue" : "btn-outline"}`}
            type="button"
            onClick={() => setActiveTab("integrations")}
          >
            Integrations
          </button>
        </div>

        <div style={{ padding: "10px 0" }}>
          {activeTab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Name</label>
                <input
                  type="text"
                  className="glass-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Email</label>
                <input
                  type="email"
                  className="glass-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Theme</label>
                <select
                  className="glass-select"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px" }}
                >
                  <option value="theme-default">Default Dark</option>
                  <option value="theme-midnight">Midnight Blue</option>
                  <option value="theme-cyberpunk">Cyberpunk Neon</option>
                  <option value="theme-forest">Deep Forest</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Pain Log Reminders</label>
                <select
                  className="glass-select"
                  value={notifications}
                  onChange={(e) => setNotifications(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px" }}
                >
                  <option value="Enabled">Enabled (06:00, 09:00, 12:00, 15:00, 18:00, 21:00)</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Google Calendar &amp; Tasks</span>
                <span className="badge neon-green">Connected</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Gmail Retrieval</span>
                <span className="badge neon-green">Automated (06:00 &amp; 14:00)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Telegram Pain Bot</span>
                <button className="btn btn-outline btn-sm" type="button" onClick={onTriggerTelegramCheckin}>
                  Test Check-in Prompt Now
                </button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Live Data Scan</span>
                <button className="btn btn-outline btn-sm" type="button" onClick={onTriggerRetrievalScan}>
                  Run Retrieval Scan
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
          <button className="btn btn-outline btn-sm" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-neon-blue btn-sm" type="button" onClick={onClose}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
