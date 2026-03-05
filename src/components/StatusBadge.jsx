// ─────────────────────────────────────────────
//  components/StatusBadge.jsx
//  Colour-coded pill showing days/time remaining.
// ─────────────────────────────────────────────

import { getDaysInfo }          from "../utils.js";
import { sanitizeColor }        from "../utils.js";
import { pillStyle }            from "../styles.js";
import { DEFAULT_SETTINGS }     from "../constants.js";

const STATUS_COLORS = {
  future:  "#22c55e",
  soon:    null,       // falls back to accentColor
  today:   "#f59e0b",
  overdue: "#ef4444",
};

const STATUS_ICON = {
  future:  "📅 ",
  soon:    "📅 ",
  today:   "⏰ ",
  overdue: "⚠️ ",
};

export default function StatusBadge({ dateStr, timeStr, accentColor }) {
  // [FIX #1] Validate accentColor before using in styles
  const safeAccent = sanitizeColor(accentColor, DEFAULT_SETTINGS.accentColor);
  const info  = getDaysInfo(dateStr, timeStr);
  const color = STATUS_COLORS[info.status] ?? safeAccent;

  return (
    <span style={pillStyle(color)}>
      {STATUS_ICON[info.status]}{info.label}
    </span>
  );
}
