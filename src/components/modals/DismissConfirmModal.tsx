import React from "react";
import { AgendaItem } from "../../types";

interface DismissConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AgendaItem | null;
  onConfirmDismiss: (item: AgendaItem) => void;
}

export function DismissConfirmModal({ isOpen, onClose, item, onConfirmDismiss }: DismissConfirmModalProps) {
  if (!isOpen || !item) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: "380px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: "1.05rem", color: "var(--neon-red)" }}>Dismiss Agenda Item</h2>
          <button className="btn-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>
        <div style={{ margin: "12px 0" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
            Are you sure you want to dismiss <strong>"{item.title}"</strong> from today's agenda?
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
          <button className="btn btn-outline btn-sm" type="button" onClick={onClose}>
            Keep
          </button>
          <button
            className="btn btn-neon-red btn-sm"
            type="button"
            onClick={() => {
              onConfirmDismiss(item);
              onClose();
            }}
          >
            Dismiss Item
          </button>
        </div>
      </div>
    </div>
  );
}
