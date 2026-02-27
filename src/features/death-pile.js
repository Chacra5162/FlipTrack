/**
 * death-pile.js — Death Pile Tracker
 * Identifies items that have been in inventory but never listed,
 * or listed but stale with no activity. Escalating urgency levels.
 */

import { inv, sales } from '../data/store.js';
import { fmt, ds, escHtml } from '../utils/format.js';
import { getPlatforms } from './platforms.js';

// ── CONSTANTS ─────────────────────────────────────────────────────────────

// Urgency thresholds (days unlisted or stale)
const URGENCY_LEVELS = [
  { days: 7,   level: 'notice',   label: 'Getting Dusty',     color: 'var(--muted)',  icon: '🕐' },
  { days: 14,  level: 'warning',  label: 'Needs Attention',   color: 'var(--warn)',   icon: '⚠️' },
  { days: 30,  level: 'urgent',   label: 'Death Pile',        color: 'var(--danger)', icon: '💀' },
  { days: 60,  level: 'critical', label: 'Buried Treasure',   color: '#ff4757',       icon: '☠️' },
  { days: 90,  level: 'extreme',  label: 'Cut Your Losses',   color: '#ff0000',       icon: '🔥' },
];

/**
 * Get urgency level for number of days.
 * @param {number} days
 * @returns {Object} Urgency level descriptor
 */
export function getUrgencyLevel(days) {
  for (let i = URGENCY_LEVELS.length - 1; i >= 0; i--) {
    if (days >= URGENCY_LEVELS[i].days) return URGENCY_LEVELS[i];
  }
  return null; // Under 7 days — fine
}

/**
 * Analyze inventory for death pile items.
 * An item is in the death pile if:
 *   - It has qty > 0 (still in stock)
 *   - AND (no platforms listed OR no sales in 30+ days while listed)
 *
 * @param {Array} [items] - Inventory array (defaults to inv)
 * @returns {Array<{ item, reason, daysStale, urgency, suggestedAction }>}
 */
