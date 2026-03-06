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
import DueReminderPopup from "./components/DueReminderPopup.jsx";

import {
  DEFAULT_SETTINGS,
  FONT_MAP,
  FONT_SIZE_MAP,
  EMPTY_FORM,
  VALID_PRIORITIES,
  VALID_RECURRENCES,
} from "./constants.js";

import { generateId, sanitizeColor, getReminderDateTime, sanitizeDate, sanitizeTime } from "./utils.js";
import { themeTokens }                              from "./styles.js";

// ── Sample data (commented out — app starts empty) ──
// const INITIAL_REMINDERS = [
//   { id: generateId(), title: "Team Sprint Review",   description: "Quarterly sprint review with the product team.", date: offsetDateISO(2),  time: "10:00", priority: "High",   recurrence: "None",    snoozeUntil: null },
//   { id: generateId(), title: "Pay Electricity Bill", description: "Last date for online payment.",                  date: offsetDateISO(0),  time: "18:00", priority: "Medium", recurrence: "Monthly", snoozeUntil: null },
//   { id: generateId(), title: "Morning Yoga",         description: "30 mins daily session.",                         date: offsetDateISO(-1), time: "07:00", priority: "Low",    recurrence: "Daily",   snoozeUntil: null },
// ];

// [V1] Whitelist — defined outside component so it's created only once
const ALLOWED_SETTING_KEYS = new Set([
  "theme", "accentColor", "bgColor", "cardBg",
  "fontStyle", "fontSize", "layout", "cardShape",
  "showDaysLeft", "showDescription", "showPriority",
]);

