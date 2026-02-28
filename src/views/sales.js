/**
 * Sales View Module
 * Handles recording sales, managing sold items modal, and rendering sales history.
 * Uses shared pagination component and proper imports (no stub functions).
 */

import {
  inv, sales, getInvItem,
  save, refresh, pushUndo, showUndoToast,
  markDirty, markDeleted,
} from '../data/store.js';

import { fmt, pct, escHtml, uid, ds } from '../utils/format.js';
import { PLATFORMS, platCls, PLATFORM_FEES, calcPlatformFee } from '../config/platforms.js';
import { toast } from '../utils/dom.js';
import { _sfx } from '../utils/sfx.js';
import { parseNum, validateNumericInput } from '../utils/validate.js';
import { pushDeleteToCloud, autoSync } from '../data/sync.js';
import { getPlatforms, renderPlatTags } from '../features/platforms.js';
import { autoDlistOnSale, setListingDate } from '../features/crosslist.js';
import { logSalePrice } from '../features/price-history.js';
import { getOrCreateBuyer } from '../views/buyers.js';
import { openMaterialsModal } from '../modals/materials.js';
import { openDrawer } from '../modals/drawer.js';
import { renderPagination } from '../utils/pagination.js';

// ── STATE ─────────────────────────────────────────────────────────────────────

let activeSoldId = null;
let _sPriceType = 'each'; // 'each' or 'total'
let _salePage = 0;
const _salePageSize = 50;
let _salesSearch = '';
let _salesDateFrom = '';
let _salesDateTo = '';

// ── SOLD MODAL ────────────────────────────────────────────────────────────────

export function openSoldModal(id) {
  // If no ID provided, show an item picker first
  if (!id) {
    const inStock = inv.filter(i => i.qty > 0 && !i._del);
    if (!inStock.length) { toast('No items in stock to sell', true); return; }
    // Build item picker in the soldInfo area
    activeSoldId = null;
    const infoEl = document.getElementById('soldInfo');
    infoEl.innerHTML = `
      <div class="fgrp full" style="margin-bottom:8px">
        <label style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Select Item to Sell</label>
        <select id="s_item_picker" style="background:var(--surface);border:1px solid var(--border);color:var(--text);padding:9px 12px;font-family:'DM Mono',monospace;font-size:12px;width:100%" onchange="onSoldItemPick(this.value)">
          <option value="">── Choose an item ──</option>
          ${inStock.map(i => `<option value="${i.id}">${escHtml(i.name)} (${i.qty} in stock — ${fmt(i.price)})</option>`).join('')}
        </select>
      </div>`;
    // Reset form fields
    document.getElementById('s_price').value = '';
    document.getElementById('s_qty').value = '1';
    document.getElementById('s_fees').value = '';
    document.getElementById('s_ship').value = '';
    document.getElementById('s_date').value = new Date().toISOString().split('T')[0];
    const sel = document.getElementById('s_platform');
    sel.innerHTML = `<option value="" disabled selected>── Select platform ──</option>` +
      PLATFORMS.map(p => `<option value="${p}">${escHtml(p)}</option>`).join('');
    sPriceType('each');
    updateFeeEstimate();
    document.getElementById('soldOv').classList.add('on');
    return;
  }

  activeSoldId = id;
  const item = inv.find(i => i.id === id);
  if (!item) { toast('Item not found', true); return; }
  _populateSoldModal(item);
  document.getElementById('soldOv').classList.add('on');
}

/** Called when user picks an item from the dropdown in the no-ID sold modal */
export function onSoldItemPick(id) {
  if (!id) return;
  activeSoldId = id;
  const item = inv.find(i => i.id === id);
  if (!item) return;
  _populateSoldModal(item);
}

