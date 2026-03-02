/**
 * Shipping & Fulfillment View Module
 * Manages order fulfillment: ship queue, tracking, packing slips, batch operations.
 * Uses shared patterns from sales.js: filters, pagination, selection state.
 */

import { inv, sales, save, refresh, getInvItem, markDirty } from '../data/store.js';
import { fmt, ds, uid, escHtml } from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { renderPagination } from '../utils/pagination.js';
import { getMeta, setMeta } from '../data/idb.js';
import { getPlatforms } from '../features/platforms.js';
import { estimateShippingRate, suggestPackage, getCarrierOptions } from '../features/shipping-rates.js';
import { printPackingSlip, printBatchSlips, setSellerInfo } from '../features/packing-slip.js';

// ── STATE ──────────────────────────────────────────────────────────────────────

let _shipSearch = '';
let _shipPlatFilter = '';
let _shipStatusFilter = 'unshipped'; // 'unshipped', 'shipped', 'all'
let _shipDateFrom = '';
let _shipDateTo = '';
let _shipPage = 0;
const _shipPageSize = 50;
let _shipSelection = new Set();
let _returns = [];
let _showReturnForm = false;

// ── RETURNS ─────────────────────────────────────────────────────────────────────

async function _loadReturns() {
  try {
    const data = await getMeta('returns');
    _returns = data ? JSON.parse(data) : [];
  } catch (e) {
    _returns = [];
  }
}

function _saveReturns() {
  setMeta('returns', JSON.stringify(_returns)).catch(() => {});
}

// ── FILTERS ────────────────────────────────────────────────────────────────────

export function shipSetSearch(val) {
  _shipSearch = (val || '').toLowerCase();
  _shipPage = 0;
  renderShippingView();
}

export function shipSetPlatFilter(val) {
  _shipPlatFilter = val || '';
  _shipPage = 0;
  renderShippingView();
}

export function shipSetStatusFilter(val) {
  _shipStatusFilter = val || 'unshipped';
  _shipPage = 0;
  renderShippingView();
}

export function shipSetDateFrom(val) {
  _shipDateFrom = val || '';
  _shipPage = 0;
  renderShippingView();
}

export function shipSetDateTo(val) {
  _shipDateTo = val || '';
  _shipPage = 0;
  renderShippingView();
}

export function shipClearFilters() {
  _shipSearch = '';
  _shipPlatFilter = '';
  _shipStatusFilter = 'unshipped';
  _shipDateFrom = '';
  _shipDateTo = '';
  _shipPage = 0;
  renderShippingView();
}

// ── SELECTION ──────────────────────────────────────────────────────────────────

export function shipToggleSel(saleId) {
  if (_shipSelection.has(saleId)) {
    _shipSelection.delete(saleId);
  } else {
    _shipSelection.add(saleId);
  }
  renderShippingView();
}

export function shipToggleAll(el) {
  const filtered = _getFilteredSales();
  if (el.checked) {
    filtered.forEach(s => _shipSelection.add(s.id));
  } else {
    filtered.forEach(s => _shipSelection.delete(s.id));
  }
  renderShippingView();
}

export function shipClearSel() {
  _shipSelection.clear();
  renderShippingView();
}

// ── FILTER LOGIC ───────────────────────────────────────────────────────────────

function _getFilteredSales() {
  return sales.filter(s => {
    // Status filter
    if (_shipStatusFilter === 'unshipped' && s.shipped) return false;
    if (_shipStatusFilter === 'shipped' && !s.shipped) return false;

    // Platform filter
    if (_shipPlatFilter && s.platform !== _shipPlatFilter) return false;

    // Date range filter
    if (_shipDateFrom) {
      const saleTs = new Date(s.date).getTime();
      const fromTs = new Date(_shipDateFrom).getTime();
      if (saleTs < fromTs) return false;
    }
    if (_shipDateTo) {
      const saleTs = new Date(s.date).getTime();
      const toTs = new Date(_shipDateTo).getTime();
      if (saleTs > toTs) return false;
    }

    // Search filter (item name or buyer)
    if (_shipSearch) {
      const item = getInvItem(s.itemId);
      const itemName = item ? (item.name || '').toLowerCase() : '';
      const buyerName = (s.buyerName || '').toLowerCase();
      if (!itemName.includes(_shipSearch) && !buyerName.includes(_shipSearch)) {
        return false;
      }
    }

    return true;
  });
}

