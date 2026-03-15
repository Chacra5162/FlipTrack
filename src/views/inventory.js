// Inventory View Module
// Handles filtering, sorting, rendering, and bulk operations on inventory items

import {
  inv,
  sales,
  sel,
  platFilt,
  catFilt,
  getInvItem,
  save,
  refresh,
  markDirty,
  softDeleteItem,
  calc,
  sc,
  mkc,
  margCls,
  getSalesForItem,
} from '../data/store.js';

// Local state for drag and drop and filtering
let dragSrc = null;
export let subcatFilt = 'all';
export let subsubcatFilt = 'all';
let stockFilt = 'all';
let smokeFilt = 'all';       // 'all' | 'smoke-free' | 'smoke-exposure' | 'unset'
let conditionFilt = 'all';   // 'all' | 'NWT' | 'NWOT' | 'EUC' | etc.
let _invPage = 0;
let _invPageSize = 50;
let _chipsBuiltForData = null;

// Filter memoization — avoid re-filtering entire inv[] when only page/sort changed
let _filterCache = { key: null, items: null };

/** Calculate days since item was listed */
export function daysListed(item) {
  return daysSince(item.added);
}

import { fmt, pct, escHtml, escAttr, debounce, uid, localDate, daysSince} from '../utils/format.js';
import { PLATFORMS, PLATFORM_GROUPS, platCls } from '../config/platforms.js';
import { SUBCATS, SUBSUBCATS } from '../config/categories.js';
import { toast, appConfirm } from '../utils/dom.js';
import { pushDeleteToCloud, autoSync } from '../data/sync.js';
import { getPlatforms, renderPlatTags, sanitizePlatforms } from '../features/platforms.js';
import { getDaysUntilExpiry } from '../features/crosslist.js';
import { getItemImages } from '../features/images.js';
import { renderPagination } from '../utils/pagination.js';
import { logPriceChange } from '../features/price-history.js';
import { pushEBayPrice } from '../features/ebay-sync.js';
import { isEBayConnected } from '../features/ebay-auth.js';
import { computeFlipScore } from '../features/flip-score.js';

// Helper functions that need to be wired from other modules
export function updateFiltersBadge() {
  const badge = document.getElementById('activeFiltersBadge');
  const btn   = document.getElementById('filterToggleBtn');
  if (!badge) return;
  const count = platFilt.size + catFilt.size
    + (subcatFilt !== 'all' ? 1 : 0)
    + (subsubcatFilt !== 'all' ? 1 : 0)
    + (smokeFilt !== 'all' ? 1 : 0)
    + (conditionFilt !== 'all' ? 1 : 0);
  if (count) {
    badge.textContent = count + ' active';
    badge.style.display = 'inline';
    btn.classList.add('active');
  } else {
    badge.style.display = 'none';
    btn.classList.remove('active');
  }
}

export function toggleFilterPanel() {
  const panel = document.getElementById('filterPanel');
  if (panel) panel.classList.toggle('open');
}

export function openFilterPanel() {
  const panel = document.getElementById('filterPanel');
  if (panel) panel.classList.add('open');
}

// ── CHIP BUILDING & FILTERING ──────────────────────────────────────────────────

