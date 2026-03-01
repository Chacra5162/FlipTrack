/**
 * store.js - Central data store
 * Manages all inventory, sales, and expense data.
 * Uses IndexedDB as primary storage (~500MB limit) with localStorage as fallback.
 * Tracks dirty/changed items for efficient delta sync.
 */

import { initDB, getAll, putAll, putOne, deleteOne, getMeta, setMeta } from './idb.js';
import { autoSync } from './sync.js';

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
let _deletedIds = { ft_inventory: new Set(), ft_sales: new Set(), ft_expenses: new Set() };

/** Get and reset dirty sets for sync */
export function getDirtyItems() {
  const result = {
    inv: [..._dirtyInv].map(id => inv.find(i => i.id === id)).filter(Boolean),
    sales: [..._dirtySales].map(id => sales.find(s => s.id === id)).filter(Boolean),
    expenses: [..._dirtyExp].map(id => expenses.find(e => e.id === id)).filter(Boolean),
    deleted: {
      ft_inventory: [..._deletedIds.ft_inventory],
      ft_sales: [..._deletedIds.ft_sales],
      ft_expenses: [..._deletedIds.ft_expenses],
    }
  };
  return result;
}

export function clearDirtyTracking() {
  _dirtyInv.clear();
  _dirtySales.clear();
  _dirtyExp.clear();
  _dirtySupplies.clear();
  _deletedIds.ft_inventory.clear();
  _deletedIds.ft_sales.clear();
  _deletedIds.ft_expenses.clear();
}

/** Mark an item as dirty (changed) for delta sync.
 *  Also stamps _localUpdatedAt so pullFromCloud conflict resolution
 *  can tell the local copy is newer than the cloud copy. */
export function markDirty(table, id) {
  const now = Date.now();
  if (table === 'inv') {
    _dirtyInv.add(id);
    const item = inv.find(i => i.id === id);
    if (item) item._localUpdatedAt = now;
  }
  else if (table === 'sales') {
    _dirtySales.add(id);
    const s = sales.find(x => x.id === id);
    if (s) s._localUpdatedAt = now;
  }
  else if (table === 'expenses') {
    _dirtyExp.add(id);
    const e = expenses.find(x => x.id === id);
    if (e) e._localUpdatedAt = now;
  }
  else if (table === 'supplies') _dirtySupplies.add(id);
}

/** Mark an item as deleted for cloud sync */
export function markDeleted(table, id) {
  if (_deletedIds[table]) _deletedIds[table].add(id);
}

// ── PERFORMANCE: Inventory index for O(1) lookups ─────────────────────────
let _invIndex = {};

export function rebuildInvIndex() {
  _invIndex = Object.fromEntries(inv.map(i => [i.id, i]));
}

export function getInvItem(id) {
  return _invIndex[id] || null;
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

    console.log(`FlipTrack: Loaded from IndexedDB — ${inv.length} items, ${sales.length} sales`);
  } catch (e) {
    console.warn('FlipTrack: IndexedDB unavailable, using localStorage fallback:', e.message);
    _idbReady = false;
    _loadFromLocalStorage();
  }

  rebuildInvIndex();
}

/** One-time migration from localStorage → IndexedDB */
async function _migrateFromLocalStorage() {
  const lsInv = JSON.parse(localStorage.getItem('ft3_inv') || '[]');
  const lsSales = JSON.parse(localStorage.getItem('ft3_sal') || '[]');
  const lsExp = JSON.parse(localStorage.getItem('ft3_exp') || '[]');
  const lsSup = JSON.parse(localStorage.getItem('ft_supplies') || '[]');
  const lsTrash = JSON.parse(localStorage.getItem('ft_trash') || '[]');

  if (lsInv.length || lsSales.length || lsExp.length || lsSup.length) {
    await Promise.all([
      lsInv.length ? putAll('inventory', lsInv) : Promise.resolve(),
      lsSales.length ? putAll('sales', lsSales) : Promise.resolve(),
      lsExp.length ? putAll('expenses', lsExp) : Promise.resolve(),
      lsSup.length ? putAll('supplies', lsSup) : Promise.resolve(),
      lsTrash.length ? putAll('trash', lsTrash) : Promise.resolve(),
    ]);
    console.log(`FlipTrack: Migrated ${lsInv.length} items from localStorage to IndexedDB`);
  }
}

/** Fallback: load from localStorage */
function _loadFromLocalStorage() {
  inv.length = 0;
  inv.push(...JSON.parse(localStorage.getItem('ft3_inv') || '[]'));
  sales.length = 0;
  sales.push(...JSON.parse(localStorage.getItem('ft3_sal') || '[]'));
  expenses.length = 0;
  expenses.push(...JSON.parse(localStorage.getItem('ft3_exp') || '[]'));
  supplies.length = 0;
  supplies.push(...JSON.parse(localStorage.getItem('ft_supplies') || '[]'));
  _trash.length = 0;
  _trash.push(...JSON.parse(localStorage.getItem('ft_trash') || '[]'));
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

  // Synchronous IDB write (fire-and-forget, batched)
  _schedulePersist();

  // Still write to localStorage as backup (quick, synchronous)
  _saveToLocalStorage();

  if (_lastSaveOk) autoSync();
};

/** Debounced persist to IndexedDB (batches rapid saves) */
function _schedulePersist() {
  clearTimeout(_saveDebounce);
  _saveDebounce = setTimeout(() => {
    _persistPromise = _persistPromise.then(() => _persistToIDB()).catch(() => {});
  }, 200);
}

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
export function normCat(input) {
  if (!input) return input;
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();
  const existing = inv.find(i => (i.category || '').toLowerCase() === lower);
  return existing ? existing.category : trimmed;
}


// ══════════════════════════════════════════════════════════════════════════
// TRASH SYSTEM
// ══════════════════════════════════════════════════════════════════════════

export let _trash = [];

export function saveTrash() {
  const cutoff = Date.now() - 7 * 86400000;
  _trash = _trash.filter(t => t.deletedAt > cutoff).slice(-30);
  // Persist trash to IDB and localStorage
  if (_idbReady) putAll('trash', _trash).catch(() => {});
  try { localStorage.setItem('ft_trash', JSON.stringify(_trash)); } catch {}
}

export function softDeleteItem(id) {
  const item = inv.find(i => i.id === id);
  if (!item) return;
  pushUndo('delete', { ...item });
  _trash.push({ ...JSON.parse(JSON.stringify(item)), deletedAt: Date.now() });
  saveTrash();
  inv.splice(inv.indexOf(item), 1);
  markDeleted('ft_inventory', id);
}

export function restoreItem(trashIdx) {
  const item = _trash[trashIdx];
  if (!item) return;
  const { deletedAt, ...restored } = item;
  inv.push(restored);
  markDirty('inv', restored.id);
  _trash.splice(trashIdx, 1);
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
  }
}


// ── SUPPLIES ───────────────────────────────────────────────────────────────
export function saveSupplies() {
  if (_idbReady) putAll('supplies', supplies).catch(() => {});
  localStorage.setItem('ft_supplies', JSON.stringify(supplies));
}

export function saveLocalSupplies() {
  if (_idbReady) putAll('supplies', supplies).catch(() => {});
  localStorage.setItem('ft_supplies', JSON.stringify(supplies));
}


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

export function sc(qty, alert, bulk) {
  if (!bulk) return qty === 0 ? 'low' : 'ok';
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
