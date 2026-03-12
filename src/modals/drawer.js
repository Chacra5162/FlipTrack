// Drawer modal functions for item editing
// Dependencies: Global state (inv, sales, activeDrawId), utilities (calc, sc, mkc, fmt, pct, ds, escHtml, uid, toast, _sfx)
// DOM elements, form helpers (renderDrawerImg, renderDrawerBarcode, loadDimsToForm, suggestPackaging, getPlatforms, buildPlatPicker, getSelectedPlats, getDimsFromForm)
// Other modals: book-mode functions, trash functions

import { SUBCATS, SUBSUBCATS } from '../config/categories.js';
import { fmt, pct, ds, escHtml, escAttr, uid } from '../utils/format.js';
import { toast, trapFocus, releaseFocus } from '../utils/dom.js';
import { _sfx } from '../utils/sfx.js';
import { parseNum, validateNumericInput } from '../utils/validate.js';
import {
  inv, sales, activeDrawId, setActiveDrawId, save, refresh, calc, sc, mkc, markDirty, normCat
} from '../data/store.js';
import {
  toggleBookFields,
  isBookCat,
  getBookFields,
  loadBookFields
} from './book-mode.js';
import { softDeleteItem } from '../data/store.js';
import { getDaysUntilExpiry, STATUS_LABELS, STATUS_COLORS, LISTING_STATUSES, markPlatformStatus, relistItem, setListingDate } from '../features/crosslist.js';
import { generateListingLink, copyListingText } from '../features/deep-links.js';
import { pushDeleteToCloud } from '../data/sync.js';
import { logPriceChange, snapshotItem, logItemChanges, renderItemTimeline } from '../features/price-history.js';

// Stores the item snapshot taken when drawer opens, for diff on save
let _drawerSnapshot = null;
import { pushEtsyPrice } from '../features/etsy-sync.js';
import { updateEBayListing } from '../features/ebay-sync.js';
import { isEBayConnected } from '../features/ebay-auth.js';
import { getPlatforms, buildPlatPicker, getSelectedPlats } from '../features/platforms.js';
import { PLATFORM_FEES, calcPlatformFee } from '../config/platforms.js';
import { loadDimsToForm, getDimsFromForm, suggestPackaging } from '../features/dimensions.js';
import { renderDrawerBarcode } from '../features/barcodes.js';
import { toggleBulkFields, getSmokeValue, loadSmokeSlider, getCoverValue, loadCoverSlider } from './add-item.js';
import { refreshAutocompleteLists, saveAutocompleteEntry } from '../utils/autocomplete.js';

// Case-insensitive SUBCATS lookup — "books" matches "Books", etc.
function getSubcats(cat) {
  if (!cat) return [];
  if (SUBCATS[cat]) return SUBCATS[cat];
  const lower = cat.toLowerCase();
  const key = Object.keys(SUBCATS).find(k => k.toLowerCase() === lower);
  return key ? SUBCATS[key] : [];
}

export function populateSubcatSelect(selectId, category, currentValue) {
  const subs = getSubcats(category);
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const grpId = selectId === 'd_subcat' ? 'd_subcat_grp' : 'f_subcat_grp';
  const grp = document.getElementById(grpId);
  if (subs.length) {
    sel.innerHTML = '<option value="">— None —</option>' + subs.map(s=>`<option value="${s}" ${s===currentValue?'selected':''}>${s}</option>`).join('');
    if (grp) grp.style.display = '';
  } else {
    sel.innerHTML = '<option value="">— None —</option>';
    if (grp) grp.style.display = 'none';
  }
}

// ── Custom Type Persistence ──────────────────────────────────────────────────
const CUSTOM_TYPES_KEY = 'ft_custom_types';

function getCustomTypes() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_TYPES_KEY)) || {}; } catch { return {}; }
}

