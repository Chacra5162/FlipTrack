// ── BARCODES ────────────────────────────────────────────────────────────────

export function makeBarcodeValue(item) {
  // Use SKU if available, otherwise pad item id to look like a barcode
  return (item.sku || item.id).replace(/[^A-Za-z0-9\-\.\ \$\/\+\%]/g, '').substring(0, 40) || 'ITEM';
}

export function renderBarcode(svgEl, value) {
  try {
    JsBarcode(svgEl, value, {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: false,
      margin: 0,
      background: '#ffffff',
      lineColor: '#000000',
    });
  } catch(e) {
    // If value has unsupported chars, fall back to item id
    JsBarcode(svgEl, 'FT' + value.replace(/[^A-Za-z0-9]/g,'').substring(0,20), {
      format: 'CODE128', width: 2, height: 50, displayValue: false, margin: 0,
      background: '#ffffff', lineColor: '#000000',
    });
  }
}

export function renderDrawerBarcode(item) {
  const wrap = document.getElementById('dBarcodeWrap');
  if (!wrap) return;
  const val = makeBarcodeValue(item);
  wrap.innerHTML = `
    <div class="barcode-wrap">
      <svg id="dBarcodeSvg"></svg>
      <div class="barcode-sku-lbl">${val}</div>
    </div>
    <div class="barcode-actions">
      <button class="btn-secondary" style="font-size:11px;padding:5px 10px" onclick="printStickers(false,[activeDrawId])">🏷 Print Sticker</button>
      <span style="font-size:10px;color:var(--muted)">CODE128</span>
    </div>`;
  const svg = document.getElementById('dBarcodeSvg');
  if (svg) renderBarcode(svg, val);
}

// ── STICKER PRINT ────────────────────────────────────────────────────────────

export function printStickers(selectedOnly, ids) {
  let items;
  if (ids) {
    items = ids.map(id => inv.find(i => i.id === id)).filter(Boolean);
  } else if (selectedOnly && sel.size) {
    items = [...sel].map(id => inv.find(i => i.id === id)).filter(Boolean);
  } else {
    // All filtered items currently visible
    const q = (document.getElementById('invSearch').value||'').toLowerCase();
    items = inv.filter(i => {
      const mq = !q || i.name.toLowerCase().includes(q) || (i.sku||'').toLowerCase().includes(q);
      const mp = platFilt.size===0 || getPlatforms(i).some(p=>platFilt.has(p));
      const _ic=(i.category||'').toLowerCase(); const mc=catFilt.size===0||[...catFilt].some(f=>f.toLowerCase()===_ic);
      const ms = subcatFilt==='all' || (i.subcategory||'')===subcatFilt;
      const mss = subsubcatFilt==='all' || (i.subtype||'')===subsubcatFilt;
      return mq&&mp&&mc&&ms&&mss;
    });
  }
  if (!items.length) { toast('No items to print', true); return; }

  // Build inline SVG barcodes using canvas
  const stickersHtml = items.map(item => {
    const val   = makeBarcodeValue(item);
    const price = '$' + Number(item.price||0).toFixed(2);
    const imgHtml = getItemImages(item)[0]
      ? `<img class="st-photo" src="${getItemImages(item)[0]}" alt="">`
      : '';
    const cats = [item.category, item.subcategory, item.subtype].filter(Boolean).join(' › ');
    return `
      <div class="sticker" data-sku="${val}">
        ${imgHtml}
        <div class="st-name">${item.name}</div>
        ${cats ? `<div class="st-cat">${cats}</div>` : ''}
        <div class="st-meta">
          <span class="st-platform">${getPlatforms(item).join(' · ')}</span>
          <span class="st-price">${price}</span>
        </div>
        <div class="st-bc-wrap">
          <svg class="bc-svg" data-val="${val}"></svg>
          <div class="st-sku">${val}</div>
        </div>
      </div>`;
  }).join('');

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>FlipTrack — Inventory Stickers</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js"><\/script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', monospace;
    background: #f5f5f5;
    padding: 16px;
  }
  .print-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #000;
  }
  .print-title { font-size: 20px; font-weight: 700; letter-spacing: 2px; }
  .print-meta  { font-size: 11px; color: #666; }
  .print-actions { display: flex; gap: 8px; }
  .print-btn {
    padding: 8px 18px;
    background: #000;
    color: #fff;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 12px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .print-btn.sec { background: #fff; color: #000; border: 1px solid #000; }

  .sticker-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .sticker {
    background: #fff;
    border: 1.5px solid #000;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    page-break-inside: avoid;
    break-inside: avoid;
    min-height: 160px;
  }
  .st-photo {
    width: 100%;
    height: 70px;
    object-fit: cover;
    border: 1px solid #eee;
    margin-bottom: 2px;
  }
  .st-name {
    font-size: 11px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: 0.3px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .st-cat {
    font-size: 8px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .st-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2px;
  }
  .st-platform {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: #f0f0f0;
    padding: 2px 5px;
    color: #333;
  }
  .st-price {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .st-bc-wrap {
    margin-top: auto;
    padding-top: 5px;
    border-top: 1px dashed #ccc;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .bc-svg { width: 100%; max-height: 44px; }
  .st-sku {
    font-size: 7.5px;
    letter-spacing: 1.5px;
    color: #444;
    text-transform: uppercase;
  }

  @media print {
    body { background: #fff; padding: 8px; }
    .print-header .print-actions { display: none; }
    .sticker-grid { gap: 6px; }
    .sticker { border: 1px solid #000; }
  }
  @page { margin: 12mm; }
</style>
</head>
<body>
<div class="print-header">
  <div>
    <div class="print-title">FLIPTRACK — INVENTORY STICKERS</div>
    <div class="print-meta">${items.length} item${items.length!==1?'s':''} · Generated ${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
  </div>
  <div class="print-actions">
    <button class="print-btn sec" onclick="window.close()">✕ Close</button>
    <button class="print-btn" onclick="window.print()">⬛ Print</button>
  </div>
</div>
<div class="sticker-grid">${stickersHtml}</div>
<script>
  window.onload = function() {
    document.querySelectorAll('.bc-svg').forEach(svg => {
      const val = svg.dataset.val;
      try {
        JsBarcode(svg, val, {
          format: 'CODE128',
          width: 1.5,
          height: 40,
          displayValue: false,
          margin: 0,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch(e) {
        JsBarcode(svg, 'FT' + val.replace(/[^A-Za-z0-9]/g,'').substring(0,20), {
          format:'CODE128', width:1.5, height:40, displayValue:false,
          margin:0, background:'#ffffff', lineColor:'#000000'
        });
      }
    });
    // Auto-show print dialog after barcodes render
    setTimeout(() => window.print(), 400);
  };
<\/script>
</body>
</html>`);
  win.document.close();
}