export function buildChips(forceRebuild) {
  // Skip full chip rebuild if inventory data hasn't changed (filter/sort/page don't need it)
  const dataKey = inv.length + ':' + (inv[0]?.id||'') + ':' + (inv[inv.length-1]?.id||'');
  if (!forceRebuild && _chipsBuiltForData === dataKey) {
    // Still update active states on filter chips without rebuilding all HTML
    _updateChipActiveStates();
    return;
  }
  _chipsBuiltForData = dataKey;
  // Platform chips — show all platforms, grouped with dividers
  const inUse = new Set(inv.flatMap(i=>getPlatforms(i)).filter(Boolean));
  // Platform chips — "All" clears the set; clicking a platform toggles it
  let platHtml = `<span class="filter-chip ${platFilt.size===0?'active':''}" role="button" tabindex="0" onclick="setPlatFilt('all',this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">All</span>`;
  PLATFORM_GROUPS.forEach(group => {
    platHtml += `<span class="plat-group-divider">${group.label}</span>`;
    group.items.forEach(p => {
      const dot = inUse.has(p) ? `<span class="plat-dot"></span>` : '';
      platHtml += `<span class="filter-chip plat-chip ${platFilt.has(p)?'active':''}" role="button" tabindex="0" onclick="setPlatFilt('${p}',this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">${dot}${p}</span>`;
    });
  });
  document.getElementById('platChips').innerHTML = platHtml;

  // Case-insensitive dedup — keep first-seen casing per lowercase key
  const _catMap = new Map();
  inv.forEach(i => { const c=(i.category||'').trim(); if(c){ const k=c.toLowerCase(); if(!_catMap.has(k)) _catMap.set(k,c); } });
  const cats=['all',...[..._catMap.values()].sort()];
  const catEl=document.getElementById('catChips');
  catEl.innerHTML=cats.map(c=>{
    const safe=escHtml(c).replace(/'/g,'&#39;');
    const isActive = c==='all' ? catFilt.size===0 : [...catFilt].some(f=>f.toLowerCase()===c.toLowerCase());
    return `<span class="filter-chip cat-chip ${isActive?'active':''}" role="button" tabindex="0" data-cat="${escHtml(c)}" onclick="setCatFilt('${safe}',this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">${c==='all'?'All Categories':escHtml(c)}</span>`;
  }).join('');

  // hide category row if no categories set yet
  document.getElementById('catToolbar').style.display=cats.length>1?'flex':'none';

  // subcategory row — only show when exactly one category is active and has defined subcats
  const subcatBar  = document.getElementById('subcatToolbar');
  const singleCat  = catFilt.size === 1 ? [...catFilt][0] : null;
  // Case-insensitive SUBCATS lookup
  let subcatDefs = null;
  if (singleCat) {
    subcatDefs = SUBCATS[singleCat] || null;
    if (!subcatDefs) {
      const lower = singleCat.toLowerCase();
      const key = Object.keys(SUBCATS).find(k => k.toLowerCase() === lower);
      if (key) subcatDefs = SUBCATS[key];
    }
  }
  if (subcatDefs) {
    const _sc=singleCat.toLowerCase(); const usedSubs = [...new Set(inv.filter(i=>(i.category||'').toLowerCase()===_sc).map(i=>i.subcategory||'').filter(Boolean))];
    const allSubs  = [...new Set([...subcatDefs, ...usedSubs])];
    document.getElementById('subcatChips').innerHTML=
      ['all',...allSubs].map(s=>{
        const safe=escHtml(s).replace(/'/g,'&#39;');
        return `<span class="filter-chip subcat-chip ${subcatFilt===s?'active':''}" role="button" tabindex="0" data-subcat="${escHtml(s)}" onclick="setSubcatFilt('${safe}',this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">${s==='all'?'All':escHtml(s)}</span>`;
      }).join('');
    subcatBar.style.display='flex';
  } else {
    subcatBar.style.display='none';
    subcatFilt='all';
  }

  // sub-subcategory row — show when selected subcat has children
  const subsubDefs = SUBSUBCATS[subcatFilt];
  const subsubBar  = document.getElementById('subsubcatToolbar');
  if (subsubDefs && subsubDefs.length && subcatFilt !== 'all') {
    const usedSubsubs = [...new Set(inv.filter(i=>i.subcategory===subcatFilt).map(i=>i.subtype||'').filter(Boolean))];
    const allSubsubs  = [...new Set([...subsubDefs, ...usedSubsubs])];
    document.getElementById('subsubcatLabel').textContent = ['Men','Women','Children'].includes(subcatFilt) ? `↳↳ Clothing Type` : `↳↳ ${subcatFilt}`;
    document.getElementById('subsubcatChips').innerHTML=
      ['all',...allSubsubs].map(s=>{
        const safe=escAttr(s);
        return `<span class="filter-chip subsubcat-chip ${subsubcatFilt===s?'active':''}" role="button" tabindex="0" onclick="setSubsubcatFilt('${safe}',this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">${s==='all'?'All':escHtml(s)}</span>`;
      }).join('');
    subsubBar.style.display='flex';
  } else {
    subsubBar.style.display='none';
    subsubcatFilt='all';
  }

  // Smoke exposure filter chips
  const smokeBar = document.getElementById('smokeToolbar');
  if (smokeBar) {
    const smokeOpts = ['all','smoke-free','smoke-exposure','unset'];
    const smokeLabels = { all:'All', 'smoke-free':'🟢 Smoke-Free', 'smoke-exposure':'🔴 Smoke Exp.', unset:'⚪ Unset' };
    document.getElementById('smokeChips').innerHTML = smokeOpts.map(s =>
      `<span class="filter-chip ${smokeFilt===s?'active':''}" role="button" tabindex="0" onclick="setSmokeFilt('${s}')">${smokeLabels[s]}</span>`
    ).join('');
    smokeBar.style.display = 'flex';
  }

  // Condition filter chips
  const condBar = document.getElementById('conditionToolbar');
  if (condBar) {
    const usedConds = [...new Set(inv.map(i=>i.condition||'').filter(Boolean))].sort();
    if (usedConds.length) {
      document.getElementById('conditionChips').innerHTML =
        ['all',...usedConds].map(c =>
          `<span class="filter-chip ${conditionFilt===c?'active':''}" role="button" tabindex="0" onclick="setConditionFilt('${c==='all'?'all':escAttr(c)}')">${c==='all'?'All Conditions':escHtml(c)}</span>`
        ).join('');
      condBar.style.display = 'flex';
    } else {
      condBar.style.display = 'none';
    }
  }

  updateFiltersBadge();
}

// Lightweight active-state update without full chip rebuild
export function _updateChipActiveStates() {
  document.querySelectorAll('#platChips .filter-chip').forEach(c => {
    const p = c.textContent.trim();
    c.classList.toggle('active', p === 'All' ? platFilt.size === 0 : platFilt.has(p));
  });
  document.querySelectorAll('#catChips .filter-chip').forEach(c => {
    const t = c.textContent.trim();
    c.classList.toggle('active', t === 'All Categories' ? catFilt.size === 0 : [...catFilt].some(f => f.toLowerCase() === t.toLowerCase()));
  });
  document.querySelectorAll('#subcatChips .filter-chip').forEach(c => {
    const t = c.textContent.trim();
    c.classList.toggle('active', t === 'All' ? subcatFilt === 'all' : subcatFilt === t);
  });
  document.querySelectorAll('#subsubcatChips .filter-chip').forEach(c => {
    const t = c.textContent.trim();
    c.classList.toggle('active', t === 'All' ? subsubcatFilt === 'all' : subsubcatFilt === t);
  });
  updateFiltersBadge();
}

// ── FILTER SETTERS ────────────────────────────────────────────────────────────

export function setPlatFilt(p, el) {
  _invPage=0;
  if (p === 'all') {
    platFilt.clear();
  } else {
    if (platFilt.has(p)) platFilt.delete(p);
    else platFilt.add(p);
  }
  renderInv();
}

export function setCatFilt(c, el) {
  _invPage=0;
  if (c === 'all') {
    catFilt.clear();
  } else {
    if (catFilt.has(c)) catFilt.delete(c);
    else catFilt.add(c);
  }
  // reset sub-filters when cats change
  subcatFilt = 'all';
  subsubcatFilt = 'all';
  renderInv();
}

export function setSubcatFilt(s,el){
  _invPage=0;
  subcatFilt=s;
  subsubcatFilt='all';
  document.querySelectorAll('#subcatChips .subcat-chip').forEach(x=>x.classList.remove('active'));
  if (el) el.classList.add('active');
  renderInv();
}

export function setStockFilt(val) {
  _invPage = 0;
  stockFilt = val || 'all';
  renderInv();
}

export function clearStockFilter() {
  stockFilt = 'all';
  renderInv();
}

// ── SMOKE & CONDITION FILTER SETTERS ───────────────────────────────────────

export function setSmokeFilt(val) {
  _invPage = 0;
  smokeFilt = val || 'all';
  renderInv();
}

export function setConditionFilt(val) {
  _invPage = 0;
  conditionFilt = val || 'all';
  renderInv();
}

export function setSubsubcatFilt(s,el){
  _invPage=0;
  subsubcatFilt=s;
  document.querySelectorAll('#subsubcatChips .subsubcat-chip').forEach(x=>x.classList.remove('active'));
  if (el) el.classList.add('active');
  renderInv();
}

// ── SORT ──────────────────────────────────────────────────────────────────────

export function setSort(v){document.getElementById('sortSel').value=v;renderInv();}

export function sortItems(items){
  const v=document.getElementById('sortSel').value;
  return [...items].sort((a,b)=>{
    if(v==='added-desc') return new Date(b.added)-new Date(a.added);
    if(v==='added-asc')  return new Date(a.added)-new Date(b.added);
    if(v==='name-asc')   return (a.name||'').localeCompare(b.name||'');
    if(v==='margin-desc')return calc(b).m-calc(a).m;
    if(v==='qty-asc')    return (a.qty||0)-(b.qty||0);
    if(v==='price-desc') return (b.price||0)-(a.price||0);
    if(v==='cost')       return (a.cost||0)-(b.cost||0);
    if(v==='platform')   return (getPlatforms(a)[0]||'').localeCompare(getPlatforms(b)[0]||'');
    if(v==='days-desc')  return daysListed(b)-daysListed(a);
    if(v==='days-asc')   return daysListed(a)-daysListed(b);
    if(v==='profit-desc')return calc(b).pu-calc(a).pu;
    if(v==='profit-asc') return calc(a).pu-calc(b).pu;
    if(v==='flip-desc') return computeFlipScore(b).score-computeFlipScore(a).score;
    return 0;
  });
}

// ── INVENTORY TABLE RENDERING ─────────────────────────────────────────────────

export function renderInv() {
  buildChips();
  const q=(document.getElementById('invSearch').value||'').toLowerCase();
  if (q && _invPage !== 0) _invPage = 0;
  // Memoize filter results — only re-filter when data or filter state actually changed
  const filterKey = `${inv.length}:${q}:${[...platFilt].join(',')}:${[...catFilt].join(',')}:${subcatFilt}:${subsubcatFilt}:${stockFilt}:${smokeFilt}:${conditionFilt}:${inv[0]?.id||''}:${inv[inv.length-1]?.id||''}`;
  let items;
  if (_filterCache.key === filterKey && _filterCache.items) {
    items = _filterCache.items;
  } else {
    items=inv.filter(i=>{
      const mq=!q||(i.name||'').toLowerCase().includes(q)||(i.sku||'').toLowerCase().includes(q)||(i.category||'').toLowerCase().includes(q)||(i.subcategory||'').toLowerCase().includes(q)||(i.subtype||'').toLowerCase().includes(q)||(i.upc||'').toLowerCase().includes(q);
      const mp=platFilt.size===0||getPlatforms(i).some(p=>platFilt.has(p));
      const iCat=(i.category||'').toLowerCase(); const mc=catFilt.size===0||[...catFilt].some(f=>f.toLowerCase()===iCat);
      const ms=subcatFilt==='all'||(i.subcategory||'')===subcatFilt;
      const mss=subsubcatFilt==='all'||(i.subtype||'')===subsubcatFilt;
      const mst=stockFilt==='all'||(stockFilt==='low'&&i.bulk&&(i.qty===0||i.qty<=(i.lowAlert||2)));
      const msk=smokeFilt==='all'||(smokeFilt==='unset'?!i.smoke:i.smoke===smokeFilt);
      const mco=conditionFilt==='all'||(i.condition||'')=== conditionFilt;
      return mq&&mp&&mc&&ms&&mss&&mst&&msk&&mco;
    });
    _filterCache = { key: filterKey, items };
  }

  // Stock filter banner
  const banner = document.getElementById('stockFilterBanner');
  if (stockFilt !== 'all') {
    const lowCnt = inv.filter(i=>i.bulk&&i.qty>0&&i.qty<=(i.lowAlert||2)).length;
    const outCnt = inv.filter(i=>i.bulk&&i.qty===0).length;
    document.getElementById('stockFilterLabel').textContent =
      `Showing low stock (${lowCnt}) and out of stock (${outCnt}) items only`;
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
  // Inventory soft-cap banner for free tier
  const capBanner = document.getElementById('invLimitBanner');
  if (capBanner) {
    const tier = window.getUserTier?.() || 'free';
    if (tier === 'free' && inv.length >= 50) {
      capBanner.style.display = 'flex';
    } else {
      capBanner.style.display = 'none';
    }
  }

  items=sortItems(items);
  document.getElementById('invCnt').textContent=`${items.length} of ${inv.length} items`;
  const tbody=document.getElementById('invBody');
  const emptyNew=document.getElementById('invEmpty');
  const emptyFilt=document.getElementById('invFilterEmpty');
  if(!items.length){
    tbody.innerHTML='';
    const hasAnyItems = inv.length > 0;
    if (emptyNew) emptyNew.style.display = hasAnyItems ? 'none' : 'block';
    if (emptyFilt) emptyFilt.style.display = hasAnyItems ? 'block' : 'none';
    syncBulk();return;
  }
  if (emptyNew) emptyNew.style.display='none';
  if (emptyFilt) emptyFilt.style.display='none';
  // Pagination
  const totalFiltered = items.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / _invPageSize));
  if (_invPage >= totalPages) _invPage = totalPages - 1;
  if (_invPage < 0) _invPage = 0;
  const pageItems = items.slice(_invPage * _invPageSize, (_invPage + 1) * _invPageSize);
  let maxQ=1;for(let i=0;i<inv.length;i++){const q=inv[i].qty||0;if(q>maxQ)maxQ=q;}
  tbody.innerHTML=pageItems.map((item)=>{
    const {cost,price,m}=calc(item);
    const c=sc(item.qty,item.lowAlert,item.bulk);
    const bp=Math.min(100,((item.qty||0)/maxQ)*100);
    const isSel=sel.has(item.id);
    const eid = escAttr(item.id);
    const _imgs = getItemImages(item);
    const _img0 = _imgs[0];
    return `<tr data-id="${eid}" class="${isSel?'sel':''}">
      <td class="cb-col"><input type="checkbox" ${isSel?'checked':''} onchange="toggleSel('${eid}',this)"></td>
      <td><span class="drag-handle" draggable="true" ondragstart="dStart(event,'${eid}')" ondragover="dOver(event)" ondrop="dDrop(event,'${eid}')">⠿</span></td>
      <td>${_img0
        ? `<img class="item-thumb" loading="lazy" src="${escAttr(_img0)}" alt="${escHtml(item.name)}" onclick="openLightbox('${eid}')">`
        : `<div class="item-thumb-placeholder" title="Add photo" onclick="openDrawer('${eid}')">＋</div>`
      }</td>
      <td>
        <div class="item-name-row">${_img0
          ? `<img class="item-thumb-inline" loading="lazy" src="${escAttr(_img0)}" alt="" onclick="event.stopPropagation();openLightbox('${eid}')">`
          : ''}<div class="item-name" onclick="openDrawer('${eid}')">${escHtml(item.name)}</div></div>
        <div class="item-meta"><span class="item-sku">${escHtml(item.sku||'—')}</span>${item.upc?`<span class="upc-tag">${escHtml(item.upc)}</span>`:''}${item.category?`<span class="cat-tag">${escHtml(item.category)}</span>`:''} ${item.subcategory?`<span class="cat-tag" style="background:rgba(87,200,255,0.1);color:var(--accent)">${escHtml(item.subcategory)}</span>`:''} ${item.subtype?`<span class="cat-tag" style="background:rgba(123,97,255,0.15);color:var(--accent3)">${escHtml(item.subtype)}</span>`:''} ${item.condition?`<span class="cat-tag" style="background:rgba(87,255,154,0.08);color:var(--good)">${escHtml(item.condition)}</span>`:''} ${item.source?`<span class="cat-tag" style="background:rgba(255,107,53,0.1);color:var(--accent2)">📍${escHtml(item.source)}</span>`:''}${item.author?`<span class="book-meta-tag">✍ ${escHtml(item.author)}</span>`:''}${item.edition?`<span class="book-meta-tag">${escHtml(item.edition)} ed.</span>`:''}${item.signed?`<span class="book-meta-tag" style="background:rgba(255,215,0,0.15);color:#d4a017;border-color:rgba(255,215,0,0.3)">✒ Signed</span>`:''}</div>
      </td>
      <td>${renderPlatTags(item)}</td>
      <td>
        <div class="stock-cell">
          <div class="stepper">
            <button class="stepper-btn" aria-label="Decrease quantity" onclick="adjStock('${eid}',-1)">−</button>
            <span class="stepper-val sv-${c}" title="${c==='low'?'Low stock':c==='warn'?'Warning':'In stock'}">${item.qty||0}${c==='low'?' ⚠':c==='warn'?' ⚡':''}</span>
            <button class="stepper-btn" aria-label="Increase quantity" onclick="adjStock('${eid}',+1)">+</button>
          </div>
          <div class="mini-bar"><div class="mb-fill mf-${c}" style="width:${bp}%"></div></div>
        </div>
      </td>
      <td style="color:var(--muted)">${fmt(cost)}</td>
      <td><span class="price-disp" title="Click to edit inline" onclick="startPriceEdit(this,'${eid}')">${fmt(price)}</span></td>
      <td><span class="margin-badge ${margCls(m)}">${pct(m)}</span></td>
      <td class="days-col">${(()=>{
        const _dl=daysListed(item);
        const _itemSales=getSalesForItem(item.id);
        const _lastSaleDays=_itemSales.length?Math.floor((Date.now()-Math.max(..._itemSales.map(s=>new Date(s.date).getTime())))/86400000):null;
        const _plats=getPlatforms(item);
        const _expMin=_plats.reduce((min,p)=>{const d=getDaysUntilExpiry(p,item.platformListingDates?.[p]);return d!==null&&(min===null||d<min)?d:min;},null);
        return `<span class="days-badge${_dl>=60?' stale':_dl>=30?' aging':''}" title="Listed ${_dl} days">${_dl}d</span>`
          +(_lastSaleDays!==null?`<span style="font-size:9px;color:${_lastSaleDays>30?'var(--warn)':'var(--muted)'};display:block;margin-top:2px" title="Last sale ${_lastSaleDays} days ago">${_lastSaleDays}d ago</span>`:'')
          +(_expMin!==null&&_expMin<=7?`<span style="font-size:9px;color:var(--warn);display:block;margin-top:2px" title="Listing expires in ${_expMin} days">⏳${_expMin}d</span>`:'');
      })()}</td>
      <td class="flip-score-col pro-gate">${(()=>{const fs=computeFlipScore(item);const _fc=fs.score>=80?'var(--good)':fs.score>=60?'var(--accent)':fs.score>=40?'var(--warn)':'var(--danger)';return `<span class="flip-badge" style="color:${_fc}" title="Margin:${fs.breakdown.margin} Fresh:${fs.breakdown.freshness} List:${fs.breakdown.listing} Demand:${fs.breakdown.demand}">${fs.score}<sup>${fs.grade}</sup></span>`;})()}</td>
      <td class="photos-col">${_imgs.length?`<span class="photo-count-badge" title="${_imgs.length} photo${_imgs.length>1?'s':''}">${_imgs.length} 📷</span>`:`<span class="photo-count-badge empty" title="No photos">0</span>`}</td>
      <td><div class="td-acts">
        ${item.qty>0?`<button class="act-btn" onclick="openSoldModal('${eid}')">Sold ›</button>`:`<span class="out-badge">Out</span>`}
        <button class="act-btn" onclick="openDrawer('${eid}')">Edit</button>
        <button class="act-btn red" onclick="delItem('${eid}')">✕</button>
      </div></td>
    </tr>`;
  }).join('');
  syncBulk();
  // Render pagination
  const pgEl = document.getElementById('invPagination');
  if (pgEl) {
    renderPagination(pgEl, {
      page: _invPage,
      totalItems: totalFiltered,
      pageSize: _invPageSize,
      onPage: (p) => { _invPage = p; renderInv(); },
      pageSizes: [50, 100, 250],
      onPageSize: (s) => { _invPageSize = s; _invPage = 0; renderInv(); },
    });
  }
}

// ── INLINE PRICE EDIT ─────────────────────────────────────────────────────────

export function startPriceEdit(span, id) {
  const item=getInvItem(id);
  if(!item) return;
  const inp=document.createElement('input');
  inp.className='price-inp'; inp.type='number'; inp.step='0.01'; inp.value=item.price||0;
  const origSpan = span.cloneNode(true);
  origSpan.onclick = () => startPriceEdit(origSpan, id);
  span.replaceWith(inp); inp.focus(); inp.select();
  let committed=false;const commit=()=>{if(committed)return;committed=true;const v=parseFloat(inp.value);if(!isNaN(v)&&v>=0){const oldP=item.price||0;item.price=v;markDirty('inv',item.id);inp.style.background='var(--good)';inp.style.color='#fff';inp.style.transition='background 0.2s';save();refresh();setTimeout(()=>renderInv(),200);toast('Price updated ✓');if(v!==oldP&&v>0){logPriceChange(item.id,v,'manual');if(item.ebayItemId&&isEBayConnected()){pushEBayPrice(item.id).then(r=>{if(r.success)toast('eBay price synced ✓');}).catch(e=>console.warn('[eBay] Price push:',e.message));}}}else renderInv();};
  inp.addEventListener('blur',commit);
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();inp.blur();}if(e.key==='Escape'){inp.removeEventListener('blur',commit);inp.replaceWith(origSpan);}});
}

