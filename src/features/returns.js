/**
 * returns.js — Return & Refund Tracking
 * Log returns with reason codes, track refund costs,
 * identify problem items/categories with high return rates.
 */

import { inv, sales, getInvItem, save, markDirty } from '../data/store.js';
import { fmt, uid, ds, escHtml, escAttr } from '../utils/format.js';
import { toast } from '../utils/dom.js';

// Returns are stored as a property on each sale: sale.returnInfo = { reason, date, refundAmount, notes, restocked }
// We read/write via the sales array in store

const RETURN_REASONS = [
  'Not as described',
  'Defective / Damaged',
  'Wrong item sent',
  'Buyer changed mind',
  'Fit issue / Wrong size',
  'Arrived late',
  'Missing parts',
  'Counterfeit concern',
  'Other',
];

// ── LOG A RETURN ──────────────────────────────────────────────────────────

export function logReturn(saleId, reason, refundAmount, notes, restocked) {
  const sale = sales.find(s => s.id === saleId);
  if (!sale) { toast('Sale not found', true); return; }

  sale.returnInfo = {
    reason: reason || 'Other',
    date: new Date().toISOString(),
    refundAmount: refundAmount || sale.price || 0,
    notes: notes || '',
    restocked: !!restocked,
  };

  // If restocked, mark item as unsold
  if (restocked && sale.itemId) {
    const item = getInvItem(sale.itemId);
    if (item) {
      item.sold = false;
      markDirty(item.id, 'inv');
    }
  }

  markDirty(sale.id, 'sales');
  save();
  toast('Return logged ✓');
}

// ── COMPUTE RETURN ANALYTICS ──────────────────────────────────────────────

export function computeReturnAnalytics() {
  const allSales = sales.filter(s => s.price > 0);
  const returns = allSales.filter(s => s.returnInfo);

  const totalSold = allSales.length;
  const totalReturns = returns.length;
  const returnRate = totalSold > 0 ? totalReturns / totalSold : 0;
  const totalRefunded = returns.reduce((s, r) => s + (r.returnInfo.refundAmount || 0), 0);
  const totalRevenue = allSales.reduce((s, sale) => s + (sale.price || 0), 0);
  const refundRate = totalRevenue > 0 ? totalRefunded / totalRevenue : 0;

  // Reason breakdown
  const reasons = {};
  for (const r of returns) {
    const reason = r.returnInfo.reason || 'Other';
    reasons[reason] = (reasons[reason] || 0) + 1;
  }
  const reasonList = Object.entries(reasons)
    .map(([reason, count]) => ({ reason, count, pct: totalReturns > 0 ? count / totalReturns : 0 }))
    .sort((a, b) => b.count - a.count);

  // Category return rates
  const catReturns = {};
  const catSales = {};
  for (const sale of allSales) {
    const item = getInvItem(sale.itemId);
    const cat = item?.category || 'Unknown';
    catSales[cat] = (catSales[cat] || 0) + 1;
    if (sale.returnInfo) catReturns[cat] = (catReturns[cat] || 0) + 1;
  }
  const catReturnRates = Object.keys(catSales)
    .map(cat => ({
      category: cat,
      sales: catSales[cat],
      returns: catReturns[cat] || 0,
      rate: catSales[cat] > 0 ? (catReturns[cat] || 0) / catSales[cat] : 0,
    }))
    .filter(c => c.returns > 0)
    .sort((a, b) => b.rate - a.rate);

  // Recent returns
  const recent = [...returns]
    .sort((a, b) => new Date(b.returnInfo.date) - new Date(a.returnInfo.date))
    .slice(0, 15)
    .map(s => {
      const item = getInvItem(s.itemId);
      return {
        saleId: s.id,
        itemName: item?.name || 'Unknown',
        itemId: s.itemId,
        reason: s.returnInfo.reason,
        date: s.returnInfo.date,
        refundAmount: s.returnInfo.refundAmount,
        restocked: s.returnInfo.restocked,
        notes: s.returnInfo.notes,
      };
    });

  return { totalSold, totalReturns, returnRate, totalRefunded, refundRate, reasonList, catReturnRates, recent };
}

// ── RENDER ─────────────────────────────────────────────────────────────────

