/**
 * sync.js - Cloud synchronization and real-time subscriptions
 * Handles push/pull to Supabase with DELTA SYNC (only changed rows).
 * Uses dirty tracking from store.js to minimize data transfer.
 */

import { localDate } from '../utils/format.js';
import { SB_URL, SB_KEY } from '../config/constants.js';
import {
  inv, sales, expenses, supplies,
  save, refresh, saveLocalSupplies,
  getDirtyItems, getDirtyIdSets, getDeletedIdSets, clearDirtyTracking, clearDirtyForIds, clearDeletedIds, markDirty, isInvDirty, waitForPersist,
  isSyncInProgress, setSyncInProgress, clearStoreTimers,
  registerAutoSync
} from './store.js';
import { getCurrentUser, getSupabaseClient, getAccountId } from './auth.js';
// accountId callback registered from feature layer to avoid data→feature import
let _getActiveAccountId = () => getAccountId(); // default fallback to auth user id
export function registerAccountIdProvider(fn) { _getActiveAccountId = fn; }
import { isStorageUrl, migrateImagesToStorage } from './storage.js';
import { setMeta, getMeta } from './idb.js';
import { enqueue, setupOfflineReplay } from './offline-queue.js';
import { toast, humanizeError } from '../utils/dom.js';
// recordSync registered from feature layer
let _recordSync = () => {};
export function registerRecordSync(fn) { _recordSync = fn; }

// Log-once guards: some errors fire every sync (ft_expenses/ft_supplies
// missing, Trading API blocked) and there's no signal in seeing them
// repeated. These flags drop the second+ occurrences until a reload.
const _loggedOnce = new Set();
function _warnOnce(key, ...args) {
  if (_loggedOnce.has(key)) return;
  _loggedOnce.add(key);
  console.warn(...args);
}

// ── SYNC STATUS ────────────────────────────────────────────────────────────
export function setSyncStatus(state, msg) {
  const dot = document.getElementById('syncDot');
  const lbl = document.getElementById('syncDotLbl');
  if (!dot || !lbl) return;

  dot.className = 'sync-dot';
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const map = {
    disconnected: { cls: '',          txt: 'Offline' },
    connected:    { cls: 'connected', txt: `Synced ${now}` },
    saving:       { cls: 'saving',    txt: 'Saving…' },
    syncing:      { cls: 'syncing',   txt: 'Syncing…' },
    error:        { cls: 'error',     txt: msg || 'Sync error' },
  };
  const s = map[state] || map.disconnected;
  if (s.cls) dot.classList.add(s.cls);
  lbl.textContent = s.txt;

  // Progress bar
  const bar = document.getElementById('syncProgressBar');
  if (bar) {
    if (state === 'saving' || state === 'syncing') {
      bar.classList.add('active');
    } else {
      bar.classList.remove('active');
    }
  }
}


// ══════════════════════════════════════════════════════════════════════════
// DELTA PUSH — only send rows that changed since last push
//
// STALE WRITE PROTECTION:
// - Each row includes _localUpdatedAt timestamp (when last modified locally)
// - Server-side updated_at is compared during pullFromCloud() merge
// - Conflict resolution: remote wins only if updated_at >= _localUpdatedAt
// - This prevents a stale device from overwriting newer remote changes
// ══════════════════════════════════════════════════════════════════════════

