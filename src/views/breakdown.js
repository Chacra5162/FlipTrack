// ── BREAKDOWN VIEW ────────────────────────────────────────────────────────

import { inv } from '../data/store.js';
import { fmt, pct, escHtml } from '../utils/format.js';
import { calc, margCls } from '../data/store.js';
import { setCatFilt as invSetCatFilt, setSubcatFilt as invSetSubcatFilt, setSubsubcatFilt as invSetSubsubcatFilt, setStockFilt as invSetStockFilt, openFilterPanel } from './inventory.js';

let _breakdownCache = '';
let _cacheDirty = true;

function renderBreakdown() {
  const el = document.getElementById('breakdownContent');
  // Use cached HTML if data hasn't changed
  if (!_cacheDirty && _breakdownCache) { el.innerHTML = _breakdownCache; return; }
  if (!inv.length) {
    el.innerHTML = '<div class="bd-empty">📦 No inventory yet. Add items to see your breakdown.</div>';
    return;
  }

  // ── Aggregate totals ──────────────────────────────────────────────────────
  const totalValue = inv.reduce((a,i)=>a+(i.price||0)*(i.qty||0),0);
  const totalUnits = inv.reduce((a,i)=>a+(i.qty||0),0);
  const totalItems = inv.length;
  const totalCost  = inv.reduce((a,i)=>a+(i.cost||0)*(i.qty||0),0);
  const totalProfit= inv.reduce((a,i)=>{ const {pu}=calc(i); return a+pu*(i.qty||0); },0);
  const avgMargin  = totalValue ? totalProfit/totalValue : 0;

  // Build canonical category map for case-insensitive grouping
  const _canonCatMap = new Map();
  inv.forEach(i => { const c=(i.category||'').trim(); if(c){ const k=c.toLowerCase(); if(!_canonCatMap.has(k)) _canonCatMap.set(k,c); } });
  const canonCat = c => _canonCatMap.get((c||'').toLowerCase()) || c || UNCATEGORIZED;

  // Build category → subcategory → items map
  const catMap = {}; // { catName: { value, units, items, cost, profit, subs: { subName: {...} } } }
  const UNCATEGORIZED = '(Uncategorized)';

  for (const item of inv) {
    const cat = item.category ? canonCat(item.category) : UNCATEGORIZED;
    const sub = item.subcategory || '';
    const {pu} = calc(item);
    const itemVal  = (item.price||0)*(item.qty||0);
    const itemCost = (item.cost||0)*(item.qty||0);
    const itemProfit = pu*(item.qty||0);

    if (!catMap[cat]) catMap[cat] = { value:0, units:0, items:0, cost:0, profit:0, subs:{} };
    catMap[cat].value  += itemVal;
    catMap[cat].units  += item.qty||0;
    catMap[cat].items  += 1;
    catMap[cat].cost   += itemCost;
    catMap[cat].profit += itemProfit;

    if (sub) {
      if (!catMap[cat].subs[sub]) catMap[cat].subs[sub] = { value:0, units:0, items:0, cost:0, profit:0 };
      catMap[cat].subs[sub].value  += itemVal;
      catMap[cat].subs[sub].units  += item.qty||0;
      catMap[cat].subs[sub].items  += 1;
      catMap[cat].subs[sub].cost   += itemCost;
      catMap[cat].subs[sub].profit += itemProfit;
    }
  }

  // Sort categories by value desc
  const cats = Object.entries(catMap).sort((a,b)=>b[1].value-a[1].value);

  // ── Column header helper ──────────────────────────────────────────────────
  const colHdr = `<div class="bd-col-headers">
    <div></div>
    <div class="bd-col-hdr" style="text-align:left">Category</div>
    <div class="bd-col-hdr">Value</div>
    <div class="bd-col-hdr">Cost Basis</div>
    <div class="bd-col-hdr">Units</div>
    <div class="bd-col-hdr">Items</div>
    <div class="bd-col-hdr">Avg Margin</div>
  </div>`;

  // ── Render each category block ────────────────────────────────────────────
  const catAccent = ['#57c8ff','#ff6b35','#7b61ff','#57ff9a','#ffb800','#00bcff','#ff4757','#3cb371'];

  const catBlocks = cats.map(([cat, d], ci) => {
    const pct_share = totalValue ? (d.value / totalValue * 100).toFixed(1) : 0;
    const margin    = d.value ? d.profit / d.value : 0;
    const accent    = catAccent[ci % catAccent.length];
    const hasSubs   = Object.keys(d.subs).length > 0;

    const subRows = hasSubs
      ? Object.entries(d.subs)
          .sort((a,b)=>b[1].value-a[1].value)
          .map(([sub, sd]) => {
            const sm = sd.value ? sd.profit/sd.value : 0;
            return `<div class="bd-sub-row" onclick="filterToSubcat('${cat.replace(/'/g,"\\'")}','${sub.replace(/'/g,"\\'")}')">
              <div></div>
              <div>
                <div class="bd-sub-name clickable">↳ ${escHtml(sub)}</div>
                <div style="font-size:9px;color:var(--muted);margin-top:2px">${sd.items} item${sd.items!==1?'s':''}</div>
                <div class="bd-mobile-stats">
                  <span>${fmt(sd.cost)} cost</span>
                  <span>${sd.units} units</span>
                  <span class="margin-badge ${margCls(sm)}">${pct(sm)}</span>
                </div>
              </div>
              <div class="bd-col-val">${fmt(sd.value)}</div>
              <div class="bd-col-val" style="color:var(--muted)">${fmt(sd.cost)}</div>
              <div class="bd-col-units">${sd.units}</div>
              <div class="bd-col-units">${sd.items}</div>
              <div class="bd-col-m"><span class="margin-badge ${margCls(sm)}">${pct(sm)}</span></div>
            </div>`;
          }).join('')
      : '';

    return `<div class="bd-cat-block">
      <div class="bd-cat-row ${hasSubs?'has-subs':''}" onclick="${hasSubs?`toggleBdSubs('bdsub-${ci}')`:`filterToCat('${cat.replace(/'/g,"\\'")}')` }">
        <div class="bd-cat-chevron${hasSubs?' open-ready':''}">
          ${hasSubs ? '›' : ''}
        </div>
        <div>
          <div class="bd-cat-name">${escHtml(cat)}</div>
          <div class="bd-cat-bar-wrap" style="width:120px">
            <div class="bd-cat-bar-fill" style="width:${pct_share}%;background:${accent}"></div>
          </div>
          <div style="font-size:9px;color:var(--muted);margin-top:2px">${pct_share}% of total value · ${d.items} item${d.items!==1?'s':''}</div>
          <div class="bd-mobile-stats">
            <span>${fmt(d.cost)} cost</span>
            <span>${d.units} units</span>
            <span class="margin-badge ${margCls(margin)}">${pct(margin)}</span>
          </div>
        </div>
        <div class="bd-col-val" style="color:${accent}">${fmt(d.value)}</div>
        <div class="bd-col-val" style="color:var(--muted)">${fmt(d.cost)}</div>
        <div class="bd-col-units">${d.units}</div>
        <div class="bd-col-units">${d.items}</div>
        <div class="bd-col-m"><span class="margin-badge ${margCls(margin)}">${pct(margin)}</span></div>
      </div>
      ${hasSubs ? `<div class="bd-sub-table" id="bdsub-${ci}">${subRows}</div>` : ''}
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="panel" style="animation:none;margin-bottom:16px">
      <div class="breakdown-header">
        <div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:6px">Total Inventory Value</div>
          <div class="breakdown-total">${fmt(totalValue)}</div>
          <div class="breakdown-sub">${totalItems} items · ${totalUnits} units in stock · avg ${pct(avgMargin)} margin</div>
        </div>
        <button class="btn-secondary" onclick="goToBreakdown()" style="font-size:11px">↺ Refresh</button>
      </div>
      <div class="bd-summary-grid">
        <div class="bd-sum-card">
          <div class="bd-sum-lbl">Total Value</div>
          <div class="bd-sum-val" style="color:var(--accent)">${fmt(totalValue)}</div>
          <div class="bd-sum-sub">${totalUnits} units @ list price</div>
        </div>
        <div class="bd-sum-card">
          <div class="bd-sum-lbl">Cost Basis</div>
          <div class="bd-sum-val" style="color:var(--warn)">${fmt(totalCost)}</div>
          <div class="bd-sum-sub">Total invested</div>
        </div>
        <div class="bd-sum-card">
          <div class="bd-sum-lbl">Potential Profit</div>
          <div class="bd-sum-val" style="color:var(--good)">${fmt(totalProfit)}</div>
          <div class="bd-sum-sub">If all sold at list price</div>
        </div>
        <div class="bd-sum-card">
          <div class="bd-sum-lbl">Categories</div>
          <div class="bd-sum-val">${cats.length}</div>
          <div class="bd-sum-sub">across ${totalItems} items</div>
        </div>
      </div>
    </div>
    <div class="panel" style="animation:none">
      <div class="panel-header">
        <div class="panel-title">By Category</div>
        <span style="font-size:10px;color:var(--muted)">Click a category to filter inventory · click ↳ subcategory to drill down</span>
      </div>
      ${colHdr}
      ${catBlocks}
    </div>`;
  _breakdownCache = el.innerHTML;
}

function toggleBdSubs(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('open');
  // rotate chevron
  const row = el.previousElementSibling;
  row?.querySelector('.bd-cat-chevron')?.classList.toggle('open');
}

function filterToCat(cat) {
  // Use inventory.js filter functions to set state properly
  invSetCatFilt('all', null);         // clear first
  invSetCatFilt(cat, null);           // set the category
  invSetSubcatFilt('all', null);
  invSetSubsubcatFilt('all', null);
  invSetStockFilt('all');
  const invTab = document.querySelectorAll('.nav-tab')[1];
  if (window.switchView) window.switchView('inventory', invTab);
  if (window.bnav) window.bnav('bn-inventory');
  openFilterPanel();
}

function filterToSubcat(cat, sub) {
  invSetCatFilt('all', null);         // clear first
  invSetCatFilt(cat, null);           // set the category
  invSetSubcatFilt(sub, null);
  invSetSubsubcatFilt('all', null);
  invSetStockFilt('all');
  const invTab = document.querySelectorAll('.nav-tab')[1];
  if (window.switchView) window.switchView('inventory', invTab);
  if (window.bnav) window.bnav('bn-inventory');
  openFilterPanel();
}

export { renderBreakdown, toggleBdSubs, filterToCat, filterToSubcat };
