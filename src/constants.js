// ─────────────────────────────────────────────
//  constants.js  —  App-wide constants
// ─────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  theme:           "dark",
  accentColor:     "#f97316",
  bgColor:         "#0f0f0f",
  cardBg:          "#1a1a1a",
  fontStyle:       "sans",
  fontSize:        "medium",
  layout:          "grid",
  cardShape:       "rounded",
  showDaysLeft:    true,
  showDescription: true,
  showPriority:    true,
};

export const FONT_MAP = {
  sans:  "'DM Sans', sans-serif",
  serif: "'Playfair Display', serif",
  mono:  "'JetBrains Mono', monospace",
};

export const FONT_SIZE_MAP = {
  small:  "13px",
  medium: "15px",
  large:  "17px",
};

export const PRIORITY_CONFIG = {
  High:   { emoji: "🔴", label: "High",   color: "#ef4444" },
  Medium: { emoji: "🟡", label: "Medium", color: "#f59e0b" },
  Low:    { emoji: "🟢", label: "Low",    color: "#22c55e" },
};

// [FIX #6] Canonical allowed sets — used for validation in submitForm
export const VALID_PRIORITIES  = ["High", "Medium", "Low"];
export const VALID_RECURRENCES = ["None", "Daily", "Weekly", "Monthly"];

// Alias so components can import a single name for rendering
export const RECURRENCE_OPTIONS = VALID_RECURRENCES;

export const SNOOZE_OPTIONS = [
  { label: "5 min",  minutes: 5  },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
];

export const ACCENT_PRESETS = [
  "#f97316","#3b82f6","#a855f7",
  "#ec4899","#22c55e","#ef4444","#14b8a6",
];

export const EMPTY_FORM = {
  title:       "",
  description: "",
  date:        "",
  time:        "",       // HH:MM 24-hour, optional
  priority:    "Medium",
  recurrence:  "None",
};

// Input length limits — [FIX #5]
export const MAX_TITLE_LENGTH       = 100;
export const MAX_DESCRIPTION_LENGTH = 500;
