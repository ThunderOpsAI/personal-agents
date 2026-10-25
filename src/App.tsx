import React, { useState, useEffect, useMemo } from "react";
import {
  INITIAL_AGENDA_ITEMS,
  INITIAL_BUDGET_ITEMS,
  INITIAL_BUDGET_REPORTS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_NOTES,
  INITIAL_PAIN_LOGS,
  INITIAL_SMS_MESSAGES,
  INITIAL_TASKS,
} from "./data/initialData";
import { EXERCISE_DATABASE, ExerciseItem } from "./data/exercise-db";
import { ENCYCLOPEDIAS, ROTATING_LEARNING_TOPICS } from "./data/encyclopedias";
import { fetchLiveWangarattaWeather } from "./services/weatherService";
import { formatWashingDayLabel } from "./utils/formatWashDay";
import {
  AgendaItem,
  BudgetItem,
  BudgetReportRecord,
  CalendarEvent,
  Note,
  PainLogRecord,
  SmsMessage,
  TaskItem,
  WeatherData,
} from "./types";

// Modals
import { PainLogModal } from "./components/modals/PainLogModal";
import { PainAnalyticsModal } from "./components/modals/PainAnalyticsModal";
import { ExerciseModal } from "./components/modals/ExerciseModal";
import { ProtocolRunnerModal } from "./components/modals/ProtocolRunnerModal";
import { ReliefDeltaModal } from "./components/modals/ReliefDeltaModal";
import { NotesModal } from "./components/modals/NotesModal";
import { CalendarEventModal } from "./components/modals/CalendarEventModal";
import { TaskModal } from "./components/modals/TaskModal";
import { ComposeSmsModal } from "./components/modals/ComposeSmsModal";
import { ConsultChecklistModal } from "./components/modals/ConsultChecklistModal";
import { ExecutiveBriefingModal } from "./components/modals/ExecutiveBriefingModal";
import { EncyclopediaReaderModal } from "./components/modals/EncyclopediaReaderModal";
import { BudgetOverviewModal } from "./components/modals/BudgetOverviewModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { DelayModal } from "./components/modals/DelayModal";
import { DismissConfirmModal } from "./components/modals/DismissConfirmModal";
import { AddCustomAreaModal } from "./components/modals/AddCustomAreaModal";
import { ExerciseDemoDialog } from "./components/ExerciseDemoDialog";
import { RumbleChat } from "./components/RumbleChat";
import { DailyInsightCard } from "./components/DailyInsightCard";

