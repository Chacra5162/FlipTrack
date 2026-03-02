// Add Item modal functions
// Dependencies: Global state (inv, sales, activeDrawId, pendingAddImages), utilities (uid, toast, _sfx, fmt, pct)
// DOM elements, form helpers (buildPlatPicker, getSelectedPlats, clearDimForm, getDimsFromForm, refreshImgSlots)
// Other modals: book-mode functions

import { inv, activeDrawId, save, refresh, normCat, markDirty } from '../data/store.js';
import { uid, fmt, pct, escHtml } from '../utils/format.js';
import { toast, trapFocus, releaseFocus } from '../utils/dom.js';
import { _sfx } from '../utils/sfx.js';
import { autoSync } from '../data/sync.js';
import { parseNum, validateNumericInput } from '../utils/validate.js';
import {
  toggleBookFields,
  isBookCat,
  getBookFields,
  clearBookFields,
  swapConditionTags
} from './book-mode.js';
import { getPlatforms, buildPlatPicker, getSelectedPlats } from '../features/platforms.js';
import { refreshImgSlots } from '../features/images.js';
import { clearDimForm, getDimsFromForm } from '../features/dimensions.js';
import { uploadImageToStorage } from '../data/storage.js';
import { getSupabaseClient } from '../data/auth.js';
import { getCurrentUser } from '../data/auth.js';

import { openDrawer, closeDrawer, loadCondTag, syncAddSubcat } from './drawer.js';

let pendingAddImages = [];

// ── SMOKE EXPOSURE 3-POSITION SLIDER ─────────────────────────────────────────
export function updateSmokeSlider(pfx) {
  const slider = document.getElementById(pfx + '_smoke');
  if (!slider) return;
  const v = parseInt(slider.value, 10);
  const lblFree = document.getElementById(pfx + '_smoke_lbl_free');
  const lblExp  = document.getElementById(pfx + '_smoke_lbl_exp');

  // Reset classes
  slider.classList.remove('pos-free', 'pos-exp');
  if (lblFree) lblFree.classList.remove('on-free');
  if (lblExp)  lblExp.classList.remove('on-exp');

  if (v === 0) {
    slider.classList.add('pos-free');
    if (lblFree) lblFree.classList.add('on-free');
  } else if (v === 2) {
    slider.classList.add('pos-exp');
    if (lblExp) lblExp.classList.add('on-exp');
  }
  // v === 1 is neutral — no highlights
}

export function getSmokeValue(pfx) {
  const slider = document.getElementById(pfx + '_smoke');
  if (!slider) return null;
  const v = parseInt(slider.value, 10);
  if (v === 0) return 'smoke-free';
  if (v === 2) return 'smoke-exposure';
  return null; // neutral = unknown, don't store
}

export function loadSmokeSlider(pfx, val) {
  const slider = document.getElementById(pfx + '_smoke');
  if (!slider) return;
  if (val === 'smoke-free') slider.value = '0';
  else if (val === 'smoke-exposure') slider.value = '2';
  else slider.value = '1'; // neutral default
  updateSmokeSlider(pfx);
}

export function dupCurrent() {
  const item = inv.find(i => i.id === activeDrawId);
  if (!item) return;
  dupItem(item.id);
  closeDrawer();
}

export function dupItem(id) {
  const src = inv.find(i => i.id === id);
  if (!src) return;
  const newId = uid();
  const skuDate = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const skuCat = ((src.category||'GEN').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4)).padEnd(3,'X');
  const skuRand = Math.random().toString(36).slice(2,5).toUpperCase();
  const clone = {
    ...JSON.parse(JSON.stringify(src)),
    id: newId,
    sku: skuCat + '-' + skuDate + '-' + skuRand,
    added: new Date().toISOString(),
    platformStatus: {},
  };
  inv.push(clone);
  markDirty('inv', clone.id);
  save(); refresh(); _sfx.create();
  toast('Duplicated: ' + clone.name + ' \u2713');
  autoSync();
}

