# CareQueue — Clinic Management & Patient Flow

A clinic management system for OPD clinics: appointment booking with dynamic time slots, a live patient queue with tokens, a doctor consultation desk with e-prescriptions, billing with printable receipts, and a waiting-room TV display.

**Stack:** React 19 + Vite + Tailwind CSS (frontend) · Express 5 + JWT + bcrypt (backend) · JSON file storage (`server/data/db.json`).

## Quick start

Requires **Node.js 20+**.

```bash
npm install
npm run seed      # create server/data/db.json with demo data (dated relative to today)
npm run dev       # frontend + API together at http://localhost:5173
```

### Production

```bash
npm run build                       # builds the frontend into dist/
JWT_SECRET=change-me npm start      # serves dist/ and the API on PORT (default 5000)
```

| Variable     | Default                    | Purpose                                         |
|--------------|----------------------------|-------------------------------------------------|
| `PORT`       | `5000`                     | HTTP port for `npm start`                       |
| `JWT_SECRET` | built-in dev secret        | **Set this in production.** Signs login tokens  |
| `DB_PATH`    | `server/data/db.json`      | Location of the JSON database file              |

## Demo accounts

Created by `npm run seed`:

| Role         | Email                        | Password       |
|--------------|------------------------------|----------------|
| Admin        | admin@carequeue.org          | admin123       |
| Receptionist | receptionist@carequeue.org   | reception123   |
| Doctor       | doctor.chen@carequeue.org    | doctor123      |
| Patient      | emma.watson@carequeue.org    | patient123     |

Patients can also self-register at `/signup`. Staff accounts (doctors, receptionists, admins) are created by an Admin on the **Staff Management** page.

## What each role can do

| Role         | Access |
|--------------|--------|
| Admin        | Staff accounts, operations dashboard, doctor rosters & leaves, appointments, patient directory |
| Receptionist | Dashboard & payment collection, live queue & walk-ins, appointments, doctor schedules, patient registration |
| Doctor       | Own consultation desk & queue, prescriptions, own schedule & leaves, patient history |
| Patient      | Own portal: book/cancel appointments, view prescriptions and receipts |

Access is enforced on the server (every API route checks the JWT role); the frontend route guards only hide pages.

## Key workflows

- **Booking:** slots are generated from each doctor's working days, hours and slot length. Leave days, past times and already-booked slots can't be booked (also enforced by the API). Queue tokens are per doctor per day (`D1-01`, `D1-02`, …).
- **Queue:** Booked → Checked In → In Consultation → Completed (or No Show). Cancellation is only allowed before check-in.
- **Consultation:** the doctor records complaint, vitals, diagnosis (required) and medicines; completing the visit saves it to the patient's history and opens a printable prescription.
- **Billing:** each doctor has a **basic consultation fee** (e.g. Rs. 600 / 1,000 / 1,200, set by the Admin). At payment the receptionist can add patient-specific charges (tests, procedures) and a discount; the receipt shows the breakdown and revenue reports count the amount actually collected. Amounts are in Indian Rupees.
- **Waiting-room TV** (`/display`): public, refreshes every 5 seconds, shows tokens with masked names (e.g. "Emma W.").

## Scripts

| Command          | Description                                        |
|------------------|----------------------------------------------------|
| `npm run dev`    | Vite dev server with the API mounted               |
| `npm run build`  | Production build to `dist/`                        |
| `npm start`      | Production server (API + built frontend)           |
| `npm run seed`   | **Overwrites** the database with fresh demo data   |
| `npm test`       | API integration tests (uses a temporary database)  |
| `npm run lint`   | Oxlint                                             |

## Project structure

```
server/
  app.js              Express routes (auth, appointments, billing, doctors, patients)
  index.js            Production entry: serves API + dist/
  middleware/auth.js  JWT verification & role checks
  data/store.js       JSON file store + seed data
  utils/date.js       Local-date helpers
src/
  context/            AuthContext (session), ClinicContext (API data + actions)
  pages/              One file per screen
  components/ui/      Shared UI kit (Button, Modal, FormField, …)
  components/clinical/ Prescription, receipt, payment modal
  utils/              Date & currency (Rs.) formatting
tests/api.test.mjs    API integration tests
```

## Notes & limitations

- Storage is a single JSON file, suitable for a single clinic / single server. For multi-user production scale, move to a real database (e.g. PostgreSQL or SQLite).
- Back up `server/data/db.json` — it holds all patient records.
