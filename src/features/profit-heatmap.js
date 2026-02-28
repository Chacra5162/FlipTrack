/**
 * profit-heatmap.js — GitHub-style profit calendar heatmap
 * Shows daily profit for the last 365 days as colored squares.
 * Green = profit, red = loss, darker = higher amount.
 */

import { sales, expenses, getInvItem } from '../data/store.js';
import { fmt } from '../utils/format.js';

/**
 * Build daily profit map for the last N days
 */
function buildDailyProfitMap(days = 365) {
  const map = {};
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);

  // Revenue & COGS from sales
  for (const s of sales) {
    const d = (s.date || '').slice(0, 10);
    if (!d || new Date(d) < cutoff) continue;
    const it = getInvItem(s.itemId);
    const rev = (s.price || 0) * (s.qty || 0);
    const cogs = it ? (it.cost || 0) * (s.qty || 0) : 0;
    const fees = (s.fees || 0) + (s.ship || 0);
    const profit = rev - cogs - fees;
    map[d] = (map[d] || 0) + profit;
  }

  // Subtract expenses
  for (const e of expenses) {
    const d = (e.date || '').slice(0, 10);
    if (!d || new Date(d) < cutoff) continue;
    map[d] = (map[d] || 0) - (e.amount || 0);
  }

  return map;
}

/**
 * Get color for a profit value
 */
function profitColor(val, maxAbs) {
  if (val === 0 || !maxAbs) return 'var(--border)';
  const ratio = Math.min(Math.abs(val) / maxAbs, 1);

  if (val > 0) {
    // Green shades
    const levels = [
      'rgba(0,200,136,0.15)',
      'rgba(0,200,136,0.3)',
      'rgba(0,200,136,0.5)',
      'rgba(0,200,136,0.75)',
      'rgba(0,200,136,1)',
    ];
    const idx = Math.min(Math.floor(ratio * 5), 4);
    return levels[idx];
  } else {
    // Red shades
    const levels = [
      'rgba(255,107,53,0.15)',
      'rgba(255,107,53,0.3)',
      'rgba(255,107,53,0.5)',
      'rgba(255,107,53,0.75)',
      'rgba(255,107,53,1)',
    ];
    const idx = Math.min(Math.floor(ratio * 5), 4);
    return levels[idx];
  }
}

/**
 * Render the heatmap as an HTML string.
 * Returns self-contained HTML for insertion into a container.
 */
export function renderProfitHeatmap() {
  const profitMap = buildDailyProfitMap(365);
  const values = Object.values(profitMap);
  const maxAbs = values.length ? Math.max(...values.map(Math.abs)) : 1;

  const now = new Date();
  const dayMs = 86400000;

  // Build 52 weeks + partial current week
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay(); // 0=Sun
  const startDate = new Date(today.getTime() - (52 * 7 + dayOfWeek) * dayMs);

  // Month labels
  const months = [];
  let lastMonth = -1;

  // Build week columns
  let html = '<div class="heatmap-wrap">';
  html += '<div class="heatmap-grid">';

  // Day labels column
  html += '<div class="heatmap-days">';
  html += '<div class="hm-day-lbl"></div>';
  html += '<div class="hm-day-lbl">Mon</div>';
  html += '<div class="hm-day-lbl"></div>';
  html += '<div class="hm-day-lbl">Wed</div>';
  html += '<div class="hm-day-lbl"></div>';
  html += '<div class="hm-day-lbl">Fri</div>';
  html += '<div class="hm-day-lbl"></div>';
  html += '</div>';

  const totalWeeks = 53;
  for (let w = 0; w < totalWeeks; w++) {
    html += '<div class="hm-week">';
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(startDate.getTime() + (w * 7 + d) * dayMs);
      if (cellDate > today) {
        html += '<div class="hm-cell empty"></div>';
        continue;
      }

      const key = cellDate.toISOString().slice(0, 10);
      const val = profitMap[key] || 0;
      const color = profitColor(val, maxAbs);
      const title = `${key}: ${val >= 0 ? '+' : ''}${fmt(val)}`;

      // Track month labels
      const mo = cellDate.getMonth();
      if (d === 0 && mo !== lastMonth) {
        months.push({ week: w, label: cellDate.toLocaleString('en-US', { month: 'short' }) });
        lastMonth = mo;
      }

      html += `<div class="hm-cell" style="background:${color}" title="${title}"></div>`;
    }
    html += '</div>';
  }

  html += '</div>';

  // Month label row
  html += '<div class="hm-months">';
  html += '<div style="width:26px"></div>'; // spacer for day labels
  let prevWeek = 0;
  for (const m of months) {
    const gap = (m.week - prevWeek) * 13; // 11px cell + 2px gap
    html += `<span style="margin-left:${gap}px">${m.label}</span>`;
    prevWeek = m.week + 3; // approx width of label
  }
  html += '</div>';

  // Legend
  const totalProfit = values.reduce((a, v) => a + v, 0);
  const profitDays = values.filter(v => v > 0).length;
  const lossDays = values.filter(v => v < 0).length;
  html += `<div class="hm-legend">
    <span class="hm-stat">${fmt(totalProfit)} net · ${profitDays} profit days · ${lossDays} loss days</span>
    <div class="hm-scale">
      <span>Less</span>
      <div class="hm-cell" style="background:rgba(255,107,53,0.5)"></div>
      <div class="hm-cell" style="background:rgba(255,107,53,0.2)"></div>
      <div class="hm-cell" style="background:var(--border)"></div>
      <div class="hm-cell" style="background:rgba(0,200,136,0.2)"></div>
      <div class="hm-cell" style="background:rgba(0,200,136,0.5)"></div>
      <div class="hm-cell" style="background:rgba(0,200,136,1)"></div>
      <span>More</span>
    </div>
  </div>`;

  html += '</div>';
  return html;
}

/**
 * Render heatmap into the dashboard section
 */
export function mountProfitHeatmap() {
  const el = document.getElementById('profitHeatmap');
  if (!el) return;
  el.innerHTML = renderProfitHeatmap();
  el.style.display = '';
}
