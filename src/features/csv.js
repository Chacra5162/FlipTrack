// ── CSV IMPORT/EXPORT ───────────────────────────────────────────────────────────

import { inv, sales, expenses, save, refresh } from '../data/store.js';
import { fmt, pct, uid, escHtml, escAttr, localDate} from '../utils/format.js';
import { toast, trapFocus, releaseFocus } from '../utils/dom.js';
import { _sfx } from '../utils/sfx.js';
import { getPlatforms } from './platforms.js';
import { calc } from '../data/store.js';
import { autoSync } from '../data/sync.js';

export function exportCSV(){
  const rows=[['Name','SKU','UPC','Category','Subcategory','Source','Condition','Platforms','Qty','Cost','Price','Fees','Ship','Margin','Notes','Added','ISBN','Author','Publisher','Edition','Printing','Year','Signed','Sales Rank']];
  for(const i of inv){const {m}=calc(i);rows.push([i.name,i.sku||'',i.upc||'',i.category||'',i.subcategory||'',i.source||'',i.condition||'',getPlatforms(i).join(';'),i.qty,i.cost,i.price,i.fees||0,i.ship||0,pct(m),i.notes||'',i.added||'',i.isbn||'',i.author||'',i.publisher||'',i.edition||'',i.printing||'',i.pubYear||'',i.signed?'Yes':'',i.salesRank||'']);}
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='fliptrack-inventory.csv';a.click();toast('Inventory CSV exported ✓');
}

export function exportSalesCSV() {
  const rows=[['Date','Item Name','SKU','Platform','Qty','Sale Price','List Price','Fees','Shipping','Profit']];
  for (const s of sales) {
    const it = inv.find(i => i.id === s.itemId);
    const pr = (s.price||0)*(s.qty||0) - (it?(it.cost||0)*(s.qty||0):0) - (s.fees||0) - (s.ship||0);
    rows.push([s.date, it?it.name:'Deleted Item', it?it.sku:'', s.platform||'', s.qty, s.price, s.listPrice||'', s.fees||0, s.ship||0, pr.toFixed(2)]);
  }
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='fliptrack-sales.csv';a.click();toast('Sales CSV exported ✓');
}

export function exportExpensesCSV() {
  const rows=[['Date','Category','Description','Amount']];
  for (const e of expenses) {
    rows.push([e.date, e.category, e.description, e.amount]);
  }
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='fliptrack-expenses.csv';a.click();toast('Expenses CSV exported ✓');
}

export function exportAll() {
  exportCSV();
  setTimeout(() => exportSalesCSV(), 300);
  setTimeout(() => exportExpensesCSV(), 600);
}

export function importCSV(file) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { toast('CSV too large (max 5MB)', true); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const text = e.target.result.replace(/^\uFEFF/, ''); // Strip BOM
      const sep = text.indexOf('\t') !== -1 && text.indexOf(',') === -1 ? '\t' : ',';
      const lines = [];
      let current = '', inQuote = false;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') { inQuote = !inQuote; current += ch; }
        else if ((ch === '\n' || ch === '\r') && !inQuote) {
          if (current.trim()) lines.push(current);
          current = '';
          if (ch === '\r' && text[i+1] === '\n') i++;
        } else { current += ch; }
      }
      if (current.trim()) lines.push(current);

      if (lines.length < 2) { toast('CSV appears empty', true); return; }

      // Parse header
      const parseRow = (line) => {
        const cells = []; let cell = '', inQ = false;
        for (let i = 0; i < line.length; i++) {
          const c = line[i];
          if (c === '"') {
            if (inQ && line[i+1] === '"') { cell += '"'; i++; }
            else inQ = !inQ;
          } else if (c === sep && !inQ) { cells.push(cell.trim()); cell = ''; }
          else cell += c;
        }
        cells.push(cell.trim());
        return cells;
      };

      const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const colMap = {};
      // Map common header names to our fields
      const aliases = {
        name: ['name','title','itemname','item','productname','product'],
        sku: ['sku','itemsku','productsku'],
        upc: ['upc','barcode','ean','gtin'],
        category: ['category','cat','type','department'],
        subcategory: ['subcategory','subcat','subcategory'],
        source: ['source','sourcedfrom','wherebought','store'],
        condition: ['condition','cond','itemcondition'],
        platform: ['platform','platforms','marketplace','channel'],
        qty: ['qty','quantity','stock','units','qtyavailable'],
        cost: ['cost','costprice','purchaseprice','cogs','buyprice','pricepaid'],
        price: ['price','listprice','sellingprice','askingprice','listingprice','saleprice'],
        fees: ['fees','platformfees','sellingfees'],
        ship: ['ship','shipping','shippingcost'],
        notes: ['notes','description','comments','memo'],
        isbn: ['isbn','isbn10','isbn13','isbnno'],
        author: ['author','authors','writer','by'],
        publisher: ['publisher','pub','publishedby'],
        edition: ['edition','ed'],
        printing: ['printing','print','printrun'],
        pubYear: ['year','yearpublished','pubyear','publishyear','publicationyear'],
        signed: ['signed','autographed','signature'],
        salesRank: ['salesrank','amazonrank','rank','bsr'],
      };

      for (const [field, names] of Object.entries(aliases)) {
        const idx = headers.findIndex(h => names.includes(h));
        if (idx !== -1) colMap[field] = idx;
      }

      // Check if auto-mapping found a name column
      const autoMappedCount = Object.keys(colMap).length;
      const unmappedHeaders = headers.filter((h, idx) => !Object.values(colMap).includes(idx));
      const needsManualMap = colMap.name === undefined || (autoMappedCount < 3 && headers.length > 3);

      if (needsManualMap) {
        // Show column mapping UI
        _showColumnMapper(headers, colMap, lines, parseRow, aliases);
        return;
      }

      _executeImport(colMap, lines, parseRow);
    } catch (err) {
      toast('Import error: ' + (err.message || 'unknown'), true);
    }
    // Reset file input so same file can be re-imported
    document.getElementById('csvImportInput').value = '';
  };
  reader.readAsText(file);
}

