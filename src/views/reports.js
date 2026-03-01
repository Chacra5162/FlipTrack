import { inv, sales, expenses, getInvItem, save, refresh, markDirty } from '../data/store.js';
import { fmt, ds, escHtml } from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { pushDeleteToCloud, autoSync, pushToCloud } from '../data/sync.js';
import { setDefaultExpDate } from './expenses.js';

let reportMode   = 'monthly'; // 'weekly' | 'monthly'
let reportOffset = 0;         // 0 = current period, -1 = previous, etc.

const EXP_CAT_CLASS = {
  'Shipping Supplies':'exp-shipping', 'Packaging Materials':'exp-packaging',
  'Platform Fees':'exp-fees', 'Sourcing':'exp-sourcing', 'Storage':'exp-storage',
  'Printing':'exp-printing', 'Software':'exp-software', 'Marketing':'exp-marketing',
  'Returns':'exp-returns', 'Office Supplies':'exp-office', 'Other':'exp-other',
};

export function renderReports() {
  const el = document.getElementById('reportsContent');
  if (!el) return;

  // Compute period bounds
  const { start, end, label, prevLabel } = getPeriodBounds(reportMode, reportOffset);

  // Filter sales and expenses in this period
  const periodSales = sales.filter(s => {
    const d = new Date(s.date);
    return d >= start && d <= end;
  });
  const periodExp = expenses.filter(e => {
    const d = new Date(e.date);
    return d >= start && d <= end;
  });

  // Calc sales metrics
  let revenue = 0, cogs = 0, fees = 0;
  for (const s of periodSales) {
    const it = inv.find(i => i.id === s.itemId);
    revenue += (s.price||0) * (s.qty||0);
    cogs    += it ? (it.cost||0) * (s.qty||0) : 0;
    fees    += (s.fees||0) + (s.ship||0);
  }
  const grossProfit  = revenue - cogs - fees;
  const totalExpenses= periodExp.reduce((a,e) => a+(e.amount||0), 0);
  const netProfit    = grossProfit - totalExpenses;
  const margin       = revenue ? netProfit / revenue : 0;

  // Group expenses by category
  const expByCat = {};
  for (const e of periodExp) {
    expByCat[e.category] = (expByCat[e.category]||0) + e.amount;
  }

  // Build period rows by sub-period (weeks inside month, or days inside week)
  const trendRows = buildTrendRows(reportMode, start, end);

  const summaryCards = `
    <div class="period-summary-grid">
      <div class="period-card">
        <div class="period-card-lbl">Revenue</div>
        <div class="period-card-val" style="color:var(--accent)">${fmt(revenue)}</div>
        <div class="period-card-sub">${periodSales.length} sale${periodSales.length!==1?'s':''}</div>
      </div>
      <div class="period-card">
        <div class="period-card-lbl">COGS + Fees</div>
        <div class="period-card-val" style="color:var(--warn)">${fmt(cogs+fees)}</div>
        <div class="period-card-sub">cost of goods + platform fees</div>
      </div>
      <div class="period-card">
        <div class="period-card-lbl">Gross Profit</div>
        <div class="period-card-val" style="color:${grossProfit>=0?'var(--good)':'var(--danger)'}">${fmt(grossProfit)}</div>
        <div class="period-card-sub">before overhead expenses</div>
      </div>
      <div class="period-card">
        <div class="period-card-lbl">Expenses</div>
        <div class="period-card-val" style="color:var(--danger)">${fmt(totalExpenses)}</div>
        <div class="period-card-sub">${periodExp.length} expense${periodExp.length!==1?'s':''}</div>
      </div>
      <div class="period-card" style="border-color:${netProfit>=0?'var(--good)':'var(--danger)'}">
        <div class="period-card-lbl">Net Profit</div>
        <div class="period-card-val" style="color:${netProfit>=0?'var(--good)':'var(--danger)'},font-size:22px">${fmt(netProfit)}</div>
        <div class="period-card-sub">margin: ${(margin*100).toFixed(1)}%</div>
      </div>
    </div>`;

  // ── Profit by Category ────────────────────────────────────────────────────
  const catProfit = {};
  for (const s of periodSales) {
    const it = inv.find(i => i.id === s.itemId);
    const cat = it ? (it.category || 'Uncategorized') : 'Unknown';
    if (!catProfit[cat]) catProfit[cat] = { revenue: 0, cogs: 0, fees: 0, profit: 0, count: 0 };
    const rev = (s.price || 0) * (s.qty || 0);
    const cost = it ? (it.cost || 0) * (s.qty || 0) : 0;
    const fee = (s.fees || 0) + (s.ship || 0);
    catProfit[cat].revenue += rev;
    catProfit[cat].cogs += cost;
    catProfit[cat].fees += fee;
    catProfit[cat].profit += rev - cost - fee;
    catProfit[cat].count++;
  }

  const catProfitRows = Object.entries(catProfit).sort((a, b) => b[1].profit - a[1].profit).map(([cat, d]) => {
    const margin = d.revenue > 0 ? (d.profit / d.revenue * 100) : 0;
    const marginColor = margin >= 20 ? 'var(--good)' : margin >= 10 ? 'var(--warn)' : 'var(--danger)';
    const profitColor = d.profit >= 0 ? 'var(--good)' : 'var(--danger)';
    return `<tr>
      <td style="font-weight:600">${escHtml(cat)}</td>
      <td style="text-align:center">${d.count}</td>
      <td style="font-family:'DM Mono',monospace;color:var(--accent)">${fmt(d.revenue)}</td>
      <td style="font-family:'DM Mono',monospace;color:var(--muted)">${fmt(d.cogs)}</td>
      <td style="font-family:'DM Mono',monospace;color:var(--danger)">${fmt(d.fees)}</td>
      <td style="font-family:'DM Mono',monospace;font-weight:700;color:${profitColor}">${fmt(d.profit)}</td>
      <td style="font-family:'DM Mono',monospace;font-weight:600;color:${marginColor}">${margin.toFixed(1)}%</td>
    </tr>`;
  }).join('');

  const catProfitHtml = Object.entries(catProfit).length ? `
    <div class="period-section-ttl">Profit by Category</div>
    <div style="overflow-x:auto;margin-bottom:16px">
      <table class="inv-table">
        <thead><tr>
          <th>Category</th><th>Sales</th><th>Revenue</th><th>COGS</th><th>Fees</th><th>Profit</th><th>Margin</th>
        </tr></thead>
        <tbody>${catProfitRows}</tbody>
      </table>
    </div>` : '';

  // ── Profit by Platform ─────────────────────────────────────────────────────
  const platProfit = {};
  for (const s of periodSales) {
    const plat = s.platform || 'Unknown';
    if (!platProfit[plat]) platProfit[plat] = { revenue: 0, cogs: 0, fees: 0, profit: 0, count: 0 };
    const it = inv.find(i => i.id === s.itemId);
    const rev = (s.price || 0) * (s.qty || 0);
    const cost = it ? (it.cost || 0) * (s.qty || 0) : 0;
    const fee = (s.fees || 0) + (s.ship || 0);
    platProfit[plat].revenue += rev;
    platProfit[plat].cogs += cost;
    platProfit[plat].fees += fee;
    platProfit[plat].profit += rev - cost - fee;
    platProfit[plat].count++;
  }

  const platProfitRows = Object.entries(platProfit).sort((a, b) => b[1].profit - a[1].profit).map(([plat, d]) => {
    const margin = d.revenue > 0 ? (d.profit / d.revenue * 100) : 0;
    const marginColor = margin >= 20 ? 'var(--good)' : margin >= 10 ? 'var(--warn)' : 'var(--danger)';
    const profitColor = d.profit >= 0 ? 'var(--good)' : 'var(--danger)';
    return `<tr>
      <td style="font-weight:600">${escHtml(plat)}</td>
      <td style="text-align:center">${d.count}</td>
      <td style="font-family:'DM Mono',monospace;color:var(--accent)">${fmt(d.revenue)}</td>
      <td style="font-family:'DM Mono',monospace;color:var(--muted)">${fmt(d.cogs)}</td>
      <td style="font-family:'DM Mono',monospace;color:var(--danger)">${fmt(d.fees)}</td>
      <td style="font-family:'DM Mono',monospace;font-weight:700;color:${profitColor}">${fmt(d.profit)}</td>
      <td style="font-family:'DM Mono',monospace;font-weight:600;color:${marginColor}">${margin.toFixed(1)}%</td>
    </tr>`;
  }).join('');

  const platProfitHtml = Object.entries(platProfit).length ? `
    <div class="period-section-ttl">Profit by Platform</div>
    <div style="overflow-x:auto;margin-bottom:16px">
      <table class="inv-table">
        <thead><tr>
          <th>Platform</th><th>Sales</th><th>Revenue</th><th>COGS</th><th>Fees</th><th>Profit</th><th>Margin</th>
        </tr></thead>
        <tbody>${platProfitRows}</tbody>
      </table>
    </div>` : '';

  const expCatHtml = Object.entries(expByCat).length ? `
    <div class="period-section-ttl">Expense Breakdown</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-bottom:16px">
      ${Object.entries(expByCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>{
        const cls = EXP_CAT_CLASS[cat]||'exp-other';
        const pct = totalExpenses ? (amt/totalExpenses*100).toFixed(0) : 0;
        return `<div class="period-card" style="flex-direction:row;display:flex;align-items:center;gap:10px;padding:10px 12px">
          <span class="exp-cat-badge ${cls}" style="font-size:8px">${cat}</span>
          <span style="font-family:'DM Mono',monospace;font-weight:700;font-size:13px;margin-left:auto">${fmt(amt)}</span>
          <span style="font-size:9px;color:var(--muted)">${pct}%</span>
        </div>`;
      }).join('')}
    </div>` : '';

  const trendHtml = trendRows.length ? `
    <div class="period-section-ttl">${reportMode==='monthly'?'Week by Week':'Day by Day'}</div>
    <div style="overflow-x:auto;margin-bottom:16px">
      <table class="inv-table">
        <thead><tr>
          <th>${reportMode==='monthly'?'Week':'Day'}</th>
          <th>Sales</th><th>Revenue</th><th>COGS+Fees</th>
          <th>Expenses</th><th>Gross</th><th>Net</th>
        </tr></thead>
        <tbody>${trendRows}</tbody>
      </table>
    </div>` : '';

  const salesHtml = periodSales.length ? `
    <div class="period-section-ttl">Sales This Period (${periodSales.length})</div>
    <div style="overflow-x:auto">
      <table class="inv-table">
        <thead><tr><th>Item</th><th>Date</th><th>Qty</th><th>Price</th><th>Net Profit</th></tr></thead>
        <tbody>${[...periodSales].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(s=>{
          const it=getInvItem(s.itemId);
          const pr=(s.price||0)*(s.qty||0)-(it?(it.cost||0)*(s.qty||0):0)-(s.fees||0)-(s.ship||0);
          return `<tr>
            <td><div class="item-name" style="cursor:${it?'pointer':'default'}" ${it?`onclick="openDrawer('${escHtml(it.id)}')"`:''}>${it?escHtml(it.name):'Deleted Item'}</div></td>
            <td style="color:var(--muted);font-size:11px">${ds(s.date)}</td>
            <td>${s.qty}</td>
            <td>${fmt(s.price)}</td>
            <td style="font-weight:700;color:${pr>=0?'var(--good)':'var(--danger)'}">${fmt(pr)}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>` : `<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px">No sales in this period.</div>`;

  const expListHtml = periodExp.length ? `
    <div class="period-section-ttl" style="margin-top:20px">Expenses This Period (${periodExp.length})</div>
    <div style="overflow-x:auto">
      <table class="inv-table">
        <thead><tr><th>Date</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>${[...periodExp].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(e=>{
          const cls=EXP_CAT_CLASS[e.category]||'exp-other';
          return `<tr>
            <td style="color:var(--muted);font-size:11px">${ds(e.date)}</td>
            <td><span class="exp-cat-badge ${cls}">${e.category}</span></td>
            <td>${escHtml(e.description)}</td>
            <td style="text-align:right;font-family:'DM Mono',monospace;font-weight:600;color:var(--danger)">${fmt(e.amount)}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>` : '';

  el.innerHTML = `
    <div class="panel" style="animation:none">
      <div class="panel-header" style="margin-bottom:0">
        <div class="panel-title">Reports</div>
        <button class="btn-secondary" style="font-size:11px" onclick="goToAddExpense()">+ Add Expense</button>
      </div>

      <!-- Mode tabs -->
      <div class="report-tabs" style="margin-top:14px">
        <button class="report-tab ${reportMode==='weekly'?'active':''}"  onclick="setReportMode('weekly')">Weekly</button>
        <button class="report-tab ${reportMode==='monthly'?'active':''}" onclick="setReportMode('monthly')">Monthly</button>
        <button class="report-tab" id="plTabBtn" onclick="showPLReport()">P&amp;L Statement</button>
      </div>

      <!-- Period nav -->
      <div class="period-nav">
        <button class="period-nav-btn" onclick="shiftPeriod(-1)">← Prev</button>
        <div class="period-label">${label}</div>
        <button class="period-nav-btn" onclick="shiftPeriod(1)" ${reportOffset>=0?'disabled style="opacity:0.3;cursor:default"':''}>Next →</button>
      </div>

      ${summaryCards}
      ${catProfitHtml}
      ${platProfitHtml}
      ${expCatHtml}
      ${trendHtml}
      ${salesHtml}
      ${expListHtml}
    </div>
    <div id="plReportContent" style="display:none"></div>`;
}

export function showPLReport() {
  // Hide regular report content, show P&L
  const panel = document.getElementById('reportsContent').querySelector('.panel');
  if (!panel) return;
  const regularDivs = panel.querySelectorAll('.period-summary-grid, .period-section-ttl, .period-nav, .report-tabs + *');

  // Toggle P&L tab
  const plBtn = document.getElementById('plTabBtn');
  const isActive = plBtn.classList.contains('active');

  if (isActive) {
    // Switch back to regular
    plBtn.classList.remove('active');
    document.getElementById('plReportContent').style.display = 'none';
    setReportMode(reportMode); // re-render regular view
    return;
  }

  // Activate P&L
  document.querySelectorAll('.report-tab').forEach(b => b.classList.remove('active'));
  plBtn.classList.add('active');

  renderPLStatement();
}

export function renderPLStatement() {
  const el = document.getElementById('plReportContent');
  if (!el) return;

  const now = new Date();
  const msDay = 86400000;

  // All-time figures
  let revenue = 0, cogs = 0, totalFees = 0, totalShip = 0;
  for (const s of sales) {
    const it = inv.find(i => i.id === s.itemId);
    revenue   += (s.price || 0) * (s.qty || 0);
    cogs      += it ? (it.cost || 0) * (s.qty || 0) : 0;
    totalFees += (s.fees || 0);
    totalShip += (s.ship || 0);
  }
  const grossProfit = revenue - cogs;
  const totalExpenses = expenses.reduce((a, e) => a + (e.amount || 0), 0);

  // Expense breakdown by category
  const expByCat = {};
  for (const e of expenses) {
    expByCat[e.category || 'Other'] = (expByCat[e.category || 'Other'] || 0) + (e.amount || 0);
  }

  const netProfit = grossProfit - totalFees - totalShip - totalExpenses;
  const netMargin = revenue > 0 ? netProfit / revenue : 0;

  // Unsold inventory value
  const unsoldCost = inv.reduce((a, i) => a + (i.cost || 0) * (i.qty || 0), 0);
  const unsoldRetail = inv.reduce((a, i) => a + (i.price || 0) * (i.qty || 0), 0);

  // Monthly trend (last 6 months)
  const months = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const mSales = sales.filter(s => { const sd = new Date(s.date); return sd >= mStart && sd <= mEnd; });
    const mRev = mSales.reduce((a, s) => a + (s.price || 0) * (s.qty || 0), 0);
    const mCogs = mSales.reduce((a, s) => { const it = inv.find(i => i.id === s.itemId); return a + (it ? (it.cost || 0) * (s.qty || 0) : 0); }, 0);
    const mFees = mSales.reduce((a, s) => a + (s.fees || 0) + (s.ship || 0), 0);
    const mExp = expenses.filter(e => { const ed = new Date(e.date); return ed >= mStart && ed <= mEnd; }).reduce((a, e) => a + (e.amount || 0), 0);
    const mNet = mRev - mCogs - mFees - mExp;
    months.push({
      label: mStart.toLocaleString('default', { month: 'short', year: '2-digit' }),
      revenue: mRev, cogs: mCogs, fees: mFees, expenses: mExp, net: mNet,
      units: mSales.reduce((a, s) => a + (s.qty || 0), 0),
    });
  }

  const plLine = (label, amount, indent = 0, bold = false, color = '') => {
    const style = `padding:${bold ? '10px' : '6px'} 0;${indent ? 'padding-left:' + (indent * 20) + 'px;' : ''}${bold ? 'font-weight:700;border-top:1px solid var(--border);' : ''}`;
    const valStyle = `font-family:'DM Mono',monospace;font-weight:${bold ? '700' : '600'};font-size:${bold ? '14px' : '12px'};${color ? 'color:' + color : ''}`;
    return `<div style="display:flex;justify-content:space-between;align-items:center;${style}">
      <span style="font-size:${bold ? '13px' : '12px'}">${label}</span>
      <span style="${valStyle}">${fmt(amount)}</span>
    </div>`;
  };

  const maxMonthRev = Math.max(...months.map(m => m.revenue), 1);

  el.style.display = '';
  el.innerHTML = `
    <div style="margin-top:16px">
      <!-- P&L Statement -->
      <div style="background:var(--surface2);border:1px solid var(--border);padding:20px 24px;margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div>
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">Profit & Loss Statement</div>
            <div style="font-size:10px;color:var(--muted);margin-top:2px">All time · ${sales.length} sales · ${inv.length} items</div>
          </div>
          <div style="text-align:right">
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:${netProfit >= 0 ? 'var(--good)' : 'var(--danger)'}">${fmt(netProfit)}</div>
            <div style="font-size:10px;color:var(--muted)">net profit · ${(netMargin * 100).toFixed(1)}% margin</div>
          </div>
        </div>

        <div style="font-size:10px;color:var(--accent);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;font-weight:600">Revenue</div>
        ${plLine('Sales Revenue', revenue, 1)}
        ${plLine('Total Revenue', revenue, 0, true, 'var(--accent)')}

        <div style="font-size:10px;color:var(--warn);text-transform:uppercase;letter-spacing:1.5px;margin:14px 0 8px;font-weight:600">Cost of Goods Sold</div>
        ${plLine('Product Cost (COGS)', cogs, 1)}
        ${plLine('Total COGS', cogs, 0, true, 'var(--warn)')}

        <div style="margin:14px 0;padding:12px 0;border-top:2px solid var(--border);border-bottom:1px solid var(--border)">
          ${plLine('Gross Profit', grossProfit, 0, true, grossProfit >= 0 ? 'var(--good)' : 'var(--danger)')}
          <div style="font-size:10px;color:var(--muted);margin-top:2px">Gross margin: ${revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : '0.0'}%</div>
        </div>

        <div style="font-size:10px;color:var(--danger);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;font-weight:600">Operating Expenses</div>
        ${plLine('Platform Fees', totalFees, 1)}
        ${plLine('Shipping Costs', totalShip, 1)}
        ${Object.entries(expByCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => plLine(cat, amt, 1)).join('')}
        ${plLine('Total Expenses', totalFees + totalShip + totalExpenses, 0, true, 'var(--danger)')}

        <div style="margin-top:16px;padding-top:14px;border-top:2px solid var(--border)">
          ${plLine('Net Profit / (Loss)', netProfit, 0, true, netProfit >= 0 ? 'var(--good)' : 'var(--danger)')}
          <div style="font-size:10px;color:var(--muted);margin-top:2px">Net margin: ${(netMargin * 100).toFixed(1)}% · ROI: ${cogs > 0 ? ((netProfit / cogs) * 100).toFixed(1) : '—'}%</div>
        </div>
      </div>

      <!-- Inventory Position -->
      <div style="background:var(--surface2);border:1px solid var(--border);padding:18px 24px;margin-bottom:16px">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;margin-bottom:12px">Inventory Position</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
          <div style="background:var(--surface);border:1px solid var(--border);padding:12px;text-align:center">
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Units In Stock</div>
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:var(--accent)">${inv.reduce((a, i) => a + (i.qty || 0), 0)}</div>
          </div>
          <div style="background:var(--surface);border:1px solid var(--border);padding:12px;text-align:center">
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Cost Basis</div>
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:var(--warn)">${fmt(unsoldCost)}</div>
          </div>
          <div style="background:var(--surface);border:1px solid var(--border);padding:12px;text-align:center">
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Potential Revenue</div>
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:var(--good)">${fmt(unsoldRetail)}</div>
          </div>
        </div>
      </div>

      <!-- Monthly Trend -->
      <div style="background:var(--surface2);border:1px solid var(--border);padding:18px 24px">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;margin-bottom:12px">6-Month Trend</div>
        <div style="overflow-x:auto">
          <table class="inv-table" style="font-size:11px">
            <thead><tr>
              <th>Month</th><th>Units</th><th>Revenue</th><th>COGS</th><th>Fees+Ship</th><th>Expenses</th><th>Net</th>
            </tr></thead>
            <tbody>${months.map(m => `<tr>
              <td style="font-weight:600">${m.label}</td>
              <td>${m.units}</td>
              <td style="color:var(--accent)">${fmt(m.revenue)}</td>
              <td style="color:var(--muted)">${fmt(m.cogs)}</td>
              <td style="color:var(--muted)">${fmt(m.fees)}</td>
              <td style="color:var(--danger)">${fmt(m.expenses)}</td>
              <td style="font-weight:700;color:${m.net >= 0 ? 'var(--good)' : 'var(--danger)'}">${fmt(m.net)}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
        <!-- Mini bar chart -->
        <div style="display:flex;align-items:flex-end;gap:8px;height:60px;margin-top:12px;padding-top:10px;border-top:1px solid var(--border)">
          ${months.map(m => {
            const h = maxMonthRev > 0 ? Math.max((m.revenue / maxMonthRev) * 56, 2) : 2;
            const col = m.net >= 0 ? 'var(--accent)' : 'var(--danger)';
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
              <div style="width:100%;background:${col};height:${h}px;opacity:0.7;transition:height 0.3s"></div>
              <div style="font-size:8px;color:var(--muted)">${m.label}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;

  // Hide the regular report sections
  const panel = el.closest('.panel');
  if (panel) {
    panel.querySelectorAll('.period-summary-grid, .period-nav, .period-section-ttl').forEach(d => d.style.display = 'none');
    // Also hide the trend, sales, and expense sections that follow
    const periodNav = panel.querySelector('.period-nav');
    if (periodNav) {
      let sibling = periodNav.nextElementSibling;
      while (sibling && sibling.id !== 'plReportContent') {
        sibling.style.display = 'none';
        sibling = sibling.nextElementSibling;
      }
    }
  }
}

export function getPeriodBounds(mode, offset) {
  const now = new Date();
  let start, end, label;

  if (mode === 'monthly') {
    const y = now.getFullYear();
    const m = now.getMonth() + offset;
    const d = new Date(y, m, 1);
    start = new Date(d.getFullYear(), d.getMonth(), 1);
    end   = new Date(d.getFullYear(), d.getMonth()+1, 0, 23, 59, 59);
    label = start.toLocaleString('default', { month: 'long', year: 'numeric' });
  } else {
    // Weekly: week starts Monday
    const day = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day+6)%7) + offset*7);
    monday.setHours(0,0,0,0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate()+6);
    sunday.setHours(23,59,59,999);
    start = monday;
    end   = sunday;
    label = `${monday.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${sunday.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
  }
  return { start, end, label };
}

export function buildTrendRows(mode, periodStart, periodEnd) {
  if (mode === 'monthly') {
    const rows = [];
    let wStart = new Date(periodStart);
    wStart.setHours(0,0,0,0);
    while (wStart <= periodEnd) {
      let wEnd = new Date(wStart);
      wEnd.setDate(wStart.getDate() + 6);
      wEnd.setHours(23,59,59,999);
      const actualEnd = wEnd > periodEnd ? new Date(periodEnd) : wEnd;

      const ws = sales.filter(s=>{ const d=new Date(s.date);return d>=wStart&&d<=actualEnd;});
      const we = expenses.filter(e=>{ const d=new Date(e.date);return d>=wStart&&d<=actualEnd;});
      let rev=0,cogs=0,fe=0;
      for(const s of ws){const it=getInvItem(s.itemId);rev+=(s.price||0)*(s.qty||0);cogs+=it?(it.cost||0)*(s.qty||0):0;fe+=(s.fees||0)+(s.ship||0);}
      const gross=rev-cogs-fe;
      const expAmt=we.reduce((a,e)=>a+(e.amount||0),0);
      const net=gross-expAmt;

      const lbl=`${wStart.toLocaleDateString('en-US',{month:'short',day:'numeric'})}–${actualEnd.toLocaleDateString('en-US',{day:'numeric'})}`;
      rows.push(`<tr>
        <td style="font-size:11px;color:var(--muted)">${lbl}</td>
        <td>${ws.length}</td>
        <td>${fmt(rev)}</td>
        <td style="color:var(--muted)">${fmt(cogs+fe)}</td>
        <td style="color:var(--danger)">${expAmt>0?fmt(expAmt):'—'}</td>
        <td style="color:${gross>=0?'var(--good)':'var(--danger)'}">${fmt(gross)}</td>
        <td style="font-weight:700;color:${net>=0?'var(--good)':'var(--danger)'}">${fmt(net)}</td>
      </tr>`);

      wStart = new Date(wEnd);
      wStart.setDate(wEnd.getDate()+1);
      wStart.setHours(0,0,0,0);
      if(rows.length>8) break; // safety
    }
    return rows.join('');
  } else {
    // Weekly: day by day
    const rows = [];
    for (let i=0; i<7; i++) {
      const day = new Date(periodStart);
      day.setDate(periodStart.getDate()+i);
      const dayEnd = new Date(day); dayEnd.setHours(23,59,59,999);
      const ds2 = sales.filter(s=>{ const d=new Date(s.date);return d>=day&&d<=dayEnd;});
      const de  = expenses.filter(e=>{ const d=new Date(e.date);return d>=day&&d<=dayEnd;});
      let rev=0,cogs=0,fe=0;
      for(const s of ds2){const it=getInvItem(s.itemId);rev+=(s.price||0)*(s.qty||0);cogs+=it?(it.cost||0)*(s.qty||0):0;fe+=(s.fees||0)+(s.ship||0);}
      const gross=rev-cogs-fe;
      const expAmt=de.reduce((a,e)=>a+(e.amount||0),0);
      const net=gross-expAmt;
      const lbl=day.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
      rows.push(`<tr>
        <td style="font-size:11px;color:var(--muted)">${lbl}</td>
        <td>${ds2.length}</td>
        <td>${rev>0?fmt(rev):'—'}</td>
        <td style="color:var(--muted)">${(cogs+fe)>0?fmt(cogs+fe):'—'}</td>
        <td style="color:var(--danger)">${expAmt>0?fmt(expAmt):'—'}</td>
        <td style="color:${gross>0?'var(--good)':gross<0?'var(--danger)':'var(--muted)'}">${rev>0?fmt(gross):'—'}</td>
        <td style="font-weight:700;color:${net>0?'var(--good)':net<0?'var(--danger)':'var(--muted)'}">${(rev>0||expAmt>0)?fmt(net):'—'}</td>
      </tr>`);
    }
    return rows.join('');
  }
}

export function setReportMode(mode) {
  reportMode   = mode;
  reportOffset = 0;
  const plBtn = document.getElementById('plTabBtn');
  if (plBtn) plBtn.classList.remove('active');
  renderReports();
}

export function shiftPeriod(dir) {
  reportOffset = Math.min(0, reportOffset + dir);
  renderReports();
}

export function goToAddExpense() {
  const tab = document.querySelectorAll('.nav-tab')[3];
  switchView('expenses', tab);
  setDefaultExpDate();
}

// ── DELETE SALE (restores stock)
export async function delSale(id){
  if(!confirm('Remove this sale? Stock will be restored.'))return;
  const s=sales.find(x=>x.id===id);
  if(s){const it=getInvItem(s.itemId);if(it){it.qty+=(s.qty||0);markDirty('inv',it.id);}}
  const idx = sales.findIndex(x => x.id === id);
  if (idx !== -1) sales.splice(idx, 1);
  save(); refresh(); renderInv(); renderSalesView(); toast('Sale removed, stock restored');
  // Delete sale from cloud, then immediately push the restored inventory
  // (don't rely on debounced autoSync — user may refresh before it fires)
  await pushDeleteToCloud('ft_sales',[id]);
  try { await pushToCloud(); } catch(e) { console.warn('FlipTrack: inv push after sale delete failed:', e.message); }
}

// DELETE ITEM
export async function delItem(id){const item=inv.find(i=>i.id===id);if(!confirm(`Delete "${item?.name}"?`))return;softDeleteItem(id);sel.delete(id);save();refresh();toast('Item deleted — check 🗑️ to restore');await pushDeleteToCloud('ft_inventory',[id]);autoSync();}
