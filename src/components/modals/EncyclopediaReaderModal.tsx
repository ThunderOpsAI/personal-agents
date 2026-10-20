import React, { useState } from "react";
import { ENCYCLOPEDIAS, Encyclopedia, Chapter } from "../../data/encyclopedias";

interface EncyclopediaReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  encyclopediaId: string | null;
  onSaveProgress: (encId: string, chapterIndex: number) => void;
}

export function EncyclopediaReaderModal({
  isOpen,
  onClose,
  encyclopediaId,
  onSaveProgress,
}: EncyclopediaReaderModalProps) {
  const enc: Encyclopedia | undefined = encyclopediaId ? ENCYCLOPEDIAS[encyclopediaId] : undefined;
  const [chapterIdx, setChapterIdx] = useState(0);

  if (!isOpen || !enc) return null;

  const chapters: Chapter[] = enc.chapters.length > 0 ? enc.chapters : [
    {
      id: `${enc.id}_placeholder`,
      chapterNumber: 1,
      title: "Foundations & Overview",
      subtitle: enc.tagline,
      readingTimeMin: 4,
      summary: "Foundational overview of this domain.",
      content: `<p>${enc.tagline}</p>`,
      keyTakeaways: ["Key principles for clinical recovery", "Applied daily protocol"],
    },
  ];

  const currentChapter = chapters[chapterIdx] || chapters[0];
  const progressPct = Math.round(((chapterIdx + 1) / chapters.length) * 100);

  const handlePrev = () => {
    if (chapterIdx > 0) setChapterIdx(chapterIdx - 1);
  };

  const handleNext = () => {
    if (chapterIdx < chapters.length - 1) setChapterIdx(chapterIdx + 1);
  };

  const handleFinish = () => {
    onSaveProgress(enc.id, chapterIdx);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel learn-modal-content" style={{ maxWidth: "720px", width: "95%", maxHeight: "88vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ flexShrink: 0, paddingBottom: "12px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className={`badge ${enc.badgeClass}`}>{enc.title.split(" ")[0].toUpperCase()}</span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{currentChapter.readingTimeMin} min read</span>
            </div>
            <h2 style={{ margin: 0, fontSize: "1.25rem" }}>{currentChapter.title}</h2>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px", display: "block" }}>
              {currentChapter.subtitle}
            </span>
          </div>
          <button className="btn-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        {/* Progress & Chapter Bar */}
        <div style={{ flexShrink: 0, padding: "10px 16px", background: "rgba(0, 0, 0, 0.25)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
              Chapter {chapterIdx + 1} of {chapters.length}
            </span>
            <div style={{ flex: 1, height: "6px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--neon-blue)", transition: "width 0.3s ease" }} />
            </div>
          </div>
          <select
            className="glass-input"
            value={chapterIdx}
            onChange={(e) => setChapterIdx(parseInt(e.target.value, 10))}
            style={{ padding: "4px 8px", fontSize: "0.78rem", maxWidth: "200px" }}
          >
            {chapters.map((ch, i) => (
              <option key={ch.id} value={i}>
                Ch. {ch.chapterNumber}: {ch.title}
              </option>
            ))}
          </select>
        </div>

        {/* Reading Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", lineHeight: "1.6" }}>
          <div dangerouslySetInnerHTML={{ __html: currentChapter.content }} />

          {/* Key Takeaways Card */}
          <div style={{ marginTop: "20px", padding: "14px 16px", background: "rgba(0, 229, 255, 0.04)", border: "1px solid rgba(0, 229, 255, 0.2)", borderRadius: "10px" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "0.92rem", color: "var(--neon-blue)" }}>
              Key Takeaways &amp; Protocol Summary
            </h4>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {currentChapter.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} style={{ marginBottom: "4px" }}>
                  {takeaway}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="modal-footer" style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <button className="btn btn-outline btn-sm" type="button" onClick={handlePrev} disabled={chapterIdx === 0}>
              &larr; Prev Chapter
            </button>
            <button className="btn btn-outline btn-sm" type="button" onClick={handleNext} disabled={chapterIdx === chapters.length - 1}>
              Next Chapter &rarr;
            </button>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-outline btn-sm" type="button" onClick={onClose}>
              Close
            </button>
            <button className="btn btn-neon-blue btn-sm" type="button" onClick={handleFinish}>
              Save Summary &amp; Finish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
