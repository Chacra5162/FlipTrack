/**
 * price-history.js
 * Tracks price changes, sales history, and field modifications for items.
 * Provides analytics on price trends and category-level pricing.
 */

import { inv, sales, save, markDirty } from '../data/store.js';
import { fmt, ds, escHtml } from '../utils/format.js';

// ── ITEM CHANGE HISTORY ─────────────────────────────────────────────────────

/** Fields worth tracking in modification history */
const TRACKED_FIELDS = {
  name: 'Name', sku: 'SKU', upc: 'UPC', category: 'Category',
  subcategory: 'Subcategory', subtype: 'Type', condition: 'Condition',
  cost: 'Cost', price: 'Price', fees: 'Fees', ship: 'Shipping',
  brand: 'Brand', color: 'Color', size: 'Size', material: 'Material',
  model: 'Model', style: 'Style', pattern: 'Pattern', source: 'Source',
  notes: 'Notes', url: 'URL', qty: 'Stock',
};

/**
 * Snapshot an item's tracked fields before editing.
 * Call this when opening the drawer or before any batch update.
 * @param {Object} item - The inventory item
 * @returns {Object} Snapshot of tracked field values
 */
export function snapshotItem(item) {
  const snap = {};
  for (const key of Object.keys(TRACKED_FIELDS)) {
    snap[key] = item[key] ?? '';
  }
  // Also snapshot platforms as a string for diff
  snap._platforms = (item.platforms || []).join(', ');
  return snap;
}

/**
 * Compare a snapshot to the current item and log any changes.
 * @param {string} itemId - The item ID
 * @param {Object} snapshot - The before-edit snapshot
 */
export function logItemChanges(itemId, snapshot) {
  const item = inv.find(i => i.id === itemId);
  if (!item || !snapshot) return;

  if (!item.itemHistory) item.itemHistory = [];

  const changes = [];
  for (const [key, label] of Object.entries(TRACKED_FIELDS)) {
    const oldVal = snapshot[key] ?? '';
    const newVal = item[key] ?? '';
    // Normalize numbers for comparison
    const oldStr = typeof oldVal === 'number' ? String(oldVal) : String(oldVal).trim();
    const newStr = typeof newVal === 'number' ? String(newVal) : String(newVal).trim();
    if (oldStr !== newStr) {
      // Skip price — already tracked in priceHistory
      if (key === 'price') continue;
      changes.push({ field: label, from: oldStr || '(empty)', to: newStr || '(empty)' });
    }
  }

  // Check platforms change
  const newPlats = (item.platforms || []).join(', ');
  if (snapshot._platforms !== newPlats) {
    changes.push({ field: 'Platforms', from: snapshot._platforms || '(none)', to: newPlats || '(none)' });
  }

  if (changes.length === 0) return;

  item.itemHistory.push({
    date: Date.now(),
    type: 'edit',
    changes,
  });

  // Keep to last 100 entries
  if (item.itemHistory.length > 100) {
    item.itemHistory = item.itemHistory.slice(-100);
  }
}

/**
 * Log a custom event to item history (e.g., listed on eBay, relisted, etc.)
 * @param {string} itemId
 * @param {string} eventType - e.g. 'listed', 'delisted', 'sold', 'created'
 * @param {string} description - Human-readable description
 */
export function logItemEvent(itemId, eventType, description) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return;
  if (!item.itemHistory) item.itemHistory = [];
  item.itemHistory.push({ date: Date.now(), type: eventType, description });
  if (item.itemHistory.length > 100) {
    item.itemHistory = item.itemHistory.slice(-100);
  }
}

/**
 * Get the combined timeline for an item (price history + item changes + sales).
 * Returns a unified, reverse-chronological array.
 * @param {string} itemId
 * @returns {Array}
 */
