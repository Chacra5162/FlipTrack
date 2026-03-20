/**
 * csv-templates.js — Platform-specific CSV export templates
 * Generates CSV files formatted for direct import into eBay, Poshmark,
 * Mercari, and other platforms' bulk listing tools.
 */

import { localDate } from '../utils/format.js';
import { inv, sales, expenses, getInvItem } from '../data/store.js';
import { getPlatforms } from './platforms.js';
import { PLATFORM_FEES } from '../config/platforms.js';
import { toast } from '../utils/dom.js';
import { getShow, getEndedShows, getItemNote } from '../features/whatnot-show.js';
import { getShowMetrics } from '../features/whatnot-analytics.js';

/**
 * Platform-specific column mappings
 */
const TEMPLATES = {
  ebay: {
    name: 'eBay File Exchange',
    ext: 'csv',
    columns: ['Action', 'Title', 'Subtitle', 'Category', 'ConditionID', 'Price', 'Quantity', 'Description', 'PicURL', 'ShippingType', 'ShippingService-1:Option', 'ShippingService-1:Cost', 'Format', 'Duration'],
    mapper: (item) => ({
      'Action': 'Add',
      'Title': (item.name || '').slice(0, 80),
      'Subtitle': '',
      'Category': item.category || '',
      'ConditionID': conditionToEBay(item.condition),
      'Price': (item.price || 0).toFixed(2),
      'Quantity': item.qty || 1,
      'Description': item.notes || item.name || '',
      'PicURL': '',
      'ShippingType': 'Flat',
      'ShippingService-1:Option': 'USPSPriority',
      'ShippingService-1:Cost': (item.ship || 5.99).toFixed(2),
      'Format': 'FixedPrice',
      'Duration': 'GTC',
    }),
  },

  poshmark: {
    name: 'Poshmark',
    ext: 'csv',
    columns: ['Title', 'Description', 'Department', 'Category', 'Subcategory', 'Brand', 'Size', 'Color', 'Condition', 'Original Price', 'Listing Price', 'Quantity'],
    mapper: (item) => ({
      'Title': (item.name || '').slice(0, 80),
      'Description': item.notes || item.name || '',
      'Department': '',
      'Category': item.category || '',
      'Subcategory': item.subcategory || '',
      'Brand': '',
      'Size': '',
      'Color': '',
      'Condition': item.condition || 'Pre-Owned',
      'Original Price': ((item.price || 0) * 1.3).toFixed(2),
      'Listing Price': (item.price || 0).toFixed(2),
      'Quantity': item.qty || 1,
    }),
  },

  mercari: {
    name: 'Mercari',
    ext: 'csv',
    columns: ['Title', 'Description', 'Category', 'Condition', 'Price', 'Shipping Paid By', 'Shipping Weight'],
    mapper: (item) => ({
      'Title': (item.name || '').slice(0, 80),
      'Description': item.notes || item.name || '',
      'Category': item.category || '',
      'Condition': item.condition || 'Good',
      'Price': (item.price || 0).toFixed(2),
      'Shipping Paid By': 'Seller',
      'Shipping Weight': item.weight ? item.weight + ' oz' : '',
    }),
  },

  depop: {
    name: 'Depop',
    ext: 'csv',
    columns: ['Title', 'Description', 'Category', 'Condition', 'Price', 'Quantity', 'Shipping Cost'],
    mapper: (item) => ({
      'Title': (item.name || '').slice(0, 80),
      'Description': item.notes || item.name || '',
      'Category': item.category || '',
      'Condition': item.condition || 'Used',
      'Price': (item.price || 0).toFixed(2),
      'Quantity': item.qty || 1,
      'Shipping Cost': (item.ship || 0).toFixed(2),
    }),
  },

  generic: {
    name: 'FlipTrack Full Export',
    ext: 'csv',
    columns: ['SKU', 'Name', 'Category', 'Subcategory', 'Platforms', 'Condition', 'Cost', 'Price', 'Fees', 'Shipping', 'Quantity', 'Date Added', 'Notes', 'UPC'],
    mapper: (item) => ({
      'SKU': item.sku || '',
      'Name': item.name || '',
      'Category': item.category || '',
      'Subcategory': item.subcategory || '',
      'Platforms': getPlatforms(item).join('; '),
      'Condition': item.condition || '',
      'Cost': (item.cost || 0).toFixed(2),
      'Price': (item.price || 0).toFixed(2),
      'Fees': (item.fees || 0).toFixed(2),
      'Shipping': (item.ship || 0).toFixed(2),
      'Quantity': item.qty || 0,
      'Date Added': item.added || '',
      'Notes': item.notes || '',
      'UPC': item.upc || '',
    }),
  },

  sales_report: {
    name: 'Sales Report',
    ext: 'csv',
    columns: ['Date', 'Item Name', 'SKU', 'Platform', 'Sale Price', 'Quantity', 'Fees', 'Shipping', 'Item Cost', 'Profit'],
    mapper: null, // handled specially
  },

  tax_export: {
    name: 'Tax Summary',
    ext: 'csv',
    columns: ['Category', 'Description', 'Date', 'Amount', 'Type'],
    mapper: null,
  },
};

