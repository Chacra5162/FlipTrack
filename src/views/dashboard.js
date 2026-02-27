import { inv, sales, getInvItem, calc, sc, margCls, mkc, save, refresh } from '../data/store.js';
import { fmt, pct, ds, escHtml } from '../utils/format.js';
import { getPlatforms, renderPlatTags } from '../features/platforms.js';
import { toast } from '../utils/dom.js';
import { openDrawer } from '../modals/drawer.js';
import { getDeathPileStats, getUrgencyLevel } from '../features/death-pile.js';

export function updateStats() {
  const invVal = inv.reduce((a,i)=>a+(i.price||0)*(i.qty||0),0);
  const units  = inv.reduce((a,i)=>a+(i.qty||0),0);
  const low    = inv.filter(i=>i.bulk&&i.qty>0&&i.qty<=(i.lowAlert||2));
  const out    = inv.filter(i=>i.qty===0);
  let rev=0,cogs=0,fees=0;
  for(const s of sales){
    const it=getInvItem(s.itemId);
    rev  +=(s.price||0)*(s.qty||0);
    cogs +=(it?(it.cost||0)*(s.qty||0):0);
    fees +=(s.fees||0)+(s.ship||0);
  }
  const profit=rev-cogs-fees, roi=cogs?profit/cogs:null, avgm=rev?profit/rev:null;
  document.getElementById('sInvVal').textContent=fmt(invVal);
  document.getElementById('sInvCnt').textContent=units+' units in stock';
  document.getElementById('sRev').textContent=fmt(rev);
  document.getElementById('sRevCnt').textContent=sales.length+' sales';
  document.getElementById('sProfit').textContent=fmt(profit);
  document.getElementById('sMargin').textContent=avgm!=null?'avg margin '+pct(avgm):'avg margin —';
  document.getElementById('sROI').textContent=roi!=null?pct(roi):'—';
  document.getElementById('sCOGS').textContent=fmt(cogs)+' cost basis';
  document.getElementById('sLow').textContent=low.length;
  document.getElementById('sOut').textContent=out.length+' out of stock';
  // Avg Days to Sell — for items that have sold, compute avg(first sale date - added date)
  const daysArr = [];
  for (const it of inv) {
    if (!it.added) continue;
    const itemSales = sales.filter(s => s.itemId === it.id);
    if (!itemSales.length) continue;
    const firstSale = new Date(Math.min(...itemSales.map(s => new Date(s.date))));
    const added = new Date(it.added);
    const days = Math.max(0, Math.floor((firstSale - added) / 86400000));
    daysArr.push(days);
  }
  const avgDays = daysArr.length ? Math.round(daysArr.reduce((a, d) => a + d, 0) / daysArr.length) : null;
  document.getElementById('sAvgDays').textContent = avgDays !== null ? avgDays + 'd' : '—';
  document.getElementById('sAvgDaysSub').textContent = daysArr.length ? `based on ${daysArr.length} sold items` : 'no sales data yet';
  // alert banner
  const all=[...out,...low.filter(x=>!out.includes(x))];
  const bn=document.getElementById('alertBanner');
  if(all.length){document.getElementById('alertItems').textContent=all.map(i=>`${i.name} (${i.qty} left)`).join(' · ');bn.classList.add('on');}
  else bn.classList.remove('on');
}

export function updatePlatBreakdown() {
  const m={};
  for(const s of sales){const it=getInvItem(s.itemId);const plats=it?getPlatforms(it):['Other'];const rev=(s.price||0)*(s.qty||0);plats.forEach(p=>{m[p]=(m[p]||0)+rev/plats.length;});}
  const total=Object.values(m).reduce((a,v)=>a+v,0);
  const entries=Object.entries(m).sort((a,b)=>b[1]-a[1]);
  const colors={
    'eBay':'#ff6b35','Amazon':'#ffb800','Etsy':'#7b61ff','Facebook Marketplace':'#57ff9a',
    'Depop':'#ff4757','Poshmark':'#e63950','Mercari':'#3cb371','Grailed':'#57c8ff',
    'StockX':'#00bcff','GOAT':'#57c8ff','Vinted':'#09b66d','Tradesy':'#ff69b4',
    'The RealReal':'#b4b4b4','Vestiaire Collective':'#d4af37',
    'Reverb':'#0096ff','Discogs':'#ffa500',
    'Craigslist':'#6495ed','OfferUp':'#50c878','Nextdoor':'#00ac4f',
    'Whatnot':'#9b59b6','TikTok Shop':'#ff0050','Instagram':'#e4405f',
    'Shopify':'#95bf47','Walmart Marketplace':'#0071ce','Newegg':'#ff5a00',
    'Bonanza':'#ffc800','Ruby Lane':'#ffc800','Chairish':'#8b5a2b',
    '1stDibs':'#b4946f','Swappa':'#00aeef','Decluttr':'#ff8c00',
    'Other':'#57c8ff'
  };
  const el=document.getElementById('platBreakdown');
  if(!entries.length){el.innerHTML='<div style="padding:18px;color:var(--muted);font-size:12px">No sales yet.</div>';return;}
  el.innerHTML=entries.map(([n,v])=>`
    <div class="plat-row">
      <span class="plat-name">${n}</span>
      <div class="plat-bw"><div class="plat-bar"><div class="plat-fill" style="width:${total?v/total*100:0}%;background:${colors[n]||'#57c8ff'}"></div></div></div>
      <span class="plat-val">${fmt(v)}</span>
    </div>`).join('');
}