export function saveCustomType(subcategory, type) {
  if (!subcategory || !type) return;
  const predefined = SUBSUBCATS[subcategory] || [];
  if (predefined.includes(type)) return; // already built-in
  const custom = getCustomTypes();
  if (!custom[subcategory]) custom[subcategory] = [];
  if (custom[subcategory].includes(type)) return; // already saved
  custom[subcategory].push(type);
  localStorage.setItem(CUSTOM_TYPES_KEY, JSON.stringify(custom));
}

function getMergedTypes(subcategory) {
  const predefined = SUBSUBCATS[subcategory] || [];
  const custom = (getCustomTypes()[subcategory] || []);
  // Also scan inventory for types used with this subcategory
  const fromInv = [...new Set(inv.filter(i => (i.subcategory || '') === subcategory && i.subtype).map(i => i.subtype))];
  // Merge and deduplicate, predefined first
  const all = [...predefined];
  for (const t of [...custom, ...fromInv]) {
    if (!all.includes(t)) all.push(t);
  }
  return all;
}

export function populateSubtypeSelect(prefix, subcategory, currentValue) {
  const txtId = prefix + '_subtype_txt';
  const dlId  = prefix + '_subtype_dl';
  const lblId = prefix + '_subtype_lbl';
  const txtEl = document.getElementById(txtId);
  const dlEl  = document.getElementById(dlId);
  const lblEl = document.getElementById(lblId);
  if (!txtEl) return;
  // Dynamic label
  const label = ['Men','Women','Children'].includes(subcategory) ? 'Clothing Type' : 'Type';
  if (lblEl) lblEl.textContent = label;
  // Populate datalist with merged types
  const types = getMergedTypes(subcategory);
  if (dlEl) dlEl.innerHTML = types.map(t => `<option value="${t}">`).join('');
  // Set current value
  txtEl.value = currentValue || '';
}

export function syncDrawerSubcat() {
  const cat = document.getElementById('d_cat').value.trim();
  // Populate datalist with known subcats for this category
  const subs = getSubcats(cat);
  const dl = document.getElementById('d_subcat_dl');
  if (dl) dl.innerHTML = subs.map(s => `<option value="${s}">`).join('');
  // Keep the hidden select in sync for legacy data reads
  populateSubcatSelect('d_subcat', cat, document.getElementById('d_subcat_txt').value);
  populateSubtypeSelect('d', (document.getElementById('d_subcat_txt').value||'').trim(), '');
  toggleBookFields('d');
}

export function syncDrawerSubtype() {
  const current = (document.getElementById('d_subtype_txt')?.value) || '';
  populateSubtypeSelect('d', (document.getElementById('d_subcat_txt').value||'').trim(), current);
}

export function syncAddSubcat() {
  const cat = document.getElementById('f_cat').value.trim();
  const subs = getSubcats(cat);
  const dl = document.getElementById('f_subcat_dl');
  if (dl) dl.innerHTML = subs.map(s => `<option value="${s}">`).join('');
  populateSubcatSelect('f_subcat', cat, document.getElementById('f_subcat_txt').value);
  populateSubtypeSelect('f', (document.getElementById('f_subcat_txt').value||'').trim(), '');
  toggleBookFields('f');
}

export function syncAddSubtype() {
  const current = (document.getElementById('f_subtype_txt')?.value) || '';
  populateSubtypeSelect('f', (document.getElementById('f_subcat_txt').value||'').trim(), current);
}

