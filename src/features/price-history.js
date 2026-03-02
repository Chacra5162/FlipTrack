/**
 * price-history.js
 * Tracks price changes and sales history for items
 * Provides analytics on price trends and category-level pricing
 */

import { inv, sales, save, markDirty } from '../data/store.js';
import { fmt, ds, escHtml } from '../utils/format.js';

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
