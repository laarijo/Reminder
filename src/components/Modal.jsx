// ─────────────────────────────────────────────
//  components/Modal.jsx
//  Reusable overlay modal wrapper.
// ─────────────────────────────────────────────

import { sanitizeColor }    from "../utils.js";
import { DEFAULT_SETTINGS } from "../constants.js";

export default function Modal({ title, onClose, children, accentColor, cardBg, textColor }) {
  // [FIX #1] Sanitize colour props before injecting into styles
  const safeAccent = sanitizeColor(accentColor, DEFAULT_SETTINGS.accentColor);
  const safeCard   = sanitizeColor(cardBg,      DEFAULT_SETTINGS.cardBg);

  return (
    <div
      style={{
        position:       "fixed",
        inset:          0,
        background:     "#000a",
        zIndex:         1000,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "16px",
      }}
    >
      <div
        style={{
          background:   safeCard,
          borderRadius: "20px",
          padding:      "28px",
          width:        "100%",
          maxWidth:     "480px",
          boxShadow:    `0 24px 80px #000c, 0 0 0 1px ${safeAccent}33`,
          maxHeight:    "90vh",
          overflowY:    "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "1.2em", fontWeight: 700, color: textColor || "#fff" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#888", fontSize: "1.4em", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
