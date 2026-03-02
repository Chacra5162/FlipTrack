/**
 * tax-center.js - Tax dashboard and Schedule C calculator
 * Quarterly breakdown, tax liability estimation, export functionality
 */

import { inv, sales, expenses, getInvItem } from '../data/store.js';
import { fmt, ds, pct, escHtml } from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { getMeta, setMeta } from '../data/idb.js';
import { getMileageSummary, getMileageLog, initMileageLog, renderMileageSection } from '../features/mileage.js';

// ── STATE ─────────────────────────────────────────────────────────────────
let _taxYear = new Date().getFullYear();
let _selectedQuarter = null; // null = all, 1-4 = specific quarter
let _showScheduleC = false;
let _showYearComparison = false;

// ── TAX CALCULATIONS ───────────────────────────────────────────────────────

const SE_TAX_RATE = 0.153; // 15.3% (12.4% Social Security + 2.9% Medicare)
const INCOME_TAX_BRACKETS_2025 = [
  { min: 0, max: 11925, rate: 0.10 },
  { min: 11925, max: 48475, rate: 0.12 },
  { min: 48475, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250525, rate: 0.32 },
  { min: 250525, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 },
];

function calcSETax(netIncome) {
  if (netIncome <= 0) return 0;
  const seIncome = netIncome * 0.9235;
  return Math.round(seIncome * SE_TAX_RATE * 100) / 100;
}

function calcIncomeTax(netIncome) {
  if (netIncome <= 0) return 0;
  const seTax = calcSETax(netIncome);
  const taxableIncome = Math.max(0, netIncome - seTax / 2 - 15000);
  let tax = 0;
  for (const bracket of INCOME_TAX_BRACKETS_2025) {
    if (taxableIncome <= bracket.min) break;
    const taxable = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxable * bracket.rate;
  }
  return Math.round(tax * 100) / 100;
}

function calcEstimatedQuarterlyTax(annualNetIncome) {
  const seTax = calcSETax(annualNetIncome);
  const incomeTax = calcIncomeTax(annualNetIncome);
  const totalAnnual = seTax + incomeTax;
  return {
    seTax,
    incomeTax,
    totalAnnual,
    quarterly: Math.round(totalAnnual / 4 * 100) / 100,
  };
}

const QUARTERLY_DUE_DATES = {
  Q1: { label: 'Q1 (Jan–Mar)', due: 'April 15' },
  Q2: { label: 'Q2 (Apr–Jun)', due: 'June 15' },
  Q3: { label: 'Q3 (Jul–Sep)', due: 'September 15' },
  Q4: { label: 'Q4 (Oct–Dec)', due: 'January 15 (next year)' },
};

export function taxSetYear(year) {
  _taxYear = Number(year);
  renderTaxCenter();
}

export function taxSetQuarter(q) {
  _selectedQuarter = _selectedQuarter === q ? null : q;
  renderTaxCenter();
}

export function taxToggleScheduleC() {
  _showScheduleC = !_showScheduleC;
  renderTaxCenter();
}

export function taxToggleYearComparison() {
  _showYearComparison = !_showYearComparison;
  renderTaxCenter();
}

// ── HELPERS ───────────────────────────────────────────────────────────────

/**
 * Get quarter number from date
 */
function getQuarter(date) {
  const month = new Date(date).getMonth();
  return Math.floor(month / 3) + 1;
}

/**
 * Get date range for quarter
 */
function getQuarterDates(year, quarter) {
  const start = new Date(year, (quarter - 1) * 3, 1);
  const end = new Date(year, quarter * 3, 0, 23, 59, 59);
  return { start, end };
}

/**
 * Calculate metrics for a period
 */
