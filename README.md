# Film Wedding Days — Premium Business Dashboard

Standalone HTML app — **no npm or build step.**

## Open the app

1. Open **`html/index.html`** in your browser, or
2. From the `html` folder:
   ```bash
   python3 -m http.server 8080
   ```
   Then visit http://localhost:8080

## Features

- **Dashboard** — KPIs, today’s schedule, upcoming events, pending payments, editing/album queues, charts, PDF/Excel export
- **Calendar** — Month / week / day views, event-type colour coding, crew clash warnings
- **Orders** — Full workflow status, filters, mobile cards + desktop table, 8-section order form
- **Leads** — Enquiries with follow-up reminders
- **Team** — Crew roster, assignments, payout tracking
- **Reports** — Monthly revenue, expense, profit; export PDF / Excel
- **Customer profile** — Payment, deliverables, WhatsApp link
- **Backup** — Export / import JSON, save history (localStorage)

## Script modules

| File | Purpose |
|------|---------|
| `js/config.js` | Constants, event types, statuses |
| `js/model.js` | Data normalization & calculations |
| `js/storage.js` | Persistence & 10 TN sample bookings |
| `js/dashboard.js` | Business dashboard |
| `js/calendar.js` | Schedule calendar |
| `js/form.js` | Order form & detail panel |
| `js/orders.js` | Orders list & filters |
| `js/leads.js` | Leads / enquiries |
| `js/team.js` | Team management |
| `js/reports.js` | Reports & export |
| `js/customer.js` | Customer profile |
| `js/app.js` | Router & init |

Data is stored in **localStorage** (`fwds-app-v3`) in this browser only.