// ── STOCK STEPPER ─────────────────────────────────────────────────────────────

const _debouncedStockSave = debounce(() => { save(); refresh(); }, 300);

/** Patch only the stock cell + action cell for a single row in-place */
function _patchStockRow(id) {
  const tr = document.querySelector(`#invBody tr[data-id="${escAttr(id)}"]`);
  if (!tr) { renderInv(); return; } // item not on current page — fallback
  const item = getInvItem(id);
  if (!item) return;
  const c = sc(item.qty, item.lowAlert, item.bulk);
  let maxQ = 1;
  for (let i = 0; i < inv.length; i++) { const q = inv[i].qty || 0; if (q > maxQ) maxQ = q; }
  const bp = Math.min(100, ((item.qty || 0) / maxQ) * 100);
  const eid = escAttr(item.id);
  // Patch stock cell
  const stockCell = tr.querySelector('.stock-cell');
  if (stockCell) {
    stockCell.innerHTML = `
      <div class="stepper">
        <button class="stepper-btn" aria-label="Decrease quantity" onclick="adjStock('${eid}',-1)">−</button>
        <span class="stepper-val sv-${c}" title="${c==='low'?'Low stock':c==='warn'?'Warning':'In stock'}">${item.qty||0}${c==='low'?' ⚠':c==='warn'?' ⚡':''}</span>
        <button class="stepper-btn" aria-label="Increase quantity" onclick="adjStock('${eid}',+1)">+</button>
      </div>
      <div class="mini-bar"><div class="mb-fill mf-${c}" style="width:${bp}%"></div></div>`;
  }
  // Patch action cell (Sold vs Out badge)
  const actDiv = tr.querySelector('.td-acts');
  if (actDiv) {
    actDiv.innerHTML = `
      ${item.qty>0?`<button class="act-btn" onclick="openSoldModal('${eid}')">Sold ›</button>`:`<span class="out-badge">Out</span>`}
      <button class="act-btn" onclick="openDrawer('${eid}')">Edit</button>
      <button class="act-btn red" onclick="delItem('${eid}')">✕</button>`;
  }
}

