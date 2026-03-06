// ─────────────────────────────────────────────
//  components/ReminderForm.jsx
//  Add / Edit reminder modal form.
//
//  Security fixes applied:
//  [FIX #5] maxLength enforced on title (100) and description (500)
//  [FIX #6] Only VALID_PRIORITIES / VALID_RECURRENCES values rendered
// ─────────────────────────────────────────────

import { useState } from "react";
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

export default function ReminderForm({ form, setForm, onSubmit, onClose, isEditing, settings, formError, minDate }) {
  const { accentColor, cardBg } = settings;
  const tokens          = themeTokens(settings.theme);
  const dateSelectStyle = { ...inputStyle(settings), colorScheme: settings.theme };
  const [errors, setErrors] = useState({});

  // Returns current local time as HH:MM — used as min for the time picker on today's date
  const currentTimeHHMM = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  const handleSubmit = () => {
    const newErrors = {};
    if (!form.title.trim())  newErrors.title = "Title is required.";
    if (!form.date)          newErrors.date  = "Date is required.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onSubmit();
  };

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
          style={{ ...inputStyle(settings), borderColor: errors.title ? "#ef4444" : undefined }}
          value={form.title}
          maxLength={MAX_TITLE_LENGTH}
          autoFocus
          onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(v => ({ ...v, title: undefined })); }}
          placeholder="e.g. Doctor Appointment"
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {errors.title
            ? <span style={{ color: "#ef4444", fontSize: "0.78em" }}>⚠ {errors.title}</span>
            : <span />}
          <span style={{ color: tokens.textFaint, fontSize: "0.75em" }}>{form.title.length}/{MAX_TITLE_LENGTH}</span>
        </div>
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
        <span style={{ color: tokens.textFaint, fontSize: "0.75em", textAlign: "right", display: "block" }}>
          {form.description.length}/{MAX_DESCRIPTION_LENGTH}
        </span>
      </Field>

      {/* Date + Time — side by side */}
      <Field label="Date & Time *">
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: "1 1 55%" }}>
            <input
              type="date"
              style={{ ...dateSelectStyle, borderColor: errors.date || formError ? "#ef4444" : undefined }}
              value={form.date}
              min={minDate}
              onChange={e => { setForm(f => ({ ...f, date: e.target.value })); setErrors(v => ({ ...v, date: undefined })); }}
            />
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <input
              type="time"
              style={{ ...dateSelectStyle, borderColor: formError ? "#ef4444" : undefined }}
              value={form.time}
              min={form.date === minDate ? currentTimeHHMM() : undefined}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
          {formError
            ? <span style={{ color: "#ef4444", fontSize: "0.78em" }}>⚠ {formError}</span>
            : errors.date
            ? <span style={{ color: "#ef4444", fontSize: "0.78em" }}>⚠ {errors.date}</span>
            : <span style={{ color: tokens.textFaint, fontSize: "0.75em" }}>Time is optional — leave blank for a full-day reminder</span>}
        </div>
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
        onClick={handleSubmit}
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
