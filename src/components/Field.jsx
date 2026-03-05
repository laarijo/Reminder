// ─────────────────────────────────────────────
//  components/Field.jsx
//  Labelled form-field wrapper used in modals.
// ─────────────────────────────────────────────

export default function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
      <label
        style={{
          color:         "#aaa",
          fontSize:      "0.82em",
          fontWeight:    600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