export function adjStock(id, d) {
  const item=getInvItem(id); if(!item) return;
  item.qty=Math.max(0,(item.qty||0)+d);
  markDirty('inv',item.id);
  _debouncedStockSave(); _patchStockRow(id);
  if(item.bulk&&item.qty===0) toast('⚠ Out of stock!',true);
  else if(item.bulk&&item.qty<=(item.lowAlert||2)) toast(`⚠ Low: ${item.qty} left`,true);
}

// ── DRAG & DROP ───────────────────────────────────────────────────────────────

export function dStart(e,id){dragSrc=inv.findIndex(i=>i.id===id);e.dataTransfer.effectAllowed='move';}

export function dOver(e){e.preventDefault();e.dataTransfer.dropEffect='move';document.querySelectorAll('#invBody tr').forEach(r=>r.classList.remove('drag-over'));e.currentTarget.closest('tr')?.classList.add('drag-over');}

export function dDrop(e,id){e.preventDefault();document.querySelectorAll('#invBody tr').forEach(r=>r.classList.remove('drag-over'));if(dragSrc===null)return;const di=inv.findIndex(i=>i.id===id);if(dragSrc===di)return;const[m]=inv.splice(dragSrc,1);inv.splice(di,0,m);dragSrc=null;save();renderInv();}

