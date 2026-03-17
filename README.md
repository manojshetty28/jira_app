# JIRA Spaces App

React app that displays JIRA Projects (Spaces) from your JIRA Cloud instance. JIRA credentials are kept server-side only (never in the frontend bundle).

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   - Copy `.env.example` to `.env`
   - Set `JIRA_DOMAIN`, `JIRA_EMAIL`, `JIRA_API_TOKEN` (server-side only)
   - Optionally set `VITE_JIRA_DOMAIN` for project links in the UI

3. **Run dev** (starts proxy + Vite)
   ```bash
   npm run dev
   ```
   Open http://localhost:5173

## Scripts

- `npm run dev` - Start JIRA proxy (port 3001) + Vite dev server (port 5173)
- `npm run dev:server` - JIRA proxy only
- `npm run dev:client` - Vite only
- `npm run build` - Production build
- `npm run preview` - Preview production build
