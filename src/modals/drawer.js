// Drawer modal functions for item editing
// Dependencies: Global state (inv, sales, activeDrawId), utilities (calc, sc, mkc, fmt, pct, ds, escHtml, uid, toast, _sfx)
// DOM elements, form helpers (renderDrawerImg, renderDrawerBarcode, loadDimsToForm, suggestPackaging, getPlatforms, buildPlatPicker, getSelectedPlats, getDimsFromForm)
// Other modals: book-mode functions, trash functions

import { SUBCATS, SUBSUBCATS } from '../config/categories.js';
import { fmt, pct, ds, escHtml, escAttr, uid } from '../utils/format.js';
import { toast, trapFocus, releaseFocus, appConfirm } from '../utils/dom.js';
import { _sfx } from '../utils/sfx.js';
import { parseNum, validateNumericInput } from '../utils/validate.js';
import {
  inv, sales, activeDrawId, setActiveDrawId, save, refresh, calc, sc, mkc, markDirty, normCat, getInvItem, getSalesForItem,
  isParent, isVariant, getVariants, getParentItem, getVariantAggQty
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
import { pushDeleteToCloud, autoSync } from '../data/sync.js';
import { logPriceChange, snapshotItem, logItemChanges, renderItemTimeline } from '../features/price-history.js';

// Stores the item snapshot taken when drawer opens, for diff on save
let _drawerSnapshot = null;
let _drawerTrigger = null;
let _drawerDirty = false;
import { pushEtsyPrice } from '../features/etsy-sync.js';
import { updateEBayListing, pushItemToEBay, publishEBayListing, endEBayListing } from '../features/ebay-sync.js';
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
    sel.innerHTML = '<option value="">— None —</option>' + subs.map(s=>`<option value="${escAttr(s)}" ${s===currentValue?'selected':''}>${escHtml(s)}</option>`).join('');
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
  if (dlEl) dlEl.innerHTML = types.map(t => `<option value="${escAttr(t)}">`).join('');
  // Set current value
  txtEl.value = currentValue || '';
}

export function syncDrawerSubcat() {
  const cat = document.getElementById('d_cat').value.trim();
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
  populateSubcatSelect('f_subcat', cat, document.getElementById('f_subcat_txt').value);
  populateSubtypeSelect('f', (document.getElementById('f_subcat_txt').value||'').trim(), '');
  toggleBookFields('f');
}

export function syncAddSubtype() {
  const current = (document.getElementById('f_subtype_txt')?.value) || '';
  populateSubtypeSelect('f', (document.getElementById('f_subcat_txt').value||'').trim(), current);
}

