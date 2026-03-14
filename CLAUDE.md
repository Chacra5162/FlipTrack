# FlipTrack — Claude Code Context

## What is FlipTrack?
A reseller inventory, sales, and expense tracking PWA. Users manage inventory across 30+ marketplace platforms (eBay, Poshmark, Mercari, etc.), record sales, track expenses, and get analytics on profitability. Deployed to GitHub Pages with Supabase backend.

## Commands
```bash
npm run dev                # Start Vite dev server
npm run build              # Production build to dist/
npm run preview            # Preview production build
node tests/test-suite.cjs  # Run test suite
```

## Architecture

### Stack
- **Frontend:** Vanilla JS (ES modules, no framework), Vite bundler, single-page app
- **Backend:** Supabase (auth, Postgres with RLS, realtime subscriptions, Edge Functions, Storage)
- **Deploy:** GitHub Pages via `.github/workflows/deploy.yml` on push to `master`
- **Version:** 2.0.0

### Directory Structure
```
src/
  config/     # Constants, platform definitions, tier/subscription config, categories
  data/       # Data layer: store.js (central state), sync.js (cloud sync), auth.js, idb.js, offline-queue.js
  features/   # Business logic modules (repricing, crosslisting, AI listing, CSV, teams, etc.)
  modals/     # Modal UI components (drawer, add-item, sold, trash, lightbox)
  styles/     # CSS: base.css, components.css, mobile.css, index.css
  utils/      # Shared utilities: format.js, dom.js, sfx.js, lazy.js, gate.js, pagination.js
  views/      # View renderers: dashboard.js, inventory.js, sales.js, insights.js, reports.js, etc.
  main.js     # Entry point — imports, wiring, window bindings, view switching
```

### Entry Points
- `index.html` — Landing page (marketing)
- `app.html` — Main application (imports `src/main.js`)

### Data Flow
- **In-memory arrays:** `inv`, `sales`, `expenses`, `supplies` in `store.js`
- **Persistence:** IndexedDB primary (via `idb.js`), localStorage backup
- **Cloud sync:** Delta sync via dirty tracking (`markDirty` → `getDirtyItems` → `pushToCloud`)
- **Realtime:** Supabase realtime subscriptions with polling fallback
- **Offline:** Mutations queued in `offline-queue.js`, replayed on reconnect

### Key Indexes (Performance)
- `_invIndex` — O(1) inventory lookup by ID (`getInvItem(id)`)
- `_salesByItemId` — O(1) sales-per-item lookup (`getSalesForItem(id)`)
- `_salesIndex` / `_expIndex` — O(1) dirty tracking lookups
- All rebuilt in `rebuildInvIndex()`, called by `save()` and `refresh()`

### Subscription Tiers
- **Free:** Dashboard, inventory, sales, expenses, supplies
- **Pro ($12/mo):** Insights, reports, crosslisting, shipping, buyers, sourcing
- **Unlimited ($25/mo):** Tax center, all pro features

### Bundle Splitting (vite.config.js)
- `vendor-supabase` — Supabase SDK (isolated)
- `pro-tier` — Pro views and features (lazy-loadable)
- `unlimited-tier` — Tax center (lazy-loadable)

## Conventions

### Security (CRITICAL)
- **Always escape user data:** `escHtml()` for text content, `escAttr()` for HTML attributes
- **CSV exports:** Use `_sanitizeCell()` to prevent formula injection (`=`, `+`, `-`, `@`)
- **Supabase queries:** Use parameterized filters (`.eq()`, `.in()`), never string interpolation
- **OAuth:** Always validate CSRF `state` parameter in callbacks
- **Sign-out cleanup:** Clear all IDB metadata, intervals, timers (auth.js handles this)

### Styling
- Fonts: `'DM Mono', monospace` for data, `'Syne', sans-serif` for headings
- Color variables: `var(--accent)` cyan, `var(--accent2)` orange, `var(--accent3)` purple, `var(--good)` green, `var(--danger)` red, `var(--warn)` yellow

### Patterns
- **User feedback:** `toast('Message')` or `toast('Error', true)` for errors
- **Data mutations:** `markDirty('inv', item.id)` → `save()` → auto-triggers `autoSync()`
- **Date calculations:** Use `daysSince(dateStr)` from `utils/format.js` (shared utility)
- **Feature modules:** Export render functions, expose handlers to `window` via `main.js`
- **Inline handlers:** Functions exposed on `window` via `Object.assign(window, { ... })` blocks in `main.js`

### File Naming
- Feature modules: `src/features/{name}.js` (kebab-case)
- View renderers: `src/views/{name}.js`
- Modal components: `src/modals/{name}.js`

## Important Rules
- **Never edit `package-lock.json`** directly
- **Never edit `.env`** — contains Supabase keys
- Pushing to `master` triggers GitHub Pages deploy — verify build first with `npx vite build`
- Always push changes before asking user to test (they verify from live site)
- Never stage `dist/`, `.env`, or `node_modules/`
- Never force-push to `master`

## Do NOT
- Use `innerHTML` with unescaped user data
- Add new `_daysSince()` implementations — use `daysSince()` from `utils/format.js`
- Use `inv.find()` inside loops over `sales` — use `getInvItem(id)` or `getSalesForItem(id)` for O(1) lookups
- Call `Math.random()` for security tokens — use `crypto.getRandomValues()`
- Import from feature layer into data layer (wrong direction) — use callback registry pattern

## Known Tech Debt
7 open refactoring items tracked in `/refactor` skill (identified 2026-03-13):
1. Dashboard price alerts duplicating repricing engine logic
2. Dashboard aging summary should use `computeInventoryHealth()`
3. `analytics-calc.js` duplicates insights aggregations
4. `store.js` separation of concerns (DOM code, calc helpers, UI state)
5. `auth.js` cleanup callback registry to fix import direction
6. `switchView()` if/else chain → view registry map
7. 200+ functions on `window` → delegated event listener migration
