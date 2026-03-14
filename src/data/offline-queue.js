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

const STORE_NAME = 'syncQueue';

// ── ENQUEUE ─────────────────────────────────────────────────────────────────

/**
 * Add a mutation to the offline queue.
 * @param {'upsert'|'delete'} action
 * @param {string} table - Supabase table name (e.g. 'ft_inventory')
 * @param {Object|string[]} payload - Row data for upsert, or array of IDs for delete
 */
export async function enqueue(action, table, payload) {
  try {
    // Check queue size cap (1000 items)
    const size = await queueSize();
    if (size >= 1000) {
      console.warn('FlipTrack: offline queue is full (1000 items), skipping enqueue');
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
        const rows = Array.isArray(entry.payload) ? entry.payload : [entry.payload];
        const upsertRows = rows.map(r => ({
          ...r,
          account_id: accountId,
          updated_at: new Date().toISOString(),
        }));
        const { error } = await sb.from(entry.table).upsert(upsertRows, { onConflict: 'id' });
        if (error) throw new Error(error.message);
      } else if (entry.action === 'delete') {
        const ids = Array.isArray(entry.payload) ? entry.payload : [entry.payload];
        await sb.from(entry.table).delete().in('id', ids);
      }
      // Success — remove from queue
      await _removeEntry(entry.id);
      ok++;
    } catch (e) {
      console.warn(`FlipTrack: replay failed for ${entry.table}:`, e.message);
      const retries = (entry.retries || 0) + 1;
      if (retries >= 5) {
        console.warn(`FlipTrack: Dropping queue entry after ${retries} retries: ${entry.action} on ${entry.table}`);
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
