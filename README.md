# Live Gold Price Panel

React app that shows the latest live gold price in USD using a FastAPI Metals.dev proxy so the API key stays out of the frontend bundle.

## Setup

1. **Install frontend dependencies**
   ```bash
   npm install
   ```

2. **Install backend dependencies**
   ```bash
   python -m pip install -r backend_python_app/requirements.txt
   python -m pip install pybuilder
   ```

3. **Configure environment**
   - Copy `.env.example` to `.env`
   - Set `METALS_DEV_API_KEY` for the live Gold price (USD) panel

4. **Run dev** (starts FastAPI + Vite)
   ```bash
   npm run dev
   ```
   Open http://localhost:5173

## Scripts

- `npm run dev` - Start FastAPI backend (port 3001) + Vite dev server (port 5173)
- `npm run dev:server` - FastAPI backend only
- `npm run dev:client` - Vite only
- `npm run build` - Production build
- `npm run preview` - Preview production build

## Python Backend Quality

- `backend_python_app/build.py` uses PyBuilder for build automation
- Python unit tests live under `backend_python_app/src/unittest/python`
- CI runs the backend build and fails if unit tests fail or coverage drops below 100%
