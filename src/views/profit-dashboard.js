/**
 * profit-dashboard.js — Profit Dashboard View
 * Comprehensive profit analytics: KPI cards, per-item profit table,
 * platform profit comparison, category profitability, time-series trends.
 */

import { inv, sales, getInvItem, calc, expenses } from '../data/store.js';
import { fmt, pct, ds, escHtml, escAttr, debounce } from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { openDrawer } from '../modals/drawer.js';
import { PLATFORM_FEES } from '../config/platforms.js';

// ── Local state ──────────────────────────────────────────────────────────────
let _sort = 'profit';   // 'profit', 'roi', 'margin', 'revenue', 'name'
let _sortDir = -1;       // -1 = desc, 1 = asc
let _search = '';
let _platFilter = '';
let _catFilter = '';
let _dateRange = 'all';  // 'all', '7d', '30d', '90d', 'ytd'

// ── Helpers ──────────────────────────────────────────────────────────────────

function _dateCutoff() {
  const now = Date.now();
  if (_dateRange === '7d') return now - 7 * 86400000;
  if (_dateRange === '30d') return now - 30 * 86400000;
  if (_dateRange === '90d') return now - 90 * 86400000;
  if (_dateRange === 'ytd') return new Date(new Date().getFullYear(), 0, 1).getTime();
  return 0;
}

function _filteredSales() {
  const cutoff = _dateCutoff();
  return sales.filter(s => new Date(s.date).getTime() >= cutoff);
}

// ── KPI Calculation ──────────────────────────────────────────────────────────

function _calcKPIs(filtSales) {
  let rev = 0, cogs = 0, fees = 0, ship = 0, totalQty = 0;
  for (const s of filtSales) {
    const it = getInvItem(s.itemId);
    const saleRev = (s.price || 0) * (s.qty || 0);
    rev += saleRev;
    cogs += (it ? (it.cost || 0) * (s.qty || 0) : 0);
    fees += (s.fees || 0);
    ship += (s.ship || 0);
    totalQty += (s.qty || 0);
  }
  const totalExpenses = fees + ship;
  const profit = rev - cogs - totalExpenses;
  const margin = rev > 0 ? profit / rev : 0;
  const roi = cogs > 0 ? profit / cogs : 0;
  const avgOrderValue = filtSales.length > 0 ? rev / filtSales.length : 0;
  const avgProfit = filtSales.length > 0 ? profit / filtSales.length : 0;

  // Expenses from expenses table in date range
  const cutoff = _dateCutoff();
  const periodExpenses = (expenses || []).filter(e => new Date(e.date).getTime() >= cutoff);
  const totalBizExpenses = periodExpenses.reduce((a, e) => a + (e.amount || 0), 0);

  return { rev, cogs, fees, ship, totalExpenses, profit, margin, roi, avgOrderValue, avgProfit, totalQty, salesCount: filtSales.length, totalBizExpenses };
}

// ── Per-Item Profitability ───────────────────────────────────────────────────

function _calcItemStats(filtSales) {
  const map = {};
  for (const s of filtSales) {
    const it = getInvItem(s.itemId);
    if (!it) continue;
    if (!map[it.id]) {
      const { m } = calc(it);
      map[it.id] = {
        item: it,
        revenue: 0, cost: 0, fees: 0, ship: 0, profit: 0, unitsSold: 0,
        expectedMargin: m,
        platforms: new Set()
      };
    }
    const r = map[it.id];
    const sRev = (s.price || 0) * (s.qty || 0);
    const sCost = (it.cost || 0) * (s.qty || 0);
    r.revenue += sRev;
    r.cost += sCost;
    r.fees += (s.fees || 0);
    r.ship += (s.ship || 0);
    r.profit += sRev - sCost - (s.fees || 0) - (s.ship || 0);
    r.unitsSold += (s.qty || 0);
    if (s.platform) r.platforms.add(s.platform);
  }

  let results = Object.values(map);

  // Apply filters
  if (_search) {
    const q = _search.toLowerCase();
    results = results.filter(r => r.item.name?.toLowerCase().includes(q) || r.item.sku?.toLowerCase().includes(q));
  }
  if (_platFilter) {
    results = results.filter(r => r.platforms.has(_platFilter));
  }
  if (_catFilter) {
    results = results.filter(r => (r.item.category || '').toLowerCase() === _catFilter.toLowerCase());
  }

  // Calc derived fields
  results.forEach(r => {
    r.margin = r.revenue > 0 ? r.profit / r.revenue : 0;
    r.roi = r.cost > 0 ? r.profit / r.cost : 0;
  });

  // Sort
  results.sort((a, b) => {
    let va, vb;
    if (_sort === 'name') { va = a.item.name || ''; vb = b.item.name || ''; return _sortDir * va.localeCompare(vb); }
    if (_sort === 'profit') { va = a.profit; vb = b.profit; }
    else if (_sort === 'roi') { va = a.roi; vb = b.roi; }
    else if (_sort === 'margin') { va = a.margin; vb = b.margin; }
    else if (_sort === 'revenue') { va = a.revenue; vb = b.revenue; }
    else if (_sort === 'units') { va = a.unitsSold; vb = b.unitsSold; }
    else if (_sort === 'cost') { va = a.cost; vb = b.cost; }
    else { va = a.profit; vb = b.profit; }
    return _sortDir * (va - vb);
  });

  return results;
}

