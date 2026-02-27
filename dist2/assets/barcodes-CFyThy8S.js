function p(s){return(s.sku||s.id).replace(/[^A-Za-z0-9\-\.\ \$\/\+\%]/g,"").substring(0,40)||"ITEM"}function u(s,a){try{JsBarcode(s,a,{format:"CODE128",width:2,height:50,displayValue:!1,margin:0,background:"#ffffff",lineColor:"#000000"})}catch{JsBarcode(s,"FT"+a.replace(/[^A-Za-z0-9]/g,"").substring(0,20),{format:"CODE128",width:2,height:50,displayValue:!1,margin:0,background:"#ffffff",lineColor:"#000000"})}}function b(s){const a=document.getElementById("dBarcodeWrap");if(!a)return;const i=p(s);a.innerHTML=`
    <div class="barcode-wrap">
      <svg id="dBarcodeSvg"></svg>
      <div class="barcode-sku-lbl">${i}</div>
    </div>
    <div class="barcode-actions">
      <button class="btn-secondary" style="font-size:11px;padding:5px 10px" onclick="printStickers(false,[activeDrawId])">🏷 Print Sticker</button>
      <span style="font-size:10px;color:var(--muted)">CODE128</span>
    </div>`;const o=document.getElementById("dBarcodeSvg");o&&u(o,i)}function x(s,a){let i;if(a)i=a.map(t=>inv.find(e=>e.id===t)).filter(Boolean);else if(s&&sel.size)i=[...sel].map(t=>inv.find(e=>e.id===t)).filter(Boolean);else{const t=(document.getElementById("invSearch").value||"").toLowerCase();i=inv.filter(e=>{const r=!t||e.name.toLowerCase().includes(t)||(e.sku||"").toLowerCase().includes(t),c=platFilt.size===0||getPlatforms(e).some(l=>platFilt.has(l)),n=(e.category||"").toLowerCase(),f=catFilt.size===0||[...catFilt].some(l=>l.toLowerCase()===n),g=subcatFilt==="all"||(e.subcategory||"")===subcatFilt,m=subsubcatFilt==="all"||(e.subtype||"")===subsubcatFilt;return r&&c&&f&&g&&m})}if(!i.length){toast("No items to print",!0);return}const o=i.map(t=>{const e=p(t),r="$"+Number(t.price||0).toFixed(2),c=getItemImages(t)[0]?`<img class="st-photo" src="${getItemImages(t)[0]}" alt="">`:"",n=[t.category,t.subcategory,t.subtype].filter(Boolean).join(" › ");return`
      <div class="sticker" data-sku="${e}">
        ${c}
        <div class="st-name">${t.name}</div>
        ${n?`<div class="st-cat">${n}</div>`:""}
        <div class="st-meta">
          <span class="st-platform">${getPlatforms(t).join(" · ")}</span>
          <span class="st-price">${r}</span>
        </div>
        <div class="st-bc-wrap">
          <svg class="bc-svg" data-val="${e}"></svg>
          <div class="st-sku">${e}</div>
        </div>
      </div>`}).join(""),d=window.open("","_blank","width=900,height=700");d.document.write(`<!DOCTYPE html>
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
    <div class="print-meta">${i.length} item${i.length!==1?"s":""} · Generated ${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
  </div>
  <div class="print-actions">
    <button class="print-btn sec" onclick="window.close()">✕ Close</button>
    <button class="print-btn" onclick="window.print()">⬛ Print</button>
  </div>
</div>
<div class="sticker-grid">${o}</div>
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
</html>`),d.document.close()}export{p as makeBarcodeValue,x as printStickers,u as renderBarcode,b as renderDrawerBarcode};
//# sourceMappingURL=barcodes-CFyThy8S.js.map