export function updateSalesLog() {
  document.getElementById('saleCnt').textContent=sales.length+' total';
  const el=document.getElementById('salesLog');
  if(!sales.length){el.innerHTML='<div class="sale-item" style="justify-content:center;color:var(--muted);font-size:12px">No sales yet.</div>';return;}
  const colors=['#57c8ff','#ff6b35','#7b61ff','#57ff9a','#ffb800'];
  el.innerHTML=[...sales].reverse().slice(0,8).map((s,i)=>{
    const it=inv.find(x=>x.id===s.itemId);
    const nm=it?it.name:'Unknown';
    const pr=(s.price||0)*(s.qty||0)-(it?(it.cost||0)*(s.qty||0):0)-(s.fees||0)-(s.ship||0);
    return `<div class="sale-item">
      <div class="sale-dot" style="background:${colors[i%5]}"></div>
      <div class="sale-info"><div class="sale-name">${nm}</div><div class="sale-time">${ds(s.date)} · profit ${fmt(pr)}</div></div>
      <div class="sale-amt">${fmt((s.price||0)*(s.qty||0))}</div>
    </div>`;
  }).join('');
}

export function renderDeathPile() {
  const el = document.getElementById('deathPileSection');
  if (!el) return;

  const stats = getDeathPileStats();
  if (!stats.totalItems) { el.style.display = 'none'; return; }

  const shown = stats.items.slice(0, 6);
  const more = stats.totalItems - shown.length;

  el.style.display = '';
  el.innerHTML = `<div class="death-pile-wrap">
    <div class="death-pile-hdr">
      <div class="death-pile-title">💀 Death Pile <span style="font-family:'DM Mono',monospace;font-weight:400;font-size:10px;opacity:0.7">${stats.totalItems} stale item${stats.totalItems > 1 ? 's' : ''} · ${fmt(stats.totalCost)} at risk</span></div>
      <button style="background:none;border:1px solid rgba(123,97,255,0.3);color:var(--accent3);font-size:10px;padding:3px 10px;cursor:pointer;font-family:'DM Mono',monospace" onclick="document.getElementById('deathPileSection').style.display='none'">Dismiss</button>
    </div>
    ${shown.map(dp => `<div class="death-pile-item">
      <div style="font-size:16px;margin-right:4px">${dp.urgency.icon}</div>
      <div class="dp-info">
        <div class="dp-name" onclick="openDrawer('${dp.item.id}')">${escHtml(dp.item.name)}</div>
        <div class="dp-meta">${escHtml(dp.reason)} · ${escHtml(dp.suggestedAction)}</div>
      </div>
      <div class="dp-age" style="color:${dp.urgency.color}">${dp.daysStale}d</div>
      <button class="dp-list-btn" onclick="openDrawer('${dp.item.id}')">Fix →</button>
    </div>`).join('')}
    ${more > 0 ? `<div style="font-size:10px;color:var(--muted);margin-top:6px;font-family:'DM Mono',monospace">+ ${more} more stale items</div>` : ''}
  </div>`;
}

