/**
 * sync-indicator.js â Multi-device sync status indicator
 * Shows "Last synced: X ago" near the sync dot + pending changes badge
 */

import { getDirtyItems } from '../data/store.js';

const STORAGE_KEY = 'ft_last_sync';

export function recordSync() {
  localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  updateSyncIndicator();
}

export function updateSyncIndicator() {
  const el = document.getElementById('syncTimestamp');
  if (!el) return;

  const last = localStorage.getItem(STORAGE_KEY);
  if (!last) {
    el.textContent = '';
    updatePendingBadge();
    return;
  }

  const ms = Date.now() - new Date(last).getTime();
  const m = Math.floor(ms / 60000);
  let label;
  if (m < 1) label = 'just now';
  else if (m < 60) label = m + 'm ago';
  else {
    const h = Math.floor(m / 60);
    if (h < 24) label = h + 'h ago';
    else label = Math.floor(h / 24) + 'd ago';
  }
  el.textContent = 'Synced ' + label;
  updatePendingBadge();
}

/** Show number of pending (unsynced) changes */
function updatePendingBadge() {
  const badge = document.getElementById('syncPendingBadge');
  if (!badge) return;
  try {
    const dirty = getDirtyItems();
    const count = dirty.inv.length + dirty.sales.length + dirty.expenses.length
      + dirty.deleted.ft_inventory.length + dirty.deleted.ft_sales.length + dirty.deleted.ft_expenses.length;
    if (count > 0) {
      badge.textContent = count + ' pending';
      badge.style.display = 'inline';
    } else {
      badge.style.display = 'none';
    }
  } catch {
    badge.style.display = 'none';
  }
}

/** Show offline indicator when disconnected */
function updateOfflineIndicator() {
  const el = document.getElementById('offlineIndicator');
  if (!el) return;
  el.style.display = navigator.onLine ? 'none' : 'inline';
}

/** Update the indicator every 30 seconds */
export function startSyncIndicator() {
  updateSyncIndicator();
  updateOfflineIndicator();
  setInterval(updateSyncIndicator, 30000);
  window.addEventListener('online', () => { updateOfflineIndicator(); updateSyncIndicator(); });
  window.addEventListener('offline', updateOfflineIndicator);
}

