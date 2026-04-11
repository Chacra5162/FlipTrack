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
- **Version:** 2.1.0

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
- `_variantIndex` — O(1) parent→children lookup (`getVariants(parentId)`)
- All rebuilt in `rebuildInvIndex()`, called by `save()` and `refresh()`

### Multi-Variant Inventory
- **Parent items:** `{ ...item, isParent: true, qty: 0 }` — holds shared data (name, category, cost, price)
- **Child variants:** `{ ...item, parentId: 'parent-id', variantLabel: 'Size M' }` — owns qty, price, platformStatus
- Helpers: `getVariants(parentId)`, `getParentItem(childId)`, `isParent(item)`, `isVariant(item)`, `getVariantAggQty(parentId)`
- No migration needed — existing items have no `parentId` (null/undefined)
- Inventory view filters out children from main list; parents show aggregate qty

### VAPID Web Push
- **Config:** `src/config/push.js` — VAPID public key (constants.js is protected)
- **DB table:** `push_subscriptions` (user_id, endpoint, p256dh, auth) with RLS
- **Edge Function:** `supabase/functions/send-push/index.ts` — sends to all subscriptions, cleans stale
- **SW handlers:** `push` and `notificationclick` events in `public/sw.js`

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

### New Modules (Sprint 1-4, added 2026-03-21)
- `src/config/push.js` — VAPID public key for Web Push
- `src/features/sourcing-mode.js` — Full-screen AI sourcing assistant (camera → identify → comps → score)
- `src/features/poshmark-sync.js` — Manual Poshmark sold-status reconciliation
- `supabase/functions/send-push/index.ts` — VAPID push notification Edge Function

### Key Feature Summary
- **Sale Editing:** `openEditSaleModal(saleId)` in sales.js — edit any recorded sale in-place; does NOT auto-apply fee estimation over stored values
- **Mobile Card View:** `toggleInvViewMode()` in inventory.js — responsive card grid for phones
- **Goal-Aware Alerts:** `renderGoalGapWidget()` in kpi-goals.js — actionable gap-closing suggestions
- **VAPID Push:** `subscribeToPush()`/`togglePush()` in push-notifications.js — background notifications
- **eBay Sale Notifications:** `sendNotification()` called for sales, best offers, and auction completions
- **Multi-Variant:** `getVariants()`/`isParent()`/`isVariant()` in store.js — parent/child item model
- **AI Sourcing:** `openSourcingMode()` in sourcing-mode.js — camera → AI → comps → BUY/PASS verdict
- **Poshmark Sync:** `openPoshmarkSync()` in poshmark-sync.js — manual sold-status check
- **eBay Sync:** `pullEBayListings()`/`endEBayListing()`/`pushItemToEBay()` in ebay-sync.js — bidirectional eBay listing sync
- **eBay Order Sync:** Price from `priceSubtotal || total-delivery-tax`; fees from `lineItem.marketplaceFees`; tracking from shipping fulfillment API; 48h lookback window
- **eBay Fee Handling:** `addlFeePct` field on sales for surcharges not in API (e.g., 6% store performance); `addlFeeBasis` = order total for correct % calculation
- **eBay API Flags:** `_tradingApiBlocked`/`_offerApiBlocked` persisted in IDB; skip unsupported APIs silently
- **eBay Status Sync:** Delisting or deleting an item in FlipTrack auto-ends it on eBay; eBay external removals show as 'removed' status with notification
- **eBay Auctions:** `ebayListingFormat` AUCTION/FIXED_PRICE, `ebayBestOffer` toggle; auction items show Current Bid/Start Bid/Reserve in drawer (not margin/profit); excluded from margin alerts
- **Listing Statuses:** 7 statuses: `active`, `sold`, `sold-elsewhere`, `delisted`, `expired`, `draft`, `removed` (eBay-controlled only)
- **Source Normalization:** `normalizeSource()` and `retroNormalizeSources()` in autocomplete.js — strips non-alphanumeric chars, merges "Marshall's" → "Marshalls" on save and startup
- **Buyer Tiers:** Two systems — Loyalty (New/Regular/VIP/Elite by order count) and Spending (Shopper/Regular/Big Spender/Store Sponsor by total spent)
- **Fee Auto-Estimation:** eBay uses ~13.6% + $0.40 on item+shipping (`feeOnShipping` flag); `calcPlatformFee()` accepts optional shipping parameter
- **Manual Sync:** Sync button triggers both cloud sync and eBay `pullEBayListings()` when connected
- **Profit Formula:** `(price × qty) - (cost × qty) - fees - addlFee(s) - ship` — `addlFee()` in `utils/format.js` shared across all views

