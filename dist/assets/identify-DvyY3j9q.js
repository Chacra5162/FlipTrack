import{b as w,t as v,e as o,f as m}from"./index-CM0taMZN.js";let c=null,u="image/jpeg",l=null;function B(){document.getElementById("idOv").classList.add("on"),f()}function y(){document.getElementById("idOv").classList.remove("on"),c=null,l=null}function E(e){const i=e.target.files[0];if(e.target.value="",!i||!i.type.startsWith("image/"))return;u=i.type||"image/jpeg";const n=new FileReader;n.onload=t=>{const d=t.target.result;c=d.split(",")[1],document.getElementById("idPrompt").style.display="none",document.getElementById("idPreview").style.display="block",document.getElementById("idPreviewImg").src=d,document.getElementById("idCapture").classList.add("has-photo"),document.getElementById("idAnalyzeBtn").disabled=!1,document.getElementById("idResults").innerHTML=""},n.readAsDataURL(i)}function f(){c=null,l=null,document.getElementById("idPrompt").style.display="",document.getElementById("idPreview").style.display="none",document.getElementById("idPreviewImg").src="",document.getElementById("idCapture").classList.remove("has-photo"),document.getElementById("idAnalyzeBtn").disabled=!0,document.getElementById("idResults").innerHTML="",document.getElementById("idCameraInput").value="",document.getElementById("idGalleryInput").value=""}async function k(){if(!c)return;if(!_sb||!_currentUser){v("Please sign in to use Identify",!0);return}const e=document.getElementById("idAnalyzeBtn"),i=document.getElementById("idResults");e.disabled=!0,e.textContent="✨ Analyzing…",i.innerHTML=`
    <div class="id-loading">
      <div class="id-loading-spinner"></div>
      <div class="id-loading-text">AI is analyzing your photo…</div>
      <div class="id-loading-sub">Identifying item, brand, and estimating value</div>
    </div>`;try{const n=await h(c,u),{data:t,error:d}=await _sb.functions.invoke("identify-item",{body:{image:n.data,media_type:n.type}});if(d)throw new Error(d.message||"Edge function error");if(t!=null&&t.error)throw new Error(t.error);l=t,I(t)}catch(n){console.error("FlipTrack: identify error:",n),i.innerHTML=`
      <div class="id-error">
        <div>⚠ ${o(n.message||"Failed to identify item")}</div>
        <button class="id-capture-btn" onclick="idAnalyze()">Try Again</button>
      </div>`}finally{e.disabled=!1,e.textContent="✨ Identify & Value This Item"}}function h(e,i){return new Promise(n=>{const t=new Image;t.onload=()=>{let a=t.width,s=t.height;if(a>800||s>800){const g=Math.min(800/a,800/s);a=Math.round(a*g),s=Math.round(s*g)}const r=document.createElement("canvas");r.width=a,r.height=s,r.getContext("2d").drawImage(t,0,0,a,s);const p=r.toDataURL("image/jpeg",.75);n({data:p.split(",")[1],type:"image/jpeg"})},t.onerror=()=>n({data:e,type:i}),t.src="data:"+i+";base64,"+e})}function I(e){const i=document.getElementById("idResults"),n=e.confidence==="high"?"confidence-high":e.confidence==="medium"?"confidence-medium":"confidence-low",t=encodeURIComponent(e.searchTerms||e.name);i.innerHTML=`
    <div class="id-result">
      <div class="id-result-card">
        <div class="id-result-name">${o(e.name||"Unknown Item")}</div>
        ${e.brand?`<div class="id-result-brand">🏷 ${o(e.brand)}</div>`:""}
        ${e.details?`<div class="id-result-details">${o(e.details)}</div>`:""}
        <div class="id-result-tags">
          ${e.category?`<span class="id-result-tag">${o(e.category)}</span>`:""}
          ${e.subcategory?`<span class="id-result-tag">${o(e.subcategory)}</span>`:""}
          ${e.condition?`<span class="id-result-tag">${o(e.condition)}</span>`:""}
          <span class="id-result-tag ${n}">${(e.confidence||"unknown").toUpperCase()} CONFIDENCE</span>
        </div>

        <div class="id-value-bar">
          <div class="id-value-cell low">
            <div class="id-value-lbl">Low</div>
            <div class="id-value-amt">${e.estimatedLow?m(e.estimatedLow):"—"}</div>
          </div>
          <div class="id-value-cell mid">
            <div class="id-value-lbl">Typical</div>
            <div class="id-value-amt">${e.estimatedMid?m(e.estimatedMid):"—"}</div>
          </div>
          <div class="id-value-cell high">
            <div class="id-value-lbl">Best Case</div>
            <div class="id-value-amt">${e.estimatedHigh?m(e.estimatedHigh):"—"}</div>
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
    </div>`}function x(){if(!l)return;y();const e=document.querySelectorAll(".nav-tab")[1];window.switchView&&window.switchView("inventory",e),window.openAddModal&&window.openAddModal(),setTimeout(()=>{const i=l,n=document.getElementById("f_name");n&&i.name&&(n.value=i.name);const t=document.getElementById("f_cat");t&&i.category&&(t.value=i.category,syncAddSubcat());const d=document.getElementById("f_subcat_txt");d&&i.subcategory&&(d.value=i.subcategory);const a=document.getElementById("f_price");if(a&&i.estimatedMid&&(a.value=i.estimatedMid),c){const s="data:"+u+";base64,"+c;window.pendingAddImages&&(window.pendingAddImages.length=0,window.pendingAddImages.push(s)),w("f",[s])}window.prevProfit&&window.prevProfit(),v("Pre-filled from AI identification ✓")},150)}function A(){if(!l)return;y(),openPriceResearch(),prSwitchTab("kw");const e=document.getElementById("prKwInput");e&&(e.value=l.searchTerms||l.name),lookupByKeyword()}export{y as closeIdentify,x as idAddToInventory,k as idAnalyze,h as idCompressForAI,E as idHandleCapture,I as idRenderResults,f as idRetake,A as idSearchPrices,B as openIdentify};
