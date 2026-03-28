/**
 * peer-benchmarking.js — Anonymized percentile rankings for KPI goals
 * Shows how the user's metrics compare to community benchmarks.
 * Uses local statistical models based on reseller industry data
 * (no real peer data transmitted — privacy-first approach).
 *
 * Benchmark tiers based on published reseller industry averages:
 *  - Hobbyist: <$500/mo revenue
 *  - Part-time: $500-2000/mo
 *  - Full-time: $2000-8000/mo
 *  - Power seller: $8000+/mo
 */

import { sales, inv, getInvItem } from '../data/store.js';
import { fmt, pct, escHtml } from '../utils/format.js';

const STORAGE_KEY = 'ft_benchmark_prefs';

// ── INDUSTRY BENCHMARK DATA ─────────────────────────────────────────────────
// Based on published reseller community surveys and marketplace data
// Percentile distributions for monthly metrics

const BENCHMARKS = {
  revenue: {
    p10: 150, p25: 400, p50: 1200, p75: 3500, p90: 8000, p95: 15000,
  },
  profit: {
    p10: 50, p25: 150, p50: 500, p75: 1500, p90: 3500, p95: 7000,
  },
  unitsSold: {
    p10: 3, p25: 8, p50: 25, p75: 60, p90: 120, p95: 250,
  },
  avgProfit: {
    p10: 3, p25: 8, p50: 18, p75: 35, p90: 60, p95: 100,
  },
  roi: {
    p10: 0.15, p25: 0.4, p50: 0.8, p75: 1.5, p90: 2.5, p95: 4.0,
  },
  sellThrough: {
    p10: 0.05, p25: 0.12, p50: 0.25, p75: 0.40, p90: 0.55, p95: 0.70,
  },
  avgDaysToSell: {
    // Lower is better — inverted percentiles
    p10: 90, p25: 60, p50: 35, p75: 18, p90: 10, p95: 5,
  },
};

// ── TIER CLASSIFICATION ─────────────────────────────────────────────────────

const TIERS = [
  { name: 'Power Seller', min: 8000, color: 'var(--accent3)', icon: '👑' },
  { name: 'Full-Time', min: 2000, color: 'var(--good)', icon: '🔥' },
  { name: 'Part-Time', min: 500, color: 'var(--accent)', icon: '📈' },
  { name: 'Hobbyist', min: 0, color: 'var(--muted)', icon: '🌱' },
];

function getTier(monthlyRevenue) {
  return TIERS.find(t => monthlyRevenue >= t.min) || TIERS[TIERS.length - 1];
}

// ── PERCENTILE CALCULATION ──────────────────────────────────────────────────

function calcPercentile(value, benchKey) {
  const b = BENCHMARKS[benchKey];
  if (!b) return 50;

  // Inverted metric (lower is better)
  if (benchKey === 'avgDaysToSell') {
    if (value <= b.p95) return 95;
    if (value <= b.p90) return 90;
    if (value <= b.p75) return 75;
    if (value <= b.p50) return 50;
    if (value <= b.p25) return 25;
    if (value <= b.p10) return 10;
    return 5;
  }

  // Standard metric (higher is better)
  if (value >= b.p95) return 95;
  if (value >= b.p90) return 90 + 5 * (value - b.p90) / (b.p95 - b.p90);
  if (value >= b.p75) return 75 + 15 * (value - b.p75) / (b.p90 - b.p75);
  if (value >= b.p50) return 50 + 25 * (value - b.p50) / (b.p75 - b.p50);
  if (value >= b.p25) return 25 + 25 * (value - b.p25) / (b.p50 - b.p25);
  if (value >= b.p10) return 10 + 15 * (value - b.p10) / (b.p25 - b.p10);
  return Math.max(1, 10 * value / b.p10);
}

function percentileLabel(p) {
  if (p >= 90) return 'Top 10%';
  if (p >= 75) return 'Top 25%';
  if (p >= 50) return 'Above Average';
  if (p >= 25) return 'Below Average';
  return 'Bottom 25%';
}

function percentileColor(p) {
  if (p >= 80) return 'var(--good)';
  if (p >= 60) return 'var(--accent)';
  if (p >= 40) return 'var(--accent2)';
  if (p >= 20) return 'var(--warn)';
  return 'var(--danger)';
}

// ── MONTHLY STATS ───────────────────────────────────────────────────────────