function conditionToEBay(cond) {
  const map = {
    'New with Tags': 1000, 'New': 1000, 'Deadstock': 1000,
    'New without Tags': 1500, 'Open Box': 1500,
    'Like New': 2000, 'Refurbished': 2500,
    'Pre-Owned': 3000, 'Good': 3000,
    'Fair': 5000, 'Poor': 7000,
  };
  return map[cond] || 3000;
}

/** Neutralize spreadsheet formula injection — prefix cells starting with =, +, -, @ */
const _sanitizeCell = v => { const s = String(v); return /^[=+\-@]/.test(s) ? "'" + s : s; };

function escCSV(val) {
  const str = _sanitizeCell(String(val ?? ''));
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function downloadCSV(filename, columns, rows) {
  const header = columns.map(escCSV).join(',');
  const body = rows.map(row => columns.map(col => escCSV(row[col] ?? '')).join(',')).join('\n');
  const csv = header + '\n' + body;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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
 * Export inventory as platform-specific CSV
 */
export function exportPlatformCSV(templateKey, filterPlatform) {
  const tpl = TEMPLATES[templateKey];
  if (!tpl) { toast('Unknown template', true); return; }

  let items = [...inv].filter(i => (i.qty || 0) > 0);

  // Filter by platform if specified
  if (filterPlatform) {
    items = items.filter(i => getPlatforms(i).some(p => p.toLowerCase().includes(filterPlatform.toLowerCase())));
  }

  if (!items.length) { toast('No matching items to export', true); return; }

  const rows = items.map(tpl.mapper);
  const filename = `fliptrack-${templateKey}-${localDate()}.${tpl.ext}`;
  downloadCSV(filename, tpl.columns, rows);
  toast(`Exported ${rows.length} items — ${tpl.name} format`);
}

/**
 * Export sales report
 */
export function exportSalesCSV() {
  const tpl = TEMPLATES.sales_report;
  const rows = sales.map(s => {
    const item = getInvItem(s.itemId);
    const cost = item ? (item.cost || 0) * (s.qty || 1) : 0;
    const revenue = (s.price || 0) * (s.qty || 1);
    const profit = revenue - cost - (s.fees || 0) - (s.ship || 0);
    return {
      'Date': s.date || '',
      'Item Name': item ? item.name : 'Unknown',
      'SKU': item ? (item.sku || '') : '',
      'Platform': s.platform || '',
      'Sale Price': revenue.toFixed(2),
      'Quantity': s.qty || 1,
      'Fees': (s.fees || 0).toFixed(2),
      'Shipping': (s.ship || 0).toFixed(2),
      'Item Cost': cost.toFixed(2),
      'Profit': profit.toFixed(2),
    };
  });

  if (!rows.length) { toast('No sales to export', true); return; }
  downloadCSV(`fliptrack-sales-${localDate()}.csv`, tpl.columns, rows);
  toast(`Exported ${rows.length} sales`);
}

/**
 * Export tax summary
 */
export function exportTaxCSV() {
  const tpl = TEMPLATES.tax_export;
  const rows = [];

  // Sales as income
  for (const s of sales) {
    const item = getInvItem(s.itemId);
    rows.push({
      'Category': 'Revenue',
      'Description': item ? item.name : 'Sale',
      'Date': s.date || '',
      'Amount': ((s.price || 0) * (s.qty || 1)).toFixed(2),
      'Type': 'Income',
    });
  }

  // Expenses as deductions
  for (const e of expenses) {
    rows.push({
      'Category': e.category || 'Expense',
      'Description': e.desc || '',
      'Date': e.date || '',
      'Amount': (e.amount || 0).toFixed(2),
      'Type': 'Expense',
    });
  }

  if (!rows.length) { toast('No data to export', true); return; }
  downloadCSV(`fliptrack-tax-${localDate()}.csv`, tpl.columns, rows);
  toast(`Exported ${rows.length} tax records`);
}

// ── WHATNOT SHOW CSV EXPORTS ─────────────────────────────────────────────

/**
 * Export show prep list as CSV.
 */
export function exportShowPrepCSV(showId) {
  const show = getShow(showId);
  if (!show) { toast('Show not found', true); return; }

  const columns = ['#', 'Item Name', 'Category', 'Condition', 'List Price', 'Cost', 'Talking Points', 'Notes'];
  const rows = show.items.map((itemId, i) => {
    const item = getInvItem(itemId);
    if (!item) return null;
    return {
      '#': i + 1,
      'Item Name': item.name || '',
      'Category': item.category || '',
      'Condition': item.condition || '',
      'List Price': (item.price || 0).toFixed(2),
      'Cost': (item.cost || 0).toFixed(2),
      'Talking Points': getItemNote(showId, itemId) || '',
      'Notes': item.notes || '',
    };
  }).filter(Boolean);

  if (!rows.length) { toast('No items in show', true); return; }
  downloadCSV(`whatnot-prep-${show.name.replace(/\s+/g, '-').slice(0, 20)}-${show.date || 'undated'}.csv`, columns, rows);
  toast(`Exported prep list — ${rows.length} items`);
}

/**
 * Export show results as CSV.
 */
export function exportShowResultsCSV(showId) {
  const show = getShow(showId);
  if (!show) { toast('Show not found', true); return; }

  const feeRate = PLATFORM_FEES?.Whatnot || 0.089;
  const columns = ['Item Name', 'Status', 'Sale Price', 'Cost', 'Whatnot Fee', 'Profit', 'Category', 'Condition'];
  const rows = show.items.map(itemId => {
    const item = getInvItem(itemId);
    if (!item) return null;
    const sold = show.soldItems?.[itemId];
    const salePrice = sold ? sold.price : 0;
    const cost = item.cost || 0;
    const fee = salePrice * feeRate;
    const profit = sold ? salePrice - cost - fee : 0;
    return {
      'Item Name': item.name || '',
      'Status': sold ? 'Sold' : 'Unsold',
      'Sale Price': sold ? salePrice.toFixed(2) : '',
      'Cost': cost.toFixed(2),
      'Whatnot Fee': sold ? fee.toFixed(2) : '',
      'Profit': sold ? profit.toFixed(2) : '',
      'Category': item.category || '',
      'Condition': item.condition || '',
    };
  }).filter(Boolean);

  if (!rows.length) { toast('No items in show', true); return; }
  downloadCSV(`whatnot-results-${show.name.replace(/\s+/g, '-').slice(0, 20)}-${show.date || 'undated'}.csv`, columns, rows);
  toast(`Exported show results — ${rows.length} items`);
}

/**
 * Export all shows summary as CSV.
 */
export function exportAllShowsCSV() {
  const ended = getEndedShows();
  if (!ended.length) { toast('No completed shows to export', true); return; }

  const columns = ['Show Name', 'Date', 'Items', 'Sold', 'Sell-Through%', 'Revenue', 'Profit', 'Duration (hrs)'];
  const rows = ended.map(show => {
    const m = getShowMetrics(show);
    return {
      'Show Name': show.name || '',
      'Date': show.date || '',
      'Items': m.itemCount,
      'Sold': m.soldCount,
      'Sell-Through%': (m.sellThrough * 100).toFixed(1),
      'Revenue': m.revenue.toFixed(2),
      'Profit': m.profit.toFixed(2),
      'Duration (hrs)': m.duration.toFixed(1),
    };
  });

  downloadCSV(`whatnot-all-shows-${localDate()}.csv`, columns, rows);
  toast(`Exported ${rows.length} shows`);
}

/**
 * Get list of available templates for UI
 */
export function getCSVTemplates() {
  return Object.entries(TEMPLATES).map(([key, tpl]) => ({
    key,
    name: tpl.name,
  }));
}

/**
 * Render the CSV export panel (for dashboard or reports view)
 */
export function renderCSVExportPanel() {
  const platforms = [
    { key: 'ebay', label: 'eBay File Exchange', icon: '🏷' },
    { key: 'poshmark', label: 'Poshmark', icon: '👗' },
    { key: 'mercari', label: 'Mercari', icon: '📦' },
    { key: 'depop', label: 'Depop', icon: '🛍' },
  ];

  return `<div class="csv-export-panel">
    <div class="csv-export-title">Export for Platform</div>
    <div class="csv-export-grid">
      ${platforms.map(p => `<button class="csv-btn" onclick="exportPlatformCSV('${p.key}')">
        <span>${p.icon}</span> ${p.label}
      </button>`).join('')}
    </div>
    <div class="csv-export-divider"></div>
    <div class="csv-export-grid">
      <button class="csv-btn csv-btn-secondary" onclick="exportPlatformCSV('generic')">📋 Full Inventory</button>
      <button class="csv-btn csv-btn-secondary" onclick="exportSalesCSV()">💰 Sales Report</button>
      <button class="csv-btn csv-btn-secondary" onclick="exportTaxCSV()">🧾 Tax Summary</button>
      <button class="csv-btn csv-btn-secondary" onclick="exportAllShowsCSV()">🎬 All Whatnot Shows</button>
    </div>
  </div>`;
}
