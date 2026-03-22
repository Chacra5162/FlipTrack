/**
 * notification-center.js — In-app notification bell & dropdown
 * Tracks: low stock alerts, sync events, price changes, stale inventory
 */

import { inv, sales, getInvItem, getSalesForItem } from '../data/store.js';
import { fmt, escHtml, escAttr } from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { sendNotification } from '../features/push-notifications.js';
import { getDaysUntilExpiry } from '../features/crosslist.js';
import { getPlatforms } from '../features/platforms.js';

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

export function addNotification(type, title, message, actionId, action) {
  _notifications.unshift({
    id: Date.now().toString(36),
    type, // 'stock' | 'sync' | 'price' | 'sale' | 'info'
    title,
    message,
    actionId: actionId || null,
    action: action || null, // { view, label } for navigation actions
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

  list.innerHTML = _notifications.slice(0, 20).map(n => {
    // Infer action for legacy notifications missing action/actionId
    let inferredAction = n.action || null;
    if (!n.actionId && !n.action) {
      if (/expir|relist|renew/i.test(n.message)) inferredAction = { view: 'crosslist', label: 'View in Crosslist' };
      else if (/stock|restock|running low/i.test(n.message)) inferredAction = { view: 'inventory', label: 'View Inventory' };
      else if (/stale|reprice|lower price/i.test(n.message)) inferredAction = { view: 'inventory', label: 'View Inventory' };
      else if (/unlisted|not listed/i.test(n.message)) inferredAction = { view: 'crosslist', label: 'View in Crosslist' };
    }
    const onclick = n.actionId
      ? `openDrawer('${escAttr(n.actionId)}')`
      : inferredAction?.view
        ? `switchView('${escAttr(inferredAction.view)}');closeNotifCenter()`
        : '';
    return `
    <div class="notif-item${n.read ? '' : ' unread'}" data-nid="${n.id}"${onclick ? ` onclick="${onclick}" style="cursor:pointer"` : ''}>
      <span class="notif-icon">${iconFor(n.type)}</span>
      <div class="notif-body">
        <div class="notif-title">${escHtml(n.title)}</div>
        <div class="notif-msg">${escHtml(n.message)}</div>
        ${inferredAction?.label ? `<div style="font-size:9px;color:var(--accent);margin-top:3px;font-weight:600">${escHtml(inferredAction.label)} &rarr;</div>` : ''}
      </div>
      <span class="notif-time">${timeAgo(n.time)}</span>
    </div>`;
  }).join('');
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

  const outOfStock = inv.filter(i => i.bulk && i.qty === 0);
  const lowStock = inv.filter(i => i.bulk && i.qty > 0 && i.qty <= (i.lowAlert || 2));
  const stale = inv.filter(i => {
    if ((i.qty || 0) <= 0) return false;
    const days = Math.floor((now - new Date(i.added || now).getTime()) / 86400000);
    return days >= 60 && !getSalesForItem(i.id).length;
  });

  if (outOfStock.length) {
    const osNames = outOfStock.slice(0, 3).map(i => i.name || 'Untitled').join(', ');
    addNotification('stock', 'Out of Stock',
      `${osNames}${outOfStock.length > 3 ? ` +${outOfStock.length - 3} more` : ''} — need restocking`,
      outOfStock.length === 1 ? outOfStock[0].id : null,
      outOfStock.length > 1 ? { view: 'inventory', label: 'View Inventory' } : null);
  }
  if (lowStock.length) {
    const lsNames = lowStock.slice(0, 3).map(i => i.name || 'Untitled').join(', ');
    addNotification('stock', 'Low Stock Warning',
      `${lsNames}${lowStock.length > 3 ? ` +${lowStock.length - 3} more` : ''} — running low`,
      lowStock.length === 1 ? lowStock[0].id : null,
      lowStock.length > 1 ? { view: 'inventory', label: 'View Inventory' } : null);
  }
  if (stale.length) {
    const stNames = stale.slice(0, 3).map(i => i.name || 'Untitled').join(', ');
    addNotification('price', 'Stale Inventory',
      `${stNames}${stale.length > 3 ? ` +${stale.length - 3} more` : ''} — 60+ days, no sales`,
      stale.length === 1 ? stale[0].id : null,
      stale.length > 1 ? { view: 'inventory', label: 'View Inventory' } : null);
  }

  // ── SMART NOTIFICATION: Repricing suggestions ─────────────────────────
  const reprice30 = inv.filter(i => {
    if ((i.qty || 0) <= 0) return false;
    const days = Math.floor((now - new Date(i.added || now).getTime()) / 86400000);
    return days >= 30 && days < 60 && !getSalesForItem(i.id).length;
  });
  if (reprice30.length) {
    addNotification('price', 'Reprice Suggestion',
      `${reprice30.length} item${reprice30.length > 1 ? 's' : ''} listed 30+ days without a sale — lower price by 10-15%?`);
  }

  // ── SMART NOTIFICATION: Expiring listings (uses actual platform rules) ──
  // Deduplicate: only notify once per day for expiring items
  const lastExpCheck = parseInt(localStorage.getItem('ft_notif_exp_check') || '0');
  if (now - lastExpCheck >= 86400000) { // Once per day
    localStorage.setItem('ft_notif_exp_check', now.toString());
    const expiring = [];
    for (const item of inv) {
      if ((item.qty || 0) <= 0) continue;
      const plats = getPlatforms(item);
      for (const p of plats) {
        const daysLeft = getDaysUntilExpiry(p, item.platformListingDates?.[p]);
        if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 3) {
          expiring.push({ item, platform: p, daysLeft });
        }
      }
    }
    if (expiring.length) {
      const names = expiring.slice(0, 3).map(e =>
        `${e.item.name || e.item.sku || 'Untitled'} (${e.platform}, ${e.daysLeft}d)`
      ).join(', ');
      const more = expiring.length > 3 ? ` +${expiring.length - 3} more` : '';
      if (expiring.length === 1) {
        addNotification('info', 'Listing Expiring Soon',
          `${names} — relist or renew`,
          expiring[0].item.id);
      } else {
        addNotification('info', 'Listings Expiring Soon',
          `${names}${more}`,
          null,
          { view: 'crosslist', label: 'View in Crosslist' });
      }
    }
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
    const uNames = unlistedHighMargin.slice(0, 3).map(i => i.name || i.sku || 'Untitled').join(', ');
    const uMore = unlistedHighMargin.length > 3 ? ` +${unlistedHighMargin.length - 3} more` : '';
    if (unlistedHighMargin.length === 1) {
      addNotification('info', 'Unlisted High-Margin Item',
        `${uNames} has 50%+ margin but isn't listed on any platform`,
        unlistedHighMargin[0].id);
    } else {
      addNotification('info', 'Unlisted High-Margin Items',
        `${uNames}${uMore} — ${unlistedHighMargin.length} items with 50%+ margin aren't listed`,
        null,
        { view: 'crosslist', label: 'View in Crosslist' });
    }
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
    const item = getInvItem(sale.itemId);
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

/** Daily Digest — "What Sold Yesterday" summary notification */
export function checkDailyDigest() {
  const today = new Date();
  const key = `ft_digest_${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  if (localStorage.getItem(key)) return; // already sent today

  // Gather yesterday's sales
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);

  const ySales = sales.filter(s => (s.date || '').slice(0, 10) === yStr);
  if (!ySales.length) {
    localStorage.setItem(key, '1');
    return; // nothing to report
  }

  const count = ySales.length;
  const revenue = ySales.reduce((sum, s) => sum + ((s.price || 0) * (s.qty || 1)), 0);
  const fees = ySales.reduce((sum, s) => sum + (s.fees || 0) + (s.ship || 0), 0);
  const cogs = ySales.reduce((sum, s) => {
    const item = getInvItem(s.itemId);
    return sum + ((item?.cost || 0) * (s.qty || 1));
  }, 0);
  const profit = revenue - fees - cogs;

  // Calculate streak — consecutive days with at least 1 sale (O(n) via Set)
  const saleDates = new Set(sales.map(s => (s.date || '').slice(0, 10)));
  let streak = 1;
  for (let d = 2; d <= 365; d++) {
    const check = new Date(today);
    check.setDate(check.getDate() - d);
    const dStr = check.toISOString().slice(0, 10);
    if (saleDates.has(dStr)) streak++;
    else break;
  }

  const title = `Yesterday: ${count} sale${count > 1 ? 's' : ''} · ${fmt(revenue)} revenue`;
  const message = `Profit: ${fmt(profit)} · ${streak > 1 ? streak + '-day streak 🔥' : 'Keep it up!'}`;

  addNotification('sale', title, message);
  sendNotification('📊 ' + title, message, 'ft-daily-digest');
  localStorage.setItem(key, '1');
}

let _notifInitialized = false;
export function initNotificationCenter() {
  if (_notifInitialized) return;
  _notifInitialized = true;
  load();
  updateBadge();
  generateStockAlerts();
  checkDailyDigest();

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (_isOpen && !e.target.closest('#notifDropdown') && !e.target.closest('#notifBellBtn')) {
      closeNotifCenter();
    }
  });
}

/**
 * Check for upcoming Whatnot shows today and create reminder notifications.
 * Should be called during boot after initWhatnotShows().
 */
export function checkWhatnotShowReminders(getTodayShows) {
  try {
    if (typeof getTodayShows !== 'function') return;
    const todayShows = getTodayShows();
    if (!todayShows || !todayShows.length) return;

    for (const show of todayShows) {
      // Don't re-notify for the same show (check by show id in recent notifications)
      const alreadyNotified = _notifications.some(n =>
        n.actionId === `wn_show_${show.id}` && n.type === 'show'
      );
      if (alreadyNotified) continue;

      const timeLabel = show.time ? ` at ${show.time}` : '';
      addNotification(
        'show',
        `Whatnot Show Today${timeLabel}`,
        `"${show.name}" — ${show.items.length} items prepped`,
        `wn_show_${show.id}`
      );
    }
  } catch (_) { /* whatnot-show may not be loaded */ }
}

/**
 * Generate post-show summary notification.
 * Call after endShow() in whatnot-show.js.
 */
export function notifyShowEnded(showName, soldCount, totalRevenue) {
  addNotification(
    'sale',
    'Show Complete',
    `"${showName}" ended — ${soldCount} sold, $${(totalRevenue || 0).toFixed(2)} revenue`,
    null
  );
}