// ── Platform Profit Breakdown ────────────────────────────────────────────────

function _calcPlatformProfit(filtSales) {
  const map = {};
  for (const s of filtSales) {
    const it = getInvItem(s.itemId);
    const plat = s.platform || 'Other';
    if (!map[plat]) map[plat] = { platform: plat, revenue: 0, cost: 0, fees: 0, ship: 0, profit: 0, count: 0, units: 0 };
    const r = map[plat];
    const sRev = (s.price || 0) * (s.qty || 0);
    r.revenue += sRev;
    r.cost += (it ? (it.cost || 0) * (s.qty || 0) : 0);
    r.fees += (s.fees || 0);
    r.ship += (s.ship || 0);
    r.profit += sRev - (it ? (it.cost || 0) * (s.qty || 0) : 0) - (s.fees || 0) - (s.ship || 0);
    r.count++;
    r.units += (s.qty || 0);
  }
  const results = Object.values(map);
  results.forEach(r => { r.margin = r.revenue > 0 ? r.profit / r.revenue : 0; });
  return results.sort((a, b) => b.profit - a.profit);
}

// ── Category Profit Breakdown ────────────────────────────────────────────────

function _calcCategoryProfit(filtSales) {
  const map = {};
  for (const s of filtSales) {
    const it = getInvItem(s.itemId);
    const cat = it?.category || 'Uncategorized';
    if (!map[cat]) map[cat] = { category: cat, revenue: 0, cost: 0, fees: 0, profit: 0, count: 0 };
    const r = map[cat];
    const sRev = (s.price || 0) * (s.qty || 0);
    r.revenue += sRev;
    r.cost += (it ? (it.cost || 0) * (s.qty || 0) : 0);
    r.fees += (s.fees || 0) + (s.ship || 0);
    r.profit += sRev - (it ? (it.cost || 0) * (s.qty || 0) : 0) - (s.fees || 0) - (s.ship || 0);
    r.count++;
  }
  const results = Object.values(map);
  results.forEach(r => { r.margin = r.revenue > 0 ? r.profit / r.revenue : 0; });
  return results.sort((a, b) => b.profit - a.profit);
}

// ── Monthly Trend ────────────────────────────────────────────────────────────

function _calcMonthlyTrend() {
  const map = {};
  for (const s of sales) {
    const d = new Date(s.date);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    if (!map[key]) map[key] = { month: key, revenue: 0, cost: 0, fees: 0, profit: 0, count: 0 };
    const r = map[key];
    const it = getInvItem(s.itemId);
    const sRev = (s.price || 0) * (s.qty || 0);
    r.revenue += sRev;
    r.cost += (it ? (it.cost || 0) * (s.qty || 0) : 0);
    r.fees += (s.fees || 0) + (s.ship || 0);
    r.profit += sRev - (it ? (it.cost || 0) * (s.qty || 0) : 0) - (s.fees || 0) - (s.ship || 0);
    r.count++;
  }
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
}

// ── Top / Bottom Performers ──────────────────────────────────────────────────

