/**
 * period-compare.js — Period-over-Period Reports
 * Compare this week vs last week, this month vs last month.
 * Trending arrows on KPIs. Seasonality detection by category.
 */

import { inv, sales, expenses, getInvItem } from '../data/store.js';
import { fmt, pct, escHtml, addlFee } from '../utils/format.js';

// ── DATE HELPERS ──────────────────────────────────────────────────────────

function _startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function _daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0,0,0,0); return d; }
function _startOfWeek(d) { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); x.setHours(0,0,0,0); return x; }
function _startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function _inRange(dateStr, from, to) {
  if (!dateStr) return false;
  const d = new Date(dateStr).getTime();
  return d >= from.getTime() && d < to.getTime();
}

// ── COMPUTE PERIOD METRICS ────────────────────────────────────────────────

function _periodMetrics(fromDate, toDate) {
  const periodSales = sales.filter(s => _inRange(s.date, fromDate, toDate) && s.price > 0);
  const periodExpenses = expenses.filter(e => _inRange(e.date, fromDate, toDate));
  const periodItems = inv.filter(i => _inRange(i.date || i.createdAt, fromDate, toDate) && !i.deleted);

  const revenue = periodSales.reduce((s, sale) => s + (sale.price || 0), 0);
  const cost = periodSales.reduce((s, sale) => {
    const item = getInvItem(sale.itemId);
    return s + (item?.cost || 0);
  }, 0);
  const fees = periodSales.reduce((s, sale) => {
    const item = getInvItem(sale.itemId);
    return s + (item?.fees || 0) + (sale.fees || 0) + addlFee(sale);
  }, 0);
  const expTotal = periodExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const profit = revenue - cost - fees;
  const netProfit = profit - expTotal;
  const itemsListed = periodItems.length;
  const itemsSold = periodSales.length;
  const avgPrice = itemsSold > 0 ? revenue / itemsSold : 0;

  return { revenue, cost, profit, netProfit, fees, expenses: expTotal, itemsListed, itemsSold, avgPrice };
}

export function computePeriodComparison() {
  const now = new Date();

  // This week vs last week
  const thisWeekStart = _startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const thisWeek = _periodMetrics(thisWeekStart, now);
  const lastWeek = _periodMetrics(lastWeekStart, thisWeekStart);

  // This month vs last month
  const thisMonthStart = _startOfMonth(now);
  const lastMonthStart = new Date(thisMonthStart); lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const thisMonth = _periodMetrics(thisMonthStart, now);
  const lastMonth = _periodMetrics(lastMonthStart, thisMonthStart);

  // Last 30 days vs previous 30 days
  const last30Start = _daysAgo(30);
  const prev30Start = _daysAgo(60);
  const last30 = _periodMetrics(last30Start, now);
  const prev30 = _periodMetrics(prev30Start, last30Start);

  // Seasonality: monthly revenue for past 12 months
  const monthlyData = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const m = _periodMetrics(d, next);
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthlyData.push({ label, ...m });
  }

  return {
    weekly: { current: thisWeek, previous: lastWeek, label: 'Week' },
    monthly: { current: thisMonth, previous: lastMonth, label: 'Month' },
    rolling: { current: last30, previous: prev30, label: '30 Days' },
    monthlyData,
  };
}

// ── RENDER ─────────────────────────────────────────────────────────────────

function _trendArrow(curr, prev) {
  if (prev === 0 && curr === 0) return '<span class="pc-flat">—</span>';
  if (prev === 0 && curr > 0) return '<span class="pc-up">↑ New</span>';
  if (prev === 0 && curr < 0) return '<span class="pc-down">↓ New</span>';
  if (prev === 0) return '<span class="pc-flat">→ 0%</span>';
  const change = ((curr - prev) / Math.abs(prev)) * 100;
  if (Math.abs(change) < 1) return '<span class="pc-flat">→ 0%</span>';
  if (change > 0) return `<span class="pc-up">↑ ${Math.round(change)}%</span>`;
  return `<span class="pc-down">↓ ${Math.abs(Math.round(change))}%</span>`;
}

