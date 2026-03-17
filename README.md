# JIRA Spaces App

React app that displays JIRA Projects (Spaces) from your JIRA Cloud instance.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   - Copy `.env.example` to `.env`
   - Set `VITE_JIRA_DOMAIN`, `VITE_JIRA_EMAIL`, and `VITE_JIRA_API_TOKEN`

3. **Run dev server**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173

## Scripts

- `npm run dev` - Start dev server (with JIRA API proxy)
- `npm run build` - Production build
- `npm run preview` - Preview production build
