let c=null,r="image/jpeg",l=null;function f(){document.getElementById("idOv").classList.add("on"),g()}function u(){document.getElementById("idOv").classList.remove("on"),c=null,l=null}function h(e){const i=e.target.files[0];if(e.target.value="",!i||!i.type.startsWith("image/"))return;r=i.type||"image/jpeg";const n=new FileReader;n.onload=t=>{const a=t.target.result;c=a.split(",")[1],document.getElementById("idPrompt").style.display="none",document.getElementById("idPreview").style.display="block",document.getElementById("idPreviewImg").src=a,document.getElementById("idCapture").classList.add("has-photo"),document.getElementById("idAnalyzeBtn").disabled=!1,document.getElementById("idResults").innerHTML=""},n.readAsDataURL(i)}function g(){c=null,l=null,document.getElementById("idPrompt").style.display="",document.getElementById("idPreview").style.display="none",document.getElementById("idPreviewImg").src="",document.getElementById("idCapture").classList.remove("has-photo"),document.getElementById("idAnalyzeBtn").disabled=!0,document.getElementById("idResults").innerHTML="",document.getElementById("idCameraInput").value="",document.getElementById("idGalleryInput").value=""}async function I(){if(!c)return;if(!_sb||!_currentUser){toast("Please sign in to use Identify",!0);return}const e=document.getElementById("idAnalyzeBtn"),i=document.getElementById("idResults");e.disabled=!0,e.textContent="✨ Analyzing…",i.innerHTML=`
    <div class="id-loading">
      <div class="id-loading-spinner"></div>
      <div class="id-loading-text">AI is analyzing your photo…</div>
      <div class="id-loading-sub">Identifying item, brand, and estimating value</div>
    </div>`;try{const n=await y(c,r),{data:t,error:a}=await _sb.functions.invoke("identify-item",{body:{image:n.data,media_type:n.type}});if(a)throw new Error(a.message||"Edge function error");if(t!=null&&t.error)throw new Error(t.error);l=t,p(t)}catch(n){console.error("FlipTrack: identify error:",n),i.innerHTML=`
      <div class="id-error">
        <div>⚠ ${escHtml(n.message||"Failed to identify item")}</div>
        <button class="id-capture-btn" onclick="idAnalyze()">Try Again</button>
      </div>`}finally{e.disabled=!1,e.textContent="✨ Identify & Value This Item"}}function y(e,i){return new Promise(n=>{const t=new Image;t.onload=()=>{let d=t.width,s=t.height;if(d>800||s>800){const m=Math.min(800/d,800/s);d=Math.round(d*m),s=Math.round(s*m)}const o=document.createElement("canvas");o.width=d,o.height=s,o.getContext("2d").drawImage(t,0,0,d,s);const v=o.toDataURL("image/jpeg",.75);n({data:v.split(",")[1],type:"image/jpeg"})},t.onerror=()=>n({data:e,type:i}),t.src="data:"+i+";base64,"+e})}function p(e){const i=document.getElementById("idResults"),n=e.confidence==="high"?"confidence-high":e.confidence==="medium"?"confidence-medium":"confidence-low",t=encodeURIComponent(e.searchTerms||e.name);i.innerHTML=`
    <div class="id-result">
      <div class="id-result-card">
        <div class="id-result-name">${escHtml(e.name||"Unknown Item")}</div>
        ${e.brand?`<div class="id-result-brand">🏷 ${escHtml(e.brand)}</div>`:""}
        ${e.details?`<div class="id-result-details">${escHtml(e.details)}</div>`:""}
        <div class="id-result-tags">
          ${e.category?`<span class="id-result-tag">${escHtml(e.category)}</span>`:""}
          ${e.subcategory?`<span class="id-result-tag">${escHtml(e.subcategory)}</span>`:""}
          ${e.condition?`<span class="id-result-tag">${escHtml(e.condition)}</span>`:""}
          <span class="id-result-tag ${n}">${(e.confidence||"unknown").toUpperCase()} CONFIDENCE</span>
        </div>

        <div class="id-value-bar">
          <div class="id-value-cell low">
            <div class="id-value-lbl">Low</div>
            <div class="id-value-amt">${e.estimatedLow?fmt(e.estimatedLow):"—"}</div>
          </div>
          <div class="id-value-cell mid">
            <div class="id-value-lbl">Typical</div>
            <div class="id-value-amt">${e.estimatedMid?fmt(e.estimatedMid):"—"}</div>
          </div>
          <div class="id-value-cell high">
            <div class="id-value-lbl">Best Case</div>
            <div class="id-value-amt">${e.estimatedHigh?fmt(e.estimatedHigh):"—"}</div>
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
    </div>`}function w(){if(!l)return;u();const e=document.querySelectorAll(".nav-tab")[1];switchView("inventory",e),openAddModal(),setTimeout(()=>{const i=l,n=document.getElementById("f_name");n&&i.name&&(n.value=i.name);const t=document.getElementById("f_cat");t&&i.category&&(t.value=i.category,syncAddSubcat());const a=document.getElementById("f_subcat_txt");a&&i.subcategory&&(a.value=i.subcategory);const d=document.getElementById("f_price");if(d&&i.estimatedMid&&(d.value=i.estimatedMid),c){const s="data:"+r+";base64,"+c;pendingAddImages=[s],refreshImgSlots("f",pendingAddImages)}prevProfit(),toast("Pre-filled from AI identification ✓")},150)}function b(){if(!l)return;u(),openPriceResearch(),prSwitchTab("kw");const e=document.getElementById("prKwInput");e&&(e.value=l.searchTerms||l.name),lookupByKeyword()}export{u as closeIdentify,w as idAddToInventory,I as idAnalyze,y as idCompressForAI,h as idHandleCapture,p as idRenderResults,g as idRetake,b as idSearchPrices,f as openIdentify};
//# sourceMappingURL=identify-BKP9EkDd.js.map