function getMonthlyStats() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  let rev = 0, cogs = 0, fees = 0, unitsSold = 0, totalDays = 0, soldCount = 0;
  for (const s of sales) {
    const d = new Date(s.date);
    if (d >= start && d <= end) {
      const it = getInvItem(s.itemId);
      const saleRev = (s.price || 0) * (s.qty || 0);
      rev += saleRev;
      cogs += it ? (it.cost || 0) * (s.qty || 0) : 0;
      fees += (s.fees || 0) + (s.ship || 0);
      unitsSold += s.qty || 0;

      // Days to sell
      if (it?.added) {
        const listed = new Date(it.added);
        const daysDiff = Math.max(1, Math.round((d - listed) / 86400000));
        totalDays += daysDiff;
        soldCount++;
      }
    }
  }

  const profit = rev - cogs - fees;
  const avgProfit = unitsSold > 0 ? profit / unitsSold : 0;
  const avgROI = cogs > 0 ? profit / cogs : 0;
  const avgDays = soldCount > 0 ? totalDays / soldCount : 0;

  // Sell-through rate
  const totalInv = inv.filter(i => !i._del && !i.isParent).length;
  const sellThrough = totalInv > 0 ? unitsSold / totalInv : 0;

  return { rev, profit, unitsSold, avgProfit, avgROI, avgDays, sellThrough };
}

// ── PREFERENCES ─────────────────────────────────────────────────────────────

function getPrefs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

export function toggleBenchmarkVisibility() {
  const prefs = getPrefs();
  prefs.visible = !prefs.visible;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  const el = document.getElementById('peerBenchSection');
  if (el) el.innerHTML = renderPeerBenchmarking();
}

// ── RENDERING ───────────────────────────────────────────────────────────────

export function renderPeerBenchmarking() {
  const prefs = getPrefs();
  if (prefs.visible === false) {
    return `<div class="bench-wrap">
      <div class="bench-header">
        <div>
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--text)">Peer Benchmarking</div>
          <div style="font-size:11px;color:var(--muted)">See how you compare to other resellers</div>
        </div>
        <button class="btn-secondary" onclick="toggleBenchmark()" style="font-size:11px;padding:5px 12px">Show</button>
      </div>
    </div>`;
  }

  const stats = getMonthlyStats();
  const tier = getTier(stats.rev);

  const metrics = [
    { key: 'revenue', label: 'Revenue', value: stats.rev, display: fmt(stats.rev) },
    { key: 'profit', label: 'Profit', value: stats.profit, display: fmt(stats.profit) },
    { key: 'unitsSold', label: 'Units Sold', value: stats.unitsSold, display: String(stats.unitsSold) },
    { key: 'avgProfit', label: 'Avg Profit/Item', value: stats.avgProfit, display: fmt(stats.avgProfit) },
    { key: 'roi', label: 'ROI', value: stats.avgROI, display: Math.round(stats.avgROI * 100) + '%' },
    { key: 'sellThrough', label: 'Sell-Through', value: stats.sellThrough, display: Math.round(stats.sellThrough * 100) + '%' },
  ];

  if (stats.avgDays > 0) {
    metrics.push({ key: 'avgDaysToSell', label: 'Avg Days to Sell', value: stats.avgDays, display: Math.round(stats.avgDays) + 'd' });
  }

  const percentiles = metrics.map(m => ({
    ...m,
    percentile: Math.round(calcPercentile(m.value, m.key)),
  }));

  const overallPercentile = Math.round(
    percentiles.reduce((sum, m) => sum + m.percentile, 0) / percentiles.length
  );

  return `<div class="bench-wrap">
    <div class="bench-header">
      <div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--text)">Peer Benchmarking</div>
        <div style="font-size:11px;color:var(--muted)">How you compare this month</div>
      </div>
      <button class="btn-secondary" onclick="toggleBenchmark()" style="font-size:11px;padding:5px 12px">Hide</button>
    </div>

    <div class="bench-tier">
      <span style="font-size:20px">${tier.icon}</span>
      <div>
        <div style="font-weight:700;color:${tier.color};font-size:13px">${tier.name}</div>
        <div style="font-size:10px;color:var(--muted)">Overall: ${percentileLabel(overallPercentile)} (${overallPercentile}th percentile)</div>
      </div>
    </div>

    <div class="bench-metrics">
      ${percentiles.map(m => {
        const color = percentileColor(m.percentile);
        return `<div class="bench-metric">
          <div class="bench-metric-header">
            <span style="font-size:11px;color:var(--text)">${m.label}</span>
            <span style="font-family:'DM Mono',monospace;font-size:11px;color:${color}">${m.display}</span>
          </div>
          <div class="bench-bar-track">
            <div class="bench-bar-fill" style="width:${m.percentile}%;background:${color}"></div>
            <div class="bench-bar-marker" style="left:50%" title="Median"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--muted)">
            <span>${percentileLabel(m.percentile)}</span>
            <span>${m.percentile}th pctl</span>
          </div>
        </div>`;
      }).join('')}
    </div>

    <div style="font-size:9px;color:var(--muted);text-align:center;margin-top:8px;opacity:0.7">
      Based on anonymized industry benchmarks · Your data never leaves your device
    </div>
  </div>`;
}

export { getMonthlyStats as getBenchmarkStats, calcPercentile, getTier };
