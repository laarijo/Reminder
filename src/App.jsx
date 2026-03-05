// ─────────────────────────────────────────────
//  App.jsx  —  RemindMe root entry point
//
//  Security fixes applied here:
//  [FIX #2] Snooze minutes clamped 1–60 in snoozeReminder()
//  [FIX #3] Snooze setTimeout IDs tracked in useRef; cleared on cancel/delete
//  [FIX #4] IDs generated via generateId() (crypto.randomUUID)
//  [FIX #6] priority & recurrence validated against allowed sets before saving
// ─────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";

import ReminderCard   from "./components/ReminderCard.jsx";
import ReminderForm   from "./components/ReminderForm.jsx";
import SettingsPanel  from "./components/SettingsPanel.jsx";

import {
  DEFAULT_SETTINGS,
  FONT_MAP,
  FONT_SIZE_MAP,
  EMPTY_FORM,
  VALID_PRIORITIES,
  VALID_RECURRENCES,
} from "./constants.js";

import { offsetDateISO, generateId, sanitizeColor, getReminderDateTime } from "./utils.js";
import { themeTokens }                              from "./styles.js";

// ── Sample data ──────────────────────────────
const INITIAL_REMINDERS = [
  { id: generateId(), title: "Team Sprint Review",   description: "Quarterly sprint review with the product team.", date: offsetDateISO(2),  time: "10:00", priority: "High",   recurrence: "None",    snoozeUntil: null },
  { id: generateId(), title: "Pay Electricity Bill", description: "Last date for online payment.",                  date: offsetDateISO(0),  time: "18:00", priority: "Medium", recurrence: "Monthly", snoozeUntil: null },
  { id: generateId(), title: "Morning Yoga",         description: "30 mins daily session.",                         date: offsetDateISO(-1), time: "07:00", priority: "Low",    recurrence: "Daily",   snoozeUntil: null },
];