function _topBottom(itemStats, n = 5) {
  const sold = itemStats.filter(r => r.unitsSold > 0);
  const top = [...sold].sort((a, b) => b.profit - a.profit).slice(0, n);
  const bottom = [...sold].sort((a, b) => a.profit - b.profit).slice(0, n);
  return { top, bottom };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════════

export function renderProfitDashboard() {
  const container = document.getElementById('profitDashContent');
  if (!container) return;

  const filtSales = _filteredSales();
  const kpi = _calcKPIs(filtSales);
  const itemStats = _calcItemStats(filtSales);
  const platProfit = _calcPlatformProfit(filtSales);
  const catProfit = _calcCategoryProfit(filtSales);
  const monthly = _calcMonthlyTrend();
  const { top, bottom } = _topBottom(itemStats);

  // Collect unique platforms and categories for filter dropdowns
  const allPlats = [...new Set(sales.map(s => s.platform).filter(Boolean))].sort();
  const allCats = [...new Set(inv.map(i => i.category).filter(Boolean))].sort();

  // Monthly chart — bar chart via CSS
  const maxProfit = Math.max(...monthly.map(m => Math.abs(m.profit)), 1);

  container.innerHTML = `
    <!-- FILTER BAR -->
    <div class="pd-filters">
      <div class="pd-date-tabs">
        ${['7d', '30d', '90d', 'ytd', 'all'].map(d => `<button class="pd-date-tab${_dateRange === d ? ' active' : ''}" onclick="setProfitDateRange('${d}')">${d === 'all' ? 'All Time' : d === 'ytd' ? 'YTD' : d.replace('d', ' Days')}</button>`).join('')}
      </div>
      <input class="pd-search" type="text" placeholder="Search items…" value="${escHtml(_search)}" oninput="setProfitSearch(this.value)">
      <select class="pd-select" onchange="setProfitPlatFilter(this.value)">
        <option value="">All Platforms</option>
        ${allPlats.map(p => `<option value="${escHtml(p)}"${_platFilter === p ? ' selected' : ''}>${escHtml(p)}</option>`).join('')}
      </select>
      <select class="pd-select" onchange="setProfitCatFilter(this.value)">
        <option value="">All Categories</option>
        ${allCats.map(c => `<option value="${escHtml(c)}"${_catFilter === c ? ' selected' : ''}>${escHtml(c)}</option>`).join('')}
      </select>
    </div>

    <!-- KPI CARDS -->
    <div class="pd-kpi-grid">
      <div class="pd-kpi c3">
        <div class="pd-kpi-label">Net Profit</div>
        <div class="pd-kpi-value" style="color:${kpi.profit >= 0 ? 'var(--good)' : 'var(--bad)'}">${fmt(kpi.profit)}</div>
        <div class="pd-kpi-sub">${pct(kpi.margin)} margin</div>
      </div>
      <div class="pd-kpi c2">
        <div class="pd-kpi-label">Revenue</div>
        <div class="pd-kpi-value">${fmt(kpi.rev)}</div>
        <div class="pd-kpi-sub">${kpi.salesCount} sales · ${kpi.totalQty} units</div>
      </div>
      <div class="pd-kpi c4">
        <div class="pd-kpi-label">ROI</div>
        <div class="pd-kpi-value">${kpi.roi > 0 ? pct(kpi.roi) : '—'}</div>
        <div class="pd-kpi-sub">${fmt(kpi.cogs)} invested</div>
      </div>
      <div class="pd-kpi c1">
        <div class="pd-kpi-label">Avg Profit / Sale</div>
        <div class="pd-kpi-value">${fmt(kpi.avgProfit)}</div>
        <div class="pd-kpi-sub">${fmt(kpi.avgOrderValue)} avg sale</div>
      </div>
      <div class="pd-kpi c5">
        <div class="pd-kpi-label">Total Fees + Shipping</div>
        <div class="pd-kpi-value" style="color:var(--bad)">${fmt(kpi.totalExpenses)}</div>
        <div class="pd-kpi-sub">${fmt(kpi.fees)} fees · ${fmt(kpi.ship)} shipping</div>
      </div>
      <div class="pd-kpi" style="border-left:3px solid var(--muted)">
        <div class="pd-kpi-label">Business Expenses</div>
        <div class="pd-kpi-value">${fmt(kpi.totalBizExpenses)}</div>
        <div class="pd-kpi-sub">True profit: ${fmt(kpi.profit - kpi.totalBizExpenses)}</div>
      </div>
    </div>

    <!-- MONTHLY TREND + TOP/BOTTOM split -->
    <div class="pd-row">
      <div class="panel pd-panel-wide">
        <div class="panel-header"><div class="panel-title">Monthly Profit Trend</div></div>
        ${monthly.length ? `
        <div class="pd-chart">
          ${monthly.map(m => {
            const h = Math.round(Math.abs(m.profit) / maxProfit * 100);
            const color = m.profit >= 0 ? 'var(--good)' : 'var(--bad)';
            const label = m.month.split('-');
            const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(label[1]) - 1];
            return `<div class="pd-bar-col">
              <div class="pd-bar-val" style="color:${color}">${fmt(m.profit)}</div>
              <div class="pd-bar-wrap"><div class="pd-bar" style="height:${h}%;background:${color}"></div></div>
              <div class="pd-bar-label">${mo}</div>
              <div class="pd-bar-sub">${m.count} sales</div>
            </div>`;
          }).join('')}
        </div>` : '<div class="pd-empty">No sales data yet</div>'}
      </div>

      <div class="pd-side-col">
        <!-- Top Performers -->
        <div class="panel">
          <div class="panel-header"><div class="panel-title">🏆 Top Earners</div></div>
          ${top.length ? top.map((r, i) => `
            <div class="pd-rank-item" onclick="openDrawer('${escAttr(r.item.id)}')" style="cursor:pointer">
              <span class="pd-rank">${i + 1}</span>
              <div class="pd-rank-info">
                <div class="pd-rank-name">${escHtml(r.item.name)}</div>
                <div class="pd-rank-meta">${r.unitsSold} sold · ${pct(r.margin)} margin</div>
              </div>
              <span class="pd-rank-profit" style="color:var(--good)">${fmt(r.profit)}</span>
            </div>
          `).join('') : '<div class="pd-empty">No sales yet</div>'}
        </div>
        <!-- Bottom Performers -->
        <div class="panel">
          <div class="panel-header"><div class="panel-title">📉 Lowest Margin</div></div>
          ${bottom.length ? bottom.map((r, i) => `
            <div class="pd-rank-item" onclick="openDrawer('${escAttr(r.item.id)}')" style="cursor:pointer">
              <span class="pd-rank">${i + 1}</span>
              <div class="pd-rank-info">
                <div class="pd-rank-name">${escHtml(r.item.name)}</div>
                <div class="pd-rank-meta">${r.unitsSold} sold · ${pct(r.margin)} margin</div>
              </div>
              <span class="pd-rank-profit" style="color:${r.profit < 0 ? 'var(--bad)' : 'var(--muted)'}">${fmt(r.profit)}</span>
            </div>
          `).join('') : '<div class="pd-empty">No sales yet</div>'}
        </div>
      </div>
    </div>

    <!-- PLATFORM & CATEGORY PROFIT side by side -->
    <div class="pd-row">
      <div class="panel">
        <div class="panel-header"><div class="panel-title">Profit by Platform</div></div>
        ${platProfit.length ? `<table class="pd-table">
          <thead><tr><th>Platform</th><th>Revenue</th><th>Fees</th><th>Profit</th><th>Margin</th><th>Sales</th></tr></thead>
          <tbody>${platProfit.map(p => `<tr>
            <td style="font-weight:600">${escHtml(p.platform)}</td>
            <td>${fmt(p.revenue)}</td>
            <td style="color:var(--bad)">${fmt(p.fees + p.ship)}</td>
            <td style="color:${p.profit >= 0 ? 'var(--good)' : 'var(--bad)'}; font-weight:700">${fmt(p.profit)}</td>
            <td>${pct(p.margin)}</td>
            <td>${p.count}</td>
          </tr>`).join('')}</tbody>
        </table>` : '<div class="pd-empty">No sales yet</div>'}
      </div>
      <div class="panel">
        <div class="panel-header"><div class="panel-title">Profit by Category</div></div>
        ${catProfit.length ? `<table class="pd-table">
          <thead><tr><th>Category</th><th>Revenue</th><th>Profit</th><th>Margin</th><th>Items</th></tr></thead>
          <tbody>${catProfit.map(c => `<tr>
            <td style="font-weight:600">${escHtml(c.category)}</td>
            <td>${fmt(c.revenue)}</td>
            <td style="color:${c.profit >= 0 ? 'var(--good)' : 'var(--bad)'}; font-weight:700">${fmt(c.profit)}</td>
            <td>${pct(c.margin)}</td>
            <td>${c.count}</td>
          </tr>`).join('')}</tbody>
        </table>` : '<div class="pd-empty">No sales yet</div>'}
      </div>
    </div>

    <!-- PER-ITEM PROFIT TABLE -->
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Per-Item Profitability</div>
        <span style="font-size:10px;color:var(--muted)">${itemStats.length} items</span>
      </div>
      ${itemStats.length ? `<div style="overflow-x:auto"><table class="pd-table">
        <thead><tr>
          <th class="pd-sortable" onclick="setProfitSort('name')">Item ${_sort === 'name' ? (_sortDir > 0 ? '↑' : '↓') : ''}</th>
          <th class="pd-sortable" onclick="setProfitSort('cost')">Cost ${_sort === 'cost' ? (_sortDir > 0 ? '↑' : '↓') : ''}</th>
          <th class="pd-sortable" onclick="setProfitSort('revenue')">Revenue ${_sort === 'revenue' ? (_sortDir > 0 ? '↑' : '↓') : ''}</th>
          <th class="pd-sortable" onclick="setProfitSort('units')">Units ${_sort === 'units' ? (_sortDir > 0 ? '↑' : '↓') : ''}</th>
          <th class="pd-sortable" onclick="setProfitSort('profit')">Profit ${_sort === 'profit' ? (_sortDir > 0 ? '↑' : '↓') : ''}</th>
          <th class="pd-sortable" onclick="setProfitSort('margin')">Margin ${_sort === 'margin' ? (_sortDir > 0 ? '↑' : '↓') : ''}</th>
          <th class="pd-sortable" onclick="setProfitSort('roi')">ROI ${_sort === 'roi' ? (_sortDir > 0 ? '↑' : '↓') : ''}</th>
        </tr></thead>
        <tbody>${itemStats.slice(0, 100).map(r => `<tr onclick="openDrawer('${escAttr(r.item.id)}')" style="cursor:pointer">
          <td>
            <div style="font-weight:600;font-size:12px">${escHtml(r.item.name)}</div>
            <div style="font-size:10px;color:var(--muted)">${escHtml(r.item.category || '')}${r.platforms.size ? ' · ' + [...r.platforms].map(p => escHtml(p)).join(', ') : ''}</div>
          </td>
          <td>${fmt(r.cost)}</td>
          <td>${fmt(r.revenue)}</td>
          <td>${r.unitsSold}</td>
          <td style="color:${r.profit >= 0 ? 'var(--good)' : 'var(--bad)'};font-weight:700">${fmt(r.profit)}</td>
          <td><span class="margin-badge ${r.margin >= 0.5 ? 'high' : r.margin >= 0.2 ? 'mid' : 'low'}">${pct(r.margin)}</span></td>
          <td>${r.roi > 0 ? pct(r.roi) : '—'}</td>
        </tr>`).join('')}</tbody>
      </table></div>` : '<div class="pd-empty">No sold items match your filters</div>'}
      ${itemStats.length > 100 ? `<div style="padding:8px;font-size:10px;color:var(--muted);text-align:center">Showing top 100 of ${itemStats.length} items</div>` : ''}
    </div>
  `;
}

// ── Filter setters (called from HTML) ────────────────────────────────────────

export function setProfitDateRange(range) {
  _dateRange = range;
  renderProfitDashboard();
}

let _profitSearchTimer = null;
export function setProfitSearch(val) {
  _search = (val || '').trim();
  clearTimeout(_profitSearchTimer);
  _profitSearchTimer = setTimeout(renderProfitDashboard, 200);
}

export function setProfitPlatFilter(val) {
  _platFilter = val || '';
  renderProfitDashboard();
}

export function setProfitCatFilter(val) {
  _catFilter = val || '';
  renderProfitDashboard();
}

export function setProfitSort(col) {
  if (_sort === col) {
    _sortDir *= -1;
  } else {
    _sort = col;
    _sortDir = col === 'name' ? 1 : -1;
  }
  renderProfitDashboard();
}
