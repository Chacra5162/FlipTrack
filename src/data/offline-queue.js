/**
 * offline-queue.js - Offline mutation queue with retry on reconnect
 *
 * When the user is offline, mutations (save, delete, etc.) are queued in IndexedDB.
 * When connectivity returns, the queue is replayed in order.
 * This prevents data loss when the user goes offline mid-session.
 *
 * Queue entries look like:
 *   { id, action: 'upsert'|'delete', table: 'ft_inventory', payload, ts }
 *
 * The queue is stored in the 'syncQueue' object store managed by idb.js.
 */

import { getAll, putOne, deleteOne, clearStore, getCount } from './idb.js';
import { toast } from '../utils/dom.js';

const STORE_NAME = 'syncQueue';
const DEAD_LETTER_STORE = 'syncDeadLetter';

// ── ENQUEUE ─────────────────────────────────────────────────────────────────

/**
 * Extract the set of row IDs this entry affects, regardless of shape.
 * Upserts: payload is { id, data } or an array of those.
 * Deletes: payload is an ID string or an array of IDs.
 */
function _rowIds(entry) {
  const ids = new Set();
  const p = entry.payload;
  if (!p) return ids;
  if (entry.action === 'delete') {
    (Array.isArray(p) ? p : [p]).forEach(id => id && ids.add(id));
  } else { // upsert
    (Array.isArray(p) ? p : [p]).forEach(row => row?.id && ids.add(row.id));
  }
  return ids;
}

/**
 * Add a mutation to the offline queue. Earlier queued mutations for the same
 * (table, row-id) are removed first so the queue collapses to the latest
 * intent per row — otherwise 10 offline edits of the same item would queue
 * 10 upserts and replay all 10 on reconnect, wasting bandwidth and moving
 * the server's updated_at forward 10 times.
 *
 * @param {'upsert'|'delete'} action
 * @param {string} table - Supabase table name (e.g. 'ft_inventory')
 * @param {Object|string[]} payload - Row data for upsert, or array of IDs for delete
 */
export async function enqueue(action, table, payload) {
  try {
    // Remove any existing queue entries that target the same (table, row-id).
    // For upserts: the new payload has the latest state, older ones are stale.
    // For deletes: deletion is final; any prior upsert for the same row is
    //              superseded, and a duplicate delete is redundant.
    const newIds = new Set();
    if (action === 'delete') {
      (Array.isArray(payload) ? payload : [payload]).forEach(id => id && newIds.add(id));
    } else {
      (Array.isArray(payload) ? payload : [payload]).forEach(row => row?.id && newIds.add(row.id));
    }
    if (newIds.size) {
      const existing = await dequeueAll();
      for (const e of existing) {
        if (e.table !== table) continue;
        const ids = _rowIds(e);
        // Remove if the existing entry's row-set is a subset of the new one.
        // (Mixed batches with only partial overlap are left alone to preserve
        //  rows that aren't superseded — rare in practice since the sync
        //  layer batches by table, but correct.)
        let subset = true;
        for (const id of ids) { if (!newIds.has(id)) { subset = false; break; } }
        if (subset && ids.size > 0) {
          try { await deleteOne(STORE_NAME, e.id); } catch (_) {}
        }
      }
    }

    // Check queue size cap (1000 items)
    const size = await queueSize();
    if (size >= 1000) {
      console.warn('FlipTrack: offline queue is full (1000 items), skipping enqueue');
      toast('Offline queue full — connect to sync your changes', true);
      return;
    }

    await putOne(STORE_NAME, {
      action,
      table,
      payload,
      ts: Date.now(),
      retries: 0,
    });
  } catch (e) {
    console.warn('FlipTrack: offline queue enqueue failed:', e.message);
  }
}

// ── DEQUEUE ALL ─────────────────────────────────────────────────────────────

/**
 * Get all queued mutations sorted by timestamp.
 * Does NOT clear the queue — callers must remove entries individually via _removeEntry.
 * @returns {Promise<Array>} - Array of queue entries
 */
export async function dequeueAll() {
  try {
    const items = await getAll(STORE_NAME);
    return items.sort((a, b) => a.ts - b.ts);
  } catch (e) {
    console.warn('FlipTrack: offline queue dequeue failed:', e.message);
    return [];
  }
}

/** Remove a single entry from the queue after successful replay */
async function _removeEntry(id) {
  try { await deleteOne(STORE_NAME, id); } catch (_) {}
}

// ── QUEUE SIZE ──────────────────────────────────────────────────────────────

export async function queueSize() {
  try {
    return await getCount(STORE_NAME);
  } catch {
    return 0;
  }
}

// ── REPLAY QUEUE ON RECONNECT ───────────────────────────────────────────────

/**
 * Replay all queued mutations against Supabase.
 * Call this when connectivity is restored.
 * NOTE: Uses last-write-wins semantics. If another device modified the same
 * item while this device was offline, queued mutations will overwrite those changes.
 * @param {Object} sb - Supabase client
 * @param {string} accountId - Current user's account ID
 * @returns {Promise<{ok:number, failed:number, dropped:number}>}
 */
