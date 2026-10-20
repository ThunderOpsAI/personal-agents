import React, { useState } from "react";
import { BudgetItem, BudgetReportRecord } from "../../types";

interface BudgetOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BudgetItem[];
  reports: BudgetReportRecord[];
  onArchiveReset: (type: "weekly" | "monthly") => void;
}

export function BudgetOverviewModal({
  isOpen,
  onClose,
  items,
  reports,
  onArchiveReset,
}: BudgetOverviewModalProps) {
  const [selectedReport, setSelectedReport] = useState<BudgetReportRecord | null>(null);

  if (!isOpen) return null;

  const totalExpense = items.filter((i) => i.type === "expense").reduce((acc, i) => acc + i.amount, 0);
  const totalIncome = items.filter((i) => i.type === "income").reduce((acc, i) => acc + i.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Breakdown by category
  const categoryTotals: Record<string, number> = {};
  items.filter((i) => i.type === "expense").forEach((i) => {
    categoryTotals[i.category] = (categoryTotals[i.category] || 0) + i.amount;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: "850px", width: "95%", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Budget Analytics &amp; Synthesized Reports</h2>
          <button className="btn-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "14px" }}>
          {/* Top KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
            <div className="glass-panel" style={{ padding: "12px", borderLeft: "3px solid var(--neon-green)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Total Income</div>
              <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "var(--neon-green)", margin: "4px 0" }}>
                ${totalIncome.toFixed(2)}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: "12px", borderLeft: "3px solid var(--neon-red)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Total Expenses</div>
              <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "var(--neon-red)", margin: "4px 0" }}>
                ${totalExpense.toFixed(2)}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: "12px", borderLeft: "3px solid var(--neon-blue)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Net Savings</div>
              <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "var(--neon-blue)", margin: "4px 0" }}>
                ${netBalance.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Category Distribution SVG Chart */}
          <div className="glass-panel" style={{ padding: "14px", borderRadius: "8px" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "0.95rem", color: "var(--neon-blue)" }}>
              Expense Breakdown by Category
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.entries(categoryTotals).map(([cat, amt]) => {
                const pct = totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0;
                return (
                  <div key={cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "3px" }}>
                      <span>{cat}</span>
                      <strong>${amt.toFixed(2)} ({pct}%)</strong>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, var(--neon-blue), var(--neon-purple))" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Periodic Archiving & Reports Section */}
          <div className="glass-panel" style={{ padding: "16px", borderRadius: "12px", background: "rgba(255,255,255,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
              <div>
                <h4 style={{ color: "var(--neon-blue)", margin: 0, fontSize: "1rem" }}>
                  📑 Periodic Reports Archive (agent_reports/)
                </h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                  Weekly and monthly syntheses are automatically archived and logged for review.
                </p>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  onClick={() => onArchiveReset("weekly")}
                  title="Archive current week and reset weekly ledger"
                >
                  Archive &amp; Reset Week
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  onClick={() => onArchiveReset("monthly")}
                  title="Archive current month and reset ledger"
                >
                  Archive &amp; Reset Month
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="glass-panel"
                  style={{ padding: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                  onClick={() => setSelectedReport(rep)}
                >
                  <div>
                    <strong style={{ fontSize: "0.88rem", color: "#fff" }}>{rep.period_label}</strong>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      Outflow: ${rep.total_spent.toFixed(2)} • Inflow: ${rep.total_income.toFixed(2)}
                    </div>
                  </div>
                  <button className="btn btn-outline btn-sm" type="button" style={{ fontSize: "0.75rem", padding: "3px 8px" }}>
                    View Synthesis
                  </button>
                </div>
              ))}
            </div>

            {selectedReport && (
              <div style={{ marginTop: "14px", padding: "14px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--neon-blue)", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <strong style={{ color: "var(--neon-blue)", fontSize: "0.95rem" }}>{selectedReport.period_label}</strong>
                  <button className="btn-close" type="button" onClick={() => setSelectedReport(null)}>
                    &times;
                  </button>
                </div>
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "0.82rem", color: "#fff", maxHeight: "200px", overflowY: "auto", margin: 0 }}>
                  {selectedReport.report_markdown}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
          <button className="btn btn-outline btn-sm" type="button" onClick={() => window.print()}>
            🖨 Print Report
          </button>
          <button className="btn btn-outline btn-sm" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