export function renderReturns() {
  const el = document.getElementById('returnsContent');
  if (!el) return;

  const d = computeReturnAnalytics();

  // Summary cards
  const summaryHtml = `
    <div class="sa-summary">
      <div class="sa-card"><div class="sa-card-val">${d.totalReturns}</div><div class="sa-card-lbl">Total Returns</div></div>
      <div class="sa-card"><div class="sa-card-val">${Math.round(d.returnRate * 100)}%</div><div class="sa-card-lbl">Return Rate</div></div>
      <div class="sa-card"><div class="sa-card-val">${fmt(d.totalRefunded)}</div><div class="sa-card-lbl">Total Refunded</div></div>
      <div class="sa-card"><div class="sa-card-val">${Math.round(d.refundRate * 100)}%</div><div class="sa-card-lbl">Revenue Lost</div></div>
    </div>`;

  // Log return button
  const logBtnHtml = `
    <div style="padding:0 0 12px">
      <button class="btn-primary" onclick="openReturnModal()" style="font-size:11px;padding:8px 16px">+ Log Return</button>
    </div>`;

  // Reason breakdown
  let reasonHtml = '';
  if (d.reasonList.length) {
    const maxR = d.reasonList[0].count;
    reasonHtml = `
      <div class="ih-section">
        <div class="ih-section-hdr">📋 Return Reasons</div>
        ${d.reasonList.map(r => `
          <div class="sa-bar-row">
            <div class="sa-bar-name">${escHtml(r.reason)}</div>
            <div class="sa-bar-wrap">
              <div class="sa-bar ih-bad" style="width:${Math.max(6, (r.count / maxR) * 100)}%"></div>
            </div>
            <div class="sa-bar-val">${r.count} (${Math.round(r.pct * 100)}%)</div>
          </div>
        `).join('')}
      </div>`;
  }

  // Problem categories
  let catHtml = '';
  if (d.catReturnRates.length) {
    catHtml = `
      <div class="ih-section">
        <div class="ih-section-hdr">⚠️ Categories with Returns</div>
        <div class="ih-table-wrap">
          <table class="ih-table">
            <thead><tr><th>Category</th><th>Sales</th><th>Returns</th><th>Return Rate</th></tr></thead>
            <tbody>
              ${d.catReturnRates.map(c => `<tr>
                <td class="ih-td-name">${escHtml(c.category)}</td>
                <td>${c.sales}</td>
                <td>${c.returns}</td>
                <td class="${c.rate >= 0.2 ? 'ih-bad' : c.rate >= 0.1 ? 'ih-ok' : ''}">${Math.round(c.rate * 100)}%</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // Recent returns
  let recentHtml = '';
  if (d.recent.length) {
    recentHtml = `
      <div class="ih-section">
        <div class="ih-section-hdr">🕐 Recent Returns</div>
        <div class="comps-list" style="max-height:300px">
          ${d.recent.map(r => `
            <div class="comps-item" onclick="openDrawer('${escAttr(r.itemId)}')" style="cursor:pointer">
              <div class="comps-item-info">
                <div class="comps-item-title">${escHtml(r.itemName)}</div>
                <div class="comps-item-meta">${escHtml(r.reason)} · ${ds(r.date)}${r.restocked ? ' · ♻️ Restocked' : ''}</div>
                ${r.notes ? `<div class="comps-item-meta">${escHtml(r.notes)}</div>` : ''}
              </div>
              <div class="comps-item-price" style="color:var(--accent2)">-${fmt(r.refundAmount)}</div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  el.innerHTML = summaryHtml + logBtnHtml + reasonHtml + catHtml + recentHtml;
}

// ── RETURN MODAL ──────────────────────────────────────────────────────────

export function openReturnModal() {
  const allSales = sales.filter(s => s.price > 0 && !s.returnInfo);
  if (!allSales.length) { toast('No sales to return', true); return; }

  const options = allSales.slice(-30).reverse().map(s => {
    const item = getInvItem(s.itemId);
    return `<option value="${escAttr(s.id)}">${escHtml(item?.name || 'Item')} — ${fmt(s.price)} (${ds(s.date)})</option>`;
  }).join('');

  const reasons = RETURN_REASONS.map(r => `<option value="${escAttr(r)}">${escHtml(r)}</option>`).join('');

  const ov = document.getElementById('returnOv');
  if (!ov) return;
  document.getElementById('returnBody').innerHTML = `
    <div class="form-grid" style="gap:12px">
      <div class="fgrp full"><label>Sale</label><select id="ret_sale" class="edit-inp">${options}</select></div>
      <div class="fgrp full"><label>Reason</label><select id="ret_reason" class="edit-inp">${reasons}</select></div>
      <div class="fgrp"><label>Refund Amount ($)</label><input type="number" id="ret_amount" class="edit-inp" step="0.01"></div>
      <div class="fgrp"><label><input type="checkbox" id="ret_restock"> Restock item</label></div>
      <div class="fgrp full"><label>Notes</label><textarea id="ret_notes" class="edit-inp" rows="2"></textarea></div>
      <div class="fgrp full"><button class="btn-primary" onclick="submitReturn()">Log Return</button></div>
    </div>`;

  // Pre-fill refund amount
  const selEl = document.getElementById('ret_sale');
  selEl.addEventListener('change', () => {
    const sale = sales.find(s => s.id === selEl.value);
    if (sale) document.getElementById('ret_amount').value = sale.price;
  });
  const first = sales.find(s => s.id === selEl.value);
  if (first) document.getElementById('ret_amount').value = first.price;

  ov.style.display = 'flex';
}

export function closeReturnModal() {
  const ov = document.getElementById('returnOv');
  if (ov) ov.style.display = 'none';
}

export function submitReturn() {
  const saleId = document.getElementById('ret_sale')?.value;
  const reason = document.getElementById('ret_reason')?.value;
  const amount = parseFloat(document.getElementById('ret_amount')?.value) || 0;
  const notes = document.getElementById('ret_notes')?.value || '';
  const restocked = document.getElementById('ret_restock')?.checked || false;

  if (!saleId) { toast('Select a sale', true); return; }
  logReturn(saleId, reason, amount, notes, restocked);
  closeReturnModal();
  renderReturns();
}