export function renderPriceAlerts() {
  const el = document.getElementById('priceAlerts');
  if (!el) return;
  const now = new Date();
  const msDay = 86400000;

  // Find in-stock items with no sales, listed 14+ days
  const staleItems = inv.filter(item => {
    if ((item.qty || 0) <= 0) return false;
    const hasSales = sales.some(s => s.itemId === item.id);
    if (hasSales) return false;
    const added = new Date(item.added || now);
    const days = Math.floor((now - added) / msDay);
    return days >= 14;
  }).map(item => {
    const added = new Date(item.added || now);
    const days = Math.floor((now - added) / msDay);
    const tier = days >= 90 ? 3 : days >= 60 ? 2 : days >= 30 ? 1 : 0;
    const dropPct = tier >= 3 ? 0.25 : tier >= 2 ? 0.20 : tier >= 1 ? 0.15 : 0.10;
    const suggested = Math.round((item.price || 0) * (1 - dropPct) * 100) / 100;
    return { item, days, tier, dropPct, suggested };
  }).sort((a, b) => b.days - a.days);

  if (!staleItems.length) { el.style.display = 'none'; return; }

  const shown = staleItems.slice(0, 5);
  const more = staleItems.length - shown.length;
  const tierLabel = d => d >= 90 ? '🔴 90+d' : d >= 60 ? '🟠 60+d' : d >= 30 ? '🟡 30+d' : '⚪ 14+d';

  el.style.display = '';
  el.innerHTML = `<div class="price-alerts-wrap">
    <div class="price-alerts-hdr">
      <div class="price-alerts-title">📉 Price Drop Suggestions <span style="font-family:'DM Mono',monospace;font-weight:400;font-size:10px;opacity:0.7">${staleItems.length} item${staleItems.length > 1 ? 's' : ''} not moving</span></div>
      <button class="price-alerts-dismiss" onclick="document.getElementById('priceAlerts').style.display='none'">Dismiss</button>
    </div>
    ${shown.map(s => `<div class="price-alert-item">
      <div class="price-alert-info">
        <div class="price-alert-name" onclick="openDrawer('${s.item.id}')">${escHtml(s.item.name)}</div>
        <div class="price-alert-meta">${tierLabel(s.days)} · listed ${s.days}d · ${fmt(s.item.price)} current</div>
      </div>
      <div class="price-alert-action">
        <div class="price-alert-suggest">${fmt(s.suggested)}</div>
        <button class="price-alert-btn" onclick="quickReprice('${s.item.id}',${s.suggested})">Apply ${Math.round(s.dropPct*100)}% off</button>
      </div>
    </div>`).join('')}
    ${more > 0 ? `<div style="font-size:10px;color:var(--muted);margin-top:6px;font-family:'DM Mono',monospace">+ ${more} more stale items — check Insights for full list</div>` : ''}
  </div>`;
}

export function quickReprice(itemId, newPrice) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return;
  const oldPrice = item.price;
  item.price = newPrice;
  save();
  refresh();
  toast(`${item.name} repriced: ${fmt(oldPrice)} → ${fmt(newPrice)} ✓`);
}

export function renderDash() {
  renderPriceAlerts();
  renderDeathPile();
  const items=[...inv].sort((a,b)=>new Date(b.added)-new Date(a.added)).slice(0,6);
  const tbody=document.getElementById('dashBody');
  if(!items.length){tbody.innerHTML='<tr><td colspan="4" style="padding:20px;color:var(--muted);font-size:12px;text-align:center">No items yet.</td></tr>';return;}
  tbody.innerHTML=items.map(item=>{
    const {m}=calc(item);const c=sc(item.qty,item.lowAlert,item.bulk);
    return `<tr onclick="openDrawer('${item.id}')" style="cursor:pointer">
      <td><div class="item-name">${escHtml(item.name)}</div><div class="item-meta"><span class="item-sku">${escHtml(item.sku||'—')}</span>${item.upc?`<span class="upc-tag">${escHtml(item.upc)}</span>`:''}${item.category?`<span class="cat-tag">${escHtml(item.category)}</span>`:''} ${item.subcategory?`<span class="cat-tag" style="background:rgba(87,200,255,0.1);color:var(--accent)">${escHtml(item.subcategory)}</span>`:''} ${item.subtype?`<span class="cat-tag" style="background:rgba(123,97,255,0.15);color:var(--accent3)">${escHtml(item.subtype)}</span>`:''}</div></td>
      <td>${renderPlatTags(item)}</td>
      <td><span style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:${mkc(c)}">${item.qty||0}</span></td>
      <td><span class="margin-badge ${margCls(m)}">${pct(m)}</span></td>
    </tr>`;
  }).join('');
}