// ── Shared import execution (used by both auto-map and manual map) ──────────
function _executeImport(colMap, lines, parseRow) {
  if (colMap.name === undefined) {
    toast('A "Name" column is required', true);
    return;
  }
  const rows = lines.length - 1;
  if (rows > 10000) { toast('Too many rows (max 10,000)', true); return; }

  let imported = 0, skipped = 0;
  for (let r = 1; r < lines.length; r++) {
    const row = parseRow(lines[r]);
    const name = (row[colMap.name] || '').trim();
    if (!name) { skipped++; continue; }

    const cat = colMap.category !== undefined ? (row[colMap.category] || '').trim() : '';
    const skuDate = localDate().replace(/-/g,'');
    const skuCat = (cat || 'GEN').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4).padEnd(3,'X');
    const skuRand = Math.random().toString(36).slice(2,5).toUpperCase();

    const platStr = colMap.platform !== undefined ? (row[colMap.platform] || '').trim() : '';
    const plats = platStr ? platStr.split(/[;,|]/).map(p => p.trim()).filter(Boolean) : [];

    const item = {
      id: uid(),
      name,
      sku: colMap.sku !== undefined ? (row[colMap.sku] || '').trim() || (skuCat + '-' + skuDate + '-' + skuRand) : skuCat + '-' + skuDate + '-' + skuRand,
      upc: colMap.upc !== undefined ? (row[colMap.upc] || '').trim() : '',
      category: cat,
      subcategory: colMap.subcategory !== undefined ? (row[colMap.subcategory] || '').trim() : '',
      subtype: '',
      platform: plats[0] || 'Other',
      platforms: plats,
      cost: colMap.cost !== undefined ? (parseFloat(row[colMap.cost]) || 0) : 0,
      price: colMap.price !== undefined ? (parseFloat(row[colMap.price]) || 0) : 0,
      qty: colMap.qty !== undefined ? (parseInt(row[colMap.qty]) || 1) : 1,
      bulk: false,
      fees: colMap.fees !== undefined ? (parseFloat(row[colMap.fees]) || 0) : 0,
      ship: colMap.ship !== undefined ? (parseFloat(row[colMap.ship]) || 0) : 0,
      lowAlert: 2,
      notes: colMap.notes !== undefined ? (row[colMap.notes] || '').trim() : '',
      source: colMap.source !== undefined ? (row[colMap.source] || '').trim() : '',
      condition: colMap.condition !== undefined ? (row[colMap.condition] || '').trim() : '',
      images: [],
      image: null,
      added: new Date().toISOString(),
    };
    if (colMap.isbn !== undefined) item.isbn = (row[colMap.isbn] || '').trim();
    if (colMap.author !== undefined) item.author = (row[colMap.author] || '').trim();
    if (colMap.publisher !== undefined) item.publisher = (row[colMap.publisher] || '').trim();
    if (colMap.edition !== undefined) item.edition = (row[colMap.edition] || '').trim();
    if (colMap.printing !== undefined) item.printing = (row[colMap.printing] || '').trim();
    if (colMap.pubYear !== undefined) item.pubYear = parseInt(row[colMap.pubYear]) || null;
    if (colMap.signed !== undefined) item.signed = ['yes','true','1','y'].includes((row[colMap.signed]||'').trim().toLowerCase());
    if (colMap.salesRank !== undefined) item.salesRank = parseInt(row[colMap.salesRank]) || null;
    inv.push(item);
    imported++;
  }

  if (!imported) { toast('No valid rows found', true); return; }

  save(); refresh(); _sfx.create();
  toast(imported + ' item' + (imported !== 1 ? 's' : '') + ' imported ✓' + (skipped ? ' (' + skipped + ' skipped)' : ''));
  autoSync();
}