export function addFormTab(tab, btn) {
  document.querySelectorAll('.add-form-tab').forEach(b => { b.style.color='var(--muted)'; b.style.borderBottomColor='transparent'; b.classList.remove('active'); });
  if(btn) { btn.style.color='var(--accent)'; btn.style.borderBottomColor='var(--accent)'; btn.classList.add('active'); }

  // Basic fields: name, sku, upc, category, source, subcategory, subtype, platforms, bulk, quantity, alert
  const basicIds = ['f_name','f_sku','f_upc','f_cat','f_source','f_subcat_txt','f_subtype','f_plat_picker','f_bulk','f_qty','f_alert'].map(id=>document.getElementById(id));
  // Pricing fields: cost, price, fees, ship, condition, smoke exposure, profit preview
  const pricingIds = ['f_cost','f_price','f_fees','f_ship','f_condition','f_smoke'].map(id=>document.getElementById(id));
  // Details fields: notes, dimensions, photos, book fields
  const detailIds = ['f_notes','f_book_fields','fImgWrap'].map(id=>document.getElementById(id));

  const showGrp = (el) => { if(el) { const grp = el.closest('.fgrp') || el.closest('.full') || el; grp.style.display=''; }};
  const hideGrp = (el) => { if(el) { const grp = el.closest('.fgrp') || el.closest('.full') || el; grp.style.display='none'; }};

  const profitPrev = document.querySelector('.profit-prev');
  const dimSection = document.getElementById('f_dim_section');

  if(tab==='basic') {
    basicIds.forEach(showGrp);
    pricingIds.forEach(hideGrp);
    detailIds.forEach(hideGrp);
    if(profitPrev) profitPrev.style.display='none';
    if(dimSection) dimSection.style.display='none';
  } else if(tab==='pricing') {
    basicIds.forEach(hideGrp);
    pricingIds.forEach(showGrp);
    detailIds.forEach(hideGrp);
    if(profitPrev) profitPrev.style.display='';
    if(dimSection) dimSection.style.display='none';
  } else {
    basicIds.forEach(hideGrp);
    pricingIds.forEach(hideGrp);
    detailIds.forEach(showGrp);
    if(profitPrev) profitPrev.style.display='none';
    if(dimSection) dimSection.style.display='';
  }
}

export function openAddModal(){
  const ov = document.getElementById('addOv');
  ov.classList.add('on');
  pendingAddImages = [];
  refreshImgSlots('f', pendingAddImages);
  const bd = ov.querySelector('.modal-bd');
  if (bd) bd.scrollTop = 0;
  const modal = ov.querySelector('.modal');
  if (modal) modal.scrollTop = 0;
  setTimeout(() => trapFocus('#addOv .modal'), 100);
  addFormTab('basic', document.querySelector('.add-form-tab'));
}

