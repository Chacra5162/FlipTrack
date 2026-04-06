import { toast } from '../utils/dom.js';
/**
 * store.js - Central data store
 * Manages all inventory, sales, and expense data.
 * Uses IndexedDB as primary storage (~500MB limit) with localStorage as fallback.
 * Tracks dirty/changed items for efficient delta sync.
 */

import { initDB, getAll, putAll, putOne, deleteOne, getMeta, setMeta } from './idb.js';
// ── AUTO-SYNC CALLBACK (registered by sync.js via registerAutoSync to break circular dep) ──
let _autoSyncCallback = () => {};
export function registerAutoSync(fn) { _autoSyncCallback = fn; }

// ── EBAY DISMISS CALLBACK (registered by ebay-sync.js to prevent re-import of deleted items) ──
let _ebayDismissCallback = () => {};
let _ebayUndismissCallback = () => {};
export function registerEBayDismiss(dismissFn, undismissFn) {
  _ebayDismissCallback = dismissFn;
  _ebayUndismissCallback = undismissFn;
}

// ── DATA ARRAYS (in-memory, loaded from IDB on boot) ─────────────────────
export let inv = [];
export let sales = [];
export let expenses = [];
export let supplies = [];

// ── DIRTY TRACKING (for delta sync — track IDs that changed since last push) ──
let _dirtyInv = new Set();
let _dirtySales = new Set();
let _dirtyExp = new Set();
let _dirtySupplies = new Set();
let _deletedIds = { ft_inventory: new Set(), ft_sales: new Set(), ft_expenses: new Set(), ft_supplies: new Set() };

// ── SYNC RE-ENTRANCY GUARD ──────────────────────────────────────────────────
// Prevents concurrent saves from triggering multiple overlapping sync operations
let _syncInProgress = false;
export function isSyncInProgress() {
  return _syncInProgress;
}
export function setSyncInProgress(val) {
  _syncInProgress = val;
}

/** Get and reset dirty sets for sync */
export function getDirtyItems() {
  const result = {
    inv: [..._dirtyInv].map(id => _invIndex[id]).filter(Boolean),
    sales: [..._dirtySales].map(id => _salesIndex[id]).filter(Boolean),
    expenses: [..._dirtyExp].map(id => _expIndex[id]).filter(Boolean),
    supplies: [..._dirtySupplies].map(id => _suppliesIndex[id]).filter(Boolean),
    deleted: {
      ft_inventory: [..._deletedIds.ft_inventory],
      ft_sales: [..._deletedIds.ft_sales],
      ft_expenses: [..._deletedIds.ft_expenses],
      ft_supplies: [..._deletedIds.ft_supplies],
    }
  };
  return result;
}

/** Remove a specific ID from the deleted tracking set (used by undo) */
export function clearDeletedId(table, id) {
  if (_deletedIds[table]) _deletedIds[table].delete(id);
}

export function clearDirtyTracking() {
  _dirtyInv.clear();
  _dirtySales.clear();
  _dirtyExp.clear();
  _dirtySupplies.clear();
  _deletedIds.ft_inventory.clear();
  _deletedIds.ft_sales.clear();
  _deletedIds.ft_expenses.clear();
  _deletedIds.ft_supplies.clear();
}

/** Mark an item as dirty (changed) for delta sync.
 *  Also stamps _localUpdatedAt so pullFromCloud conflict resolution
 *  can tell the local copy is newer than the cloud copy. */
export function markDirty(table, id) {
  const now = Date.now();
  if (table === 'inv') {
    _dirtyInv.add(id);
    const item = _invIndex[id] || inv.find(i => i.id === id);
    if (item) item._localUpdatedAt = now;
  }
  else if (table === 'sales') {
    _dirtySales.add(id);
    const s = _salesIndex[id];
    if (s) s._localUpdatedAt = now;
  }
  else if (table === 'expenses') {
    _dirtyExp.add(id);
    const e = _expIndex[id];
    if (e) e._localUpdatedAt = now;
  }
  else if (table === 'supplies') {
    _dirtySupplies.add(id);
    const s = _suppliesIndex[id];
    if (s) s._localUpdatedAt = now;
  }
}

/** Mark an item as deleted for cloud sync */
export function markDeleted(table, id) {
  if (_deletedIds[table]) _deletedIds[table].add(id);
}

// ── PERFORMANCE: Inventory index for O(1) lookups ─────────────────────────
let _invIndex = {};
let _salesIndex = {};
let _expIndex = {};
let _suppliesIndex = {};

