/**
 * sync.js - Cloud synchronization and real-time subscriptions
 * Handles push/pull to Supabase with DELTA SYNC (only changed rows).
 * Uses dirty tracking from store.js to minimize data transfer.
 */

import { SB_URL, SB_KEY } from '../config/constants.js';
import {
  inv, sales, expenses, supplies,
  save, refresh, saveLocalSupplies,
  getDirtyItems, clearDirtyTracking, markDirty, waitForPersist
} from './store.js';
import { getCurrentUser, getSupabaseClient } from './auth.js';
import { isStorageUrl, migrateImagesToStorage } from './storage.js';
import { setMeta, getMeta } from './idb.js';
import { enqueue, setupOfflineReplay } from './offline-queue.js';
import { toast } from '../utils/dom.js';
import { recordSync } from '../features/sync-indicator.js';

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
    syncing:      { cls: 'syncing',   txt: 'Syncing…' },
    error:        { cls: 'error',     txt: msg || 'Sync error' },
  };
  const s = map[state] || map.disconnected;
  if (s.cls) dot.classList.add(s.cls);
  lbl.textContent = s.txt;
}


// ══════════════════════════════════════════════════════════════════════════
// DELTA PUSH — only send rows that changed since last push
// ══════════════════════════════════════════════════════════════════════════

export async function pushToCloud() {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();
  if (!_sb || !_currentUser) return;

  // Wait for any in-flight IDB persist before reading dirty data
  await waitForPersist();

  // If offline, queue mutations for later replay
  if (!navigator.onLine) {
    await _queueDirtyItems();
    clearDirtyTracking();
    return;
  }

  const accountId = _currentUser.id;
  const dirty = getDirtyItems();

  try {
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
    }

    // ── Push changed sales rows ──
    if (dirty.sales.length) {
      const rows = dirty.sales.map(s => ({
        id: s.id, account_id: accountId, data: s, updated_at: new Date().toISOString()
      }));
      const { error } = await _sb.from('ft_sales').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(error.message);
    }

    // ── Push changed expense rows ──
    if (dirty.expenses.length) {
      const rows = dirty.expenses.map(e => ({
        id: e.id, account_id: accountId, data: e, updated_at: new Date().toISOString()
      }));
      try {
        const { error } = await _sb.from('ft_expenses').upsert(rows, { onConflict: 'id' });
        if (error) console.warn('FlipTrack: expenses push error:', error.message);
      } catch (e) {
        console.warn('FlipTrack: ft_expenses not available:', e.message);
      }
    }

    // ── Push deletes ──
    for (const [table, ids] of Object.entries(dirty.deleted)) {
      if (ids.length) {
        try {
          await _sb.from(table).delete().in('id', ids);
        } catch (e) {
          console.warn(`FlipTrack: delete from ${table} failed:`, e.message);
        }
      }
    }

    // ── Record last sync timestamp ──
    await setMeta('lastSyncPush', new Date().toISOString()).catch(() => {});
    clearDirtyTracking();
  } catch (e) {
    // Network error during push — queue everything for retry
    console.warn('FlipTrack: push failed, queueing for retry:', e.message);
    await _queueDirtyItems();
    clearDirtyTracking();
    throw e;
  }
}

/** Queue current dirty items to the offline mutation queue */
async function _queueDirtyItems() {
  const dirty = getDirtyItems();
  if (dirty.inv.length) {
    const rows = dirty.inv.map(i => ({ id: i.id, data: { ...i } }));
    await enqueue('upsert', 'ft_inventory', rows);
  }
  if (dirty.sales.length) {
    const rows = dirty.sales.map(s => ({ id: s.id, data: s }));
    await enqueue('upsert', 'ft_sales', rows);
  }
  if (dirty.expenses.length) {
    const rows = dirty.expenses.map(e => ({ id: e.id, data: e }));
    await enqueue('upsert', 'ft_expenses', rows);
  }
  for (const [table, ids] of Object.entries(dirty.deleted)) {
    if (ids.length) await enqueue('delete', table, ids);
  }
}


// ── PUSH ALL (full push for initial sync / manual sync) ──────────────────
export async function pushAllToCloud() {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();
  if (!_sb || !_currentUser) return;

  const accountId = _currentUser.id;

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
  try {
    await _sb.from(table).delete().in('id', ids);
  } catch (e) {
    console.warn(`FlipTrack: delete from ${table} failed:`, e.message);
  }
}