export function closeAdd(){
  releaseFocus();
  document.getElementById('addOv').classList.remove('on');
  ['f_name','f_sku','f_upc','f_cat','f_subcat_txt','f_cost','f_price','f_fees','f_ship','f_notes','f_alert','f_source','f_condition'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('f_qty').value='1';
  const bulkCb = document.getElementById('f_bulk'); if(bulkCb) bulkCb.checked=false;
  const bulkFields = document.getElementById('f_bulk_fields'); if(bulkFields) bulkFields.style.display='none';
  document.querySelectorAll('#f_cond_picker .cond-tag').forEach(b => b.classList.remove('active'));
  clearBookFields('f');
  swapConditionTags('f', false);
  pendingAddImages=[];refreshImgSlots('f',[]);clearDimForm('f');buildPlatPicker('f_plat_picker',[]);prevProfit();loadSmokeSlider('f',null);
}

export function toggleBulkFields(pfx) {
  const bulk = document.getElementById(pfx + '_bulk')?.checked;
  if (pfx === 'f') {
    const wrap = document.getElementById('f_bulk_fields');
    if (wrap) wrap.style.display = bulk ? 'block' : 'none';
    const qty = document.getElementById('f_qty');
    if (!bulk && qty) qty.value = '1';
  }
  if (pfx === 'd') {
    const alertGrp = document.getElementById('d_alert_grp');
    if (alertGrp) alertGrp.style.display = bulk ? '' : 'none';
  }
}

export function prevProfit(){
  const cost=parseFloat(document.getElementById('f_cost').value)||0;
  const price=parseFloat(document.getElementById('f_price').value)||0;
  const fees=parseFloat(document.getElementById('f_fees').value)||0;
  const ship=parseFloat(document.getElementById('f_ship').value)||0;
  const pr=price-cost-fees-ship, m=price?pr/price:null, roi=cost?pr/cost:null;
  document.getElementById('pp_profit').textContent=price||cost?fmt(pr):'\u2014';
  document.getElementById('pp_margin').textContent=m!=null?pct(m):'\u2014';
  document.getElementById('pp_roi').textContent=roi!=null?pct(roi):'\u2014';
  document.getElementById('pp_profit').style.color=pr>=0?'var(--good)':'var(--danger)';
}

export function prefillFromLast() {
  const sorted = [...inv].sort((a, b) => new Date(b.added || 0) - new Date(a.added || 0));
  const last = sorted[0];
  if (!last) { toast('No items to copy from', true); return; }

  const fSource = document.getElementById('f_source');
  if (fSource && last.source) fSource.value = last.source;
  const fCat = document.getElementById('f_cat');
  if (fCat && last.category) { fCat.value = last.category; syncAddSubcat(); }
  const fSubcat = document.getElementById('f_subcat_txt');
  if (fSubcat && last.subcategory) fSubcat.value = last.subcategory;
  if (last.condition) loadCondTag('f', last.condition);
  const plats = getPlatforms(last);
  if (plats.length) buildPlatPicker('f_plat_picker', plats);
  toggleBookFields('f');
  if (last.smoke) loadSmokeSlider('f', last.smoke);

  toast('Prefilled from: ' + last.name);
}

export function addItem(){
  const name=document.getElementById('f_name').value.trim();
  if(!name){toast('Name required',true);return;}

  const costEl = document.getElementById('f_cost');
  const cost = parseNum(costEl.value, { fieldName: 'Cost' });
  if (isNaN(cost) && costEl.value.trim() !== '') {
    validateNumericInput(costEl, { fieldName: 'Cost' });
    return;
  }

  const priceEl = document.getElementById('f_price');
  const price = parseNum(priceEl.value, { fieldName: 'Price' });
  if (isNaN(price) && priceEl.value.trim() !== '') {
    validateNumericInput(priceEl, { fieldName: 'Price' });
    return;
  }
  if(!price){toast('Price required',true);return;}

  const feesEl = document.getElementById('f_fees');
  const fees = parseNum(feesEl.value, { fieldName: 'Fees', allowZero: true });
  if (isNaN(fees) && feesEl.value.trim() !== '') {
    validateNumericInput(feesEl, { fieldName: 'Fees' });
    return;
  }

  const shipEl = document.getElementById('f_ship');
  const ship = parseNum(shipEl.value, { fieldName: 'Shipping', allowZero: true });
  if (isNaN(ship) && shipEl.value.trim() !== '') {
    validateNumericInput(shipEl, { fieldName: 'Shipping' });
    return;
  }

  const qtyEl = document.getElementById('f_qty');
  const qtyVal = parseNum(qtyEl.value, { fieldName: 'Quantity', integer: true, min: 1 });
  const isBulk = document.getElementById('f_bulk')?.checked || false;
  const qty = isBulk ? (isNaN(qtyVal) ? 1 : qtyVal) : 1;

  const alertEl = document.getElementById('f_alert');
  const alertVal = parseNum(alertEl.value, { fieldName: 'Low Stock Alert', integer: true, min: 1 });
  const lowAlert = isBulk ? (isNaN(alertVal) ? 2 : alertVal) : 2;

  const cat=normCat(document.getElementById('f_cat').value.trim());
  const skuDate = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const skuCat = (cat||'GEN').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4).padEnd(3,'X');
  const skuRand = Math.random().toString(36).slice(2,5).toUpperCase();
  const autoSku = skuCat + '-' + skuDate + '-' + skuRand;

  const upc = (document.getElementById('f_upc').value || '').trim();
  if (upc) {
    const existing = inv.find(i => i.upc === upc);
    if (existing) {
      const proceed = confirm(`An item with UPC "${upc}" already exists:\n\n"${existing.name}" (Qty: ${existing.qty})\n\nAdd as a new item anyway, or cancel to update the existing one?`);
      if (!proceed) {
        if (typeof window.openDrawer === 'function') window.openDrawer(existing.id);
        return;
      }
    }
  }

  const selPlats=getSelectedPlats('f_plat_picker');
  const platform=selPlats[0]||'Other';
  const newId = uid();
  const imagesToUpload = pendingAddImages.slice();
  const smokeVal = getSmokeValue('f');
  inv.push({id:newId,name,sku:document.getElementById('f_sku').value.trim()||autoSku,upc:document.getElementById('f_upc').value.trim()||'',category:cat,subcategory:(document.getElementById('f_subcat_txt').value||'').trim(),subtype:document.getElementById('f_subtype').value||'',platform,platforms:selPlats,cost:isNaN(cost)?0:cost,price,qty,bulk:isBulk,fees:isNaN(fees)?0:fees,ship:isNaN(ship)?0:ship,lowAlert,notes:document.getElementById('f_notes').value.trim(),source:document.getElementById('f_source').value.trim(),condition:document.getElementById('f_condition').value.trim(),smoke:smokeVal,images:imagesToUpload,image:imagesToUpload[0]||null,...getDimsFromForm('f'),...(isBookCat(cat) ? getBookFields('f') : {}),added:new Date().toISOString()});
  markDirty('inv', newId);
  save(); closeAdd(); refresh(); _sfx.create(); toast('Item added ✓');

  if (imagesToUpload.length && getSupabaseClient() && getCurrentUser()) {
    const newItem = inv.find(i => i.id === newId);
    if (newItem) {
      Promise.all(imagesToUpload.map((b64, idx) =>
        uploadImageToStorage(b64, newId, idx).catch(e => {
          console.warn('FlipTrack: upload failed for slot', idx, e.message);
          return b64;
        })
      )).then(results => {
        newItem.images = results;
        newItem.image  = results[0] || null;
        markDirty('inv', newItem.id);
        save();
        if (window.renderInv) window.renderInv();
      });
    }
  }
}
