# 🔔 RemindMe

A clean, fast, and fully featured reminder app built with **React + Vite**. Set reminders with a specific date and time, get notified when they're due, snooze or dismiss them — all from a beautiful, customisable interface.

---

## ✨ Features

### Core Reminder Management
- **Add, edit and delete** reminders with full detail fields
- **Title** — up to 100 characters
- **Description** — optional detail notes, up to 500 characters
- **Date & Time picker** — side-by-side; time is optional for full-day reminders
- **Priority levels** — 🔴 High, 🟡 Medium, 🟢 Low
- **Recurrence** — None, Daily, Weekly, Monthly
- **Form validation** — missing title or date highlights the field in red with an inline error message; cursor auto-focuses the title field when the form opens
- **Snooze dropdown** — closes automatically when clicking anywhere outside it

### Smart Notifications
- **In-app popup** — appears in the top-right corner the moment a reminder is due, regardless of browser notification permission
- **Desktop (OS) notifications** — shown when browser permission is granted
- **Live status badge** — each card shows a real-time countdown: `2 days left · 10:00 AM`, `Due Today · 3:00 PM`, `Overdue by 45 mins`
- **Snooze** — snooze any active reminder for 5 min, 15 min, 30 min, or 1 hour
- **Snooze expiry popup** — a dedicated 😴 "Snooze Ended" popup fires at exactly the right time when a snooze expires
- **Dismiss** — dismiss overdue reminders without deleting them

### Customisable Interface
- **Dark / Light theme**
- **Accent colour** — 7 presets + full custom colour picker
- **Background and card background** colour pickers
- **Font styles** — Sans, Serif, Monospace
- **Font size** — Small, Medium, Large
- **Card layout** — Grid or List view
- **Card shape** — Rounded or Sharp corners
- **Toggle visibility** of Days Remaining, Description, and Priority badges per card

## 🗂 Project Structure

```
RemindMe/
├── index.html                  ← Vite entry point
├── package.json                ← Project config and scripts
├── vite.config.js              ← Vite + React plugin config
└── src/
    ├── main.jsx                ← React root mount
    ├── App.jsx                 ← Main app — state, effects, CRUD
    ├── constants.js            ← App-wide constants and defaults
    ├── utils.js                ← Helper functions (dates, formatting, validation)
    ├── styles.js               ← Theme-aware style functions
    └── components/
        ├── ReminderCard.jsx    ← Individual reminder card
        ├── ReminderForm.jsx    ← Add / Edit modal form
        ├── DueReminderPopup.jsx← Top-right due/snooze popup
        ├── SettingsPanel.jsx   ← Customise interface panel
        ├── StatusBadge.jsx     ← Days left / overdue pill
        ├── Modal.jsx           ← Reusable modal wrapper
        └── Field.jsx           ← Reusable labelled form field
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** v18 or higher — download from [nodejs.org](https://nodejs.org)
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

### Steps

**1. Download the project**

Download and extract `RemindMe.zip`, or clone the repository:
```bash
git clone https://github.com/your-username/RemindMe.git
```

> **Note for zip users:** After extracting, check your folder structure. If you see `RemindMe/RemindMe/src/` (double-nested), navigate into the inner folder:
> ```bash
> cd RemindMe/RemindMe
> ```
> If the structure is `RemindMe/src/` (single level), just use:
> ```bash
> cd RemindMe
> ```

**2. Navigate into the project folder**
```bash
cd RemindMe
```

**3. Install dependencies**
```bash
npm install
```

**4. Start the development server**
```bash
npm run dev
```

**5. Open in browser**

Visit [http://localhost:5173](http://localhost:5173)

---

## 🛠 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local development server at `localhost:5173` |
| `npm run build` | Build optimised production bundle into `dist/` |
| `npm run preview` | Preview the production build at `localhost:4173` |

> ⚠️ **`npm run preview` requires a build first.** Always run `npm run build` before `npm run preview`, otherwise you'll get a `"dist" does not exist` error.

---

## 🔔 Enabling Desktop Notifications

1. Click the **🔔 Enable Notifications** button in the top-right header
2. When the browser prompts, click **Allow**
3. The button is replaced with a **🔔 Notifications On** indicator
4. A test notification fires immediately so you can confirm it works

> **Note:** Even without desktop notifications enabled, the in-app popup will still appear whenever a reminder is due.

---

## 🧪 How Notifications Work

| Trigger | What happens |
|---|---|
| Reminder date + time reached | In-app popup appears top-right + OS notification (if permitted) |
| Snooze expires | Dedicated "Snooze Ended" popup appears top-right + OS notification |
| Multiple reminders due simultaneously | Popups stack downward from the top-right corner |
| Reminder is overdue | Card shows ✓ Dismiss button; popup shows Dismiss option |

Reminders are checked every **30 seconds** via a polling interval. Snooze expiry is handled by a precise `setTimeout` that fires at exactly the right moment — not reliant on polling.

---

## 📋 Reminder Card Layout

Each card displays fields in this order:

1. **Title** — with ✏️ Edit and 🗑️ Delete buttons
2. **Description** — shown if non-empty and enabled in settings
3. **Date & Time** — date in muted text, time as an accented badge
4. **Duration** — live status badge showing days/hours remaining or overdue
5. **Priority & Recurrence** — colour-coded chips
6. **Actions** — Snooze / Cancel Snooze / Dismiss (shown contextually)


## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build tool | Vite |
| Styling | Inline styles with theme tokens (no CSS framework) |
| Notifications | Web Notifications API |
| ID generation | `crypto.randomUUID()` |
| Fonts | DM Sans, Playfair Display, JetBrains Mono (Google Fonts) |

---

## 📄 License

MIT — free to use, modify, and distribute.