export default function App() {
  const [settings,      setSettings]     = useState(DEFAULT_SETTINGS);
  const [reminders,     setReminders]    = useState([]);
  const [alertingIds,   setAlertingIds]  = useState(new Set());
  const [showForm,      setShowForm]     = useState(false);
  const [showSettings,  setShowSettings] = useState(false);
  const [form,          setForm]         = useState(EMPTY_FORM);
  const [editId,        setEditId]       = useState(null);
  const [notifGranted,  setNotifGranted] = useState(false);
  const [notifToast,    setNotifToast]   = useState(null); // "enabled" | "denied" | null
  const [tick,          setTick]         = useState(0);
  const [duePopups,     setDuePopups]    = useState([]); // reminders currently popped up as due

  // [FIX #3] Map of reminderId → setTimeout handle so we can clear on cancel/delete
  const snoozeTimers   = useRef({});
  // Track which reminders have already fired a due-time notification this session
  const firedDueNotifs = useRef(new Set());
  // Track dismissed reminder IDs (overdue reminders the user has acknowledged)
  const [dismissedIds, setDismissedIds] = useState(new Set());
  // Mirror of reminders in a ref so tick effects can read current state synchronously
  const remindersRef    = useRef([]);
  // Mirror of notifGranted in a ref so setTimeout callbacks can read latest value
  const notifGrantedRef = useRef(false);

  // Keep refs always current
  remindersRef.current    = reminders;
  notifGrantedRef.current = notifGranted;

  // ── Notification permission ───────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") setNotifGranted(true);
  }, []);

  // ── Poll every 30 s — only for the due-time watcher ──
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // ── Due-time watcher — runs every tick ───
  useEffect(() => {
    const now       = new Date();
    const WINDOW_MS = 60_000;

    remindersRef.current.forEach(r => {
      if (!r.date || r.snoozeUntil)              return; // skip snoozed
      if (firedDueNotifs.current.has(r.id))      return; // already fired
      if (!r.time)                                return; // no specific time

      const due   = getReminderDateTime(r.date, r.time);
      const msAgo = now - due;

      if (msAgo >= 0 && msAgo <= WINDOW_MS) {
        firedDueNotifs.current.add(r.id);
        setAlertingIds(ids => new Set([...ids, r.id]));
        setDuePopups(prev =>
          prev.find(x => x.id === r.id) ? prev : [...prev, { ...r, type: "due" }]
        );
        if (notifGrantedRef.current) {
          try {
            new Notification("🔔 RemindMe — Due Now!", {
              body: `${r.title}${r.description ? "\n" + r.description : ""}`.slice(0, 100), // [V4] truncate
              requireInteraction: true,
            });
          } catch (_) {}
        }
      }
    });
  }, [tick]);

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

    // [V3] Sanitize date and time before storing — reject malformed values
    const safeDate = sanitizeDate(form.date);
    const safeTime = sanitizeTime(form.time);
    if (!safeDate) return; // date is required and must be valid

    const safeForm = { ...form, date: safeDate, time: safeTime };

    setReminders(prev =>
      editId
        ? prev.map(r => r.id === editId ? { ...safeForm, id: editId, snoozeUntil: r.snoozeUntil } : r)
        : [...prev, { ...safeForm, id: generateId(), snoozeUntil: null }] // [FIX #4]
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
    firedDueNotifs.current.delete(id);
    setDismissedIds(ids => { const n = new Set(ids); n.delete(id); return n; });
    setDuePopups(prev => prev.filter(x => x.id !== id));
    setReminders(r => r.filter(x => x.id !== id));
  };

  // Dismiss an overdue reminder — removes it from view without deleting
  const dismissReminder = id => {
    setDismissedIds(ids => new Set([...ids, id]));
    setAlertingIds(ids => { const n = new Set(ids); n.delete(id); return n; });
    setDuePopups(prev => prev.filter(x => x.id !== id));
  };

  const snoozeReminder = (id, minutes) => {
    // [FIX #2] Clamp to the advertised 1–60 minute range
    const safeMins = Math.min(Math.max(1, Number(minutes) || 1), 60);
    const until    = Date.now() + safeMins * 60_000;

    // Clear firedDueNotifs so the due-watcher doesn't block re-notification
    firedDueNotifs.current.delete(id);

    // Clear any existing timer for this reminder
    if (snoozeTimers.current[id]) {
      clearTimeout(snoozeTimers.current[id]);
    }

    // Set snoozeUntil and remove from alerting while snoozed
    setReminders(r => r.map(x => x.id === id ? { ...x, snoozeUntil: until } : x));
    setAlertingIds(ids => { const n = new Set(ids); n.delete(id); return n; });

    // Schedule exact wake-up — fires precisely when snooze expires
    snoozeTimers.current[id] = setTimeout(() => {
      delete snoozeTimers.current[id];

      // Snapshot the reminder from the ref at the time of expiry
      const reminder = remindersRef.current.find(x => x.id === id);
      if (!reminder) return; // was deleted during snooze

      // 1) Clear snoozeUntil
      setReminders(prev =>
        prev.map(r => r.id === id ? { ...r, snoozeUntil: null } : r)
      );

      // 2) Mark as alerting (highlights the card)
      setAlertingIds(ids => new Set([...ids, id]));

      // 3) Show in-app popup with type "snoozed"
      setDuePopups(prev =>
        prev.find(x => x.id === id)
          ? prev.map(x => x.id === id ? { ...x, type: "snoozed" } : x)
          : [...prev, { ...reminder, type: "snoozed" }]
      );

      // 4) OS notification using ref (no stale closure on notifGranted)
      if (notifGrantedRef.current) {
        try {
          new Notification("😴 RemindMe — Snooze Ended!", {
            body: `"${reminder.title}" is due now!`.slice(0, 100), // [V4] truncate
            requireInteraction: true,
          });
        } catch (_) {}
      }
    }, safeMins * 60_000);
  };

  const cancelSnooze = id => {
    // [FIX #3] Clear the pending notification timer on explicit cancel
    if (snoozeTimers.current[id]) {
      clearTimeout(snoozeTimers.current[id]);
      delete snoozeTimers.current[id];
    }
    setReminders(r => r.map(x => x.id === id ? { ...x, snoozeUntil: null } : x));
  };

  // ── Request notification permission with feedback ────
  const requestNotifPermission = () => {
    if (!("Notification" in window)) {
      setNotifToast("unsupported");
      setTimeout(() => setNotifToast(null), 4000);
      return;
    }
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        setNotifGranted(true);
        setNotifToast("enabled");
        // Fire a test notification so the user sees it works
        try {
          new Notification("🔔 RemindMe", { body: "Notifications are now enabled! You'll be alerted when reminders are due." });
        } catch (_) {}
      } else {
        setNotifToast("denied");
      }
      setTimeout(() => setNotifToast(null), 4000);
    });
  };

  // [V1] setSetting — key whitelist enforced via module-level constant
  const setSetting = (key, val) => {
    if (!ALLOWED_SETTING_KEYS.has(key)) return;
    setSettings(s => ({ ...s, [key]: val }));
  };

  // Sort: alerting first, then by full datetime. Hide dismissed reminders.
  const sorted = [...reminders]
    .filter(r => !dismissedIds.has(r.id))
    .sort((a, b) => {
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
      fontFamily: FONT_MAP[fontStyle] ?? FONT_MAP["sans"],  // [V2] guard undefined key
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
              onClick={requestNotifPermission}
              style={{ background: accentColor + "22", border: `1px solid ${accentColor}44`, borderRadius: "10px", color: accentColor, cursor: "pointer", padding: "6px 14px", fontSize: "0.82em", fontWeight: 600 }}
            >
              🔔 Enable Notifications
            </button>
          )}
          {notifGranted && (
            <span style={{ fontSize: "0.82em", color: "#22c55e", fontWeight: 600 }}>
              🔔 Notifications On
            </span>
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
                onDismiss={dismissReminder}
                onSnooze={snoozeReminder}
                onCancelSnooze={cancelSnooze}
              />
            ))}
          </div>
        )}
      </main>

      {showForm     && <ReminderForm form={form} setForm={setForm} onSubmit={submitForm} onClose={() => setShowForm(false)} isEditing={!!editId} settings={settings} />}
      {showSettings && <SettingsPanel settings={settings} setSetting={setSetting} onClose={() => setShowSettings(false)} />}

      {/* ── Notification permission toast ─── */}
      {notifToast && (
        <div style={{
          position: "fixed", bottom: "28px", left: "50%", transform: "translateX(-50%)",
          zIndex: 2000, borderRadius: "14px", padding: "14px 24px",
          display: "flex", alignItems: "center", gap: "10px",
          boxShadow: "0 8px 32px #000c",
          background: notifToast === "enabled"     ? "#166534"
                    : notifToast === "denied"       ? "#7f1d1d"
                    : "#1e3a5f",
          border: `1px solid ${
            notifToast === "enabled"     ? "#22c55e55"
          : notifToast === "denied"       ? "#ef444455"
          : "#3b82f655"}`,
          color: "#fff", fontSize: "0.92em", fontWeight: 600,
          animation: "slideUp 0.3s ease",
        }}>
          <style>{`@keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(16px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
          {notifToast === "enabled"     && "✅  Notifications enabled! You'll be alerted when reminders are due."}
          {notifToast === "denied"      && "🚫  Notifications blocked. Enable them in your browser site settings."}
          {notifToast === "unsupported" && "⚠️  Your browser does not support notifications."}
        </div>
      )}

      {/* ── In-app due reminder popups ───── */}
      {duePopups.map((r, i) => (
        <DueReminderPopup
          key={r.id}
          reminder={r}
          accentColor={accentColor}
          stackIndex={i}
          type={r.type ?? "due"}
          onDismiss={() => {
            dismissReminder(r.id);
          }}
          onSnooze={(id, mins) => {
            snoozeReminder(id, mins);
            setDuePopups(prev => prev.filter(x => x.id !== id));
          }}
        />
      ))}
    </div>
  );
}