// ── PERFORMANCE: Sales-by-item-ID index for O(1) lookups ──────────────────
let _salesByItemId = new Map();

// ── VARIANT INDEX: parentId → [childId, ...] ─────────────────────────────
let _variantIndex = new Map();

/** Rebuild all indexes. Called by save() and refresh(). */
export function rebuildInvIndex() {
  _invIndex = Object.fromEntries(inv.map(i => [i.id, i]));
  // Rebuild both sales indexes in a single pass
  _salesByItemId = new Map();
  _salesIndex = {};
  for (const s of sales) {
    _salesIndex[s.id] = s;
    if (!_salesByItemId.has(s.itemId)) _salesByItemId.set(s.itemId, []);
    _salesByItemId.get(s.itemId).push(s);
  }
  _expIndex = Object.fromEntries(expenses.map(e => [e.id, e]));
  _suppliesIndex = Object.fromEntries(supplies.map(s => [s.id, s]));
  // Rebuild variant index
  _variantIndex = new Map();
  for (const item of inv) {
    if (item.parentId) {
      if (!_variantIndex.has(item.parentId)) _variantIndex.set(item.parentId, []);
      _variantIndex.get(item.parentId).push(item.id);
    }
  }
  rebuildCatIndex();
}

export function getInvItem(id) {
  return _invIndex[id] || null;
}

/** Get a single sale by ID — O(1) lookup */
export function getSaleById(id) {
  return _salesIndex[id] || null;
}

/** Get all sales for an item by ID — O(1) lookup */
export function getSalesForItem(id) {
  return _salesByItemId.get(id) || [];
}

// ── VARIANT HELPERS ──────────────────────────────────────────────────────

/** Get child variant IDs for a parent item */
export function getVariants(parentId) {
  return (_variantIndex.get(parentId) || []).map(id => _invIndex[id]).filter(Boolean);
}

/** Get the parent item for a variant child */
export function getParentItem(childId) {
  const child = _invIndex[childId];
  if (!child || !child.parentId) return null;
  return _invIndex[child.parentId] || null;
}

/** Check if an item is a parent with variants */
export function isParent(item) {
  return item && item.isParent === true && _variantIndex.has(item.id);
}

/** Check if an item is a child variant */
export function isVariant(item) {
  return item && !!item.parentId;
}

/** Get aggregate qty across all children of a parent */
export function getVariantAggQty(parentId) {
  const children = getVariants(parentId);
  return children.reduce((sum, c) => sum + (c.qty || 0), 0);
}

// ── PERFORMANCE: Computation cache (dirty flag pattern) ───────────────────
export let _cacheDirty = true;
export let _insightsCache = null;
export let _breakdownCache = null;
export let _chipsBuiltForData = null;

// ── UI STATE VARIABLES ────────────────────────────────────────────────────
export let activeDrawId = null;
export function setActiveDrawId(id) { activeDrawId = id; }
export let activeSoldId = null;
export function setActiveSoldId(id) { activeSoldId = id; }
export let platFilt = new Set();
export let catFilt = new Set();
export function setCatFilt(v) { catFilt = v; }
export let subcatFilt = 'all';
export function setSubcatFilt(v) { subcatFilt = v; }
export let subsubcatFilt = 'all';
export function setSubsubcatFilt(v) { subsubcatFilt = v; }
export let stockFilt = 'all';
export function setStockFilt(v) { stockFilt = v; }
export let sel = new Set();
export let dragSrc = null;
export let _invPage = 0;
export let _invPageSize = 50;
export let _salePage = 0;
export let _salePageSize = 50;
export let _undoStack = [];


// ══════════════════════════════════════════════════════════════════════════
// BOOT: Load data from IDB (or fall back to localStorage)
// ══════════════════════════════════════════════════════════════════════════

let _idbReady = false;

