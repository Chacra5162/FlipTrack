/**
 * sourcing-analytics.js — Sourcing Performance Analytics
 * Track which sources (thrift stores, garage sales, wholesale) give best ROI,
 * haul performance over time, and source comparison metrics.
 */

import { inv, sales, getInvItem, getSalesForItem } from '../data/store.js';
import { fmt, pct, ds, escHtml, escAttr, daysSince, addlFee } from '../utils/format.js';

const _daysSince = daysSince;

// ── COMPUTE SOURCE METRICS ────────────────────────────────────────────────

export function computeSourcingAnalytics() {
  const sources = {};

  for (const item of inv) {
    if (item.deleted) continue;
    const src = (item.source || '').trim() || 'Unknown';
    if (!sources[src]) sources[src] = {
      name: src, items: 0, sold: 0, unsold: 0,
      totalCost: 0, totalRevenue: 0, totalProfit: 0,
      totalDaysToSell: 0, categories: {},
    };
    const s = sources[src];
    s.items++;
    s.totalCost += (item.cost || 0) * (item.qty || 1);
    const cat = item.category || 'Other';
    s.categories[cat] = (s.categories[cat] || 0) + 1;

    // Use actual sales records instead of item.sold flag
    const itemSales = getSalesForItem(item.id);
    const soldQty = itemSales.reduce((sum, sl) => sum + (sl.qty || 1), 0);
    if (soldQty > 0) {
      s.sold += soldQty;
      const revenue = itemSales.reduce((sum, sl) => sum + (sl.price || 0) * (sl.qty || 1), 0);
      const fees = itemSales.reduce((sum, sl) => sum + (sl.fees || 0), 0);
      const shipping = itemSales.reduce((sum, sl) => sum + (sl.ship || 0), 0);
      s.totalRevenue += revenue;
      const addlFees = itemSales.reduce((sum, sl) => sum + addlFee(sl), 0);
      s.totalProfit += revenue - (item.cost || 0) * soldQty - fees - addlFees - shipping;
      s.totalDaysToSell += _daysSince(item.added);
    } else {
      s.unsold++;
    }
  }

  const sourceList = Object.values(sources).map(s => ({
    ...s,
    sellThrough: s.items > 0 ? s.sold / s.items : 0,
    avgDaysToSell: s.sold > 0 ? Math.round(s.totalDaysToSell / s.sold) : null,
    roi: s.totalCost > 0 ? s.totalProfit / s.totalCost : 0,
    avgProfit: s.sold > 0 ? s.totalProfit / s.sold : 0,
    avgCost: s.items > 0 ? s.totalCost / s.items : 0,
    topCategory: Object.entries(s.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
  })).sort((a, b) => b.roi - a.roi);

  // Overall stats
  const totalSources = sourceList.length;
  const totalSpent = sourceList.reduce((s, src) => s + src.totalCost, 0);
  const totalProfit = sourceList.reduce((s, src) => s + src.totalProfit, 0);
  const bestSource = sourceList[0] || null;
  const worstSource = sourceList.length > 1 ? sourceList[sourceList.length - 1] : null;

  return { sourceList, totalSources, totalSpent, totalProfit, bestSource, worstSource };
}

// ── RENDER ─────────────────────────────────────────────────────────────────

export function renderSourcingAnalytics() {
  const el = document.getElementById('sourcingAnalyticsContent');
  if (!el) return;

  const d = computeSourcingAnalytics();

  if (!d.sourceList.length) {
    el.innerHTML = '<div class="sa-empty">No sourcing data yet. Add a source when creating inventory items to track performance.</div>';
    return;
  }

  // Summary
  const summaryHtml = `
    <div class="sa-summary">
      <div class="sa-card"><div class="sa-card-val">${d.totalSources}</div><div class="sa-card-lbl">Sources</div></div>
      <div class="sa-card"><div class="sa-card-val">${fmt(d.totalSpent)}</div><div class="sa-card-lbl">Total Invested</div></div>
      <div class="sa-card"><div class="sa-card-val">${fmt(d.totalProfit)}</div><div class="sa-card-lbl">Total Profit</div></div>
      <div class="sa-card sa-card-best"><div class="sa-card-val">${d.bestSource ? escHtml(d.bestSource.name) : '—'}</div><div class="sa-card-lbl">Best ROI Source</div></div>
    </div>`;

  // Source leaderboard
  const tableHtml = `
    <div class="ih-section">
      <div class="ih-section-hdr">🏪 Source Performance</div>
      <div class="ih-table-wrap">
        <table class="ih-table">
          <thead><tr>
            <th>Source</th><th>Items</th><th>Sold</th><th>Sell-Through</th><th>Invested</th><th>Profit</th><th>ROI</th><th>Avg Days</th><th>Top Category</th>
          </tr></thead>
          <tbody>
            ${d.sourceList.map(s => `<tr>
              <td class="ih-td-name"><a href="#" class="sa-source-link" onclick="event.preventDefault();showSourceItems('${escAttr(s.name)}')">${escHtml(s.name)}</a></td>
              <td>${s.items}</td>
              <td>${s.sold}</td>
              <td><span class="ih-pct ${s.sellThrough >= 0.5 ? 'ih-good' : s.sellThrough >= 0.25 ? 'ih-ok' : 'ih-bad'}">${Math.round(s.sellThrough * 100)}%</span></td>
              <td>${fmt(s.totalCost)}</td>
              <td class="${s.totalProfit >= 0 ? 'ih-good' : 'ih-bad'}">${fmt(s.totalProfit)}</td>
              <td class="${s.roi >= 1 ? 'ih-good' : s.roi >= 0.3 ? 'ih-ok' : 'ih-bad'}">${Math.round(s.roi * 100)}%</td>
              <td>${s.avgDaysToSell !== null ? s.avgDaysToSell + 'd' : '—'}</td>
              <td>${escHtml(s.topCategory)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  // ROI comparison bars
  const maxROI = Math.max(...d.sourceList.map(s => Math.abs(s.roi)), 0.01);
  const barsHtml = `
    <div class="ih-section">
      <div class="ih-section-hdr">📊 ROI by Source</div>
      ${d.sourceList.slice(0, 10).map(s => {
        const w = Math.max(6, Math.abs(s.roi) / maxROI * 100);
        const cls = s.roi >= 1 ? 'ih-good' : s.roi >= 0.3 ? 'ih-ok' : 'ih-bad';
        return `
          <div class="sa-bar-row">
            <div class="sa-bar-name">${escHtml(s.name)}</div>
            <div class="sa-bar-wrap">
              <div class="sa-bar ${cls}" style="width:${w}%"></div>
            </div>
            <div class="sa-bar-val ${cls}">${Math.round(s.roi * 100)}%</div>
          </div>`;
      }).join('')}
    </div>`;

  el.innerHTML = summaryHtml + tableHtml + barsHtml;
}

// ── SOURCE DRILLDOWN ──────────────────────────────────────────────────────

export function showSourceItems(sourceName) {
  const el = document.getElementById('sourcingAnalyticsContent');
  if (!el) return;

  const items = inv.filter(i => !i.deleted && ((i.source || '').trim() || 'Unknown') === sourceName);

  let html = `
    <div class="ih-section">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <button class="btn-sm" onclick="renderSourcingAnalytics()" style="flex-shrink:0">← Back</button>
        <div class="ih-section-hdr" style="margin:0">Items from ${escHtml(sourceName)} (${items.length})</div>
      </div>
      <div class="ih-table-wrap">
        <table class="ih-table">
          <thead><tr>
            <th>Item</th><th>Category</th><th>Cost</th><th>Price</th><th>Qty</th><th>Status</th><th>Profit</th>
          </tr></thead>
          <tbody>`;

  for (const item of items) {
    const itemSales = getSalesForItem(item.id);
    const soldQty = itemSales.reduce((sum, s) => sum + (s.qty || 1), 0);
    const revenue = itemSales.reduce((sum, s) => sum + (s.price || 0) * (s.qty || 1), 0);
    const fees = itemSales.reduce((sum, s) => sum + (s.fees || 0), 0);
    const ship = itemSales.reduce((sum, s) => sum + (s.ship || 0), 0);
    const addlFees = itemSales.reduce((sum, s) => sum + addlFee(s), 0);
    const profit = soldQty > 0 ? revenue - (item.cost || 0) * soldQty - fees - addlFees - ship : 0;
    const status = soldQty > 0
      ? `<span class="ih-good">Sold (${soldQty})</span>`
      : (item.qty || 0) > 0
        ? `<span style="color:var(--accent)">Listed</span>`
        : `<span style="color:var(--muted)">Out</span>`;

    html += `<tr style="cursor:pointer" onclick="openDrawer('${escAttr(item.id)}')">
      <td class="ih-td-name">${escHtml(item.name)}</td>
      <td>${escHtml(item.category || '—')}</td>
      <td>${fmt(item.cost || 0)}</td>
      <td>${fmt(item.price || 0)}</td>
      <td>${item.qty || 0}</td>
      <td>${status}</td>
      <td class="${profit >= 0 ? 'ih-good' : 'ih-bad'}">${soldQty > 0 ? fmt(profit) : '—'}</td>
    </tr>`;
  }

  html += `</tbody></table></div></div>`;
  el.innerHTML = html;
}