// ── TRACKING VALIDATION ────────────────────────────────────────────────────────

function validateTracking(carrier, tracking) {
  if (!tracking) return true; // Optional
  const t = tracking.trim();
  if (carrier === 'USPS' && !/^[0-9]{20,22}$|^[A-Z]{2}[0-9]{9}[A-Z]{2}$/.test(t)) return false;
  if (carrier === 'UPS' && !/^1Z[A-Z0-9]{16}$/.test(t.toUpperCase())) return false;
  if (carrier === 'FedEx' && !/^[0-9]{12,22}$/.test(t)) return false;
  return true;
}

export function shipCheckTracking() {
  const carrier = document.getElementById('shipCarrier')?.value || '';
  const tracking = document.getElementById('shipTracking')?.value || '';
  const indicator = document.getElementById('shipTrackingIndicator');

  if (!indicator) return;
  if (!tracking.trim()) {
    indicator.style.display = 'none';
    return;
  }

  const isValid = validateTracking(carrier, tracking);
  indicator.style.display = 'block';
  indicator.style.color = isValid ? 'var(--good)' : 'var(--danger)';
  indicator.textContent = isValid ? '✓ Valid' : '✗ Invalid format';
}

// ── RETURNS MANAGEMENT ──────────────────────────────────────────────────────────

export async function shipLogReturn() {
  const saleId = document.getElementById('return_sale')?.value;
  const reason = document.getElementById('return_reason')?.value || '';
  const refundAmt = parseFloat(document.getElementById('return_refund')?.value) || 0;
  const notes = (document.getElementById('return_notes')?.value || '').trim();

  if (!saleId) { toast('Select a sale', true); return; }

  _returns.push({
    id: uid(),
    saleId,
    reason,
    refundAmount: refundAmt,
    notes,
    date: Date.now(),
  });
  _saveReturns();
  toast('Return logged');

  // Clear form
  const retSale = document.getElementById('return_sale');
  const retReason = document.getElementById('return_reason');
  const retRefund = document.getElementById('return_refund');
  const retNotes = document.getElementById('return_notes');
  if (retSale) retSale.value = '';
  if (retReason) retReason.value = '';
  if (retRefund) retRefund.value = '';
  if (retNotes) retNotes.value = '';

  renderShippingView();
}

export function shipToggleReturnForm() {
  _showReturnForm = !_showReturnForm;
  renderShippingView();
}

// ── MARKING SHIPPED ────────────────────────────────────────────────────────────

export function shipMarkShipped(saleId) {
  const sale = sales.find(s => s.id === saleId);
  if (!sale) { toast('Sale not found', true); return; }

  const modal = document.getElementById('shipModal');
  if (!modal) return;

  modal.dataset.activeSaleId = saleId;
  document.getElementById('shipCarrier').value = sale.carrier || 'USPS';
  document.getElementById('shipTracking').value = sale.trackingNumber || '';
  document.getElementById('shipCost').value = sale.actualShipCost || '';
  modal.classList.add('on');
}

export function shipConfirmShipped(saleId) {
  const sale = sales.find(s => s.id === saleId);
  if (!sale) { toast('Sale not found', true); return; }

  const carrier = (document.getElementById('shipCarrier')?.value || '').trim();
  const tracking = (document.getElementById('shipTracking')?.value || '').trim();
  const costStr = (document.getElementById('shipCost')?.value || '').trim();

  if (!carrier) { toast('Select carrier', true); return; }
  if (!tracking) { toast('Enter tracking number', true); return; }
  if (!validateTracking(carrier, tracking)) { toast('Invalid tracking number format', true); return; }

  const cost = parseFloat(costStr) || 0;

  sale.shipped = true;
  sale.shippedDate = new Date().toISOString();
  sale.carrier = carrier;
  sale.trackingNumber = tracking;
  sale.actualShipCost = cost;

  markDirty('sales', saleId);
  save();
  toast(`Marked shipped: ${tracking}`);
  document.getElementById('shipModal').classList.remove('on');
  renderShippingView();
}

export function shipCancelMark() {
  document.getElementById('shipModal').classList.remove('on');
}

// ── BATCH OPERATIONS ───────────────────────────────────────────────────────────

export function shipBatchMark() {
  if (_shipSelection.size === 0) { toast('Select items first', true); return; }
  const modal = document.getElementById('shipBatchModal');
  if (!modal) return;
  modal.classList.add('on');
}