/** Initialize data store. Call once at app boot before rendering. */
export async function initStore() {
  try {
    await initDB();
    _idbReady = true;

    // Check if this is a first-time IDB load (migrate from localStorage)
    const migrated = await getMeta('migrated_from_ls');
    if (!migrated) {
      await _migrateFromLocalStorage();
      await setMeta('migrated_from_ls', true);
    }

    // Load from IDB
    const [idbInv, idbSales, idbExp, idbSup, idbTrash] = await Promise.all([
      getAll('inventory'),
      getAll('sales'),
      getAll('expenses'),
      getAll('supplies'),
      getAll('trash'),
    ]);

    inv.length = 0;    inv.push(...idbInv);
    sales.length = 0;  sales.push(...idbSales);
    expenses.length = 0; expenses.push(...idbExp);
    supplies.length = 0; supplies.push(...idbSup);
    _trash.length = 0; _trash.push(...idbTrash);

    // Item counts available via dev tools if needed
  } catch (e) {
    console.warn('FlipTrack: IndexedDB unavailable, using localStorage fallback:', e.message);
    _idbReady = false;
    _loadFromLocalStorage();
  }

  rebuildInvIndex();
}

/** Safe JSON parse — returns fallback on corrupt data */
function _safeParseLS(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (e) {
    console.warn(`FlipTrack: corrupt localStorage key "${key}", using fallback:`, e.message);
    return fallback;
  }
}

/** One-time migration from localStorage → IndexedDB */
async function _migrateFromLocalStorage() {
  const lsInv = _safeParseLS('ft3_inv');
  const lsSales = _safeParseLS('ft3_sal');
  const lsExp = _safeParseLS('ft3_exp');
  const lsSup = _safeParseLS('ft_supplies');
  const lsTrash = _safeParseLS('ft_trash');

  if (lsInv.length || lsSales.length || lsExp.length || lsSup.length) {
    await Promise.all([
      lsInv.length ? putAll('inventory', lsInv) : Promise.resolve(),
      lsSales.length ? putAll('sales', lsSales) : Promise.resolve(),
      lsExp.length ? putAll('expenses', lsExp) : Promise.resolve(),
      lsSup.length ? putAll('supplies', lsSup) : Promise.resolve(),
      lsTrash.length ? putAll('trash', lsTrash) : Promise.resolve(),
    ]);
    // Migration complete
  }
}

/** Fallback: load from localStorage */
function _loadFromLocalStorage() {
  inv.length = 0;
  inv.push(..._safeParseLS('ft3_inv'));
  sales.length = 0;
  sales.push(..._safeParseLS('ft3_sal'));
  expenses.length = 0;
  expenses.push(..._safeParseLS('ft3_exp'));
  supplies.length = 0;
  supplies.push(..._safeParseLS('ft_supplies'));
  _trash.length = 0;
  _trash.push(..._safeParseLS('ft_trash'));
}


// ══════════════════════════════════════════════════════════════════════════
// SAVE & PERSISTENCE
// ══════════════════════════════════════════════════════════════════════════

let _lastSaveOk = true;
let _saveDebounce = null;
let _persistPromise = Promise.resolve();

export const save = () => {
  rebuildInvIndex();
  _cacheDirty = true;
  _chipsBuiltForData = null;

  // Immediate visual feedback — show "Saving…" status
  _showSaveStatus();

  // Synchronous IDB write (fire-and-forget, batched)
  _schedulePersist();

  // Write to localStorage as backup (debounced to avoid blocking main thread)
  _scheduleLSSave();

  // Only trigger auto-sync if save succeeded AND no sync already in progress
  if (_lastSaveOk && !_syncInProgress) _autoSyncCallback();
};

/** Lightweight DOM update for immediate save feedback (no sync.js import needed) */
function _showSaveStatus() {
  const dot = document.getElementById('syncDot');
  const lbl = document.getElementById('syncDotLbl');
  const bar = document.getElementById('syncProgressBar');
  if (dot) { dot.className = 'sync-dot saving'; }
  if (lbl) { lbl.textContent = 'Saving…'; }
  if (bar) { bar.classList.add('active'); }
}

/** Debounced persist to IndexedDB (batches rapid saves) */
function _schedulePersist() {
  clearTimeout(_saveDebounce);
  // Set promise immediately so waitForPersist() awaits the pending write
  if (!_pendingPersistResolve) {
    _persistPromise = new Promise(r => { _pendingPersistResolve = r; });
  }
  _saveDebounce = setTimeout(() => {
    const resolve = _pendingPersistResolve;
    _pendingPersistResolve = null;
    _persistToIDB().then(resolve).catch(e => { console.warn('FlipTrack: IDB persist chain error:', e.message); resolve(); });
  }, 200);
}
let _pendingPersistResolve = null;

/** Write all data to IndexedDB */
async function _persistToIDB() {
  if (!_idbReady) return;
  try {
    await Promise.all([
      putAll('inventory', inv),
      putAll('sales', sales),
      putAll('expenses', expenses),
      putAll('supplies', supplies),
    ]);
  } catch (e) {
    console.warn('FlipTrack: IDB persist failed:', e.message);
  }
}

