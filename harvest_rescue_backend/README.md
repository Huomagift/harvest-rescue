# Harvest Rescue AI — Backend Setup (step by step)

## 1. Create a virtual environment and install dependencies
```bash
cd harvest_rescue_backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Create your .env file
```bash
cp .env.example .env
```
Then open `.env` and fill in:
- `BACKEND_API_KEY` — generate one with `python3 -c "import secrets; print(secrets.token_hex(32))"` and paste it in. This protects every endpoint — your frontend must send it on every request as an `X-API-Key` header.
- `GEE_PROJECT_ID` — your Google Cloud project ID tied to Earth Engine (find it at https://code.earthengine.google.com, top bar).
- `ALLOWED_ORIGINS` — leave as `http://localhost:3000` for local frontend dev, add your real domain later.

`.env` is gitignored — never commit it.

## 3. Authenticate Google Earth Engine (one-time, local)
```bash
earthengine authenticate
```
Opens a browser login using your approved GEE account.

## 4. Start the backend
```bash
uvicorn app.main:app --reload --port 8000
```
Visit `http://localhost:8000` for a health check, `http://localhost:8000/docs` for the interactive API explorer. Note: every route except `/` now requires the `X-API-Key` header — in `/docs`, click "Authorize" and paste your key in, or add the header manually to each request.

## 5. Load the three mock demo farms
```bash
python load_seed_data.py
```

## 6. Confirm farms loaded
```bash
curl -H "X-API-Key: your-key-here" http://localhost:8000/farms/
```

## 7. Run a risk evaluation on a farm
```bash
curl -X POST -H "X-API-Key: your-key-here" http://localhost:8000/risk/{farm_id}/evaluate
```
Pulls live Open-Meteo weather + GEE NDVI, runs the risk rules, returns triggered events. If either external call fails for any reason, the response still returns cleanly using a labeled fallback value instead of erroring out — check the `source` field in the response to see whether a given reading was live or fallback.

## 8. Check the latest risk state (what your frontend/dashboard calls)
```bash
curl -H "X-API-Key: your-key-here" http://localhost:8000/risk/{farm_id}/latest
```

## 9. Tune the thresholds
Open `app/services/risk_engine.py` if nothing is triggering on your three demo farms — lower the thresholds temporarily to confirm the flow works end-to-end, then dial back to something defensible before presenting.

## Security notes
- Every `/farms` and `/risk` route requires a valid `X-API-Key` header, checked in `app/security.py` — a wrong or missing key returns 401/422, not data.
- CORS is restricted to the origins listed in `ALLOWED_ORIGINS` in your `.env` — only your frontend's actual domain(s) can call this API from a browser.
- Coordinates and text fields are validated at the API boundary (`app/schemas.py`) before anything touches the database or an external call.
- No secrets are hardcoded anywhere in source — everything sensitive is loaded from `.env` via `app/config.py`.
- Unhandled exceptions return a generic `{"detail": "Internal server error"}` — internals (stack traces, file paths) are logged server-side, never sent to the client.

## What's intentionally not here yet
- Swift Agent tool-calling layer — you're handling agent integration yourself.
- Scheduling/cron — trigger risk evaluation on-demand for the demo.
- Postgres — SQLite for zero setup; swap the `DATABASE_URL` in `.env` later, no code changes needed.

## File structure
```
harvest_rescue_backend/
├── .env.example              # Template — copy to .env and fill in your values
├── .gitignore
├── app/
│   ├── main.py                # FastAPI app entrypoint, CORS, error handling
│   ├── config.py               # Settings loaded from .env — single source of truth
│   ├── security.py             # API key auth dependency, reused across routers
│   ├── database.py             # SQLite/SQLAlchemy setup
│   ├── models.py               # Farm, RiskEvent, FarmerReport tables
│   ├── schemas.py               # Pydantic request/response models + validation
│   ├── services/
│   │   ├── external_call.py     # Shared fallback-handling helper (no duplication)
│   │   ├── weather.py           # Open-Meteo integration
│   │   ├── satellite.py         # Google Earth Engine NDVI integration
│   │   └── risk_engine.py       # Rules-based composite risk scoring
│   └── routers/
│       ├── farms.py             # Farm CRUD endpoints (key-protected)
│       └── risk.py              # Risk evaluation endpoints (key-protected)
├── seed_data.py                 # Mock farm coordinates (real locations)
├── load_seed_data.py            # Script to insert seed farms into the DB
└── requirements.txt
```
