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
  const [notifToast,    setNotifToast]   = useState(null); // "enabled" | "denied" | null
  const [tick,          setTick]         = useState(0);
  const [duePopups,     setDuePopups]    = useState([]); // reminders currently popped up as due

  // [FIX #3] Map of reminderId → setTimeout handle so we can clear on cancel/delete
  const snoozeTimers = useRef({});
  // Track which reminders have already fired a due-time notification this session
  const firedDueNotifs = useRef(new Set());
  // Track dismissed reminder IDs (overdue reminders the user has acknowledged)
  const [dismissedIds, setDismissedIds] = useState(new Set());

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
          // Re-show popup so user sees snooze has ended
          setDuePopups(pops =>
            pops.find(x => x.id === r.id)
              ? pops.map(x => x.id === r.id ? { ...x, type: "snoozed" } : x)
              : [...pops, { ...r, type: "snoozed" }]
          );
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
      if (!r.date || r.snoozeUntil) return;
      if (firedDueNotifs.current.has(r.id)) return;
      if (!r.time) return;

      const due   = getReminderDateTime(r.date, r.time);
      const msAgo = now - due;

      if (msAgo >= 0 && msAgo <= WINDOW_MS) {
        firedDueNotifs.current.add(r.id);

        // 1) Highlight the card
        setAlertingIds(ids => new Set([...ids, r.id]));

        // 2) In-app popup — always shown regardless of OS permission
        setDuePopups(prev => prev.find(x => x.id === r.id) ? prev : [...prev, { ...r, type: "due" }]);

        // 3) OS desktop notification (only if permission granted)
        if (notifGranted) {
          try {
            new Notification("🔔 RemindMe — Due Now!", {
              body: `${r.title}${r.description ? "\n" + r.description : ""}`,
              icon: "https://cdn.jsdelivr.net/npm/twemoji@14/assets/72x72/1f514.png",
              requireInteraction: true, // keeps it visible until dismissed
            });
          } catch (_) {}
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

  const setSetting = (key, val) => setSettings(s => ({ ...s, [key]: val }));

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
