import{eT as w,eV as f,eW as h,t as m,c,f as u,eU as I,F as b,G as B}from"./pro-tier-XqC5hsAq.js";import"./vendor-supabase-jY4wIOEF.js";let r=null,y="image/jpeg",o=null;function _(){document.getElementById("idOv").classList.add("on"),E(),setTimeout(()=>I("#idOv"),100)}function g(){w(),document.getElementById("idOv").classList.remove("on"),r=null,o=null}function T(e){const i=e.target.files[0];if(e.target.value="",!i||!i.type.startsWith("image/"))return;y=i.type||"image/jpeg";const d=new FileReader;d.onload=t=>{const a=t.target.result;r=a.split(",")[1],document.getElementById("idPrompt").style.display="none",document.getElementById("idPreview").style.display="block",document.getElementById("idPreviewImg").src=a,document.getElementById("idCapture").classList.add("has-photo"),document.getElementById("idAnalyzeBtn").disabled=!1,document.getElementById("idResults").innerHTML=""},d.readAsDataURL(i)}function E(){r=null,o=null,document.getElementById("idPrompt").style.display="",document.getElementById("idPreview").style.display="none",document.getElementById("idPreviewImg").src="",document.getElementById("idCapture").classList.remove("has-photo"),document.getElementById("idAnalyzeBtn").disabled=!0,document.getElementById("idResults").innerHTML="",document.getElementById("idCameraInput").value="",document.getElementById("idGalleryInput").value=""}async function $(){if(!r)return;const e=b(),i=B();if(!e||!i){m("Please sign in to use Identify",!0);return}const d=document.getElementById("idAnalyzeBtn"),t=document.getElementById("idResults");d.disabled=!0,d.textContent="✨ Analyzing…",t.innerHTML=`
    <div class="id-loading">
      <div class="id-loading-spinner"></div>
      <div class="id-loading-text">AI is analyzing your photo…</div>
      <div class="id-loading-sub">Identifying item, brand, and estimating value</div>
    </div>`;try{const a=await k(r,y),{data:n,error:s}=await e.functions.invoke("identify-item",{body:{image:a.data,media_type:a.type}});if(s)throw new Error(s.message||"Edge function error");if(n!=null&&n.error)throw new Error(n.error);o=n,x(n)}catch(a){console.error("FlipTrack: identify error:",a),t.innerHTML=`
      <div class="id-error">
        <div>⚠ ${c(a.message||"Failed to identify item")}</div>
        <button class="id-capture-btn" onclick="idAnalyze()">Try Again</button>
      </div>`}finally{d.disabled=!1,d.textContent="✨ Identify & Value This Item"}}function k(e,i){return new Promise(d=>{const t=new Image;t.onload=()=>{let n=t.width,s=t.height;if(n>800||s>800){const v=Math.min(800/n,800/s);n=Math.round(n*v),s=Math.round(s*v)}const l=document.createElement("canvas");l.width=n,l.height=s,l.getContext("2d").drawImage(t,0,0,n,s);const p=l.toDataURL("image/jpeg",.75);d({data:p.split(",")[1],type:"image/jpeg"})},t.onerror=()=>d({data:e,type:i}),t.src="data:"+i+";base64,"+e})}function x(e){const i=document.getElementById("idResults"),d=e.confidence==="high"?"confidence-high":e.confidence==="medium"?"confidence-medium":"confidence-low",t=encodeURIComponent(e.searchTerms||e.name);i.innerHTML=`
    <div class="id-result">
      <div class="id-result-card">
        <div class="id-result-name">${c(e.name||"Unknown Item")}</div>
        ${e.brand?`<div class="id-result-brand">🏷 ${c(e.brand)}</div>`:""}
        ${e.details?`<div class="id-result-details">${c(e.details)}</div>`:""}
        <div class="id-result-tags">
          ${e.category?`<span class="id-result-tag">${c(e.category)}</span>`:""}
          ${e.subcategory?`<span class="id-result-tag">${c(e.subcategory)}</span>`:""}
          ${e.condition?`<span class="id-result-tag">${c(e.condition)}</span>`:""}
          <span class="id-result-tag ${d}">${(e.confidence||"unknown").toUpperCase()} CONFIDENCE</span>
        </div>

        <div class="id-value-bar">
          <div class="id-value-cell low">
            <div class="id-value-lbl">Low</div>
            <div class="id-value-amt">${e.estimatedLow?u(e.estimatedLow):"—"}</div>
          </div>
          <div class="id-value-cell mid">
            <div class="id-value-lbl">Typical</div>
            <div class="id-value-amt">${e.estimatedMid?u(e.estimatedMid):"—"}</div>
          </div>
          <div class="id-value-cell high">
            <div class="id-value-lbl">Best Case</div>
            <div class="id-value-amt">${e.estimatedHigh?u(e.estimatedHigh):"—"}</div>
          </div>
        </div>

        <div class="id-actions">
          <button class="id-action-btn primary" onclick="idAddToInventory()">+ Add to Inventory</button>
          <button class="id-action-btn" onclick="idSearchPrices()">🔍 Research Prices</button>
        </div>
      </div>

      <div style="margin-top:8px">
        <div class="pr-section-hdr">Quick Marketplace Search</div>
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
          <a class="pr-search-link" href="https://www.mercari.com/search/?keyword=${t}" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Mercari
          </a>
          <a class="pr-search-link" href="https://www.google.com/search?q=${t}+sold+price+resell" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Google
          </a>
        </div>
      </div>
    </div>`}function C(){if(!o)return;const e=o,i=r,d=y;g(),window.switchView&&window.switchView("inventory",null),window.openAddModal&&window.openAddModal(),setTimeout(()=>{try{const t=document.getElementById("f_name");t&&e.name&&(t.value=e.name);const a=document.getElementById("f_cat");a&&e.category&&(a.value=e.category,window.syncAddSubcat&&window.syncAddSubcat());const n=document.getElementById("f_subcat_txt");n&&e.subcategory&&(n.value=e.subcategory);const s=document.getElementById("f_price");if(s&&e.estimatedMid&&(s.value=e.estimatedMid),i){const l="data:"+d+";base64,"+i;f([l]),h("f",[l])}window.prevProfit&&window.prevProfit(),m("Pre-filled from AI identification ✓")}catch(t){console.error("FlipTrack: idAddToInventory prefill error:",t),m("Item added — some fields may need manual entry")}},200)}function P(){if(!o)return;const e=o.searchTerms||o.name||"";g();try{window.openPriceResearch&&window.openPriceResearch(),window.prSwitchTab&&window.prSwitchTab("kw");const i=document.getElementById("prKwInput");i&&(i.value=e),window.lookupByKeyword&&window.lookupByKeyword()}catch(i){console.error("FlipTrack: idSearchPrices error:",i),m("Could not open price research")}}export{g as closeIdentify,C as idAddToInventory,$ as idAnalyze,k as idCompressForAI,T as idHandleCapture,x as idRenderResults,E as idRetake,P as idSearchPrices,_ as openIdentify};