export function getItemTimeline(itemId) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return [];

  const timeline = [];

  // Price history entries
  for (const entry of (item.priceHistory || [])) {
    timeline.push({ date: entry.date, type: 'price', ...entry });
  }

  // Item change history entries
  for (const entry of (item.itemHistory || [])) {
    timeline.push({ date: entry.date, ...entry });
  }

  // Sales
  const itemSales = sales.filter(s => s.itemId === itemId);
  for (const s of itemSales) {
    timeline.push({
      date: typeof s.date === 'number' ? s.date : new Date(s.date).getTime(),
      type: 'sale',
      price: s.price,
      qty: s.qty,
      platform: s.platform,
    });
  }

  // Sort newest first
  timeline.sort((a, b) => (b.date || 0) - (a.date || 0));
  return timeline;
}

/**
 * Render the full item timeline as HTML for the drawer History tab.
 * @param {string} itemId
 * @returns {string} HTML
 */
export function renderItemTimeline(itemId) {
  const tl = getItemTimeline(itemId);
  if (!tl.length) {
    return '<div style="padding:12px;color:var(--muted);font-size:12px">No history yet.</div>';
  }

  const rows = tl.slice(0, 50).map(entry => {
    const time = `<span style="font-size:11px;color:var(--muted)">${ds(entry.date)}</span>`;

    if (entry.type === 'price') {
      const src = entry.source || 'manual';
      let badge = '';
      if (src === 'sold') {
        badge = `<span style="font-size:10px;background:var(--danger);color:#fff;padding:2px 6px;border-radius:3px">${entry.platform || 'SOLD'}</span>`;
      } else if (src === 'repricing') {
        badge = '<span style="font-size:10px;background:var(--accent2);color:#fff;padding:2px 6px;border-radius:3px">AUTO</span>';
      } else if (src === 'ebay-sync') {
        badge = '<span style="font-size:10px;background:#3483fa;color:#fff;padding:2px 6px;border-radius:3px">eBay</span>';
      } else {
        badge = '<span style="font-size:10px;background:var(--surface3);color:var(--text);padding:2px 6px;border-radius:3px">Manual</span>';
      }
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <div><span style="font-size:12px;font-weight:500">Price → ${fmt(entry.price)}</span> ${badge}<br>${time}</div>
      </div>`;
    }

    if (entry.type === 'sale') {
      const total = (entry.price || 0) * (entry.qty || 1);
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <div><span style="font-size:12px;font-weight:500;color:var(--good)">💰 Sold × ${entry.qty || 1}</span>
          <span style="font-size:10px;background:var(--danger);color:#fff;padding:2px 6px;border-radius:3px;margin-left:4px">${entry.platform || ''}</span>
          <br>${time}</div>
        <div style="font-weight:600;color:var(--good)">${fmt(total)}</div>
      </div>`;
    }

    if (entry.type === 'edit' && entry.changes) {
      const changeTxt = entry.changes.map(c =>
        `<span style="color:var(--muted)">${escHtml(c.field)}:</span> <s style="color:var(--danger);font-size:11px">${escHtml(c.from)}</s> → <span style="color:var(--good);font-size:11px">${escHtml(c.to)}</span>`
      ).join('<br>');
      return `<div style="padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:12px;font-weight:500">✏️ Edited (${entry.changes.length} field${entry.changes.length > 1 ? 's' : ''})</div>
        <div style="font-size:11px;margin:4px 0;line-height:1.6">${changeTxt}</div>
        ${time}
      </div>`;
    }

    // Generic events (listed, delisted, created, etc.)
    if (entry.description) {
      const icons = { listed: '📤', delisted: '🚫', created: '✨', relisted: '🔄' };
      const icon = icons[entry.type] || '📋';
      return `<div style="display:flex;align-items:center;gap:6px;padding:8px 0;border-bottom:1px solid var(--border)">
        <div><span style="font-size:12px">${icon} ${escHtml(entry.description)}</span><br>${time}</div>
      </div>`;
    }

    return '';
  }).join('');

  return `<div style="max-height:400px;overflow-y:auto">${rows}</div>`;
}

