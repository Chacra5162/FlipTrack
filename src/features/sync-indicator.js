/**
 * sync-indicator.js — Multi-device sync status indicator
 * Shows "Last synced: X ago" near the sync dot
 */

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
}

/** Update the indicator every 30 seconds */
export function startSyncIndicator() {
  updateSyncIndicator();
  setInterval(updateSyncIndicator, 30000);
}