// ── SELECTION ─────────────────────────────────────────────────────────────────

export function toggleSel(id,cb){cb.checked?sel.add(id):sel.delete(id);cb.closest('tr').classList.toggle('sel',cb.checked);syncBulk();const all=document.querySelectorAll('#invBody input[type=checkbox]');const selAllEl=document.getElementById('selAll');if(selAllEl)selAllEl.checked=all.length&&[...all].every(c=>c.checked);}

export function toggleAll(cb){document.querySelectorAll('#invBody tr[data-id]').forEach(r=>{const id=r.dataset.id;const rc=r.querySelector('input[type=checkbox]');if(cb.checked){sel.add(id);rc.checked=true;r.classList.add('sel');}else{sel.delete(id);rc.checked=false;r.classList.remove('sel');}});syncBulk();}

export function clearSel(){sel.clear();const selAllEl=document.getElementById('selAll');if(selAllEl)selAllEl.checked=false;renderInv();}

export function syncBulk(){const b=document.getElementById('bulkBar');if(b)b.classList.toggle('on',sel.size>0);const cnt=document.getElementById('bulkCnt');if(cnt)cnt.textContent=sel.size+' selected';}

// ── BULK OPERATIONS ───────────────────────────────────────────────────────────

export async function bulkDel(){if(!sel.size)return;if(!await appConfirm({ title: 'Delete Items', message: `Delete ${sel.size} item(s)?`, danger: true }))return;const ids=[...sel];ids.forEach(id=>softDeleteItem(id));sel.clear();save();refresh();toast(ids.length+' item(s) deleted — check 🗑️ to restore');await pushDeleteToCloud('ft_inventory',ids);autoSync();}

