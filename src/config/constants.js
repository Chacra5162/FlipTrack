/**
 * constants.js - Application configuration constants
 * Supabase credentials, table names, storage keys, and app settings.
 *
 * NOTE: Platform definitions, fees, and categories live in their own config files:
 *   - config/platforms.js  (PLATFORM_GROUPS, PLATFORM_FEES, platCls, calcPlatformFee)
 *   - config/categories.js (CAT_TREE, SUBCATS, SUBSUBCATS)
 * Utility functions (fmt, pct, ds, escHtml, etc.) live in utils/format.js
 */

// ── SUPABASE CONFIGURATION ─────────────────────────────────────────────────
// Loaded from environment variables (see .env.example)
export const SB_URL = import.meta.env.VITE_SUPABASE_URL;
export const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── SUPABASE TABLES ────────────────────────────────────────────────────────
export const TABLES = {
  INVENTORY: 'ft_inventory',
  SALES: 'ft_sales',
  EXPENSES: 'ft_expenses',
  SUPPLIES: 'ft_supplies',
};

// ── STORAGE BUCKETS ────────────────────────────────────────────────────────
export const IMG_BUCKET = 'item-images';

// ── PAGINATION ─────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 50;
export const TRASH_MAX_ITEMS = 30;
export const TRASH_MAX_AGE_DAYS = 7;
export const UNDO_STACK_MAX = 20;

// ── SYNC SETTINGS ──────────────────────────────────────────────────────────
export const SYNC_DEBOUNCE_MS = 2000;
export const POLL_INTERVAL_MS = 60000;
export const REALTIME_DEBOUNCE_MS = 500;
export const SYNC_TIMEOUT_MS = 10000;

// ── LOCAL STORAGE KEYS ─────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  INVENTORY: 'ft3_inv',
  SALES: 'ft3_sal',
  EXPENSES: 'ft3_exp',
  SUPPLIES: 'ft_supplies',
  TRASH: 'ft_trash',
  THEME: 'ft_theme',
  FONT_SIZE: 'ft_fs',
  FONT_FAMILY: 'ft_font',
};
