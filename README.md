# Live Gold Price Panel

React app that shows the latest live gold price in USD using a server-side Metals.dev proxy so the API key stays out of the frontend bundle.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   - Copy `.env.example` to `.env`
   - Set `METALS_DEV_API_KEY` for the live Gold price (USD) panel

3. **Run dev** (starts proxy + Vite)
   ```bash
   npm run dev
   ```
   Open http://localhost:5173

## Scripts

- `npm run dev` - Start gold price proxy (port 3001) + Vite dev server (port 5173)
- `npm run dev:server` - Gold price proxy only
- `npm run dev:client` - Vite only
- `npm run build` - Production build
- `npm run preview` - Preview production build