export async function pushToCloud() {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();
  if (!_sb || !_currentUser) return;

  // Wait for any in-flight IDB persist before reading dirty data
  await waitForPersist();

  // If offline, queue mutations for later replay
  // Clear dirty tracking here since items are safely queued for offline replay
  if (!navigator.onLine) {
    const queued = await _queueDirtyItems();
    if (queued) clearDirtyTracking();
    return;
  }

  const accountId = _getActiveAccountId();

  try {
    // ── Upload any pending base64 images to Storage before push ──
    try { await migrateImagesToStorage(); } catch (e) {
      console.warn('FlipTrack: image migration skipped:', e.message);
    }

    // Snapshot dirty items AFTER migration so URLs are up-to-date.
    // Critically, we capture the IDs in the snapshot up front and only clear
    // THOSE IDs from dirty tracking after a successful push. The previous
    // clearDirtyTracking() approach wiped everything — including items the
    // user edited DURING the push, silently losing those edits.
    const dirty = getDirtyItems();
    const snapshotIds = {
      inv: dirty.inv.map(i => i.id),
      sales: dirty.sales.map(s => s.id),
      expenses: dirty.expenses.map(e => e.id),
      supplies: (dirty.supplies || []).map(s => s.id),
    };
    // Track which tables succeeded so we can clear dirty per-table even if
    // a later table fails (previously the whole push threw and re-queued).
    const succeeded = { inv: false, sales: false, expenses: false, supplies: false };

    // ── Push changed inventory rows ──
    if (dirty.inv.length) {
      const rows = dirty.inv.map(i => {
        const d = { ...i };
        if (d.images) d.images = d.images.map(img => isStorageUrl(img) ? img : null).filter(Boolean);
        if (d.image && !isStorageUrl(d.image)) delete d.image;
        if (d.images && d.images.length) d.image = d.images[0];
        return { id: i.id, account_id: accountId, data: d, updated_at: new Date().toISOString() };
      });
      const { error } = await _sb.from('ft_inventory').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(error.message);
      succeeded.inv = true;
    } else { succeeded.inv = true; }

    // ── Push changed sales rows ──
    if (dirty.sales.length) {
      const rows = dirty.sales.map(s => ({
        id: s.id, account_id: accountId, data: s, updated_at: new Date().toISOString()
      }));
      const { error } = await _sb.from('ft_sales').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(error.message);
      succeeded.sales = true;
    } else { succeeded.sales = true; }

    // ── Push changed expense rows ──
    if (dirty.expenses.length) {
      const rows = dirty.expenses.map(e => ({
        id: e.id, account_id: accountId, data: e, updated_at: new Date().toISOString()
      }));
      try {
        const { error } = await _sb.from('ft_expenses').upsert(rows, { onConflict: 'id' });
        if (error) _warnOnce('exp-push-err', 'FlipTrack: expenses push error:', error.message);
        else succeeded.expenses = true;
      } catch (e) {
        _warnOnce('exp-missing', 'FlipTrack: ft_expenses not available:', e.message);
      }
    } else { succeeded.expenses = true; }

    // ── Push changed supply rows ──
    if (dirty.supplies && dirty.supplies.length) {
      const rows = dirty.supplies.map(s => ({
        id: s.id, account_id: accountId, data: s, updated_at: new Date().toISOString()
      }));
      try {
        const { error } = await _sb.from('ft_supplies').upsert(rows, { onConflict: 'id' });
        if (error) _warnOnce('sup-push-err', 'FlipTrack: supplies push error:', error.message);
        else succeeded.supplies = true;
      } catch (e) {
        _warnOnce('sup-missing', 'FlipTrack: ft_supplies not available:', e.message);
      }
    } else { succeeded.supplies = true; }

    // ── Push deletes (per-table, track which succeeded) ──
    const deletesSucceededFor = {};
    for (const [table, ids] of Object.entries(dirty.deleted)) {
      if (ids.length) {
        try {
          const { error } = await _sb.from(table).delete().eq('account_id', accountId).in('id', ids);
          if (error) console.warn(`FlipTrack: delete from ${table} failed:`, error.message);
          else deletesSucceededFor[table] = ids;
        } catch (e) {
          console.warn(`FlipTrack: delete from ${table} failed:`, e.message);
        }
      } else { deletesSucceededFor[table] = []; }
    }

    // ── Record last sync timestamp ──
    // If the timestamp write fails (IDB quota, transient error) we deliberately
    // do NOT swallow it silently — an unpersisted lastSyncPush means the next
    // delta pull uses a stale timestamp and may miss rows. Clear local cache
    // so the next sync does a full pull and rebuilds the timestamp cleanly.
    try {
      await setMeta('lastSyncPush', new Date().toISOString());
    } catch (e) {
      console.warn('FlipTrack: sync push timestamp save failed — forcing full pull next cycle:', e.message);
      try { await setMeta('lastSyncPull', null); } catch (_) {}
    }

    // Clear ONLY the snapshotted IDs, per table. Items marked dirty AFTER the
    // snapshot stay dirty and ride the next sync.
    if (succeeded.inv) clearDirtyForIds('inv', snapshotIds.inv);
    if (succeeded.sales) clearDirtyForIds('sales', snapshotIds.sales);
    if (succeeded.expenses) clearDirtyForIds('expenses', snapshotIds.expenses);
    if (succeeded.supplies) clearDirtyForIds('supplies', snapshotIds.supplies);
    for (const [table, ids] of Object.entries(deletesSucceededFor)) {
      clearDeletedIds(table, ids);
    }
  } catch (e) {
    // Network error during push — queue everything for retry. Dirty items
    // that failed to push stay dirty so the next sync retries them.
    console.warn('FlipTrack: push failed, queueing for retry:', e.message);
    toast(`Sync failed — changes saved locally, will retry. (${humanizeError(e)})`, true);
    await waitForPersist();
    await _queueDirtyItems();
    throw e;
  }
}