export async function replayQueue(sb, accountId) {
  const items = await dequeueAll();
  if (!items.length) return { ok: 0, failed: 0, dropped: 0 };

  let ok = 0, failed = 0, dropped = 0;

  for (const entry of items) {
    try {
      if (entry.action === 'upsert') {
        const allowedTables = ['ft_inventory', 'ft_sales', 'ft_expenses', 'ft_supplies'];
        if (!allowedTables.includes(entry.table)) throw new Error(`Invalid table: ${entry.table}`);
        const rows = Array.isArray(entry.payload) ? entry.payload : [entry.payload];
        const upsertRows = rows.map(r => ({
          ...r,
          account_id: accountId,
          updated_at: new Date().toISOString(),
        }));
        const { error } = await sb.from(entry.table).upsert(upsertRows, { onConflict: 'id' });
        if (error) throw new Error(error.message);
      } else if (entry.action === 'delete') {
        const allowedTables = ['ft_inventory', 'ft_sales', 'ft_expenses'];
        if (!allowedTables.includes(entry.table)) throw new Error(`Invalid table: ${entry.table}`);
        const ids = Array.isArray(entry.payload) ? entry.payload : [entry.payload];
        await sb.from(entry.table).delete().eq('account_id', accountId).in('id', ids);
      }
      // Success — remove from queue
      await _removeEntry(entry.id);
      ok++;
    } catch (e) {
      console.warn(`FlipTrack: replay failed for ${entry.table}:`, e.message);
      const retries = (entry.retries || 0) + 1;
      if (retries >= 5) {
        console.warn(`FlipTrack: Dropping queue entry after ${retries} retries: ${entry.action} on ${entry.table}`);
        // Move to dead-letter store so the mutation is recoverable.
        // Previously these were silently dropped — if a critical upsert
        // failed 5 times, the change was lost forever with no diagnostics.
        try {
          await putOne(DEAD_LETTER_STORE, {
            originalId: entry.id,
            action: entry.action,
            table: entry.table,
            payload: entry.payload,
            ts: entry.ts,
            failedAt: Date.now(),
            lastError: e.message || String(e),
            retries,
          });
        } catch (deadErr) {
          console.warn('FlipTrack: dead-letter write failed:', deadErr.message);
        }
        await _removeEntry(entry.id);
        dropped++;
      } else {
        // Update retry count in-place
        try {
          await _removeEntry(entry.id);
          await putOne(STORE_NAME, {
            action: entry.action,
            table: entry.table,
            payload: entry.payload,
            ts: entry.ts,
            retries,
          });
        } catch (reqErr) {
          console.warn('FlipTrack: retry update failed:', reqErr.message);
        }
        failed++;
      }
    }
  }

  console.log(`FlipTrack: Replayed offline queue — ${ok} ok, ${failed} failed, ${dropped} dropped`);
  return { ok, failed, dropped };
}

// ── AUTO-REPLAY ON RECONNECT ────────────────────────────────────────────────

let _replayInProgress = false;

/**
 * Set up event listeners to auto-replay queue when coming back online.
 * Guarded against double-init — safe to call multiple times.
 * @param {Function} getClient - Returns { sb, accountId } or null
 * @param {Function} onComplete - Called after replay with { ok, failed }
 */
let _offlineReplayInitialized = false;
/** Reset replay state on sign-out so new session gets fresh closure */
export function resetOfflineReplay() { _offlineReplayInitialized = false; }
export function setupOfflineReplay(getClient, onComplete) {
  if (_offlineReplayInitialized) return;
  _offlineReplayInitialized = true;

  const tryReplay = async () => {
    if (_replayInProgress) return;
    const size = await queueSize();
    if (!size) return;

    const ctx = getClient();
    if (!ctx || !ctx.sb || !ctx.accountId) return;

    _replayInProgress = true;
    try {
      const result = await replayQueue(ctx.sb, ctx.accountId);
      if (onComplete) onComplete(result);
    } finally {
      _replayInProgress = false;
    }
  };

  window.addEventListener('online', () => {
    // Small delay to let network stabilize
    setTimeout(tryReplay, 2000);
  });

  // Also try on visibility change (returning to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.onLine) {
      setTimeout(tryReplay, 1000);
    }
  });
}

// ── DEAD-LETTER DIAGNOSTICS ─────────────────────────────────────────────────

/** List all queue entries that exceeded their retry budget. Safe for UI
 *  display — each entry has { action, table, payload, failedAt, lastError }.
 *  Use to surface "N mutations failed to sync — review" in diagnostics. */
export async function getDeadLetters() {
  try { return await getAll(DEAD_LETTER_STORE); }
  catch (e) { console.warn('FlipTrack: dead-letter read failed:', e.message); return []; }
}

/** Move dead-letter entries back into the active queue for another attempt.
 *  Use sparingly — repeat failures likely indicate a structural problem
 *  (malformed payload, schema mismatch, revoked permission). */
export async function retryDeadLetters() {
  const items = await getDeadLetters();
  let requeued = 0;
  for (const it of items) {
    try {
      await putOne(STORE_NAME, {
        action: it.action,
        table: it.table,
        payload: it.payload,
        ts: Date.now(),
        retries: 0,
      });
      await deleteOne(DEAD_LETTER_STORE, it.id);
      requeued++;
    } catch (e) {
      console.warn('FlipTrack: dead-letter requeue failed for', it.id, e.message);
    }
  }
  return requeued;
}

/** Permanently discard all dead-letter entries. Called by logout cleanup
 *  and available as a manual action for when the user knows the data is
 *  no longer relevant. */
export async function clearDeadLetters() {
  try { await clearStore(DEAD_LETTER_STORE); }
  catch (e) { console.warn('FlipTrack: dead-letter clear failed:', e.message); }
}