export function openDrawer(id) {
  setActiveDrawId(id);
  const item=inv.find(i=>i.id===id); if(!item) return;
  _drawerSnapshot = snapshotItem(item);
  // Refresh autocomplete suggestions for Source & Brand
  refreshAutocompleteLists().catch(() => {});
  document.getElementById('dName').textContent=item.name;
  document.getElementById('dSku').textContent=item.sku?`SKU: ${item.sku}`:'No SKU';
  const {pu,m,roi}=calc(item);
  const iSales=sales.filter(s=>s.itemId===id);
  const totSold=iSales.reduce((a,s)=>a+(s.qty||0),0);
  const totRev =iSales.reduce((a,s)=>a+(s.price||0)*(s.qty||0),0);
  const c=sc(item.qty,item.lowAlert,item.bulk);
  document.getElementById('dMets').innerHTML=`
    <div class="d-met"><div class="dm-lbl">In Stock</div><div class="dm-val" style="color:${mkc(c)}">${item.qty||0}</div></div>
    <div class="d-met"><div class="dm-lbl">Profit/Unit</div><div class="dm-val" style="color:var(--good)">${fmt(pu)}</div></div>
    <div class="d-met"><div class="dm-lbl">Margin</div><div class="dm-val" style="color:var(--accent)">${pct(m)}</div></div>
    <div class="d-met"><div class="dm-lbl">ROI</div><div class="dm-val" style="color:var(--accent3)">${pct(roi)}</div></div>
    <div class="d-met"><div class="dm-lbl">Units Sold</div><div class="dm-val">${totSold}</div></div>
    <div class="d-met"><div class="dm-lbl">Total Revenue</div><div class="dm-val">${fmt(totRev)}</div></div>`;
  const fields={d_name:'name',d_sku:'sku',d_upc:'upc',d_cat:'category',d_cost:'cost',d_price:'price',d_fees:'fees',d_ship:'ship',d_notes:'notes',d_url:'url',d_alert:'lowAlert',d_source:'source',d_brand:'brand',d_color:'color',d_size:'size',d_sizeType:'sizeType',d_department:'department',d_material:'material',d_mpn:'mpn',d_model:'model',d_style:'style',d_pattern:'pattern',d_ebay_desc:'ebayDesc'};
  for(const[eid,key]of Object.entries(fields)){const el=document.getElementById(eid);if(el)el.value=item[key]||'';}
  // Populate subcategory text input and datalist suggestions
  const subcatTxt = document.getElementById('d_subcat_txt');
  if (subcatTxt) subcatTxt.value = item.subcategory || '';
  const subs = getSubcats(item.category||'');
  const dl = document.getElementById('d_subcat_dl');
  if (dl) dl.innerHTML = subs.map(s => `<option value="${s}">`).join('');
  // Bulk toggle
  const dBulk = document.getElementById('d_bulk');
  if (dBulk) { dBulk.checked = !!item.bulk; toggleBulkFields('d'); }
  buildPlatPicker('d_plat_picker', getPlatforms(item));
  renderListingStatus(item);
  renderFeeCalc(item);
  loadCondTag('d', item.condition || '');
  loadSmokeSlider('d', item.smoke || null);
  populateSubcatSelect('d_subcat', item.category||'', item.subcategory||'');
  populateSubtypeSelect('d', item.subcategory||'', item.subtype||'');
  // Book mode
  toggleBookFields('d');
  if (isBookCat(item.category)) {
    loadBookFields('d', item);
    loadCoverSlider('d', item.coverType || null);
  }
  if (window.renderDrawerImg) window.renderDrawerImg(item.id);
  renderDrawerBarcode(item);
  loadDimsToForm('d', item);
  suggestPackaging('d');
  // Populate shipping summary
  const shipSummary = document.getElementById('d_ship_summary');
  if (shipSummary) {
    const dims = [];
    const wMaj = parseFloat(item.weightMaj) || 0;
    const wMin = parseFloat(item.weightMin) || 0;
    if (wMaj || wMin) {
      const wLabel = item.dimUnit === 'cm' ? `${wMaj} kg ${wMin} g` : `${wMaj} lb ${wMin} oz`;
      dims.push(wLabel);
    }
    if (item.dimL && item.dimW && item.dimH) dims.push(`${item.dimL}×${item.dimW}×${item.dimH} ${item.dimUnit || 'in'}`);
    shipSummary.textContent = dims.length ? `Package: ${dims.join(' · ')}` : 'Add dimensions above to see package info';
  }
  const sh=document.getElementById('dHistory');
  sh.innerHTML = renderItemTimeline(id);
  document.getElementById('drawerOv').classList.add('on');
  document.getElementById('drawer').classList.add('on');
  setTimeout(() => trapFocus('#drawer'), 100);
}

