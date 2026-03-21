/**
 * push-notifications.js — Push notifications for low stock alerts
 * Uses the Web Notifications API + optional VAPID Web Push for background delivery.
 * Checks stock levels periodically and sends browser notifications.
 * When VAPID is configured, also sends push via Edge Function for offline delivery.
 */

import { inv, supplies } from '../data/store.js';
import { toast } from '../utils/dom.js';
import { VAPID_PUBLIC_KEY } from '../config/push.js';
import { SB_URL, SB_KEY } from '../config/constants.js';

let _notifPermission = 'default';
let _pushSubscription = null;
let _checkInterval = null;
const CHECK_INTERVAL = 300000; // 5 minutes

/**
 * Request notification permission from the user
 */
export async function requestNotifPermission() {
  if (!('Notification' in window)) {
    toast('Notifications not supported in this browser', true);
    return false;
  }

  const result = await Notification.requestPermission();
  _notifPermission = result;
  localStorage.setItem('ft_notif_perm', result);

  if (result === 'granted') {
    toast('Notifications enabled');
    return true;
  } else {
    toast('Notification permission denied', true);
    return false;
  }
}

/**
 * Send a browser notification
 */
export function sendNotification(title, body, tag) {
  if (_notifPermission !== 'granted') return;
  try {
    const notif = new Notification(title, {
      body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag, // prevents duplicate notifications
      silent: false,
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (e) {
    // SW notifications fallback
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, { body, tag });
      }).catch(e => console.warn('FlipTrack: SW notification failed:', e.message));
    }
  }
}

/**
 * Check for low stock items and send notifications
 */
export function checkStockAlerts() {
  if (_notifPermission !== 'granted') return;

  const lastCheck = localStorage.getItem('ft_notif_lastcheck') || '0';
  const now = Date.now();

  // Don't re-notify within 1 hour
  if (now - parseInt(lastCheck) < 3600000) return;

  const outOfStock = inv.filter(i => (i.qty || 0) === 0 && i.bulk);
  const lowStock = inv.filter(i => i.bulk && (i.qty || 0) > 0 && (i.qty || 0) <= (i.lowAlert || 2));

  // Check supplies too
  const lowSupplies = supplies.filter(s => (s.qty || 0) > 0 && (s.qty || 0) <= (s.lowAlert || 5));

  if (outOfStock.length > 0) {
    const title = `${outOfStock.length} item${outOfStock.length > 1 ? 's' : ''} out of stock`;
    const body = outOfStock.slice(0, 3).map(i => i.name).join(', ') + (outOfStock.length > 3 ? ` +${outOfStock.length - 3} more` : '');
    sendNotification(title, body, 'ft-oos');
    if (_pushSubscription) sendPushViaEdge(title, body, { type: 'oos' });
  }

  if (lowStock.length > 0) {
    const title = `${lowStock.length} item${lowStock.length > 1 ? 's' : ''} running low`;
    const body = lowStock.slice(0, 3).map(i => `${i.name} (${i.qty} left)`).join(', ');
    sendNotification(title, body, 'ft-low');
    if (_pushSubscription) sendPushViaEdge(title, body, { type: 'low-stock' });
  }

  if (lowSupplies.length > 0) {
    const title = `${lowSupplies.length} supply item${lowSupplies.length > 1 ? 's' : ''} running low`;
    const body = lowSupplies.slice(0, 3).map(s => `${s.name} (${s.qty} left)`).join(', ');
    sendNotification(title, body, 'ft-supplies-low');
    if (_pushSubscription) sendPushViaEdge(title, body, { type: 'supplies-low' });
  }

  localStorage.setItem('ft_notif_lastcheck', String(now));
}

/**
 * Start periodic stock alert checking
 */
export function startStockAlertChecks() {
  // Restore permission state
  _notifPermission = localStorage.getItem('ft_notif_perm') || Notification?.permission || 'default';

  if (_notifPermission !== 'granted') return;

  // Restore VAPID push subscription if previously enabled
  restorePushSubscription();

  // Check once on load (after a delay)
  setTimeout(checkStockAlerts, 10000);

  // Then check periodically
  _checkInterval = setInterval(checkStockAlerts, CHECK_INTERVAL);
}

