/**
 * sales-velocity.js — Sales velocity chart (items sold per week)
 * Renders an inline SVG bar chart showing weekly sales trends.
 */

import { sales, getInvItem } from '../data/store.js';
import { fmt } from '../utils/format.js';

/**
 * Render a sales velocity chart for the last N weeks.
 * Returns HTML string for embedding in the dashboard.
 */
export function renderSalesVelocity(weeks = 8) {
  const now = Date.now();
  const msWeek = 7 * 86400000;

  // Bucket sales into weeks
  const buckets = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = now - (w + 1) * msWeek;
    const weekEnd = now - w * msWeek;
    let units = 0;
    let revenue = 0;
    for (const s of sales) {
      const t = new Date(s.date).getTime();
      if (t >= weekStart && t < weekEnd) {
        units += s.qty || 0;
        revenue += (s.price || 0) * (s.qty || 0);
      }
    }
    const label = _weekLabel(new Date(weekStart));
    buckets.push({ units, revenue, label });
  }

  const maxUnits = Math.max(1, ...buckets.map(b => b.units));
  const totalUnits = buckets.reduce((a, b) => a + b.units, 0);
  const avgPerWeek = totalUnits / weeks;

  // Trend arrow (compare last 4 weeks vs prior 4 weeks)
  const recent = buckets.slice(-4).reduce((a, b) => a + b.units, 0);
  const prior = buckets.slice(0, 4).reduce((a, b) => a + b.units, 0);
  const trend = prior > 0 ? ((recent - prior) / prior) : (recent > 0 ? 1 : 0);
  const trendIcon = trend > 0.05 ? '↑' : trend < -0.05 ? '↓' : '→';
  const trendColor = trend > 0.05 ? 'var(--good)' : trend < -0.05 ? 'var(--danger)' : 'var(--muted)';

  if (!totalUnits) {
    return `<div class="sv-empty" style="font-size:11px;color:var(--muted);padding:12px 0;text-align:center">
      No sales data yet — record sales to see your velocity trend
    </div>`;
  }

  // Chart dimensions
  const W = 320, H = 100, barW = Math.floor((W - 20) / weeks) - 4, pad = 2;

  let barsHtml = '';
  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i];
    const barH = Math.max(2, Math.round((b.units / maxUnits) * (H - 30)));
    const x = 10 + i * (barW + 4);
    const y = H - 20 - barH;
    const isLast = i === buckets.length - 1;
    const fill = isLast ? 'var(--accent)' : 'var(--accent3)';
    const opacity = isLast ? '1' : '0.6';
    barsHtml += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="2" fill="${fill}" opacity="${opacity}">
      <title>${b.label}: ${b.units} sold, ${fmt(b.revenue)} revenue</title>
    </rect>`;
    // Unit count label above bar
    if (b.units > 0) {
      barsHtml += `<text x="${x + barW / 2}" y="${y - 3}" text-anchor="middle" fill="var(--fg)" font-size="9" font-family="'DM Mono',monospace">${b.units}</text>`;
    }
    // Week label below bar
    barsHtml += `<text x="${x + barW / 2}" y="${H - 6}" text-anchor="middle" fill="var(--muted)" font-size="8" font-family="'DM Mono',monospace">${b.label}</text>`;
  }

  // Average line
  const avgY = H - 20 - Math.round((avgPerWeek / maxUnits) * (H - 30));
  barsHtml += `<line x1="8" y1="${avgY}" x2="${W - 8}" y2="${avgY}" stroke="var(--accent2)" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>`;
  barsHtml += `<text x="${W - 6}" y="${avgY - 3}" text-anchor="end" fill="var(--accent2)" font-size="8" font-family="'DM Mono',monospace" opacity="0.7">avg</text>`;

  return `<div class="sv-wrap">
    <div class="sv-header">
      <span class="sv-title">Sales Velocity</span>
      <span class="sv-trend" style="color:${trendColor}">${trendIcon} ${Math.abs(Math.round(trend * 100))}%</span>
      <span class="sv-avg" style="font-size:10px;color:var(--muted);margin-left:auto">${avgPerWeek.toFixed(1)}/wk avg</span>
    </div>
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" style="display:block">
      ${barsHtml}
    </svg>
  </div>`;
}

function _weekLabel(d) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