function calculatePeriodMetrics(startDate, endDate) {
  let revenue = 0, cogs = 0, platformFees = 0, shipping = 0;
  const itemCount = new Set();

  const periodSales = sales.filter(s => {
    const d = new Date(s.date);
    return d >= startDate && d <= endDate;
  });

  for (const sale of periodSales) {
    const item = getInvItem(sale.itemId);
    const qty = sale.qty || 1;
    const price = sale.price || 0;

    revenue += price * qty;
    cogs += (item?.cost || 0) * qty;
    platformFees += sale.fees || 0;
    shipping += sale.ship || 0;
    itemCount.add(sale.itemId);
  }

  const grossProfit = revenue - cogs - platformFees - shipping;

  // Sum expenses for period
  const periodExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d >= startDate && d <= endDate;
  });

  const expensesByCategory = {};
  let totalExpenses = 0;
  for (const exp of periodExpenses) {
    const cat = exp.category || 'Other';
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (exp.amount || 0);
    totalExpenses += exp.amount || 0;
  }

  const netProfit = grossProfit - totalExpenses;
  const taxCalc = calcEstimatedQuarterlyTax(netProfit);

  return {
    revenue,
    cogs,
    platformFees,
    shipping,
    grossProfit,
    totalExpenses,
    expensesByCategory,
    netProfit,
    estimatedTax: taxCalc.totalAnnual,
    estimatedTaxQuarterly: taxCalc.quarterly,
    seTax: taxCalc.seTax,
    incomeTax: taxCalc.incomeTax,
    saleCount: periodSales.length,
    itemCount: itemCount.size,
  };
}

/**
 * Render quarterly breakdown
 */