/** Wait for any in-flight IDB persist to complete. Called by sync before reading dirty data. */
export function waitForPersist() {
  return _persistPromise;
}

/** Clear all store timers and debounces. Called during logout cleanup. */
export function clearStoreTimers() {
  clearTimeout(_saveDebounce);
  _saveDebounce = null;
  clearTimeout(_lsDebounce);
  _lsDebounce = null;
}

let _lsDebounce = null;
function _scheduleLSSave() {
  clearTimeout(_lsDebounce);
  _lsDebounce = setTimeout(_saveToLocalStorage, 5000);
}

/** Write to localStorage as backup */
function _saveToLocalStorage() {
  try {
    localStorage.setItem('ft3_inv', JSON.stringify(inv));
    localStorage.setItem('ft3_sal', JSON.stringify(sales));
    localStorage.setItem('ft3_exp', JSON.stringify(expenses));
    _lastSaveOk = true;
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22) {
      try {
        const invNoImg = inv.map(i => { const d = { ...i }; delete d.image; delete d.images; return d; });
        localStorage.setItem('ft3_inv', JSON.stringify(invNoImg));
        localStorage.setItem('ft3_sal', JSON.stringify(sales));
        localStorage.setItem('ft3_exp', JSON.stringify(expenses));
        _lastSaveOk = true;
      } catch (e2) {
        console.warn('FlipTrack: localStorage full:', e2.message);
        _lastSaveOk = false;
        // IDB is still fine — localStorage is just a bonus cache
        if (_idbReady) _lastSaveOk = true;
      }
    } else {
      console.warn('FlipTrack: save error:', e.message);
      _lastSaveOk = false;
      if (_idbReady) _lastSaveOk = true;
    }
  }
}


// ── REFRESH (UI update trigger) ────────────────────────────────────────────
export function refresh() {
  rebuildInvIndex();
  _cacheDirty = true;
  _chipsBuiltForData = null;
}


// ── CATEGORY NORMALIZATION ─────────────────────────────────────────────────
function titleCase(s) {
  return s.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}
// Category index for O(1) normalization lookups
let _catIndex = {};
export function rebuildCatIndex() {
  _catIndex = {};
  for (const i of inv) {
    if (i.category) _catIndex[i.category.toLowerCase()] = i.category;
  }
}
export function normCat(input) {
  if (!input || typeof input !== 'string') return input;
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();
  return _catIndex[lower] || titleCase(trimmed);
}
// Normalize all existing category names in inventory to prevent duplicates
export function normalizeAllCategories() {
  const catMap = {};
  const subMap = {};
  let changed = 0;
  for (const item of inv) {
    if (item.category) {
      const lower = item.category.toLowerCase();
      if (!catMap[lower]) catMap[lower] = titleCase(item.category);
      if (item.category !== catMap[lower]) {
        item.category = catMap[lower];
        changed++;
      }
    }
    if (item.subcategory) {
      const lower = item.subcategory.toLowerCase();
      if (!subMap[lower]) subMap[lower] = titleCase(item.subcategory);
      if (item.subcategory !== subMap[lower]) {
        item.subcategory = subMap[lower];
        changed++;
      }
    }
  }
  return changed;
}


// ══════════════════════════════════════════════════════════════════════════
// TRASH SYSTEM
// ══════════════════════════════════════════════════════════════════════════

export let _trash = [];

export function saveTrash() {
  const cutoff = Date.now() - 7 * 86400000;
  _trash = _trash.filter(t => t.deletedAt > cutoff).slice(-30);
  // Persist trash to IDB and localStorage
  if (_idbReady) putAll('trash', _trash).catch(e => { console.warn('FlipTrack: trash IDB save failed:', e.message); toast('⚠ Save error — check storage', true); });
  try { localStorage.setItem('ft_trash', JSON.stringify(_trash)); } catch (e) { console.warn('FlipTrack: trash localStorage save failed:', e.message); toast('⚠ Save error — check storage', true); }
}

export function softDeleteItem(id) {
  const item = inv.find(i => i.id === id);
  if (!item) return;
  pushUndo('delete', { ...item });
  if (item.ebayListingId || item.ebayItemId) _ebayDismissCallback(item);
  _trash.push({ ...structuredClone(item), deletedAt: Date.now() });
  saveTrash();
  inv.splice(inv.indexOf(item), 1);
  markDeleted('ft_inventory', id);
}