export async function bulkSold(){if(!sel.size)return;const ok=[...sel].filter(id=>{const it=getInvItem(id);return it&&it.qty>0;});if(!ok.length){toast('No sellable items selected',true);return;}if(!await appConfirm({ title: 'Record Sales', message: `Record sale for ${ok.length} item(s) at list price?` }))return;const today=localDate();for(const id of ok){const it=getInvItem(id);const saleId=uid();sales.push({id:saleId,itemId:id,price:it.price,listPrice:it.price||0,qty:1,fees:it.fees||0,ship:it.ship||0,date:today});markDirty('sales',saleId);it.qty=Math.max(0,(it.qty||0)-1);markDirty('inv',id);}sel.clear();save();refresh();toast(`${ok.length} sale(s) recorded ✓`);}

// ── ADVANCED BULK OPERATIONS ─────────────────────────────────────────────────

/** Show/hide the bulk actions dropdown */
let _bulkMenuCloseHandler = null;
export function toggleBulkMenu() {
  const menu = document.getElementById('bulkMenu');
  if (!menu) return;
  // Remove any existing outside-click handler first
  if (_bulkMenuCloseHandler) {
    document.removeEventListener('click', _bulkMenuCloseHandler);
    _bulkMenuCloseHandler = null;
  }
  menu.classList.toggle('open');
  // Close on outside click
  if (menu.classList.contains('open')) {
    _bulkMenuCloseHandler = (e) => {
      if (!menu.contains(e.target) && e.target.id !== 'bulkMoreBtn') {
        menu.classList.remove('open');
        document.removeEventListener('click', _bulkMenuCloseHandler);
        _bulkMenuCloseHandler = null;
      }
    };
    setTimeout(() => document.addEventListener('click', _bulkMenuCloseHandler), 0);
  }
}