function _populateSoldModal(item) {
  const { pu, m } = calc(item);
  const infoEl = document.getElementById('soldInfo');
  // Keep the picker if it exists, append item details below it
  const pickerEl = document.getElementById('s_item_picker');
  const pickerHtml = pickerEl ? pickerEl.parentElement.outerHTML : '';
  infoEl.innerHTML = pickerHtml + `
    <div class="sir"><span class="k">Item</span><span>${escHtml(item.name)}</span></div>
    <div class="sir"><span class="k">Platforms</span><span>${getPlatforms(item).join(', ') || '—'}</span></div>
    <div class="sir"><span class="k">Cost</span><span>${fmt(item.cost)}</span></div>
    <div class="sir"><span class="k">List Price</span><span>${fmt(item.price)}</span></div>
    <div class="sir"><span class="k">Expected Profit</span><span style="color:var(--good)">${fmt(pu)} (${pct(m)})</span></div>
    <div class="sir"><span class="k">In Stock</span><span>${item.qty} units</span></div>`;
  // Update the picker selection if it exists
  if (pickerEl) {
    const newPicker = document.getElementById('s_item_picker');
    if (newPicker) newPicker.value = item.id;
  }
  document.getElementById('s_price').value = item.price || '';
  document.getElementById('s_qty').value = '1';
  document.getElementById('s_fees').value = item.fees || '';
  document.getElementById('s_ship').value = item.ship || '';
  document.getElementById('s_date').value = new Date().toISOString().split('T')[0];
  // Build platform dropdown — item's own platforms first, then the rest
  const itemPlats = getPlatforms(item);
  const others = PLATFORMS.filter(p => !itemPlats.includes(p));
  const sel = document.getElementById('s_platform');
  sel.innerHTML = [
    ...itemPlats.map(p => `<option value="${p}" selected>${escHtml(p)} ★</option>`),
    `<option value="" disabled>${itemPlats.length ? '── Other platforms ──' : '── Select platform ──'}</option>`,
    ...others.map(p => `<option value="${p}">${escHtml(p)}</option>`)
  ].join('');
  if (itemPlats.length) sel.value = itemPlats[0];
  sPriceType('each');
  updateFeeEstimate();
}

// ── PRICE TYPE SELECTOR ───────────────────────────────────────────────────────

export function sPriceType(type) {
  _sPriceType = type;
  const eachBtn = document.getElementById('s_price_each');
  const totalBtn = document.getElementById('s_price_total');
  const on = "flex:1;padding:8px 6px;font-family:'DM Mono',monospace;font-size:11px;border:1px solid var(--accent);background:var(--accent);color:#0a0a0f;cursor:pointer;border-radius:0;font-weight:700";
  const off = "flex:1;padding:8px 6px;font-family:'DM Mono',monospace;font-size:11px;border:1px solid var(--border);background:var(--surface);color:var(--muted);cursor:pointer;border-radius:0";
  if (eachBtn) eachBtn.style.cssText = type === 'each' ? on : off;
  if (totalBtn) totalBtn.style.cssText = type === 'total' ? on : off;
  updateSalePriceHint();
}

// ── SALES FILTERS ─────────────────────────────────────────────────────────────

export function setSalesSearch(val) { _salesSearch = (val || '').toLowerCase(); _salePage = 0; renderSalesView(); }
export function setSalesDateFrom(val) { _salesDateFrom = val || ''; _salePage = 0; renderSalesView(); }
export function setSalesDateTo(val) { _salesDateTo = val || ''; _salePage = 0; renderSalesView(); }
export function clearSalesFilters() { _salesSearch = ''; _salesDateFrom = ''; _salesDateTo = ''; _salePage = 0; renderSalesView(); }

// ── PRICE HINT ────────────────────────────────────────────────────────────────

export function updateSalePriceHint() {
  const qty = parseInt(document.getElementById('s_qty').value) || 1;
  const price = parseFloat(document.getElementById('s_price').value) || 0;
  const hint = document.getElementById('s_price_hint');
  if (!hint) return;
  if (_sPriceType === 'each') {
    hint.textContent = qty > 1 ? `Per unit · total = ${fmt(price * qty)}` : 'Price per individual unit';
  } else {
    hint.textContent = qty > 1 ? `Total for all ${qty} units · each = ${fmt(price / qty)}` : 'Total sale price';
  }
}

// ── FEE ESTIMATION ────────────────────────────────────────────────────────────

export function updateFeeEstimate() {
  const platform = document.getElementById('s_platform').value;
  const price = parseFloat(document.getElementById('s_price').value) || 0;
  const hint = document.getElementById('s_fee_hint');
  if (!hint) return;
  const feeData = PLATFORM_FEES[platform];
  if (!feeData) { hint.style.display = 'none'; return; }
  hint.style.display = '';
  if (price > 0) {
    const est = calcPlatformFee(platform, price);
    hint.innerHTML = `${feeData.label} · est. <strong style="color:var(--accent)">${fmt(est)}</strong> <button onclick="document.getElementById('s_fees').value=${est};this.textContent='Applied ✓'" style="background:none;border:1px solid var(--border);color:var(--accent);font-size:9px;padding:2px 8px;cursor:pointer;font-family:'DM Mono',monospace;margin-left:4px">Apply</button>`;
  } else {
    hint.textContent = feeData.label;
  }
}

// ── MODAL CLOSE ───────────────────────────────────────────────────────────────

export function closeSold() {
  document.getElementById('soldOv').classList.remove('on');
  const buyerEl = document.getElementById('s_buyer');
  if (buyerEl) buyerEl.value = '';
  activeSoldId = null;
}

// ── RECORD SALE ───────────────────────────────────────────────────────────────