/**
 * Stop periodic checking
 */
export function stopStockAlertChecks() {
  if (_checkInterval) {
    clearInterval(_checkInterval);
    _checkInterval = null;
  }
}

/**
 * Toggle notifications on/off
 */
export async function toggleNotifications() {
  if (_notifPermission === 'granted') {
    // Disable
    _notifPermission = 'denied';
    localStorage.setItem('ft_notif_perm', 'denied');
    stopStockAlertChecks();
    toast('Stock notifications disabled');
    return false;
  } else {
    // Enable
    const granted = await requestNotifPermission();
    if (granted) startStockAlertChecks();
    return granted;
  }
}

/**
 * Get current notification status
 */
export function getNotifStatus() {
  return {
    supported: 'Notification' in window,
    permission: _notifPermission,
    enabled: _notifPermission === 'granted',
    pushSubscribed: !!_pushSubscription,
  };
}

// ── VAPID WEB PUSH ────────────────────────────────────────────────────────────

/** Convert URL-safe base64 to Uint8Array for applicationServerKey */
function _urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/**
 * Subscribe to VAPID Web Push (background notifications even when tab is closed).
 * Saves subscription to Supabase push_subscriptions table.
 */
export async function subscribeToPush() {
  if (!VAPID_PUBLIC_KEY) {
    toast('Push not configured — set VAPID key in Settings', true);
    return false;
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    toast('Push notifications not supported', true);
    return false;
  }

  try {
    // Request notification permission first
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      toast('Notification permission required for push', true);
      return false;
    }
    _notifPermission = 'granted';
    localStorage.setItem('ft_notif_perm', 'granted');

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: _urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    _pushSubscription = sub;
    localStorage.setItem('ft_push_enabled', '1');

    // Save subscription to Supabase
    await _savePushSubscription(sub);
    toast('Background push notifications enabled');
    return true;
  } catch (e) {
    console.warn('FlipTrack: Push subscription failed:', e.message);
    toast('Push subscription failed: ' + e.message, true);
    return false;
  }
}

/**
 * Unsubscribe from VAPID Web Push
 */
export async function unsubscribeFromPush() {
  if (_pushSubscription) {
    try {
      await _pushSubscription.unsubscribe();
    } catch (e) {
      console.warn('FlipTrack: Push unsubscribe error:', e.message);
    }
  }
  _pushSubscription = null;
  localStorage.removeItem('ft_push_enabled');
  toast('Background push disabled');
}

/**
 * Toggle VAPID push on/off
 */
export async function togglePush() {
  if (_pushSubscription || localStorage.getItem('ft_push_enabled') === '1') {
    await unsubscribeFromPush();
    return false;
  } else {
    return await subscribeToPush();
  }
}

/**
 * Restore push subscription state on load
 */
export async function restorePushSubscription() {
  if (localStorage.getItem('ft_push_enabled') !== '1') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    _pushSubscription = await reg.pushManager.getSubscription();
  } catch (e) {
    console.warn('FlipTrack: Could not restore push subscription:', e.message);
  }
}

/**
 * Save push subscription to Supabase
 */
async function _savePushSubscription(sub) {
  if (!SB_URL || !SB_KEY) return;
  const json = sub.toJSON();
  const userId = window.getActiveAccountId?.() || 'anon';

  try {
    await fetch(`${SB_URL}/rest/v1/push_subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh || '',
        auth: json.keys?.auth || '',
      }),
    });
  } catch (e) {
    console.warn('FlipTrack: Failed to save push subscription:', e.message);
  }
}

/**
 * Send a push notification via Edge Function (for background delivery)
 */
export async function sendPushViaEdge(title, body, data) {
  if (!SB_URL || !SB_KEY) return;
  const userId = window.getActiveAccountId?.() || 'anon';

  try {
    await fetch(`${SB_URL}/functions/v1/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SB_KEY}`,
      },
      body: JSON.stringify({ userId, title, body, data }),
    });
  } catch (e) {
    console.warn('FlipTrack: Edge push failed:', e.message);
  }
}
