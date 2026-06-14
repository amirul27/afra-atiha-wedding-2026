# Afra & Atiha · Wedding 2026 💍

A complete wedding-planning web app for three celebrations — **Engagement (19 Jun 2026)**, **Akd / Nikah (31 Jul 2026)** and **Wedding Ceremony (12 Oct 2026)** — with a zero-cost backend powered by **Google Sheets** (data) and **Google Drive** (documents & photos).

Built with **React + TypeScript + Vite + Tailwind CSS + shadcn-style UI + React Router + React Query**.

---

## ✨ Features

- **Dashboard** — live countdowns to all three events, progress on tasks/RSVPs/budget, RSVP pie chart and budget-by-event chart.
- **Tasks** — add, edit and tick off to-dos with **strike-through completion**, priorities, due dates and per-event filtering.
- **Guests** — RSVP tracking, party-size headcount, bride/groom side, invitation-sent toggle, table numbers.
- **Budget** — estimated vs actual vs paid, amount owed, category breakdown, per-event totals (in **BDT ৳**).
- **Vendors** — pipeline from *researching → contacted → booked → paid*, with call/email links, cost and deposit tracking.
- **Shopping** — a *To buy → Ordered → Received* board for outfits, jewelry, gifts and decor.
- **Documents** — upload contracts, invoices, inspiration and photos straight to **Google Drive**.
- **Calendar** — month grid + agenda combining events, task deadlines and vendor payments.
- **Search & filters** on every page, fully **mobile responsive**.

---

## 🧱 Tech stack

| Layer     | Choice |
|-----------|--------|
| Framework | React 18 + TypeScript + Vite |
| Styling   | Tailwind CSS + custom shadcn-style components (Radix UI) |
| Routing   | React Router 6 |
| Data      | React Query (TanStack) with optimistic updates |
| Charts    | Recharts |
| Backend   | Google Apps Script web app |
| Storage   | Google Sheets (rows) + Google Drive (files) |

---

## 🚀 Quick start

### 1. Install the front-end

```bash
npm install
cp .env.example .env
```

Leave `.env` open — you'll paste two values into it after the backend is set up.

### 2. Set up the Google backend

The `apps-script/` folder contains the entire backend (3 files).

1. Go to **[script.google.com](https://script.google.com)** → **New project**.
2. Create the files and paste in the matching contents:
   - `Code.gs`
   - `Setup.gs`
   - `appsscript.json` — to see this file, enable **Project Settings ▸ "Show appsscript.json manifest file in editor"**, then paste.
3. Save. In the toolbar function dropdown choose **`setup`** and click **Run**.
4. Approve the permission prompt (it needs access to Sheets and Drive). This creates:
   - a spreadsheet *"Afra & Atiha Wedding 2026 — Data"* with one tab per collection, and
   - a Drive folder *"Afra & Atiha Wedding 2026 — Files"* for uploads.
5. Open **Execution log** (View ▸ Logs) and copy the printed **API token**.

### 3. Deploy the web app

1. **Deploy ▸ New deployment ▸** gear icon ▸ **Web app**.
2. Settings:
   - **Execute as:** *Me*
   - **Who has access:** *Anyone*
3. **Deploy**, authorise, and copy the **Web app URL**.

### 4. Wire up `.env`

```env
VITE_API_URL=https://script.google.com/macros/s/XXXXXXXX/exec
VITE_API_TOKEN=paste-the-token-from-the-setup-log
```

### 5. Run it

```bash
npm run dev
```

Open the printed local URL. To ship a production build:

```bash
npm run build
npm run preview
```

> **Re-deploying after a backend change:** Apps Script keeps the same URL only if you choose **Deploy ▸ Manage deployments ▸** ✏️ edit ▸ **New version**. A brand-new deployment gives a new URL (update `.env` accordingly).

---

## 🗂️ Project structure

```
afra-atiha-wedding-2026/
├─ apps-script/              # Google Apps Script backend
│  ├─ appsscript.json        #   manifest + scopes + web app config
│  ├─ Setup.gs               #   one-time provisioner (run setup())
│  └─ Code.gs                #   doGet/doPost router (list/create/update/remove/upload)
├─ src/
│  ├─ components/
│  │  ├─ ui/                 # shadcn-style primitives (button, dialog, table, …)
│  │  ├─ shared/             # PageHeader, SearchBar, EventBadge, StatCard, …
│  │  └─ layout/             # Sidebar + responsive Layout
│  ├─ config/events.ts       # the three events, dates, countdown helpers
│  ├─ hooks/                 # useCollection + per-collection wrappers
│  ├─ lib/                   # api client + utils (BDT formatting, dates)
│  ├─ pages/                 # Dashboard, Tasks, Guests, Budget, Vendors,
│  │                         # Shopping, Documents, Calendar, NotFound
│  ├─ types/index.ts         # shared domain types (match the sheet headers)
│  ├─ App.tsx · main.tsx · index.css
├─ .env.example
└─ package.json · vite/tailwind/ts configs
```

---

## 🔌 How the API works

Google Apps Script web apps can't answer CORS pre-flight requests, so the client stays on the **simple-request** path:

- **Reads** are `GET ?action=list&collection=<name>&token=<token>`.
- **Writes** are `POST` with `Content-Type: text/plain` and a JSON body `{ action, collection, token, payload }`.
- **Uploads** send the file as **base64** inside the same kind of text/plain POST; Apps Script writes it to Drive and appends a row to the `documents` sheet.

Every response is a JSON envelope:

```json
{ "ok": true, "data": [ ... ] }
{ "ok": false, "error": "Unauthorised" }
```

The token returned by `setup()` is checked on every request. Treat it like a password — anyone with the URL **and** token can read/write your sheet.

### Collections & sheet columns

Each sheet's header row matches the TypeScript types in `src/types/index.ts` exactly:

| Sheet | Columns |
|-------|---------|
| `tasks` | id, title, notes, event, status, priority, assignee, dueDate, createdAt |
| `guests` | id, name, phone, email, side, event, rsvp, partySize, tableNo, notes, invitationSent |
| `budget` | id, category, item, event, estimated, actual, paid, vendor, notes |
| `vendors` | id, name, category, event, contactName, phone, email, status, cost, deposit, notes |
| `shopping` | id, item, category, event, forWhom, status, price, store, link, notes |
| `documents` | id, name, category, event, fileUrl, fileId, mimeType, uploadedAt, notes |

You can safely edit data directly in the spreadsheet — just keep the header row and the `id` column intact.

---

## 🛠️ Troubleshooting

- **"Unauthorised"** — `VITE_API_TOKEN` doesn't match the token from the `setup()` log. Re-copy it and restart `npm run dev`.
- **Network/CORS errors** — make sure the deployment's *Who has access* is **Anyone**, and that `VITE_API_URL` ends in `/exec` (not `/dev`).
- **Uploaded images don't preview** — Drive view links don't always render inline; the card falls back to a file icon, and **Open** always works.
- **Changed `Code.gs` but nothing changed** — you must publish a **new version** of the deployment (see note above).

---

## 📝 Notes

- Currency is formatted as **Bangladeshi Taka (৳)** and phone placeholders use **+880** — adjust in `src/lib/utils.ts` and the form placeholders if needed.
- Couple: **Afra & Atiha** · hashtag **#AfraAtiha2026** (edit in `src/config/events.ts`).
- No data leaves your own Google account — the spreadsheet and Drive folder live in *your* Drive.

Made with care for Afra & Atiha. 🌸
