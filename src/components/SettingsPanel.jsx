// ─────────────────────────────────────────────
//  components/SettingsPanel.jsx
//  GUI customisation modal.
//
//  [FIX #1] All colour changes pass through sanitizeColor()
//           before reaching state — CSS injection prevented.
// ─────────────────────────────────────────────

import Modal  from "./Modal.jsx";
import Field  from "./Field.jsx";
import { FONT_MAP, ACCENT_PRESETS, DEFAULT_SETTINGS } from "../constants.js";
import { sanitizeColor }                              from "../utils.js";
import { toggleBtnStyle, themeTokens }                from "../styles.js";

export default function SettingsPanel({ settings, setSetting, onClose }) {
  const { accentColor, cardBg, bgColor, fontStyle, fontSize, layout } = settings;
  const tokens = themeTokens(settings.theme);

  // [FIX #1] Centralised setter that validates hex before updating state
  const setColor = (key, rawValue) => {
    const safe = sanitizeColor(rawValue, DEFAULT_SETTINGS[key]);
    setSetting(key, safe);
  };

  function Swatch({ color }) {
    const safe = sanitizeColor(color, DEFAULT_SETTINGS.accentColor); // [FIX #1]
    return (
      <div
        onClick={() => setColor("accentColor", safe)}
        style={{
          width: "32px", height: "32px", borderRadius: "50%",
          background: safe, cursor: "pointer",
          border: `3px solid ${accentColor === safe ? "#fff" : "transparent"}`,
          transition: "transform 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
        onMouseLeave={e => e.currentTarget.style.transform = ""}
      />
    );
  }

  function Toggle({ settingKey, label }) {
    const on = settings[settingKey];
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${tokens.stripeBg}` }}>
        <span style={{ color: tokens.textMuted, fontSize: "0.9em" }}>{label}</span>
        <div
          onClick={() => setSetting(settingKey, !on)}
          style={{ width: "42px", height: "24px", borderRadius: "99px", background: on ? accentColor : "#333", cursor: "pointer", position: "relative", transition: "background 0.2s" }}
        >
          <div style={{ position: "absolute", top: "3px", left: on ? "20px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
        </div>
      </div>
    );
  }

  return (
    <Modal title="⚙️ Customize Interface" onClose={onClose} accentColor={accentColor} cardBg={cardBg} textColor={tokens.text}>

      <Field label="Theme">
        <div style={{ display: "flex", gap: "8px" }}>
          {["dark", "light"].map(t => (
            <button key={t}
              onClick={() => {
                setSetting("theme",   t);
                // Only hardcoded safe hex values — no user input here
                setSetting("bgColor", t === "dark" ? "#0f0f0f" : "#f5f5f5");
                setSetting("cardBg",  t === "dark" ? "#1a1a1a" : "#ffffff");
              }}
              style={toggleBtnStyle(settings.theme === t, accentColor)}
            >
              {t === "dark" ? "🌙 Dark" : "☀️ Light"}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Accent Color">
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {ACCENT_PRESETS.map(c => <Swatch key={c} color={c} />)}
          {/* [FIX #1] onChange validates before storing */}
          <input type="color" value={accentColor}
            onChange={e => setColor("accentColor", e.target.value)}
            title="Custom colour"
            style={{ width: "32px", height: "32px", borderRadius: "50%", border: "none", cursor: "pointer", background: "none", padding: 0 }}
          />
        </div>
      </Field>

      <Field label="Background Color">
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* [FIX #1] validated before storing */}
          <input type="color" value={bgColor}
            onChange={e => setColor("bgColor", e.target.value)}
            style={{ width: "40px", height: "36px", borderRadius: "8px", border: "1px solid #ffffff22", cursor: "pointer", background: "none" }}
          />
          <span style={{ color: tokens.textFaint, fontSize: "0.85em" }}>{bgColor}</span>
        </div>
      </Field>

      <Field label="Card Background">
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* [FIX #1] validated before storing */}
          <input type="color" value={cardBg}
            onChange={e => setColor("cardBg", e.target.value)}
            style={{ width: "40px", height: "36px", borderRadius: "8px", border: "1px solid #ffffff22", cursor: "pointer", background: "none" }}
          />
          <span style={{ color: tokens.textFaint, fontSize: "0.85em" }}>{cardBg}</span>
        </div>
      </Field>

      <Field label="Font Style">
        <div style={{ display: "flex", gap: "8px" }}>
          {[["sans","Sans"],["serif","Serif"],["mono","Mono"]].map(([val, label]) => (
            <button key={val} onClick={() => setSetting("fontStyle", val)}
              style={toggleBtnStyle(fontStyle === val, accentColor, FONT_MAP[val])}>{label}</button>
          ))}
        </div>
      </Field>

      <Field label="Font Size">
        <div style={{ display: "flex", gap: "8px" }}>
          {[["small","Small"],["medium","Medium"],["large","Large"]].map(([val, label]) => (
            <button key={val} onClick={() => setSetting("fontSize", val)}
              style={toggleBtnStyle(fontSize === val, accentColor)}>{label}</button>
          ))}
        </div>
      </Field>

      <Field label="Card Layout">
        <div style={{ display: "flex", gap: "8px" }}>
          {[["grid","⊞ Grid"],["list","☰ List"]].map(([val, label]) => (
            <button key={val} onClick={() => setSetting("layout", val)}
              style={toggleBtnStyle(layout === val, accentColor)}>{label}</button>
          ))}
        </div>
      </Field>

      <Field label="Card Shape">
        <div style={{ display: "flex", gap: "8px" }}>
          {[["rounded","⬭ Rounded"],["sharp","▭ Sharp"]].map(([val, label]) => (
            <button key={val} onClick={() => setSetting("cardShape", val)}
              style={toggleBtnStyle(settings.cardShape === val, accentColor)}>{label}</button>
          ))}
        </div>
      </Field>

      <Field label="Show / Hide Elements">
        <Toggle settingKey="showDaysLeft"    label="📅 Days Remaining" />
        <Toggle settingKey="showDescription" label="📝 Description" />
        <Toggle settingKey="showPriority"    label="🏷️ Priority Badge" />
      </Field>
    </Modal>
  );
}