export function shipConfirmBatchMark() {
  const carrier = (document.getElementById('shipBatchCarrier')?.value || '').trim();
  if (!carrier) { toast('Select carrier', true); return; }

  let marked = 0;
  _shipSelection.forEach(saleId => {
    const sale = sales.find(s => s.id === saleId);
    if (sale && !sale.shipped) {
      sale.shipped = true;
      sale.shippedDate = new Date().toISOString();
      sale.carrier = carrier;
      sale.trackingNumber = ''; // User can fill in individually
      sale.actualShipCost = 0;
      markDirty('sales', saleId);
      marked++;
    }
  });

  save();
  toast(`Marked ${marked} orders shipped`);
  document.getElementById('shipBatchModal').classList.remove('on');
  _shipSelection.clear();
  renderShippingView();
}

export function shipCancelBatchMark() {
  document.getElementById('shipBatchModal').classList.remove('on');
}

// ── PRINT & EXPORT ─────────────────────────────────────────────────────────────

export function shipPrintSlip(saleId) {
  const sale = sales.find(s => s.id === saleId);
  if (!sale) { toast('Sale not found', true); return; }
  printPackingSlip(saleId, sale);
}

export function shipPrintBatchSlips() {
  if (_shipSelection.size === 0) { toast('Select orders first', true); return; }
  const selectedSales = [..._shipSelection]
    .map(id => sales.find(s => s.id === id))
    .filter(Boolean);
  printBatchSlips([..._shipSelection], selectedSales);
}

export function shipExportLog() {
  const filtered = _getFilteredSales();
  const headers = ['Sale ID', 'Item', 'Buyer', 'Platform', 'Date Sold', 'Qty', 'Price', 'Carrier', 'Tracking', 'Ship Cost', 'Status'];
  const rows = filtered.map(s => {
    const item = getInvItem(s.itemId);
    return [
      s.id,
      item ? escHtml(item.name) : '—',
      escHtml(s.buyerName || ''),
      s.platform || '',
      ds(s.date),
      s.qty || 1,
      fmt(s.price || 0),
      s.carrier || '',
      s.trackingNumber || '',
      fmt(s.actualShipCost || 0),
      s.shipped ? 'Shipped' : 'Pending'
    ];
  });

  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ship-log-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Exported ship log');
}

// ── RENDER ─────────────────────────────────────────────────────────────────────

