/**
 * push-notifications.js — Push notifications for low stock alerts
 * Uses the Web Notifications API (no server push needed).
 * Checks stock levels periodically and sends browser notifications.
 */

import { inv, supplies } from '../data/store.js';
import { toast } from '../utils/dom.js';

let _notifPermission = 'default';
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
function sendNotification(title, body, tag) {
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
      }).catch(() => {});
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
    sendNotification(
      `${outOfStock.length} item${outOfStock.length > 1 ? 's' : ''} out of stock`,
      outOfStock.slice(0, 3).map(i => i.name).join(', ') + (outOfStock.length > 3 ? ` +${outOfStock.length - 3} more` : ''),
      'ft-oos'
    );
  }

  if (lowStock.length > 0) {
    sendNotification(
      `${lowStock.length} item${lowStock.length > 1 ? 's' : ''} running low`,
      lowStock.slice(0, 3).map(i => `${i.name} (${i.qty} left)`).join(', '),
      'ft-low'
    );
  }

  if (lowSupplies.length > 0) {
    sendNotification(
      `${lowSupplies.length} supply item${lowSupplies.length > 1 ? 's' : ''} running low`,
      lowSupplies.slice(0, 3).map(s => `${s.name} (${s.qty} left)`).join(', '),
      'ft-supplies-low'
    );
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
  };
}
