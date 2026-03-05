// ─────────────────────────────────────────────
//  components/DueReminderPopup.jsx
//  In-app popup shown in top-right corner when:
//    • a reminder becomes due        (type="due")
//    • a snoozed reminder expires    (type="snoozed")
//    • an overdue reminder is active (type="overdue")
//  Stacks downward for multiple simultaneous popups.
// ─────────────────────────────────────────────

import { PRIORITY_CONFIG, SNOOZE_OPTIONS } from "../constants.js";
import { formatReminderTime, formatDate }  from "../utils.js";

const TYPE_CONFIG = {
  due:      { icon: "🔔", label: "Reminder Due",      borderColor: "#f97316" },
  snoozed:  { icon: "😴", label: "Snooze Ended",       borderColor: "#3b82f6" },
  overdue:  { icon: "⚠️",  label: "Overdue Reminder",  borderColor: "#ef4444" },
};

export default function DueReminderPopup({
  reminder,
  accentColor,
  stackIndex,       // 0-based index for vertical stacking
  type = "due",     // "due" | "snoozed" | "overdue"
  onDismiss,
  onSnooze,
}) {
  const pc  = PRIORITY_CONFIG[reminder.priority] ?? PRIORITY_CONFIG.Medium;
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.due;
  const topOffset = 80 + stackIndex * 230; // stack downward from top-right

  return (
    <div style={{
      position:     "fixed",
      top:          `${topOffset}px`,
      right:        "24px",
      zIndex:       3000,
      width:        "340px",
      background:   "#18181b",
      border:       `2px solid ${cfg.borderColor}`,
      borderRadius: "18px",
      boxShadow:    `0 12px 48px #000d, 0 0 0 4px ${cfg.borderColor}22`,
      padding:      "18px 20px",
      animation:    "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: translateX(32px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
      `}</style>

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span style={{ fontSize: "1.15em" }}>{cfg.icon}</span>
          <span style={{
            fontWeight: 800, color: cfg.borderColor,
            fontSize: "0.82em", letterSpacing: "0.05em", textTransform: "uppercase",
          }}>
            {cfg.label}
          </span>
        </div>
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", color: "#555", fontSize: "1.1em", cursor: "pointer", lineHeight: 1, padding: "2px 4px" }}
        >
          ✕
        </button>
      </div>

      {/* Title */}
      <div style={{ fontWeight: 700, fontSize: "1.02em", color: "#ffffff", marginBottom: "4px", lineHeight: 1.3 }}>
        {reminder.title}
      </div>

      {/* Description */}
      {reminder.description && (
        <div style={{ fontSize: "0.85em", color: "#999", marginBottom: "10px", lineHeight: 1.5 }}>
          {reminder.description}
        </div>
      )}

      {/* Meta badges */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px", alignItems: "center" }}>
        {reminder.time && (
          <span style={{
            background: cfg.borderColor + "22", color: cfg.borderColor,
            border: `1px solid ${cfg.borderColor}44`,
            borderRadius: "7px", padding: "2px 9px",
            fontSize: "0.78em", fontWeight: 700,
          }}>
            🕐 {formatReminderTime(reminder.time)}
          </span>
        )}
        <span style={{
          background: pc.color + "22", color: pc.color,
          border: `1px solid ${pc.color}44`,
          borderRadius: "7px", padding: "2px 9px",
          fontSize: "0.78em", fontWeight: 700,
        }}>
          {pc.emoji} {pc.label}
        </span>
        <span style={{ color: "#555", fontSize: "0.78em" }}>
          📆 {formatDate(reminder.date)}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {/* Dismiss — always available */}
        <button
          onClick={onDismiss}
          style={{
            flex: "1 1 70px", padding: "8px 10px", borderRadius: "10px",
            background: "#ffffff0f", border: "1px solid #ffffff1a",
            color: "#aaa", cursor: "pointer", fontWeight: 600,
            fontSize: "0.82em", fontFamily: "inherit",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#ffffff18"}
          onMouseLeave={e => e.currentTarget.style.background = "#ffffff0f"}
        >
          Dismiss
        </button>

        {/* Snooze options */}
        {SNOOZE_OPTIONS.map(opt => (
          <button
            key={opt.minutes}
            onClick={() => onSnooze(reminder.id, opt.minutes)}
            style={{
              flex: "1 1 60px", padding: "8px 10px", borderRadius: "10px",
              background: "#3b82f618", border: "1px solid #3b82f633",
              color: "#93c5fd", cursor: "pointer", fontWeight: 600,
              fontSize: "0.82em", fontFamily: "inherit", whiteSpace: "nowrap",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#3b82f628"}
            onMouseLeave={e => e.currentTarget.style.background = "#3b82f618"}
          >
            😴 {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
