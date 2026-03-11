import{eT as k,t as x,c as d,eU as B,b as w,f as p}from"./pro-tier-DODZSfAt.js";import"./vendor-supabase-jY4wIOEF.js";function T(t){document.getElementById("prOv").classList.add("on"),t?(I("upc"),document.getElementById("prUpcInput").value=t,_()):(document.getElementById("prUpcInput").value="",document.getElementById("prKwInput").value="",document.getElementById("prBody").innerHTML='<div class="pr-status">Scan a barcode, enter a UPC, or search by keyword to research comparable selling prices.</div>'),setTimeout(()=>{(document.getElementById("prPanelUpc").style.display!=="none"?document.getElementById("prUpcInput"):document.getElementById("prKwInput")).focus()},200),setTimeout(()=>B("#prOv"),250)}function C(){k(),document.getElementById("prOv").classList.remove("on")}function I(t){const e=t==="upc";document.getElementById("prTabUpc").classList.toggle("active",e),document.getElementById("prTabKw").classList.toggle("active",!e),document.getElementById("prPanelUpc").style.display=e?"flex":"none",document.getElementById("prPanelKw").style.display=e?"none":"flex",document.getElementById("prBody").innerHTML='<div class="pr-status">Scan a barcode, enter a UPC, or search by keyword to research comparable selling prices.</div>',setTimeout(()=>{(e?document.getElementById("prUpcInput"):document.getElementById("prKwInput")).focus()},100)}function M(){document.getElementById("prOv").classList.remove("on"),openScanner("__priceResearch__")}async function _(){const t=document.getElementById("prUpcInput").value.trim().replace(/\D/g,"");if(!t||t.length<6){x("Enter a valid UPC or EAN barcode",!0);return}const e=document.getElementById("prLookupBtn");e.disabled=!0,document.getElementById("prBody").innerHTML=`<div class="pr-status"><span class="pr-spinner">⟳</span>Looking up UPC ${d(t)}…</div>`;try{let n=null;try{const a=new AbortController,o=setTimeout(()=>a.abort(),1e4),s=await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${t}`,{signal:a.signal});clearTimeout(o);const r=await s.json();r.items&&r.items.length>0&&(n=r.items[0])}catch{}L(t,n)}catch(n){document.getElementById("prBody").innerHTML=`<div class="pr-status">⚠ Lookup failed: ${d(n.message)}</div>`}finally{e.disabled=!1}}async function H(){const t=document.getElementById("prKwInput").value.trim();if(!t){x("Enter a product name or keyword",!0);return}const e=document.getElementById("prKwBtn");e.disabled=!0,document.getElementById("prBody").innerHTML=`<div class="pr-status"><span class="pr-spinner">⟳</span>Searching for "${d(t)}"…</div>`;try{let n=[];try{const a=new AbortController,o=setTimeout(()=>a.abort(),1e4),s=await fetch(`https://api.upcitemdb.com/prod/trial/search?s=${encodeURIComponent(t)}&type=product`,{signal:a.signal});clearTimeout(o);const r=await s.json();r.items&&(n=r.items)}catch{}E(t,n)}catch(n){document.getElementById("prBody").innerHTML=`<div class="pr-status">⚠ Search failed: ${d(n.message)}</div>`}finally{e.disabled=!1}}function E(t,e){const n=encodeURIComponent(t);let a="";e.length&&(a=`<div class="pr-section-hdr">Matching Products (${e.length})</div>`,a+=e.slice(0,12).map(s=>{const r=(s.images||[])[0]||"",i=s.lowest_recorded_price,l=s.highest_recorded_price,v=s.offers||[],y=(v.length?Math.min(...v.map(m=>m.price).filter(Boolean)):null)??i,u=s.upc?`<button class="pr-price-link" style="cursor:pointer;border:none;background:var(--surface2);padding:3px 8px;color:var(--muted);font-family:'DM Mono',monospace;font-size:10px" onclick="document.getElementById('prUpcInput').value='${w(s.upc)}';prSwitchTab('upc');lookupPrices()">UPC lookup →</button>`:"";return`<div class="pr-price-row" style="align-items:flex-start;gap:10px">
        ${r?`<img src="${w(r)}" alt="${w(s.title||"Product image")}" style="width:48px;height:48px;object-fit:contain;background:var(--surface2);border:1px solid var(--border);flex-shrink:0" onerror="this.style.display='none'">`:""}
        <div style="flex:1;min-width:0">
          <div class="pr-price-title" style="white-space:normal;line-height:1.3">${d(s.title||"—")}</div>
          <div class="pr-price-meta" style="margin-top:3px">
            ${s.brand?`<span>🏷 ${d(s.brand)}</span> · `:""}
            ${s.upc?`<span>UPC: ${d(s.upc)}</span>`:""}
          </div>
          <div style="margin-top:6px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            ${y?`<span style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:var(--accent)">${p(y)}</span>`:""}
            ${l&&i&&l!==i?`<span style="font-size:10px;color:var(--muted);font-family:'DM Mono',monospace">– ${p(l)}</span>`:""}
            ${u}
          </div>
        </div>
      </div>`}).join(""));const o=`
    <div class="pr-section-hdr">Search Live Listings</div>
    <div class="pr-search-links">
      <a class="pr-search-link" href="https://www.ebay.com/sch/i.html?_nkw=${n}&LH_Sold=1&LH_Complete=1" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        eBay Sold
      </a>
      <a class="pr-search-link" href="https://www.ebay.com/sch/i.html?_nkw=${n}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        eBay Active
      </a>
      <a class="pr-search-link" href="https://www.amazon.com/s?k=${n}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Amazon
      </a>
      <a class="pr-search-link" href="https://poshmark.com/search?query=${n}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Poshmark
      </a>
      <a class="pr-search-link" href="https://www.mercari.com/search/?keyword=${n}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Mercari
      </a>
      <a class="pr-search-link" href="https://www.google.com/search?q=${n}+sold+price+resell" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Google
      </a>
    </div>`;document.getElementById("prBody").innerHTML=`
    ${a||'<div class="pr-status" style="padding:24px 0 16px">No product database matches — use the search links below to find live prices.</div>'}
    ${o}
    <div style="height:20px"></div>
  `}function L(t,e){const n=(e==null?void 0:e.title)||(e==null?void 0:e.description)||`UPC ${t}`,a=(e==null?void 0:e.brand)||"",o=((e==null?void 0:e.images)||[])[0]||"",s=(e==null?void 0:e.highest_recorded_price)||null,r=(e==null?void 0:e.lowest_recorded_price)||null,i=(e==null?void 0:e.offers)||[],l=encodeURIComponent(n||t);let v="";i.length&&(v=[...i].sort((c,g)=>(c.price||999)-(g.price||999)).slice(0,8).map(c=>{const g=c.price?p(c.price):"—",f=c.merchant||c.domain||"Merchant",$=c.condition?`· ${c.condition}`:"",b=c.link||"#";return`<div class="pr-price-row">
        <div class="pr-price-left">
          <div class="pr-price-title">${f}</div>
          <div class="pr-price-meta"><span class="pr-plat-badge">${f}</span> ${$}</div>
        </div>
        <div class="pr-price-right">
          <div class="pr-price-val">${g}</div>
          <a class="pr-price-link" href="${b}" target="_blank" rel="noopener">View →</a>
        </div>
      </div>`}).join(""));let h="";if(r!==null||s!==null||i.length){const m=i.length?i.reduce((c,g)=>c+(g.price||0),0)/i.filter(c=>c.price).length:null;h=`<div class="pr-stats-bar">
      <div class="pr-stat-cell"><div class="pr-stat-lbl">Lowest</div><div class="pr-stat-val">${r?p(r):"—"}</div></div>
      <div class="pr-stat-cell"><div class="pr-stat-lbl">Avg</div><div class="pr-stat-val">${m?p(m):"—"}</div></div>
      <div class="pr-stat-cell"><div class="pr-stat-lbl">Highest</div><div class="pr-stat-val">${s?p(s):"—"}</div></div>
    </div>`}const y=`
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
    </div>`,u=`<div class="pr-product-card">
    ${o?`<img class="pr-product-img" src="${o}" alt="" onerror="this.style.display='none'">`:""}
    <div>
      <div class="pr-product-name">${n}</div>
      <div class="pr-product-meta">
        ${a?`<span>🏷 ${a}</span>`:""}
        <span>📦 UPC: ${t}</span>
        ${e!=null&&e.category?`<span>· ${e.category}</span>`:""}
      </div>
      ${r?`<div class="pr-product-lowest">Recorded range: <strong>${p(r)}</strong>${s?` – ${p(s)}`:""}</div>`:""}
    </div>
  </div>`;document.getElementById("prBody").innerHTML=`
    ${u}
    ${h}
    ${v?`<div class="pr-section-hdr">Current Offers</div>${v}`:""}
    ${y}
    <div style="height:20px"></div>
  `}export{C as closePriceResearch,H as lookupByKeyword,_ as lookupPrices,T as openPriceResearch,M as openPriceScanner,I as prSwitchTab,E as renderKeywordResults,L as renderPriceResults};
