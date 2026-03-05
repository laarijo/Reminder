// ─────────────────────────────────────────────
//  components/ReminderCard.jsx
//  Single reminder card with snooze controls.
// ─────────────────────────────────────────────

import { useState }                        from "react";
import StatusBadge                         from "./StatusBadge.jsx";
import { PRIORITY_CONFIG, SNOOZE_OPTIONS } from "../constants.js";
import { getDaysInfo, formatDate, formatTime, formatReminderTime, sanitizeColor } from "../utils.js";
import { iconBtnStyle, pillStyle, themeTokens } from "../styles.js";
import { DEFAULT_SETTINGS }                from "../constants.js";

export default function ReminderCard({
  reminder,
  onEdit,
  onDelete,
  onSnooze,
  onCancelSnooze,
  settings,
  isAlerting,
}) {
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);

  const { cardShape, showDaysLeft, showDescription, showPriority } = settings;

  // [FIX #1] Validate accent colour before using in styles
  const accentColor = sanitizeColor(settings.accentColor, DEFAULT_SETTINGS.accentColor);
  const cardBg      = sanitizeColor(settings.cardBg,      DEFAULT_SETTINGS.cardBg);

  const radius     = cardShape === "rounded" ? "16px" : "4px";
  const pc         = PRIORITY_CONFIG[reminder.priority] ?? PRIORITY_CONFIG.Medium;
  const daysInfo   = getDaysInfo(reminder.date, reminder.time);
  const isSnoozed  = !!reminder.snoozeUntil && reminder.snoozeUntil > Date.now();
  const canSnooze  = (daysInfo.status === "today" || daysInfo.status === "overdue") && !isSnoozed;
  const tokens     = themeTokens(settings.theme);

  return (
    <>
      <style>{`
        @keyframes alertPulse {
          0%,100% { box-shadow: 0 4px 24px #0008, 0 0 0 0px #f9731688; }
          50%      { box-shadow: 0 4px 36px #0009, 0 0 0 8px #f9731633; }
        }
        @keyframes snoozedPulse { 0%,100% { opacity:1; } 50% { opacity:0.55; } }
      `}</style>

      <div
        style={{
          background:   isSnoozed ? cardBg + "bb" : cardBg,
          borderRadius: radius,
          border:       isAlerting
            ? `2px solid ${accentColor}`
            : isSnoozed
            ? "1px solid #3b82f633"
            : `1px solid ${accentColor}22`,
          padding:      "20px",
          display:      "flex",
          flexDirection: "column",
          gap:          "10px",
          position:     "relative",
          transition:   "transform 0.18s, box-shadow 0.18s",
          animation:    isAlerting ? "alertPulse 1.2s ease-in-out infinite" : "none",
          opacity:      isSnoozed ? 0.78 : 1,
        }}
        onMouseEnter={e => {
          if (!isAlerting) {
            e.currentTarget.style.transform  = "translateY(-3px)";
            e.currentTarget.style.boxShadow  = `0 8px 32px #0009, 0 0 0 2px ${accentColor}44`;
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "";
        }}
      >
        {/* Priority stripe */}
        <div style={{
          position: "absolute", top: 0, left: 0,
          width: "4px", height: "100%",
          borderRadius: `${radius} 0 0 ${radius}`,
          background: isSnoozed ? "#444" : pc.color,
        }} />

        {/* Snoozed badge */}
        {isSnoozed && (
          <div style={{
            position: "absolute", top: "10px", right: "10px",
            background: "#3b82f620", border: "1px solid #3b82f644",
            borderRadius: "999px", padding: "3px 10px",
            color: "#3b82f6", fontSize: "0.75em", fontWeight: 700,
            animation: "snoozedPulse 2.5s ease-in-out infinite",
          }}>
            😴 Until {formatTime(reminder.snoozeUntil)}
          </div>
        )}

        {/* Alert banner */}
        {isAlerting && (
          <div style={{
            background: accentColor + "20", border: `1px solid ${accentColor}55`,
            borderRadius: "10px", padding: "7px 12px",
            color: accentColor, fontSize: "0.82em", fontWeight: 700,
          }}>
            🔔 Snooze ended — this reminder is active again!
          </div>
        )}

        <div style={{ paddingLeft: "8px" }}>
          {/* Title + actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
            <h3 style={{
              margin: 0, fontSize: "1.05em", fontWeight: 700, lineHeight: 1.3,
              color: isSnoozed ? "#777" : tokens.text,
            }}>
              {reminder.title}
            </h3>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <button onClick={() => onEdit(reminder)}      style={iconBtnStyle(accentColor)}>✏️</button>
              <button onClick={() => onDelete(reminder.id)} style={iconBtnStyle("#ef4444")}>🗑️</button>
            </div>
          </div>

          {/* Description */}
          {showDescription && reminder.description && (
            <p style={{
              margin: "6px 0 0", fontSize: "0.88em", lineHeight: 1.5,
              color: isSnoozed ? "#555" : tokens.textMuted,
            }}>
              {reminder.description}
            </p>
          )}

          {/* Badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px", alignItems: "center" }}>
            {showDaysLeft  && <StatusBadge dateStr={reminder.date} timeStr={reminder.time} accentColor={accentColor} />}
            {showPriority  && (
              <span style={{ ...pillStyle(pc.color), color: isSnoozed ? "#555" : pc.color }}>
                {pc.emoji} {pc.label}
              </span>
            )}
            {reminder.recurrence !== "None" && (
              <span style={{ background: "#ffffff11", color: "#aaa", borderRadius: "999px", padding: "2px 10px", fontSize: "0.78em" }}>
                🔁 {reminder.recurrence}
              </span>
            )}
          </div>

          {/* Date & Time row */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
            <span style={{ color: tokens.textFaint, fontSize: "0.78em" }}>
              📆 {formatDate(reminder.date)}
            </span>
            {reminder.time && (
              <span style={{
                color: accentColor, fontSize: "0.78em", fontWeight: 700,
                background: accentColor + "18", borderRadius: "6px", padding: "2px 8px",
                border: `1px solid ${accentColor}33`,
              }}>
                🕐 {formatReminderTime(reminder.time)}
              </span>
            )}
          </div>

          {/* Snooze button */}
          {(canSnooze || isAlerting) && (
            <div style={{ marginTop: "12px", position: "relative" }}>
              <button
                onClick={() => setShowSnoozeMenu(v => !v)}
                style={{
                  background: "#3b82f620", border: "1px solid #3b82f644",
                  borderRadius: "8px", color: "#3b82f6", cursor: "pointer",
                  padding: "5px 14px", fontSize: "0.82em", fontWeight: 700, fontFamily: "inherit",
                }}
              >
                😴 Snooze
              </button>

              {showSnoozeMenu && (
                <div style={{
                  position: "absolute", bottom: "calc(100% + 8px)", left: 0,
                  background: "#18182a", border: "1px solid #3b82f633",
                  borderRadius: "14px", padding: "10px", zIndex: 50,
                  display: "flex", flexDirection: "column", gap: "4px",
                  minWidth: "200px", boxShadow: "0 12px 40px #000c",
                }}>
                  <div style={{ color: "#666", fontSize: "0.75em", fontWeight: 700, padding: "2px 6px 8px", borderBottom: "1px solid #ffffff0f", marginBottom: "2px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    ⏱ Snooze for (max 1 hr)
                  </div>
                  {SNOOZE_OPTIONS.map(opt => (
                    <button
                      key={opt.minutes}
                      onClick={() => { onSnooze(reminder.id, opt.minutes); setShowSnoozeMenu(false); }}
                      style={{ background: "transparent", border: "1px solid #3b82f622", borderRadius: "8px", color: "#93c5fd", cursor: "pointer", padding: "7px 14px", fontSize: "0.85em", fontWeight: 600, fontFamily: "inherit", textAlign: "left", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#3b82f618"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cancel snooze */}
          {isSnoozed && (
            <div style={{ marginTop: "12px" }}>
              <button
                onClick={() => onCancelSnooze(reminder.id)}
                style={{ background: "#ef444418", border: "1px solid #ef444433", borderRadius: "8px", color: "#ef4444", cursor: "pointer", padding: "5px 14px", fontSize: "0.82em", fontWeight: 700, fontFamily: "inherit" }}
              >
                ✕ Cancel Snooze
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
