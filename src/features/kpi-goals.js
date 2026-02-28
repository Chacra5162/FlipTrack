/**
 * kpi-goals.js — Monthly KPI goal setting with progress bars
 * Users set monthly revenue/profit targets; dashboard shows progress.
 */

import { sales, inv, getInvItem } from '../data/store.js';
import { fmt, pct } from '../utils/format.js';
import { toast } from '../utils/dom.js';

const STORAGE_KEY = 'ft_kpi_goals';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getGoals() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function saveGoals(g) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(g));
}

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthStats() {
  const key = currentMonthKey();
  const [year, month] = key.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  let rev = 0, cogs = 0, fees = 0, unitsSold = 0;
  for (const s of sales) {
    const d = new Date(s.date);
    if (d >= start && d <= end) {
      const it = getInvItem(s.itemId);
      rev += (s.price || 0) * (s.qty || 0);
      cogs += it ? (it.cost || 0) * (s.qty || 0) : 0;
      fees += (s.fees || 0) + (s.ship || 0);
      unitsSold += s.qty || 0;
    }
  }
  return { rev, profit: rev - cogs - fees, unitsSold, month: MONTHS[month - 1], year };
}

export function renderKPIGoals() {
  const goals = getGoals();
  const key = currentMonthKey();
  const g = goals[key] || {};
  const stats = getMonthStats();

  const revGoal = g.revenue || 0;
  const profitGoal = g.profit || 0;
  const salesGoal = g.sales || 0;

  const hasGoals = revGoal > 0 || profitGoal > 0 || salesGoal > 0;

  if (!hasGoals) {
    return `<div class="kpi-goals-empty">
      <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Set monthly targets to track your progress</div>
      <button class="btn-secondary" onclick="openKPIGoalEditor()" style="font-size:11px;padding:5px 14px">🎯 Set ${stats.month} Goals</button>
    </div>`;
  }

  const bars = [];
  if (revGoal > 0) {
    const p = Math.min(1, stats.rev / revGoal);
    bars.push({ label: 'Revenue', current: fmt(stats.rev), goal: fmt(revGoal), pct: p, color: 'var(--accent2)' });
  }
  if (profitGoal > 0) {
    const p = Math.min(1, stats.profit / profitGoal);
    bars.push({ label: 'Profit', current: fmt(stats.profit), goal: fmt(profitGoal), pct: p, color: 'var(--accent3)' });
  }
  if (salesGoal > 0) {
    const p = Math.min(1, stats.unitsSold / salesGoal);
    bars.push({ label: 'Units Sold', current: stats.unitsSold, goal: salesGoal, pct: p, color: 'var(--accent)' });
  }

  return `<div class="kpi-goals-wrap">
    <div class="kpi-header">
      <span class="kpi-month">${stats.month} ${stats.year} Goals</span>
      <button class="kpi-edit-btn" onclick="openKPIGoalEditor()" title="Edit goals">✎</button>
    </div>
    ${bars.map(b => `<div class="kpi-bar-wrap">
      <div class="kpi-bar-label">
        <span>${b.label}</span>
        <span class="kpi-bar-nums">${b.current} / ${b.goal}</span>
      </div>
      <div class="kpi-bar-track">
        <div class="kpi-bar-fill" style="width:${Math.round(b.pct * 100)}%;background:${b.color}"></div>
      </div>
      <div class="kpi-bar-pct" style="color:${b.pct >= 1 ? '#57ff9a' : 'var(--muted)'}">${b.pct >= 1 ? '✓ Goal reached!' : Math.round(b.pct * 100) + '%'}</div>
    </div>`).join('')}
  </div>`;
}

export function openKPIGoalEditor() {
  const goals = getGoals();
  const key = currentMonthKey();
  const g = goals[key] || {};
  const stats = getMonthStats();

  const modal = document.createElement('div');
  modal.id = 'kpiModal';
  modal.className = 'kpi-modal-overlay';
  modal.innerHTML = `
    <div class="kpi-modal">
      <div class="kpi-modal-title">🎯 Set ${stats.month} ${stats.year} Goals</div>
      <div class="kpi-field">
        <label>Monthly Revenue Target</label>
        <div class="kpi-input-wrap">
          <span class="kpi-prefix">$</span>
          <input type="number" id="kpiRevGoal" value="${g.revenue || ''}" placeholder="e.g. 2000" min="0" step="100">
        </div>
      </div>
      <div class="kpi-field">
        <label>Monthly Profit Target</label>
        <div class="kpi-input-wrap">
          <span class="kpi-prefix">$</span>
          <input type="number" id="kpiProfitGoal" value="${g.profit || ''}" placeholder="e.g. 800" min="0" step="50">
        </div>
      </div>
      <div class="kpi-field">
        <label>Units Sold Target</label>
        <input type="number" id="kpiSalesGoal" value="${g.sales || ''}" placeholder="e.g. 30" min="0" step="1">
      </div>
      <div class="kpi-modal-actions">
        <button class="btn-secondary" onclick="closeKPIGoalEditor()">Cancel</button>
        <button class="btn-primary" onclick="saveKPIGoals()" style="padding:8px 20px">Save Goals</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('on'));
}

export function closeKPIGoalEditor() {
  const m = document.getElementById('kpiModal');
  if (m) { m.classList.remove('on'); setTimeout(() => m.remove(), 200); }
}

export function saveKPIGoals() {
  const goals = getGoals();
  const key = currentMonthKey();
  goals[key] = {
    revenue: parseFloat(document.getElementById('kpiRevGoal').value) || 0,
    profit: parseFloat(document.getElementById('kpiProfitGoal').value) || 0,
    sales: parseInt(document.getElementById('kpiSalesGoal').value) || 0,
  };
  saveGoals(goals);
  closeKPIGoalEditor();
  toast('Monthly goals saved ✓');

  // Re-render the KPI section
  const el = document.getElementById('kpiGoalsSection');
  if (el) el.innerHTML = renderKPIGoals();
}
