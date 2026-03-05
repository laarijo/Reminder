// ─────────────────────────────────────────────
//  components/ReminderForm.jsx
//  Add / Edit reminder modal form.
//
//  Security fixes applied:
//  [FIX #5] maxLength enforced on title (100) and description (500)
//  [FIX #6] Only VALID_PRIORITIES / VALID_RECURRENCES values rendered
// ─────────────────────────────────────────────

import Modal  from "./Modal.jsx";
import Field  from "./Field.jsx";
import {
  PRIORITY_CONFIG,
  RECURRENCE_OPTIONS,
  VALID_PRIORITIES,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from "../constants.js";
import { inputStyle, toggleBtnStyle, themeTokens } from "../styles.js";

export default function ReminderForm({ form, setForm, onSubmit, onClose, isEditing, settings }) {
  const { accentColor, cardBg } = settings;
  const tokens          = themeTokens(settings.theme);
  const dateSelectStyle = { ...inputStyle(settings), colorScheme: settings.theme };

  // Side-by-side date + time layout
  const halfInput = { ...inputStyle(settings), width: "100%", boxSizing: "border-box" };

  return (
    <Modal
      title={isEditing ? "Edit Reminder" : "New Reminder"}
      onClose={onClose}
      accentColor={accentColor}
      cardBg={cardBg}
      textColor={tokens.text}
    >
      {/* Title — [FIX #5] maxLength */}
      <Field label="Title *">
        <input
          style={inputStyle(settings)}
          value={form.title}
          maxLength={MAX_TITLE_LENGTH}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Doctor Appointment"
        />
        <span style={{ color: tokens.textFaint, fontSize: "0.75em", textAlign: "right" }}>
          {form.title.length}/{MAX_TITLE_LENGTH}
        </span>
      </Field>

      {/* Description — [FIX #5] maxLength */}
      <Field label="Description">
        <textarea
          style={{ ...inputStyle(settings), minHeight: "72px", resize: "vertical" }}
          value={form.description}
          maxLength={MAX_DESCRIPTION_LENGTH}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Optional details…"
        />
        <span style={{ color: tokens.textFaint, fontSize: "0.75em", textAlign: "right" }}>
          {form.description.length}/{MAX_DESCRIPTION_LENGTH}
        </span>
      </Field>

      {/* Date + Time — side by side */}
      <Field label="Date & Time *">
        <div style={{ display: "flex", gap: "10px" }}>
          {/* Date */}
          <div style={{ flex: "1 1 55%" }}>
            <input
              type="date"
              style={{ ...dateSelectStyle }}
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          {/* Time */}
          <div style={{ flex: "1 1 45%" }}>
            <input
              type="time"
              style={{ ...dateSelectStyle }}
              value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
              placeholder="Optional"
            />
          </div>
        </div>
        <span style={{ color: tokens.textFaint, fontSize: "0.75em", marginTop: "4px" }}>
          Time is optional — leave blank for a full-day reminder
        </span>
      </Field>

      {/* Priority — [FIX #6] only VALID_PRIORITIES keys rendered */}
      <Field label="Priority">
        <div style={{ display: "flex", gap: "8px" }}>
          {VALID_PRIORITIES.map(p => (
            <button
              key={p}
              onClick={() => setForm(f => ({ ...f, priority: p }))}
              style={toggleBtnStyle(form.priority === p, PRIORITY_CONFIG[p].color)}
            >
              {PRIORITY_CONFIG[p].emoji} {p}
            </button>
          ))}
        </div>
      </Field>

      {/* Recurrence — [FIX #6] only VALID_RECURRENCES values rendered */}
      <Field label="Recurrence">
        <select
          style={dateSelectStyle}
          value={form.recurrence}
          onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}
        >
          {RECURRENCE_OPTIONS.map(o => (
            <option key={o} value={o} style={{ background: tokens.optionBg, color: tokens.text }}>
              {o}
            </option>
          ))}
        </select>
      </Field>

      <button
        onClick={onSubmit}
        style={{
          width:        "100%",
          padding:      "12px",
          borderRadius: "12px",
          background:   accentColor,
          border:       "none",
          color:        "#fff",
          fontWeight:   700,
          fontSize:     "1em",
          cursor:       "pointer",
          fontFamily:   "inherit",
          marginTop:    "4px",
        }}
      >
        {isEditing ? "Update Reminder" : "Add Reminder"}
      </button>
    </Modal>
  );
}
