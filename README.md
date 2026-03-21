# FlipTrack

Reseller inventory, sales, and expense tracker — a PWA for managing items across 30+ marketplace platforms.

## Tech Stack

- **Frontend:** Vite + vanilla JS (ES modules, no framework)
- **Backend:** Supabase (auth, Postgres with RLS, Edge Functions, realtime)
- **Deploy:** GitHub Pages via CI on push to `master`

## Setup

```bash
git clone https://github.com/your-username/FlipTrack.git
cd FlipTrack
npm install
cp .env.example .env   # Add your Supabase keys
npm run dev
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm test` | Run test suite |

## Features

- **Inventory Management** — Track items across 30+ platforms with photos, categories, conditions, and pricing
- **Sale Editing** — Edit any recorded sale in-place (price, qty, fees, platform, date)
- **Mobile Card View** — Responsive card grid layout for phone-friendly inventory browsing
- **Multi-Variant Items** — Create parent items with size/color variants (S/M/L/XL presets or custom)
- **AI Sourcing Mode** — Camera-powered "buy or pass" assistant for in-store sourcing decisions
- **Goal-Aware Alerts** — Dashboard widget showing revenue gap and top items to close it
- **VAPID Push Notifications** — Background alerts for low stock even when the tab is closed
- **Poshmark Sales Sync** — Manual reconciliation modal for Poshmark sold-status updates
- **Crosslisting** — eBay and Etsy API integration with auto-delist on sale
- **Analytics** — Profit dashboards, inventory health, sourcing ROI, platform comparisons
- **Shipping** — Order tracking, packing slips, carrier rate estimates
- **Tax Center** — Schedule C mapping, mileage tracking, quarterly estimates

## Developer Context

See [CLAUDE.md](CLAUDE.md) for detailed architecture, conventions, and project rules.
