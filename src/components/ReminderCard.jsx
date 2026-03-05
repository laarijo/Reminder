// ─────────────────────────────────────────────
//  components/ReminderCard.jsx
//  Single reminder card — clean layout:
//    1) Title + action buttons
//    2) Description
//    3) Date & Time
//    4) Duration (days left badge)
//    5) Priority / recurrence chips
//    6) Snooze / Cancel / Dismiss actions
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
  onDismiss,
  onSnooze,
  onCancelSnooze,
  settings,
  isAlerting,
}) {
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);

  const { cardShape, showDaysLeft, showDescription, showPriority } = settings;

  const accentColor = sanitizeColor(settings.accentColor, DEFAULT_SETTINGS.accentColor);
  const cardBg      = sanitizeColor(settings.cardBg,      DEFAULT_SETTINGS.cardBg);

  const radius   = cardShape === "rounded" ? "16px" : "4px";
  const pc       = PRIORITY_CONFIG[reminder.priority] ?? PRIORITY_CONFIG.Medium;
  const daysInfo = getDaysInfo(reminder.date, reminder.time);
  const isSnoozed = !!reminder.snoozeUntil && reminder.snoozeUntil > Date.now();
  const canSnooze = isAlerting && !isSnoozed;
  const tokens    = themeTokens(settings.theme);

  return (
    <>
      <style>{`
        @keyframes alertPulse {
          0%,100% { box-shadow: 0 4px 24px #0008, 0 0 0 0px #f9731688; }
          50%      { box-shadow: 0 4px 36px #0009, 0 0 0 8px #f9731633; }
        }
        @keyframes snoozedPulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
      `}</style>

      <div
        style={{
          background:    isSnoozed ? cardBg + "bb" : cardBg,
          borderRadius:  radius,
          border:        isAlerting
            ? `2px solid ${accentColor}`
            : isSnoozed
            ? "1px solid #3b82f633"
            : `1px solid ${accentColor}22`,
          padding:       "0",
          display:       "flex",
          flexDirection: "column",
          position:      "relative",
          transition:    "transform 0.18s, box-shadow 0.18s",
          animation:     isAlerting ? "alertPulse 1.2s ease-in-out infinite" : "none",
          opacity:       isSnoozed ? 0.82 : 1,
          overflow:      "hidden",
        }}
        onMouseEnter={e => {
          if (!isAlerting) {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = `0 8px 32px #0009, 0 0 0 2px ${accentColor}44`;
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "";
        }}
      >
        {/* Priority stripe — left edge */}
        <div style={{
          position:     "absolute", top: 0, left: 0,
          width:        "4px",      height: "100%",
          background:   isSnoozed ? "#444" : pc.color,
        }} />

        {/* Card body */}
        <div style={{ padding: "16px 16px 16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* ── ROW 1: Title + Edit/Delete buttons ──────────── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
            <h3 style={{
              margin: 0, fontSize: "1.02em", fontWeight: 700,
              lineHeight: 1.35, color: isSnoozed ? "#777" : tokens.text,
              flex: 1,
            }}>
              {reminder.title}
            </h3>
            <div style={{ display: "flex", gap: "5px", flexShrink: 0, alignItems: "center" }}>
              <button onClick={() => onEdit(reminder)}      style={iconBtnStyle(accentColor)}>✏️</button>
              <button onClick={() => onDelete(reminder.id)} style={iconBtnStyle("#ef4444")}>🗑️</button>
            </div>
          </div>

          {/* ── ROW 2: Description ──────────────────────────── */}
          {showDescription && reminder.description && (
            <p style={{
              margin: 0, fontSize: "0.87em", lineHeight: 1.55,
              color: isSnoozed ? "#555" : tokens.textMuted,
            }}>
              {reminder.description}
            </p>
          )}

          {/* ── Divider ─────────────────────────────────────── */}
          <div style={{ height: "1px", background: tokens.inputBorder, marginLeft: "-4px" }} />

          {/* ── ROW 3: Date & Time ──────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{
              display: "flex", alignItems: "center", gap: "5px",
              color: tokens.textMuted, fontSize: "0.82em",
            }}>
              📆 <span>{formatDate(reminder.date)}</span>
            </span>
            {reminder.time && (
              <span style={{
                display: "flex", alignItems: "center", gap: "4px",
                color: accentColor, fontSize: "0.82em", fontWeight: 700,
                background: accentColor + "18", borderRadius: "7px",
                padding: "2px 9px", border: `1px solid ${accentColor}33`,
              }}>
                🕐 {formatReminderTime(reminder.time)}
              </span>
            )}
          </div>

          {/* ── ROW 4: Duration / Days left ─────────────────── */}
          {showDaysLeft && (
            <div>
              <StatusBadge dateStr={reminder.date} timeStr={reminder.time} accentColor={accentColor} />
            </div>
          )}

          {/* ── ROW 5: Priority + Recurrence chips ──────────── */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
            {showPriority && (
              <span style={{ ...pillStyle(pc.color), color: isSnoozed ? "#555" : pc.color }}>
                {pc.emoji} {pc.label}
              </span>
            )}
            {reminder.recurrence !== "None" && (
              <span style={{
                background: "#ffffff11", color: "#999",
                borderRadius: "999px", padding: "2px 10px", fontSize: "0.78em",
              }}>
                🔁 {reminder.recurrence}
              </span>
            )}
          </div>

          {/* ── Snoozed banner (inline, no overlap) ─────────── */}
          {isSnoozed && (
            <div style={{
              display: "flex", alignItems: "center", gap: "7px",
              background: "#3b82f614", border: "1px solid #3b82f633",
              borderRadius: "9px", padding: "6px 12px",
              color: "#3b82f6", fontSize: "0.8em", fontWeight: 700,
              animation: "snoozedPulse 2.5s ease-in-out infinite",
            }}>
              😴 Snoozed until {formatTime(reminder.snoozeUntil)}
            </div>
          )}

          {/* ── Alert banner ─────────────────────────────────── */}
          {isAlerting && (
            <div style={{
              background: accentColor + "20", border: `1px solid ${accentColor}55`,
              borderRadius: "9px", padding: "7px 12px",
              color: accentColor, fontSize: "0.82em", fontWeight: 700,
            }}>
              🔔 This reminder is active now!
            </div>
          )}

          {/* ── ROW 6: Action buttons ────────────────────────── */}
          {(canSnooze || isAlerting || isSnoozed || daysInfo.status === "overdue") && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "2px" }}>

              {/* Snooze */}
              {(canSnooze || isAlerting) && (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowSnoozeMenu(v => !v)}
                    style={{
                      background: "#3b82f620", border: "1px solid #3b82f644",
                      borderRadius: "8px", color: "#3b82f6", cursor: "pointer",
                      padding: "5px 14px", fontSize: "0.82em", fontWeight: 700,
                      fontFamily: "inherit",
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
                      minWidth: "180px", boxShadow: "0 12px 40px #000c",
                    }}>
                      <div style={{
                        color: "#666", fontSize: "0.75em", fontWeight: 700,
                        padding: "2px 6px 8px", borderBottom: "1px solid #ffffff0f",
                        marginBottom: "2px", letterSpacing: "0.05em", textTransform: "uppercase",
                      }}>
                        ⏱ Snooze for
                      </div>
                      {SNOOZE_OPTIONS.map(opt => (
                        <button
                          key={opt.minutes}
                          onClick={() => { onSnooze(reminder.id, opt.minutes); setShowSnoozeMenu(false); }}
                          style={{
                            background: "transparent", border: "1px solid #3b82f622",
                            borderRadius: "8px", color: "#93c5fd", cursor: "pointer",
                            padding: "7px 12px", fontSize: "0.85em", fontWeight: 600,
                            fontFamily: "inherit", textAlign: "left", transition: "background 0.15s",
                          }}
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

              {/* Cancel Snooze */}
              {isSnoozed && (
                <button
                  onClick={() => onCancelSnooze(reminder.id)}
                  style={{
                    background: "#ef444418", border: "1px solid #ef444433",
                    borderRadius: "8px", color: "#ef4444", cursor: "pointer",
                    padding: "5px 14px", fontSize: "0.82em", fontWeight: 700,
                    fontFamily: "inherit",
                  }}
                >
                  ✕ Cancel Snooze
                </button>
              )}

              {/* Dismiss — overdue only */}
              {daysInfo.status === "overdue" && !isSnoozed && (
                <button
                  onClick={() => onDismiss(reminder.id)}
                  style={{
                    background: "#ffffff0a", border: "1px solid #ffffff18",
                    borderRadius: "8px", color: "#888", cursor: "pointer",
                    padding: "5px 14px", fontSize: "0.82em", fontWeight: 600,
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#ffffff14"}
                  onMouseLeave={e => e.currentTarget.style.background = "#ffffff0a"}
                >
                  ✓ Dismiss
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