export function openDrawer(id) {
  _drawerTrigger = document.activeElement;
  setActiveDrawId(id);
  _drawerDirty = false;
  const item=getInvItem(id); if(!item) return;
  _drawerSnapshot = snapshotItem(item);
  // Refresh autocomplete suggestions for Source & Brand
  refreshAutocompleteLists().catch(() => {});
  // Reset eBay tabs to Quick on open
  const eqp = document.getElementById('ebayTabQuick');
  const emp = document.getElementById('ebayTabMore');
  if (eqp) eqp.style.display = '';
  if (emp) emp.style.display = 'none';
  const etabs = document.querySelectorAll('.ebay-tabs .ebay-tab');
  etabs.forEach((t, i) => t.classList.toggle('active', i === 0));
  document.getElementById('dName').textContent=item.name;
  document.getElementById('dSku').textContent=item.sku?`SKU: ${item.sku}`:'No SKU';
  const {pu,m,roi}=calc(item);
  const iSales=getSalesForItem(id);
  const totSold=iSales.reduce((a,s)=>a+(s.qty||0),0);
  const totRev =iSales.reduce((a,s)=>a+(s.price||0)*(s.qty||0),0);
  const c=sc(item.qty,item.lowAlert,item.bulk,item.lowAlertEnabled);
  const stockColor = c === 'ok' ? 'var(--good)' : c === 'warn' ? 'var(--warn)' : 'var(--danger)';
  document.getElementById('dMets').innerHTML=`
    <div class="d-met"><div class="dm-lbl">In Stock</div><div class="dm-val" style="color:${stockColor}">${item.qty||0}</div></div>
    <div class="d-met"><div class="dm-lbl">Profit/Unit</div><div class="dm-val" style="color:var(--good)">${fmt(pu)}</div></div>
    <div class="d-met"><div class="dm-lbl">Margin</div><div class="dm-val" style="color:var(--accent)">${pct(m)}</div></div>
    <div class="d-met"><div class="dm-lbl">ROI</div><div class="dm-val" style="color:var(--accent3)">${pct(roi)}</div></div>
    <div class="d-met"><div class="dm-lbl">Units Sold</div><div class="dm-val">${totSold}</div></div>
    <div class="d-met"><div class="dm-lbl">Total Revenue</div><div class="dm-val">${fmt(totRev)}</div></div>`;
  const fields={d_name:'name',d_sku:'sku',d_upc:'upc',d_cat:'category',d_cost:'cost',d_price:'price',d_fees:'fees',d_ship:'ship',d_notes:'notes',d_url:'url',d_alert:'lowAlert',d_source:'source',d_brand:'brand',d_color:'color',d_size:'size',d_sizeType:'sizeType',d_department:'department',d_material:'material',d_mpn:'mpn',d_model:'model',d_style:'style',d_pattern:'pattern',d_ebay_desc:'ebayDesc',d_cond_desc:'conditionDesc',d_fit:'fit',d_closure:'closure',d_neckline:'neckline',d_sleeveLength:'sleeveLength',d_rise:'rise',d_inseam:'inseam',d_garmentCare:'garmentCare',d_occasion:'occasion',d_shoeSize:'shoeSize',d_shoeWidth:'shoeWidth',d_season:'season',d_theme:'theme',d_vintage:'vintage',d_countryMfg:'countryMfg'};
  for(const[eid,key]of Object.entries(fields)){const el=document.getElementById(eid);if(el)el.value=item[key]||'';}
  // Populate qty
  const dQty = document.getElementById('d_qty');
  if (dQty) dQty.value = item.qty ?? 1;
  // Populate eBay auction/best-offer fields
  const dFmt = document.getElementById('d_ebayFormat');
  if (dFmt) dFmt.value = item.ebayListingFormat || 'FIXED_PRICE';
  const dBO = document.getElementById('d_bestOffer');
  if (dBO) dBO.checked = !!item.ebayBestOffer;
  const dAS = document.getElementById('d_auctionStart');
  if (dAS) dAS.value = item.ebayAuctionStart || '';
  const dAR = document.getElementById('d_auctionReserve');
  if (dAR) dAR.value = item.ebayAuctionReserve || '';
  const dAD = document.getElementById('d_auctionDuration');
  if (dAD) dAD.value = item.ebayAuctionDuration || 'DAYS_7';
  const dAA = document.getElementById('d_autoAccept');
  if (dAA) dAA.value = item.ebayAutoAccept || '';
  const dADc = document.getElementById('d_autoDecline');
  if (dADc) dADc.value = item.ebayAutoDecline || '';
  if (window.toggleAuctionFields) window.toggleAuctionFields('d');
  // Populate subcategory text input and datalist suggestions
  const subcatTxt = document.getElementById('d_subcat_txt');
  if (subcatTxt) subcatTxt.value = item.subcategory || '';
  const subs = getSubcats(item.category||'');
  // Bulk toggle
  const dBulk = document.getElementById('d_bulk');
  if (dBulk) { dBulk.checked = !!item.bulk; toggleBulkFields('d'); }
  // Low stock alert toggle
  const alertOn = document.getElementById('d_alert_on');
  const alertInp = document.getElementById('d_alert');
  if (alertOn && alertInp) {
    const hasAlert = !!item.lowAlertEnabled;
    alertOn.checked = hasAlert;
    alertInp.value = hasAlert ? (item.lowAlert || '') : '';
    alertInp.disabled = !hasAlert;
    alertInp.style.opacity = hasAlert ? '1' : '0.4';
  }
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

  // Show drawer immediately, defer heavy operations to after animation
  document.getElementById('drawerOv').classList.add('on');
  document.getElementById('drawer').classList.add('on');

  // Defer non-critical rendering to avoid blocking the drawer animation
  requestAnimationFrame(() => {
    if (window.renderDrawerImg) window.renderDrawerImg(item.id);
    if (window.renderDrawerScore) window.renderDrawerScore(item.id);
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
    updateDrawerVariantsTab(item);
    trapFocus('#drawer');
  });
}

