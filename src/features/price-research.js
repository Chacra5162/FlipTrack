// ── PRICE RESEARCH ───────────────────────────────────────────────────────────

export function openPriceResearch(prefillUpc) {
  document.getElementById('prOv').classList.add('on');
  if (prefillUpc) {
    prSwitchTab('upc');
    document.getElementById('prUpcInput').value = prefillUpc;
    lookupPrices();
  } else {
    document.getElementById('prUpcInput').value = '';
    document.getElementById('prKwInput').value = '';
    document.getElementById('prBody').innerHTML = `<div class="pr-status">Scan a barcode, enter a UPC, or search by keyword to research comparable selling prices.</div>`;
  }
  setTimeout(() => {
    const active = document.getElementById('prPanelUpc').style.display !== 'none'
      ? document.getElementById('prUpcInput')
      : document.getElementById('prKwInput');
    active.focus();
  }, 200);
}

export function closePriceResearch() {
  document.getElementById('prOv').classList.remove('on');
}

export function prSwitchTab(mode) {
  const isUpc = mode === 'upc';
  document.getElementById('prTabUpc').classList.toggle('active', isUpc);
  document.getElementById('prTabKw').classList.toggle('active', !isUpc);
  document.getElementById('prPanelUpc').style.display = isUpc ? 'flex' : 'none';
  document.getElementById('prPanelKw').style.display  = isUpc ? 'none' : 'flex';
  document.getElementById('prBody').innerHTML = `<div class="pr-status">Scan a barcode, enter a UPC, or search by keyword to research comparable selling prices.</div>`;
  setTimeout(() => {
    (isUpc ? document.getElementById('prUpcInput') : document.getElementById('prKwInput')).focus();
  }, 100);
}

// Open scanner for price research
export function openPriceScanner() {
  document.getElementById('prOv').classList.remove('on');
  openScanner('__priceResearch__');
}

export async function lookupPrices() {
  const upc = document.getElementById('prUpcInput').value.trim().replace(/\D/g,'');
  if (!upc || upc.length < 6) { toast('Enter a valid UPC or EAN barcode', true); return; }

  const btn = document.getElementById('prLookupBtn');
  btn.disabled = true;
  document.getElementById('prBody').innerHTML = `<div class="pr-status"><span class="pr-spinner">⟳</span>Looking up UPC ${upc}…</div>`;

  try {
    // 1. Fetch product info from UPCitemdb (free, no key, CORS-enabled)
    let product = null;
    try {
      const res  = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) product = data.items[0];
    } catch(e) { /* API may be unavailable — continue without product info */ }

    renderPriceResults(upc, product);
  } catch(e) {
    document.getElementById('prBody').innerHTML = `<div class="pr-status">⚠ Lookup failed: ${e.message}</div>`;
  } finally {
    btn.disabled = false;
  }
}

export async function lookupByKeyword() {
  const query = document.getElementById('prKwInput').value.trim();
  if (!query) { toast('Enter a product name or keyword', true); return; }

  const btn = document.getElementById('prKwBtn');
  btn.disabled = true;
  document.getElementById('prBody').innerHTML = `<div class="pr-status"><span class="pr-spinner">⟳</span>Searching for "${query}"…</div>`;

  try {
    // Try UPCitemdb keyword search endpoint
    let results = [];
    try {
      const res  = await fetch(`https://api.upcitemdb.com/prod/trial/search?s=${encodeURIComponent(query)}&type=product`);
      const data = await res.json();
      if (data.items) results = data.items;
    } catch(e) { /* API unavailable — show search links only */ }

    renderKeywordResults(query, results);
  } catch(e) {
    document.getElementById('prBody').innerHTML = `<div class="pr-status">⚠ Search failed: ${e.message}</div>`;
  } finally {
    btn.disabled = false;
  }
}

