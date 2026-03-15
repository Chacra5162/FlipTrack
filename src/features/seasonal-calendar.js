/**
 * seasonal-calendar.js — Seasonal Demand Calendar
 * Per-category monthly demand heatmap showing when items sell fastest.
 * "Your Electronics sell 3x faster in November."
 */

import { sales, getInvItem } from '../data/store.js';
import { fmt, escHtml } from '../utils/format.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Compute seasonal velocity data for all categories or a specific one.
 * @param {string} [category] - Optional filter by category
 * @returns {{ months: number[], insights: string[], category: string, totalSales: number }}
 */
export function computeSeasonalData(category) {
  const monthCounts = new Array(12).fill(0);
  const monthRevenue = new Array(12).fill(0);
  let totalSales = 0;

  for (const sale of sales) {
    if (!sale.date) continue;
    const item = getInvItem(sale.itemId);
    if (category && (item?.category || '').toLowerCase() !== category.toLowerCase()) continue;

    const d = new Date(sale.date);
    if (isNaN(d.getTime())) continue;
    const m = d.getMonth();
    monthCounts[m] += (sale.qty || 1);
    monthRevenue[m] += (sale.price || 0) * (sale.qty || 1);
    totalSales++;
  }

  // Generate insights
  const insights = [];
  if (totalSales >= 10) {
    const avg = totalSales / 12;
    const bestMonth = monthCounts.indexOf(Math.max(...monthCounts));
    const nonZeroMonths = monthCounts.filter(c => c > 0);
    const worstMonth = nonZeroMonths.length ? monthCounts.indexOf(Math.min(...nonZeroMonths)) : -1;
    const multiplier = avg > 0 ? (monthCounts[bestMonth] / avg).toFixed(1) : '1.0';

    if (monthCounts[bestMonth] > avg * 1.5) {
      const label = category || 'Your items';
      insights.push(`${label} sell ${multiplier}x faster in ${MONTHS[bestMonth]}`);
    }
    if (worstMonth !== -1 && monthCounts[worstMonth] < avg * 0.5) {
      insights.push(`${MONTHS[worstMonth]} is your slowest month — consider discounting`);
    }
  }

  return { months: monthCounts, revenue: monthRevenue, insights, category: category || 'All Categories', totalSales };
}

/**
 * Render the seasonal calendar heatmap as HTML.
 * @returns {string} HTML string
 */
export function renderSeasonalCalendar() {
  // Need at least 3 months of data
  const allData = computeSeasonalData();
  const monthsWithData = allData.months.filter(c => c > 0).length;
  if (monthsWithData < 3) {
    return `<div style="text-align:center;padding:24px;color:var(--muted);font-size:12px">
      Need at least 3 months of sales history for seasonal trends.
      <br>Currently have ${monthsWithData} month${monthsWithData !== 1 ? 's' : ''} of data.
    </div>`;
  }

  // Get per-category breakdowns
  const cats = new Set();
  for (const sale of sales) {
    const item = getInvItem(sale.itemId);
    if (item?.category) cats.add(item.category);
  }

  const maxAll = Math.max(...allData.months, 1);

  let html = `
    <div style="margin-bottom:16px">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;margin-bottom:8px">Seasonal Trends</div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:12px">Monthly sales velocity across ${allData.totalSales} sales</div>
      ${_renderHeatmapRow('All Categories', allData.months, maxAll)}
      ${allData.insights.map(i => `<div style="font-size:11px;color:var(--accent);margin:4px 0;font-family:'DM Mono',monospace">💡 ${escHtml(i)}</div>`).join('')}
    </div>`;

  // Top categories
  const catRows = [...cats].map(cat => {
    const d = computeSeasonalData(cat);
    if (d.totalSales < 5) return '';
    return _renderHeatmapRow(cat, d.months, maxAll) +
      d.insights.map(i => `<div style="font-size:10px;color:var(--accent);margin:2px 0 6px;font-family:'DM Mono',monospace">💡 ${escHtml(i)}</div>`).join('');
  }).filter(Boolean);

  if (catRows.length) {
    html += `<div style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px">
      <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">By Category</div>
      ${catRows.join('')}
    </div>`;
  }

  return html;
}

function _renderHeatmapRow(label, months, maxVal) {
  const cells = months.map((count, i) => {
    const intensity = maxVal > 0 ? count / maxVal : 0;
    const bg = count === 0 ? 'var(--border)'
      : intensity > 0.75 ? 'rgba(0,200,136,0.8)'
      : intensity > 0.5 ? 'rgba(0,200,136,0.5)'
      : intensity > 0.25 ? 'rgba(0,200,136,0.3)'
      : 'rgba(0,200,136,0.12)';
    return `<div style="flex:1;text-align:center" title="${MONTHS[i]}: ${count} sale${count !== 1 ? 's' : ''}">
      <div style="height:24px;background:${bg};border-radius:3px;margin:0 1px;display:flex;align-items:center;justify-content:center">
        <span style="font-size:9px;font-family:'DM Mono',monospace;color:${intensity > 0.5 ? '#fff' : 'var(--muted)'}">${count || ''}</span>
      </div>
      <div style="font-size:8px;color:var(--muted);margin-top:2px">${MONTHS[i]}</div>
    </div>`;
  }).join('');

  return `<div style="margin-bottom:8px">
    <div style="font-size:11px;font-weight:600;margin-bottom:4px">${escHtml(label)}</div>
    <div style="display:flex;gap:0">${cells}</div>
  </div>`;
}
