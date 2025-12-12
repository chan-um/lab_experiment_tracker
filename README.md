# Lab Experiment Tracker

Full-stack lab notebook with a Flask backend and React (Vite) frontend.

## Project Structure
- `app.py` — Flask API (auth, groups, experiments, files)
- `requirements.txt` — Backend dependencies
- `Dockerfile` — Backend container (Cloud Run)
- `my-lab-app/` — React frontend (Vite)
  - `src/` — UI and API client
  - `package.json` — Frontend scripts/deps
  - `firebase.json`, `.firebaserc` — Firebase Hosting config
- `.github/workflows/` — Firebase Hosting CI workflows

## Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL (recommended) or SQLite for local dev

## Environment Variables
### Backend
- `SECRET_KEY` (required) — Flask session key
- `DATABASE_URL` — e.g. `postgresql://user:password@localhost:5432/labdb` or `sqlite:///database.db`
- `CORS_ORIGINS` — Comma-separated allowed origins (e.g. `http://localhost:5173,https://your-frontend.web.app`)
- `UPLOAD_FOLDER` — default `uploads`
- `PORT` — default `5000`

### Frontend (`my-lab-app/.env`)
- `VITE_API_BASE_URL` — e.g. `http://localhost:5000/api` (local) or your Cloud Run URL `/api`

## Local Development
### Backend
```bash
python -m venv .venv
. .venv/bin/activate  # or .\.venv\Scripts\activate on Windows
pip install -r requirements.txt
export DATABASE_URL=sqlite:///database.db  # or your Postgres URL
export SECRET_KEY=$(python - <<'PY'\nimport secrets;print(secrets.token_hex(32))\nPY)
export CORS_ORIGINS=http://localhost:5173
python app.py
```
Runs at `http://localhost:5000`.

### Frontend
```bash
cd my-lab-app
npm install
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env
npm run dev
```
Runs at `http://localhost:5173`.

## Docker (Backend)
```bash
docker build -t lab-app .
docker run -p 8080:8080 \
  -e SECRET_KEY=... \
  -e DATABASE_URL=... \
  -e CORS_ORIGINS=http://localhost:5173 \
  lab-app
```

## Deployment Notes
- Backend: Build `Dockerfile`, deploy to Cloud Run (uses `PORT` env).
- Database: Cloud SQL PostgreSQL recommended (`DATABASE_URL=postgresql://user:password@/db?host=/cloudsql/PROJECT:REGION:INSTANCE`).
- Frontend: Firebase Hosting; workflows build from `my-lab-app` and deploy `dist`.

## CI (Firebase Hosting)
Workflows:
- `.github/workflows/firebase-hosting-merge.yml`
- `.github/workflows/firebase-hosting-pull-request.yml`
They run `npm ci` and `npm run build` in `my-lab-app`, then deploy. Secrets go in GitHub (e.g., `FIREBASE_SERVICE_ACCOUNT_*`).

## Security Checklist
- Set a strong `SECRET_KEY` via env var.
- Restrict `CORS_ORIGINS` to your frontend domains.
- Don’t commit secrets or `.env` files.
- Session cookies configured for cross-origin: `SameSite=None`, `Secure=True`, `HttpOnly=True`.

## API Overview (selected)
- `POST /api/register`, `POST /api/login`, `POST /api/logout`
- `GET /api/me`
- `GET/POST /api/groups`, `POST /api/groups/join`, `POST /api/groups/<id>/leave`
- `GET/POST /api/experiments` (scope `user` or `group`)
- `GET/PUT/DELETE /api/experiments/<exp_id>`
- `POST /api/experiments/<exp_id>/logs`
- `POST /api/experiments/<exp_id>/files`

## Frontend Notes
- Ownership uses `ownerId` (falls back to name for older data).
- Group experiments are loaded separately from user experiments.

## Common Issues
- **401 on experiment create**: ensure cookies allowed (CORS, SameSite=None, Secure) and you are logged in.
- **Build fails in CI**: ensure workflows run in `my-lab-app` and `npm run build` exists.
- **SQLite WAL on Cloud Run**: handled for both `sqlite:///` and `sqlite:////tmp/...`.
