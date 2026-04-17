/**
 * platform-roi.js — Platform ROI Comparison
 * Side-by-side breakdown of eBay vs Etsy vs Poshmark vs Mercari etc.
 * Shows avg margin, sell-through, days to sell, fees, and revenue per platform.
 */

import { inv, sales, expenses, getInvItem } from '../data/store.js';
// Platform fee constants imported dynamically if needed
import { fmt, pct, ds, escHtml, addlFee } from '../utils/format.js';

// ── COMPUTE ───────────────────────────────────────────────────────────────

export function computePlatformROI() {
  const platforms = {};
  const allSales = sales.filter(s => s.price > 0);

  // Build sale lookup
  const saleMap = {};
  for (const s of allSales) saleMap[s.itemId] = s;

  // Process sold items
  for (const sale of allSales) {
    const item = getInvItem(sale.itemId);
    if (!item) continue;

    const plat = sale.platform || item.soldPlatform || _guessPlatform(item);
    if (!plat || plat === 'Unknown') continue;

    if (!platforms[plat]) platforms[plat] = {
      name: plat, sold: 0, revenue: 0, profit: 0, totalFees: 0,
      totalCost: 0, totalDays: 0, categories: {}, items: [],
    };

    const p = platforms[plat];
    const cost = item.cost || 0;
    const fees = item.fees || sale.fees || 0;
    const ship = item.ship || 0;
    const profit = (sale.price || 0) - cost - fees - addlFee(sale) - ship;
    const days = _daysBetween(item.added, sale.date);

    p.sold++;
    p.revenue += (sale.price || 0);
    p.profit += profit;
    if (sale.returnInfo) p.returnCount = (p.returnCount || 0) + 1;
    p.totalFees += fees;
    p.totalCost += cost;
    p.totalDays += days;
    const cat = item.category || 'Other';
    p.categories[cat] = (p.categories[cat] || 0) + 1;
    p.items.push({ name: item.name, profit, roi: cost > 0 ? profit / cost : 0 });
  }

  // Count unsold items per platform
  const unsoldByPlat = {};
  for (const item of inv) {
    if (item.sold || item.deleted) continue;
    const plats = _getItemPlatforms(item);
    for (const plat of plats) {
      unsoldByPlat[plat] = (unsoldByPlat[plat] || 0) + 1;
    }
  }

  // Build final list
  const platList = Object.values(platforms).map(p => ({
    ...p,
    avgPrice: p.sold > 0 ? p.revenue / p.sold : 0,
    avgProfit: p.sold > 0 ? p.profit / p.sold : 0,
    avgFees: p.sold > 0 ? p.totalFees / p.sold : 0,
    avgDaysToSell: p.sold > 0 ? Math.round(p.totalDays / p.sold) : null,
    margin: p.revenue > 0 ? p.profit / p.revenue : 0,
    roi: p.totalCost > 0 ? p.profit / p.totalCost : 0,
    unsold: unsoldByPlat[p.name] || 0,
    topCategory: Object.entries(p.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
    feeRate: p.revenue > 0 ? p.totalFees / p.revenue : 0,
    returnCount: p.returnCount || 0,
    returnRate: p.sold > 0 ? (p.returnCount || 0) / p.sold : 0,
  })).sort((a, b) => b.profit - a.profit);

  // Totals
  const totalRevenue = platList.reduce((s, p) => s + p.revenue, 0);
  const totalProfit = platList.reduce((s, p) => s + p.profit, 0);
  const totalSold = platList.reduce((s, p) => s + p.sold, 0);

  return { platList, totalRevenue, totalProfit, totalSold };
}

function _daysBetween(d1, d2) {
  if (!d1 || !d2) return 0;
  return Math.max(0, Math.floor((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000));
}

function _guessPlatform(item) {
  const plats = _getItemPlatforms(item);
  return plats[0] || 'Unknown';
}

function _getItemPlatforms(item) {
  const p = item.platforms || item.platform || '';
  if (typeof p === 'string') return p.split(',').map(s => s.trim()).filter(Boolean);
  if (Array.isArray(p)) return p;
  return [];
}

// ── RENDER ─────────────────────────────────────────────────────────────────

export function renderPlatformROI() {
  const el = document.getElementById('platformROIContent');
  if (!el) return;

  const d = computePlatformROI();

  if (!d.platList.length) {
    el.innerHTML = '<div class="sa-empty">No platform sales data yet. Record sales with platforms to see ROI comparison.</div>';
    return;
  }

  // Revenue share bars
  const revBarsHtml = `
    <div class="ih-section">
      <div class="ih-section-hdr">💰 Revenue Share</div>
      ${d.platList.map(p => {
        const w = d.totalRevenue > 0 ? Math.max(6, (p.revenue / d.totalRevenue) * 100) : 0;
        return `
          <div class="sa-bar-row">
            <div class="sa-bar-name">${escHtml(p.name)}</div>
            <div class="sa-bar-wrap">
              <div class="sa-bar" style="width:${w}%;background:var(--accent)"></div>
            </div>
            <div class="sa-bar-val">${fmt(p.revenue)} <span style="color:var(--muted);font-size:10px">(${d.totalRevenue > 0 ? Math.round(p.revenue / d.totalRevenue * 100) : 0}%)</span></div>
          </div>`;
      }).join('')}
    </div>`;

  // Comparison table
  const tableHtml = `
    <div class="ih-section">
      <div class="ih-section-hdr">📊 Platform Comparison</div>
      <div class="ih-table-wrap">
        <table class="ih-table">
          <thead><tr>
            <th>Platform</th><th>Sold</th><th>Revenue</th><th>Profit</th><th>Margin</th><th>ROI</th><th>Avg Days</th><th>Returns</th><th>Fee Rate</th><th>Top Category</th>
          </tr></thead>
          <tbody>
            ${d.platList.map(p => `<tr>
              <td class="ih-td-name">${escHtml(p.name)}</td>
              <td>${p.sold}</td>
              <td>${fmt(p.revenue)}</td>
              <td class="${p.profit >= 0 ? 'ih-good' : 'ih-bad'}">${fmt(p.profit)}</td>
              <td><span class="ih-pct ${p.margin >= 0.4 ? 'ih-good' : p.margin >= 0.2 ? 'ih-ok' : 'ih-bad'}">${Math.round(p.margin * 100)}%</span></td>
              <td class="${p.roi >= 1 ? 'ih-good' : p.roi >= 0.3 ? 'ih-ok' : 'ih-bad'}">${Math.round(p.roi * 100)}%</td>
              <td>${p.avgDaysToSell !== null ? p.avgDaysToSell + 'd' : '—'}</td>
              <td class="${p.returnRate > 0.1 ? 'ih-bad' : p.returnRate > 0 ? 'ih-ok' : ''}">${p.returnCount > 0 ? `${p.returnCount} (${Math.round(p.returnRate * 100)}%)` : '—'}</td>
              <td style="color:var(--accent2)">${Math.round(p.feeRate * 100)}%</td>
              <td>${escHtml(p.topCategory)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  // Profit per platform cards
  const cardsHtml = `
    <div class="sa-summary">
      ${d.platList.slice(0, 6).map(p => `
        <div class="sa-card">
          <div class="sa-card-val" style="font-size:13px">${escHtml(p.name)}</div>
          <div class="sa-card-lbl">${fmt(p.avgProfit)} avg profit · ${p.sold} sold</div>
        </div>
      `).join('')}
    </div>`;

  el.innerHTML = cardsHtml + revBarsHtml + tableHtml;
}