/** Queue current dirty items to the offline mutation queue */
async function _queueDirtyItems() {
  const dirty = getDirtyItems();
  let hadItems = false;
  if (dirty.inv.length) {
    hadItems = true;
    const rows = dirty.inv.map(i => ({ id: i.id, data: { ...i } }));
    await enqueue('upsert', 'ft_inventory', rows);
  }
  if (dirty.sales.length) {
    hadItems = true;
    const rows = dirty.sales.map(s => ({ id: s.id, data: s }));
    await enqueue('upsert', 'ft_sales', rows);
  }
  if (dirty.expenses.length) {
    hadItems = true;
    const rows = dirty.expenses.map(e => ({ id: e.id, data: e }));
    await enqueue('upsert', 'ft_expenses', rows);
  }
  if (dirty.supplies && dirty.supplies.length) {
    hadItems = true;
    const rows = dirty.supplies.map(s => ({ id: s.id, data: s }));
    await enqueue('upsert', 'ft_supplies', rows);
  }
  for (const [table, ids] of Object.entries(dirty.deleted)) {
    if (ids.length) { hadItems = true; await enqueue('delete', table, ids); }
  }
  return hadItems;
}


// ── PUSH ALL (full push for initial sync / manual sync) ──────────────────
export async function pushAllToCloud() {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();
  if (!_sb || !_currentUser) return;

  const accountId = _getActiveAccountId();

  // Upload any pending base64 images before full push
  try { await migrateImagesToStorage(); } catch (e) {
    console.warn('FlipTrack: image migration skipped:', e.message);
  }

  const invRows = inv.map(i => {
    const d = { ...i };
    if (d.images) d.images = d.images.map(img => isStorageUrl(img) ? img : null).filter(Boolean);
    if (d.image && !isStorageUrl(d.image)) delete d.image;
    if (d.images && d.images.length) d.image = d.images[0];
    return { id: i.id, account_id: accountId, data: d, updated_at: new Date().toISOString() };
  });

  const saleRows = sales.map(s => ({
    id: s.id, account_id: accountId, data: s, updated_at: new Date().toISOString()
  }));

  const [r1, r2] = await Promise.all([
    invRows.length ? _sb.from('ft_inventory').upsert(invRows, { onConflict: 'id' }) : Promise.resolve({}),
    saleRows.length ? _sb.from('ft_sales').upsert(saleRows, { onConflict: 'id' }) : Promise.resolve({}),
  ]);
  if (r1.error || r2.error) throw new Error((r1.error || r2.error).message);

  try {
    const expRows = expenses.map(e => ({
      id: e.id, account_id: accountId, data: e, updated_at: new Date().toISOString()
    }));
    if (expRows.length) await _sb.from('ft_expenses').upsert(expRows, { onConflict: 'id' });
  } catch (e) {
    console.warn('FlipTrack: ft_expenses not available:', e.message);
  }

  clearDirtyTracking();
}


// ── PUSH DELETE (immediate) ──────────────────────────────────────────────
export async function pushDeleteToCloud(table, ids) {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();
  if (!_sb || !_currentUser || !ids.length) return;
  const accountId = _getActiveAccountId();
  try {
    await _sb.from(table).delete().eq('account_id', accountId).in('id', ids);
  } catch (e) {
    console.warn(`FlipTrack: delete from ${table} failed:`, e.message);
  }
}


// ══════════════════════════════════════════════════════════════════════════
// DELTA PULL — only fetch rows newer than last pull timestamp
// ══════════════════════════════════════════════════════════════════════════