// ══════════════════════════════════════════════════════════════════════════
// DELTA PULL — only fetch rows newer than last pull timestamp
// ══════════════════════════════════════════════════════════════════════════

export async function pullFromCloud() {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();
  if (!_sb || !_currentUser) return false;

  const accountId = _currentUser.id;
  const lastPull = await getMeta('lastSyncPull').catch(() => null);

  let query_inv = _sb.from('ft_inventory').select('id, data, updated_at').eq('account_id', accountId);
  let query_sales = _sb.from('ft_sales').select('id, data, updated_at').eq('account_id', accountId);

  // Delta pull: only fetch rows updated after last pull
  if (lastPull) {
    query_inv = query_inv.gt('updated_at', lastPull);
    query_sales = query_sales.gt('updated_at', lastPull);
  }

  const [{ data: remoteInv, error: e1 }, { data: remoteSales, error: e2 }] = await Promise.all([
    query_inv,
    query_sales,
  ]);
  if (e1 || e2) throw new Error((e1 || e2).message);

  // Expenses (may not exist)
  let remoteExp = null;
  try {
    let q = _sb.from('ft_expenses').select('id, data, updated_at').eq('account_id', accountId);
    if (lastPull) q = q.gt('updated_at', lastPull);
    const { data, error } = await q;
    if (!error) remoteExp = data;
  } catch (_) {}

  if (lastPull) {
    // ── DELTA MERGE with conflict resolution: compare updated_at timestamps ──
    const mergeArray = (arr, remoteRows) => {
      if (!remoteRows || !remoteRows.length) return;
      for (const row of remoteRows) {
        if (!row.data) continue;
        const idx = arr.findIndex(i => i.id === row.id);
        if (idx !== -1) {
          // Conflict resolution: remote wins if it's newer (server updated_at vs local _localUpdatedAt)
          const localTs = arr[idx]._localUpdatedAt || 0;
          const remoteTs = row.updated_at ? new Date(row.updated_at).getTime() : Date.now();
          if (remoteTs >= localTs) {
            arr[idx] = row.data;
          }
          // else: local is newer, skip remote update (local will push on next sync)
        } else {
          arr.push(row.data);
        }
      }
    };
    mergeArray(inv, remoteInv);
    mergeArray(sales, remoteSales);
    mergeArray(expenses, remoteExp);
  } else {
    // ── FULL PULL: replace all local data ──
    if (remoteInv) { inv.length = 0; inv.push(...remoteInv.map(r => r.data).filter(Boolean)); }
    if (remoteSales) { sales.length = 0; sales.push(...remoteSales.map(r => r.data).filter(Boolean)); }
    if (remoteExp) { expenses.length = 0; expenses.push(...remoteExp.map(r => r.data).filter(Boolean)); }
  }

  // Record pull timestamp
  await setMeta('lastSyncPull', new Date().toISOString()).catch(() => {});

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
    const acctId = _currentUser.id;
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

export async function syncNow() {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();
  if (!_sb || !_currentUser) return;

  // Wait for any in-flight IDB persist before starting sync
  await waitForPersist();

  setSyncStatus('syncing');
  try {
    await pullFromCloud();
    await pushAllToCloud(); // Full push on manual sync
    setSyncStatus('connected');
    recordSync();
    refresh();
  } catch (e) {
    setSyncStatus('error', e.message);
  }
}


// ── AUTO-SYNC (DEBOUNCED DELTA PUSH) ──────────────────────────────────────
let _syncDebounce = null;

export function autoSync() {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();
  if (!_sb || !_currentUser) return;
  if (!navigator.onLine) return;

  clearTimeout(_syncDebounce);
  _syncDebounce = setTimeout(async () => {
    // Wait for any in-flight IDB persist before starting sync
    await waitForPersist();
    setSyncStatus('syncing');
    try {
      await pushToCloud(); // Delta push — only dirty items
      setSyncStatus('connected');
      recordSync();
    } catch (e) {
      setSyncStatus('error', e.message);
    }
  }, 2000);
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

  const accountId = _currentUser.id;
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
    try {
      await pullFromCloud();
      refresh();
      setSyncStatus('connected');
      recordSync();
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
export function setupSyncEventListeners() {
  document.addEventListener('visibilitychange', () => {
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
  });
}


// ── OFFLINE QUEUE AUTO-REPLAY ─────────────────────────────────────────────
export function initOfflineQueue() {
  setupOfflineReplay(
    () => {
      const sb = getSupabaseClient();
      const user = getCurrentUser();
      if (!sb || !user) return null;
      return { sb, accountId: user.id };
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