export async function renderShippingView() {
  await _loadReturns();

  const container = document.getElementById('view-shipping');
  if (!container) return;

  const filtered = _getFilteredSales();
  const totalPages = Math.max(1, Math.ceil(filtered.length / _shipPageSize));
  _shipPage = Math.max(0, Math.min(_shipPage, totalPages - 1));

  const pageStart = _shipPage * _shipPageSize;
  const pageEnd = pageStart + _shipPageSize;
  const pageItems = filtered.slice(pageStart, pageEnd);

  // Calculate stats
  const pendingCount = sales.filter(s => !s.shipped).length;
  const shippedToday = sales.filter(s => {
    if (!s.shippedDate) return false;
    const shipTs = new Date(s.shippedDate).getTime();
    const nowTs = Date.now();
    const dayMs = 86400000;
    return (nowTs - shipTs) < dayMs;
  }).length;

  const avgShipTime = (() => {
    const shipped = sales.filter(s => s.shippedDate && s.date);
    if (shipped.length === 0) return 0;
    const sum = shipped.reduce((acc, s) => {
      const saleTs = new Date(s.date).getTime();
      const shipTs = new Date(s.shippedDate).getTime();
      return acc + (shipTs - saleTs);
    }, 0);
    return Math.round(sum / shipped.length / 86400000); // days
  })();

  const totalCost = sales
    .filter(s => s.shipped)
    .reduce((sum, s) => sum + (s.actualShipCost || 0), 0);

  const allSelected = pageItems.length > 0 && pageItems.every(s => _shipSelection.has(s.id));

  container.innerHTML = `
    <div class="panel">
      <div class="panel-header">
        <h2 class="panel-title">Shipping & Fulfillment</h2>
      </div>

      <!-- Stats strip -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;padding:14px;border-bottom:1px solid var(--border)">
        <div class="stat-card c1">
          <div class="stat-label">Pending</div>
          <div class="stat-value">${pendingCount}</div>
        </div>
        <div class="stat-card c2">
          <div class="stat-label">Shipped Today</div>
          <div class="stat-value">${shippedToday}</div>
        </div>
        <div class="stat-card c3">
          <div class="stat-label">Avg Ship Time</div>
          <div class="stat-value">${avgShipTime} days</div>
        </div>
        <div class="stat-card c4">
          <div class="stat-label">Total Cost</div>
          <div class="stat-value">${fmt(totalCost)}</div>
        </div>
      </div>

      <!-- Filters -->
      <div style="padding:14px;border-bottom:1px solid var(--border);background:var(--surface2)">
        <div class="form-grid" style="margin-bottom:12px">
          <input type="text" placeholder="Search item or buyer..." value="${escHtml(_shipSearch)}"
            oninput="shipSetSearch(this.value)" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px" />

          <select onchange="shipSetStatusFilter(this.value)" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px">
            <option value="unshipped" ${_shipStatusFilter === 'unshipped' ? 'selected' : ''}>Unshipped</option>
            <option value="shipped" ${_shipStatusFilter === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="all" ${_shipStatusFilter === 'all' ? 'selected' : ''}>All</option>
          </select>
        </div>

        <div class="form-grid" style="gap:8px;align-items:end">
          <div style="min-width:100px">
            <label style="display:block;font-size:10px;color:var(--muted);margin-bottom:4px">From Date</label>
            <input type="date" value="${_shipDateFrom}" onchange="shipSetDateFrom(this.value)" style="padding:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
          </div>
          <div style="min-width:100px">
            <label style="display:block;font-size:10px;color:var(--muted);margin-bottom:4px">To Date</label>
            <input type="date" value="${_shipDateTo}" onchange="shipSetDateTo(this.value)" style="padding:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
          </div>
          <button onclick="shipClearFilters()" class="btn-secondary" style="padding:6px 12px;font-size:10px">Clear</button>
        </div>
      </div>

      <!-- Batch actions -->
      ${_shipSelection.size > 0 ? `
        <div style="padding:10px 14px;background:rgba(87,200,255,0.05);border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center;font-size:11px;color:var(--muted)">
          <span>${_shipSelection.size} selected</span>
          <button onclick="shipBatchMark()" class="btn-primary" style="padding:5px 10px;font-size:10px">Mark Shipped</button>
          <button onclick="shipPrintBatchSlips()" class="btn-secondary" style="padding:5px 10px;font-size:10px">Print Slips</button>
          <button onclick="shipClearSel()" class="btn-danger" style="padding:5px 10px;font-size:10px">Clear</button>
        </div>
      ` : ''}

      <!-- Actions bar -->
      <div style="padding:10px 14px;border-bottom:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap">
        <button onclick="shipExportLog()" class="btn-secondary" style="padding:6px 12px;font-size:10px">Export Log</button>
      </div>

      <!-- Table/cards -->
      ${pageItems.length === 0 ? `
        <div class="empty-state">
          <p style="font-size:12px;color:var(--muted)">No orders to ship</p>
        </div>
      ` : `
        <div style="overflow-x:auto">
          <table class="inv-table">
            <thead>
              <tr style="border-bottom:1px solid var(--border)">
                <th style="padding:10px;text-align:left;font-size:10px;color:var(--muted);font-weight:600">
                  <input type="checkbox" ${allSelected ? 'checked' : ''} onchange="shipToggleAll(this)" />
                </th>
                <th style="padding:10px;text-align:left;font-size:10px;color:var(--muted);font-weight:600">Item</th>
                <th style="padding:10px;text-align:left;font-size:10px;color:var(--muted);font-weight:600">Buyer</th>
                <th style="padding:10px;text-align:left;font-size:10px;color:var(--muted);font-weight:600">Platform</th>
                <th style="padding:10px;text-align:left;font-size:10px;color:var(--muted);font-weight:600">Date Sold</th>
                <th style="padding:10px;text-align:left;font-size:10px;color:var(--muted);font-weight:600">Weight</th>
                <th style="padding:10px;text-align:left;font-size:10px;color:var(--muted);font-weight:600">Package</th>
                <th style="padding:10px;text-align:left;font-size:10px;color:var(--muted);font-weight:600">Status</th>
                <th style="padding:10px;text-align:center;font-size:10px;color:var(--muted);font-weight:600">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pageItems.map(s => {
                const item = getInvItem(s.itemId);
                const pkg = item ? suggestPackage(item) : null;
                const isSelected = _shipSelection.has(s.id);
                return `
                  <tr style="border-bottom:1px solid var(--border);background:${isSelected ? 'rgba(87,200,255,0.05)' : 'transparent'}">
                    <td style="padding:10px"><input type="checkbox" ${isSelected ? 'checked' : ''} onchange="shipToggleSel('${s.id}')" /></td>
                    <td style="padding:10px;font-size:11px;color:var(--text)">${escHtml(item ? item.name : '—')}</td>
                    <td style="padding:10px;font-size:11px;color:var(--text)">${escHtml(s.buyerName || '—')}</td>
                    <td style="padding:10px;font-size:10px;color:var(--muted)">${escHtml(s.platform || '—')}</td>
                    <td style="padding:10px;font-size:10px;color:var(--muted)">${ds(s.date)}</td>
                    <td style="padding:10px;font-size:10px;color:var(--muted)">${item && item.weight ? item.weight + (item.dimUnit || 'oz') : '—'}</td>
                    <td style="padding:10px;font-size:10px;color:var(--accent)">${pkg ? escHtml(pkg.name) : '—'}</td>
                    <td style="padding:10px;font-size:10px">
                      <span style="color:${s.shipped ? 'var(--good)' : 'var(--warn)'}">
                        ${s.shipped ? `✓ ${ds(s.shippedDate)}` : 'Pending'}
                      </span>
                    </td>
                    <td style="padding:10px;text-align:center;font-size:10px;display:flex;gap:6px;justify-content:center">
                      ${!s.shipped ? `<button onclick="shipMarkShipped('${s.id}')" class="act-btn" style="padding:4px 8px">Mark</button>` : ''}
                      <button onclick="shipPrintSlip('${s.id}')" class="act-btn" style="padding:4px 8px">Slip</button>
                      ${s.trackingNumber ? `<a href="https://tools.usps.com/go/TrackConfirmAction_input?tLabels=${encodeURIComponent(s.trackingNumber)}" target="_blank" class="act-btn" style="padding:4px 8px;text-decoration:none">Track</a>` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}

      <!-- Pagination -->
      <div id="shipPagination" style="padding:14px"></div>

      <!-- RETURNS MANAGEMENT -->
      <div style="margin-top:20px;border-top:2px solid var(--border);padding-top:20px">
        <div style="padding:12px;background:var(--surface);border-radius:6px;border:1px solid var(--border);margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${_showReturnForm ? '12px' : '0'}">
            <h3 class="panel-title" style="margin:0">Returns Management</h3>
            <button onclick="shipToggleReturnForm()" class="btn-secondary" style="padding:6px 12px;font-size:10px">${_showReturnForm ? 'Hide' : 'Log Return'}</button>
          </div>

          ${_showReturnForm ? `
            <div style="display:grid;gap:10px;padding:12px;background:rgba(var(--surface-rgb),0.5);border-radius:4px;border:1px solid var(--border)">
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Sale ID</label>
                <select id="return_sale" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%">
                  <option value="">— Select Sale —</option>
                  ${sales.slice().reverse().slice(0, 20).map(s => {
                    const item = getInvItem(s.itemId);
                    return `<option value="${s.id}">${item?.name || 'Item'} - ${s.buyerName || 'Buyer'}</option>`;
                  }).join('')}
                </select>
              </div>
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Reason</label>
                <select id="return_reason" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%">
                  <option value="">— Select Reason —</option>
                  <option>Defective</option>
                  <option>Wrong Item</option>
                  <option>Buyer Remorse</option>
                  <option>Damaged in Shipping</option>
                  <option>Other</option>
                </select>
              </div>
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Refund Amount ($)</label>
                <input id="return_refund" type="number" placeholder="0.00" step="0.01" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
              </div>
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Notes</label>
                <textarea id="return_notes" placeholder="Return notes..." style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%;resize:vertical" rows="2"></textarea>
              </div>
              <button onclick="shipLogReturn()" class="btn-primary" style="padding:8px 12px;font-weight:600;font-family:'Syne',sans-serif;font-size:11px">Log Return</button>
            </div>
          ` : ''}
        </div>

        ${(() => {
          const totalReturns = _returns.length;
          const totalRefunded = _returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
          const recentReturns = _returns.slice().reverse().slice(0, 5);

          return `
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:12px">
              <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
                <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Total Returns</div>
                <div style="font-size:18px;font-weight:700;color:var(--warn);font-family:'Syne',sans-serif">${totalReturns}</div>
              </div>
              <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
                <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Total Refunded</div>
                <div style="font-size:18px;font-weight:700;color:var(--danger);font-family:'Syne',sans-serif">${fmt(totalRefunded)}</div>
              </div>
            </div>

            ${recentReturns.length ? `
              <div style="padding:12px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
                <div style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:8px">Recent Returns</div>
                <div style="display:flex;flex-direction:column;gap:6px">
                  ${recentReturns.map(ret => {
                    const retSale = sales.find(s => s.id === ret.saleId);
                    const retItem = retSale ? getInvItem(retSale.itemId) : null;
                    return `
                      <div style="padding:8px;background:rgba(var(--surface-rgb),0.5);border-radius:3px;border-left:3px solid var(--danger);font-size:10px;font-family:'DM Mono',monospace">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                          <span style="color:var(--text);font-weight:600">${retItem?.name || 'Unknown Item'}</span>
                          <span style="color:var(--danger)">${fmt(ret.refundAmount)}</span>
                        </div>
                        <div style="color:var(--muted);font-size:9px">${ret.reason} • ${ds(ret.date)}</div>
                        ${ret.notes ? `<div style="color:var(--muted);font-size:9px;margin-top:4px">${escHtml(ret.notes)}</div>` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}
          `;
        })()}
      </div>
    </div>
  `;

  // Render pagination
  renderPagination(document.getElementById('shipPagination'), {
    page: _shipPage,
    totalItems: filtered.length,
    pageSize: _shipPageSize,
    onPage: (p) => { _shipPage = p; renderShippingView(); }
  });
}

// ── MODAL HTML (to be inserted into DOM once) ──────────────────────────────────

export function initShippingModals() {
  const modalsContainer = document.getElementById('modals-root');
  if (!modalsContainer || document.getElementById('shipModal')) return;

  modalsContainer.insertAdjacentHTML('beforeend', `
    <!-- Mark Shipped Modal -->
    <div id="shipModal" class="overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Mark Order Shipped</h3>
          <button onclick="shipCancelMark()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px">✕</button>
        </div>
        <div class="modal-body" style="padding:14px;display:grid;gap:10px">
          <div class="fgrp">
            <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Carrier</label>
            <select id="shipCarrier" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%">
              <option>USPS</option>
              <option>UPS</option>
              <option>FedEx</option>
              <option>DHL</option>
              <option>Other</option>
            </select>
          </div>
          <div class="fgrp">
            <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Tracking Number</label>
            <div style="display:flex;gap:6px;align-items:flex-start">
              <input id="shipTracking" type="text" placeholder="e.g., 9400111899223456789012" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;flex:1" oninput="shipCheckTracking()" />
              <div id="shipTrackingIndicator" style="display:none;padding:8px;border-radius:4px;font-size:10px;font-weight:600;min-width:60px;text-align:center;white-space:nowrap"></div>
            </div>
          </div>
          <div class="fgrp">
            <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Actual Shipping Cost ($)</label>
            <input id="shipCost" type="number" placeholder="0.00" step="0.01" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
          </div>
        </div>
        <div class="modal-footer" style="padding:10px 14px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end">
          <button onclick="shipCancelMark()" class="btn-secondary">Cancel</button>
          <button onclick="shipConfirmShipped(document.getElementById('shipModal').dataset.activeSaleId)" class="btn-primary">Confirm</button>
        </div>
      </div>
    </div>

    <!-- Batch Mark Shipped Modal -->
    <div id="shipBatchModal" class="overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Mark Selected as Shipped</h3>
          <button onclick="shipCancelBatchMark()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px">✕</button>
        </div>
        <div class="modal-body" style="padding:14px;display:grid;gap:10px">
          <div class="fgrp">
            <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Carrier</label>
            <select id="shipBatchCarrier" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%">
              <option value="">— Select —</option>
              <option>USPS</option>
              <option>UPS</option>
              <option>FedEx</option>
              <option>DHL</option>
              <option>Other</option>
            </select>
          </div>
          <p style="font-size:11px;color:var(--muted)">Tracking numbers can be added individually after batch mark.</p>
        </div>
        <div class="modal-footer" style="padding:10px 14px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end">
          <button onclick="shipCancelBatchMark()" class="btn-secondary">Cancel</button>
          <button onclick="shipConfirmBatchMark()" class="btn-primary">Mark All</button>
        </div>
      </div>
    </div>
  `);
}