// ── COLUMN MAPPING UI ─────────────────────────────────────────────────────────
const FIELD_LABELS = {
  name: 'Item Name *', sku: 'SKU', upc: 'UPC/Barcode', category: 'Category',
  subcategory: 'Subcategory', source: 'Source', condition: 'Condition',
  platform: 'Platform', qty: 'Quantity', cost: 'Cost Price', price: 'List Price',
  fees: 'Fees', ship: 'Shipping', notes: 'Notes/Description',
  isbn: 'ISBN', author: 'Author', publisher: 'Publisher', edition: 'Edition',
  printing: 'Printing', pubYear: 'Year', signed: 'Signed', salesRank: 'Sales Rank',
};

function _showColumnMapper(headers, autoColMap, lines, parseRow, aliases) {
  // Create or reuse overlay
  let ov = document.getElementById('csvMapOv');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'csvMapOv';
    ov.className = 'overlay on';
    document.body.appendChild(ov);
  } else {
    ov.classList.add('on');
  }

  // Preview first 3 data rows
  const previewRows = [];
  for (let i = 1; i <= Math.min(3, lines.length - 1); i++) {
    previewRows.push(parseRow(lines[i]));
  }

  const fields = Object.keys(FIELD_LABELS);
  const originalHeaders = parseRow(lines[0]); // keep original case for display

  let html = `<div class="csv-mapper">
    <div class="csv-mapper-header">
      <h3 style="font-family:Syne,sans-serif;font-weight:700;font-size:15px;margin:0">Map CSV Columns</h3>
      <p style="font-size:11px;color:var(--muted);margin:4px 0 0">We couldn't auto-detect all columns. Match your CSV headers to FlipTrack fields.</p>
    </div>
    <div class="csv-mapper-body">
      <table class="csv-map-table">
        <thead><tr>
          <th style="width:160px">CSV Column</th>
          <th style="width:140px">Sample Data</th>
          <th style="width:180px">Map To</th>
        </tr></thead>
        <tbody>`;

  for (let col = 0; col < headers.length; col++) {
    const sample = previewRows.map(r => (r[col]||'').slice(0, 30)).filter(Boolean).join(', ');
    // Find if this column is already auto-mapped
    let mappedField = '';
    for (const [field, idx] of Object.entries(autoColMap)) {
      if (idx === col) { mappedField = field; break; }
    }
    html += `<tr>
      <td style="font-weight:600;font-size:12px">${originalHeaders[col] || 'Column ' + (col+1)}</td>
      <td style="font-size:11px;color:var(--muted);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escAttr(sample)}">${escHtml(sample) || '—'}</td>
      <td><select class="csv-map-select" data-col="${col}">
        <option value="">— Skip —</option>
        ${fields.map(f => `<option value="${f}" ${mappedField === f ? 'selected' : ''}>${FIELD_LABELS[f]}</option>`).join('')}
      </select></td>
    </tr>`;
  }

  html += `</tbody></table></div>
    <div class="csv-mapper-footer">
      <span style="font-size:11px;color:var(--muted)">${lines.length - 1} rows found</span>
      <div style="display:flex;gap:8px">
        <button class="btn-ghost" onclick="closeCsvMapper()">Cancel</button>
        <button class="btn-primary" onclick="applyCsvMapping()">Import</button>
      </div>
    </div>
  </div>`;

  ov.innerHTML = html;
  setTimeout(() => trapFocus(ov.id ? '#' + ov.id : '.csv-overlay'), 100);

  // Store state for the apply function
  window._csvMapState = { lines, parseRow, headers };
}

export function closeCsvMapper() {
  const ov = document.getElementById('csvMapOv');
  if (ov) ov.classList.remove('on');
  releaseFocus();
  document.getElementById('csvImportInput').value = '';
}

export function applyCsvMapping() {
  const state = window._csvMapState;
  if (!state) return;

  const selects = document.querySelectorAll('.csv-map-select');
  const colMap = {};
  const usedFields = new Set();

  for (const sel of selects) {
    const field = sel.value;
    const col = parseInt(sel.getAttribute('data-col'));
    if (field && !usedFields.has(field)) {
      colMap[field] = col;
      usedFields.add(field);
    }
  }

  if (colMap.name === undefined) {
    toast('You must map at least the "Item Name" column', true);
    return;
  }

  closeCsvMapper();
  _executeImport(colMap, state.lines, state.parseRow);
}