export function drawerTab(name, btn) {
  document.querySelectorAll('.drawer-tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.drawer-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('dtab-' + name).classList.add('active');
  btn.classList.add('active');
}

export function closeDrawer(){
  releaseFocus();
  document.getElementById('drawerOv').classList.remove('on');
  document.getElementById('drawer').classList.remove('on');
  // Reset to Details tab for next open
  document.querySelectorAll('.drawer-tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.drawer-tab').forEach(b => b.classList.remove('active'));
  const defaultPanel = document.getElementById('dtab-details');
  if (defaultPanel) defaultPanel.classList.add('active');
  const defaultTab = document.querySelector('.drawer-tab');
  if (defaultTab) defaultTab.classList.add('active');
  // Reset comps tab content
  if (window.resetDrawerComps) window.resetDrawerComps();
  setActiveDrawId(null);
}

/** Render per-platform fee breakdown in the drawer */
export function renderFeeCalc(item) {
  const el = document.getElementById('d_fee_calc');
  if (!el) return;
  const plats = getPlatforms(item);
  const price = item.price || 0;
  if (!plats.length || !price) {
    el.innerHTML = '<div style="font-size:11px;color:var(--muted);padding:4px 0">Add platforms and a price to see fee estimates</div>';
    return;
  }
  el.innerHTML = plats.filter(p => PLATFORM_FEES[p]).map(p => {
    const fee = calcPlatformFee(p, price);
    const net = price - fee - (item.cost || 0) - (item.ship || 0);
    const feeLabel = PLATFORM_FEES[p]?.label || '';
    return `<div class="fee-row">
      <span class="fee-plat">${p}</span>
      <span class="fee-detail">${feeLabel}</span>
      <span class="fee-amt" style="color:var(--accent2)">-${fmt(fee)}</span>
      <span class="fee-net ${net >= 0 ? 'pos' : 'neg'}">Net: ${fmt(net)}</span>
    </div>`;
  }).join('');
}

export function renderListingStatus(item) {
  const wrap = document.getElementById('d_listing_status_wrap');
  const el = document.getElementById('d_listing_status');
  const plats = getPlatforms(item);
  if (!plats.length || plats.length < 1) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  const ps = item.platformStatus || {};
  const dates = item.platformListingDates || {};
  el.innerHTML = plats.map(p => {
    const st = ps[p] || 'active';
    const label = STATUS_LABELS[st] || st;
    const color = STATUS_COLORS[st] || 'var(--muted)';
    const listedDate = dates[p];
    const daysLeft = getDaysUntilExpiry(p, listedDate);
    let expiryHtml = '';
    if (daysLeft !== null) {
      if (daysLeft < 0) expiryHtml = `<span class="ls-expiry ls-expired">Expired ${Math.abs(daysLeft)}d ago</span>`;
      else if (daysLeft <= 3) expiryHtml = `<span class="ls-expiry ls-urgent">${daysLeft}d left</span>`;
      else if (daysLeft <= 7) expiryHtml = `<span class="ls-expiry ls-warning">${daysLeft}d left</span>`;
      else expiryHtml = `<span class="ls-expiry">${daysLeft}d left</span>`;
    }
    const listedLabel = listedDate ? `<span class="ls-date">Listed ${listedDate}</span>` : '';
    const isExpiredOrDelisted = st === 'expired' || st === 'delisted' || st === 'sold-elsewhere';
    return `<div class="ls-badge-enhanced" data-status="${st}" data-plat="${escHtml(p)}">
      <div class="ls-badge-top">
        <span class="ls-dot" style="background:${color}"></span>
        <span class="ls-plat-name">${escHtml(p)}</span>
        <span class="ls-label" style="color:${color}" onclick="toggleListingStatus(this.closest('.ls-badge-enhanced'))">${label}</span>
        ${expiryHtml}
      </div>
      <div class="ls-badge-bottom">
        ${listedLabel}
        <div class="ls-badge-actions">
          ${isExpiredOrDelisted ? `<button class="btn-xs btn-accent" onclick="clRelistFromDrawer('${escAttr(item.id)}','${escAttr(p)}')">Relist</button>` : ''}
          <button class="btn-xs" onclick="clOpenLink('${escAttr(p)}','${escAttr(item.id)}')" title="Open on ${escHtml(p)}">↗</button>
          <button class="btn-xs" onclick="clCopyListing('${escAttr(item.id)}')" title="Copy listing text">📋</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

export function toggleListingStatus(el) {
  const cycle = LISTING_STATUSES;
  const current = el.getAttribute('data-status');
  const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];
  el.setAttribute('data-status', next);
  const labelEl = el.querySelector('.ls-label');
  const dotEl = el.querySelector('.ls-dot');
  if (labelEl) { labelEl.textContent = STATUS_LABELS[next] || next; labelEl.style.color = STATUS_COLORS[next] || 'var(--muted)'; }
  if (dotEl) dotEl.style.background = STATUS_COLORS[next] || 'var(--muted)';
}

export function getListingStatusFromDrawer() {
  const badges = document.querySelectorAll('#d_listing_status .ls-badge-enhanced');
  const status = {};
  badges.forEach(b => {
    const plat = b.getAttribute('data-plat');
    const st = b.getAttribute('data-status');
    if (plat && LISTING_STATUSES.includes(st)) {
      status[plat] = st;
    }
  });
  return status;
}

export async function saveDrawer(){
  const item=inv.find(i=>i.id===activeDrawId); if(!item) return;

  // Validate numeric fields
  const costEl = document.getElementById('d_cost');
  const cost = parseNum(costEl.value, { fieldName: 'Cost' });
  if (isNaN(cost) && costEl.value.trim() !== '') {
    validateNumericInput(costEl, { fieldName: 'Cost' });
    return;
  }

  const priceEl = document.getElementById('d_price');
  const price = parseNum(priceEl.value, { fieldName: 'Price' });
  if (isNaN(price) && priceEl.value.trim() !== '') {
    validateNumericInput(priceEl, { fieldName: 'Price' });
    return;
  }

  const feesEl = document.getElementById('d_fees');
  const fees = parseNum(feesEl.value, { fieldName: 'Fees', allowZero: true });
  if (isNaN(fees) && feesEl.value.trim() !== '') {
    validateNumericInput(feesEl, { fieldName: 'Fees' });
    return;
  }

  const shipEl = document.getElementById('d_ship');
  const ship = parseNum(shipEl.value, { fieldName: 'Shipping', allowZero: true });
  if (isNaN(ship) && shipEl.value.trim() !== '') {
    validateNumericInput(shipEl, { fieldName: 'Shipping' });
    return;
  }

  const alertEl = document.getElementById('d_alert');
  const alertVal = parseNum(alertEl.value, { fieldName: 'Low Stock Alert', integer: true, min: 1 });

  const oldPrice = item.price || 0;
  item.name    =document.getElementById('d_name').value.trim()||item.name;
  item.sku     =document.getElementById('d_sku').value.trim();
  item.upc     =document.getElementById('d_upc').value.trim();
  item.category=normCat(document.getElementById('d_cat').value.trim());
  item.subcategory=(document.getElementById('d_subcat_txt').value||'').trim();
  const _dSubtypeTxt = document.getElementById('d_subtype_txt');
  item.subtype = _dSubtypeTxt ? (_dSubtypeTxt.value||'').trim() : (item.subtype||'');
  if (item.subcategory && item.subtype) saveCustomType(item.subcategory, item.subtype);
  item.platforms=getSelectedPlats('d_plat_picker');
  item.platform =(item.platforms[0]||''); // keep legacy field for compat
  item.platformStatus = getListingStatusFromDrawer();
  item.cost    =isNaN(cost)?0:cost;
  item.price   =isNaN(price)?0:price;
  item.fees    =isNaN(fees)?0:fees;
  item.ship    =isNaN(ship)?0:ship;
  item.lowAlert=isNaN(alertVal)?2:alertVal;
  item.bulk    =document.getElementById('d_bulk')?.checked||false;
  item.url     =document.getElementById('d_url').value.trim();
  item.source  =document.getElementById('d_source').value.trim();
  item.condition=document.getElementById('d_condition').value.trim();
  item.notes   =document.getElementById('d_notes').value.trim();
  item.brand   =(document.getElementById('d_brand')?.value||'').trim();
  item.color   =(document.getElementById('d_color')?.value||'').trim();
  item.size    =(document.getElementById('d_size')?.value||'').trim();
  item.material=(document.getElementById('d_material')?.value||'').trim();
  item.mpn     =(document.getElementById('d_mpn')?.value||'').trim();
  item.model   =(document.getElementById('d_model')?.value||'').trim();
  item.style   =(document.getElementById('d_style')?.value||'').trim();
  item.pattern =(document.getElementById('d_pattern')?.value||'').trim();
  item.sizeType=(document.getElementById('d_sizeType')?.value||'').trim();
  item.department=(document.getElementById('d_department')?.value||'').trim();
  item.ebayDesc=(document.getElementById('d_ebay_desc')?.value||'').trim();
  Object.assign(item, getDimsFromForm('d'));
  if (isBookCat(item.category)) {
    Object.assign(item, getBookFields('d'));
    item.coverType = getCoverValue('d');
  }
  item.smoke = getSmokeValue('d');
  // Log price change if price was manually adjusted
  if (item.price !== oldPrice && item.price > 0) {
    logPriceChange(item.id, item.price, 'manual');
    // Auto-push price to Etsy if item has an Etsy listing
    if (item.etsyListingId) {
      try {
        await pushEtsyPrice(item.id);
      } catch (e) {
        console.warn('Etsy price sync:', e.message);
        toast('Etsy price sync failed — will retry next sync', true);
      }
    }
  }
  // Auto-push updates to live eBay listing (inventory item + re-publish offer)
  if (item.ebayItemId && isEBayConnected()) {
    try {
      await updateEBayListing(item.id);
      toast('eBay listing updated ✓');
    } catch (e) {
      console.warn('[eBay] Auto-update failed:', e.message);
      toast('eBay sync failed — will retry next sync', true);
    }
  }
  // Log field modifications to item history (compares against snapshot taken on drawer open)
  logItemChanges(item.id, _drawerSnapshot);
  _drawerSnapshot = null;
  // Persist source & brand for future autocomplete
  saveAutocompleteEntry(item.source, item.brand).catch(() => {});
  markDirty('inv', item.id);
  save(); closeDrawer(); refresh(); _sfx.edit(); toast('Changes saved ✓');
}

export async function delCurrent(){
  const item=inv.find(i=>i.id===activeDrawId);
  if(!confirm(`Delete "${item?.name}"?`))return;
  const id=activeDrawId;
  softDeleteItem(id);
  save();
  closeDrawer();
  refresh();
  toast('Item deleted — tap Undo to restore',false,4000);
  await pushDeleteToCloud('ft_inventory',[id]);
  autoSync();
}

export function setCondTag(prefix, value, btn) {
  const hiddenInput = document.getElementById(prefix + '_condition');
  const picker = document.getElementById(prefix + '_cond_picker');
  // Toggle — clicking active tag deselects it
  if (hiddenInput.value === value) {
    hiddenInput.value = '';
    btn.classList.remove('active');
  } else {
    hiddenInput.value = value;
    picker.querySelectorAll('.cond-tag').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
}

export function loadCondTag(prefix, value) {
  const hiddenInput = document.getElementById(prefix + '_condition');
  const picker = document.getElementById(prefix + '_cond_picker');
  if (!hiddenInput || !picker) return;
  hiddenInput.value = value || '';
  picker.querySelectorAll('.cond-tag').forEach(b => {
    b.classList.toggle('active', b.textContent.trim() === value);
  });
}