function _renderPeriodBlock(data, title) {
  const c = data.current;
  const p = data.previous;
  const metrics = [
    { label: 'Revenue', curr: c.revenue, prev: p.revenue, fmt: true },
    { label: 'Profit', curr: c.profit, prev: p.profit, fmt: true },
    { label: 'Items Sold', curr: c.itemsSold, prev: p.itemsSold, fmt: false },
    { label: 'Items Listed', curr: c.itemsListed, prev: p.itemsListed, fmt: false },
    { label: 'Avg Sale', curr: c.avgPrice, prev: p.avgPrice, fmt: true },
    { label: 'Expenses', curr: c.expenses, prev: p.expenses, fmt: true },
  ];

  return `
    <div class="pc-block">
      <div class="pc-block-hdr">${title}</div>
      <div class="pc-metrics">
        ${metrics.map(m => `
          <div class="pc-metric">
            <div class="pc-metric-lbl">${m.label}</div>
            <div class="pc-metric-row">
              <div class="pc-metric-val">${m.fmt ? fmt(m.curr) : m.curr}</div>
              ${_trendArrow(m.curr, m.prev)}
            </div>
            <div class="pc-metric-prev">vs ${m.fmt ? fmt(m.prev) : m.prev}</div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

function _renderMonthlyChart(monthlyData) {
  const maxRev = Math.max(...monthlyData.map(m => m.revenue), 1);
  const maxProfit = Math.max(...monthlyData.map(m => Math.abs(m.profit)), 1);

  return `
    <div class="ih-section">
      <div class="ih-section-hdr">📈 12-Month Trend</div>
      <div class="pc-chart">
        <div class="pc-chart-bars">
          ${monthlyData.map(m => {
            const revH = Math.max(4, (m.revenue / maxRev) * 80);
            const profH = Math.max(2, (Math.abs(m.profit) / maxProfit) * 80);
            return `
              <div class="pc-chart-col" title="${m.label}: ${fmt(m.revenue)} rev / ${fmt(m.profit)} profit">
                <div class="pc-chart-bar-rev" style="height:${revH}px"></div>
                <div class="pc-chart-bar-prof ${m.profit >= 0 ? '' : 'pc-chart-bar-loss'}" style="height:${profH}px"></div>
                <div class="pc-chart-lbl">${m.label}</div>
              </div>`;
          }).join('')}
        </div>
        <div class="pc-chart-legend">
          <span><span class="pc-legend-dot" style="background:var(--accent)"></span> Revenue</span>
          <span><span class="pc-legend-dot" style="background:var(--accent2)"></span> Profit</span>
        </div>
      </div>
    </div>`;
}

export function renderPeriodCompare() {
  const el = document.getElementById('periodCompareContent');
  if (!el) return;

  const d = computePeriodComparison();

  const blocksHtml = `
    <div class="pc-grid">
      ${_renderPeriodBlock(d.weekly, '📅 This Week vs Last Week')}
      ${_renderPeriodBlock(d.monthly, '📆 This Month vs Last Month')}
      ${_renderPeriodBlock(d.rolling, '📊 Last 30 Days vs Previous 30')}
    </div>`;

  const chartHtml = _renderMonthlyChart(d.monthlyData);

  // Monthly summary table
  const tableHtml = `
    <div class="ih-section">
      <div class="ih-section-hdr">📋 Monthly Breakdown</div>
      <div class="ih-table-wrap">
        <table class="ih-table">
          <thead><tr><th>Month</th><th>Revenue</th><th>Profit</th><th>Sold</th><th>Listed</th><th>Avg Sale</th></tr></thead>
          <tbody>
            ${d.monthlyData.slice().reverse().map(m => `<tr>
              <td>${m.label}</td>
              <td>${fmt(m.revenue)}</td>
              <td class="${m.profit >= 0 ? 'ih-good' : 'ih-bad'}">${fmt(m.profit)}</td>
              <td>${m.itemsSold}</td>
              <td>${m.itemsListed}</td>
              <td>${fmt(m.avgPrice)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  el.innerHTML = blocksHtml + chartHtml + tableHtml;
}