let _lastPulledAccountId = null;
export async function pullFromCloud() {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();
  if (!_sb || !_currentUser) return false;

  const accountId = _getActiveAccountId();

  // If the active account changed (team switch, account switch), the in-memory
  // dirty set is for the PREVIOUS account. Pushing it to the new account would
  // either fail RLS or contaminate the new account's data. Flush dirty state
  // and force a full pull (lastPull=null) so we reload the right account's data.
  let lastPull = await getMeta('lastSyncPull').catch(() => null);
  if (_lastPulledAccountId && _lastPulledAccountId !== accountId) {
    console.warn('[Sync] Account switched (', _lastPulledAccountId, '→', accountId, ') — flushing dirty + forcing full pull');
    clearDirtyTracking();
    lastPull = null;
  }
  _lastPulledAccountId = accountId;

  // Safety: if local data is empty but lastPull is set, force a full pull.
  // This prevents a stale timestamp from causing delta queries to return 0 rows
  // when the local IDB was cleared (e.g. cache wipe, new device, browser reset).
  if (lastPull && inv.length === 0 && sales.length === 0) {
    console.log('FlipTrack: local data empty with stale lastPull — forcing full pull');
    lastPull = null;
  }

  let query_inv = _sb.from('ft_inventory').select('id, data, updated_at').eq('account_id', accountId);
  let query_sales = _sb.from('ft_sales').select('id, data, updated_at').eq('account_id', accountId);

  // Delta pull: only fetch rows updated after last pull
  if (lastPull) {
    query_inv = query_inv.gt('updated_at', lastPull);
    query_sales = query_sales.gt('updated_at', lastPull);
  }

  // Fetch inventory, sales, and expenses in parallel
  let query_exp = _sb.from('ft_expenses').select('id, data, updated_at').eq('account_id', accountId);
  if (lastPull) query_exp = query_exp.gt('updated_at', lastPull);

  const [{ data: remoteInv, error: e1 }, { data: remoteSales, error: e2 }, expResult] = await Promise.all([
    query_inv,
    query_sales,
    query_exp.then(r => r).catch(() => ({ data: null, error: null })),
  ]);
  if (e1 || e2) {
    const msg = (e1 || e2).message;
    console.warn('FlipTrack: pull failed:', msg);
    throw new Error(msg);
  }

  const remoteExp = expResult.error ? null : expResult.data;

  if (lastPull) {
    // ── DELTA MERGE with conflict resolution: compare updated_at timestamps ──
    // Skip items that have pending local edits (dirty) to prevent overwriting user's work.
    // Skip items queued for deletion — otherwise a pull between dedup (which marks a
    // dupe deleted) and the next push (which deletes it on cloud) will re-add the
    // row locally, defeating dedup and causing qty inflation on the next boot.
    const mergeArray = (arr, remoteRows, dirtySet, deletedSet) => {
      if (!remoteRows || !remoteRows.length) return;
      const posMap = new Map(arr.map((item, idx) => [item.id, idx]));
      for (const row of remoteRows) {
        if (!row.data) continue;
        if (deletedSet && deletedSet.has(row.id)) continue;
        const idx = posMap.has(row.id) ? posMap.get(row.id) : -1;
        if (idx !== -1) {
          // Never overwrite an item the user is actively editing
          if (dirtySet && dirtySet.has(row.id)) continue;
          const localTs = arr[idx]._localUpdatedAt || 0;
          const remoteTs = row.updated_at ? new Date(row.updated_at).getTime() : 0;
          if (remoteTs >= localTs) {
            arr[idx] = row.data;
          }
        } else {
          arr.push(row.data);
        }
      }
    };
    const dirtySets = getDirtyIdSets();
    const deletedSets = getDeletedIdSets();
    mergeArray(inv, remoteInv, dirtySets.inv, deletedSets.inv);
    mergeArray(sales, remoteSales, dirtySets.sales, deletedSets.sales);
    mergeArray(expenses, remoteExp, dirtySets.expenses, deletedSets.expenses);
  } else {
    // ── FULL PULL: replace all local data, preserving any dirty local items ──
    const dirty = getDirtyItems();
    const dirtyInvMap = new Map(dirty.inv.map(i => [i.id, i]));
    const dirtySalesMap = new Map(dirty.sales.map(s => [s.id, s]));
    const dirtyExpMap = new Map(dirty.expenses.map(e => [e.id, e]));
    // Don't resurrect rows queued for deletion — same reasoning as delta pull above.
    const deletedSets = getDeletedIdSets();

    if (remoteInv) {
      inv.length = 0;
      inv.push(...remoteInv.map(r => r.data).filter(d => d && !deletedSets.inv.has(d.id)));
      for (const [id, item] of dirtyInvMap) {
        const idx = inv.findIndex(i => i.id === id);
        if (idx !== -1) inv[idx] = item;
        else inv.push(item);
      }
    }
    if (remoteSales) {
      sales.length = 0;
      sales.push(...remoteSales.map(r => r.data).filter(d => d && !deletedSets.sales.has(d.id)));
      for (const [id, sale] of dirtySalesMap) {
        const idx = sales.findIndex(s => s.id === id);
        if (idx !== -1) sales[idx] = sale;
        else sales.push(sale);
      }
    }
    if (remoteExp) {
      expenses.length = 0;
      expenses.push(...remoteExp.map(r => r.data).filter(d => d && !deletedSets.expenses.has(d.id)));
      for (const [id, exp] of dirtyExpMap) {
        const idx = expenses.findIndex(e => e.id === id);
        if (idx !== -1) expenses[idx] = exp;
        else expenses.push(exp);
      }
    }
  }

  // Record pull timestamp. On failure, force a full pull next cycle (null
  // means "no lastPull, fetch everything") — better to re-fetch once than
  // to silently skip rows with a stale timestamp.
  try {
    await setMeta('lastSyncPull', new Date().toISOString());
  } catch (e) {
    console.warn('FlipTrack: sync pull timestamp save failed — will retry full pull:', e.message);
  }

  // Persist to IDB + localStorage
  save();
  return true;
}