export default function App() {
  const [settings,      setSettings]     = useState(DEFAULT_SETTINGS);
  const [reminders,     setReminders]    = useState(INITIAL_REMINDERS);
  const [alertingIds,   setAlertingIds]  = useState(new Set());
  const [showForm,      setShowForm]     = useState(false);
  const [showSettings,  setShowSettings] = useState(false);
  const [form,          setForm]         = useState(EMPTY_FORM);
  const [editId,        setEditId]       = useState(null);
  const [notifGranted,  setNotifGranted] = useState(false);
  const [tick,          setTick]         = useState(0);

  // [FIX #3] Map of reminderId → setTimeout handle so we can clear on cancel/delete
  const snoozeTimers = useRef({});
  // Track which reminders have already fired a due-time notification this session
  const firedDueNotifs = useRef(new Set());

  // ── Notification permission ───────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") setNotifGranted(true);
  }, []);

  // ── Poll every 30 s ──────────────────────
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // ── Check expired snoozes on every tick ──
  useEffect(() => {
    const now = Date.now();
    setReminders(prev => {
      let changed = false;
      const next = prev.map(r => {
        if (r.snoozeUntil && r.snoozeUntil <= now) {
          changed = true;
          setAlertingIds(ids => new Set([...ids, r.id]));
          return { ...r, snoozeUntil: null };
        }
        return r;
      });
      return changed ? next : prev;
    });
  }, [tick]);

  // ── Due-time watcher — fires notification when a reminder's scheduled
  //    date+time is reached (runs on every tick and on reminders change) ──
  useEffect(() => {
    const now  = new Date();
    const WINDOW_MS = 60_000; // fire if due within the last 60 s

    reminders.forEach(r => {
      if (!r.date || r.snoozeUntil) return;          // skip snoozed
      if (firedDueNotifs.current.has(r.id)) return;  // already fired
      if (!r.time) return;                            // no time set — skip

      const due = getReminderDateTime(r.date, r.time);
      const msAgo = now - due;

      // Due time has passed within the notification window
      if (msAgo >= 0 && msAgo <= WINDOW_MS) {
        firedDueNotifs.current.add(r.id);
        // Highlight the card
        setAlertingIds(ids => new Set([...ids, r.id]));
        // Fire desktop notification if permission granted
        if (notifGranted) {
          new Notification("🔔 RemindMe", {
            body: `"${r.title}" is due now!`,
            icon: "https://cdn.jsdelivr.net/npm/twemoji@14/assets/72x72/1f514.png",
          });
        }
      }
    });
  }, [tick, reminders, notifGranted]);

  // ── CRUD helpers ──────────────────────────
  const openAddForm = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };

  const openEditForm = r => {
    setForm({
      title:       r.title,
      description: r.description,
      date:        r.date,
      time:        r.time || "",
      priority:    r.priority,
      recurrence:  r.recurrence,
    });
    setEditId(r.id);
    setShowForm(true);
  };

  const submitForm = () => {
    if (!form.title.trim() || !form.date) return;

    // [FIX #6] Reject any value not in the canonical allowed sets
    if (!VALID_PRIORITIES.includes(form.priority))    return;
    if (!VALID_RECURRENCES.includes(form.recurrence)) return;

    setReminders(prev =>
      editId
        ? prev.map(r => r.id === editId ? { ...form, id: editId, snoozeUntil: r.snoozeUntil } : r)
        : [...prev, { ...form, id: generateId(), snoozeUntil: null }] // [FIX #4]
    );
    if (editId) firedDueNotifs.current.delete(editId); // reschedule notification on edit
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const deleteReminder = id => {
    // [FIX #3] Clear any pending snooze notification timer before removing
    if (snoozeTimers.current[id]) {
      clearTimeout(snoozeTimers.current[id]);
      delete snoozeTimers.current[id];
    }
    firedDueNotifs.current.delete(id); // allow re-notification if re-created
    setReminders(r => r.filter(x => x.id !== id));
  };

  const snoozeReminder = (id, minutes) => {
    // [FIX #2] Clamp to the advertised 1–60 minute range — no bypass via console
    const safeMins = Math.min(Math.max(1, Number(minutes) || 1), 60);
    const until    = Date.now() + safeMins * 60_000;

    setReminders(r => r.map(x => x.id === id ? { ...x, snoozeUntil: until } : x));
    setAlertingIds(ids => { const n = new Set(ids); n.delete(id); return n; });

    if (notifGranted) {
      const reminder = reminders.find(x => x.id === id);
      // [FIX #3] Store timer ID so it can be cleared on cancel/delete
      if (snoozeTimers.current[id]) clearTimeout(snoozeTimers.current[id]);
      snoozeTimers.current[id] = setTimeout(() => {
        new Notification("🔔 RemindMe", { body: `"${reminder?.title}" — snooze is up!` });
        delete snoozeTimers.current[id];
      }, safeMins * 60_000);
    }
  };

  const cancelSnooze = id => {
    // [FIX #3] Clear the pending notification timer on explicit cancel
    if (snoozeTimers.current[id]) {
      clearTimeout(snoozeTimers.current[id]);
      delete snoozeTimers.current[id];
    }
    setReminders(r => r.map(x => x.id === id ? { ...x, snoozeUntil: null } : x));
  };

  const setSetting = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  // ── Sorted list (alerting first, then by datetime) ───
  const sorted = [...reminders].sort((a, b) => {
    const aa = alertingIds.has(a.id) ? -1 : 0;
    const ba = alertingIds.has(b.id) ? -1 : 0;
    if (aa !== ba) return aa - ba;
    // Sort by full datetime (date + time) for accurate ordering
    return getReminderDateTime(a.date, a.time) - getReminderDateTime(b.date, b.time);
  });

  // [FIX #1] Validate colours before use in root styles
  const bgColor     = sanitizeColor(settings.bgColor,     DEFAULT_SETTINGS.bgColor);
  const accentColor = sanitizeColor(settings.accentColor, DEFAULT_SETTINGS.accentColor);
  const { fontStyle, fontSize, layout } = settings;
  const tokens = themeTokens(settings.theme);

  return (
    <div style={{
      minHeight:  "100vh",
      background: bgColor,
      fontFamily: FONT_MAP[fontStyle],
      fontSize:   FONT_SIZE_MAP[fontSize],
      color:      tokens.text,
      transition: "all 0.3s",
    }}>
      {/*
        [FIX #7] Note on CDN fonts:
        For production, self-host these fonts and add a Content-Security-Policy
        header restricting font-src to your own origin.
      */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@700&family=JetBrains+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />

      {/* ── Header ───────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: bgColor + "ee", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${accentColor}22`,
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: "60px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.4em" }}>🔔</span>
          <span style={{ fontWeight: 800, fontSize: "1.1em", letterSpacing: "-0.02em", color: accentColor }}>
            RemindMe
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {!notifGranted && (
            <button
              onClick={() => "Notification" in window && Notification.requestPermission().then(p => setNotifGranted(p === "granted"))}
              style={{ background: accentColor + "22", border: `1px solid ${accentColor}44`, borderRadius: "10px", color: accentColor, cursor: "pointer", padding: "6px 14px", fontSize: "0.82em", fontWeight: 600 }}
            >
              Enable Notifications
            </button>
          )}
          <button
            onClick={() => setShowSettings(true)}
            style={{ background: tokens.inputBg, border: `1px solid ${tokens.inputBorder}`, borderRadius: "10px", color: tokens.text, cursor: "pointer", padding: "6px 14px", fontSize: "0.9em" }}
          >
            ⚙️ Customize
          </button>
          <button
            onClick={openAddForm}
            style={{ background: accentColor, border: "none", borderRadius: "10px", color: "#fff", cursor: "pointer", padding: "7px 16px", fontSize: "0.9em", fontWeight: 700 }}
          >
            ＋ Add
          </button>
        </div>
      </header>

      {/* ── Reminder grid / list ──────────── */}
      <main style={{ padding: "28px 24px", maxWidth: "960px", margin: "0 auto" }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", color: tokens.textMuted, marginTop: "80px" }}>
            <div style={{ fontSize: "3em" }}>📭</div>
            <p>No reminders yet. Click <strong style={{ color: accentColor }}>＋ Add</strong> to create one!</p>
          </div>
        ) : (
          <div style={{
            display:             layout === "grid" ? "grid" : "flex",
            flexDirection:       layout === "list" ? "column" : undefined,
            gridTemplateColumns: layout === "grid" ? "repeat(auto-fill, minmax(280px, 1fr))" : undefined,
            gap:                 "16px",
          }}>
            {sorted.map(r => (
              <ReminderCard
                key={r.id}
                reminder={r}
                settings={settings}
                isAlerting={alertingIds.has(r.id)}
                onEdit={openEditForm}
                onDelete={deleteReminder}
                onSnooze={snoozeReminder}
                onCancelSnooze={cancelSnooze}
              />
            ))}
          </div>
        )}
      </main>

      {showForm     && <ReminderForm form={form} setForm={setForm} onSubmit={submitForm} onClose={() => setShowForm(false)} isEditing={!!editId} settings={settings} />}
      {showSettings && <SettingsPanel settings={settings} setSetting={setSetting} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