export function restoreItem(trashIdxOrId) {
  // Support both index (legacy) and ID (preferred)
  let idx = typeof trashIdxOrId === 'number' ? trashIdxOrId : _trash.findIndex(t => t.id === trashIdxOrId);
  if (idx < 0 || idx >= _trash.length) return;
  const item = _trash[idx];
  if (!item) return;
  const { deletedAt, ...restored } = item;
  if (restored.ebayListingId || restored.ebayItemId) _ebayUndismissCallback(restored);
  inv.push(restored);
  markDirty('inv', restored.id);
  _trash.splice(idx, 1);
  saveTrash();
  save();
  refresh();
}


// ── UNDO SYSTEM ────────────────────────────────────────────────────────────
export function pushUndo(action, data) {
  _undoStack.push({ action, data, ts: Date.now() });
  if (_undoStack.length > 20) _undoStack.shift();
}

export function showUndoToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = '';
  const span = document.createElement('span');
  span.textContent = msg + ' ';
  const btn = document.createElement('button');
  btn.textContent = 'Undo';
  btn.style.cssText = 'background:rgba(0,0,0,0.3);border:1px solid rgba(0,0,0,0.4);color:#fff;padding:3px 10px;margin-left:8px;cursor:pointer;font-family:Syne,sans-serif;font-weight:700;font-size:11px';
  btn.onclick = () => { performUndo(); t.classList.remove('on'); };
  t.appendChild(span);
  t.appendChild(btn);
  t.classList.remove('err');
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 8000);
}

export function performUndo() {
  const entry = _undoStack.pop();
  if (!entry) return;
  if (entry.action === 'delete') {
    inv.push(entry.data);
    clearDeletedId('ft_inventory', entry.data.id);
    markDirty('inv', entry.data.id);
    save();
    refresh();
  } else if (entry.action === 'sold') {
    const item = inv.find(i => i.id === entry.data.itemId);
    if (item) {
      item.qty = (item.qty || 0) + (entry.data.qty || 1);
      markDirty('inv', item.id);
    }
    const idx = sales.findIndex(s => s.id === entry.data.saleId);
    if (idx !== -1) {
      markDeleted('ft_sales', entry.data.saleId);
      sales.splice(idx, 1);
    }
    save();
    refresh();
  } else if (entry.action === 'repricing') {
    for (const { itemId, oldPrice } of entry.data) {
      const item = inv.find(i => i.id === itemId);
      if (item) { item.price = oldPrice; markDirty('inv', item.id); }
    }
    save();
    refresh();
  } else if (entry.action === 'price_change') {
    const item = inv.find(i => i.id === entry.data.itemId);
    if (item) { item.price = entry.data.oldPrice; markDirty('inv', item.id); }
    save();
    refresh();
  }
}


// ── SUPPLIES ───────────────────────────────────────────────────────────────
export function saveSupplies() {
  if (_idbReady) putAll('supplies', supplies).catch(e => { console.warn('FlipTrack: supplies IDB save failed:', e.message); toast('⚠ Supplies save error', true); });
  try { localStorage.setItem('ft_supplies', JSON.stringify(supplies)); } catch (e) { console.warn('FlipTrack: supplies localStorage save failed:', e.message); toast('⚠ Supplies save error', true); }
}

// saveLocalSupplies is an alias for saveSupplies (kept for backwards compat)
export const saveLocalSupplies = saveSupplies;


// ── UTILITY FUNCTIONS FOR CALCULATIONS ──────────────────────────────────────

export function calc(item) {
  const cost = item.cost || 0;
  const price = item.price || 0;
  const fees = item.fees || 0;
  const ship = item.ship || 0;
  const pu = price - cost - fees - ship;
  const m = price ? pu / price : 0;
  const roi = cost ? pu / cost : 0;
  return { cost, price, fees, ship, pu, m, roi };
}

export function sc(qty, alert, bulk, alertEnabled) {
  if (!alertEnabled && !bulk) return 'ok';
  return qty === 0 ? 'low' : qty <= (alert || 2) ? 'warn' : 'ok';
}

export function margCls(m) {
  return m >= 0.35 ? 'mb-high' : m >= 0.15 ? 'mb-mid' : 'mb-low';
}

export function mkc(i) {
  const m = calc(i).m;
  return margCls(m);
}

// Placeholder for debounced render
export let _debouncedRenderInv = () => {};