function renderQuarterBreakdown() {
  const quarters = [1, 2, 3, 4];
  const rows = quarters.map(q => {
    const { start, end } = getQuarterDates(_taxYear, q);
    const m = calculatePeriodMetrics(start, end);
    const isSelected = _selectedQuarter === q;

    return `
      <tr style="cursor:pointer;background:${isSelected ? 'var(--surface)' : ''};border-bottom:1px solid var(--border)" onclick="taxSetQuarter(${q})">
        <td style="padding:10px;font-weight:600;color:var(--text)">Q${q}</td>
        <td style="padding:10px;font-family:'DM Mono',monospace;color:var(--accent)">${fmt(m.revenue)}</td>
        <td style="padding:10px;font-family:'DM Mono',monospace;color:var(--muted)">${fmt(m.cogs)}</td>
        <td style="padding:10px;font-family:'DM Mono',monospace;color:var(--good)">${fmt(m.grossProfit)}</td>
        <td style="padding:10px;font-family:'DM Mono',monospace;color:var(--danger)">${fmt(m.totalExpenses)}</td>
        <td style="padding:10px;font-family:'DM Mono',monospace;font-weight:600;color:${m.netProfit >= 0 ? 'var(--good)' : 'var(--danger)'}">${fmt(m.netProfit)}</td>
        <td style="padding:10px;font-family:'DM Mono',monospace;color:var(--warn);font-weight:600">${fmt(m.estimatedTaxQuarterly)}</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="overflow-x:auto;margin-bottom:16px">
      <table class="inv-table" style="width:100%;font-size:12px">
        <thead>
          <tr style="background:var(--surface);border-bottom:2px solid var(--border)">
            <th style="padding:10px;text-align:left;font-weight:700">Period</th>
            <th style="padding:10px;text-align:right;font-weight:700">Revenue</th>
            <th style="padding:10px;text-align:right;font-weight:700">COGS</th>
            <th style="padding:10px;text-align:right;font-weight:700">Gross Profit</th>
            <th style="padding:10px;text-align:right;font-weight:700">Expenses</th>
            <th style="padding:10px;text-align:right;font-weight:700">Net Profit</th>
            <th style="padding:10px;text-align:right;font-weight:700">Qtr Tax Due</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/**
 * Render Schedule C line items
 */
function renderScheduleC(metrics) {
  const scheduleLines = [
    { line: 1, label: 'Gross receipts or sales', value: fmt(metrics.revenue) },
    { line: 2, label: 'Returns and allowances', value: fmt(0) },
    { line: 4, label: 'Cost of goods sold (COGS)', value: fmt(metrics.cogs) },
    { line: 5, label: 'Gross profit', value: fmt(metrics.grossProfit) },
    { line: 10, label: 'Commissions & fees (platforms)', value: fmt(metrics.platformFees) },
    { line: 22, label: 'Supplies', value: fmt(metrics.expensesByCategory['Supplies'] || 0) },
    { line: 27, label: 'Other expenses', value: fmt((metrics.expensesByCategory['Shipping Supplies'] || 0) + (metrics.expensesByCategory['Software'] || 0)) },
  ];

  const rows = scheduleLines.map(item => `
    <tr style="border-bottom:1px solid var(--border)">
      <td style="padding:8px;font-weight:600;color:var(--muted);font-family:'DM Mono',monospace;width:50px">Line ${item.line}</td>
      <td style="padding:8px;color:var(--text)">${item.label}</td>
      <td style="padding:8px;font-family:'DM Mono',monospace;color:var(--accent);text-align:right;font-weight:600">${item.value}</td>
    </tr>
  `).join('');

  return `
    <div style="margin-bottom:16px;padding:12px;background:var(--surface);border-radius:6px;border:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="panel-title" style="margin:0">Schedule C Summary</div>
        <button onclick="taxToggleScheduleC()" style="padding:4px 10px;background:var(--accent2);color:white;border:none;border-radius:3px;cursor:pointer;font-size:11px;font-weight:600;font-family:Syne,sans-serif">Hide</button>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;font-size:11px">
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Export tax data as CSV
 */
export async function taxExportCSV() {
  if (_selectedQuarter) {
    const { start, end } = getQuarterDates(_taxYear, _selectedQuarter);
    const m = calculatePeriodMetrics(start, end);
    const csv = [
      'FlipTrack Tax Report - Q' + _selectedQuarter + ' ' + _taxYear,
      '',
      'Summary',
      'Metric,Amount',
      'Revenue,' + m.revenue,
      'COGS,' + m.cogs,
      'Platform Fees,' + m.platformFees,
      'Shipping Costs,' + m.shipping,
      'Gross Profit,' + m.grossProfit,
      'Total Expenses,' + m.totalExpenses,
      'Net Profit,' + m.netProfit,
      'Estimated Tax (25%),' + m.estimatedTax,
      '',
      'Expenses by Category',
      'Category,Amount',
      ...Object.entries(m.expensesByCategory).map(([cat, amt]) => `"${cat}",${amt}`),
    ].join('\n');

    _downloadCSV('fliptrack-tax-q' + _selectedQuarter + '-' + _taxYear + '.csv', csv);
  } else {
    // Export all quarters
    let csv = ['FlipTrack Tax Report - ' + _taxYear, '', 'Quarterly Summary', 'Quarter,Revenue,COGS,Gross Profit,Expenses,Net Profit,Estimated Tax'];

    for (let q = 1; q <= 4; q++) {
      const { start, end } = getQuarterDates(_taxYear, q);
      const m = calculatePeriodMetrics(start, end);
      csv.push(`Q${q},${m.revenue},${m.cogs},${m.grossProfit},${m.totalExpenses},${m.netProfit},${m.estimatedTax}`);
    }

    _downloadCSV('fliptrack-tax-' + _taxYear + '.csv', csv.join('\n'));
  }

  toast('Tax report exported ✓');
}

/**
 * Helper to download CSV
 */
function _downloadCSV(filename, content) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Main render function
 */
export async function renderTaxCenter() {
  const el = document.getElementById('taxContent');
  if (!el) return;

  // Initialize mileage if needed
  await initMileageLog();

  // Get year metrics
  const yearStart = new Date(_taxYear, 0, 1);
  const yearEnd = new Date(_taxYear, 11, 31, 23, 59, 59);
  const yearMetrics = calculatePeriodMetrics(yearStart, yearEnd);

  // Get mileage summary
  const mileageSummary = getMileageSummary(_taxYear);

  // Get selected quarter metrics if applicable
  let quarterMetrics = null;
  if (_selectedQuarter) {
    const { start, end } = getQuarterDates(_taxYear, _selectedQuarter);
    quarterMetrics = calculatePeriodMetrics(start, end);
  }

  // Build stats strip
  const statsStrip = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px">
      <div class="stat-card" style="padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:6px">
        <div style="font-size:10px;font-weight:600;color:var(--muted);margin-bottom:4px">Total Revenue</div>
        <div style="font-size:20px;font-weight:700;color:var(--accent);font-family:'DM Mono',monospace">${fmt(yearMetrics.revenue)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">${yearMetrics.saleCount} sales</div>
      </div>
      <div class="stat-card" style="padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:6px">
        <div style="font-size:10px;font-weight:600;color:var(--muted);margin-bottom:4px">Total COGS</div>
        <div style="font-size:20px;font-weight:700;color:var(--muted);font-family:'DM Mono',monospace">${fmt(yearMetrics.cogs)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">${yearMetrics.itemCount} items</div>
      </div>
      <div class="stat-card" style="padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:6px">
        <div style="font-size:10px;font-weight:600;color:var(--muted);margin-bottom:4px">Net Profit</div>
        <div style="font-size:20px;font-weight:700;color:${yearMetrics.netProfit >= 0 ? 'var(--good)' : 'var(--danger)'};font-family:'DM Mono',monospace">${fmt(yearMetrics.netProfit)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">margin: ${yearMetrics.revenue ? ((yearMetrics.netProfit / yearMetrics.revenue) * 100).toFixed(1) : 0}%</div>
      </div>
      <div class="stat-card" style="padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:6px;border-color:var(--warn)">
        <div style="font-size:10px;font-weight:600;color:var(--muted);margin-bottom:4px">Est. Tax Liability</div>
        <div style="font-size:20px;font-weight:700;color:var(--warn);font-family:'DM Mono',monospace">${fmt(yearMetrics.estimatedTax)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">
          <div>SE: ${fmt(yearMetrics.seTax)}</div>
          <div>Income: ${fmt(yearMetrics.incomeTax)}</div>
        </div>
      </div>
    </div>
  `;

  // Build controls
  const controls = `
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px;align-items:center;padding:12px;background:var(--surface);border-radius:6px;border:1px solid var(--border)">
      <select onchange="taxSetYear(this.value)" style="padding:6px 10px;background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:3px;font-family:'DM Mono',monospace;font-size:12px">
        <option value="2024" ${_taxYear === 2024 ? 'selected' : ''}>Tax Year 2024</option>
        <option value="2025" ${_taxYear === 2025 ? 'selected' : ''}>Tax Year 2025</option>
        <option value="2026" ${_taxYear === 2026 ? 'selected' : ''}>Tax Year 2026</option>
      </select>
      <button onclick="taxToggleScheduleC()" class="btn-secondary" style="padding:6px 12px;background:${_showScheduleC ? 'var(--accent2)' : 'var(--surface2)'};border:1px solid var(--border);color:white;border-radius:3px;cursor:pointer;font-weight:600;font-family:Syne,sans-serif;font-size:12px">${_showScheduleC ? 'Hide' : 'Show'} Schedule C</button>
      <button onclick="taxToggleYearComparison()" class="btn-secondary" style="padding:6px 12px;background:${_showYearComparison ? 'var(--accent2)' : 'var(--surface2)'};border:1px solid var(--border);color:white;border-radius:3px;cursor:pointer;font-weight:600;font-family:Syne,sans-serif;font-size:12px">${_showYearComparison ? 'Hide' : 'Show'} Year Comparison</button>
      <button onclick="taxExportCSV()" class="btn-primary" style="padding:6px 12px;background:var(--accent);color:white;border:none;border-radius:3px;cursor:pointer;font-weight:600;font-family:Syne,sans-serif;font-size:12px">Export CSV</button>
    </div>
  `;

  // Build quarterly payment schedule
  const paymentSchedule = `
    <div class="panel" style="margin-bottom:20px;padding:12px;background:rgba(244,174,0,0.05);border-color:var(--warn)">
      <div class="panel-title" style="margin-bottom:12px">Estimated Quarterly Tax Payments (${_taxYear})</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px">
        ${[1, 2, 3, 4].map(q => {
          const { start, end } = getQuarterDates(_taxYear, q);
          const m = calculatePeriodMetrics(start, end);
          const qInfo = QUARTERLY_DUE_DATES['Q' + q];
          return `
            <div style="padding:12px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
              <div style="font-weight:700;color:var(--text);margin-bottom:8px">${qInfo.label}</div>
              <div style="display:grid;gap:6px;font-size:11px;font-family:'DM Mono',monospace">
                <div style="display:flex;justify-content:space-between;padding:6px;background:rgba(var(--surface-rgb),0.5);border-radius:2px">
                  <span style="color:var(--muted)">Payment Due:</span>
                  <span style="color:var(--warn);font-weight:600">${qInfo.due}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:6px;background:rgba(var(--surface-rgb),0.5);border-radius:2px">
                  <span style="color:var(--muted)">SE Tax:</span>
                  <span style="color:var(--accent)">${fmt(m.seTax)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:6px;background:rgba(var(--surface-rgb),0.5);border-radius:2px">
                  <span style="color:var(--muted)">Income Tax:</span>
                  <span style="color:var(--accent)">${fmt(m.incomeTax)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px;background:var(--warn);border-radius:2px;color:white;font-weight:700">
                  <span>Total Due:</span>
                  <span>${fmt(m.estimatedTaxQuarterly)}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Build quarterly table
  const quarterlySection = `
    <div class="panel" style="margin-bottom:20px;padding:12px">
      <div class="panel-title" style="margin-bottom:12px">Quarterly Breakdown (${_taxYear})</div>
      ${renderQuarterBreakdown()}
      <div style="font-size:10px;color:var(--muted);text-align:center">Click a quarter to expand details</div>
    </div>
  `;

  // Build quarter detail section
  let quarterDetail = '';
  if (quarterMetrics) {
    quarterDetail = `
      <div class="panel" style="margin-bottom:20px;padding:12px">
        <div class="panel-title" style="margin-bottom:12px">Q${_selectedQuarter} Details</div>
        ${_showScheduleC ? renderScheduleC(quarterMetrics) : ''}
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px">
          <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
            <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Revenue</div>
            <div style="font-size:16px;font-weight:700;color:var(--accent);font-family:'DM Mono',monospace">${fmt(quarterMetrics.revenue)}</div>
          </div>
          <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
            <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Gross Profit</div>
            <div style="font-size:16px;font-weight:700;color:var(--good);font-family:'DM Mono',monospace">${fmt(quarterMetrics.grossProfit)}</div>
          </div>
          <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
            <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Expenses</div>
            <div style="font-size:16px;font-weight:700;color:var(--danger);font-family:'DM Mono',monospace">${fmt(quarterMetrics.totalExpenses)}</div>
          </div>
          <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
            <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Net Profit</div>
            <div style="font-size:16px;font-weight:700;color:${quarterMetrics.netProfit >= 0 ? 'var(--good)' : 'var(--danger)'};font-family:'DM Mono',monospace">${fmt(quarterMetrics.netProfit)}</div>
          </div>
        </div>
      </div>
    `;
  }

  // Build year-over-year comparison
  let yearComparison = '';
  if (_showYearComparison && _taxYear > 2023) {
    const prevYear = _taxYear - 1;
    const prevYearStart = new Date(prevYear, 0, 1);
    const prevYearEnd = new Date(prevYear, 11, 31, 23, 59, 59);
    const prevYearMetrics = calculatePeriodMetrics(prevYearStart, prevYearEnd);

    const revenueGrowth = prevYearMetrics.revenue > 0 ? ((yearMetrics.revenue - prevYearMetrics.revenue) / prevYearMetrics.revenue) * 100 : 0;
    const profitGrowth = prevYearMetrics.netProfit > 0 ? ((yearMetrics.netProfit - prevYearMetrics.netProfit) / prevYearMetrics.netProfit) * 100 : (yearMetrics.netProfit > 0 ? 100 : 0);
    const expenseGrowth = prevYearMetrics.totalExpenses > 0 ? ((yearMetrics.totalExpenses - prevYearMetrics.totalExpenses) / prevYearMetrics.totalExpenses) * 100 : 0;
    const taxGrowth = prevYearMetrics.estimatedTax > 0 ? ((yearMetrics.estimatedTax - prevYearMetrics.estimatedTax) / prevYearMetrics.estimatedTax) * 100 : 0;

    const arrow = (val) => val > 0 ? '▲' : val < 0 ? '▼' : '→';
    const color = (val) => val > 0 ? 'var(--good)' : val < 0 ? 'var(--danger)' : 'var(--muted)';

    yearComparison = `
      <div class="panel" style="margin-bottom:20px;padding:12px">
        <div class="panel-title" style="margin-bottom:12px">${_taxYear} vs ${prevYear} Comparison</div>
        <div style="overflow-x:auto">
          <table style="width:100%;font-size:11px;font-family:'DM Mono',monospace">
            <thead>
              <tr style="background:var(--surface);border-bottom:1px solid var(--border)">
                <th style="padding:10px;text-align:left;color:var(--muted)">Metric</th>
                <th style="padding:10px;text-align:right;color:var(--muted)">${prevYear}</th>
                <th style="padding:10px;text-align:right;color:var(--muted)">${_taxYear}</th>
                <th style="padding:10px;text-align:right;color:var(--muted)">Change</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid var(--border)">
                <td style="padding:10px;font-weight:600">Revenue</td>
                <td style="padding:10px;text-align:right;color:var(--accent)">${fmt(prevYearMetrics.revenue)}</td>
                <td style="padding:10px;text-align:right;color:var(--accent)">${fmt(yearMetrics.revenue)}</td>
                <td style="padding:10px;text-align:right;color:${color(revenueGrowth)};font-weight:600">${arrow(revenueGrowth)} ${Math.abs(revenueGrowth).toFixed(1)}%</td>
              </tr>
              <tr style="border-bottom:1px solid var(--border)">
                <td style="padding:10px;font-weight:600">Gross Profit</td>
                <td style="padding:10px;text-align:right;color:var(--good)">${fmt(prevYearMetrics.grossProfit)}</td>
                <td style="padding:10px;text-align:right;color:var(--good)">${fmt(yearMetrics.grossProfit)}</td>
                <td style="padding:10px;text-align:right;color:${color(revenueGrowth)};font-weight:600">${arrow(revenueGrowth)} ${Math.abs((prevYearMetrics.grossProfit > 0 ? ((yearMetrics.grossProfit - prevYearMetrics.grossProfit) / prevYearMetrics.grossProfit) * 100 : 0)).toFixed(1)}%</td>
              </tr>
              <tr style="border-bottom:1px solid var(--border)">
                <td style="padding:10px;font-weight:600">Expenses</td>
                <td style="padding:10px;text-align:right;color:var(--danger)">${fmt(prevYearMetrics.totalExpenses)}</td>
                <td style="padding:10px;text-align:right;color:var(--danger)">${fmt(yearMetrics.totalExpenses)}</td>
                <td style="padding:10px;text-align:right;color:${color(-expenseGrowth)};font-weight:600">${arrow(-expenseGrowth)} ${Math.abs(expenseGrowth).toFixed(1)}%</td>
              </tr>
              <tr style="border-bottom:1px solid var(--border)">
                <td style="padding:10px;font-weight:600">Net Profit</td>
                <td style="padding:10px;text-align:right;color:${prevYearMetrics.netProfit >= 0 ? 'var(--good)' : 'var(--danger)'}">${fmt(prevYearMetrics.netProfit)}</td>
                <td style="padding:10px;text-align:right;color:${yearMetrics.netProfit >= 0 ? 'var(--good)' : 'var(--danger)'}">${fmt(yearMetrics.netProfit)}</td>
                <td style="padding:10px;text-align:right;color:${color(profitGrowth)};font-weight:600">${arrow(profitGrowth)} ${Math.abs(profitGrowth).toFixed(1)}%</td>
              </tr>
              <tr>
                <td style="padding:10px;font-weight:600">Tax Liability</td>
                <td style="padding:10px;text-align:right;color:var(--warn)">${fmt(prevYearMetrics.estimatedTax)}</td>
                <td style="padding:10px;text-align:right;color:var(--warn)">${fmt(yearMetrics.estimatedTax)}</td>
                <td style="padding:10px;text-align:right;color:${color(taxGrowth)};font-weight:600">${arrow(taxGrowth)} ${Math.abs(taxGrowth).toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Build mileage section
  const mileageSection = renderMileageSection();

  el.innerHTML = `
    <div style="padding:16px 12px">
      ${statsStrip}
      ${controls}
      ${paymentSchedule}
      ${quarterlySection}
      ${quarterDetail}
      ${_showYearComparison ? yearComparison : ''}
      ${mileageSection}
    </div>
  `;
}
