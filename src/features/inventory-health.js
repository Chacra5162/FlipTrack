/**
 * inventory-health.js — Inventory Health Dashboard
 * Aging breakdown, turnover rates, ROI ranking, composition charts,
 * and actionable insights about where money is stuck.
 */

import { inv, sales, getInvItem, getSalesForItem } from '../data/store.js';
import { fmt, pct, ds, escHtml, escAttr, daysSince } from '../utils/format.js';

// ── AGING BUCKETS ─────────────────────────────────────────────────────────
const AGING_BUCKETS = [
  { label: '0–30 days',  max: 30,  cls: 'age-fresh' },
  { label: '31–60 days', max: 60,  cls: 'age-aging' },
  { label: '61–90 days', max: 90,  cls: 'age-stale' },
  { label: '90+ days',   max: Infinity, cls: 'age-dead' },
];

// Use daysSince with 999 fallback for items with no date (treated as very old)
const _daysSince = d => daysSince(d, 999);

// ── COMPUTE HEALTH METRICS ────────────────────────────────────────────────

export function computeInventoryHealth() {
  const now = Date.now();
  const unsold = inv.filter(i => !i.sold && !i.deleted);
  const allSales = sales.filter(s => s.price > 0);

  // 1. Aging breakdown
  const aging = AGING_BUCKETS.map(b => ({ ...b, items: [], value: 0, count: 0 }));
  for (const item of unsold) {
    const days = _daysSince(item.added);
    const bucket = aging.find(b => days <= b.max) || aging[aging.length - 1];
    bucket.items.push(item);
    bucket.value += (item.price || 0);
    bucket.count++;
  }

  // 2. Turnover by category
  const catStats = {};
  for (const item of inv) {
    const cat = item.category || 'Uncategorized';
    if (!catStats[cat]) catStats[cat] = { listed: 0, sold: 0, revenue: 0, cost: 0, totalDays: 0 };
    if (item.sold) {
      catStats[cat].sold++;
      const sale = getSalesForItem(item.id)[0];
      if (sale) {
        catStats[cat].revenue += sale.price || 0;
        catStats[cat].totalDays += _daysSince(item.added);
      }
    }
    if (!item.deleted) catStats[cat].listed++;
    catStats[cat].cost += (item.cost || 0);
  }
  const turnover = Object.entries(catStats)
    .map(([cat, s]) => ({
      category: cat,
      listed: s.listed,
      sold: s.sold,
      sellThrough: s.listed > 0 ? (s.sold / s.listed) : 0,
      avgDaysToSell: s.sold > 0 ? Math.round(s.totalDays / s.sold) : null,
      revenue: s.revenue,
      profit: s.revenue - s.cost,
      roi: s.cost > 0 ? ((s.revenue - s.cost) / s.cost) : 0,
    }))
    .sort((a, b) => b.sellThrough - a.sellThrough);

  // 3. ROI ranking (top & bottom items)
  const soldItems = [];
  for (const sale of allSales) {
    const item = getInvItem(sale.itemId);
    if (!item) continue;
    const profit = (sale.price || 0) - (item.cost || 0) - (item.fees || 0) - (item.ship || 0);
    const roi = item.cost > 0 ? (profit / item.cost) : 0;
    soldItems.push({
      id: item.id,
      name: item.name || 'Unnamed',
      cost: item.cost || 0,
      soldPrice: sale.price || 0,
      profit,
      roi,
      daysToSell: _daysSince(item.added),
      category: item.category || 'Uncategorized',
    });
  }
  const topROI = [...soldItems].sort((a, b) => b.roi - a.roi).slice(0, 8);
  const bottomROI = [...soldItems].sort((a, b) => a.roi - b.roi).slice(0, 8);

  // 4. Composition breakdown
  const composition = { byCategory: {}, byCondition: {}, byPlatform: {} };
  for (const item of unsold) {
    const cat = item.category || 'Uncategorized';
    const cond = item.condition || 'Unknown';
    composition.byCategory[cat] = (composition.byCategory[cat] || 0) + 1;
    composition.byCondition[cond] = (composition.byCondition[cond] || 0) + 1;
    const plats = item.platforms || item.platform || '';
    const platList = typeof plats === 'string' ? plats.split(',').map(p => p.trim()).filter(Boolean) : (Array.isArray(plats) ? plats : []);
    if (platList.length === 0) platList.push('Unlisted');
    for (const p of platList) {
      composition.byPlatform[p] = (composition.byPlatform[p] || 0) + 1;
    }
  }

  // 5. Summary metrics
  const totalValue = unsold.reduce((s, i) => s + (i.price || 0), 0);
  const totalCost = unsold.reduce((s, i) => s + (i.cost || 0), 0);
  const avgAge = unsold.length > 0
    ? Math.round(unsold.reduce((s, i) => s + _daysSince(i.added), 0) / unsold.length)
    : 0;
  const staleCount = aging.filter(b => b.max >= 61).reduce((s, b) => s + b.count, 0);
  const staleValue = aging.filter(b => b.max >= 61).reduce((s, b) => s + b.value, 0);

  return { aging, turnover, topROI, bottomROI, composition, totalValue, totalCost, avgAge, staleCount, staleValue, unsoldCount: unsold.length };
}

// ── RENDER ─────────────────────────────────────────────────────────────────

