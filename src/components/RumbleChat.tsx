import React, { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

interface ActionPreview {
  type: "pain_log" | "note" | "task" | "multi_action" | "calendar_event" | "send_email" | "send_sms" | "budget_item" | "agent_report" | "create_pr";
  data: Record<string, any>;
}

interface RumbleChatProps {
  onClose?: () => void;
  initialMessage?: string;
}

export function RumbleChat({ onClose, initialMessage }: RumbleChatProps) {
  const [actionStatuses, setActionStatuses] = useState<Record<string, { status: "pending" | "confirmed" | "cancelled"; resultMessage?: string }>>({});
  const [inputMessage, setInputMessage] = useState(initialMessage || "");
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    messages,
    sendMessage,
    status,
    error: chatError,
  } = useChat({
    transport: new DefaultChatTransport({ api: "/api/v1/rumble/chat" }),
    messages: [
      {
        id: "m_welcome",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Hello. Type or use voice to speak directly with me regarding your agenda, symptoms, or recovery.",
          },
        ],
      },
    ],
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-send initialMessage if provided (Universal Intent Capture)
  useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      sendMessage({ text: initialMessage.trim() }).catch((err: any) => {
        console.warn("Failed to auto-send initial message:", err);
      });
    }
  }, [initialMessage]);

  const onSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || isLoading) return;
    setInputMessage("");
    setLocalError(null);
    try {
      await sendMessage({ text: trimmed });
    } catch (err: any) {
      setLocalError(err.message || "Failed to send message to Rumble OS");
    }
  };

  const handleConfirmAction = async (actionId: string, preview: ActionPreview) => {
    try {
      const res = await fetch("/api/v1/rumble/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirm_action: preview,
          pending_action_id: actionId,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.status === "error") {
        throw new Error(data.error || "Failed to commit confirmed action");
      }

      setActionStatuses((prev) => ({
        ...prev,
        [actionId]: {
          status: "confirmed",
          resultMessage: data.reply || "Action confirmed and saved to database.",
        },
      }));
    } catch (err: any) {
      setLocalError(`Error confirming action: ${err.message}`);
    }
  };

  const handleCancelAction = async (actionId: string) => {
    try {
      await fetch("/api/v1/rumble/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancel_action: true,
          pending_action_id: actionId,
        }),
      });

      setActionStatuses((prev) => ({
        ...prev,
        [actionId]: {
          status: "cancelled",
          resultMessage: "Action cancelled.",
        },
      }));
    } catch (err: any) {
      setLocalError(`Error cancelling action: ${err.message}`);
    }
  };

  const exportChatJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `rumble_chat_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="chat-modal-inner" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/Rumble_Icon.png" alt="Rumble" style={{ width: "28px", height: "28px", borderRadius: "6px" }} />
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Chat with RUMBLE</h2>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button className="btn btn-outline btn-sm" onClick={exportChatJson} type="button" title="Export Chat as JSON">
            Export JSON
          </button>
          {onClose && (
            <button className="btn-close" onClick={onClose} type="button" aria-label="Close chat">
              &times;
            </button>
          )}
        </div>
      </div>

      {localError || chatError ? (
        <div
          role="alert"
          className="alert-banner"
          style={{
            background: "rgba(220, 38, 38, 0.2)",
            borderLeft: "3px solid var(--neon-red)",
            padding: "8px 12px",
            borderRadius: "6px",
            marginBottom: "8px",
            fontSize: "0.85rem",
            color: "var(--neon-red)",
          }}
        >
          {localError || chatError?.message || "Chat service is temporarily unavailable."}
        </div>
      ) : null}

      <div
        className="chat-messages"
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "10px 0",
          minHeight: "260px",
          maxHeight: "440px",
        }}
      >
        {messages.map((m) => {
          const isUser = (m.role as string) === "user";
          return (
            <div
              key={m.id}
              className={`message ${isUser ? "user-message" : "rumble-message"}`}
              style={{
                padding: "12px 14px",
                borderRadius: "10px",
                maxWidth: "88%",
                alignSelf: isUser ? "flex-end" : "flex-start",
                background: isUser ? "rgba(181, 0, 255, 0.15)" : "rgba(0, 240, 255, 0.08)",
                border: isUser ? "1px solid rgba(181, 0, 255, 0.3)" : "1px solid rgba(0, 240, 255, 0.3)",
                fontSize: "0.9rem",
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  color: isUser ? "var(--neon-purple)" : "var(--neon-blue)",
                  fontWeight: "bold",
                  marginBottom: "4px",
                }}
              >
                {isUser ? "YOU" : "RUMBLE"}
              </div>

              {/* Text content from parts */}
              {m.parts &&
                m.parts.map((part: any, pIdx: number) => {
                  if (part.type === "text") {
                    return (
                      <div key={pIdx} style={{ whiteSpace: "pre-wrap" }}>
                        {part.text}
                      </div>
                    );
                  }

                  // Tool invocation parts (Generative UI)
                  const isTool =
                    part.type === "tool-invocation" ||
                    part.type === "dynamic-tool" ||
                    (typeof part.type === "string" && part.type.startsWith("tool-"));

                  if (isTool) {
                    const toolName = part.toolName || (part.type.startsWith("tool-") ? part.type.replace(/^tool-/, "") : "");
                    const actionId = part.toolCallId || part.id || `${m.id}_tool_${pIdx}`;
                    const args = part.input || part.args || {};
                    const statusInfo = actionStatuses[actionId] || { status: "pending" };

                    return (
                      <div key={pIdx} style={{ marginTop: "10px" }}>
                        {(toolName === "painLog" || toolName === "pain_log") && (
                          <PainLogConfirmationCard
                            actionId={actionId}
                            initialScore={args.score || 5}
                            locations={args.locations || [{ area: "lumbar", percentage: 100 }]}
                            initialMood={args.mood || ""}
                            initialNotes={args.notes || ""}
                            status={statusInfo.status}
                            resultMessage={statusInfo.resultMessage}
                            onConfirm={(data) => handleConfirmAction(actionId, { type: "pain_log", data })}
                            onCancel={() => handleCancelAction(actionId)}
                          />
                        )}

                        {(toolName === "manageAgenda" || toolName === "agendaItem") && (
                          <AgendaConfirmationCard
                            actionId={actionId}
                            action={args.action || "create"}
                            title={args.title || "Scheduled Item"}
                            scheduledTime={args.scheduled_time || ""}
                            status={statusInfo.status}
                            resultMessage={statusInfo.resultMessage}
                            onConfirm={() => handleConfirmAction(actionId, { type: "task", data: args })}
                            onCancel={() => handleCancelAction(actionId)}
                          />
                        )}

                        {(toolName === "saveNote" || toolName === "note") && (
                          <NoteConfirmationCard
                            actionId={actionId}
                            content={args.content || ""}
                            author={args.author || "user"}
                            status={statusInfo.status}
                            resultMessage={statusInfo.resultMessage}
                            onConfirm={() => handleConfirmAction(actionId, { type: "note", data: args })}
                            onCancel={() => handleCancelAction(actionId)}
                          />
                        )}

                        {(toolName === "manageCalendar" || toolName === "calendarAction") && (
                          <CalendarConfirmationCard
                            actionId={actionId}
                            action={args.action || "create"}
                            summary={args.summary || ""}
                            startDatetime={args.start_datetime || ""}
                            endDatetime={args.end_datetime}
                            status={statusInfo.status}
                            resultMessage={statusInfo.resultMessage}
                            onConfirm={() => handleConfirmAction(actionId, { type: "calendar_event", data: args })}
                            onCancel={() => handleCancelAction(actionId)}
                          />
                        )}

                        {(toolName === "draftEmail" || toolName === "emailAction") && (
                          <EmailConfirmationCard
                            actionId={actionId}
                            to={args.to || ""}
                            subject={args.subject || ""}
                            body={args.body || ""}
                            status={statusInfo.status}
                            resultMessage={statusInfo.resultMessage}
                            onConfirm={() => handleConfirmAction(actionId, { type: "send_email", data: args })}
                            onCancel={() => handleCancelAction(actionId)}
                          />
                        )}

                        {(toolName === "draftSms" || toolName === "smsAction") && (
                          <SmsConfirmationCard
                            actionId={actionId}
                            to={args.to || ""}
                            body={args.body || ""}
                            status={statusInfo.status}
                            resultMessage={statusInfo.resultMessage}
                            onConfirm={() => handleConfirmAction(actionId, { type: "send_sms", data: args })}
                            onCancel={() => handleCancelAction(actionId)}
                          />
                        )}

                        {(toolName === "logBudgetItem" || toolName === "budgetItem") && (
                          <BudgetConfirmationCard
                            actionId={actionId}
                            description={args.description || ""}
                            amount={args.amount || 0}
                            category={args.category || ""}
                            type={args.type || "expense"}
                            status={statusInfo.status}
                            resultMessage={statusInfo.resultMessage}
                            onConfirm={() => handleConfirmAction(actionId, { type: "budget_item", data: args })}
                            onCancel={() => handleCancelAction(actionId)}
                          />
                        )}

                        {(toolName === "searchSemanticMemory" || toolName === "semanticMemory") && (
                          <SemanticMemoryCard
                            query={args.query || ""}
                            sourceType={args.source_type || "all"}
                          />
                        )}

                        {(toolName === "createPullRequest" || toolName === "createPr") && (
                          <PrConfirmationCard
                            actionId={actionId}
                            title={args.title || ""}
                            slug={args.slug || ""}
                            summary={args.summary || ""}
                            files={args.files || []}
                            diff={args.diff || (part as any).result?.preview?.data?.diff}
                            status={statusInfo.status}
                            resultMessage={statusInfo.resultMessage}
                            onConfirm={() =>
                              handleConfirmAction(actionId, {
                                type: "create_pr",
                                data: (part as any).result?.preview?.data || {
                                  title: args.title,
                                  slug: args.slug,
                                  summary: args.summary,
                                  files: args.files,
                                },
                              })
                            }
                            onCancel={() => handleCancelAction(actionId)}
                          />
                        )}

                        {(toolName === "runSandboxCode" || toolName === "sandboxExecute") && (
                          <SandboxExecutionCard
                            code={args.code || ""}
                            language={args.language || "python"}
                            status={(part as any).result?.status}
                            stdout={(part as any).result?.stdout}
                            stderr={(part as any).result?.stderr}
                            executionTimeMs={(part as any).result?.execution_time_ms}
                          />
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
            </div>
          );
        })}

        {isLoading && (
          <div style={{ color: "var(--neon-blue)", fontSize: "0.85rem", fontStyle: "italic", padding: "6px 10px" }}>
            Rumble is analyzing…
          </div>
        )}
      </div>

      <form onSubmit={onSendMessage} style={{ marginTop: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="text"
          aria-label="Message"
          className="glass-input"
          placeholder="Type to Rumble, ask about recovery, agenda, or symptoms…"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          style={{ flex: 1, padding: "10px 14px", fontSize: "0.9rem" }}
        />
        <button
          className="btn btn-neon-blue btn-sm"
          type="submit"
          aria-label="Send message"
          disabled={isLoading || !inputMessage.trim()}
        >
          Send message
        </button>
      </form>
    </div>
  );
}

// ==========================================
// GENERATIVE UI CONFIRMATION WIDGETS
// ==========================================

function PainLogConfirmationCard({
  actionId,
  initialScore,
  locations,
  initialMood,
  initialNotes,
  status,
  resultMessage,
  onConfirm,
  onCancel,
}: {
  actionId: string;
  initialScore: number;
  locations: Array<{ area: string; side?: string; percentage: number }>;
  initialMood: string;
  initialNotes: string;
  status: "pending" | "confirmed" | "cancelled";
  resultMessage?: string;
  onConfirm: (data: { score: number; locations: any[]; mood?: string; notes?: string }) => void;
  onCancel: () => void;
}) {
  const [score, setScore] = useState(initialScore);
  const [mood, setMood] = useState(initialMood);
  const [notes, setNotes] = useState(initialNotes);

  const moodOptions = [
    { label: "Great", symbol: "😀" },
    { label: "Good", symbol: "🙂" },
    { label: "Okay", symbol: "😐" },
    { label: "Low", symbol: "🙁" },
    { label: "Severe", symbol: "😣" },
  ];

  if (status === "confirmed") {
    return (
      <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(0, 255, 128, 0.1)", border: "1px solid var(--neon-green)" }}>
        <div style={{ fontWeight: "bold", color: "var(--neon-green)", fontSize: "0.85rem" }}>Confirmed & Saved</div>
        <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>{resultMessage}</div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(128, 128, 128, 0.1)", color: "#888", fontSize: "0.8rem" }}>
        Action cancelled.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "8px",
        background: "rgba(20, 20, 35, 0.9)",
        border: "1px solid var(--neon-blue)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--neon-blue)", fontWeight: "bold" }}>
          Confirm Pain Log
        </span>
        <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: score >= 7 ? "var(--neon-red)" : "var(--neon-blue)" }}>
          {score}/10
        </span>
      </div>

      {/* Pain slider */}
      <div>
        <label htmlFor={`slider_${actionId}`} style={{ fontSize: "0.75rem", color: "#aaa" }}>
          Adjust Pain Severity (1 - 10):
        </label>
        <input
          id={`slider_${actionId}`}
          type="range"
          min="1"
          max="10"
          value={score}
          onChange={(e) => setScore(parseInt(e.target.value, 10))}
          style={{ width: "100%", accentColor: "var(--neon-blue)", marginTop: "4px" }}
        />
      </div>

      {/* Locations */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {locations.map((loc, idx) => (
          <span
            key={idx}
            style={{
              fontSize: "0.75rem",
              padding: "2px 8px",
              borderRadius: "4px",
              background: "rgba(0, 240, 255, 0.15)",
              border: "1px solid rgba(0, 240, 255, 0.3)",
              color: "#fff",
            }}
          >
            {loc.side && loc.side !== "unspecified" ? `${loc.side} ` : ""}
            {loc.area} ({loc.percentage}%)
          </span>
        ))}
      </div>

      {/* Mood Selector (Allowed Symbol/Emoji Exception) */}
      <div>
        <div style={{ fontSize: "0.75rem", color: "#aaa", marginBottom: "4px" }}>Mood Selector:</div>
        <div style={{ display: "flex", gap: "6px" }}>
          {moodOptions.map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={() => setMood(m.label)}
              style={{
                background: mood === m.label ? "rgba(0, 240, 255, 0.3)" : "rgba(255, 255, 255, 0.05)",
                border: mood === m.label ? "1px solid var(--neon-blue)" : "1px solid #444",
                borderRadius: "6px",
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
              title={m.label}
            >
              {m.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <input
          type="text"
          className="glass-input"
          placeholder="Optional notes or aggravating triggers…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ width: "100%", padding: "6px 10px", fontSize: "0.8rem", borderRadius: "4px" }}
        />
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button
          type="button"
          className="btn btn-neon-blue btn-sm"
          style={{ flex: 1, padding: "6px 10px" }}
          onClick={() => onConfirm({ score, locations, mood: mood || undefined, notes: notes || undefined })}
        >
          Confirm & Log
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ padding: "6px 10px" }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function AgendaConfirmationCard({
  action,
  title,
  scheduledTime,
  status,
  resultMessage,
  onConfirm,
  onCancel,
}: {
  actionId: string;
  action: string;
  title: string;
  scheduledTime: string;
  status: "pending" | "confirmed" | "cancelled";
  resultMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (status === "confirmed") {
    return (
      <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(0, 255, 128, 0.1)", border: "1px solid var(--neon-green)", fontSize: "0.85rem" }}>
        {resultMessage || "Task confirmed and added to agenda."}
      </div>
    );
  }

  if (status === "cancelled") {
    return <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(128, 128, 128, 0.1)", color: "#888", fontSize: "0.8rem" }}>Action cancelled.</div>;
  }

  return (
    <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(20, 20, 35, 0.9)", border: "1px solid var(--neon-purple)", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--neon-purple)", fontWeight: "bold" }}>
        {action === "reschedule" ? "Reschedule Task Preview" : "Add to Agenda Preview"}
      </div>
      <div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>{title}</div>
      <div style={{ fontSize: "0.8rem", color: "#aaa" }}>
        Scheduled: {new Date(scheduledTime).toLocaleString("en-AU", { timeZone: "Australia/Melbourne" })}
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button type="button" className="btn btn-neon-blue btn-sm" style={{ flex: 1 }} onClick={onConfirm}>
          Confirm & Add
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function NoteConfirmationCard({
  content,
  author,
  status,
  resultMessage,
  onConfirm,
  onCancel,
}: {
  actionId: string;
  content: string;
  author: string;
  status: "pending" | "confirmed" | "cancelled";
  resultMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (status === "confirmed") {
    return (
      <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(0, 255, 128, 0.1)", border: "1px solid var(--neon-green)", fontSize: "0.85rem" }}>
        {resultMessage || "Note saved."}
      </div>
    );
  }

  if (status === "cancelled") {
    return <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(128, 128, 128, 0.1)", color: "#888", fontSize: "0.8rem" }}>Action cancelled.</div>;
  }

  return (
    <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(20, 20, 35, 0.9)", border: "1px solid #ffd700", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "#ffd700", fontWeight: "bold" }}>
        Save Note Preview
      </div>
      <div style={{ fontSize: "0.85rem", fontStyle: "italic", whiteSpace: "pre-wrap" }}>"{content}"</div>
      <div style={{ fontSize: "0.75rem", color: "#888" }}>Author: {author}</div>
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button type="button" className="btn btn-neon-blue btn-sm" style={{ flex: 1 }} onClick={onConfirm}>
          Confirm & Save
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function CalendarConfirmationCard({
  action,
  summary,
  startDatetime,
  endDatetime,
  status,
  resultMessage,
  onConfirm,
  onCancel,
}: {
  actionId: string;
  action: string;
  summary: string;
  startDatetime: string;
  endDatetime?: string;
  status: "pending" | "confirmed" | "cancelled";
  resultMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (status === "confirmed") {
    return <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(0, 255, 128, 0.1)", border: "1px solid var(--neon-green)", fontSize: "0.85rem" }}>{resultMessage}</div>;
  }
  if (status === "cancelled") {
    return <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(128, 128, 128, 0.1)", color: "#888", fontSize: "0.8rem" }}>Action cancelled.</div>;
  }

  return (
    <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(20, 20, 35, 0.9)", border: "1px solid var(--neon-blue)", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--neon-blue)", fontWeight: "bold" }}>
        Calendar {action} Preview
      </div>
      <div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>{summary}</div>
      <div style={{ fontSize: "0.8rem", color: "#aaa" }}>
        Start: {new Date(startDatetime).toLocaleString("en-AU", { timeZone: "Australia/Melbourne" })}
        {endDatetime && ` | End: ${new Date(endDatetime).toLocaleString("en-AU", { timeZone: "Australia/Melbourne" })}`}
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button type="button" className="btn btn-neon-blue btn-sm" style={{ flex: 1 }} onClick={onConfirm}>
          Confirm Calendar Event
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function EmailConfirmationCard({
  to,
  subject,
  body,
  status,
  resultMessage,
  onConfirm,
  onCancel,
}: {
  actionId: string;
  to: string;
  subject: string;
  body: string;
  status: "pending" | "confirmed" | "cancelled";
  resultMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (status === "confirmed") {
    return <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(0, 255, 128, 0.1)", border: "1px solid var(--neon-green)", fontSize: "0.85rem" }}>{resultMessage}</div>;
  }
  if (status === "cancelled") {
    return <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(128, 128, 128, 0.1)", color: "#888", fontSize: "0.8rem" }}>Action cancelled.</div>;
  }

  return (
    <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(20, 20, 35, 0.9)", border: "1px solid var(--neon-red)", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--neon-red)", fontWeight: "bold" }}>
        Email Send Approval Required
      </div>
      <div style={{ fontSize: "0.85rem" }}><strong>To:</strong> {to}</div>
      <div style={{ fontSize: "0.85rem" }}><strong>Subject:</strong> {subject}</div>
      <div style={{ fontSize: "0.8rem", maxHeight: "120px", overflowY: "auto", background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "4px", whiteSpace: "pre-wrap" }}>
        {body}
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button type="button" className="btn btn-neon-blue btn-sm" style={{ flex: 1 }} onClick={onConfirm}>
          Confirm & Dispatch
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function SmsConfirmationCard({
  to,
  body,
  status,
  resultMessage,
  onConfirm,
  onCancel,
}: {
  actionId: string;
  to: string;
  body: string;
  status: "pending" | "confirmed" | "cancelled";
  resultMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (status === "confirmed") {
    return <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(0, 255, 128, 0.1)", border: "1px solid var(--neon-green)", fontSize: "0.85rem" }}>{resultMessage}</div>;
  }
  if (status === "cancelled") {
    return <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(128, 128, 128, 0.1)", color: "#888", fontSize: "0.8rem" }}>Action cancelled.</div>;
  }

  return (
    <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(20, 20, 35, 0.9)", border: "1px solid var(--neon-blue)", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--neon-blue)", fontWeight: "bold" }}>
        SMS Send Approval Required
      </div>
      <div style={{ fontSize: "0.85rem" }}><strong>To:</strong> {to}</div>
      <div style={{ fontSize: "0.8rem", background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "4px", whiteSpace: "pre-wrap" }}>
        "{body}"
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button type="button" className="btn btn-neon-blue btn-sm" style={{ flex: 1 }} onClick={onConfirm}>
          Confirm & Send SMS
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function BudgetConfirmationCard({
  description,
  amount,
  category,
  type,
  status,
  resultMessage,
  onConfirm,
  onCancel,
}: {
  actionId: string;
  description: string;
  amount: number;
  category: string;
  type: string;
  status: "pending" | "confirmed" | "cancelled";
  resultMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (status === "confirmed") {
    return <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(0, 255, 128, 0.1)", border: "1px solid var(--neon-green)", fontSize: "0.85rem" }}>{resultMessage}</div>;
  }
  if (status === "cancelled") {
    return <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(128, 128, 128, 0.1)", color: "#888", fontSize: "0.8rem" }}>Action cancelled.</div>;
  }

  return (
    <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(20, 20, 35, 0.9)", border: "1px solid var(--neon-green)", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--neon-green)", fontWeight: "bold" }}>
        Budget {type === "expense" ? "Expense" : "Income"} Preview
      </div>
      <div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>${amount.toFixed(2)} - {description}</div>
      <div style={{ fontSize: "0.75rem", color: "#888" }}>Category: {category}</div>
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button type="button" className="btn btn-neon-blue btn-sm" style={{ flex: 1 }} onClick={onConfirm}>
          Confirm & Log {type === "expense" ? "Expense" : "Income"}
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function SemanticMemoryCard({
  query,
  sourceType,
}: {
  query: string;
  sourceType: string;
}) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: "8px",
        background: "rgba(0, 240, 255, 0.05)",
        border: "1px solid rgba(0, 240, 255, 0.3)",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        fontSize: "0.85rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--neon-blue)", fontWeight: "bold" }}>
          Semantic Memory Search
        </span>
        <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>pgvector</span>
      </div>
      <div style={{ color: "var(--text-primary)" }}>
        Searching <strong>{sourceType === "all" ? "all records" : sourceType}</strong> for: &ldquo;{query}&rdquo;
      </div>
    </div>
  );
}

function PrConfirmationCard({
  title,
  slug,
  summary,
  files,
  diff,
  status,
  resultMessage,
  onConfirm,
  onCancel,
}: {
  actionId: string;
  title: string;
  slug: string;
  summary: string;
  files: Array<{ path: string; content?: string }>;
  diff?: string;
  status: "pending" | "confirmed" | "cancelled";
  resultMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const branch = `feat/rumble-${(slug || "patch").toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/^-+|-+$/g, "").slice(0, 40)}`;

  if (status === "confirmed") {
    return (
      <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(0, 255, 128, 0.1)", border: "1px solid var(--neon-green)", fontSize: "0.85rem" }}>
        <div style={{ fontWeight: "bold", color: "var(--neon-green)", marginBottom: "4px" }}>
          Pull Request Created Successfully
        </div>
        <div>{resultMessage}</div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(128, 128, 128, 0.1)", color: "#888", fontSize: "0.8rem" }}>
        PR creation cancelled.
      </div>
    );
  }

  return (
    <div style={{ padding: "14px", borderRadius: "8px", background: "rgba(20, 20, 35, 0.95)", border: "1px solid var(--neon-blue)", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--neon-blue)", fontWeight: "bold" }}>
          GitHub Pull Request Preview
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--neon-purple)", fontFamily: "monospace" }}>
          {branch}
        </span>
      </div>

      <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#fff" }}>
        {title}
      </div>

      <div style={{ fontSize: "0.85rem", color: "#ccc" }}>
        {summary}
      </div>

      {files && files.length > 0 && (
        <div style={{ fontSize: "0.8rem" }}>
          <strong style={{ color: "var(--text-secondary)" }}>Files to commit ({files.length}):</strong>
          <ul style={{ margin: "4px 0 0 16px", padding: 0, fontFamily: "monospace", color: "var(--neon-cyan, #00e5ff)" }}>
            {files.map((f, idx) => (
              <li key={idx}>{f.path}</li>
            ))}
          </ul>
        </div>
      )}

      {diff && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "bold" }}>Diff Preview:</span>
          <pre
            style={{
              fontSize: "0.75rem",
              background: "rgba(0, 0, 0, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "4px",
              padding: "8px",
              maxHeight: "150px",
              overflowY: "auto",
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              color: "#80cbc4",
            }}
          >
            {diff}
          </pre>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button type="button" className="btn btn-neon-blue btn-sm" style={{ flex: 1 }} onClick={onConfirm}>
          Confirm & Open PR
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function SandboxExecutionCard({
  code,
  language,
  stdout,
  stderr,
  executionTimeMs,
}: {
  code: string;
  language?: string;
  status?: string;
  stdout?: string;
  stderr?: string;
  executionTimeMs?: number;
}) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "8px",
        background: "rgba(10, 15, 25, 0.9)",
        border: "1px solid var(--neon-purple, #b388ff)",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        fontSize: "0.85rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--neon-purple, #b388ff)", fontWeight: "bold" }}>
          Sandboxed Execution ({language || "python"})
        </span>
        <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
          {executionTimeMs !== undefined ? `${executionTimeMs}ms` : "isolated runner"}
        </span>
      </div>

      <pre
        style={{
          fontSize: "0.75rem",
          background: "rgba(0,0,0,0.4)",
          padding: "6px 8px",
          borderRadius: "4px",
          margin: 0,
          fontFamily: "monospace",
          maxHeight: "100px",
          overflowY: "auto",
          whiteSpace: "pre-wrap",
          color: "#e0e0e0",
        }}
      >
        {code}
      </pre>

      {stdout && (
        <div style={{ fontSize: "0.8rem", color: "var(--neon-green)", fontFamily: "monospace" }}>
          <strong>Output:</strong> {stdout}
        </div>
      )}
      {stderr && (
        <div style={{ fontSize: "0.8rem", color: "var(--neon-red)", fontFamily: "monospace" }}>
          <strong>Error:</strong> {stderr}
        </div>
      )}
    </div>
  );
}
