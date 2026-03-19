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

## Developer Context

See [CLAUDE.md](CLAUDE.md) for detailed architecture, conventions, and project rules.
