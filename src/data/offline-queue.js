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
 * The queue is stored in a dedicated IDB object store 'syncQueue'.
 */

// ── QUEUE STORAGE (uses IDB directly for independence from store.js) ────────

const DB_NAME = 'fliptrack';
const STORE_NAME = 'syncQueue';

let _db = null;

function _getDb() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    // Open with a version that includes the syncQueue store
    // We piggyback on the existing DB — if the store doesn't exist yet,
    // we create it via a version upgrade
    const req = indexedDB.open(DB_NAME);
    req.onsuccess = () => {
      const db = req.result;
      if (db.objectStoreNames.contains(STORE_NAME)) {
        _db = db;
        resolve(db);
      } else {
        // Need to upgrade to add the syncQueue store
        const ver = db.version + 1;
        db.close();
        const up = indexedDB.open(DB_NAME, ver);
        up.onupgradeneeded = (e) => {
          const udb = e.target.result;
          if (!udb.objectStoreNames.contains(STORE_NAME)) {
            udb.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          }
        };
        up.onsuccess = () => { _db = up.result; resolve(_db); };
        up.onerror = () => reject(up.error);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

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

    const db = await _getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({
      action,
      table,
      payload,
      ts: Date.now(),
      retries: 0,
    });
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
  } catch (e) {
    console.warn('FlipTrack: offline queue enqueue failed:', e.message);
  }
}

// ── DEQUEUE ALL ─────────────────────────────────────────────────────────────

/**
 * Get all queued mutations in order, then clear the queue.
 * @returns {Promise<Array>} - Array of queue entries
 */
export async function dequeueAll() {
  try {
    const db = await _getDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const items = await new Promise((res, rej) => {
      const req = store.getAll();
      req.onsuccess = () => res(req.result);
      req.onerror = rej;
    });
    // Clear after reading
    if (items.length) {
      const clearTx = db.transaction(STORE_NAME, 'readwrite');
      clearTx.objectStore(STORE_NAME).clear();
      await new Promise((res, rej) => { clearTx.oncomplete = res; clearTx.onerror = rej; });
    }
    return items.sort((a, b) => a.ts - b.ts);
  } catch (e) {
    console.warn('FlipTrack: offline queue dequeue failed:', e.message);
    return [];
  }
}

// ── QUEUE SIZE ──────────────────────────────────────────────────────────────

export async function queueSize() {
  try {
    const db = await _getDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    return new Promise((res, rej) => {
      const req = tx.objectStore(STORE_NAME).count();
      req.onsuccess = () => res(req.result);
      req.onerror = rej;
    });
  } catch {
    return 0;
  }
}

// ── REPLAY QUEUE ON RECONNECT ───────────────────────────────────────────────

/**
 * Replay all queued mutations against Supabase.
 * Call this when connectivity is restored.
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
        // payload is an array of rows
        const rows = Array.isArray(entry.payload) ? entry.payload : [entry.payload];
        const upsertRows = rows.map(r => ({
          ...r,
          account_id: accountId,
          updated_at: new Date(entry.ts).toISOString(),
        }));
        const { error } = await sb.from(entry.table).upsert(upsertRows, { onConflict: 'id' });
        if (error) throw new Error(error.message);
        ok++;
      } else if (entry.action === 'delete') {
        // payload is an array of IDs
        const ids = Array.isArray(entry.payload) ? entry.payload : [entry.payload];
        await sb.from(entry.table).delete().in('id', ids);
        ok++;
      }
    } catch (e) {
      console.warn(`FlipTrack: replay failed for ${entry.table}:`, e.message);
      // Increment retry count and check cap
      const retries = (entry.retries || 0) + 1;
      if (retries >= 5) {
        // Drop the entry after 5 retries
        console.warn(`FlipTrack: Dropping queue entry after ${retries} retries: ${entry.action} on ${entry.table}`);
        dropped++;
      } else {
        // Re-enqueue with incremented retry count
        await enqueue(entry.action, entry.table, entry.payload);
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
 * @param {Function} getClient - Returns { sb, accountId } or null
 * @param {Function} onComplete - Called after replay with { ok, failed }
 */
export function setupOfflineReplay(getClient, onComplete) {
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
