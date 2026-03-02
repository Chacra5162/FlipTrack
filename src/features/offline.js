// ── OFFLINE MODE ──────────────────────────────────────────────────────────────

import { toast } from '../utils/dom.js';
import { syncNow } from '../data/sync.js';

let _pendingSync = false;
let _currentUser = null; // This will be set by auth module

function updateOnlineStatus() {
  const banner = document.getElementById('offlineBanner');
  if (!banner) return;
  if (navigator.onLine) {
    banner.style.display = 'none';
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('role', 'status');
    banner.textContent = '';
    document.body.style.paddingTop = '';
    if (_pendingSync && _currentUser) {
      _pendingSync = false;
      toast('Back online — syncing…');
      syncNow().catch(() => {});
    }
  } else {
    banner.style.display = '';
    banner.setAttribute('aria-live', 'assertive');
    banner.setAttribute('role', 'alert');
    banner.textContent = 'You are offline - data will sync when you reconnect';
    document.body.style.paddingTop = '28px';
    _pendingSync = true;
  }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
// Check initial state
if (!navigator.onLine) updateOnlineStatus();

export { _pendingSync, updateOnlineStatus };
