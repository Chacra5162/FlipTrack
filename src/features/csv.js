// ── CSV IMPORT/EXPORT ───────────────────────────────────────────────────────────

import { inv, sales, expenses, save, refresh } from '../data/store.js';
import { fmt, pct, uid } from '../utils/format.js';
import { toast } from '../utils/dom.js';
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
      const text = e.target.result;
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

      if (colMap.name === undefined) {
        toast('CSV needs a "Name" column', true);
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
        const skuDate = new Date().toISOString().slice(0,10).replace(/-/g,'');
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
        // Book fields (only if present in CSV)
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
    } catch (err) {
      toast('Import error: ' + (err.message || 'unknown'), true);
    }
    // Reset file input so same file can be re-imported
    document.getElementById('csvImportInput').value = '';
  };
  reader.readAsText(file);
}
