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

  // ── SMART NOTIFICATION: Repricing suggestions ─────────────────────────
  const reprice30 = inv.filter(i => {
    if ((i.qty || 0) <= 0) return false;
    const days = Math.floor((now - new Date(i.added || now).getTime()) / 86400000);
    return days >= 30 && days < 60 && !sales.some(s => s.itemId === i.id);
  });
  if (reprice30.length) {
    addNotification('price', 'Reprice Suggestion',
      `${reprice30.length} item${reprice30.length > 1 ? 's' : ''} listed 30+ days without a sale — lower price by 10-15%?`);
  }

  // ── SMART NOTIFICATION: Expiring listings (eBay 30-day GTC) ───────────
  const expiring = inv.filter(i => {
    if ((i.qty || 0) <= 0) return false;
    const pld = i.platformListingDates;
    if (!pld) return false;
    return Object.entries(pld).some(([plat, dateStr]) => {
      const listed = new Date(dateStr).getTime();
      const daysSinceListed = Math.floor((now - listed) / 86400000);
      return daysSinceListed >= 27 && daysSinceListed <= 30; // Expiring in 0-3 days
    });
  });
  if (expiring.length) {
    addNotification('info', 'Listings Expiring Soon',
      `${expiring.length} listing${expiring.length > 1 ? 's' : ''} expiring in the next 3 days — relist or renew`);
  }

  // ── SMART NOTIFICATION: High-margin items sitting unlisted ────────────
  const unlistedHighMargin = inv.filter(i => {
    if ((i.qty || 0) <= 0) return false;
    const plats = i.platforms || [];
    if (plats.length > 0 && !plats.every(p => p === 'Unlisted')) return false;
    const { m } = { m: i.price ? (i.price - (i.cost || 0)) / i.price : 0 };
    return m >= 0.5 && (i.price || 0) >= 20;
  });
  if (unlistedHighMargin.length) {
    addNotification('info', 'Unlisted High-Margin Items',
      `${unlistedHighMargin.length} item${unlistedHighMargin.length > 1 ? 's have' : ' has'} 50%+ margin but ${unlistedHighMargin.length > 1 ? 'aren\'t' : 'isn\'t'} listed on any platform`);
  }
}

/** Calculate sales velocity by category — returns sorted array */
export function getSalesVelocity() {
  const catMap = {};
  // Build category stats
  for (const item of inv) {
    const cat = item.category || 'Uncategorized';
    if (!catMap[cat]) catMap[cat] = { cat, items: 0, sold: 0, totalDays: 0, revenue: 0, profit: 0 };
    catMap[cat].items++;
  }
  for (const sale of sales) {
    const item = inv.find(i => i.id === sale.itemId);
    const cat = item?.category || 'Uncategorized';
    if (!catMap[cat]) catMap[cat] = { cat, items: 0, sold: 0, totalDays: 0, revenue: 0, profit: 0 };
    catMap[cat].sold++;
    catMap[cat].revenue += sale.price || 0;
    catMap[cat].profit += (sale.price || 0) - (sale.fees || 0) - (sale.ship || 0) - (item?.cost || 0);
    if (item?.added && sale.date) {
      const daysSold = Math.max(1, Math.floor((new Date(sale.date).getTime() - new Date(item.added).getTime()) / 86400000));
      catMap[cat].totalDays += daysSold;
    }
  }
  // Calculate averages
  return Object.values(catMap).map(c => ({
    ...c,
    avgDaysToSell: c.sold > 0 ? Math.round(c.totalDays / c.sold) : null,
    sellThrough: c.items > 0 ? Math.round((c.sold / (c.items + c.sold)) * 100) : 0,
  })).sort((a, b) => (a.avgDaysToSell || 999) - (b.avgDaysToSell || 999));
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