// ── PULL SUPPLIES FROM CLOUD ───────────────────────────────────────────────
export async function pullSupplies() {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();
  if (!_sb || !_currentUser) return;
  try {
    const acctId = _getActiveAccountId();
    const { data } = await _sb.from('ft_supplies').select('data').eq('account_id', acctId);
    if (data && data.length) {
      supplies.length = 0;
      supplies.push(...data.map(r => r.data).filter(Boolean));
    }
    saveLocalSupplies();
  } catch (e) {
    console.warn('FlipTrack: supplies pull error:', e.message);
  }
}


// ══════════════════════════════════════════════════════════════════════════
// FULL SYNC (PULL → PUSH)
// ══════════════════════════════════════════════════════════════════════════

let _isSyncing = false;
export function resetSyncGuard() { _isSyncing = false; }

export async function syncNow() {
  if (_isSyncing) return;          // Re-entrancy guard
  _isSyncing = true;
  setSyncInProgress(true);         // Signal store to skip auto-sync

  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();
  if (!_sb || !_currentUser) { _isSyncing = false; setSyncInProgress(false); return; }

  // Wait for any in-flight IDB persist before starting sync
  await waitForPersist();

  setSyncStatus('syncing');
  try {
    await pullFromCloud();
    await pushToCloud(); // Delta push — only changed items
    setSyncStatus('connected');
    _recordSync();
    refresh();
    // Re-render dashboard stats so the stats grid reflects fresh cloud data
    if (typeof window.updateDashStats === 'function') window.updateDashStats();
  } catch (e) {
    setSyncStatus('error', e.message);
    toast('Cloud sync error — your data is safe locally', true);
  } finally {
    _isSyncing = false;
    setSyncInProgress(false);
  }
}


// ── AUTO-SYNC (DEBOUNCED DELTA PUSH) ──────────────────────────────────────
let _syncDebounce = null;

export function autoSync() {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();
  if (!_sb || !_currentUser) return;
  if (!navigator.onLine) return;
  if (_isSyncing) return;

  clearTimeout(_syncDebounce);
  _syncDebounce = setTimeout(async () => {
    if (_isSyncing) return;
    // Wait for any in-flight IDB persist before starting sync
    await waitForPersist();
    setSyncStatus('syncing');
    try {
      await pushToCloud(); // Delta push — only dirty items
      setSyncStatus('connected');
      _recordSync();
    } catch (e) {
      setSyncStatus('error', e.message);
    }
  }, 2000);
}

// Register autoSync callback with store.js (breaks circular dependency)
registerAutoSync(autoSync);

