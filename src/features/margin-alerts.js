/**
 * margin-alerts.js — Profit Margin Alerts
 * Real-time notifications when items fall below profit thresholds,
 * when comps suggest price is off market, or when items are
 * unprofitable after fees.
 */

import { inv, sales, getInvItem } from '../data/store.js';
import { fmt, escHtml, escAttr, daysSince } from '../utils/format.js';
import { toast } from '../utils/dom.js';

// ── THRESHOLD CONFIG ──────────────────────────────────────────────────────

const DEFAULT_THRESHOLDS = {
  minMarginPct: 20,    // warn if margin below 20%
  minProfitDollar: 5,  // warn if profit below $5
  maxDaysUnlisted: 14, // warn if not listed within 14 days
  staleDays: 60,       // flag items older than 60 days
};

let _thresholds = { ...DEFAULT_THRESHOLDS };

export function getMarginThresholds() { return { ..._thresholds }; }

export function setMarginThresholds(t) {
  if (t.minMarginPct !== undefined) _thresholds.minMarginPct = Number(t.minMarginPct);
  if (t.minProfitDollar !== undefined) _thresholds.minProfitDollar = Number(t.minProfitDollar);
  if (t.maxDaysUnlisted !== undefined) _thresholds.maxDaysUnlisted = Number(t.maxDaysUnlisted);
  if (t.staleDays !== undefined) _thresholds.staleDays = Number(t.staleDays);
  try { localStorage.setItem('ft_margin_thresholds', JSON.stringify(_thresholds)); } catch (e) { console.warn('FlipTrack: margin thresholds save error:', e.message); }
}

export function initMarginAlerts() {
  try {
    const saved = localStorage.getItem('ft_margin_thresholds');
    if (saved) _thresholds = { ...DEFAULT_THRESHOLDS, ...JSON.parse(saved) };
  } catch (e) { console.warn('FlipTrack: margin thresholds load error:', e.message); }
}

// ── SCAN FOR ALERTS ───────────────────────────────────────────────────────

const _daysSince = d => daysSince(d, 999);

export function scanMarginAlerts() {
  const unsold = inv.filter(i => !i.sold && !i.deleted);
  const alerts = [];

  for (const item of unsold) {
    const price = item.price || 0;
    const cost = item.cost || 0;
    const fees = item.fees || 0;
    const ship = item.ship || 0;
    const profit = price - cost - fees - ship;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    const days = _daysSince(item.added);

    // Low margin alert
    if (price > 0 && cost > 0 && margin < _thresholds.minMarginPct) {
      alerts.push({
        type: 'low-margin',
        severity: margin < 0 ? 'critical' : margin < 10 ? 'high' : 'medium',
        itemId: item.id,
        itemName: item.name || 'Unnamed',
        message: margin < 0
          ? `Negative margin (${Math.round(margin)}%) — losing money at current price`
          : `Low margin (${Math.round(margin)}%) — below ${_thresholds.minMarginPct}% threshold`,
        value: margin,
        profit,
      });
    }

    // Low dollar profit
    if (price > 0 && cost > 0 && profit < _thresholds.minProfitDollar && profit >= 0) {
      alerts.push({
        type: 'low-profit',
        severity: profit < 1 ? 'high' : 'medium',
        itemId: item.id,
        itemName: item.name || 'Unnamed',
        message: `Only ${fmt(profit)} profit — below ${fmt(_thresholds.minProfitDollar)} threshold`,
        value: profit,
        profit,
      });
    }

    // Stale inventory
    if (days >= _thresholds.staleDays) {
      alerts.push({
        type: 'stale',
        severity: days >= 120 ? 'critical' : days >= 90 ? 'high' : 'medium',
        itemId: item.id,
        itemName: item.name || 'Unnamed',
        message: `Listed ${days} days — consider repricing or bundling`,
        value: days,
        profit,
      });
    }

    // No price set
    if (!price && cost > 0) {
      alerts.push({
        type: 'no-price',
        severity: 'high',
        itemId: item.id,
        itemName: item.name || 'Unnamed',
        message: `No price set — ${fmt(cost)} invested with no listing price`,
        value: 0,
        profit: -cost,
      });
    }
  }

  // Sort by severity then profit impact
  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => ((sevOrder[a.severity] ?? 4) - (sevOrder[b.severity] ?? 4)) || (a.profit - b.profit));

  // Summary stats
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;
  const totalAtRisk = alerts.reduce((s, a) => s + Math.abs(Math.min(0, a.profit)), 0);
  const uniqueItems = new Set(alerts.map(a => a.itemId)).size;

  return { alerts, criticalCount, highCount, totalAtRisk, uniqueItems, thresholds: { ..._thresholds } };
}

