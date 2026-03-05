// ─────────────────────────────────────────────
//  styles.js  —  Theme-aware shared style helpers
// ─────────────────────────────────────────────

/** Semantic colour tokens derived from the active theme. */
export function themeTokens(theme) {
  const dark = theme === "dark";
  return {
    text:        dark ? "#ffffff" : "#111111",
    textMuted:   dark ? "#aaaaaa" : "#555555",
    textFaint:   dark ? "#666666" : "#999999",
    inputBg:     dark ? "#ffffff0d" : "#00000008",
    inputBorder: dark ? "#ffffff22" : "#00000022",
    optionBg:    dark ? "#1a1a1a"   : "#ffffff",
    stripeBg:    dark ? "#ffffff0f" : "#00000010",
  };
}

/**
 * Base style for <input>, <textarea>, and <select>.
 * Colour values come from themeTokens — never from raw user input.
 */
export function inputStyle(settings) {
  const t = themeTokens(settings.theme);
  return {
    background:   t.inputBg,
    border:       `1px solid ${t.inputBorder}`,
    borderRadius: "10px",
    color:         t.text,
    padding:       "10px 14px",
    fontSize:      "0.95em",
    outline:       "none",
    width:         "100%",
    boxSizing:     "border-box",
    fontFamily:    "inherit",
  };
}

/**
 * Icon button on reminder cards.
 * NOTE: `color` here always comes from PRIORITY_CONFIG constants
 * or hardcoded hex literals — never from raw user input.
 */
export function iconBtnStyle(color) {
  return {
    background:   color + "18",
    border:       `1px solid ${color}33`,
    borderRadius: "8px",
    color,
    cursor:       "pointer",
    padding:      "4px 8px",
    fontSize:     "0.85em",
    transition:   "background 0.15s",
  };
}

/** Coloured pill / badge. */
export function pillStyle(color) {
  return {
    background:    color + "22",
    color,
    border:        `1px solid ${color}44`,
    borderRadius:  "999px",
    padding:       "2px 10px",
    fontSize:      "0.78em",
    fontWeight:    700,
    letterSpacing: "0.02em",
  };
}

/** Segmented-control toggle button (theme picker, layout picker, etc.). */
export function toggleBtnStyle(isActive, color, fontFamily) {
  return {
    flex:         1,
    padding:      "8px",
    borderRadius: "10px",
    cursor:       "pointer",
    fontWeight:   600,
    border:       `2px solid ${isActive ? color : "#ffffff22"}`,
    background:   isActive ? color + "22" : "#ffffff09",
    color:        isActive ? color : "#aaa",
    fontFamily:   fontFamily || "inherit",
  };
}
