# Low-Code Dynamic Form Platform — Milestone 1

Full-stack implementation of **Milestone 1 (Days 1–6)**: Form Schema Engine,
Field Type Library & Core CRUD APIs, with a connected React admin UI.

Stack: **FastAPI + SQLAlchemy** (PostgreSQL-ready, SQLite by default for
zero-config runs) · **React (Vite) + @dnd-kit**.

---

## Quick Start

### 1. Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

- API root: http://localhost:8000
- Interactive docs (Swagger): http://localhost:8000/docs
- Health check: http://localhost:8000/health

By default it uses a local SQLite file (`formplatform.db`) so it runs with
zero external setup. To use PostgreSQL instead (the stack originally
assumed), either:

- edit `.env` to point `DATABASE_URL` at your own Postgres instance, or
- run `docker-compose up --build` from `backend/`, which spins up Postgres +
  the API together (see `docker-compose.yml`).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173
- It talks to the API at `http://localhost:8000` by default. To override,
  create `frontend/.env` with `VITE_API_URL=http://your-api-host:8000`.

Run backend and frontend at the same time (two terminals) — the frontend
calls the backend directly over HTTP/CORS, so nothing else is needed to
connect them.

---

## Day-by-Day Mapping

| Day | Backend | Frontend |
|---|---|---|
| **1** | FastAPI skeleton, SQLAlchemy models (`forms`, `fields`, `field_options`, `form_versions`), `/health` | Vite app shell, routing, Dashboard/Builder/Public pages, Axios client, health-check wired in |
| **2** | `field_types.py` field-type library + config validation, `GET /field-types` | `FieldPalette` renders types from the API; `FieldConfigForm` renders config inputs per type |
| **3** | `POST /forms`, `GET /forms`, `GET /forms/{id}`, `POST /forms/{id}/fields` | Dashboard "Create New Form"; Form Builder canvas to add fields from the palette |
| **4** | `PATCH/DELETE .../fields/{id}`, `PATCH .../fields/reorder`, edit-lock on archived forms | Drag-and-drop reorder (`@dnd-kit`), inline edit/delete, "Preview Form" read-only toggle |
| **5** | `POST /forms/{id}/publish` (versions snapshot), `POST /forms/{id}/archive`, `GET /forms/{id}/versions` | Publish/Archive buttons with confirm modals, Version History panel with status badges |
| **6** | `POST /forms/{id}/generate-link`, `GET /public/forms/{token}` (no auth) | "Get Shareable Link" + copy-to-clipboard, public `/f/{token}` read-only view page |

---

## Key API Endpoints

```
GET    /health
GET    /field-types

POST   /forms
GET    /forms
GET    /forms/{form_id}
PATCH  /forms/{form_id}

POST   /forms/{form_id}/fields
PATCH  /forms/{form_id}/fields/{field_id}
DELETE /forms/{form_id}/fields/{field_id}
PATCH  /forms/{form_id}/fields/reorder

POST   /forms/{form_id}/publish
POST   /forms/{form_id}/archive
GET    /forms/{form_id}/versions

POST   /forms/{form_id}/generate-link
GET    /public/forms/{token}
```

## Behavior Notes

- A form starts in **draft**. Adding/editing/deleting/reordering fields is
  only allowed while the form is **not archived**.
- **Publish** freezes the current field list into an immutable
  `form_versions` row (`schema_snapshot`) and bumps the version number.
- If you keep editing fields *after* publishing, the form flips back to
  **draft** (unpublished changes) — publish again to snapshot a new version.
- **Archive** locks the form permanently: no more edits, publishes, or new
  links.
- **Generate Link** always points at the *latest published version*, so
  respondents always see a frozen schema, never live edits-in-progress.
- The public form page renders fields read-only; actual submission
  handling is out of scope for Milestone 1 (that's Milestone 2).

## What's Not Included (by design, out of Milestone 1 scope)

- Response/submission storage and the admin dashboard/Recharts analytics
  (Milestone 2+).
- Auth/user accounts (forms are currently single-tenant for this milestone).
- Alembic migration files (tables are created automatically on startup via
  `Base.metadata.create_all`; wire up Alembic separately if you need
  versioned migrations for production).