export function renderInventoryHealth() {
  const el = document.getElementById('invHealthContent');
  if (!el) return;

  const h = computeInventoryHealth();

  // Summary cards
  const summaryHtml = `
    <div class="ih-summary">
      <div class="ih-card">
        <div class="ih-card-val">${h.unsoldCount}</div>
        <div class="ih-card-lbl">Active Items</div>
      </div>
      <div class="ih-card">
        <div class="ih-card-val">${fmt(h.totalValue)}</div>
        <div class="ih-card-lbl">Listed Value</div>
      </div>
      <div class="ih-card">
        <div class="ih-card-val">${fmt(h.totalCost)}</div>
        <div class="ih-card-lbl">Invested</div>
      </div>
      <div class="ih-card">
        <div class="ih-card-val">${h.avgAge}d</div>
        <div class="ih-card-lbl">Avg Age</div>
      </div>
      <div class="ih-card ih-card-warn">
        <div class="ih-card-val">${h.staleCount}</div>
        <div class="ih-card-lbl">Stale (60d+)</div>
      </div>
      <div class="ih-card ih-card-warn">
        <div class="ih-card-val">${fmt(h.staleValue)}</div>
        <div class="ih-card-lbl">$ Stuck</div>
      </div>
    </div>`;

  // Aging bars
  const maxBucket = Math.max(...h.aging.map(b => b.count), 1);
  const agingHtml = `
    <div class="ih-section">
      <div class="ih-section-hdr">📊 Inventory Aging</div>
      <div class="ih-aging-grid">
        ${h.aging.map(b => `
          <div class="ih-age-row">
            <div class="ih-age-label">${b.label}</div>
            <div class="ih-age-bar-wrap">
              <div class="ih-age-bar ${b.cls}" style="width:${Math.max(4, (b.count / maxBucket) * 100)}%"></div>
            </div>
            <div class="ih-age-count">${b.count} items</div>
            <div class="ih-age-val">${fmt(b.value)}</div>
          </div>
        `).join('')}
      </div>
    </div>`;

  // Turnover table
  const turnoverHtml = `
    <div class="ih-section">
      <div class="ih-section-hdr">🔄 Category Turnover</div>
      <div class="ih-table-wrap">
        <table class="ih-table">
          <thead><tr>
            <th>Category</th><th>Listed</th><th>Sold</th><th>Sell-Through</th><th>Avg Days</th><th>ROI</th>
          </tr></thead>
          <tbody>
            ${h.turnover.slice(0, 12).map(t => `<tr>
              <td class="ih-td-name">${escHtml(t.category)}</td>
              <td>${t.listed}</td>
              <td>${t.sold}</td>
              <td><span class="ih-pct ${t.sellThrough >= 0.5 ? 'ih-good' : t.sellThrough >= 0.25 ? 'ih-ok' : 'ih-bad'}">${Math.round(t.sellThrough * 100)}%</span></td>
              <td>${t.avgDaysToSell !== null ? t.avgDaysToSell + 'd' : '—'}</td>
              <td class="${t.roi >= 1 ? 'ih-good' : t.roi >= 0.3 ? 'ih-ok' : 'ih-bad'}">${Math.round(t.roi * 100)}%</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  // ROI ranking
  const roiHtml = `
    <div class="ih-section ih-roi-section">
      <div class="ih-roi-col">
        <div class="ih-section-hdr">🏆 Top ROI Items</div>
        ${h.topROI.map(i => `
          <div class="ih-roi-row" onclick="openDrawer('${escAttr(i.id)}')">
            <div class="ih-roi-name">${escHtml(i.name.slice(0, 40))}</div>
            <div class="ih-roi-meta">${escHtml(i.category)} · ${fmt(i.cost)} → ${fmt(i.soldPrice)}</div>
            <div class="ih-roi-val ih-good">+${Math.round(i.roi * 100)}% ROI</div>
          </div>
        `).join('') || '<div class="ih-empty">No sales yet</div>'}
      </div>
      <div class="ih-roi-col">
        <div class="ih-section-hdr">⚠️ Worst ROI Items</div>
        ${h.bottomROI.map(i => `
          <div class="ih-roi-row" onclick="openDrawer('${escAttr(i.id)}')">
            <div class="ih-roi-name">${escHtml(i.name.slice(0, 40))}</div>
            <div class="ih-roi-meta">${escHtml(i.category)} · ${fmt(i.cost)} → ${fmt(i.soldPrice)}</div>
            <div class="ih-roi-val ih-bad">${i.roi >= 0 ? '+' : ''}${Math.round(i.roi * 100)}% ROI</div>
          </div>
        `).join('') || '<div class="ih-empty">No sales yet</div>'}
      </div>
    </div>`;

  // Composition donut-style bars
  const compHtml = _renderComposition(h.composition, h.unsoldCount);

  el.innerHTML = summaryHtml + agingHtml + turnoverHtml + roiHtml + compHtml;
}

function _renderComposition(comp, total) {
  const colors = ['var(--accent)', 'var(--accent2)', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4', '#e91e63', '#795548'];

  function barChart(data, label) {
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (!sorted.length) return '';
    const max = sorted[0][1];
    return `
      <div class="ih-comp-group">
        <div class="ih-comp-title">${label}</div>
        ${sorted.map(([name, count], i) => `
          <div class="ih-comp-row">
            <div class="ih-comp-name">${escHtml(name)}</div>
            <div class="ih-comp-bar-wrap">
              <div class="ih-comp-bar" style="width:${Math.max(6, (count / max) * 100)}%;background:${colors[i % colors.length]}"></div>
            </div>
            <div class="ih-comp-count">${count} <span class="ih-comp-pct">(${Math.round(count / total * 100)}%)</span></div>
          </div>
        `).join('')}
      </div>`;
  }

  return `
    <div class="ih-section">
      <div class="ih-section-hdr">📦 Inventory Composition</div>
      <div class="ih-comp-grid">
        ${barChart(comp.byCategory, 'By Category')}
        ${barChart(comp.byCondition, 'By Condition')}
        ${barChart(comp.byPlatform, 'By Platform')}
      </div>
    </div>`;
}
