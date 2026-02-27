/**
 * inventory-value.js — Inventory Value Dashboard
 * Real-time value tracking, aging analysis, category breakdown,
 * and predictions based on sell-through rate.
 */

import { inv, sales, getInvItem } from '../data/store.js';
import { fmt, pct, ds, escHtml } from '../utils/format.js';
import { getPlatforms } from './platforms.js';
import { PLATFORM_FEES } from '../config/platforms.js';

// ── CORE CALCULATIONS ────────────────────────────────────────────────────

/**
 * Calculate comprehensive inventory value metrics.
 * @returns {Object} Full value dashboard data
 */
export function getInventoryValueData() {
  const now = Date.now();
  const msDay = 86400000;
  const inStock = inv.filter(i => (i.qty || 0) > 0);

  // Total value metrics
  const totalRetailValue = inStock.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 1), 0);
  const totalCostBasis = inStock.reduce((sum, i) => sum + (i.cost || 0) * (i.qty || 1), 0);
  const totalUnits = inStock.reduce((sum, i) => sum + (i.qty || 1), 0);
  const potentialProfit = totalRetailValue - totalCostBasis;
  const avgMargin = totalRetailValue > 0 ? potentialProfit / totalRetailValue : 0;

  // Aging analysis
  const agingBuckets = [
    { label: '0-7 days',   min: 0, max: 7,   items: [], value: 0, cost: 0 },
    { label: '8-30 days',  min: 8, max: 30,  items: [], value: 0, cost: 0 },
    { label: '31-60 days', min: 31, max: 60, items: [], value: 0, cost: 0 },
    { label: '61-90 days', min: 61, max: 90, items: [], value: 0, cost: 0 },
    { label: '90+ days',   min: 91, max: Infinity, items: [], value: 0, cost: 0 },
  ];

  for (const item of inStock) {
    const addedDate = item.added ? new Date(item.added).getTime() : now;
    const daysOld = Math.floor((now - addedDate) / msDay);
    const itemValue = (item.price || 0) * (item.qty || 1);
    const itemCost = (item.cost || 0) * (item.qty || 1);

    for (const bucket of agingBuckets) {
      if (daysOld >= bucket.min && daysOld <= bucket.max) {
        bucket.items.push(item);
        bucket.value += itemValue;
        bucket.cost += itemCost;
        break;
      }
    }
  }

  // Category breakdown
  const categoryMap = {};
  for (const item of inStock) {
    const cat = item.category || 'Uncategorized';
    if (!categoryMap[cat]) categoryMap[cat] = { count: 0, units: 0, value: 0, cost: 0, items: [] };
    categoryMap[cat].count++;
    categoryMap[cat].units += (item.qty || 1);
    categoryMap[cat].value += (item.price || 0) * (item.qty || 1);
    categoryMap[cat].cost += (item.cost || 0) * (item.qty || 1);
    categoryMap[cat].items.push(item);
  }

  const categories = Object.entries(categoryMap)
    .map(([name, data]) => ({
      name,
      ...data,
      profit: data.value - data.cost,
      margin: data.value > 0 ? (data.value - data.cost) / data.value : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Sell-through rate for predictions
  const thirtyDaysAgo = now - 30 * msDay;
  const recentSales = sales.filter(s => new Date(s.date).getTime() >= thirtyDaysAgo);
  const monthlySalesRevenue = recentSales.reduce((sum, s) => sum + (s.price || 0) * (s.qty || 0), 0);
  const monthlySalesUnits = recentSales.reduce((sum, s) => sum + (s.qty || 0), 0);

  // Prediction: at current sell-through rate
  const daysToSellAll = monthlySalesUnits > 0
    ? Math.round(totalUnits / monthlySalesUnits * 30)
    : null;
  const projectedRevenue30d = monthlySalesRevenue; // Same rate

  // Top value items
  const topItems = [...inStock]
    .sort((a, b) => (b.price || 0) * (b.qty || 1) - (a.price || 0) * (a.qty || 1))
    .slice(0, 10);

  // Slow movers (highest value items with no recent sales)
  const slowMovers = inStock
    .filter(item => {
      const added = item.added ? new Date(item.added).getTime() : now;
      return (now - added) > 30 * msDay;
    })
    .filter(item => !recentSales.some(s => s.itemId === item.id))
    .sort((a, b) => (b.price || 0) * (b.qty || 1) - (a.price || 0) * (a.qty || 1))
    .slice(0, 10);

  return {
    totalRetailValue,
    totalCostBasis,
    totalUnits,
    potentialProfit,
    avgMargin,
    itemCount: inStock.length,
    agingBuckets,
    categories,
    monthlySalesRevenue,
    monthlySalesUnits,
    daysToSellAll,
    projectedRevenue30d,
    topItems,
    slowMovers,
  };
}

/**
 * Render the inventory value dashboard as HTML.
 * @returns {string}
 */
export function renderInventoryValueDashboard() {
  const data = getInventoryValueData();

  let html = `<div class="iv-dashboard">`;

  // ── VALUE SUMMARY CARDS ──
  html += `<div class="iv-cards">
    <div class="iv-card">
      <div class="iv-card-label">Total Retail Value</div>
      <div class="iv-card-value">${fmt(data.totalRetailValue)}</div>
      <div class="iv-card-sub">${data.totalUnits} units · ${data.itemCount} unique items</div>
    </div>
    <div class="iv-card">
      <div class="iv-card-label">Cost Basis</div>
      <div class="iv-card-value">${fmt(data.totalCostBasis)}</div>
      <div class="iv-card-sub">Invested in current inventory</div>
    </div>
    <div class="iv-card">
      <div class="iv-card-label">Potential Profit</div>
      <div class="iv-card-value" style="color:${data.potentialProfit >= 0 ? 'var(--good)' : 'var(--danger)'}">${fmt(data.potentialProfit)}</div>
      <div class="iv-card-sub">${pct(data.avgMargin)} avg margin</div>
    </div>
    <div class="iv-card">
      <div class="iv-card-label">Sell-Through Projection</div>
      <div class="iv-card-value">${data.daysToSellAll ? data.daysToSellAll + 'd' : '—'}</div>
      <div class="iv-card-sub">${data.daysToSellAll ? 'to sell all at current rate' : 'No recent sales'}</div>
    </div>
  </div>`;

  // ── AGING ANALYSIS ──
  html += `<div class="iv-section">
    <h4 class="iv-section-title">📊 Inventory Aging</h4>
    <div class="iv-aging">
  `;

  const maxBucketValue = Math.max(...data.agingBuckets.map(b => b.value), 1);
  for (const bucket of data.agingBuckets) {
    const widthPct = (bucket.value / maxBucketValue) * 100;
    const dangerClass = bucket.min >= 61 ? ' iv-aging-danger' : bucket.min >= 31 ? ' iv-aging-warn' : '';
    html += `
      <div class="iv-aging-row${dangerClass}">
        <span class="iv-aging-label">${bucket.label}</span>
        <div class="iv-aging-bar-wrap">
          <div class="iv-aging-bar" style="width:${widthPct}%"></div>
        </div>
        <span class="iv-aging-val">${fmt(bucket.value)} (${bucket.items.length})</span>
      </div>
    `;
  }
  html += `</div></div>`;

  // ── CATEGORY BREAKDOWN ──
  html += `<div class="iv-section">
    <h4 class="iv-section-title">📁 Value by Category</h4>
    <div class="iv-categories">
  `;

  for (const cat of data.categories.slice(0, 8)) {
    const pctOfTotal = data.totalRetailValue > 0 ? cat.value / data.totalRetailValue * 100 : 0;
    html += `
      <div class="iv-cat-row">
        <span class="iv-cat-name">${escHtml(cat.name)}</span>
        <div class="iv-cat-bar-wrap">
          <div class="iv-cat-bar" style="width:${pctOfTotal}%"></div>
        </div>
        <span class="iv-cat-val">${fmt(cat.value)}</span>
        <span class="iv-cat-margin" style="color:${cat.margin >= 0.3 ? 'var(--good)' : 'var(--warn)'}">${pct(cat.margin)}</span>
      </div>
    `;
  }
  html += `</div></div>`;

  // ── TOP VALUE ITEMS ──
  html += `<div class="iv-section">
    <h4 class="iv-section-title">💎 Top Value Items</h4>
    <div class="iv-top-items">
  `;

  for (const item of data.topItems) {
    const value = (item.price || 0) * (item.qty || 1);
    html += `
      <div class="iv-item-row" onclick="openDrawer('${item.id}')">
        <span class="iv-item-name">${escHtml((item.name || 'Item').slice(0, 40))}</span>
        <span class="iv-item-qty">×${item.qty || 1}</span>
        <span class="iv-item-val">${fmt(value)}</span>
      </div>
    `;
  }
  html += `</div></div>`;

  // ── SLOW MOVERS ──
  if (data.slowMovers.length) {
    html += `<div class="iv-section">
      <h4 class="iv-section-title">🐌 Slow Movers (30+ days, no recent sales)</h4>
      <div class="iv-top-items">
    `;
    for (const item of data.slowMovers) {
      const daysOld = Math.floor((Date.now() - new Date(item.added || Date.now()).getTime()) / 86400000);
      html += `
        <div class="iv-item-row iv-slow" onclick="openDrawer('${item.id}')">
          <span class="iv-item-name">${escHtml((item.name || 'Item').slice(0, 40))}</span>
          <span class="iv-item-days">${daysOld}d old</span>
          <span class="iv-item-val">${fmt((item.price || 0) * (item.qty || 1))}</span>
        </div>
      `;
    }
    html += `</div></div>`;
  }

  html += `</div>`;
  return html;
}