// ── RENDER ─────────────────────────────────────────────────────────────────

export function renderMarginAlerts() {
  const el = document.getElementById('marginAlertsContent');
  if (!el) return;

  const d = scanMarginAlerts();

  // Threshold settings
  const settingsHtml = `
    <div class="ma-settings">
      <div class="ih-section-hdr">⚙️ Alert Thresholds</div>
      <div class="ma-settings-grid">
        <label>Min Margin %<input type="number" id="ma_minMargin" value="${d.thresholds.minMarginPct}" class="edit-inp" style="width:70px" onchange="updateMarginThreshold('minMarginPct',this.value)"></label>
        <label>Min Profit $<input type="number" id="ma_minProfit" value="${d.thresholds.minProfitDollar}" class="edit-inp" style="width:70px" step="0.5" onchange="updateMarginThreshold('minProfitDollar',this.value)"></label>
        <label>Stale Days<input type="number" id="ma_staleDays" value="${d.thresholds.staleDays}" class="edit-inp" style="width:70px" onchange="updateMarginThreshold('staleDays',this.value)"></label>
      </div>
    </div>`;

  // Summary cards
  const summaryHtml = `
    <div class="sa-summary">
      <div class="sa-card ${d.criticalCount > 0 ? 'sa-card-warn' : ''}"><div class="sa-card-val">${d.criticalCount}</div><div class="sa-card-lbl">Critical</div></div>
      <div class="sa-card ${d.highCount > 0 ? 'sa-card-warn' : ''}"><div class="sa-card-val">${d.highCount}</div><div class="sa-card-lbl">High Priority</div></div>
      <div class="sa-card"><div class="sa-card-val">${d.uniqueItems}</div><div class="sa-card-lbl">Items Affected</div></div>
      <div class="sa-card"><div class="sa-card-val">${fmt(d.totalAtRisk)}</div><div class="sa-card-lbl">$ At Risk</div></div>
    </div>`;

  if (!d.alerts.length) {
    el.innerHTML = settingsHtml + summaryHtml + '<div class="sa-empty" style="padding:24px">✅ All items are within your margin thresholds. Nice!</div>';
    return;
  }

  // Alert list
  const severityColors = { critical: '#f44336', high: '#ff5722', medium: '#ff9800', low: 'var(--muted)' };
  const typeIcons = { 'low-margin': '📉', 'low-profit': '💸', 'stale': '⏰', 'no-price': '🚫' };

  const alertsHtml = `
    <div class="ih-section">
      <div class="ih-section-hdr">🚨 Active Alerts (${d.alerts.length})</div>
      <div class="comps-list" style="max-height:450px">
        ${d.alerts.slice(0, 30).map(a => `
          <div class="comps-item" onclick="openDrawer('${escAttr(a.itemId)}')" style="cursor:pointer;border-left:3px solid ${severityColors[a.severity]}">
            <div style="font-size:18px;flex-shrink:0">${typeIcons[a.type] || '⚠️'}</div>
            <div class="comps-item-info">
              <div class="comps-item-title">${escHtml(a.itemName)}</div>
              <div class="comps-item-meta">${escHtml(a.message)}</div>
            </div>
            <div style="font-size:10px;text-transform:uppercase;color:${severityColors[a.severity]};font-weight:600;flex-shrink:0">${a.severity}</div>
          </div>
        `).join('')}
      </div>
    </div>`;

  el.innerHTML = settingsHtml + summaryHtml + alertsHtml;
}

export function updateMarginThreshold(key, value) {
  setMarginThresholds({ [key]: value });
  renderMarginAlerts();
  toast('Threshold updated ✓');
}