export function App() {
  // --- Persistent Storage State ---
  const AGENDA_VERSION = "2026-10-22_v3_tomorrow_agenda";
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(() => {
    const saved = localStorage.getItem("rumble_agenda_items");
    const ver = localStorage.getItem("rumble_agenda_ver");
    if (saved && ver === AGENDA_VERSION) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    localStorage.setItem("rumble_agenda_items", JSON.stringify(INITIAL_AGENDA_ITEMS));
    localStorage.setItem("rumble_agenda_ver", AGENDA_VERSION);
    return INITIAL_AGENDA_ITEMS;
  });

  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(() => {
    const saved = localStorage.getItem("rumble_budget_items");
    return saved ? JSON.parse(saved) : INITIAL_BUDGET_ITEMS;
  });

  const [budgetReports, setBudgetReports] = useState<BudgetReportRecord[]>(() => {
    const saved = localStorage.getItem("rumble_budget_reports");
    return saved ? JSON.parse(saved) : INITIAL_BUDGET_REPORTS;
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem("rumble_calendar_events");
    return saved ? JSON.parse(saved) : INITIAL_CALENDAR_EVENTS;
  });

  const TASKS_VERSION = "2026-10-22_v3_tomorrow_agenda";
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem("rumble_tasks");
    const ver = localStorage.getItem("rumble_tasks_ver");
    if (saved && ver === TASKS_VERSION) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    localStorage.setItem("rumble_tasks", JSON.stringify(INITIAL_TASKS));
    localStorage.setItem("rumble_tasks_ver", TASKS_VERSION);
    return INITIAL_TASKS;
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem("rumble_notes");
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });

  const PAIN_LOGS_VERSION = "2026-10-21_v2_sciatica";
  const [painLogs, setPainLogs] = useState<PainLogRecord[]>(() => {
    const saved = localStorage.getItem("rumble_pain_logs");
    const ver = localStorage.getItem("rumble_pain_logs_ver");
    if (saved && ver === PAIN_LOGS_VERSION) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    localStorage.setItem("rumble_pain_logs", JSON.stringify(INITIAL_PAIN_LOGS));
    localStorage.setItem("rumble_pain_logs_ver", PAIN_LOGS_VERSION);
    return INITIAL_PAIN_LOGS;
  });

  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>(() => {
    const saved = localStorage.getItem("rumble_sms_messages");
    return saved ? JSON.parse(saved) : INITIAL_SMS_MESSAGES;
  });

  const [customAreas, setCustomAreas] = useState<string[]>(() => {
    const saved = localStorage.getItem("rumble_custom_areas");
    return saved ? JSON.parse(saved) : [];
  });

  // UI state
  const [budgetPeriod, setBudgetPeriod] = useState<"weekly" | "monthly">("weekly");
  const [showBudgetEntries, setShowBudgetEntries] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [newBudgetDesc, setNewBudgetDesc] = useState("");
  const [newBudgetAmount, setNewBudgetAmount] = useState("");
  const [newBudgetType, setNewBudgetType] = useState<"income" | "expense">("expense");
  const [newBudgetCategory, setNewBudgetCategory] = useState("Groceries");
  const [newBudgetNotes, setNewBudgetNotes] = useState("");

  const [activeTab, setActiveTab] = useState<"calendar" | "tasks">("calendar");
  const [activeDateOffset, setActiveDateOffset] = useState<number>(0); // 0 = Today, 1 = Tomorrow, -1 = Yesterday

  const [macroDroidBannerDismissed, setMacroDroidBannerDismissed] = useState(false);
  const [urgentBannerDismissed, setUrgentBannerDismissed] = useState(false);

  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Modals state
  const [isPainLogOpen, setIsPainLogOpen] = useState(false);
  const [isPainAnalyticsOpen, setIsPainAnalyticsOpen] = useState(false);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isProtocolRunnerOpen, setIsProtocolRunnerOpen] = useState(false);
  const [activeRunnerRoutine, setActiveRunnerRoutine] = useState<ExerciseItem | null>(null);
  const [isReliefDeltaOpen, setIsReliefDeltaOpen] = useState(false);
  const [completedRoutine, setCompletedRoutine] = useState<ExerciseItem | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<CalendarEvent | null>(null);
  const [calendarModalMode, setCalendarModalMode] = useState<"view" | "edit" | "add">("view");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [taskModalMode, setTaskModalMode] = useState<"view" | "edit" | "add">("view");
  const [isComposeSmsOpen, setIsComposeSmsOpen] = useState(false);
  const [isConsultChecklistOpen, setIsConsultChecklistOpen] = useState(false);
  const [isExecutiveBriefingOpen, setIsExecutiveBriefingOpen] = useState(false);
  const [isEncyclopediaReaderOpen, setIsEncyclopediaReaderOpen] = useState(false);
  const [activeEncyclopediaId, setActiveEncyclopediaId] = useState<string | null>("pain");
  const [isBudgetOverviewOpen, setIsBudgetOverviewOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [itemToDelay, setItemToDelay] = useState<AgendaItem | null>(null);
  const [isDismissModalOpen, setIsDismissModalOpen] = useState(false);
  const [itemToDismiss, setItemToDismiss] = useState<AgendaItem | null>(null);
  const [isAddCustomAreaOpen, setIsAddCustomAreaOpen] = useState(false);
  const [isRumbleChatOpen, setIsRumbleChatOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState("");
  const [demoExercise, setDemoExercise] = useState<ExerciseItem | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem("rumble_agenda_items", JSON.stringify(agendaItems));
  }, [agendaItems]);
  useEffect(() => {
    localStorage.setItem("rumble_budget_items", JSON.stringify(budgetItems));
  }, [budgetItems]);
  useEffect(() => {
    localStorage.setItem("rumble_budget_reports", JSON.stringify(budgetReports));
  }, [budgetReports]);
  useEffect(() => {
    localStorage.setItem("rumble_calendar_events", JSON.stringify(calendarEvents));
  }, [calendarEvents]);
  useEffect(() => {
    localStorage.setItem("rumble_tasks", JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem("rumble_notes", JSON.stringify(notes));
  }, [notes]);
  useEffect(() => {
    localStorage.setItem("rumble_pain_logs", JSON.stringify(painLogs));
  }, [painLogs]);
  useEffect(() => {
    localStorage.setItem("rumble_sms_messages", JSON.stringify(smsMessages));
  }, [smsMessages]);
  useEffect(() => {
    localStorage.setItem("rumble_custom_areas", JSON.stringify(customAreas));
  }, [customAreas]);

  // Load weather
  useEffect(() => {
    fetchLiveWangarattaWeather().then((w) => setWeather(w));
  }, []);

  // SMS Webhook Heartbeat state
  const [smsHeartbeat, setSmsHeartbeat] = useState<{
    healthy: boolean;
    hours_since_last_received: number | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/v1/sms/heartbeat")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.healthy === "boolean") {
          setSmsHeartbeat(data);
        }
      })
      .catch(() => {});
  }, [smsMessages]);

  // Budget calculations
  const totalIncome = useMemo(
    () => budgetItems.filter((i) => i.type === "income").reduce((sum, i) => sum + i.amount, 0),
    [budgetItems]
  );
  const totalExpense = useMemo(
    () => budgetItems.filter((i) => i.type === "expense").reduce((sum, i) => sum + i.amount, 0),
    [budgetItems]
  );
  const netTotal = totalIncome - totalExpense;

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newBudgetAmount);
    if (!newBudgetDesc.trim() || isNaN(amt)) return;
    const item: BudgetItem = {
      id: `b_${Date.now()}`,
      description: newBudgetDesc.trim(),
      amount: amt,
      category: newBudgetCategory,
      type: newBudgetType,
      notes: newBudgetNotes.trim() || undefined,
      created_at: new Date().toISOString(),
    };
    setBudgetItems((prev) => [item, ...prev]);
    setNewBudgetDesc("");
    setNewBudgetAmount("");
    setNewBudgetNotes("");
    setShowBudgetForm(false);
  };

  // Agenda Actions: Done, Dismiss, Reschedule/Delay
  const handleAgendaDone = (item: AgendaItem) => {
    setAgendaItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: "completed",
              completed_at: new Date().toISOString(),
              audit_trail: [...i.audit_trail, { timestamp: new Date().toISOString(), new_status: "completed", note: "Marked done by user" }],
            }
          : i
      )
    );
  };

  const handleAgendaDismiss = (item: AgendaItem) => {
    setAgendaItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: "dismissed",
              dismissed_at: new Date().toISOString(),
              audit_trail: [...i.audit_trail, { timestamp: new Date().toISOString(), new_status: "dismissed", note: "Dismissed by user" }],
            }
          : i
      )
    );
  };

  const handleAgendaReschedule = (item: AgendaItem, newTime: string) => {
    setAgendaItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              scheduled_time: newTime,
              audit_trail: [...i.audit_trail, { timestamp: new Date().toISOString(), new_status: "pending", note: `Rescheduled to ${newTime}` }],
            }
          : i
      )
    );
  };

  // Filter agenda items
  const visibleAgendaItems = useMemo(() => {
    // Non-dismissed items, with completed items moved to the bottom
    const active = agendaItems.filter((i) => i.status !== "dismissed");
    const pending = active.filter((i) => i.status === "pending");
    const completed = active.filter((i) => i.status === "completed");
    return [...pending, ...completed];
  }, [agendaItems]);

  const urgentTasks = useMemo(() => tasks.filter((t) => t.urgent && t.status === "needsAction"), [tasks]);
  const pendingTasksCount = useMemo(() => tasks.filter((t) => t.status === "needsAction").length, [tasks]);
  const unreadSmsCount = useMemo(() => smsMessages.filter((s) => !s.read).length, [smsMessages]);

  const isPhoneWebhookStale = useMemo(() => {
    if (smsHeartbeat && smsHeartbeat.healthy === false) return true;
    if (smsMessages.length === 0) return true;
    const latestTimestamp = smsMessages[0]?.timestamp;
    if (!latestTimestamp) return false;
    const diffMs = Date.now() - new Date(latestTimestamp).getTime();
    return diffMs > 24 * 60 * 60 * 1000;
  }, [smsHeartbeat, smsMessages]);

  const openUniversalChat = (contextNote?: string) => {
    setChatInitialMessage(contextNote || "");
    setIsRumbleChatOpen(true);
  };

  const handleLaunchInsightProtocol = (routineName?: string) => {
    if (!routineName) {
      setIsExerciseModalOpen(true);
      return;
    }
    const cleanName = routineName.toLowerCase();
    const matched = EXERCISE_DATABASE.find(
      (ex) =>
        cleanName.includes(ex.title.toLowerCase()) ||
        ex.title.toLowerCase().includes(cleanName) ||
        ex.focus_areas.some((area) => cleanName.includes(area.toLowerCase()))
    );
    if (matched) {
      setActiveRunnerRoutine(matched);
      setIsProtocolRunnerOpen(true);
    } else {
      setIsExerciseModalOpen(true);
    }
  };

  return (
    <div className="app-container">
      {/* Background Animated Orbs */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      {/* Pinned MacroDroid Weekly Reminder Banner */}
      {!macroDroidBannerDismissed && (
        <div className="macrodroid-banner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(220, 38, 38, 0.9)", padding: "8px 14px", borderRadius: "8px", color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ background: "rgba(0,0,0,0.3)", fontSize: "0.72rem", fontWeight: 800, padding: "3px 8px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              MacroDroid
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Watch 3 MacroDroid ads (+9 days streak extension)</span>
          </div>
          <button
            className="btn btn-sm"
            style={{ background: "#ffffff", color: "#dc2626", border: "none", fontWeight: 700, padding: "4px 14px", borderRadius: "4px", cursor: "pointer" }}
            onClick={() => setMacroDroidBannerDismissed(true)}
          >
            Done
          </button>
        </div>
      )}

      {/* Header */}
      <header className="glass-header">
        <div className="header-content">
          <div className="brand" style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <h1>Rumble OS</h1>
            {weather ? (
              <div id="weatherWidget" className="weather-widget" style={{ fontSize: "0.82rem", color: "var(--neon-blue)", background: "rgba(0,0,0,0.25)", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span>
                  Wangaratta: {weather.temp}°C, {weather.condition} • Optimal Wash:{" "}
                  {weather.washingDays
                    .map((w) => `${formatWashingDayLabel(w.date)} (${w.precipitationProbability}%)`)
                    .join(", ")}
                </span>
              </div>
            ) : (
              <div id="weatherWidget" style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Loading Wangaratta forecast…
              </div>
            )}
          </div>

          <div className="header-actions">
            <button className="btn btn-sm btn-outline" id="btnOpenNotes" onClick={() => setIsNotesModalOpen(true)} title="Notes & Scratchpad">
              Notes
            </button>
            <button
              className="btn btn-sm btn-outline btn-icon btn-rumble"
              onClick={() => openUniversalChat()}
              title="Rumble Chat"
              aria-label="Rumble Chat"
            >
              <img src="/Rumble_Icon.png" alt="Rumble" className="rumble-header-icon" style={{ width: "20px", height: "20px", borderRadius: "4px" }} />
            </button>
            <button
              className="btn btn-sm btn-outline btn-icon btn-sync"
              onClick={() => {
                fetchLiveWangarattaWeather().then((w) => setWeather(w));
                openUniversalChat("Syncing live operational data across calendar, Gmail retrieval, and Wangaratta Open-Meteo forecast.");
              }}
              title="Sync Live Data"
              aria-label="Sync Live Data"
            >
              <span className="sync-icon">🔄</span>
            </button>
            <button
              className="btn btn-sm btn-outline btn-icon"
              id="btnSettings"
              onClick={() => setIsSettingsModalOpen(true)}
              title="Settings"
              aria-label="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Urgent Tasks Banner */}
        {!urgentBannerDismissed && urgentTasks.length > 0 && (
          <div className="alert-banner" style={{ background: "rgba(220, 38, 38, 0.2)", borderLeft: "4px solid var(--neon-red)", marginTop: "10px", padding: "10px 14px", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ background: "var(--neon-red)", color: "#fff", fontSize: "0.72rem", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>
                  Urgent
                </span>
                <span style={{ color: "var(--neon-red)", fontWeight: "bold", fontSize: "0.85rem" }}>
                  {urgentTasks.length} Urgent Task{urgentTasks.length > 1 ? "s" : ""} Require Immediate Action
                </span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setUrgentBannerDismissed(true)}
                style={{ fontSize: "0.72rem", padding: "2px 8px", color: "var(--text-secondary)", borderColor: "rgba(255,255,255,0.2)" }}
              >
                &times; Dismiss
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px" }}>
              {urgentTasks.map((t) => (
                <div key={t.id} style={{ fontSize: "0.82rem", color: "#fff" }}>
                  • {t.title} (Due: {t.dueDate})
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Grid */}
      <main className="main-content">
        {/* Budget Widget */}
        <section className="widget glass-panel sticky-budget">
          <div className="widget-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2>Budget Overview</h2>
              <span className="badge neon-purple" style={{ fontSize: "0.72rem", textTransform: "capitalize" }}>
                {budgetPeriod}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setBudgetPeriod(budgetPeriod === "weekly" ? "monthly" : "weekly")}
                style={{ padding: "2px 8px", fontSize: "0.74rem" }}
              >
                {budgetPeriod === "weekly" ? "Show Month" : "Show Week"}
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setIsBudgetOverviewOpen(true)}
                style={{ padding: "2px 8px", fontSize: "0.74rem" }}
              >
                Analytics
              </button>
              <span className="badge neon-green">
                IN: ${totalIncome.toFixed(2)} | OUT: ${totalExpense.toFixed(2)} | NET: ${netTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div style={{ margin: "10px 0 6px 0", display: "flex", gap: "8px", alignItems: "center" }}>
            <button className="btn btn-sm btn-outline" onClick={() => setShowBudgetEntries(!showBudgetEntries)} style={{ padding: "2px 8px", fontSize: "0.74rem" }}>
              {showBudgetEntries ? "Hide Entries" : "Toggle Entries"}
            </button>
            <button className="btn btn-sm btn-outline" onClick={() => setShowBudgetForm(!showBudgetForm)} style={{ padding: "2px 8px", fontSize: "0.74rem" }}>
              {showBudgetForm ? "Cancel Add" : "+ Add Entry"}
            </button>
          </div>

          {/* Add Budget Entry Form */}
          {showBudgetForm && (
            <form onSubmit={handleAddBudget} style={{ display: "flex", gap: "8px", flexWrap: "wrap", padding: "10px", background: "rgba(0,0,0,0.25)", borderRadius: "8px", margin: "8px 0" }}>
              <input
                type="text"
                className="glass-input"
                placeholder="Description"
                required
                value={newBudgetDesc}
                onChange={(e) => setNewBudgetDesc(e.target.value)}
                style={{ flex: 1, minWidth: "140px", padding: "8px" }}
              />
              <input
                type="number"
                step="0.01"
                className="glass-input"
                placeholder="Amount ($)"
                required
                value={newBudgetAmount}
                onChange={(e) => setNewBudgetAmount(e.target.value)}
                style={{ width: "110px", padding: "8px" }}
              />
              <select
                className="glass-select"
                value={newBudgetType}
                onChange={(e) => setNewBudgetType(e.target.value as any)}
                style={{ padding: "8px" }}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <select
                className="glass-select"
                value={newBudgetCategory}
                onChange={(e) => setNewBudgetCategory(e.target.value)}
                style={{ padding: "8px" }}
              >
                <option value="Groceries">Groceries</option>
                <option value="Medical">Medical</option>
                <option value="Transport">Transport</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Casino">Casino</option>
                <option value="Sportsbet">Sportsbet</option>
                <option value="Ladbrokes">Ladbrokes</option>
                <option value="Salary">Salary</option>
                <option value="Other">Other</option>
              </select>
              <button className="btn btn-neon-green btn-sm" type="submit">
                Add Entry
              </button>
            </form>
          )}

          {/* Budget Entries List */}
          {showBudgetEntries && (
            <div style={{ maxHeight: "180px", overflowY: "auto", background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {budgetItems.map((b) => (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", padding: "4px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div>
                    <strong>{b.description}</strong>
                    <span style={{ color: "var(--text-secondary)", marginLeft: "8px" }}>({b.category})</span>
                  </div>
                  <strong style={{ color: b.type === "income" ? "var(--neon-green)" : "var(--neon-red)" }}>
                    {b.type === "income" ? "+" : "-"}${b.amount.toFixed(2)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Daily Agenda Stream */}
        <section className="agenda-section">
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2>Daily Agenda</h2>
              <span className="badge neon-green" id="agendaCount">
                {visibleAgendaItems.filter((i) => i.status === "pending").length} Pending
              </span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {activeDateOffset === 0 ? "Today" : activeDateOffset === 1 ? "Tomorrow" : "Yesterday"}
            </div>
          </div>

          {/* Tomorrow Prep Banner */}
          {activeDateOffset === 1 && (
            <div style={{ marginBottom: "12px", padding: "10px 14px", background: "rgba(0, 240, 255, 0.08)", border: "1px solid var(--neon-blue)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ color: "var(--neon-blue)" }}>Tomorrow's Agenda Prep</strong>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Planning ahead for tomorrow</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setActiveDateOffset(0)}>
                Return to Today
              </button>
            </div>
          )}

          <div className="agenda-stream" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Executive Briefing Card */}
            <div className="protocol-card glass-panel briefing-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem" }}>
                  06:00 AM <span className="badge neon-purple">Executive Briefing</span>
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Morning Summary &amp; Key Objectives (Court timeline &amp; Dr Khan consult prep)
                </p>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button className="btn btn-neon-purple btn-sm" onClick={() => setIsExecutiveBriefingOpen(true)}>
                  Show Me
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setIsConsultChecklistOpen(true)}>
                  Checklist Guide
                </button>
              </div>
            </div>

            {/* Daily Continuous Learning Card with 5 Encyclopedias */}
            <div className="protocol-card glass-panel learn-card" style={{ padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "1.05rem" }}>
                  07:30 AM <span className="badge neon-blue">Daily Learning</span>
                </h3>
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Choose an Encyclopedia to continue</span>
              </div>
              <p style={{ margin: "0 0 10px 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Pick a topic to resume where you left off. Every session saves a summary to permanent memory.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
                {(["pain", "cbt", "nerves", "nutrition", "business"] as const).map((encId) => {
                  const enc = ENCYCLOPEDIAS[encId];
                  return (
                    <button
                      key={enc.id}
                      type="button"
                      className="btn btn-outline encyclopedia-btn"
                      onClick={() => {
                        setActiveEncyclopediaId(enc.id);
                        setIsEncyclopediaReaderOpen(true);
                      }}
                      style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px", textAlign: "left", background: "rgba(255,255,255,0.03)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                        <span className={`badge ${enc.badgeClass}`} style={{ fontSize: "0.68rem" }}>
                          {enc.id.toUpperCase()}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                          Ch. 1/{enc.totalChapters}
                        </span>
                      </div>
                      <strong style={{ color: "#fff", fontSize: "0.85rem", marginTop: "6px", display: "block" }}>
                        {enc.chapters[0]?.title.split(" ")[0]} {enc.chapters[0]?.title.split(" ")[1]}
                      </strong>
                      <span style={{ fontSize: "0.72rem", color: "var(--neon-blue)", marginTop: "2px" }}>
                        Resume reading &rarr;
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Insight Card - Gemini API Pain Log Pattern Analysis */}
            <DailyInsightCard
              painLogs={painLogs}
              activeDateOffset={activeDateOffset}
              weather={weather}
              onOpenPainLog={() => setIsPainLogOpen(true)}
              onOpenPainAnalytics={() => setIsPainAnalyticsOpen(true)}
              onLaunchProtocol={handleLaunchInsightProtocol}
            />

            {/* Dynamic Stream Items */}
            {visibleAgendaItems.map((item) => {
              const isCompleted = item.status === "completed";
              const timeDisplay = item.scheduled_time.includes("T")
                ? item.scheduled_time.split("T")[1].slice(0, 5)
                : "09:00";

              return (
                <div
                  key={item.id}
                  className="protocol-card glass-panel"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px",
                    opacity: isCompleted ? 0.5 : 1,
                    borderLeft: isCompleted ? "3px solid #666" : "3px solid var(--neon-blue)",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "220px" }}>
                    <h3 style={{ margin: 0, fontSize: "1rem", textDecoration: isCompleted ? "line-through" : "none" }}>
                      {timeDisplay} <span className="badge neon-blue" style={{ textTransform: "capitalize" }}>{item.item_type}</span>{" "}
                      {item.title}
                    </h3>
                    {item.description && (
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {!isCompleted && (
                      <button
                        className="btn btn-neon-green btn-sm"
                        onClick={() => handleAgendaDone(item)}
                        type="button"
                      >
                        Done
                      </button>
                    )}
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setItemToDelay(item);
                        setIsDelayModalOpen(true);
                      }}
                      type="button"
                    >
                      Reschedule
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setItemToDismiss(item);
                        setIsDismissModalOpen(true);
                      }}
                      type="button"
                      style={{ color: "var(--neon-red)" }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Between Days */}
          <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
            <button
              className="btn btn-outline"
              onClick={() => setActiveDateOffset((prev) => prev - 1)}
              style={{ flex: 1, padding: "10px", justifyContent: "center", display: "flex", alignItems: "center", gap: "6px" }}
            >
              &larr; Return to Yesterday
            </button>
            <button
              className="btn btn-neon-blue"
              onClick={() => setActiveDateOffset((prev) => prev + 1)}
              style={{ flex: 1, padding: "10px", justifyContent: "center", display: "flex", alignItems: "center", gap: "6px" }}
            >
              Continue to Tomorrow's Agenda &rarr;
            </button>
          </div>
        </section>

        {/* Interactive Calendar & Google Tasks Tabs */}
        <section className="widget glass-panel agenda-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className={`btn btn-sm ${activeTab === "calendar" ? "btn-neon-blue active" : "btn-outline"}`}
                onClick={() => setActiveTab("calendar")}
              >
                Calendar
              </button>
              <button
                className={`btn btn-sm ${activeTab === "tasks" ? "btn-neon-blue active" : "btn-outline"}`}
                onClick={() => setActiveTab("tasks")}
              >
                Tasks <span className="badge neon-blue" style={{ marginLeft: "4px" }}>{pendingTasksCount}</span>
              </button>
            </div>
            <div>
              {activeTab === "calendar" ? (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setSelectedCalendarEvent(null);
                    setCalendarModalMode("add");
                    setIsCalendarModalOpen(true);
                  }}
                >
                  + Add Event
                </button>
              ) : (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setSelectedTask(null);
                    setTaskModalMode("add");
                    setIsTaskModalOpen(true);
                  }}
                >
                  + Add Task
                </button>
              )}
            </div>
          </div>

          {/* Calendar View */}
          {activeTab === "calendar" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {calendarEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="glass-panel"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", cursor: "pointer" }}
                  onClick={() => {
                    setSelectedCalendarEvent(evt);
                    setCalendarModalMode("view");
                    setIsCalendarModalOpen(true);
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "0.95rem", color: "#fff" }}>{evt.title}</strong>
                      <span className="badge neon-purple" style={{ fontSize: "0.7rem" }}>
                        {evt.date} • {evt.startTime}
                      </span>
                    </div>
                    {evt.location && (
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "3px" }}>
                        📍 {evt.location}
                      </div>
                    )}
                  </div>
                  <button className="btn btn-outline btn-sm" type="button" style={{ fontSize: "0.75rem" }}>
                    Details
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tasks View */}
          {activeTab === "tasks" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="glass-panel"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    opacity: task.status === "completed" ? 0.5 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      checked={task.status === "completed"}
                      onChange={() => {
                        setTasks((prev) =>
                          prev.map((t) => (t.id === task.id ? { ...t, status: t.status === "completed" ? "needsAction" : "completed" } : t))
                        );
                      }}
                      style={{ accentColor: "var(--neon-green)", width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.92rem", textDecoration: task.status === "completed" ? "line-through" : "none", color: "#fff" }}>
                          {task.title}
                        </span>
                        {task.urgent && <span className="badge neon-red" style={{ fontSize: "0.68rem" }}>Urgent</span>}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                        Due: {task.dueDate} {task.dueTime ? `at ${task.dueTime}` : ""}
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setSelectedTask(task);
                      setTaskModalMode("view");
                      setIsTaskModalOpen(true);
                    }}
                    type="button"
                    style={{ fontSize: "0.75rem" }}
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Text Messages (SMS) Widget */}
        <section className="widget glass-panel sms-panel">
          <div className="widget-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ margin: 0 }}>Text Messages</h2>
              <span className="badge neon-blue">{unreadSmsCount} Unread</span>
              {isPhoneWebhookStale && (
                <span
                  className="badge"
                  style={{
                    background: "rgba(255, 77, 77, 0.15)",
                    border: "1px solid var(--neon-red)",
                    color: "var(--neon-red)",
                    fontSize: "0.72rem",
                  }}
                  title="No phone webhook received in over 24 hours"
                >
                  Phone Inactive (&gt;24h)
                </span>
              )}
            </div>
            <button className="btn btn-neon-blue btn-sm" onClick={() => setIsComposeSmsOpen(true)}>
              Compose SMS
            </button>
          </div>
          {isPhoneWebhookStale && (
            <div
              style={{
                marginTop: "8px",
                padding: "6px 10px",
                borderRadius: "6px",
                background: "rgba(255, 77, 77, 0.1)",
                border: "1px solid rgba(255, 77, 77, 0.3)",
                color: "var(--neon-red)",
                fontSize: "0.78rem",
              }}
            >
              Phone Webhook Warning: No phone webhook received in over 24 hours. Check MacroDroid / Tasker background service.
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px", maxHeight: "200px", overflowY: "auto" }}>
            {smsMessages.map((sms) => (
              <div key={sms.id} className="glass-panel" style={{ padding: "10px", fontSize: "0.85rem", background: "rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <strong style={{ color: "var(--neon-blue)" }}>{sms.from}</strong>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                    {new Date(sms.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div style={{ color: "var(--text-primary)", lineHeight: 1.4 }}>{sms.body}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Compact Quick Actions Micro-bar */}
      <nav className="quick-log-bar glass-panel micro-bar" style={{ position: "fixed", bottom: "12px", left: "50%", transform: "translateX(-50%)", width: "min(96%, 960px)", zIndex: 90, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px" }}>
        <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Rumble OS live data controls</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-neon-red btn-sm" onClick={() => setIsPainLogOpen(true)}>
            Log Pain
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setIsPainAnalyticsOpen(true)} title="Clinical Pain Analytics & GP Report">
            Analytics
          </button>
          <button className="btn btn-neon-purple btn-sm" onClick={() => setIsExerciseModalOpen(true)}>
            Explore Exercises
          </button>
        </div>
      </nav>

      {/* Modals Rendering */}
      <PainLogModal
        isOpen={isPainLogOpen}
        onClose={() => setIsPainLogOpen(false)}
        onSave={(record) => {
          setPainLogs((prev) => [record, ...prev]);
        }}
        onOpenAnalytics={() => {
          setIsPainLogOpen(false);
          setIsPainAnalyticsOpen(true);
        }}
        recentLogs={painLogs}
        customAreas={customAreas}
        onOpenAddArea={() => setIsAddCustomAreaOpen(true)}
      />

      <PainAnalyticsModal
        isOpen={isPainAnalyticsOpen}
        onClose={() => setIsPainAnalyticsOpen(false)}
        logs={painLogs}
        onOpenChatWithSummary={(sum) => openUniversalChat(sum)}
      />

      <ExerciseModal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        onStartRoutine={(routine) => {
          setIsExerciseModalOpen(false);
          setActiveRunnerRoutine(routine);
          setIsProtocolRunnerOpen(true);
        }}
        onShowDemo={(routine) => {
          setDemoExercise(routine);
        }}
      />

      <ProtocolRunnerModal
        isOpen={isProtocolRunnerOpen}
        onClose={() => setIsProtocolRunnerOpen(false)}
        routine={activeRunnerRoutine}
        onFinish={(routine) => {
          setIsProtocolRunnerOpen(false);
          setCompletedRoutine(routine);
          setIsReliefDeltaOpen(true);
        }}
        onSwapRoutine={() => {
          setIsProtocolRunnerOpen(false);
          setIsExerciseModalOpen(true);
        }}
      />

      <ReliefDeltaModal
        isOpen={isReliefDeltaOpen}
        onClose={() => setIsReliefDeltaOpen(false)}
        routine={completedRoutine}
        onSave={(outcome) => {
          const outcomeLog: PainLogRecord = {
            id: `pl_post_${Date.now()}`,
            score: outcome.postScore,
            locations: [{ area: "Lumbar", percentage: 100 }],
            notes: `Post-${outcome.routineTitle} relief outcome: ${outcome.notes || "Completed routine."}`,
            created_at: new Date().toISOString(),
          };
          setPainLogs((prev) => [outcomeLog, ...prev]);
        }}
      />

      <NotesModal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        notes={notes}
        onSaveNote={(noteInput) => {
          setNotes((prev) => {
            const exists = prev.some((n) => n.id === noteInput.id);
            if (exists) {
              return prev.map((n) => (n.id === noteInput.id ? { ...n, ...noteInput, updated_at: new Date().toISOString() } : n));
            } else {
              const newN: Note = {
                id: noteInput.id || `note_${Date.now()}`,
                title: noteInput.title || "Untitled Note",
                content: noteInput.content || "",
                author: "user",
                pinned: noteInput.pinned || false,
                isArchived: noteInput.isArchived || false,
                tags: noteInput.tags || [],
                order: noteInput.order ?? 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              return [newN, ...prev];
            }
          });
        }}
        onDeleteNote={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))}
        onReorderNotes={(reorderedNotes) => setNotes(reorderedNotes)}
      />

      <CalendarEventModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        event={selectedCalendarEvent}
        mode={calendarModalMode}
        onSave={(evt) => {
          setCalendarEvents((prev) => {
            const exists = prev.some((e) => e.id === evt.id);
            if (exists) return prev.map((e) => (e.id === evt.id ? evt : e));
            return [...prev, evt];
          });
        }}
        onDelete={(id) => setCalendarEvents((prev) => prev.filter((e) => e.id !== id))}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={selectedTask}
        mode={taskModalMode}
        onSave={(t) => {
          setTasks((prev) => {
            const exists = prev.some((x) => x.id === t.id);
            if (exists) return prev.map((x) => (x.id === t.id ? t : x));
            return [...prev, t];
          });
        }}
        onDelete={(id) => setTasks((prev) => prev.filter((x) => x.id !== id))}
        onToggleComplete={(t) => {
          setTasks((prev) =>
            prev.map((x) => (x.id === t.id ? { ...x, status: x.status === "completed" ? "needsAction" : "completed" } : x))
          );
        }}
      />

      <ComposeSmsModal
        isOpen={isComposeSmsOpen}
        onClose={() => setIsComposeSmsOpen(false)}
        onSend={(msg) => setSmsMessages((prev) => [msg, ...prev])}
      />

      <ConsultChecklistModal
        isOpen={isConsultChecklistOpen}
        onClose={() => setIsConsultChecklistOpen(false)}
        onSavePermanentNote={(note) => {
          const newNote: Note = {
            id: `note_consult_${Date.now()}`,
            title: note.title,
            content: note.content,
            author: "user",
            pinned: true,
            isArchived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setNotes((prev) => [newNote, ...prev]);
        }}
      />

      <ExecutiveBriefingModal
        isOpen={isExecutiveBriefingOpen}
        onClose={() => setIsExecutiveBriefingOpen(false)}
        onOpenChat={() => openUniversalChat("Discussing 06:00 AM Morning Executive Briefing priorities.")}
      />

      <EncyclopediaReaderModal
        isOpen={isEncyclopediaReaderOpen}
        onClose={() => setIsEncyclopediaReaderOpen(false)}
        encyclopediaId={activeEncyclopediaId}
        onSaveProgress={(encId, chapterIdx) => {
          const summaryNote: Note = {
            id: `note_learning_${Date.now()}`,
            title: `Learning Session: ${encId.toUpperCase()} Ch. ${chapterIdx + 1}`,
            content: `Completed chapter review for ${encId.toUpperCase()} encyclopedia.\nSaved key protocol takeaways to permanent rehabilitation records.`,
            author: "user",
            pinned: false,
            isArchived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setNotes((prev) => [summaryNote, ...prev]);
        }}
      />

      <BudgetOverviewModal
        isOpen={isBudgetOverviewOpen}
        onClose={() => setIsBudgetOverviewOpen(false)}
        items={budgetItems}
        reports={budgetReports}
        onArchiveReset={(type) => {
          const newRep: BudgetReportRecord = {
            id: `rep_${Date.now()}`,
            period_type: type,
            period_label: `${type === "weekly" ? "Weekly" : "Monthly"} Closeout (${new Date().toLocaleDateString()})`,
            start_date: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
            end_date: new Date().toISOString().slice(0, 10),
            total_spent: totalExpense,
            total_income: totalIncome,
            breakdown_json: JSON.stringify({ Outflow: totalExpense, Inflow: totalIncome }),
            report_markdown: `### Closeout Report (${type})\n- **Total Discretionary Outflow:** $${totalExpense.toFixed(2)}\n- **Total Inflow:** $${totalIncome.toFixed(2)}\n- **Net Balance:** $${netTotal.toFixed(2)}`,
            created_at: new Date().toISOString(),
          };
          setBudgetReports((prev) => [newRep, ...prev]);
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onTriggerRetrievalScan={() => {
          setIsSettingsModalOpen(false);
          openUniversalChat("Running full retrieval scan across Gmail, Google Calendar, and Wangaratta Open-Meteo weather.");
        }}
        onTriggerTelegramCheckin={() => {
          setIsSettingsModalOpen(false);
          setIsPainLogOpen(true);
        }}
      />

      <DelayModal
        isOpen={isDelayModalOpen}
        onClose={() => {
          setIsDelayModalOpen(false);
          setItemToDelay(null);
        }}
        item={itemToDelay}
        onConfirmReschedule={handleAgendaReschedule}
      />

      <DismissConfirmModal
        isOpen={isDismissModalOpen}
        onClose={() => {
          setIsDismissModalOpen(false);
          setItemToDismiss(null);
        }}
        item={itemToDismiss}
        onConfirmDismiss={handleAgendaDismiss}
      />

      <AddCustomAreaModal
        isOpen={isAddCustomAreaOpen}
        onClose={() => setIsAddCustomAreaOpen(false)}
        onAddArea={(areaName) => setCustomAreas((prev) => [...prev, areaName])}
      />

      {/* Rumble AI Chat Modal */}
      {isRumbleChatOpen && (
        <div className="modal-overlay" onClick={() => setIsRumbleChatOpen(false)}>
          <div className="modal-content glass-panel chat-modal-content" style={{ maxWidth: "680px", width: "95%", height: "80vh", padding: "16px" }} onClick={(e) => e.stopPropagation()}>
            <RumbleChat onClose={() => setIsRumbleChatOpen(false)} initialMessage={chatInitialMessage} />
          </div>
        </div>
      )}

      {/* Exercise Demo Dialog */}
      <ExerciseDemoDialog
        exercise={demoExercise}
        onClose={() => setDemoExercise(null)}
      />
    </div>
  );
}

export default App;