export function getDeathPileItems(items) {
  const now = Date.now();
  const msDay = 86400000;
  const results = [];

  for (const item of (items || inv)) {
    if ((item.qty || 0) <= 0) continue; // Sold or out of stock — skip

    const addedDate = item.added ? new Date(item.added).getTime() : now;
    const daysInInventory = Math.floor((now - addedDate) / msDay);

    if (daysInInventory < 7) continue; // Too new to worry about

    const platforms = getPlatforms(item);
    const hasSale = sales.some(s => s.itemId === item.id);
    const hasActiveListing = platforms.length > 0 &&
      Object.values(item.platformStatus || {}).some(s => s === 'active');

    let reason = '';
    let daysStale = 0;
    let suggestedAction = '';

    if (platforms.length === 0 || !Object.keys(item.platformStatus || {}).length) {
      // Never listed anywhere
      daysStale = daysInInventory;
      reason = 'Never listed on any platform';
      suggestedAction = 'List on 2-3 platforms to get visibility';
    } else if (!hasActiveListing) {
      // Was listed but all listings expired/delisted
      daysStale = daysInInventory;
      reason = 'All listings expired or delisted';
      suggestedAction = 'Relist with updated photos and price';
    } else if (!hasSale) {
      // Listed but no sales ever
      const listingDates = Object.values(item.platformListingDates || {});
      const earliestListing = listingDates.length
        ? Math.min(...listingDates.map(d => new Date(d).getTime()))
        : addedDate;
      daysStale = Math.floor((now - earliestListing) / msDay);
      if (daysStale < 14) continue; // Give listings time to sell
      reason = `Listed ${daysStale} days with no sales`;
      suggestedAction = 'Drop price 10-15% or refresh listing with new photos';
    } else {
      // Has sold before but current stock sitting
      const lastSale = sales
        .filter(s => s.itemId === item.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      if (lastSale) {
        const daysSinceLastSale = Math.floor((now - new Date(lastSale.date).getTime()) / msDay);
        if (daysSinceLastSale < 30) continue; // Recent sale — fine
        daysStale = daysSinceLastSale;
        reason = `Last sale ${daysStale} days ago`;
        suggestedAction = 'Consider bundling or relisting at lower price';
      } else {
        continue;
      }
    }

    const urgency = getUrgencyLevel(daysStale);
    if (!urgency) continue;

    results.push({
      item,
      reason,
      daysStale,
      urgency,
      suggestedAction,
      potentialLoss: (item.cost || 0) * (item.qty || 1),
    });
  }

  // Sort by urgency (most urgent first)
  results.sort((a, b) => b.daysStale - a.daysStale);

  return results;
}

/**
 * Get death pile summary statistics.
 * @returns {Object}
 */
export function getDeathPileStats() {
  const items = getDeathPileItems();
  const totalValue = items.reduce((sum, dp) => sum + (dp.item.price || 0) * (dp.item.qty || 1), 0);
  const totalCost = items.reduce((sum, dp) => sum + dp.potentialLoss, 0);

  const byUrgency = {};
  for (const level of URGENCY_LEVELS) {
    byUrgency[level.level] = items.filter(dp => dp.urgency.level === level.level).length;
  }

  return {
    totalItems: items.length,
    totalValue,
    totalCost,
    byUrgency,
    items,
  };
}

/**
 * Render death pile widget for dashboard.
 * @returns {string} HTML
 */
export function renderDeathPileWidget() {
  const stats = getDeathPileStats();

  if (!stats.totalItems) {
    return `<div class="dp-widget dp-empty">
      <div class="dp-icon">✅</div>
      <div class="dp-msg">No death pile items! Everything is listed and active.</div>
    </div>`;
  }

  const urgentCount = (stats.byUrgency.urgent || 0) + (stats.byUrgency.critical || 0) + (stats.byUrgency.extreme || 0);

  let html = `<div class="dp-widget">
    <div class="dp-header">
      <span class="dp-title">💀 Death Pile</span>
      <span class="dp-count">${stats.totalItems} items · ${fmt(stats.totalCost)} at risk</span>
    </div>
  `;

  // Top 5 most urgent items
  const topItems = stats.items.slice(0, 5);
  html += `<div class="dp-list">`;
  for (const dp of topItems) {
    html += `
      <div class="dp-item" onclick="openDrawer('${dp.item.id}')">
        <span class="dp-urgency" style="color:${dp.urgency.color}">${dp.urgency.icon}</span>
        <div class="dp-item-info">
          <div class="dp-item-name">${escHtml((dp.item.name || 'Item').slice(0, 40))}</div>
          <div class="dp-item-reason">${escHtml(dp.reason)}</div>
        </div>
        <div class="dp-item-days">${dp.daysStale}d</div>
      </div>
    `;
  }
  html += `</div>`;

  if (stats.totalItems > 5) {
    html += `<div class="dp-more">+ ${stats.totalItems - 5} more items</div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Render full death pile view (for dedicated section).
 * @returns {string} HTML
 */
export function renderDeathPileView() {
  const stats = getDeathPileStats();

  let html = `<div class="dp-view">
    <div class="dp-view-header">
      <h3>Death Pile Tracker</h3>
      <div class="dp-view-stats">
        <span>${stats.totalItems} stale items</span>
        <span>·</span>
        <span>${fmt(stats.totalValue)} inventory value</span>
        <span>·</span>
        <span style="color:var(--danger)">${fmt(stats.totalCost)} cost at risk</span>
      </div>
    </div>
  `;

  if (!stats.totalItems) {
    html += `<div class="dp-empty-full">
      <div style="font-size:48px;margin-bottom:12px">🎉</div>
      <p>No stale inventory! All your items are actively listed or recently sold.</p>
    </div></div>`;
    return html;
  }

  // Group by urgency
  for (const level of [...URGENCY_LEVELS].reverse()) {
    const levelItems = stats.items.filter(dp => dp.urgency.level === level.level);
    if (!levelItems.length) continue;

    html += `
      <div class="dp-group">
        <div class="dp-group-header" style="color:${level.color}">
          ${level.icon} ${level.label} — ${levelItems.length} items (${level.days}+ days)
        </div>
        <div class="dp-group-items">
    `;

    for (const dp of levelItems) {
      html += `
        <div class="dp-row" onclick="openDrawer('${dp.item.id}')">
          <div class="dp-row-main">
            <span class="dp-row-name">${escHtml((dp.item.name || 'Item').slice(0, 50))}</span>
            <span class="dp-row-cat">${escHtml(dp.item.category || '')}</span>
          </div>
          <div class="dp-row-meta">
            <span>${dp.daysStale} days</span>
            <span>${fmt(dp.item.price || 0)}</span>
            <span style="color:var(--muted)">${escHtml(dp.reason)}</span>
          </div>
          <div class="dp-row-action">${escHtml(dp.suggestedAction)}</div>
        </div>
      `;
    }

    html += `</div></div>`;
  }

  html += `</div>`;
  return html;
}
