import React, { useState, useEffect, useCallback } from "react";
import { DailyInsight, PainLogRecord, WeatherData } from "../types";

interface DailyInsightCardProps {
  painLogs: PainLogRecord[];
  activeDateOffset: number;
  weather: WeatherData | null;
  onOpenPainLog: () => void;
  onOpenPainAnalytics: () => void;
  onLaunchProtocol: (routineName?: string) => void;
}

export function DailyInsightCard({
  painLogs,
  activeDateOffset,
  weather,
  onOpenPainLog,
  onOpenPainAnalytics,
  onLaunchProtocol,
}: DailyInsightCardProps) {
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  // Filter pain logs relevant to the selected date offset
  const relevantLogs = React.useMemo(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + activeDateOffset);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    return painLogs.filter((log) => {
      if (!log.created_at) return false;
      const logDate = log.created_at.split("T")[0];
      return logDate === targetDateStr;
    });
  }, [painLogs, activeDateOffset]);

  const targetDateLabel = React.useMemo(() => {
    if (activeDateOffset === 0) return "Today";
    if (activeDateOffset === 1) return "Tomorrow";
    if (activeDateOffset === -1) return "Yesterday";
    const d = new Date();
    d.setDate(d.getDate() + activeDateOffset);
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }, [activeDateOffset]);

  const fetchInsight = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + activeDateOffset);

      const res = await fetch("/api/insights/daily", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          painLogs: relevantLogs,
          date: targetDate.toISOString().split("T")[0],
          weather,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setInsight(data);
    } catch (err: any) {
      console.error("Failed to fetch daily insight:", err);
      setError("Unable to generate AI pattern insight right now. Click refresh to retry.");
    } finally {
      setLoading(false);
    }
  }, [relevantLogs, activeDateOffset, weather]);

  // Automatically fetch insight when relevant logs change or date changes
  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  const getSeverityBadgeClass = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case "severe":
        return "badge neon-red";
      case "moderate":
        return "badge neon-yellow";
      case "mild":
        return "badge neon-green";
      default:
        return "badge neon-blue";
    }
  };

  return (
    <div
      className="protocol-card glass-panel daily-insight-card"
      style={{
        padding: "16px",
        borderLeft: "4px solid var(--neon-purple)",
        background: "linear-gradient(135deg, rgba(30, 20, 50, 0.45) 0%, rgba(15, 15, 25, 0.65) 100%)",
        position: "relative",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "12px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)" }}>
            08:00 AM
          </span>
          <span className="badge neon-purple" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>
            Daily Insight
          </span>
          <span
            className="badge"
            style={{
              fontSize: "0.7rem",
              background: insight?.isAiGenerated ? "rgba(189, 0, 255, 0.15)" : "rgba(255, 255, 255, 0.06)",
              color: insight?.isAiGenerated ? "var(--neon-purple)" : "var(--text-secondary)",
              border: "1px solid rgba(189, 0, 255, 0.3)",
            }}
          >
            {insight?.isAiGenerated ? "⚡ Gemini 3.8 Flash" : "Clinical Telemetry"}
          </span>
          <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
            • {targetDateLabel} ({relevantLogs.length} {relevantLogs.length === 1 ? "log" : "logs"})
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={fetchInsight}
            disabled={loading}
            style={{
              fontSize: "0.74rem",
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            title="Refresh clinical insight with latest symptom logs"
          >
            <span style={{ display: "inline-block", transform: loading ? "rotate(180deg)" : "none", transition: "transform 0.4s ease" }}>
              🔄
            </span>
            {loading ? "Analyzing..." : "Refresh"}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => setExpanded(!expanded)}
            style={{ fontSize: "0.74rem", padding: "4px 8px" }}
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {/* Loading state skeleton */}
      {loading && !insight && (
        <div style={{ padding: "14px 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="spinner" style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "var(--neon-purple)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <span>Gemini is synthesizing anatomical drivers, pain trajectory, and pacing correlations...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{ padding: "10px", background: "rgba(220, 38, 38, 0.15)", border: "1px solid var(--neon-red)", borderRadius: "8px", margin: "8px 0", fontSize: "0.82rem", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {/* Main Content */}
      {insight && expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Headline & Badges */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "1.05rem", color: "#fff", fontWeight: 700 }}>
                {insight.headline}
              </h3>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                {insight.severityLevel && (
                  <span className={getSeverityBadgeClass(insight.severityLevel)} style={{ fontSize: "0.72rem" }}>
                    Severity: {insight.severityLevel}
                  </span>
                )}
                {insight.trajectoryTrend && (
                  <span className="badge neon-blue" style={{ fontSize: "0.72rem" }}>
                    Trend: {insight.trajectoryTrend}
                  </span>
                )}
                {insight.averageScore > 0 && (
                  <span className="badge" style={{ fontSize: "0.72rem", background: "rgba(0,0,0,0.3)", color: "var(--text-primary)" }}>
                    Avg: {insight.averageScore}/10
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={onOpenPainLog}
                style={{ fontSize: "0.74rem", padding: "4px 8px", color: "var(--neon-red)", borderColor: "rgba(239, 68, 68, 0.4)" }}
              >
                + Log Pain
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={onOpenPainAnalytics}
                style={{ fontSize: "0.74rem", padding: "4px 8px" }}
              >
                Analytics
              </button>
            </div>
          </div>

          {/* Clinical Executive Summary */}
          <p
            style={{
              margin: 0,
              fontSize: "0.88rem",
              lineHeight: 1.5,
              color: "var(--text-primary)",
              background: "rgba(0, 0, 0, 0.2)",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            {insight.summary}
          </p>

          {/* Grid: Anatomical Drivers & Key Patterns */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
            {/* Primary Drivers Card */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--neon-purple)", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Primary Anatomical Drivers
              </span>
              {insight.primaryDrivers && insight.primaryDrivers.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {insight.primaryDrivers.map((driver, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: "0.82rem",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span style={{ color: "var(--neon-purple)", fontSize: "0.75rem" }}>▶</span>
                      {driver}
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>No focal driver identified.</span>
              )}
            </div>

            {/* Physiological & Behavioral Patterns */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--neon-blue)", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Observed Symptom Patterns
              </span>
              {insight.keyPatterns && insight.keyPatterns.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {insight.keyPatterns.map((pat, idx) => (
                    <div key={idx} style={{ fontSize: "0.82rem", color: "#fff", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                      <span style={{ color: "var(--neon-blue)", fontSize: "0.75rem", marginTop: "2px" }}>•</span>
                      <span>{pat}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Awaiting multiple data points.</span>
              )}
            </div>
          </div>

          {/* Aggravators & Relief Therapies (if present) */}
          {((insight.aggravatorsIdentified && insight.aggravatorsIdentified.length > 0) ||
            (insight.effectiveTherapies && insight.effectiveTherapies.length > 0)) && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                background: "rgba(0, 0, 0, 0.15)",
                padding: "8px 12px",
                borderRadius: "8px",
              }}
            >
              {insight.aggravatorsIdentified && insight.aggravatorsIdentified.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.74rem", color: "var(--neon-red)", fontWeight: 700 }}>Triggers:</span>
                  {insight.aggravatorsIdentified.map((agg, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "0.72rem",
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "#fca5a5",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                      }}
                    >
                      {agg}
                    </span>
                  ))}
                </div>
              )}

              {insight.effectiveTherapies && insight.effectiveTherapies.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.74rem", color: "var(--neon-green)", fontWeight: 700 }}>Relief:</span>
                  {insight.effectiveTherapies.map((th, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "0.72rem",
                        background: "rgba(34, 197, 94, 0.15)",
                        color: "#86efac",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        border: "1px solid rgba(34, 197, 94, 0.25)",
                      }}
                    >
                      {th}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actionable Pacing & Rehab Protocol Box */}
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(189, 0, 255, 0.08)",
              border: "1px solid rgba(189, 0, 255, 0.25)",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ flex: 1, minWidth: "220px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--neon-purple)" }}>
                  Clinical Pacing Guidance:
                </span>
              </div>
              <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "0.82rem", color: "var(--text-primary)" }}>
                {insight.pacingRecommendations.map((rec, idx) => (
                  <li key={idx} style={{ marginBottom: "2px" }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {insight.suggestedProtocol && (
              <button
                type="button"
                className="btn btn-neon-purple btn-sm"
                onClick={() => onLaunchProtocol(insight.suggestedProtocol)}
                style={{ whiteSpace: "nowrap" }}
              >
                Launch {insight.suggestedProtocol.split(":")[0]} &rarr;
              </button>
            )}
          </div>

          {/* Medical Disclaimer per Rumble OS rule */}
          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textAlign: "right", marginTop: "2px" }}>
            Decision support only; not medical diagnosis. Never push through sharp pain.
          </div>
        </div>
      )}
    </div>
  );
}