/** Open the bulk price adjust popup */
export function openBulkPrice() {
  if (!sel.size) return;
  document.getElementById('bulkMenu')?.classList.remove('open');
  const ov = document.getElementById('bulkPriceOv');
  if (ov) {
    document.getElementById('bulkPriceType').value = 'percent';
    document.getElementById('bulkPriceVal').value = '';
    document.getElementById('bulkPriceDir').value = 'decrease';
    document.getElementById('bulkPricePreview').textContent = `${sel.size} item(s) will be adjusted`;
    ov.classList.add('on');
  }
}

export function closeBulkPrice() {
  document.getElementById('bulkPriceOv')?.classList.remove('on');
}

export function previewBulkPrice() {
  const type = document.getElementById('bulkPriceType').value;
  const dir  = document.getElementById('bulkPriceDir').value;
  const raw  = parseFloat(document.getElementById('bulkPriceVal').value); if (isNaN(raw) || raw <= 0) { toast('Enter a valid amount', true); return; }
  const val  = dir === 'decrease' ? -Math.abs(raw) : Math.abs(raw);
  let cnt = 0;
  for (const id of sel) {
    const it = getInvItem(id);
    if (!it) continue;
    let np = it.price || 0;
    np = type === 'percent' ? np * (1 + val / 100) : np + val;
    np = Math.max(0.01, Math.round(np * 100) / 100);
    if (np !== (it.price || 0)) cnt++;
  }
  document.getElementById('bulkPricePreview').textContent =
    `${cnt} of ${sel.size} item(s) will change price`;
}

export function applyBulkPrice() {
  const type = document.getElementById('bulkPriceType').value;
  const dir  = document.getElementById('bulkPriceDir').value;
  const raw  = parseFloat(document.getElementById('bulkPriceVal').value); if (isNaN(raw) || raw <= 0) { toast('Enter a valid amount', true); return; }
  
  const val  = dir === 'decrease' ? -Math.abs(raw) : Math.abs(raw);
  let cnt = 0;
  for (const id of sel) {
    const it = getInvItem(id);
    if (!it) continue;
    let np = it.price || 0;
    np = type === 'percent' ? np * (1 + val / 100) : np + val;
    np = Math.max(0.01, Math.round(np * 100) / 100);
    if (np !== (it.price || 0)) {
      it.price = np;
      markDirty('inv', it.id);
      cnt++;
    }
  }
  if (cnt) { save(); refresh(); }
  closeBulkPrice();
  toast(cnt ? `${cnt} price(s) updated ✓` : 'No changes needed');
  renderInv();
}