export function renderKeywordResults(query, items) {
  const q = encodeURIComponent(query);

  // Item cards from UPCitemdb
  let itemCards = '';
  if (items.length) {
    itemCards = `<div class="pr-section-hdr">Matching Products (${items.length})</div>`;
    itemCards += items.slice(0, 12).map(item => {
      const img    = (item.images || [])[0] || '';
      const low    = item.lowest_recorded_price;
      const high   = item.highest_recorded_price;
      const offers = item.offers || [];
      const lowestOffer = offers.length ? Math.min(...offers.map(o => o.price).filter(Boolean)) : null;
      const displayPrice = lowestOffer ?? low;
      const upcLink = item.upc ? `<button class="pr-price-link" style="cursor:pointer;border:none;background:var(--surface2);padding:3px 8px;color:var(--muted);font-family:'DM Mono',monospace;font-size:10px" onclick="document.getElementById('prUpcInput').value='${item.upc}';prSwitchTab('upc');lookupPrices()">UPC lookup →</button>` : '';
      return `<div class="pr-price-row" style="align-items:flex-start;gap:10px">
        ${img ? `<img src="${img}" style="width:48px;height:48px;object-fit:contain;background:var(--surface2);border:1px solid var(--border);flex-shrink:0" onerror="this.style.display='none'">` : ''}
        <div style="flex:1;min-width:0">
          <div class="pr-price-title" style="white-space:normal;line-height:1.3">${item.title || '—'}</div>
          <div class="pr-price-meta" style="margin-top:3px">
            ${item.brand ? `<span>🏷 ${item.brand}</span> · ` : ''}
            ${item.upc   ? `<span>UPC: ${item.upc}</span>` : ''}
          </div>
          <div style="margin-top:6px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            ${displayPrice ? `<span style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:var(--accent)">${fmt(displayPrice)}</span>` : ''}
            ${high && low && high !== low ? `<span style="font-size:10px;color:var(--muted);font-family:'DM Mono',monospace">– ${fmt(high)}</span>` : ''}
            ${upcLink}
          </div>
        </div>
      </div>`;
    }).join('');
  }

  // Search links
  const searchLinks = `
    <div class="pr-section-hdr">Search Live Listings</div>
    <div class="pr-search-links">
      <a class="pr-search-link" href="https://www.ebay.com/sch/i.html?_nkw=${q}&LH_Sold=1&LH_Complete=1" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        eBay Sold
      </a>
      <a class="pr-search-link" href="https://www.ebay.com/sch/i.html?_nkw=${q}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        eBay Active
      </a>
      <a class="pr-search-link" href="https://www.amazon.com/s?k=${q}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Amazon
      </a>
      <a class="pr-search-link" href="https://poshmark.com/search?query=${q}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Poshmark
      </a>
      <a class="pr-search-link" href="https://www.mercari.com/search/?keyword=${q}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Mercari
      </a>
      <a class="pr-search-link" href="https://www.google.com/search?q=${q}+sold+price+resell" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Google
      </a>
    </div>`;

  document.getElementById('prBody').innerHTML = `
    ${itemCards || `<div class="pr-status" style="padding:24px 0 16px">No product database matches — use the search links below to find live prices.</div>`}
    ${searchLinks}
    <div style="height:20px"></div>
  `;
}

export function renderPriceResults(upc, product) {
  const name  = product?.title  || product?.description || `UPC ${upc}`;
  const brand = product?.brand  || '';
  const img   = (product?.images || [])[0] || '';
  const msrp  = product?.highest_recorded_price || null;
  const low   = product?.lowest_recorded_price  || null;
  const offers = product?.offers || [];

  // Build search queries
  const q = encodeURIComponent(name || upc);

  // Compile offers from UPCitemdb (live merchant prices when available)
  let offerRows = '';
  if (offers.length) {
    const sorted = [...offers].sort((a,b) => (a.price||999) - (b.price||999));
    offerRows = sorted.slice(0, 8).map(o => {
      const price = o.price ? fmt(o.price) : '—';
      const merchant = o.merchant || o.domain || 'Merchant';
      const cond  = o.condition ? `· ${o.condition}` : '';
      const link  = o.link || '#';
      return `<div class="pr-price-row">
        <div class="pr-price-left">
          <div class="pr-price-title">${merchant}</div>
          <div class="pr-price-meta"><span class="pr-plat-badge">${merchant}</span> ${cond}</div>
        </div>
        <div class="pr-price-right">
          <div class="pr-price-val">${price}</div>
          <a class="pr-price-link" href="${link}" target="_blank" rel="noopener">View →</a>
        </div>
      </div>`;
    }).join('');
  }

  // Stats
  let statsHtml = '';
  if (low !== null || msrp !== null || offers.length) {
    const avg = offers.length ? offers.reduce((s,o)=>s+(o.price||0),0)/offers.filter(o=>o.price).length : null;
    statsHtml = `<div class="pr-stats-bar">
      <div class="pr-stat-cell"><div class="pr-stat-lbl">Lowest</div><div class="pr-stat-val">${low ? fmt(low) : '—'}</div></div>
      <div class="pr-stat-cell"><div class="pr-stat-lbl">Avg</div><div class="pr-stat-val">${avg ? fmt(avg) : '—'}</div></div>
      <div class="pr-stat-cell"><div class="pr-stat-lbl">Highest</div><div class="pr-stat-val">${msrp ? fmt(msrp) : '—'}</div></div>
    </div>`;
  }

  // External search links
  const searchLinks = `
    <div class="pr-section-hdr">Search Live Listings</div>
    <div class="pr-search-links">
      <a class="pr-search-link" href="https://www.ebay.com/sch/i.html?_nkw=${q}&LH_Sold=1&LH_Complete=1" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        eBay Sold
      </a>
      <a class="pr-search-link" href="https://www.ebay.com/sch/i.html?_nkw=${q}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        eBay Active
      </a>
      <a class="pr-search-link" href="https://www.amazon.com/s?k=${q}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Amazon
      </a>
      <a class="pr-search-link" href="https://www.poshmark.com/search?query=${q}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Poshmark
      </a>
      <a class="pr-search-link" href="https://www.google.com/search?q=${q}+sold+price+resell" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Google
      </a>
    </div>`;

  // Product card
  const productCard = `<div class="pr-product-card">
    ${img ? `<img class="pr-product-img" src="${img}" alt="" onerror="this.style.display='none'">` : ''}
    <div>
      <div class="pr-product-name">${name}</div>
      <div class="pr-product-meta">
        ${brand ? `<span>🏷 ${brand}</span>` : ''}
        <span>📦 UPC: ${upc}</span>
        ${product?.category ? `<span>· ${product.category}</span>` : ''}
      </div>
      ${low ? `<div class="pr-product-lowest">Recorded range: <strong>${fmt(low)}</strong>${msrp ? ` – ${fmt(msrp)}` : ''}</div>` : ''}
    </div>
  </div>`;

  document.getElementById('prBody').innerHTML = `
    ${productCard}
    ${statsHtml}
    ${offerRows ? `<div class="pr-section-hdr">Current Offers</div>${offerRows}` : ''}
    ${searchLinks}
    <div style="height:20px"></div>
  `;
}
