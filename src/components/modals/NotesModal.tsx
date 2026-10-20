import React, { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Pin,
  Archive,
  ArchiveRestore,
  Trash2,
  GripVertical,
  Tag as TagIcon,
  Plus,
  X,
  Check,
  Search,
} from "lucide-react";
import { Note } from "../../types";

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onSaveNote: (note: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onReorderNotes?: (reorderedNotes: Note[]) => void;
}

// Preset popular categories with clean styling
const PRESET_TAGS = [
  "#urgent",
  "#health",
  "#finance",
  "#rehab",
  "#legal",
  "#personal",
];

export function getTagStyle(tag: string): { bg: string; color: string; border: string } {
  const clean = tag.toLowerCase().replace(/^#/, "");
  switch (clean) {
    case "urgent":
      return {
        bg: "rgba(239, 68, 68, 0.18)",
        color: "#f87171",
        border: "rgba(239, 68, 68, 0.45)",
      };
    case "health":
    case "medical":
      return {
        bg: "rgba(16, 185, 129, 0.18)",
        color: "#34d399",
        border: "rgba(16, 185, 129, 0.45)",
      };
    case "finance":
    case "budget":
      return {
        bg: "rgba(245, 158, 11, 0.18)",
        color: "#fbbf24",
        border: "rgba(245, 158, 11, 0.45)",
      };
    case "rehab":
    case "hydro":
    case "exercise":
      return {
        bg: "rgba(6, 182, 212, 0.18)",
        color: "#38bdf8",
        border: "rgba(6, 182, 212, 0.45)",
      };
    case "legal":
      return {
        bg: "rgba(168, 85, 247, 0.18)",
        color: "#c084fc",
        border: "rgba(168, 85, 247, 0.45)",
      };
    case "personal":
      return {
        bg: "rgba(99, 102, 241, 0.18)",
        color: "#818cf8",
        border: "rgba(99, 102, 241, 0.45)",
      };
    default:
      return {
        bg: "rgba(56, 189, 248, 0.15)",
        color: "#93c5fd",
        border: "rgba(56, 189, 248, 0.35)",
      };
  }
}

export function NotesModal({
  isOpen,
  onClose,
  notes,
  onSaveNote,
  onDeleteNote,
  onReorderNotes,
}: NotesModalProps) {
  const [activeTab, setActiveTab] = useState<"notes" | "followup" | "archived">("notes");
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [activeFilterTag, setActiveFilterTag] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const [followUpText, setFollowUpText] = useState(
    "- Confirm Dr Khan received MRI imaging report from I-MED\n- Follow up Chemist Warehouse outreach statement for Solicitor\n- Check Deakin MFA unlock status with student central"
  );
  const [followUpSavedStatus, setFollowUpSavedStatus] = useState("");

  // Sensors for dnd-kit: pointer sensor requires 5px drag distance to avoid accidental dragging on click
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Collect all unique tags across notes for filtering
  const allAvailableTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    notes.forEach((note) => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach((t) => {
          const formatted = t.trim().startsWith("#") ? t.trim().toLowerCase() : `#${t.trim().toLowerCase()}`;
          tagMap.set(formatted, (tagMap.get(formatted) || 0) + 1);
        });
      }
    });
    return Array.from(tagMap.entries()).map(([tag, count]) => ({ tag, count }));
  }, [notes]);

  if (!isOpen) return null;

  const handleCreateOrUpdate = () => {
    if (!title.trim() && !content.trim()) {
      setIsEditorExpanded(false);
      setEditingId(null);
      return;
    }

    // Auto-detect hashtags in content or title if not explicitly added
    const textToScan = `${title} ${content}`;
    const detectedTags = (textToScan.match(/#[a-zA-Z0-9_\-]+/g) || []).map((t) => t.toLowerCase());
    const mergedTags = Array.from(new Set([...selectedTags, ...detectedTags]));

    onSaveNote({
      id: editingId || `note_${Date.now()}`,
      title: title.trim() || "Untitled Note",
      content: content.trim(),
      pinned: isPinned,
      isArchived: false,
      tags: mergedTags,
      order: editingId ? undefined : 0,
    });

    setTitle("");
    setContent("");
    setIsPinned(false);
    setSelectedTags([]);
    setCustomTagInput("");
    setIsEditorExpanded(false);
    setEditingId(null);
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setIsPinned(note.pinned);
    setSelectedTags(note.tags || []);
    setCustomTagInput("");
    setIsEditorExpanded(true);
    setActiveTab("notes");
  };

  const cancelEdit = () => {
    setTitle("");
    setContent("");
    setIsPinned(false);
    setSelectedTags([]);
    setCustomTagInput("");
    setIsEditorExpanded(false);
    setEditingId(null);
  };

  const togglePin = (note: Note) => {
    onSaveNote({ ...note, pinned: !note.pinned });
  };

  const toggleArchive = (note: Note) => {
    onSaveNote({ ...note, isArchived: !note.isArchived });
  };

  const toggleTag = (tag: string) => {
    const formatted = tag.trim().startsWith("#") ? tag.trim().toLowerCase() : `#${tag.trim().toLowerCase()}`;
    if (selectedTags.includes(formatted)) {
      setSelectedTags(selectedTags.filter((t) => t !== formatted));
    } else {
      setSelectedTags([...selectedTags, formatted]);
    }
  };

  const addCustomTag = () => {
    if (!customTagInput.trim()) return;
    const clean = customTagInput.trim().replace(/^#+/, "").toLowerCase();
    if (!clean) return;
    const formatted = `#${clean}`;
    if (!selectedTags.includes(formatted)) {
      setSelectedTags([...selectedTags, formatted]);
    }
    setCustomTagInput("");
  };

  const saveFollowUp = () => {
    setFollowUpSavedStatus("Saved to permanent memory ✓");
    setTimeout(() => setFollowUpSavedStatus(""), 3000);
  };

  // Reordering handler
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeNote = notes.find((n) => n.id === activeId);
    const overNote = notes.find((n) => n.id === overId);
    if (!activeNote || !overNote) return;

    let updatedList = [...notes];

    // If dragged between pinned/unpinned sections, match pinned status
    if (activeNote.pinned !== overNote.pinned) {
      updatedList = updatedList.map((n) =>
        n.id === activeNote.id ? { ...n, pinned: overNote.pinned } : n
      );
    }

    const oldIndex = updatedList.findIndex((n) => n.id === activeId);
    const newIndex = updatedList.findIndex((n) => n.id === overId);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(updatedList, oldIndex, newIndex).map((note, idx) => ({
        ...note,
        order: idx,
      }));
      if (onReorderNotes) {
        onReorderNotes(reordered);
      } else {
        reordered.forEach((n) => onSaveNote(n));
      }
    }
  };

  // Filter notes by active tag filter if selected
  const filterByTag = (list: Note[]) => {
    if (!activeFilterTag) return list;
    return list.filter((n) =>
      n.tags?.some((t) => t.toLowerCase() === activeFilterTag.toLowerCase())
    );
  };

  const pinnedNotes = filterByTag(notes.filter((n) => !n.isArchived && n.pinned));
  const unpinnedNotes = filterByTag(notes.filter((n) => !n.isArchived && !n.pinned));
  const archivedNotes = filterByTag(notes.filter((n) => n.isArchived));

  const activeDragNote = activeDragId ? notes.find((n) => n.id === activeDragId) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel"
        style={{
          maxWidth: "960px",
          width: "95%",
          height: "88vh",
          display: "flex",
          flexDirection: "column",
          padding: "20px",
          background: "rgba(15, 17, 26, 0.94)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="modal-header"
          style={{
            flexShrink: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            paddingBottom: "12px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#f8fafc", fontWeight: 700 }}>
              Notes &amp; Scratchpad
            </h2>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--neon-blue)",
                background: "rgba(56, 189, 248, 0.1)",
                padding: "3px 8px",
                borderRadius: "4px",
                border: "1px solid rgba(56, 189, 248, 0.2)",
              }}
            >
              Drag &amp; Drop Reorder Active
            </span>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              className={`btn btn-sm ${activeTab === "notes" ? "btn-neon-blue" : "btn-outline"}`}
              type="button"
              onClick={() => setActiveTab("notes")}
            >
              Notes ({notes.filter((n) => !n.isArchived).length})
            </button>
            <button
              className={`btn btn-sm ${activeTab === "followup" ? "btn-neon-red" : "btn-outline"}`}
              type="button"
              onClick={() => setActiveTab(activeTab === "followup" ? "notes" : "followup")}
              title="View Follow Up List"
            >
              Follow Up
            </button>
            <button
              className={`btn btn-sm ${activeTab === "archived" ? "btn-neon-purple" : "btn-outline"}`}
              type="button"
              onClick={() => setActiveTab(activeTab === "archived" ? "notes" : "archived")}
              title="View Archived Notes"
            >
              <Archive size={14} style={{ marginRight: "4px" }} />
              Archive ({notes.filter((n) => n.isArchived).length})
            </button>
            <button className="btn-close" onClick={onClose} type="button" aria-label="Close modal">
              &times;
            </button>
          </div>
        </div>

        {/* Tag Filter Toolbar (Visible when notes tab or archive is open) */}
        {activeTab !== "followup" && allAvailableTags.length > 0 && (
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              marginBottom: "12px",
              background: "rgba(0, 0, 0, 0.35)",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              overflowX: "auto",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                flexShrink: 0,
              }}
            >
              <TagIcon size={12} /> Filter:
            </span>

            <button
              type="button"
              className={`btn btn-sm ${!activeFilterTag ? "btn-neon-blue" : "btn-outline"}`}
              style={{
                fontSize: "0.75rem",
                padding: "2px 8px",
                borderRadius: "4px",
                flexShrink: 0,
              }}
              onClick={() => setActiveFilterTag(null)}
            >
              All Notes
            </button>

            {allAvailableTags.map(({ tag, count }) => {
              const tagStyle = getTagStyle(tag);
              const isSelected = activeFilterTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveFilterTag(isSelected ? null : tag)}
                  style={{
                    fontSize: "0.75rem",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: isSelected ? tagStyle.bg : "rgba(255, 255, 255, 0.04)",
                    color: isSelected ? tagStyle.color : "var(--text-secondary)",
                    border: `1px solid ${isSelected ? tagStyle.border : "rgba(255, 255, 255, 0.08)"}`,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{tag}</span>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      background: "rgba(0,0,0,0.3)",
                      padding: "1px 4px",
                      borderRadius: "3px",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {activeFilterTag && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{
                  fontSize: "0.72rem",
                  padding: "2px 6px",
                  color: "var(--text-muted)",
                  flexShrink: 0,
                  marginLeft: "auto",
                }}
                onClick={() => setActiveFilterTag(null)}
              >
                Clear filter
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
          {activeTab === "followup" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight: "400px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1.05rem", color: "var(--neon-red)", fontWeight: 700 }}>
                  Critical Follow Up Items
                </h3>
                <span style={{ fontSize: "0.8rem", color: "var(--neon-green)" }}>{followUpSavedStatus}</span>
              </div>
              <textarea
                className="glass-input"
                style={{
                  flex: 1,
                  minHeight: "320px",
                  resize: "none",
                  fontFamily: "monospace",
                  fontSize: "0.95rem",
                  padding: "14px",
                  border: "1px solid rgba(255, 60, 60, 0.35)",
                  background: "rgba(20, 0, 0, 0.35)",
                  borderRadius: "8px",
                }}
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="btn btn-sm btn-outline"
                  style={{ borderColor: "var(--neon-red)", color: "var(--neon-red)" }}
                  type="button"
                  onClick={saveFollowUp}
                >
                  Save Follow Up List
                </button>
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {/* Note Editor */}
              {activeTab === "notes" && (
                <div
                  className="glass-panel"
                  style={{
                    maxWidth: "680px",
                    margin: "0 auto 24px auto",
                    padding: "16px",
                    background: "rgba(25, 28, 42, 0.75)",
                    border: "1px solid rgba(56, 189, 248, 0.2)",
                    borderRadius: "10px",
                    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
                  }}
                >
                  {!isEditorExpanded ? (
                    <div
                      style={{
                        cursor: "text",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      onClick={() => setIsEditorExpanded(true)}
                    >
                      <input
                        type="text"
                        className="glass-input"
                        placeholder="Take a note, add tags with #urgent, #health..."
                        readOnly
                        style={{
                          width: "100%",
                          border: "none",
                          background: "transparent",
                          fontSize: "0.95rem",
                          padding: "6px",
                          outline: "none",
                          cursor: "text",
                          color: "var(--text-secondary)",
                        }}
                      />
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ color: "var(--neon-blue)", fontSize: "0.78rem" }}>
                          + New Note
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <input
                          type="text"
                          className="glass-input"
                          placeholder="Note Title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          style={{
                            width: "100%",
                            fontSize: "1.05rem",
                            fontWeight: "600",
                            border: "none",
                            background: "transparent",
                            color: "#fff",
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => setIsPinned(!isPinned)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                            color: isPinned ? "var(--neon-blue)" : "var(--text-secondary)",
                            borderColor: isPinned ? "var(--neon-blue)" : "rgba(255,255,255,0.1)",
                          }}
                          title="Pin note to top"
                        >
                          <Pin size={13} fill={isPinned ? "currentColor" : "none"} />
                          {isPinned ? "Pinned" : "Pin"}
                        </button>
                      </div>

                      <textarea
                        className="glass-input"
                        placeholder="Note content... Tip: Type #urgent or #finance inside text to auto-tag"
                        rows={4}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        style={{
                          width: "100%",
                          border: "1px solid rgba(255,255,255,0.06)",
                          background: "rgba(0,0,0,0.2)",
                          borderRadius: "6px",
                          padding: "10px",
                          resize: "vertical",
                          fontSize: "0.9rem",
                          lineHeight: 1.5,
                          marginBottom: "12px",
                        }}
                      />

                      {/* Tagging System Section */}
                      <div
                        style={{
                          background: "rgba(0, 0, 0, 0.25)",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                          marginBottom: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "var(--text-secondary)",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <TagIcon size={12} color="var(--neon-blue)" /> Category Tags:
                          </span>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            Click quick tag or add custom
                          </span>
                        </div>

                        {/* Quick Presets */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                          {PRESET_TAGS.map((pt) => {
                            const isSelected = selectedTags.includes(pt);
                            const style = getTagStyle(pt);
                            return (
                              <button
                                key={pt}
                                type="button"
                                onClick={() => toggleTag(pt)}
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 500,
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  background: isSelected ? style.bg : "rgba(255, 255, 255, 0.04)",
                                  color: isSelected ? style.color : "var(--text-secondary)",
                                  border: `1px solid ${isSelected ? style.border : "rgba(255, 255, 255, 0.08)"}`,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                {isSelected && <Check size={11} />}
                                {pt}
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected Tags & Custom Tag Input */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          {selectedTags
                            .filter((t) => !PRESET_TAGS.includes(t))
                            .map((customTag) => {
                              const style = getTagStyle(customTag);
                              return (
                                <span
                                  key={customTag}
                                  style={{
                                    fontSize: "0.72rem",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    background: style.bg,
                                    color: style.color,
                                    border: `1px solid ${style.border}`,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                  }}
                                >
                                  {customTag}
                                  <button
                                    type="button"
                                    onClick={() => toggleTag(customTag)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: style.color,
                                      cursor: "pointer",
                                      padding: 0,
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <X size={11} />
                                  </button>
                                </span>
                              );
                            })}

                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <input
                              type="text"
                              className="glass-input"
                              placeholder="New tag (e.g. #work)..."
                              value={customTagInput}
                              onChange={(e) => setCustomTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addCustomTag();
                                }
                              }}
                              style={{
                                fontSize: "0.75rem",
                                padding: "4px 8px",
                                width: "150px",
                                borderRadius: "4px",
                                background: "rgba(0,0,0,0.3)",
                                border: "1px solid rgba(255,255,255,0.1)",
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={addCustomTag}
                              style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                              title="Add custom tag"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Editor Controls */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          {editingId && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              style={{ color: "var(--neon-red)", borderColor: "rgba(239,68,68,0.3)" }}
                              onClick={() => {
                                onDeleteNote(editingId);
                                cancelEdit();
                              }}
                            >
                              <Trash2 size={13} style={{ marginRight: "4px" }} /> Delete Note
                            </button>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button type="button" className="btn btn-sm btn-outline" onClick={cancelEdit}>
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-neon-blue"
                            onClick={handleCreateOrUpdate}
                          >
                            {editingId ? "Update Note" : "Save Note"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pinned section */}
              {activeTab === "notes" && pinnedNotes.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "var(--neon-blue)",
                      letterSpacing: "1px",
                      marginBottom: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Pin size={12} /> PINNED NOTES ({pinnedNotes.length})
                  </div>
                  <SortableContext items={pinnedNotes.map((n) => n.id)} strategy={rectSortingStrategy}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: "14px",
                      }}
                    >
                      {pinnedNotes.map((note) => (
                        <SortableNoteCard
                          key={note.id}
                          note={note}
                          onEdit={startEdit}
                          onPin={togglePin}
                          onArchive={toggleArchive}
                          onDelete={onDeleteNote}
                          onTagClick={(tag) => setActiveFilterTag(activeFilterTag === tag ? null : tag)}
                          activeFilterTag={activeFilterTag}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )}

              {/* Unpinned section */}
              {activeTab === "notes" && (
                <div>
                  {pinnedNotes.length > 0 && (
                    <div
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "var(--text-secondary)",
                        letterSpacing: "1px",
                        marginBottom: "10px",
                      }}
                    >
                      OTHER NOTES ({unpinnedNotes.length})
                    </div>
                  )}

                  {unpinnedNotes.length === 0 && pinnedNotes.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        color: "var(--text-secondary)",
                        background: "rgba(0,0,0,0.2)",
                        borderRadius: "8px",
                        border: "1px dashed rgba(255,255,255,0.08)",
                      }}
                    >
                      {activeFilterTag ? (
                        <div>
                          <p style={{ margin: "0 0 10px 0" }}>No notes match tag {activeFilterTag}</p>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => setActiveFilterTag(null)}
                          >
                            Clear tag filter
                          </button>
                        </div>
                      ) : (
                        <p style={{ margin: 0 }}>No active notes. Take a note above to get started.</p>
                      )}
                    </div>
                  ) : (
                    <SortableContext items={unpinnedNotes.map((n) => n.id)} strategy={rectSortingStrategy}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                          gap: "14px",
                        }}
                      >
                        {unpinnedNotes.map((note) => (
                          <SortableNoteCard
                            key={note.id}
                            note={note}
                            onEdit={startEdit}
                            onPin={togglePin}
                            onArchive={toggleArchive}
                            onDelete={onDeleteNote}
                            onTagClick={(tag) => setActiveFilterTag(activeFilterTag === tag ? null : tag)}
                            activeFilterTag={activeFilterTag}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </div>
              )}

              {/* Archived section */}
              {activeTab === "archived" && (
                <div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      letterSpacing: "1px",
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Archive size={13} /> ARCHIVED NOTES ({archivedNotes.length})
                  </div>

                  {archivedNotes.length === 0 ? (
                    <div
                      style={{
                        color: "var(--text-secondary)",
                        padding: "30px",
                        textAlign: "center",
                        background: "rgba(0,0,0,0.2)",
                        borderRadius: "8px",
                      }}
                    >
                      No archived notes.
                    </div>
                  ) : (
                    <SortableContext items={archivedNotes.map((n) => n.id)} strategy={rectSortingStrategy}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                          gap: "14px",
                        }}
                      >
                        {archivedNotes.map((note) => (
                          <SortableNoteCard
                            key={note.id}
                            note={note}
                            onEdit={startEdit}
                            onPin={togglePin}
                            onArchive={toggleArchive}
                            onDelete={onDeleteNote}
                            onTagClick={(tag) => setActiveFilterTag(activeFilterTag === tag ? null : tag)}
                            activeFilterTag={activeFilterTag}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </div>
              )}

              {/* Drag Preview Overlay */}
              <DragOverlay>
                {activeDragNote ? (
                  <div
                    className="glass-panel"
                    style={{
                      padding: "14px",
                      background: "rgba(30, 35, 55, 0.95)",
                      border: "1px solid var(--neon-blue)",
                      boxShadow: "0 10px 25px rgba(0, 229, 255, 0.3)",
                      borderRadius: "8px",
                      width: "280px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "0.92rem", color: "#fff" }}>{activeDragNote.title}</strong>
                      <GripVertical size={14} color="var(--neon-blue)" />
                    </div>
                    <p style={{ margin: "6px 0 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      {activeDragNote.content.slice(0, 80)}...
                    </p>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}

// Sortable Note Card with Drag Handle & Tag Badges
function SortableNoteCard({
  note,
  onEdit,
  onPin,
  onArchive,
  onDelete,
  onTagClick,
  activeFilterTag,
}: {
  note: Note;
  onEdit: (n: Note) => void;
  onPin: (n: Note) => void;
  onArchive: (n: Note) => void;
  onDelete: (id: string) => void;
  onTagClick?: (tag: string) => void;
  activeFilterTag?: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "150px",
    background: note.pinned ? "rgba(30, 36, 56, 0.65)" : "rgba(22, 25, 38, 0.55)",
    border: note.pinned
      ? "1px solid rgba(56, 189, 248, 0.35)"
      : "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "8px",
    boxShadow: note.pinned ? "0 4px 15px rgba(56, 189, 248, 0.08)" : "0 4px 12px rgba(0, 0, 0, 0.2)",
    cursor: "pointer",
    position: "relative",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-panel note-card-item ${isDragging ? "dragging" : ""}`}
      onClick={() => onEdit(note)}
    >
      <div>
        {/* Card Header with Drag Handle, Title, and Pin Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, marginRight: "8px" }}>
            {/* Dedicated Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              style={{
                cursor: "grab",
                display: "flex",
                alignItems: "center",
                color: "rgba(255, 255, 255, 0.35)",
                padding: "2px",
                borderRadius: "3px",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--neon-blue)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.35)";
              }}
              title="Drag to reorder note"
            >
              <GripVertical size={14} />
            </div>

            <strong
              style={{
                fontSize: "0.93rem",
                color: "#ffffff",
                lineHeight: 1.3,
                wordBreak: "break-word",
              }}
            >
              {note.title}
            </strong>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPin(note);
            }}
            style={{
              background: "none",
              border: "none",
              color: note.pinned ? "var(--neon-blue)" : "rgba(255,255,255,0.25)",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
            }}
            title={note.pinned ? "Unpin note" : "Pin note to top"}
          >
            <Pin size={14} fill={note.pinned ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Note Body Content */}
        <p
          style={{
            margin: "0 0 10px 0",
            fontSize: "0.83rem",
            color: "var(--text-secondary)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.45,
            wordBreak: "break-word",
          }}
        >
          {note.content}
        </p>

        {/* Tags Display on Note Card */}
        {note.tags && note.tags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "5px",
              marginTop: "6px",
              marginBottom: "8px",
            }}
          >
            {note.tags.map((tag) => {
              const tagStyle = getTagStyle(tag);
              const isActive = activeFilterTag === tag;
              return (
                <span
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTagClick) onTagClick(tag);
                  }}
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    padding: "2px 7px",
                    borderRadius: "4px",
                    background: tagStyle.bg,
                    color: tagStyle.color,
                    border: `1px solid ${isActive ? "var(--neon-blue)" : tagStyle.border}`,
                    boxShadow: isActive ? "0 0 8px rgba(56, 189, 248, 0.4)" : "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    transition: "transform 0.1s ease",
                  }}
                  title={`Filter by ${tag}`}
                >
                  <TagIcon size={10} />
                  {tag}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "10px",
          paddingTop: "8px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
          {new Date(note.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
        </span>

        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            style={{
              fontSize: "0.7rem",
              padding: "2px 7px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onArchive(note);
            }}
            title={note.isArchived ? "Restore to active notes" : "Archive note"}
          >
            {note.isArchived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
            {note.isArchived ? "Unarchive" : "Archive"}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            style={{
              fontSize: "0.7rem",
              padding: "2px 7px",
              color: "var(--neon-red)",
              borderColor: "rgba(239,68,68,0.3)",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            title="Delete note"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