/** Open the bulk category assign popup */
export function openBulkCategory() {
  if (!sel.size) return;
  document.getElementById('bulkMenu')?.classList.remove('open');
  const ov = document.getElementById('bulkCatOv');
  if (ov) {
    // Build options from existing categories in inventory + CAT_TREE
    const cats = new Set(inv.map(i => i.category).filter(Boolean));
    try {
      // Dynamically import is tricky — we already have category data from filter chips
      document.querySelectorAll('#catChips .cat-chip').forEach(c => {
        const t = c.textContent.trim();
        if (t !== 'All Categories') cats.add(t);
      });
    } catch (_) {}
    const selEl = document.getElementById('bulkCatSelect');
    selEl.innerHTML = `<option value="">— Pick a category —</option>` +
      [...cats].sort().map(c => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('');
    document.getElementById('bulkCatCount').textContent = `${sel.size} item(s)`;
    ov.classList.add('on');
  }
}

export function closeBulkCategory() {
  document.getElementById('bulkCatOv')?.classList.remove('on');
}

export function applyBulkCategory() {
  const cat = document.getElementById('bulkCatSelect').value;
  if (!cat) { toast('Pick a category', true); return; }
  let cnt = 0;
  for (const id of sel) {
    const it = getInvItem(id);
    if (!it) continue;
    if (it.category !== cat) {
      it.category = cat;
      markDirty('inv', it.id);
      cnt++;
    }
  }
  if (cnt) { save(); refresh(); }
  closeBulkCategory();
  toast(cnt ? `${cnt} item(s) → ${cat} ✓` : 'No changes');
  renderInv();
}

/** Open the bulk platform toggle popup */
export function openBulkPlatform() {
  if (!sel.size) return;
  document.getElementById('bulkMenu')?.classList.remove('open');
  const ov = document.getElementById('bulkPlatOv');
  if (ov) {
    document.getElementById('bulkPlatAction').value = 'add';
    document.getElementById('bulkPlatCount').textContent = `${sel.size} item(s)`;
    ov.classList.add('on');
  }
}

export function closeBulkPlatform() {
  document.getElementById('bulkPlatOv')?.classList.remove('on');
}

export function applyBulkPlatform() {
  const action = document.getElementById('bulkPlatAction').value;
  const plat   = document.getElementById('bulkPlatSelect').value;
  if (!plat) { toast('Pick a platform', true); return; }
  let cnt = 0;
  for (const id of sel) {
    const it = getInvItem(id);
    if (!it) continue;
    let plats = Array.isArray(it.platforms) ? [...it.platforms] : (it.platform ? [it.platform] : []);
    if (action === 'add') {
      if (!plats.includes(plat)) { plats.push(plat); cnt++; }
    } else {
      const idx = plats.indexOf(plat);
      if (idx >= 0) { plats.splice(idx, 1); cnt++; }
    }
    // Enforce Unlisted mutual exclusivity
    plats = sanitizePlatforms(plats, action === 'add' ? plat : undefined);
    it.platforms = plats;
    if (plats.length === 1) it.platform = plats[0];
    else if (plats.length === 0) { it.platform = ''; it.platforms = []; }
    markDirty('inv', it.id);
  }
  if (cnt) { save(); refresh(); }
  closeBulkPlatform();
  toast(cnt ? `${cnt} item(s) ${action === 'add' ? '→' : '✕'} ${plat} ✓` : 'No changes');
  renderInv();
}

/** Export selected items to CSV */
export function bulkExportCSV() {
  if (!sel.size) return;
  document.getElementById('bulkMenu')?.classList.remove('open');
  const headers = ['Name','SKU','UPC','Category','Subcategory','Platform(s)','Cost','Price','Qty','Condition','Source','Date Added','Days Listed'];
  const rows = [headers.join(',')];
  for (const id of sel) {
    const it = getInvItem(id);
    if (!it) continue;
    const plats = getPlatforms(it).join('; ');
    const san = v => { const s = String(v); return /^[=+\-@]/.test(s) ? "'" + s : s; };
    const row = [
      `"${san(it.name || '').replace(/"/g, '""')}"`,
      `"${san(it.sku || '').replace(/"/g, '""')}"`,
      `"${san(it.upc || '').replace(/"/g, '""')}"`,
      `"${san(it.category || '').replace(/"/g, '""')}"`,
      `"${san(it.subcategory || '').replace(/"/g, '""')}"`,
      `"${san(plats).replace(/"/g, '""')}"`,
      (it.cost || 0).toFixed(2),
      (it.price || 0).toFixed(2),
      it.qty || 0,
      `"${san(it.condition || '').replace(/"/g, '""')}"`,
      `"${san(it.source || '').replace(/"/g, '""')}"`,
      `"${it.added || ''}"`,
      daysListed(it)
    ];
    rows.push(row.join(','));
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fliptrack-export-${localDate()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast(`Exported ${sel.size} item(s) to CSV ✓`);
}
