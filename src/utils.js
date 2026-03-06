// ─────────────────────────────────────────────
//  utils.js  —  Pure helper / utility functions
// ─────────────────────────────────────────────

/**
 * Returns a DateTime object combining a date string and optional time string.
 * If no time provided, defaults to start of day (00:00) for future/today checks
 * and end of day (23:59) for overdue checks.
 */
export function getReminderDateTime(dateStr, timeStr) {
  const dt = new Date(dateStr);
  if (timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    dt.setHours(h, m, 0, 0);
  } else {
    dt.setHours(0, 0, 0, 0);
  }
  return dt;
}

/**
 * Days/time-remaining label + status key for colour coding.
 * Now time-aware: "Due Today at 3:00 PM", "Overdue by 2 hrs", etc.
 */
export function getDaysInfo(dateStr, timeStr) {
  const now    = new Date();
  const target = getReminderDateTime(dateStr, timeStr);

  const nowDay    = new Date(now);  nowDay.setHours(0, 0, 0, 0);
  const targetDay = new Date(dateStr); targetDay.setHours(0, 0, 0, 0);
  const dayDiff   = Math.round((targetDay - nowDay) / 86_400_000);

  // Future — more than 1 day away
  if (dayDiff > 1) {
    const label = timeStr
      ? `${dayDiff} days left · ${formatReminderTime(timeStr)}`
      : `${dayDiff} days left`;
    return { label, status: "future", diff: dayDiff };
  }

  // Tomorrow
  if (dayDiff === 1) {
    const label = timeStr
      ? `Tomorrow · ${formatReminderTime(timeStr)}`
      : "Tomorrow";
    return { label, status: "soon", diff: dayDiff };
  }

  // Same calendar day — check if time has passed
  if (dayDiff === 0) {
    if (!timeStr || target > now) {
      const label = timeStr
        ? `Due Today · ${formatReminderTime(timeStr)}`
        : "Due Today!";
      return { label, status: "today", diff: 0 };
    }
    // Time has passed today — overdue by hours/minutes
    const minsLate = Math.round((now - target) / 60_000);
    if (minsLate < 60) {
      return { label: `Overdue by ${minsLate} min${minsLate !== 1 ? "s" : ""}`, status: "overdue", diff: 0 };
    }
    const hrsLate = Math.floor(minsLate / 60);
    return { label: `Overdue by ${hrsLate} hr${hrsLate !== 1 ? "s" : ""}`, status: "overdue", diff: 0 };
  }

  // Past days
  const absDiff = Math.abs(dayDiff);
  return {
    label:  `Overdue by ${absDiff} day${absDiff > 1 ? "s" : ""}`,
    status: "overdue",
    diff:   dayDiff,
  };
}

/**
 * Format a stored HH:MM 24-hour time string into 12-hour display.
 * e.g. "14:30" → "2:30 PM"
 */
export function formatReminderTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Format a Unix timestamp as HH:MM AM/PM (used for snooze badge). */
export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

/** Format a date string as "Mon, Mar 5, 2026". */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
}

/** Today offset by `days`, returned as YYYY-MM-DD. */
export function offsetDateISO(days) {
  return new Date(Date.now() + days * 86_400_000).toISOString().split("T")[0];
}

/** Current time as HH:MM string. */
export function currentTimeHHMM() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/**
 * [FIX #4] Collision-safe unique ID.
 * Uses crypto.randomUUID() when available; falls back to a
 * timestamp + random suffix so rapid creation never collides.
 */
export function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * [V3] Validate a YYYY-MM-DD date string. Returns "" if malformed or invalid.
 */
export function sanitizeDate(value) {
  if (typeof value !== "string") return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : value;
}

/**
 * [V3] Validate a HH:MM 24-hour time string. Returns "" if malformed or out of range.
 */
export function sanitizeTime(value) {
  if (typeof value !== "string") return "";
  if (!/^\d{2}:\d{2}$/.test(value)) return "";
  const [h, m] = value.split(":").map(Number);
  return (h >= 0 && h <= 23 && m >= 0 && m <= 59) ? value : "";
}
 * Accepts #RGB, #RRGGBB, #RRGGBBAA  (3–8 hex digits after #).
 * Returns `fallback` for anything that doesn't match.
 */
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;
export function sanitizeColor(value, fallback) {
  return HEX_COLOR_RE.test(value) ? value : fallback;
}
