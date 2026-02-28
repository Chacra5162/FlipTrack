/**
 * notification-center.js — In-app notification bell & dropdown
 * Tracks: low stock alerts, sync events, price changes, stale inventory
 */

import { inv, sales } from '../data/store.js';
import { fmt, escHtml } from '../utils/format.js';
import { toast } from '../utils/dom.js';

const MAX_NOTIFICATIONS = 50;
const STORAGE_KEY = 'ft_notifications';

let _notifications = [];
let _unreadCount = 0;
let _isOpen = false;

function load() {
  try {
    _notifications = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').slice(0, MAX_NOTIFICATIONS);
    _unreadCount = _notifications.filter(n => !n.read).length;
  } catch { _notifications = []; _unreadCount = 0; }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_notifications.slice(0, MAX_NOTIFICATIONS)));
}

export function addNotification(type, title, message, actionId) {
  _notifications.unshift({
    id: Date.now().toString(36),
    type, // 'stock' | 'sync' | 'price' | 'sale' | 'info'
    title,
    message,
    actionId: actionId || null,
    time: new Date().toISOString(),
    read: false,
  });
  _notifications = _notifications.slice(0, MAX_NOTIFICATIONS);
  _unreadCount = _notifications.filter(n => !n.read).length;
  persist();
  updateBadge();
}

export function markAllRead() {
  _notifications.forEach(n => n.read = true);
  _unreadCount = 0;
  persist();
  updateBadge();
  renderDropdown();
}

export function clearNotifications() {
  _notifications = [];
  _unreadCount = 0;
  persist();
  updateBadge();
  renderDropdown();
}

function updateBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  if (_unreadCount > 0) {
    badge.textContent = _unreadCount > 9 ? '9+' : _unreadCount;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  return d + 'd ago';
}

function iconFor(type) {
  switch (type) {
    case 'stock': return '📦';
    case 'sync': return '🔄';
    case 'price': return '💲';
    case 'sale': return '🎉';
    case 'info': return 'ℹ️';
    default: return '🔔';
  }
}

function renderDropdown() {
  const list = document.getElementById('notifList');
  if (!list) return;

  if (!_notifications.length) {
    list.innerHTML = '<div class="notif-empty">No notifications yet</div>';
    return;
  }

  list.innerHTML = _notifications.slice(0, 20).map(n => `
    <div class="notif-item${n.read ? '' : ' unread'}" data-nid="${n.id}"${n.actionId ? ` onclick="openDrawer('${n.actionId}')"` : ''}>
      <span class="notif-icon">${iconFor(n.type)}</span>
      <div class="notif-body">
        <div class="notif-title">${escHtml(n.title)}</div>
        <div class="notif-msg">${escHtml(n.message)}</div>
      </div>
      <span class="notif-time">${timeAgo(n.time)}</span>
    </div>
  `).join('');
}

export function toggleNotifCenter() {
  _isOpen = !_isOpen;
  const dd = document.getElementById('notifDropdown');
  if (!dd) return;
  if (_isOpen) {
    dd.classList.add('on');
    renderDropdown();
  } else {
    dd.classList.remove('on');
  }
}

export function closeNotifCenter() {
  _isOpen = false;
  const dd = document.getElementById('notifDropdown');
  if (dd) dd.classList.remove('on');
}

/** Generate stock alerts and add as notifications */
export function generateStockAlerts() {
  const now = Date.now();
  const lastCheck = parseInt(localStorage.getItem('ft_notif_stock_check') || '0');
  if (now - lastCheck < 3600000) return; // Once per hour
  localStorage.setItem('ft_notif_stock_check', now.toString());

  const outOfStock = inv.filter(i => i.qty === 0);
  const lowStock = inv.filter(i => i.bulk && i.qty > 0 && i.qty <= (i.lowAlert || 2));
  const stale = inv.filter(i => {
    if ((i.qty || 0) <= 0) return false;
    const days = Math.floor((now - new Date(i.added || now).getTime()) / 86400000);
    return days >= 60 && !sales.some(s => s.itemId === i.id);
  });

  if (outOfStock.length) {
    addNotification('stock', 'Out of Stock', `${outOfStock.length} item${outOfStock.length > 1 ? 's' : ''} need restocking`);
  }
  if (lowStock.length) {
    addNotification('stock', 'Low Stock Warning', `${lowStock.length} item${lowStock.length > 1 ? 's are' : ' is'} running low`);
  }
  if (stale.length) {
    addNotification('price', 'Stale Inventory', `${stale.length} item${stale.length > 1 ? 's' : ''} listed 60+ days with no sales — consider repricing`);
  }
}

export function initNotificationCenter() {
  load();
  updateBadge();
  generateStockAlerts();

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (_isOpen && !e.target.closest('#notifDropdown') && !e.target.closest('#notifBellBtn')) {
      closeNotifCenter();
    }
  });
}