## JCodeMunch — Token-Saving Default
- **Always prefer JCodeMunch MCP tools over Read/Grep** for understanding code
- `get_file_outline(repo, file)` instead of `Read` to understand a file's structure
- `search_symbols(repo, query)` instead of `Grep` to find functions/classes
- `get_context_bundle(repo, file, symbol)` to understand how modules connect
- `get_symbol(repo, file, symbol)` to read one specific function
- **Fall back to Read/Grep/Edit ONLY** when exact line content is needed (making edits, verifying specific lines)
- Repo identifier for local FlipTrack: `local/FlipTrack-7aa999ac`
- Re-index after major changes: `index_folder({ path: '~/FlipTrack', incremental: true })`

## Important Rules
- **Never edit `package-lock.json`** directly
- **Never edit `.env`** — contains Supabase keys
- Pushing to `master` triggers GitHub Pages deploy — verify build first with `npx vite build`
- Always push changes before asking user to test (they verify from live site)
- Never stage `dist/`, `.env`, or `node_modules/`
- Never force-push to `master`
- **Always merge to `master` and push when work is complete** — don't leave finished work on feature branches
- **Always update documentation when features or flow change** — review and update `QUICK_REFERENCE.md`, `MODULES_API.md`, `src/features/README.md`, `src/data/README.md`, and any other howto/tutorial docs to reflect new or changed functionality

### Required Deploy Verification Process
After every merge to `master` and push, you **MUST**:
1. Run `npm test` locally **before** pushing — all tests must pass
2. Run `npx vite build` locally **before** pushing — build must succeed
3. After pushing, **wait for the GitHub Actions deploy workflow** to complete
4. Check the deploy status (via GitHub commit status or Actions page)
5. **Report the result** to the user: PASSED or FAILED
6. **If FAILED**: investigate the failure, fix it, and re-push until the deploy passes
7. Never move on to the next task or tell the user work is done until deploy is confirmed green

### Required Update Checklist
After every feature or flow change, you **MUST** update:
1. **Subscription Tiers** — Check if the feature is gated to Pro/Unlimited; update tier lists in `src/config/tier.js` and the Subscription Tiers section in the User Guide
2. **Onboarding Tour** — Add/update tour steps in `src/features/onboarding-tour.js` covering the new feature
3. **User Guide** — Update the relevant section in `FlipTrack-User-Guide-v2.0.html` AND copy to `public/`
4. **Release Notes** — Add a feature card to the latest version section under "What's New" in the User Guide
5. **Developer Docs** — Update `CLAUDE.md` (Key Feature Summary), `MODULES_API.md`, `QUICK_REFERENCE.md`, `src/features/README.md`, and `src/data/README.md` as applicable

## Do NOT
- Use `innerHTML` with unescaped user data
- Add new `_daysSince()` implementations — use `daysSince()` from `utils/format.js`
- Use `inv.find()` inside loops over `sales` — use `getInvItem(id)` or `getSalesForItem(id)` for O(1) lookups
- Call `Math.random()` for security tokens — use `crypto.getRandomValues()`
- Import from feature layer into data layer (wrong direction) — use callback registry pattern

## Known Tech Debt
8 open refactoring items tracked in `/refactor` skill (identified 2026-03-13):
1. Consolidate 4 copies of `_daysSince()` into `src/utils/format.js`
2. Dashboard price alerts duplicating repricing engine logic
3. Dashboard aging summary should use `computeInventoryHealth()`
4. `analytics-calc.js` duplicates insights aggregations
5. `store.js` separation of concerns (DOM code, calc helpers, UI state)
6. `auth.js` cleanup callback registry to fix import direction
7. `switchView()` if/else chain → view registry map
8. 200+ functions on `window` → delegated event listener migration
