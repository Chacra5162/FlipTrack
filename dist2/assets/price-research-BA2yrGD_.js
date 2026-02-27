function B(s){document.getElementById("prOv").classList.add("on"),s?(w("upc"),document.getElementById("prUpcInput").value=s,x()):(document.getElementById("prUpcInput").value="",document.getElementById("prKwInput").value="",document.getElementById("prBody").innerHTML='<div class="pr-status">Scan a barcode, enter a UPC, or search by keyword to research comparable selling prices.</div>'),setTimeout(()=>{(document.getElementById("prPanelUpc").style.display!=="none"?document.getElementById("prUpcInput"):document.getElementById("prKwInput")).focus()},200)}function b(){document.getElementById("prOv").classList.remove("on")}function w(s){const e=s==="upc";document.getElementById("prTabUpc").classList.toggle("active",e),document.getElementById("prTabKw").classList.toggle("active",!e),document.getElementById("prPanelUpc").style.display=e?"flex":"none",document.getElementById("prPanelKw").style.display=e?"none":"flex",document.getElementById("prBody").innerHTML='<div class="pr-status">Scan a barcode, enter a UPC, or search by keyword to research comparable selling prices.</div>',setTimeout(()=>{(e?document.getElementById("prUpcInput"):document.getElementById("prKwInput")).focus()},100)}function I(){document.getElementById("prOv").classList.remove("on"),openScanner("__priceResearch__")}async function x(){const s=document.getElementById("prUpcInput").value.trim().replace(/\D/g,"");if(!s||s.length<6){toast("Enter a valid UPC or EAN barcode",!0);return}const e=document.getElementById("prLookupBtn");e.disabled=!0,document.getElementById("prBody").innerHTML=`<div class="pr-status"><span class="pr-spinner">⟳</span>Looking up UPC ${s}…</div>`;try{let t=null;try{const a=await(await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${s}`)).json();a.items&&a.items.length>0&&(t=a.items[0])}catch{}k(s,t)}catch(t){document.getElementById("prBody").innerHTML=`<div class="pr-status">⚠ Lookup failed: ${t.message}</div>`}finally{e.disabled=!1}}async function _(){const s=document.getElementById("prKwInput").value.trim();if(!s){toast("Enter a product name or keyword",!0);return}const e=document.getElementById("prKwBtn");e.disabled=!0,document.getElementById("prBody").innerHTML=`<div class="pr-status"><span class="pr-spinner">⟳</span>Searching for "${s}"…</div>`;try{let t=[];try{const a=await(await fetch(`https://api.upcitemdb.com/prod/trial/search?s=${encodeURIComponent(s)}&type=product`)).json();a.items&&(t=a.items)}catch{}$(s,t)}catch(t){document.getElementById("prBody").innerHTML=`<div class="pr-status">⚠ Search failed: ${t.message}</div>`}finally{e.disabled=!1}}function $(s,e){const t=encodeURIComponent(s);let c="";e.length&&(c=`<div class="pr-section-hdr">Matching Products (${e.length})</div>`,c+=e.slice(0,12).map(n=>{const o=(n.images||[])[0]||"",i=n.lowest_recorded_price,l=n.highest_recorded_price,p=n.offers||[],m=(p.length?Math.min(...p.map(d=>d.price).filter(Boolean)):null)??i,g=n.upc?`<button class="pr-price-link" style="cursor:pointer;border:none;background:var(--surface2);padding:3px 8px;color:var(--muted);font-family:'DM Mono',monospace;font-size:10px" onclick="document.getElementById('prUpcInput').value='${n.upc}';prSwitchTab('upc');lookupPrices()">UPC lookup →</button>`:"";return`<div class="pr-price-row" style="align-items:flex-start;gap:10px">
        ${o?`<img src="${o}" style="width:48px;height:48px;object-fit:contain;background:var(--surface2);border:1px solid var(--border);flex-shrink:0" onerror="this.style.display='none'">`:""}
        <div style="flex:1;min-width:0">
          <div class="pr-price-title" style="white-space:normal;line-height:1.3">${n.title||"—"}</div>
          <div class="pr-price-meta" style="margin-top:3px">
            ${n.brand?`<span>🏷 ${n.brand}</span> · `:""}
            ${n.upc?`<span>UPC: ${n.upc}</span>`:""}
          </div>
          <div style="margin-top:6px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            ${m?`<span style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:var(--accent)">${fmt(m)}</span>`:""}
            ${l&&i&&l!==i?`<span style="font-size:10px;color:var(--muted);font-family:'DM Mono',monospace">– ${fmt(l)}</span>`:""}
            ${g}
          </div>
        </div>
      </div>`}).join(""));const a=`
    <div class="pr-section-hdr">Search Live Listings</div>
    <div class="pr-search-links">
      <a class="pr-search-link" href="https://www.ebay.com/sch/i.html?_nkw=${t}&LH_Sold=1&LH_Complete=1" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        eBay Sold
      </a>
      <a class="pr-search-link" href="https://www.ebay.com/sch/i.html?_nkw=${t}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        eBay Active
      </a>
      <a class="pr-search-link" href="https://www.amazon.com/s?k=${t}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Amazon
      </a>
      <a class="pr-search-link" href="https://poshmark.com/search?query=${t}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Poshmark
      </a>
      <a class="pr-search-link" href="https://www.mercari.com/search/?keyword=${t}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Mercari
      </a>
      <a class="pr-search-link" href="https://www.google.com/search?q=${t}+sold+price+resell" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Google
      </a>
    </div>`;document.getElementById("prBody").innerHTML=`
    ${c||'<div class="pr-status" style="padding:24px 0 16px">No product database matches — use the search links below to find live prices.</div>'}
    ${a}
    <div style="height:20px"></div>
  `}function k(s,e){const t=(e==null?void 0:e.title)||(e==null?void 0:e.description)||`UPC ${s}`,c=(e==null?void 0:e.brand)||"",a=((e==null?void 0:e.images)||[])[0]||"",n=(e==null?void 0:e.highest_recorded_price)||null,o=(e==null?void 0:e.lowest_recorded_price)||null,i=(e==null?void 0:e.offers)||[],l=encodeURIComponent(t||s);let p="";i.length&&(p=[...i].sort((r,v)=>(r.price||999)-(v.price||999)).slice(0,8).map(r=>{const v=r.price?fmt(r.price):"—",h=r.merchant||r.domain||"Merchant",f=r.condition?`· ${r.condition}`:"",u=r.link||"#";return`<div class="pr-price-row">
        <div class="pr-price-left">
          <div class="pr-price-title">${h}</div>
          <div class="pr-price-meta"><span class="pr-plat-badge">${h}</span> ${f}</div>
        </div>
        <div class="pr-price-right">
          <div class="pr-price-val">${v}</div>
          <a class="pr-price-link" href="${u}" target="_blank" rel="noopener">View →</a>
        </div>
      </div>`}).join(""));let y="";if(o!==null||n!==null||i.length){const d=i.length?i.reduce((r,v)=>r+(v.price||0),0)/i.filter(r=>r.price).length:null;y=`<div class="pr-stats-bar">
      <div class="pr-stat-cell"><div class="pr-stat-lbl">Lowest</div><div class="pr-stat-val">${o?fmt(o):"—"}</div></div>
      <div class="pr-stat-cell"><div class="pr-stat-lbl">Avg</div><div class="pr-stat-val">${d?fmt(d):"—"}</div></div>
      <div class="pr-stat-cell"><div class="pr-stat-lbl">Highest</div><div class="pr-stat-val">${n?fmt(n):"—"}</div></div>
    </div>`}const m=`
    <div class="pr-section-hdr">Search Live Listings</div>
    <div class="pr-search-links">
      <a class="pr-search-link" href="https://www.ebay.com/sch/i.html?_nkw=${l}&LH_Sold=1&LH_Complete=1" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        eBay Sold
      </a>
      <a class="pr-search-link" href="https://www.ebay.com/sch/i.html?_nkw=${l}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        eBay Active
      </a>
      <a class="pr-search-link" href="https://www.amazon.com/s?k=${l}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Amazon
      </a>
      <a class="pr-search-link" href="https://www.poshmark.com/search?query=${l}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Poshmark
      </a>
      <a class="pr-search-link" href="https://www.google.com/search?q=${l}+sold+price+resell" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Google
      </a>
    </div>`,g=`<div class="pr-product-card">
    ${a?`<img class="pr-product-img" src="${a}" alt="" onerror="this.style.display='none'">`:""}
    <div>
      <div class="pr-product-name">${t}</div>
      <div class="pr-product-meta">
        ${c?`<span>🏷 ${c}</span>`:""}
        <span>📦 UPC: ${s}</span>
        ${e!=null&&e.category?`<span>· ${e.category}</span>`:""}
      </div>
      ${o?`<div class="pr-product-lowest">Recorded range: <strong>${fmt(o)}</strong>${n?` – ${fmt(n)}`:""}</div>`:""}
    </div>
  </div>`;document.getElementById("prBody").innerHTML=`
    ${g}
    ${y}
    ${p?`<div class="pr-section-hdr">Current Offers</div>${p}`:""}
    ${m}
    <div style="height:20px"></div>
  `}export{b as closePriceResearch,_ as lookupByKeyword,x as lookupPrices,B as openPriceResearch,I as openPriceScanner,w as prSwitchTab,$ as renderKeywordResults,k as renderPriceResults};
//# sourceMappingURL=price-research-BA2yrGD_.js.map
