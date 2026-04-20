# backend_python_app

FastAPI backend for the gold price panel.

## What It Does

- Keeps the `METALS_DEV_API_KEY` on the server side
- Exposes a single REST `GET /api/gold-price` endpoint
- Fetches the latest gold spot price from `metals.dev`
- Uses PyBuilder for builds, unit tests, and coverage enforcement

## Local Setup

```bash
python -m pip install -r backend_python_app/requirements.txt
python -m pip install pybuilder
```

## Run The Backend

```bash
python backend_python_app/run.py
```

The backend reads these environment variables from the repo-level `.env` file:

- `METALS_DEV_API_KEY`
- `METALS_DEV_BASE_URL` (optional)
- `BACKEND_PORT` (optional, default `3001`)

## Run Tests And Coverage

```bash
cd backend_python_app
pyb
```

The build is configured to fail unless Python unit tests pass and overall coverage stays at 100%.