/**
 * Log a price change to an item's history
 * @param {string} itemId - The item ID
 * @param {number} newPrice - The new price
 * @param {string} source - 'manual' or 'repricing'
 */
export function logPriceChange(itemId, newPrice, source = 'manual') {
  const item = inv.find(i => i.id === itemId);
  if (!item) return;

  if (!item.priceHistory) item.priceHistory = [];

  item.priceHistory.push({
    date: Date.now(),
    price: newPrice,
    source
  });

  // Keep history to last 50 changes
  if (item.priceHistory.length > 50) {
    item.priceHistory.shift();
  }

  markDirty('inv', itemId);
  save();
}

/**
 * Log a sale price for an item
 * @param {string} itemId - The item ID
 * @param {number} salePrice - The sold price
 * @param {string} platform - Platform it sold on
 */
export function logSalePrice(itemId, salePrice, platform) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return;

  if (!item.priceHistory) item.priceHistory = [];

  item.priceHistory.push({
    date: Date.now(),
    price: salePrice,
    source: 'sold',
    platform
  });

  if (item.priceHistory.length > 50) {
    item.priceHistory.shift();
  }

  markDirty('inv', itemId);
  save();
}

/**
 * Get an item's price history
 * @param {string} itemId - The item ID
 * @returns {Array} Price history entries
 */
export function getPriceHistory(itemId) {
  const item = inv.find(i => i.id === itemId);
  return item?.priceHistory || [];
}

/**
 * Determine price trend: 'up', 'down', or 'stable'
 * @param {string} itemId - The item ID
 * @returns {string} Trend indicator
 */
export function getPriceTrend(itemId) {
  const hist = getPriceHistory(itemId);
  if (hist.length < 2) return 'stable';

  const recent = hist.slice(-5);
  const oldPrice = recent[0].price;
  const newPrice = recent[recent.length - 1].price;

  if (newPrice > oldPrice * 1.02) return 'up';
  if (newPrice < oldPrice * 0.98) return 'down';
  return 'stable';
}

/**
 * Count how many times price changed
 * @param {string} itemId - The item ID
 * @returns {number} Number of price changes
 */
export function getPriceChangeCount(itemId) {
  return getPriceHistory(itemId).length;
}

/**
 * Render a mini ASCII-style price history chart as HTML
 * @param {string} itemId - The item ID
 * @returns {string} HTML string
 */
