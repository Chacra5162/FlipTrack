---
name: refactor
description: Run a targeted refactoring pass on FlipTrack — deduplicates code, consolidates utilities, and cleans up known tech debt. Use when user says "refactor", "clean up code", "consolidate", or "reduce duplication".
---

# FlipTrack Refactoring Pass

Run a structured refactoring pass on the FlipTrack codebase. Refer to `CLAUDE.md` in the repo root for project conventions and architecture.

## Required Input
- **Scope** — which area to refactor: `all`, `utils`, `data-layer`, `views`, `features`, or a specific file/pattern
- If no scope given, check the known backlog below and pick the highest-priority unresolved item

## Known Refactoring Backlog

### ~~1. Consolidate `_daysSince()` duplicates~~ DONE (2026-03-13)

### 2. Dashboard `renderPriceAlerts()` duplicates repricing engine
**Files:** `src/views/dashboard.js:171-222` vs `src/features/repricing-rules.js`
**Action:** Replace inline stale-item detection + tiered % drops with a call to `evaluateRules()` filtered to `percent_drop` suggestions. Keep the compact dashboard UI but source data from the rules engine.

### 3. Dashboard `renderAgingSummary()` duplicates inventory health computation
**Files:** `src/views/dashboard.js:277-327` vs `src/features/inventory-health.js:25`
**Action:** Replace inline 30/60/90-day bucket computation with `computeInventoryHealth().aging`. Keep the dashboard render; remove the duplicated data derivation.

### 4. `analytics-calc.js` duplicates insights aggregations
**Files:** `src/features/analytics-calc.js` (`calcVelocityByCategory`, `calcPlatformComparison`) vs `src/views/insights.js` (`catMap`, `platMap`)
**Action:** Either wire the calc functions into `renderInsights()` to replace inline aggregations, or remove them if truly unused. Verify call sites first.

### 5. `store.js` mixes concerns — DOM code + calc helpers + UI state
**Files:** `src/data/store.js`
**Action:**
- Move `showUndoToast()` (DOM code) out of store — use a callback or event
- Move `calc()`, `sc()`, `margCls()`, `mkc()` to `src/utils/calc.js`
- Separate UI state (`platFilt`, `catFilt`, `activeDrawId`, `_invPage`) into `src/data/ui-state.js`

### 6. `auth.js` imports from feature layer (wrong direction)
**Files:** `src/data/auth.js` imports from `ebay-sync.js`, `etsy-sync.js`, `crosslist.js`, `push-notifications.js`, `reports.js`
**Action:** Replace direct imports with a cleanup callback registry. Auth calls `registerCleanup(fn)` at init; features register their stop functions. Auth calls all registered cleanups on sign-out.

### 7. `switchView()` is a 30-branch if/else chain
**Files:** `src/main.js`
**Action:** Replace with a `VIEW_RENDERERS` registry map. Enables lazy-loading view render functions.

### 8. 200+ functions on `window` namespace
**Files:** `src/main.js`
**Action:** Migrate toward `data-action` attributes with a single delegated event listener. Progressive — can be done view-by-view.

## Steps

1. **Identify scope** — user-specified or pick from backlog
2. **Read all affected files** before making changes
3. **Plan the refactor** — identify all call sites, imports, and test paths
4. **Execute** — make the changes, preserving all existing behavior
5. **Build** — Run `npx vite build` to verify no errors
6. **Verify call sites** — grep for old function names to ensure nothing is broken

## Rules
- Never change behavior — refactoring is structure-only
- Always build after changes
- If a refactor touches more than 5 files, pause and confirm scope with the user
- Preserve all existing exports (other modules may depend on them)
