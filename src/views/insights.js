import { inv, sales, expenses, getInvItem } from '../data/store.js';
import { fmt, pct, ds, escHtml } from '../utils/format.js';
import { getPlatforms } from '../features/platforms.js';

// TODO: Import these cache variables from a shared state module
let _cacheDirty = true;
let _insightsCache = null;

// ── INSIGHTS ──────────────────────────────────────────────────────────────────

export function renderInsights() {
  const el = document.getElementById('insightsContent');
  if (!el) return;
  // Use cached HTML if data hasn't changed
  if (!_cacheDirty && _insightsCache) { el.innerHTML = _insightsCache; return; }

  if (!sales.length && !inv.length) {
    el.innerHTML = `<div class="panel" style="animation:none"><div class="empty-state"><div class="empty-icon">🔍</div><p>No data yet.<br>Add inventory and record some sales to see insights.</p></div></div>`;
    return;
  }

  const now    = new Date();
  const msDay  = 86400000;
  const day30  = new Date(now - 30 * msDay);
  const day60  = new Date(now - 60 * msDay);
  const day90  = new Date(now - 90 * msDay);

  // ── Per-item stats ────────────────────────────────────────────────────────
  const itemStats = inv.map(item => {
    const itemSales = sales.filter(s => s.itemId === item.id);
    const revenue   = itemSales.reduce((a,s) => a + (s.price||0)*(s.qty||0), 0);
    const unitsSold = itemSales.reduce((a,s) => a + (s.qty||0), 0);
    const profit    = itemSales.reduce((a,s) => a + (s.price||0)*(s.qty||0) - (item.cost||0)*(s.qty||0) - (s.fees||0) - (s.ship||0), 0);
    const lastSale  = itemSales.length ? new Date(Math.max(...itemSales.map(s=>new Date(s.date)))) : null;
    const daysSinceSale = lastSale ? Math.floor((now - lastSale) / msDay) : null;
    const addedDate = new Date(item.added || now);
    const daysListed = Math.floor((now - addedDate) / msDay);
    const margin    = revenue > 0 ? profit / revenue : 0;
    const roi       = item.cost > 0 ? profit / (item.cost * (unitsSold || 1)) : 0;
    const recentSales30 = itemSales.filter(s => new Date(s.date) >= day30);
    return { item, itemSales, revenue, unitsSold, profit, lastSale, daysSinceSale, daysListed, margin, roi, recentSales30 };
  });

  // ── Category stats ────────────────────────────────────────────────────────
  const catMap = {};
  const catDisplayNames = {}; // Track canonical display name per lowercase key
  for (const { item, revenue, profit, unitsSold } of itemStats) {
    const rawCat = item.category || 'Uncategorized';
    const key = rawCat.toLowerCase();
    if (!catDisplayNames[key]) catDisplayNames[key] = rawCat;
    const cat = catDisplayNames[key];
    if (!catMap[cat]) catMap[cat] = { revenue:0, profit:0, units:0, items:0 };
    catMap[cat].revenue += revenue;
    catMap[cat].profit  += profit;
    catMap[cat].units   += unitsSold;
    catMap[cat].items++;
  }
  const topCats = Object.entries(catMap).sort((a,b)=>b[1].profit-a[1].profit).slice(0,5);

  // ── Platform stats ────────────────────────────────────────────────────────
  const platMap = {};
  for (const s of sales) {
    const _it = getInvItem(s.itemId);
    const p = s.platform || (_it ? (_it.platform||'Other') : 'Other');
    if (!platMap[p]) platMap[p] = { revenue:0, units:0, count:0 };
    platMap[p].revenue += (s.price||0)*(s.qty||0);
    platMap[p].units   += (s.qty||0);
    platMap[p].count++;
  }
  const topPlats = Object.entries(platMap).sort((a,b)=>b[1].revenue-a[1].revenue).slice(0,6);

  // ── Velocity & age analysis ───────────────────────────────────────────────
  const sellers   = itemStats.filter(s=>s.unitsSold>0).sort((a,b)=>b.unitsSold-a.unitsSold);
  const nonsellers = itemStats.filter(s=>s.unitsSold===0&&s.daysListed>=14).sort((a,b)=>b.daysListed-a.daysListed);
  const topProfit = [...itemStats].filter(s=>s.profit>0).sort((a,b)=>b.profit-a.profit).slice(0,5);
  const topROI    = [...itemStats].filter(s=>s.roi>0&&s.unitsSold>0).sort((a,b)=>b.roi-a.roi).slice(0,5);
  const stale     = nonsellers.filter(s=>s.daysListed>=30).slice(0,5);
  const recentHot = itemStats.filter(s=>s.recentSales30.length>0).sort((a,b)=>b.recentSales30.length-a.recentSales30.length).slice(0,5);

  // ── Expense stats ─────────────────────────────────────────────────────────
  const totalExp     = expenses.reduce((a,e)=>a+(e.amount||0),0);
  const totalRevenue = sales.reduce((a,s)=>a+(s.price||0)*(s.qty||0),0);
  const totalProfit  = sellers.reduce((a,s)=>a+s.profit,0) - totalExp;
  const expByCat     = {};
  for (const e of expenses) {
    expByCat[e.category] = (expByCat[e.category]||0) + (e.amount||0);
  }
  const topExpCats = Object.entries(expByCat).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const exp30 = expenses.filter(e=>new Date(e.date)>=day30).reduce((a,e)=>a+(e.amount||0),0);
  const rev30 = sales.filter(s=>new Date(s.date)>=day30).reduce((a,s)=>a+(s.price||0)*(s.qty||0),0);

  // ── Helper renderers ──────────────────────────────────────────────────────
  const bar = (val, max, color='var(--accent)') => {
    const w = max > 0 ? Math.round((val/max)*100) : 0;
    return `<div style="height:6px;background:var(--surface3);border-radius:3px;margin-top:5px"><div style="height:6px;width:${w}%;background:${color};border-radius:3px;transition:width 0.4s"></div></div>`;
  };
  const tag = (txt, color='var(--accent)') =>
    `<span style="font-size:9px;padding:2px 7px;background:${color}20;color:${color};font-family:'DM Mono',monospace;border:1px solid ${color}40">${txt}</span>`;

  const getAgingClass = (days) => {
    if (days <= 30) return 'var(--good)';
    if (days <= 60) return 'var(--warn)';
    if (days <= 90) return 'var(--accent2)';
    return 'var(--danger)';
  };

  const insightCard = (icon, title, body, accent='var(--accent)') => `
    <div style="background:var(--surface2);border:1px solid var(--border);padding:16px 18px;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;border-bottom:1px solid var(--border);padding-bottom:8px">
        <span style="font-size:16px">${icon}</span>
        <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:${accent}">${title}</span>
      </div>
      ${body}
    </div>`;

  const itemRow = (stat, showMetric) => {
    const i = stat.item;
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
      <div style="min-width:0;flex:1">
        <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer" onclick="openDrawer('${i.id}')">${i.name}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:1px">${i.category||'—'}${i.subcategory?' · '+i.subcategory:''}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;margin-left:12px">${showMetric(stat)}</div>
    </div>`;
  };

  // ── Summary KPIs ──────────────────────────────────────────────────────────
  const totalSalesCount = sales.reduce((a,s)=>a+(s.qty||0),0);
  const avgMargin = sellers.length ? sellers.reduce((a,s)=>a+s.margin,0)/sellers.length : 0;

  // ── Sell-Through Rate calc (needed for KPIs) ─────────────────────────────
  const totalUnitsAdded = inv.reduce((a, i) => {
    const iSales = sales.filter(s => s.itemId === i.id);
    const sold = iSales.reduce((t, s) => t + (s.qty || 0), 0);
    return a + (i.qty || 0) + sold;
  }, 0);
  const totalUnitsSold  = sales.reduce((a, s) => a + (s.qty || 0), 0);
  const sellThrough     = totalUnitsAdded > 0 ? totalUnitsSold / totalUnitsAdded : 0;
  const stColor = r => r >= 0.5 ? 'var(--good)' : r >= 0.25 ? 'var(--warn)' : 'var(--danger)';

  const kpis = `
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px">
      ${[
        ['Total Revenue', fmt(totalRevenue), 'var(--accent)'],
        ['Net Profit', fmt(totalProfit), totalProfit>=0?'var(--good)':'var(--danger)'],
        ['Units Sold', totalSalesCount, 'var(--accent3)'],
        ['Avg Margin', pct(avgMargin), avgMargin>=0.2?'var(--good)':'var(--warn)'],
        ['Sell-Through', totalUnitsAdded > 0 ? (sellThrough * 100).toFixed(0) + '%' : '—', stColor(sellThrough)],
      ].map(([lbl,val,col])=>`
        <div style="background:var(--surface2);border:1px solid var(--border);padding:12px 14px">
          <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">${lbl}</div>
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:${col}">${val}</div>
        </div>`).join('')}
    </div>`;

  // ── Section: What's hot right now ─────────────────────────────────────────
  const hotSection = recentHot.length ? insightCard('🔥', 'Hot Right Now — 30 days',
    recentHot.map(s => itemRow(s, s => `
      <div style="font-size:11px;font-family:'DM Mono',monospace;color:var(--accent);font-weight:700">${s.recentSales30.length} sale${s.recentSales30.length>1?'s':''}</div>
      <div style="font-size:10px;color:var(--muted)">${fmt(s.revenue)} rev</div>`)).join(''),
    'var(--accent)'
  ) : '';

  // ── Section: Best Sellers (all-time) ──────────────────────────────────────
  const bestSellers = [...itemStats].filter(s => s.unitsSold > 0).sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 8);
  const maxSold = bestSellers[0]?.unitsSold || 1;
  const bestSellerSection = bestSellers.length ? insightCard('🏆', 'Best Sellers — All Time',
    bestSellers.map((s, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `<span style="font-size:10px;color:var(--muted)">#${i+1}</span>`;
      const velocity = s.daysListed > 0 ? (s.unitsSold / s.daysListed * 30).toFixed(1) : '—';
      return `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
        <span style="width:22px;text-align:center;flex-shrink:0">${medal}</span>
        <div style="min-width:0;flex:1">
          <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer" onclick="openDrawer('${s.item.id}')">${s.item.name}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:1px">${s.item.category || '—'} · ~${velocity}/mo velocity</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:13px;font-family:'Syne',sans-serif;font-weight:700;color:var(--accent)">${s.unitsSold} sold</div>
          <div style="font-size:10px;color:var(--muted)">${fmt(s.revenue)} rev</div>
        </div>
      </div>` + bar(s.unitsSold, maxSold);
    }).join(''),
    'var(--accent)'
  ) : '';

  // ── Section: Top profit generators ───────────────────────────────────────
  const profitSection = topProfit.length ? insightCard('💰', 'Top Profit Generators',
    topProfit.map((s,i) => itemRow(s, s => `
      <div style="font-size:12px;font-family:'DM Mono',monospace;color:var(--good);font-weight:700">${fmt(s.profit)}</div>
      <div style="font-size:10px;color:var(--muted)">${pct(s.margin)} margin</div>`)).join('') +
    (topProfit[0] ? bar(topProfit[0].profit, topProfit[0].profit, 'var(--good)') : ''),
    'var(--good)'
  ) : '';

  // ── Section: Best ROI ─────────────────────────────────────────────────────
  const roiSection = topROI.length ? insightCard('📈', 'Best Return on Investment',
    topROI.map(s => itemRow(s, s => `
      <div style="font-size:12px;font-family:'DM Mono',monospace;color:var(--accent3);font-weight:700">${pct(s.roi)} ROI</div>
      <div style="font-size:10px;color:var(--muted)">cost ${fmt(s.item.cost)}</div>`)).join(''),
    'var(--accent3)'
  ) : '';

  // ── Section: ROI Breakdown by Category/Source/Platform ──────────────────
  // Build srcMap early (needed by both ROI Breakdown and Source Performance)
  const srcMap = {};
  for (const { item, revenue, profit, unitsSold } of itemStats) {
    const src = item.source || 'Unknown';
    if (!srcMap[src]) srcMap[src] = { revenue: 0, profit: 0, units: 0, items: 0, cost: 0 };
    srcMap[src].revenue += revenue;
    srcMap[src].profit += profit;
    srcMap[src].units += unitsSold;
    srcMap[src].items++;
    srcMap[src].cost += (item.cost || 0) * (item.qty || 1);
  }

  // Category ROI
  const catROI = Object.entries(catMap).map(([cat, d]) => {
    const catCost = inv.filter(i => (i.category || 'Uncategorized') === cat)
      .reduce((a, i) => a + (i.cost || 0) * ((i.qty || 0) + sales.filter(s => s.itemId === i.id).reduce((t, s) => t + (s.qty || 0), 0)), 0);
    const roi = catCost > 0 ? d.profit / catCost : 0;
    return { name: cat, profit: d.profit, cost: catCost, roi, units: d.units };
  }).filter(r => r.units > 0).sort((a, b) => b.roi - a.roi).slice(0, 5);

  // Source ROI
  const srcROI = Object.entries(srcMap).filter(([s]) => s !== 'Unknown').map(([src, d]) => {
    const roi = d.cost > 0 ? d.profit / d.cost : 0;
    return { name: src, profit: d.profit, cost: d.cost, roi, units: d.units };
  }).filter(r => r.units > 0).sort((a, b) => b.roi - a.roi).slice(0, 5);

  // Platform ROI
  const platROI = Object.entries(platMap).map(([plat, d]) => {
    const platCost = sales.filter(s => {
      const it = inv.find(i => i.id === s.itemId);
      return (s.platform || (it ? it.platform || 'Other' : 'Other')) === plat;
    }).reduce((a, s) => {
      const it = inv.find(i => i.id === s.itemId);
      return a + (it ? (it.cost || 0) * (s.qty || 0) : 0);
    }, 0);
    const platProfit = d.revenue - platCost;
    const roi = platCost > 0 ? platProfit / platCost : 0;
    return { name: plat, profit: platProfit, cost: platCost, roi, units: d.units };
  }).filter(r => r.units > 0).sort((a, b) => b.roi - a.roi).slice(0, 5);

  const roiRow = (items, label) => {
    if (!items.length) return '';
    const maxROI = Math.max(...items.map(r => Math.abs(r.roi)), 0.01);
    return `<div style="margin-bottom:14px">
      <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">${label}</div>
      ${items.map(r => `<div style="padding:4px 0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:11px">${escHtml(r.name)}</span>
          <span style="font-size:12px;font-family:'DM Mono',monospace;font-weight:700;color:${r.roi >= 0 ? 'var(--accent3)' : 'var(--danger)'}">${pct(r.roi)}</span>
        </div>
        <div style="font-size:9px;color:var(--muted);margin-top:1px">${fmt(r.profit)} profit on ${fmt(r.cost)} invested · ${r.units} unit${r.units !== 1 ? 's' : ''}</div>
        ${bar(Math.abs(r.roi), maxROI, r.roi >= 0 ? 'var(--accent3)' : 'var(--danger)')}
      </div>`).join('')}
    </div>`;
  };

  const roiBreakdownContent = roiRow(catROI, 'By Category') + roiRow(srcROI, 'By Source') + roiRow(platROI, 'By Platform');
  const roiBreakdownSection = roiBreakdownContent.trim() ? insightCard('🔬', 'ROI Breakdown',
    roiBreakdownContent,
    'var(--accent3)'
  ) : '';

  // ── Section: Not moving ───────────────────────────────────────────────────
  // ── Section: Sell-Through Rate ─────────────────────────────────────────────

  // 30/60/90 day sell-through
  const stRates = [30, 60, 90].map(days => {
    const cutoff = new Date(now - days * msDay);
    // Items added in that window
    const addedInWindow = inv.filter(i => new Date(i.added || now) >= cutoff);
    const unitsAddedW = addedInWindow.reduce((a, i) => {
      const iSales = sales.filter(s => s.itemId === i.id);
      const sold = iSales.reduce((t, s) => t + (s.qty || 0), 0);
      return a + (i.qty || 0) + sold;
    }, 0);
    const soldInWindow = sales.filter(s => {
      const it = inv.find(i => i.id === s.itemId);
      return it && new Date(it.added || now) >= cutoff;
    }).reduce((a, s) => a + (s.qty || 0), 0);
    const rate = unitsAddedW > 0 ? soldInWindow / unitsAddedW : 0;
    return { days, rate, sold: soldInWindow, added: unitsAddedW };
  });

  const stAdvice = sellThrough >= 0.5 ? 'Excellent sell-through — your sourcing is well-calibrated'
    : sellThrough >= 0.3 ? 'Solid rate — look for ways to move stale items faster'
    : sellThrough >= 0.15 ? 'Below average — consider reducing new sourcing until existing stock moves'
    : 'Low sell-through — focus on clearing current inventory before buying more';

  const sellThroughSection = totalUnitsAdded > 0 ? insightCard('📊', 'Sell-Through Rate',
    `<div style="display:flex;gap:12px;margin-bottom:14px">
      <div style="flex:1;background:var(--surface);border:1px solid var(--border);padding:12px;text-align:center">
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:28px;color:${stColor(sellThrough)}">${(sellThrough * 100).toFixed(1)}%</div>
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:4px">All Time</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">${totalUnitsSold} of ${totalUnitsAdded} units</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
      ${stRates.map(r => `<div style="background:var(--surface);border:1px solid var(--border);padding:10px;text-align:center">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:${stColor(r.rate)}">${(r.rate * 100).toFixed(0)}%</div>
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-top:2px">${r.days}d cohort</div>
        <div style="font-size:9px;color:var(--muted)">${r.sold}/${r.added}</div>
      </div>`).join('')}
    </div>
    <div style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">💡 ${stAdvice}</div>`,
    stColor(sellThrough)
  ) : '';

  // ── Section: Inventory Aging & Death Pile ───────────────────────────────
  const aging = { fresh: 0, moderate: 0, stale: 0, deadPile: 0 };
  const deathPile = [];
  for (const s of itemStats) {
    if (s.item.qty <= 0) continue; // skip sold-out items
    if (s.daysListed <= 30) aging.fresh++;
    else if (s.daysListed <= 60) aging.moderate++;
    else if (s.daysListed <= 90) aging.stale++;
    else aging.deadPile++;

    // Death pile: listed 60+ days, still in stock, no recent sales
    if (s.daysListed > 60 && s.item.qty > 0 && s.recentSales30.length === 0) {
      deathPile.push(s);
    }
  }
  deathPile.sort((a, b) => b.daysListed - a.daysListed);

  const agingTableRows = deathPile.map(s => {
    const suggestedPrice = (s.item.price || 0) * 0.8;
    const action = s.recentSales30.length === 0 ? 'Lower price by 20%' : 'Relist on new platform';
    return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04)">
      <td style="padding:8px 10px"><div class="item-name" style="cursor:pointer;font-weight:600" onclick="openDrawer('${s.item.id}')">${escHtml(s.item.name)}</div></td>
      <td style="padding:8px 10px;font-family:'DM Mono',monospace;font-weight:600;color:${getAgingClass(s.daysListed)}">${s.daysListed}d</td>
      <td style="padding:8px 10px;text-align:right;font-family:'DM Mono',monospace">${fmt(s.item.price)}</td>
      <td style="padding:8px 10px;text-align:right;font-family:'DM Mono',monospace;color:var(--good)">${fmt(suggestedPrice)}</td>
      <td style="padding:8px 10px;font-size:10px;color:var(--muted)">${s.item.platform || 'Other'}</td>
      <td style="padding:8px 10px;font-size:10px;color:var(--warn)">${action}</td>
    </tr>`;
  }).join('');

  const agingSectionContent = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">
      <div style="background:var(--surface);border:1px solid var(--border);padding:12px;text-align:center">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Fresh (0–30d)</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--good)">${aging.fresh}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);padding:12px;text-align:center">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Moderate (31–60d)</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--warn)">${aging.moderate}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);padding:12px;text-align:center">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Stale (61–90d)</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--accent2)">${aging.stale}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);padding:12px;text-align:center">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Dead (90+d)</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--danger)">${aging.deadPile}</div>
      </div>
    </div>
    ${deathPile.length ? `
    <div style="margin-top:12px">
      <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;font-weight:600">Death Pile Alert — ${deathPile.length} item${deathPile.length !== 1 ? 's' : ''}</div>
      <div style="overflow-x:auto">
        <table style="width:100%;font-size:11px;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
              <th style="text-align:left;padding:8px 10px;color:var(--muted);font-weight:600">Item</th>
              <th style="text-align:left;padding:8px 10px;color:var(--muted);font-weight:600">Days</th>
              <th style="text-align:right;padding:8px 10px;color:var(--muted);font-weight:600">Current</th>
              <th style="text-align:right;padding:8px 10px;color:var(--muted);font-weight:600">Suggested</th>
              <th style="text-align:left;padding:8px 10px;color:var(--muted);font-weight:600">Platform</th>
              <th style="text-align:left;padding:8px 10px;color:var(--muted);font-weight:600">Action</th>
            </tr>
          </thead>
          <tbody>${agingTableRows}</tbody>
        </table>
      </div>
    </div>
    ` : '<div style="font-size:10px;color:var(--good);margin-top:10px">🎉 No items in death pile — great inventory health!</div>'}
  `;

  const agingSection = (aging.fresh || aging.moderate || aging.stale || aging.deadPile) ? insightCard('📅', 'Aging & Death Pile',
    agingSectionContent,
    'var(--warn)'
  ) : '';

  const staleSection = stale.length ? insightCard('🕸️', 'Not Moving — Consider Repricing',
    stale.map(s => itemRow(s, s => `
      <div style="font-size:11px;font-family:'DM Mono',monospace;color:var(--warn);font-weight:700">${s.daysListed}d listed</div>
      <div style="font-size:10px;color:var(--muted)">0 sold · ${fmt(s.item.price)} list</div>`)).join('') +
    `<div style="margin-top:10px;font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">💡 Try lowering the price by 10–20% or listing on an additional platform</div>`,
    'var(--warn)'
  ) : '';

  // ── Section: Category breakdown ───────────────────────────────────────────
  const maxCatProfit = topCats[0]?.[1]?.profit || 1;
  const catSection = topCats.length ? insightCard('🗂️', 'Top Categories by Profit',
    topCats.map(([cat, d]) => `
      <div style="padding:6px 0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:12px;font-weight:600">${cat}</span>
          <span style="font-size:12px;font-family:'DM Mono',monospace;color:var(--good);font-weight:700">${fmt(d.profit)}</span>
        </div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">${d.units} unit${d.units!==1?'s':''} sold · ${fmt(d.revenue)} revenue · ${d.items} item${d.items!==1?'s':''}</div>
        ${bar(d.profit, maxCatProfit, 'var(--good)')}
      </div>`).join('')
  ) : '';

  // ── Section: Platform performance ─────────────────────────────────────────
  const maxPlatRev = topPlats[0]?.[1]?.revenue || 1;
  const platSection = topPlats.length ? insightCard('🏪', 'Platform Performance',
    topPlats.map(([plat, d]) => `
      <div style="padding:5px 0">
        <div style="display:flex;justify-content:space-between">
          <span style="font-size:12px;font-weight:600">${plat}</span>
          <span style="font-size:12px;font-family:'DM Mono',monospace;color:var(--accent)">${fmt(d.revenue)}</span>
        </div>
        <div style="font-size:10px;color:var(--muted);margin-top:1px">${d.count} sale${d.count!==1?'s':''} · ${d.units} unit${d.units!==1?'s':''}</div>
        ${bar(d.revenue, maxPlatRev)}
      </div>`).join('')
  ) : '';

  // ── Section: Source Performance ────────────────────────────────────────────
  // srcMap already built above (ROI Breakdown section)
  const topSources = Object.entries(srcMap).filter(([s]) => s !== 'Unknown').sort((a, b) => b[1].profit - a[1].profit).slice(0, 6);
  const maxSrcProfit = topSources[0]?.[1]?.profit || 1;
  const sourceSection = topSources.length ? insightCard('📍', 'Source Performance',
    topSources.map(([src, d]) => {
      const roi = d.cost > 0 ? d.profit / d.cost : 0;
      return `<div style="padding:6px 0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:12px;font-weight:600">${escHtml(src)}</span>
          <span style="font-size:12px;font-family:'DM Mono',monospace;color:var(--good);font-weight:700">${fmt(d.profit)}</span>
        </div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">${d.units} sold · ${d.items} item${d.items !== 1 ? 's' : ''} · ${fmt(d.revenue)} rev · ${pct(roi)} ROI</div>
        ${bar(Math.max(d.profit, 0), maxSrcProfit, d.profit >= 0 ? 'var(--good)' : 'var(--danger)')}
      </div>`;
    }).join(''),
    'var(--accent2)'
  ) : '';

  // ── Section: Expense health ───────────────────────────────────────────────
  const expRatio = totalRevenue > 0 ? totalExp / totalRevenue : 0;
  const expHealth = expRatio < 0.1 ? ['✅','Low','var(--good)'] : expRatio < 0.25 ? ['⚠️','Moderate','var(--warn)'] : ['🔴','High','var(--danger)'];
  const maxExpCat = topExpCats[0]?.[1] || 1;
  const expSection = expenses.length ? insightCard('🧾', 'Expense Health',
    `<div style="display:flex;gap:12px;margin-bottom:12px">
      <div style="flex:1;background:var(--surface);border:1px solid var(--border);padding:10px">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Expense Ratio</div>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:${expHealth[2]}">${pct(expRatio)}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">of revenue · ${expHealth[0]} ${expHealth[1]}</div>
      </div>
      <div style="flex:1;background:var(--surface);border:1px solid var(--border);padding:10px">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Last 30 Days</div>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:var(--danger)">${fmt(exp30)}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">vs ${fmt(rev30)} revenue</div>
      </div>
    </div>` +
    topExpCats.map(([cat,amt])=>`
      <div style="padding:5px 0">
        <div style="display:flex;justify-content:space-between">
          <span style="font-size:12px">${cat}</span>
          <span style="font-size:12px;font-family:'DM Mono',monospace;color:var(--danger)">${fmt(amt)}</span>
        </div>
        ${bar(amt, maxExpCat, 'var(--danger)')}
      </div>`).join(''),
    'var(--danger)'
  ) : '';

  // ── Section: Stale inventory value ───────────────────────────────────────
  const staleValue = nonsellers.filter(s=>s.daysListed>=30).reduce((a,s)=>a+(s.item.cost||0)*(s.item.qty||1),0);
  const staleCount = nonsellers.filter(s=>s.daysListed>=30).length;
  const capitalSection = staleCount > 0 ? insightCard('🔒', 'Tied-Up Capital',
    `<div style="margin-bottom:10px">
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:var(--warn)">${fmt(staleValue)}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px">cost basis sitting in ${staleCount} item${staleCount>1?'s':''} with no sales after 30+ days</div>
    </div>
    <div style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">💡 Freeing this capital could fund ${Math.floor(staleValue / Math.max(inv.reduce((a,i)=>a+(i.cost||0),0)/inv.length,1))} new average-cost items</div>`,
    'var(--warn)'
  ) : '';

  // ── Section: Pricing Accuracy ─────────────────────────────────────────────
  const salesWithList = sales.filter(s => {
    const lp = s.listPrice || (getInvItem(s.itemId)?.price || 0);
    return lp > 0;
  });
  let accAbove = 0, accAt = 0, accBelow = 0, totalDiff = 0;
  for (const s of salesWithList) {
    const lp = s.listPrice || (getInvItem(s.itemId)?.price || 0);
    const diff = (s.price - lp) / lp;
    totalDiff += diff;
    if (diff > 0.01) accAbove++;
    else if (diff < -0.01) accBelow++;
    else accAt++;
  }
  const avgDiff = salesWithList.length ? totalDiff / salesWithList.length : 0;
  const accColor = avgDiff >= 0 ? 'var(--good)' : avgDiff > -0.1 ? 'var(--warn)' : 'var(--danger)';
  const pricingSection = salesWithList.length >= 3 ? insightCard('🎯', 'Pricing Accuracy',
    `<div style="display:flex;gap:10px;margin-bottom:12px">
      <div style="flex:1;background:var(--surface);border:1px solid var(--border);padding:10px;text-align:center">
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:${accColor}">${avgDiff >= 0 ? '+' : ''}${pct(avgDiff)}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">avg vs list price</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:10px">
      <div style="flex:1;text-align:center;padding:8px;background:rgba(87,255,154,0.06);border:1px solid rgba(87,255,154,0.15)">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--good)">${accAbove}</div>
        <div style="font-size:9px;color:var(--muted);margin-top:2px">ABOVE LIST</div>
      </div>
      <div style="flex:1;text-align:center;padding:8px;background:rgba(87,200,255,0.06);border:1px solid rgba(87,200,255,0.15)">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--accent)">${accAt}</div>
        <div style="font-size:9px;color:var(--muted);margin-top:2px">AT LIST</div>
      </div>
      <div style="flex:1;text-align:center;padding:8px;background:rgba(255,71,87,0.06);border:1px solid rgba(255,71,87,0.15)">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--danger)">${accBelow}</div>
        <div style="font-size:9px;color:var(--muted);margin-top:2px">BELOW LIST</div>
      </div>
    </div>
    <div style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">💡 ${accBelow > accAbove ? 'You often sell below listing — try starting higher or negotiating less' : accAbove > accBelow ? 'Great job — you consistently meet or exceed your asking price' : 'Your pricing is well calibrated to market expectations'}</div>`,
    accColor
  ) : '';

  // ── Section: Inventory-Only Cards (useful before any sales) ──────────────

  // Inventory Age Distribution
  const ageBuckets = { '< 7 days': 0, '1-2 weeks': 0, '2-4 weeks': 0, '1-2 months': 0, '2-3 months': 0, '3+ months': 0 };
  const ageBucketCost = { '< 7 days': 0, '1-2 weeks': 0, '2-4 weeks': 0, '1-2 months': 0, '2-3 months': 0, '3+ months': 0 };
  for (const item of inv) {
    const q = item.qty != null ? item.qty : 1;
    if (q <= 0) continue;
    const days = item.added ? Math.floor((now - new Date(item.added)) / msDay) : 0;
    const bucket = days < 7 ? '< 7 days' : days < 14 ? '1-2 weeks' : days < 30 ? '2-4 weeks' : days < 60 ? '1-2 months' : days < 90 ? '2-3 months' : '3+ months';
    ageBuckets[bucket] += (q || 1);
    ageBucketCost[bucket] += (item.cost || 0) * (q || 1);
  }
  const maxAgeBucket = Math.max(...Object.values(ageBuckets), 1);
  const ageColors = { '< 7 days': 'var(--good)', '1-2 weeks': 'var(--good)', '2-4 weeks': 'var(--accent)', '1-2 months': 'var(--warn)', '2-3 months': 'var(--accent2)', '3+ months': 'var(--danger)' };
  const inStockCount = inv.filter(i => (i.qty != null ? i.qty : 1) > 0).length;

  const ageSection = inStockCount >= 1 ? insightCard('📅', 'Inventory Age Distribution',
    `<div style="font-size:10px;color:var(--muted);margin-bottom:10px">${inStockCount} items in stock</div>` +
    Object.entries(ageBuckets).filter(([, v]) => v > 0).map(([label, count]) => `<div style="padding:4px 0">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:11px">${label}</span>
        <span style="font-size:11px;font-family:'DM Mono',monospace"><span style="font-weight:700">${count}</span> units · ${fmt(ageBucketCost[label])}</span>
      </div>
      ${bar(count, maxAgeBucket, ageColors[label])}
    </div>`).join(''),
    'var(--accent)'
  ) : '';

  // Cost Invested by Category
  const invCatMap = {};
  for (const item of inv) {
    const q = item.qty != null ? item.qty : 1;
    if (q <= 0) continue;
    const cat = item.category || 'Uncategorized';
    if (!invCatMap[cat]) invCatMap[cat] = { cost: 0, retail: 0, units: 0, items: 0 };
    invCatMap[cat].cost += (item.cost || 0) * (q || 1);
    invCatMap[cat].retail += (item.price || 0) * (q || 1);
    invCatMap[cat].units += (q || 1);
    invCatMap[cat].items++;
  }
  const topInvCats = Object.entries(invCatMap).sort((a, b) => b[1].cost - a[1].cost).slice(0, 6);
  const maxInvCatCost = topInvCats[0]?.[1]?.cost || 1;
  const totalInvCost = inv.filter(i => (i.qty != null ? i.qty : 1) > 0).reduce((a, i) => { const q = i.qty != null ? i.qty : 1; return a + (i.cost||0)*q; }, 0);
  const totalInvRetail = inv.filter(i => (i.qty != null ? i.qty : 1) > 0).reduce((a, i) => { const q = i.qty != null ? i.qty : 1; return a + (i.price||0)*q; }, 0);
  const potentialProfit = totalInvRetail - totalInvCost;

  const invCostSection = topInvCats.length >= 1 ? insightCard('💵', 'Capital Invested by Category',
    `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
      <div style="background:var(--surface);border:1px solid var(--border);padding:10px;text-align:center">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Invested</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--warn)">${fmt(totalInvCost)}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);padding:10px;text-align:center">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">List Value</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--accent)">${fmt(totalInvRetail)}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);padding:10px;text-align:center">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Potential</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:${potentialProfit >= 0 ? 'var(--good)' : 'var(--danger)'}">${fmt(potentialProfit)}</div>
      </div>
    </div>` +
    topInvCats.map(([cat, d]) => {
      const potROI = d.cost > 0 ? (d.retail - d.cost) / d.cost : 0;
      return `<div style="padding:5px 0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:11px;font-weight:600">${escHtml(cat)}</span>
          <span style="font-size:11px;font-family:'DM Mono',monospace;color:var(--warn);font-weight:700">${fmt(d.cost)}</span>
        </div>
        <div style="font-size:9px;color:var(--muted);margin-top:1px">${d.items} item${d.items!==1?'s':''} · ${d.units} unit${d.units!==1?'s':''} · ${fmt(d.retail)} list · ${pct(potROI)} potential ROI</div>
        ${bar(d.cost, maxInvCatCost, 'var(--warn)')}
      </div>`;
    }).join(''),
    'var(--warn)'
  ) : '';

  // Listing Readiness Checklist
  const readyChecks = {
    noPhoto: inv.filter(i => (i.qty != null ? i.qty : 1) > 0 && (!i.images || !i.images.length)),
    noPrice: inv.filter(i => (i.qty != null ? i.qty : 1) > 0 && !i.price),
    noPlatform: inv.filter(i => {
      if ((i.qty != null ? i.qty : 1) <= 0) return false;
      const p = getPlatforms(i);
      return !p.length || (p.length === 1 && (p[0] === 'Unlisted' || p[0] === 'Other'));
    }),
    noCost: inv.filter(i => (i.qty != null ? i.qty : 1) > 0 && !i.cost),
    noCategory: inv.filter(i => (i.qty != null ? i.qty : 1) > 0 && !i.category),
    noCondition: inv.filter(i => (i.qty != null ? i.qty : 1) > 0 && !i.condition),
  };
  const totalIssues = Object.values(readyChecks).reduce((a, arr) => a + arr.length, 0);

  const checkRow = (icon, label, items, color) => items.length ? `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
    <span style="font-size:14px">${icon}</span>
    <div style="flex:1">
      <div style="font-size:12px;font-weight:600;color:${color}">${items.length} item${items.length!==1?'s':''} ${label}</div>
      <div style="font-size:10px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px">${items.slice(0,3).map(i=>escHtml(i.name)).join(', ')}${items.length>3?'...':''}</div>
    </div>
  </div>` : '';

  const readyContent = checkRow('📷', 'missing photos', readyChecks.noPhoto, 'var(--accent2)') +
    checkRow('💰', 'missing price', readyChecks.noPrice, 'var(--danger)') +
    checkRow('🏪', 'not listed on any platform', readyChecks.noPlatform, 'var(--warn)') +
    checkRow('🧾', 'missing cost (can\'t track profit)', readyChecks.noCost, 'var(--warn)') +
    checkRow('🗂️', 'missing category', readyChecks.noCategory, 'var(--muted)') +
    checkRow('🏷', 'missing condition', readyChecks.noCondition, 'var(--muted)');

  const allComplete = inStockCount > 0 && !totalIssues;
  const readySection = inStockCount > 0 ? insightCard('✅', 'Listing Readiness',
    allComplete
      ? `<div style="text-align:center;padding:12px 0">
          <div style="font-size:28px;margin-bottom:6px">🎉</div>
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--good)">All items fully set up!</div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">Every item has photos, pricing, platforms, and more</div>
        </div>`
      : `<div style="font-size:10px;color:var(--muted);margin-bottom:8px">${totalIssues} thing${totalIssues!==1?'s':''} to fix across ${inStockCount} in-stock items</div>` + readyContent +
        `<div style="margin-top:10px;font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">💡 Complete items sell faster — fill in the gaps to boost your sell-through</div>`,
    allComplete ? 'var(--good)' : 'var(--accent2)'
  ) : '';

  // ── Section: Source Investment (inventory-only, no sales needed) ──────────
  const srcInvMap = {};
  for (const item of inv) {
    const q = item.qty != null ? item.qty : 1;
    if (q <= 0) continue;
    const src = item.source || '';
    if (!src) continue;
    if (!srcInvMap[src]) srcInvMap[src] = { cost: 0, retail: 0, items: 0, units: 0 };
    srcInvMap[src].cost += (item.cost || 0) * (q || 1);
    srcInvMap[src].retail += (item.price || 0) * (q || 1);
    srcInvMap[src].items++;
    srcInvMap[src].units += (q || 1);
  }
  const topSrcInv = Object.entries(srcInvMap).sort((a, b) => b[1].cost - a[1].cost).slice(0, 5);
  const maxSrcInvCost = topSrcInv[0]?.[1]?.cost || 1;

  const srcInvSection = topSrcInv.length >= 1 ? insightCard('🗺️', 'Where Your Money Goes — by Source',
    topSrcInv.map(([src, d]) => {
      const potROI = d.cost > 0 ? (d.retail - d.cost) / d.cost : 0;
      return `<div style="padding:5px 0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:11px;font-weight:600">📍 ${escHtml(src)}</span>
          <span style="font-size:11px;font-family:'DM Mono',monospace;font-weight:700;color:var(--accent2)">${fmt(d.cost)}</span>
        </div>
        <div style="font-size:9px;color:var(--muted);margin-top:1px">${d.items} item${d.items!==1?'s':''} · ${d.units} unit${d.units!==1?'s':''} · ${fmt(d.retail)} list value · ${pct(potROI)} potential ROI</div>
        ${bar(d.cost, maxSrcInvCost, 'var(--accent2)')}
      </div>`;
    }).join(''),
    'var(--accent2)'
  ) : '';

  // ── Assemble ──────────────────────────────────────────────────────────────
  el.innerHTML = `
    <div style="padding:0 0 24px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div>
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px">Insights</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">Based on ${inv.length} items · ${sales.length} sales · ${expenses.length} expenses</div>
        </div>
        <div style="font-size:10px;color:var(--muted);font-family:'DM Mono',monospace">Updated ${new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</div>
      </div>
      ${kpis}
      ${agingSection}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          ${readySection}
          ${hotSection}
          ${bestSellerSection}
          ${profitSection}
          ${capitalSection}
          ${staleSection}
          ${ageSection}
        </div>
        <div>
          ${invCostSection}
          ${roiSection}
          ${roiBreakdownSection}
          ${sellThroughSection}
          ${catSection}
          ${platSection}
          ${sourceSection}
          ${srcInvSection}
          ${pricingSection}
          ${expSection}
        </div>
      </div>
      ${!sellers.length && !stale.length && !inStockCount ? '<div style="text-align:center;color:var(--muted);font-size:13px;padding:40px 0;font-family:\'DM Mono\',monospace">Add some inventory items to start seeing insights ↗</div>' : ''}
    </div>`;
  _insightsCache = el.innerHTML;
}