export function drawerTab(name, btn) {
  document.querySelectorAll('.drawer-tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.drawer-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('dtab-' + name).classList.add('active');
  btn.classList.add('active');
}

export async function closeDrawer(){
  if (_drawerDirty) {
    const confirmed = await appConfirm({ title: 'Unsaved Changes', message: 'You have unsaved changes. Close without saving?' });
    if (!confirmed) return;
  }
  _drawerDirty = false;
  releaseFocus();
  if (_drawerTrigger) { _drawerTrigger.focus(); _drawerTrigger = null; }
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
  // If qty is 0 and item has sales, ensure all platforms reflect sold status
  const itemSales = getSalesForItem(item.id);
  const isSoldOut = (item.qty || 0) <= 0 && itemSales.length > 0;
  el.innerHTML = plats.map(p => {
    let st = ps[p] || 'active';
    // For API-managed platforms, derive real status from actual push state
    if (p === 'eBay' && !ps[p]) {
      st = item.ebayItemId ? (item.ebayListingId ? 'active' : 'unlisted') : 'unlisted';
    } else if (p === 'Etsy' && !ps[p]) {
      st = 'draft';
    }
    // Override to sold if item is sold out and platform still shows active
    if (isSoldOut && (st === 'active' || !ps[p])) {
      const soldOnThis = itemSales.some(s => s.platform === p);
      st = soldOnThis ? 'sold' : 'sold-elsewhere';
      // Persist the fix
      if (!item.platformStatus) item.platformStatus = {};
      if (item.platformStatus[p] !== st) {
        item.platformStatus[p] = st;
        markDirty('inv', item.id);
      }
    }
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
    // eBay-specific action buttons
    const needsEbayPush = p === 'eBay' && !item.ebayItemId && isEBayConnected();
    const needsEbayPublish = p === 'eBay' && item.ebayItemId && !item.ebayListingId && isEBayConnected();
    // AI Copy for platforms without direct API, or API platforms when not connected
    const noApiPlats = ['Poshmark','Mercari','Depop','Grailed','Facebook Marketplace','StockX','GOAT','Vinted'];
    const showAICopy = noApiPlats.includes(p) || (p === 'eBay' && !isEBayConnected());
    const hasCached = item.crosslistCache?.[p];
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
          ${needsEbayPush ? `<button class="btn-xs btn-accent" onclick="clPushToEBay('${escAttr(item.id)}')">List on eBay</button>` : ''}
          ${needsEbayPublish ? `<button class="btn-xs btn-accent" onclick="clPublishOnEBay('${escAttr(item.id)}')">Publish</button>` : ''}
          ${showAICopy ? `<button class="btn-xs btn-accent" onclick="clAICopy('${escAttr(item.id)}','${escAttr(p)}')">${hasCached ? '📋 Copy' : '✨ AI Copy'}</button>` : ''}
          ${isExpiredOrDelisted ? `<button class="btn-xs btn-accent" onclick="clRelistFromDrawer('${escAttr(item.id)}','${escAttr(p)}')">Relist</button>` : ''}
          <button class="btn-xs" onclick="clOpenLink('${escAttr(p)}','${escAttr(item.id)}')" title="Open on ${escHtml(p)}" aria-label="Open on ${escHtml(p)}">↗</button>
          <button class="btn-xs" onclick="clCopyListing('${escAttr(item.id)}')" title="Copy listing text" aria-label="Copy listing text">📋</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

export function toggleListingStatus(el) {
  const cycle = LISTING_STATUSES.filter(s => s !== 'removed');
  const current = el.getAttribute('data-status');
  const idx = cycle.indexOf(current);
  const next = cycle[(idx >= 0 ? idx + 1 : 0) % cycle.length];
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
  const item=getInvItem(activeDrawId); if(!item) return;
  const oldPlatforms = new Set(item.platforms || []);
  const oldEbayStatus = item.platformStatus?.eBay || '';

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

  const _name = document.getElementById('d_name').value.trim();
  if(_name.length>200){toast('Name is too long (max 200 characters)',true);return;}
  const _notes = document.getElementById('d_notes').value.trim();
  if(_notes.length>5000){toast('Notes are too long (max 5000 characters)',true);return;}
  const _brand = (document.getElementById('d_brand')?.value||'').trim();
  if(_brand.length>100){toast('Brand is too long (max 100 characters)',true);return;}
  const _ebayDesc = (document.getElementById('d_ebay_desc')?.value||'').trim();
  if(_ebayDesc.length>5000){toast('eBay Description is too long (max 5000 characters)',true);return;}

  const oldPrice = item.price || 0;
  const oldEbayFormat = item.ebayListingFormat || 'FIXED_PRICE';
  item.name    =_name||item.name;
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
  const qtyEl = document.getElementById('d_qty');
  const qtyVal = parseInt(qtyEl?.value, 10);
  item.qty     =isNaN(qtyVal) || qtyVal < 0 ? (item.qty ?? 1) : qtyVal;
  item.lowAlertEnabled = !!document.getElementById('d_alert_on')?.checked;
  item.lowAlert = item.lowAlertEnabled && !isNaN(alertVal) ? alertVal : (item.lowAlert || 2);
  item.bulk    =document.getElementById('d_bulk')?.checked||false;
  item.url     =document.getElementById('d_url').value.trim();
  item.source  =document.getElementById('d_source').value.trim();
  item.condition=document.getElementById('d_condition').value.trim();
  item.notes   =_notes;
  item.brand   =_brand;
  item.color   =(document.getElementById('d_color')?.value||'').trim();
  item.size    =(document.getElementById('d_size')?.value||'').trim();
  item.material=(document.getElementById('d_material')?.value||'').trim();
  item.mpn     =(document.getElementById('d_mpn')?.value||'').trim();
  item.model   =(document.getElementById('d_model')?.value||'').trim();
  item.style   =(document.getElementById('d_style')?.value||'').trim();
  item.pattern =(document.getElementById('d_pattern')?.value||'').trim();
  item.sizeType=(document.getElementById('d_sizeType')?.value||'').trim();
  item.department=(document.getElementById('d_department')?.value||'').trim();
  item.ebayDesc=_ebayDesc;
  item.conditionDesc=(document.getElementById('d_cond_desc')?.value||'').trim();
  // More tab — apparel fields
  item.fit      =(document.getElementById('d_fit')?.value||'').trim();
  item.closure  =(document.getElementById('d_closure')?.value||'').trim();
  item.neckline =(document.getElementById('d_neckline')?.value||'').trim();
  item.sleeveLength=(document.getElementById('d_sleeveLength')?.value||'').trim();
  item.rise     =(document.getElementById('d_rise')?.value||'').trim();
  item.inseam   =(document.getElementById('d_inseam')?.value||'').trim();
  item.garmentCare=(document.getElementById('d_garmentCare')?.value||'').trim();
  item.occasion =(document.getElementById('d_occasion')?.value||'').trim();
  // More tab — footwear
  item.shoeSize =(document.getElementById('d_shoeSize')?.value||'').trim();
  item.shoeWidth=(document.getElementById('d_shoeWidth')?.value||'').trim();
  // More tab — other
  item.season   =(document.getElementById('d_season')?.value||'').trim();
  item.theme    =(document.getElementById('d_theme')?.value||'').trim();
  item.vintage  =(document.getElementById('d_vintage')?.value||'').trim();
  item.countryMfg=(document.getElementById('d_countryMfg')?.value||'').trim();
  // eBay auction/best-offer fields
  item.ebayListingFormat = document.getElementById('d_ebayFormat')?.value || 'FIXED_PRICE';
  item.ebayBestOffer = !!document.getElementById('d_bestOffer')?.checked;
  item.ebayAuctionStart = parseFloat(document.getElementById('d_auctionStart')?.value) || 0;
  item.ebayAuctionReserve = parseFloat(document.getElementById('d_auctionReserve')?.value) || 0;
  item.ebayAuctionDuration = document.getElementById('d_auctionDuration')?.value || 'DAYS_7';
  item.ebayAutoAccept = parseFloat(document.getElementById('d_autoAccept')?.value) || 0;
  item.ebayAutoDecline = parseFloat(document.getElementById('d_autoDecline')?.value) || 0;
  Object.assign(item, getDimsFromForm('d'));
  if (isBookCat(item.category)) {
    Object.assign(item, getBookFields('d'));
    item.coverType = getCoverValue('d');
  }
  item.smoke = getSmokeValue('d');
  // Log price change if price was manually adjusted
  const priceChanged = item.price !== oldPrice && item.price > 0;
  if (priceChanged) {
    logPriceChange(item.id, item.price, 'manual');
  }
  // Log field modifications to item history (compares against snapshot taken on drawer open)
  logItemChanges(item.id, _drawerSnapshot);
  const _drawerSnapshotForEbay = _drawerSnapshot;
  _drawerSnapshot = null;
  // Persist source & brand for future autocomplete
  saveAutocompleteEntry(item.source, item.brand).catch(() => {});
  markDirty('inv', item.id);
  _drawerDirty = false;
  save(); closeDrawer(); refresh(); _sfx.edit(); toast('Changes saved ✓');

  // Fire marketplace syncs in background (non-blocking)
  if (priceChanged && item.etsyListingId) {
    pushEtsyPrice(item.id).then(() => {
      toast('Etsy price updated ✓');
    }).catch(e => {
      console.warn('Etsy price sync:', e.message);
      toast('Etsy price sync failed — will retry next sync', true);
    });
  }
  // Only sync to eBay if an eBay-relevant field actually changed
  // Compare only fields that exist on the snapshot (TRACKED_FIELDS)
  const _ebayTracked = ['name','price','condition','brand','color','size','material','model','style','pattern','notes','upc'];
  const ebayChanged = _drawerSnapshotForEbay && _ebayTracked.some(f => {
    return (f in _drawerSnapshotForEbay) && String(_drawerSnapshotForEbay[f] ?? '') !== String(item[f] ?? '');
  });
  const ebayAdded = item.platforms.includes('eBay') && !oldPlatforms.has('eBay');
  const ebayRemoved = !item.platforms.includes('eBay') && oldPlatforms.has('eBay');
  const formatChanged = item.ebayListingFormat !== oldEbayFormat;

  if (ebayRemoved && item.ebayItemId && isEBayConnected()) {
    // eBay platform tag removed — end the listing on eBay
    endEBayListing(item.id).then(() => {
      toast('eBay listing ended ✓');
    }).catch(e => {
      console.warn('[eBay] End listing failed:', e.message);
      toast('Failed to end eBay listing', true);
    });
  } else if (item.ebayItemId && isEBayConnected() && formatChanged) {
    // Format change requires end + relist (eBay doesn't allow format changes on live listings)
    (async () => {
      try {
        toast('Changing eBay listing format…');
        const endResult = await endEBayListing(item.id);
        if (!endResult.success) {
          toast('Could not end current eBay listing — format change aborted', true);
          return;
        }
        toast('Old listing ended — creating new listing…');
        const pubResult = await publishEBayListing(item.id);
        if (pubResult.success) {
          toast(`Relisted on eBay as ${item.ebayListingFormat === 'AUCTION' ? 'Auction' : 'Fixed Price'}! #${pubResult.listingId}`);
        } else {
          // Ensure FlipTrack doesn't show as active when publish failed
          markPlatformStatus(item.id, 'eBay', 'draft');
          markDirty('inv', item.id);
          save();
          toast('Old listing ended but new listing failed to publish — saved as draft. Try publishing from Crosslist.', true);
        }
      } catch (e) {
        console.warn('[eBay] Format change failed:', e.message);
        markPlatformStatus(item.id, 'eBay', 'draft');
        markDirty('inv', item.id);
        save();
        toast('eBay format change failed: ' + e.message, true);
      }
    })();
  } else if (item.ebayItemId && isEBayConnected() && ebayChanged && !ebayRemoved) {
    toast('Syncing to eBay…');
    updateEBayListing(item.id).then(() => {
      toast('eBay listing updated ✓');
    }).catch(e => {
      console.warn('[eBay] Auto-update failed:', e.message);
      toast('eBay sync failed: ' + e.message, true);
    });
  } else if (item.platforms?.includes('eBay') && ebayChanged && !ebayRemoved) {
    // eBay field changed but can't sync — tell user why
    if (!item.ebayItemId) toast('eBay item ID missing — sync manually', true);
    else if (!isEBayConnected()) toast('eBay not connected — reconnect to sync', true);
  } else if (ebayAdded && isEBayConnected()) {
    // eBay was just added as a platform — push + publish
    (async () => {
      try {
        toast('Listing on eBay…');
        const pushResult = await pushItemToEBay(item.id);
        if (!pushResult.success) return;
        const pubResult = await publishEBayListing(item.id);
        if (pubResult.success) {
          toast(`Listed on eBay! Item #${pubResult.listingId}`);
        } else {
          toast('eBay push saved as draft — publish failed. Try publishing from Crosslist.', true);
        }
      } catch (e) {
        console.warn('[eBay] Auto-list from drawer failed:', e.message);
        toast(`eBay auto-list: ${e.message}`, true);
      }
    })();
  }

  // End eBay listing when status changed to 'delisted' in the drawer
  const newEbayStatus = item.platformStatus?.eBay || '';
  if (!ebayRemoved && item.ebayItemId && isEBayConnected() && newEbayStatus === 'delisted' && oldEbayStatus !== 'delisted') {
    endEBayListing(item.id).then(() => {
      toast('eBay listing ended ✓');
    }).catch(e => {
      console.warn('[eBay] End listing failed:', e.message);
      toast('Failed to end eBay listing — try again from Crosslist', true);
    });
  }
}

export async function delCurrent(){
  const item=getInvItem(activeDrawId);
  if(!await appConfirm({ title: 'Delete Item', message: `Delete "${item?.name}"?`, danger: true }))return;
  const id=activeDrawId;
  // End eBay listing before deleting
  if (item.ebayItemId && isEBayConnected()) {
    endEBayListing(id).catch(e => console.warn('[eBay] End on delete failed:', e.message));
  }
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

export function markDrawerDirty() { _drawerDirty = true; }

export function loadCondTag(prefix, value) {
  const hiddenInput = document.getElementById(prefix + '_condition');
  const picker = document.getElementById(prefix + '_cond_picker');
  if (!hiddenInput || !picker) return;
  hiddenInput.value = value || '';
  picker.querySelectorAll('.cond-tag').forEach(b => {
    b.classList.toggle('active', b.textContent.trim() === value);
  });
}

// ── VARIANTS TAB ────────────────────────────────────────────────────────────

/** Show/hide the Variants tab based on whether the item is a parent */
export function updateDrawerVariantsTab(item) {
  const tab = document.getElementById('drawerVariantsTab');
  if (!tab) return;
  tab.style.display = isParent(item) ? '' : 'none';
}

/** Render variant children list in the drawer */
export function renderDrawerVariants() {
  const el = document.getElementById('dtab-variants-body');
  if (!el) return;
  const item = getInvItem(activeDrawId);
  if (!item || !isParent(item)) { el.innerHTML = '<div style="padding:16px;color:var(--muted);font-size:12px">No variants</div>'; return; }

  const variants = getVariants(item.id);
  const totalQty = variants.reduce((a, v) => a + (v.qty || 0), 0);

  el.innerHTML = `
    <div style="padding:12px 0 8px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:12px;color:var(--muted)">${variants.length} variant${variants.length !== 1 ? 's' : ''} · ${totalQty} total qty</span>
    </div>
    ${variants.map(v => {
      const { pu, m } = calc(v);
      const eid = escAttr(v.id);
      const c = sc(v.qty, v.lowAlert, v.bulk, v.lowAlertEnabled);
      const qc = c === 'low' ? 'var(--warn)' : c === 'warn' ? 'var(--danger)' : 'var(--good)';
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="flex:1;overflow:hidden">
          <div style="font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(v.variantLabel || v.name)}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px">${fmt(v.price)} · ${fmt(pu)} profit · ${pct(m)}</div>
        </div>
        <span style="font-family:'DM Mono',monospace;font-size:12px;font-weight:700;color:${qc}">${v.qty || 0}</span>
        <div style="display:flex;gap:4px">
          ${(v.qty || 0) > 0 ? `<button class="act-btn" onclick="openSoldModal('${eid}')" style="font-size:10px">Sold</button>` : ''}
          <button class="act-btn" onclick="openDrawer('${eid}')" style="font-size:10px">Edit</button>
        </div>
      </div>`;
    }).join('')}`;
}