export function recSale() {
  const item = inv.find(i => i.id === activeSoldId);
  if (!item) { toast('Item not found — it may have been deleted', true); closeSold(); return; }

  // Validate numeric fields
  const priceEl = document.getElementById('s_price');
  const rawPrice = parseNum(priceEl.value, { fieldName: 'Price' });
  if (isNaN(rawPrice) && priceEl.value.trim() !== '') {
    validateNumericInput(priceEl, { fieldName: 'Price' });
    return;
  }
  if (!rawPrice) { toast('Sold price required', true); return; }

  const qtyEl = document.getElementById('s_qty');
  const qty = parseNum(qtyEl.value, { fieldName: 'Quantity', integer: true, min: 1 });
  if (isNaN(qty)) {
    validateNumericInput(qtyEl, { fieldName: 'Quantity', integer: true });
    return;
  }
  if (qty > item.qty) { toast(`Only ${item.qty} available`, true); return; }

  const feesEl = document.getElementById('s_fees');
  const fees = parseNum(feesEl.value, { fieldName: 'Fees', allowZero: true });
  if (isNaN(fees) && feesEl.value.trim() !== '') {
    validateNumericInput(feesEl, { fieldName: 'Fees' });
    return;
  }

  const shipEl = document.getElementById('s_ship');
  const ship = parseNum(shipEl.value, { fieldName: 'Shipping', allowZero: true });
  if (isNaN(ship) && shipEl.value.trim() !== '') {
    validateNumericInput(shipEl, { fieldName: 'Shipping' });
    return;
  }

  // Convert to per-unit price for storage
  const price = _sPriceType === 'total' ? rawPrice / qty : rawPrice;
  const platform = document.getElementById('s_platform').value || 'Other';
  const sale = {
    id: uid(), itemId: activeSoldId, price, listPrice: item.price || 0,
    qty, platform,
    fees: isNaN(fees) ? 0 : fees,
    ship: isNaN(ship) ? 0 : ship,
    date: document.getElementById('s_date').value || new Date().toISOString()
  };
  pushUndo('sold', { itemId: activeSoldId, qty, saleId: sale.id });
  sales.push(sale);
  markDirty('sales', sale.id);
  logSalePrice(item.id, price, platform);
  // Link sale to buyer if buyer name provided
  const buyerName = (document.getElementById('s_buyer')?.value || '').trim();
  if (buyerName) {
    const buyer = getOrCreateBuyer(buyerName, platform);
    if (buyer) sale.buyerId = buyer.id;
  }
  item.qty -= qty;
  // Auto-mark platform as sold
  if (platform) {
    if (!item.platformStatus) item.platformStatus = {};
    item.platformStatus[platform] = 'sold';
    // Auto-delist on other platforms when fully sold out
    const marked = autoDlistOnSale(item.id, platform);
    if (marked.length) {
      toast(`Auto-marked ${marked.join(', ')} as sold-elsewhere`);
    }
  }
  markDirty('inv', item.id);
  save();
  closeSold();
  refresh();
  _sfx.sale();
  showUndoToast('Item marked as sold');
  // Prompt for materials used if any supplies exist
  openMaterialsModal(() => {});
}

// ── LOCAL CALC HELPER ─────────────────────────────────────────────────────────

function calc(item) {
  const cost = item.cost || 0, price = item.price || 0;
  const fees = item.fees || 0, ship = item.ship || 0;
  const pu = price - cost - fees - ship;
  const m = price ? pu / price : 0;
  const roi = cost ? pu / cost : 0;
  return { cost, price, fees, ship, pu, m, roi };
}

// ── SALES VIEW RENDERING ──────────────────────────────────────────────────────

