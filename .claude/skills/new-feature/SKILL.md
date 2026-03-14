---
name: new-feature
description: Scaffold a new FlipTrack feature module with correct imports, main.js wiring, CSS, and optional HTML. Use when user says "create a new feature", "add a module", or "scaffold".
disable-model-invocation: true
---

# Scaffold FlipTrack Feature Module

Create a new feature module following FlipTrack's established patterns. Refer to `CLAUDE.md` in the repo root for project conventions, styling, and security rules.

## Required Input
- **Feature name** (kebab-case, e.g., `price-alerts`)
- **Description** of what the feature does
- **Tier** (free/pro/unlimited) — determines which Vite chunk it belongs to

## Steps

1. **Create module** at `src/features/{name}.js` with:
   ```javascript
   /**
    * {name}.js — {description}
    */
   import { inv, sales, save, refresh, markDirty } from '../data/store.js';
   import { fmt, pct, escHtml, escAttr } from '../utils/format.js';
   import { toast } from '../utils/dom.js';

   // Export your functions here
   export function render{PascalName}() {
     // Implementation
   }
   ```

2. **Add import** to `src/main.js` in the appropriate section:
   - Free tier: near top imports
   - Pro tier: in the pro-tier lazy section
   - Unlimited tier: in the unlimited-tier section

3. **Add window bindings** to the appropriate `Object.assign(window, { ... })` block in main.js

4. **Add CSS** to `src/styles/components.css` with a section comment:
   ```css
   /* ── {FEATURE NAME} ──────────────────────────────── */
   ```

5. **Add HTML section** to `app.html` if the feature has a dashboard widget or view panel:
   ```html
   <div id="{camelName}Section"></div>
   ```

6. **Add tour step** to `src/features/onboarding-tour.js` if user-facing

7. **Update User Guide** — If the feature is user-facing:
   a. Find the current guide version by looking for `FlipTrack-User-Guide-v*.docx` files in the repo root. Identify the latest version number (e.g., `1.7`).
   b. Increment the minor version (e.g., `1.7` → `1.8`).
   c. Read the latest `.docx` file and create a new versioned copy (`FlipTrack-User-Guide-v{NEW}.docx`) that includes a section documenting the new feature — what it does, where to find it, and how to use it.
   d. Read the latest `.html` guide file and create a new versioned copy (`FlipTrack-User-Guide-v{NEW}.html`) with the same new feature section added, matching the existing HTML structure and styling.
   e. Copy the new `.html` guide to `public/FlipTrack-User-Guide-v{NEW}.html` so it deploys to GitHub Pages.
   f. Update **all** references to the old guide version:
      - `index.html` — update the footer `<a href="./FlipTrack-User-Guide-v{OLD}.html"` to point to the new version
      - `app.html` — update the account menu `window.open('./FlipTrack-User-Guide-v{OLD}.html'` to point to the new version
   g. Verify no stale references remain: search all `.html` files for the old version string and fix any found.

8. **Build** — Run `npx vite build` to verify no errors

## User Guide Conventions
- Guide files live in repo root (`.docx` and `.html`) and are copied to `public/` for deployment
- Always bump the minor version — never overwrite an existing version
- The `.html` guide is the deployed/linked version; the `.docx` is the editable source
- Two places link to the guide: `index.html` footer and `app.html` account menu — both must be updated
- After updating, grep all `.html` files for the old version string to catch any missed references