export function renderPriceHistoryChart(itemId) {
  const hist = getPriceHistory(itemId);
  if (hist.length < 2) {
    return '<div style="padding:10px;color:var(--muted);font-size:12px">No price history yet</div>';
  }

  const recent = hist.slice(-20);
  const prices = recent.map(h => h.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  // Build mini bar chart (4px bars)
  const bars = prices.map(p => {
    const pct = ((p - minPrice) / range) * 100;
    const color = p === prices[prices.length - 1]
      ? 'var(--accent)'
      : getPriceTrend(itemId) === 'up'
        ? 'var(--good)'
        : 'var(--warn)';
    return `<div style="display:inline-block;width:4px;height:${Math.max(pct,5)}%;background:${color};margin:0 1px;border-radius:2px" title="${fmt(p)}"></div>`;
  }).join('');

  return `
    <div style="padding:8px;background:var(--surface2);border-radius:4px">
      <div style="display:flex;align-items:flex-end;height:40px;margin-bottom:6px;gap:2px">
        ${bars}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted)">
        <span>${fmt(minPrice)}</span>
        <span>${fmt(maxPrice)}</span>
        <span style="font-weight:500;color:var(--text)">${recent.length} changes</span>
      </div>
    </div>
  `;
}

/**
 * Get average price by category from inventory
 * @param {Array} invData - Inventory array
 * @param {Array} salesData - Sales array
 * @returns {Object} Map of category → avg price
 */
export function getAvgPriceByCategory(invData, salesData) {
  const byCategory = {};

  // Current listings
  invData.forEach(item => {
    if (item.price) {
      const cat = item.category || 'Uncategorized';
      if (!byCategory[cat]) byCategory[cat] = { sum: 0, count: 0 };
      byCategory[cat].sum += item.price;
      byCategory[cat].count += 1;
    }
  });

  // Add sold prices
  salesData.forEach(sale => {
    const item = invData.find(i => i.id === sale.itemId);
    if (item && sale.price) {
      const cat = item.category || 'Uncategorized';
      if (!byCategory[cat]) byCategory[cat] = { sum: 0, count: 0 };
      byCategory[cat].sum += sale.price;
      byCategory[cat].count += 1;
    }
  });

  // Convert to averages
  const result = {};
  Object.entries(byCategory).forEach(([cat, data]) => {
    result[cat] = data.sum / data.count;
  });

  return result;
}

/**
 * Get price trends for all categories
 * @param {Array} invData - Inventory array
 * @param {Array} salesData - Sales array
 * @returns {Object} Map of category → trend
 */
export function getCategoryPriceTrends(invData, salesData) {
  const trends = {};

  invData.forEach(item => {
    const cat = item.category || 'Uncategorized';
    const hist = item.priceHistory || [];
    if (hist.length > 0) {
      trends[cat] = getPriceTrend(item.id);
    }
  });

  return trends;
}

/**
 * Render an SVG sparkline for price history
 * @param {string} itemId
 * @param {Object} opts - { width: 120, height: 30 }
 * @returns {string} SVG HTML
 */
export function renderPriceSparkline(itemId, opts = {}) {
  const hist = getPriceHistory(itemId);
  if (hist.length < 2) return '';

  const w = opts.width || 120;
  const h = opts.height || 30;
  const recent = hist.slice(-15);
  const prices = recent.map(r => r.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * w;
    const y = h - ((p - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const trend = prices[prices.length - 1] >= prices[0] ? 'var(--good)' : 'var(--danger)';

  return `<svg width="${w}" height="${h}" style="display:block">
    <polyline points="${points}" fill="none" stroke="${trend}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${(prices.length - 1) / (prices.length - 1) * w}" cy="${h - ((prices[prices.length - 1] - min) / range) * (h - 4) - 2}" r="2" fill="${trend}"/>
  </svg>`;
}

/**
 * Render price history table for an item's drawer
 * Used in item detail views
 * @param {string} itemId - The item ID
 * @returns {string} HTML table
 */
export function renderPriceHistoryTable(itemId) {
  const hist = getPriceHistory(itemId);
  if (!hist.length) {
    return '<div style="padding:10px;color:var(--muted);font-size:12px">No price history</div>';
  }

  const rows = hist.slice(-20).reverse().map(entry => {
    const badge = entry.source === 'sold'
      ? `<span style="font-size:10px;background:var(--danger);color:white;padding:2px 6px;border-radius:3px">${entry.platform || 'SOLD'}</span>`
      : entry.source === 'repricing'
        ? `<span style="font-size:10px;background:var(--accent2);color:white;padding:2px 6px;border-radius:3px">AUTO</span>`
        : entry.source === 'ebay-sync'
          ? `<span style="font-size:10px;background:#3483fa;color:white;padding:2px 6px;border-radius:3px">eBay</span>`
          : '';

    return `
      <tr style="border-bottom:1px solid var(--border)">
        <td style="padding:6px 8px;font-size:12px;color:var(--muted)">${ds(entry.date)}</td>
        <td style="padding:6px 8px;text-align:right;font-weight:500">${fmt(entry.price)}</td>
        <td style="padding:6px 8px;text-align:center">${badge}</td>
      </tr>
    `;
  }).join('');

  return `
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead style="background:var(--surface2);border-bottom:2px solid var(--border)">
        <tr>
          <th style="padding:6px 8px;text-align:left;font-weight:500">Date</th>
          <th style="padding:6px 8px;text-align:right;font-weight:500">Price</th>
          <th style="padding:6px 8px;text-align:center;font-weight:500">Source</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}