export function renderSalesView() {
  const tbody = document.getElementById('salesBody');
  const empty = document.getElementById('salesEmpty');
  const pagEl = document.getElementById('salesPagination');

  let rev = 0, profit = 0;
  for (const s of sales) {
    const it = getInvItem(s.itemId);
    rev += (s.price || 0) * (s.qty || 0);
    profit += (s.price || 0) * (s.qty || 0) - (it ? (it.cost || 0) * (s.qty || 0) : 0) - (s.fees || 0) - (s.ship || 0);
  }
  document.getElementById('salesTotalLbl').textContent =
    `${sales.length} sales · ${fmt(rev)} revenue · ${fmt(profit)} profit`;

  const all = [...sales].reverse();

  // Apply search filter
  let filtered = all;
  if (_salesSearch) {
    filtered = filtered.filter(s => {
      const it = getInvItem(s.itemId);
      const name = it ? it.name.toLowerCase() : '';
      const cat = it ? (it.category || '').toLowerCase() : '';
      const plat = (s.platform || '').toLowerCase();
      return name.includes(_salesSearch) || cat.includes(_salesSearch) || plat.includes(_salesSearch);
    });
  }
  // Apply date range filter
  if (_salesDateFrom) {
    filtered = filtered.filter(s => s.date >= _salesDateFrom);
  }
  if (_salesDateTo) {
    filtered = filtered.filter(s => s.date <= _salesDateTo);
  }

  // Render filter bar
  const filterBar = document.getElementById('salesFilterBar');
  if (filterBar) {
    filterBar.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 0">
      <input type="text" placeholder="Search sales..." value="${escHtml(_salesSearch)}"
             oninput="setSalesSearch(this.value)"
             style="flex:1;min-width:150px;padding:6px 10px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:12px;font-family:'DM Mono',monospace">
      <input type="date" value="${_salesDateFrom}" onchange="setSalesDateFrom(this.value)" title="From date"
             style="padding:5px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:11px;font-family:'DM Mono',monospace">
      <span style="color:var(--muted);font-size:11px">to</span>
      <input type="date" value="${_salesDateTo}" onchange="setSalesDateTo(this.value)" title="To date"
             style="padding:5px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:11px;font-family:'DM Mono',monospace">
      ${(_salesSearch || _salesDateFrom || _salesDateTo) ? `<button onclick="clearSalesFilters()" style="padding:5px 10px;background:var(--surface);border:1px solid var(--border);color:var(--danger);font-size:11px;cursor:pointer;font-family:'DM Mono',monospace">Clear</button>` : ''}
      <span style="color:var(--muted);font-size:11px">${filtered.length} of ${all.length} sales</span>
    </div>`;
  }

  if (!filtered.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    if (pagEl) pagEl.innerHTML = '';
    return;
  }
  empty.style.display = 'none';

  // Pagination
  const totalPages = Math.ceil(filtered.length / _salePageSize);
  if (_salePage >= totalPages) _salePage = totalPages - 1;
  if (_salePage < 0) _salePage = 0;
  const start = _salePage * _salePageSize;
  const page = filtered.slice(start, start + _salePageSize);

  tbody.innerHTML = page.map(s => {
    const it = getInvItem(s.itemId);
    const nm = it ? escHtml(it.name) : 'Deleted Item';
    const cost = it ? (it.cost || 0) * (s.qty || 0) : 0;
    const sRev = (s.price || 0) * (s.qty || 0);
    const pr = sRev - cost - (s.fees || 0) - (s.ship || 0);
    const lp = s.listPrice || (it ? it.price : 0);
    const priceDiff = lp > 0 ? ((s.price - lp) / lp) : 0;
    const priceTag = lp > 0
      ? (priceDiff > 0.01
        ? `<span style="font-size:9px;color:var(--good);font-family:'DM Mono',monospace">▲${pct(priceDiff)}</span>`
        : priceDiff < -0.01
          ? `<span style="font-size:9px;color:var(--danger);font-family:'DM Mono',monospace">▼${pct(Math.abs(priceDiff))}</span>`
          : `<span style="font-size:9px;color:var(--muted);font-family:'DM Mono',monospace">= list</span>`)
      : '';
    return `<tr>
      <td><div class="item-name" style="cursor:${it ? 'pointer' : 'default'}" ${it ? `onclick="openDrawer('${escHtml(it.id)}')"` : ''}>${nm}</div>${it?.category ? `<div class="item-meta"><span class="cat-tag">${escHtml(it.category)}</span></div>` : ''}</td>
      <td>${s.platform ? `<span class="plat-tag ${platCls(s.platform) || ''}">${escHtml(s.platform)}</span>` : (it ? renderPlatTags(it) : '-')}</td>
      <td style="color:var(--muted);font-size:11px">${ds(s.date)}</td>
      <td>${s.qty}</td>
      <td>${fmt(s.price)} ${priceTag}</td>
      <td style="color:var(--muted)">${fmt(it ? it.cost : 0)}</td>
      <td style="color:var(--muted)">${fmt((s.fees || 0) + (s.ship || 0))}</td>
      <td style="font-family:'Syne',sans-serif;font-weight:700;color:${pr >= 0 ? 'var(--good)' : 'var(--danger)'}">${fmt(pr)}</td>
      <td><div class="td-acts"><button class="act-btn red" onclick="delSale('${escHtml(s.id)}')">✕</button></div></td>
    </tr>`;
  }).join('');

  // Render pagination controls
  if (pagEl) {
    renderPagination(pagEl, {
      page: _salePage,
      totalItems: filtered.length,
      pageSize: _salePageSize,
      onPage: (p) => { _salePage = p; renderSalesView(); },
    });
  }
}
