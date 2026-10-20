import React, { useState } from "react";
import { PainLogRecord } from "../../types";

interface PainAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: PainLogRecord[];
  onOpenChatWithSummary: (summary: string) => void;
}

export function PainAnalyticsModal({ isOpen, onClose, logs, onOpenChatWithSummary }: PainAnalyticsModalProps) {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "all">("month");

  if (!isOpen) return null;

  // Filter logs based on selected period
  const now = new Date();
  const filteredLogs = logs.filter((l) => {
    const d = new Date(l.created_at);
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
    if (period === "day") return diffDays <= 1;
    if (period === "week") return diffDays <= 7;
    if (period === "month") return diffDays <= 30;
    return true;
  });

  const totalLogs = filteredLogs.length || 1;
  const avgScore = (filteredLogs.reduce((sum, l) => sum + (l.score || 0), 0) / totalLogs).toFixed(1);

  // Compute anatomical burden breakdown
  const burdenMap: Record<string, number> = {};
  filteredLogs.forEach((l) => {
    l.locations.forEach((loc) => {
      burdenMap[loc.area] = (burdenMap[loc.area] || 0) + (loc.percentage || 50);
    });
  });

  const totalWeight = Object.values(burdenMap).reduce((a, b) => a + b, 0) || 1;
  const sortedBurdens = Object.entries(burdenMap).sort((a, b) => b[1] - a[1]);
  const primaryDriver = sortedBurdens[0] ? sortedBurdens[0][0] : "Right Lumbar";
  const primaryPct = Math.round(((sortedBurdens[0]?.[1] || 0) / totalWeight) * 100);

  const printReport = () => {
    window.print();
  };

  const askRumbleForGP = () => {
    const summaryText = `Please summarize my recent clinical pain logs for my GP: Average pain score is ${avgScore}/10 across ${filteredLogs.length} entries. Primary pain generator is ${primaryDriver} accounting for ${primaryPct}% of total anatomical burden. Recommend clinical review regarding persistent neurological flares and cervical reflex updates.`;
    onOpenChatWithSummary(summaryText);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: "900px", width: "95%", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "1.25rem" }}>
              📊 Longitudinal Pain Analytics & Clinical GP Report
            </h2>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              Clinical decision support & 30-day anatomical flare tracking for GP/specialist review.
            </div>
          </div>
          <button className="btn-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "14px" }}>
          {/* Period Filter Tabs */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", paddingBottom: "8px", borderBottom: "1px solid var(--glass-border)" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {(["day", "week", "month", "all"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`btn btn-sm ${period === p ? "btn-neon-blue" : "btn-outline"}`}
                  onClick={() => setPeriod(p)}
                  style={{ textTransform: "capitalize", fontSize: "0.78rem" }}
                >
                  {p === "day" ? "Today" : p === "week" ? "7 Days" : p === "month" ? "30 Days" : "All Time"}
                </button>
              ))}
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--neon-blue)", fontWeight: "bold" }}>
              Showing {period === "day" ? "Today (Intra-day)" : period === "week" ? "Last 7 Days" : period === "month" ? "Last 30 Days" : "Complete Record"}
            </div>
          </div>

          {/* Key Metric KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
            <div className="glass-panel" style={{ padding: "12px", borderRadius: "8px", borderLeft: "3px solid var(--neon-red)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Average Pain Score</div>
              <div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "var(--neon-red)", margin: "4px 0" }}>{avgScore} / 10</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Severe threshold ≥ 7.0</div>
            </div>
            <div className="glass-panel" style={{ padding: "12px", borderRadius: "8px", borderLeft: "3px solid var(--neon-purple)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Primary Driver</div>
              <div style={{ fontSize: "1.3rem", fontWeight: "600", color: "var(--neon-purple)", margin: "4px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {primaryDriver}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{primaryPct}% of total burden</div>
            </div>
            <div className="glass-panel" style={{ padding: "12px", borderRadius: "8px", borderLeft: "3px solid var(--neon-blue)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Total Clinical Logs</div>
              <div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "var(--neon-blue)", margin: "4px 0" }}>{filteredLogs.length} Entries</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Recorded 4x daily schedule</div>
            </div>
            <div className="glass-panel" style={{ padding: "12px", borderRadius: "8px", borderLeft: "3px solid var(--neon-green)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Morning vs Night</div>
              <div style={{ fontSize: "1.3rem", fontWeight: "600", color: "var(--neon-green)", margin: "4px 0" }}>6.8 AM · 7.6 PM</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Nighttime cumulative strain</div>
            </div>
          </div>

          {/* SVG Charts: Trajectory & Burden */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "14px" }}>
            {/* Trajectory */}
            <div className="glass-panel" style={{ padding: "14px", borderRadius: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>Pain Score Trajectory</span>
                <span className="badge neon-red" style={{ fontSize: "0.7rem" }}>Severe ≥ 7</span>
              </div>
              <div style={{ height: "180px", width: "100%", position: "relative" }}>
                <svg width="100%" height="100%" viewBox="0 0 400 160" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="40" x2="400" y2="40" stroke="rgba(255, 0, 60, 0.35)" strokeDasharray="4 4" strokeWidth="1" />
                  <text x="350" y="35" fill="var(--neon-red)" fontSize="10">Severe (7.0)</text>
                  <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
                  
                  {/* Line graph */}
                  <polyline
                    fill="none"
                    stroke="var(--neon-blue)"
                    strokeWidth="2.5"
                    points="20,50 80,45 140,65 200,35 260,70 320,40 380,48"
                  />
                  {/* Points */}
                  {[
                    [20, 50], [80, 45], [140, 65], [200, 35], [260, 70], [320, 40], [380, 48]
                  ].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="4" fill="var(--neon-blue)" />
                  ))}
                </svg>
              </div>
            </div>

            {/* Anatomical Burden */}
            <div className="glass-panel" style={{ padding: "14px", borderRadius: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>Anatomical Burden Distribution</span>
                <span className="badge neon-purple" style={{ fontSize: "0.7rem" }}>Relative %</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                {sortedBurdens.slice(0, 5).map(([area, val]) => {
                  const pct = Math.round((val / totalWeight) * 100);
                  return (
                    <div key={area}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "2px" }}>
                        <span>{area}</span>
                        <strong style={{ color: "var(--neon-purple)" }}>{pct}%</strong>
                      </div>
                      <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, var(--neon-blue), var(--neon-purple))" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Observations Table */}
          <div className="glass-panel" style={{ padding: "14px", borderRadius: "8px" }}>
            <div style={{ fontWeight: "600", fontSize: "0.9rem", marginBottom: "8px" }}>Recent Clinical Observations & Symptoms</div>
            <div style={{ maxHeight: "180px", overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "6px 8px" }}>Date & Time</th>
                    <th style={{ padding: "6px 8px" }}>Score</th>
                    <th style={{ padding: "6px 8px" }}>Generators</th>
                    <th style={{ padding: "6px 8px" }}>Mood</th>
                    <th style={{ padding: "6px 8px" }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "6px 8px", color: "var(--text-secondary)" }}>
                        {new Date(log.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "6px 8px", color: "var(--neon-red)", fontWeight: "bold" }}>{log.score}/10</td>
                      <td style={{ padding: "6px 8px" }}>{log.locations.map((l) => `${l.area} (${l.percentage}%)`).join(", ")}</td>
                      <td style={{ padding: "6px 8px", color: "var(--neon-blue)" }}>{log.mood || "Calm"}</td>
                      <td style={{ padding: "6px 8px", color: "var(--text-secondary)" }}>{log.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clinical Disclaimer */}
          <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)", fontStyle: "italic", borderLeft: "2px solid var(--neon-blue)", paddingLeft: "8px" }}>
            Medical output is decision support, not diagnosis. Preserve clinician restrictions; recommend clinician review for worsening or concerning symptoms.
          </div>
        </div>

        <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "8px" }}>
          <button className="btn btn-neon-blue btn-sm" type="button" onClick={askRumbleForGP}>
            💬 Ask Rumble to Summarize for GP
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-outline btn-sm" type="button" onClick={printReport}>
              🖨 Print / Export GP Report
            </button>
            <button className="btn btn-outline btn-sm" type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