/** Clear all sync timers and debounces. Called during logout cleanup. */
export function clearSyncTimers() {
  clearTimeout(_syncDebounce);
  _syncDebounce = null;
  clearTimeout(_rtDebounce);
  _rtDebounce = null;
  stopRealtime();
  if (_visibilityHandler) {
    document.removeEventListener('visibilitychange', _visibilityHandler);
    _visibilityHandler = null;
  }
  _syncListenersInitialized = false;
}


// ── MOBILE SYNC (UI ACTION) ────────────────────────────────────────────
export async function mobileSyncNow() {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();
  if (!_sb || !_currentUser) return;

  setSyncStatus('syncing');
  try {
    await pullFromCloud();
    refresh();
    setSyncStatus('connected');
    if (typeof window.updateDashStats === 'function') window.updateDashStats();
  } catch (e) {
    setSyncStatus('error', e.message);
  }
}


// ══════════════════════════════════════════════════════════════════════════
// REALTIME SUBSCRIPTIONS
// ══════════════════════════════════════════════════════════════════════════

let _realtimeChannel = null;
let _pollTimer = null;
let _rtDebounce = null;

export function startRealtime() {
  stopRealtime();
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();
  if (!_sb || !_currentUser) return;

  const accountId = _getActiveAccountId();
  _realtimeChannel = _sb.channel('ft-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ft_inventory', filter: `account_id=eq.${accountId}` }, _onRealtimeChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ft_sales', filter: `account_id=eq.${accountId}` }, _onRealtimeChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ft_expenses', filter: `account_id=eq.${accountId}` }, _onRealtimeChange)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('FlipTrack: Realtime connected');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('FlipTrack: Realtime failed, falling back to polling');
        startPollFallback();
      }
    });
}

function _onRealtimeChange(payload) {
  clearTimeout(_rtDebounce);
  _rtDebounce = setTimeout(async () => {
    if (_isSyncing) return; // skip — syncNow() will handle it
    try {
      await pullFromCloud();
      refresh();
      setSyncStatus('connected');
      _recordSync();
      if (typeof window.updateDashStats === 'function') window.updateDashStats();
    } catch (e) {
      setSyncStatus('error', e.message);
    }
  }, 500);
}

export function stopRealtime() {
  const _sb = getSupabaseClient();
  if (_realtimeChannel && _sb) {
    _sb.removeChannel(_realtimeChannel);
    _realtimeChannel = null;
  }
  stopPollFallback();
}

function startPollFallback() {
  stopPollFallback();
  _pollTimer = setInterval(pollOnce, 60000);
}

function stopPollFallback() {
  if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
}

export function startPoll() { startRealtime(); }
export function stopPoll() { stopRealtime(); }

export async function pollOnce() {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();
  if (!_sb || !_currentUser) return;
  try {
    const changed = await pullFromCloud();
    if (changed) refresh();
    setSyncStatus('connected');
  } catch (e) {
    setSyncStatus('error', e.message);
  }
}


// ── PAGE VISIBILITY HANDLING ───────────────────────────────────────────────
let _syncListenersInitialized = false;
let _visibilityHandler = null;
export function setupSyncEventListeners() {
  if (_syncListenersInitialized) return;
  _syncListenersInitialized = true;
  _visibilityHandler = () => {
    const _sb = getSupabaseClient();
    const _currentUser = getCurrentUser();
    if (document.hidden) {
      stopRealtime();
    } else {
      if (_sb && _currentUser) {
        pollOnce();
        startRealtime();
      }
    }
  };
  document.addEventListener('visibilitychange', _visibilityHandler);
}


// ── OFFLINE QUEUE AUTO-REPLAY ─────────────────────────────────────────────
export function initOfflineQueue() {
  setupOfflineReplay(
    () => {
      const sb = getSupabaseClient();
      const user = getCurrentUser();
      if (!sb || !user) return null;
      return { sb, accountId: _getActiveAccountId() };
    },
    (result) => {
      if (result.ok > 0) {
        setSyncStatus('connected');
        toast(`Synced ${result.ok} offline change${result.ok > 1 ? 's' : ''} ✓`);
      }
      if (result.failed > 0) {
        setSyncStatus('error', `${result.failed} sync retries pending`);
      }
      if (result.dropped > 0) {
        console.warn(`FlipTrack: ${result.dropped} queue item(s) permanently dropped after max retries`);
      }
    }
  );
}
