// ── AI SNAP & IDENTIFY ──────────────────────────────────────────────────────
import { SB_URL } from '../config/constants.js';
import { fmt, escHtml } from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { getAccountId } from '../data/auth.js';
import { refreshImgSlots } from '../features/images.js';
import { buildPlatPicker } from '../features/platforms.js';

let _idImageData = null;   // base64 image (no prefix)
let _idMediaType = 'image/jpeg';
let _idResult    = null;   // last identification result

export function openIdentify() {
  document.getElementById('idOv').classList.add('on');
  idRetake(); // reset to capture state
}

export function closeIdentify() {
  document.getElementById('idOv').classList.remove('on');
  _idImageData = null;
  _idResult    = null;
}

export function idHandleCapture(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file || !file.type.startsWith('image/')) return;

  _idMediaType = file.type || 'image/jpeg';

  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    // Extract base64 data (strip the data:image/xxx;base64, prefix)
    _idImageData = dataUrl.split(',')[1];

    // Show preview
    document.getElementById('idPrompt').style.display = 'none';
    document.getElementById('idPreview').style.display = 'block';
    document.getElementById('idPreviewImg').src = dataUrl;
    document.getElementById('idCapture').classList.add('has-photo');
    document.getElementById('idAnalyzeBtn').disabled = false;
    document.getElementById('idResults').innerHTML = '';
  };
  reader.readAsDataURL(file);
}

export function idRetake() {
  _idImageData = null;
  _idResult    = null;
  document.getElementById('idPrompt').style.display = '';
  document.getElementById('idPreview').style.display = 'none';
  document.getElementById('idPreviewImg').src = '';
  document.getElementById('idCapture').classList.remove('has-photo');
  document.getElementById('idAnalyzeBtn').disabled = true;
  document.getElementById('idResults').innerHTML = '';
  // Reset file inputs
  document.getElementById('idCameraInput').value = '';
  document.getElementById('idGalleryInput').value = '';
}

export async function idAnalyze() {
  if (!_idImageData) return;
  if (!_sb || !_currentUser) {
    toast('Please sign in to use Identify', true);
    return;
  }

  const btn = document.getElementById('idAnalyzeBtn');
  const results = document.getElementById('idResults');
  btn.disabled = true;
  btn.textContent = '✨ Analyzing…';

  results.innerHTML = `
    <div class="id-loading">
      <div class="id-loading-spinner"></div>
      <div class="id-loading-text">AI is analyzing your photo…</div>
      <div class="id-loading-sub">Identifying item, brand, and estimating value</div>
    </div>`;

  try {
    // Compress image before sending — resize to max 800px and reduce quality
    const compressed = await idCompressForAI(_idImageData, _idMediaType);

    const { data, error } = await _sb.functions.invoke('identify-item', {
      body: { image: compressed.data, media_type: compressed.type }
    });

    if (error) throw new Error(error.message || 'Edge function error');
    if (data?.error) throw new Error(data.error);

    _idResult = data;
    idRenderResults(data);
  } catch (e) {
    console.error('FlipTrack: identify error:', e);
    results.innerHTML = `
      <div class="id-error">
        <div>⚠ ${escHtml(e.message || 'Failed to identify item')}</div>
        <button class="id-capture-btn" onclick="idAnalyze()">Try Again</button>
      </div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = '✨ Identify & Value This Item';
  }
}

// Compress image to send to AI — keep under ~500KB base64
export function idCompressForAI(base64Data, mediaType) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX_DIM = 800;
      let w = img.width, h = img.height;
      if (w > MAX_DIM || h > MAX_DIM) {
        const scale = Math.min(MAX_DIM / w, MAX_DIM / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL('image/jpeg', 0.75);
      resolve({ data: compressed.split(',')[1], type: 'image/jpeg' });
    };
    img.onerror = () => resolve({ data: base64Data, type: mediaType }); // fallback
    img.src = 'data:' + mediaType + ';base64,' + base64Data;
  });
}

export function idRenderResults(r) {
  const el = document.getElementById('idResults');
  const confCls = r.confidence === 'high' ? 'confidence-high' : r.confidence === 'medium' ? 'confidence-medium' : 'confidence-low';
  const q = encodeURIComponent(r.searchTerms || r.name);

  el.innerHTML = `
    <div class="id-result">
      <div class="id-result-card">
        <div class="id-result-name">${escHtml(r.name || 'Unknown Item')}</div>
        ${r.brand ? `<div class="id-result-brand">🏷 ${escHtml(r.brand)}</div>` : ''}
        ${r.details ? `<div class="id-result-details">${escHtml(r.details)}</div>` : ''}
        <div class="id-result-tags">
          ${r.category ? `<span class="id-result-tag">${escHtml(r.category)}</span>` : ''}
          ${r.subcategory ? `<span class="id-result-tag">${escHtml(r.subcategory)}</span>` : ''}
          ${r.condition ? `<span class="id-result-tag">${escHtml(r.condition)}</span>` : ''}
          <span class="id-result-tag ${confCls}">${(r.confidence || 'unknown').toUpperCase()} CONFIDENCE</span>
        </div>

        <div class="id-value-bar">
          <div class="id-value-cell low">
            <div class="id-value-lbl">Low</div>
            <div class="id-value-amt">${r.estimatedLow ? fmt(r.estimatedLow) : '—'}</div>
          </div>
          <div class="id-value-cell mid">
            <div class="id-value-lbl">Typical</div>
            <div class="id-value-amt">${r.estimatedMid ? fmt(r.estimatedMid) : '—'}</div>
          </div>
          <div class="id-value-cell high">
            <div class="id-value-lbl">Best Case</div>
            <div class="id-value-amt">${r.estimatedHigh ? fmt(r.estimatedHigh) : '—'}</div>
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
          <a class="pr-search-link" href="https://www.mercari.com/search/?keyword=${q}" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Mercari
          </a>
          <a class="pr-search-link" href="https://www.google.com/search?q=${q}+sold+price+resell" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Google
          </a>
        </div>
      </div>
    </div>`;
}

export function idAddToInventory() {
  if (!_idResult) return;
  closeIdentify();

  // Switch to inventory view and open Add modal
  const invTab = document.querySelectorAll('.nav-tab')[1];
  if (window.switchView) window.switchView('inventory', invTab);

  if (window.openAddModal) window.openAddModal();

  // Pre-fill form fields from identification
  setTimeout(() => {
    const r = _idResult;
    const nameEl = document.getElementById('f_name');
    if (nameEl && r.name) nameEl.value = r.name;

    const catEl = document.getElementById('f_cat');
    if (catEl && r.category) { catEl.value = r.category; syncAddSubcat(); }

    const subcatTxt = document.getElementById('f_subcat_txt');
    if (subcatTxt && r.subcategory) subcatTxt.value = r.subcategory;

    const priceEl = document.getElementById('f_price');
    if (priceEl && r.estimatedMid) priceEl.value = r.estimatedMid;

    // If we have the photo, set it as the item image
    if (_idImageData) {
      const dataUrl = 'data:' + _idMediaType + ';base64,' + _idImageData;
      if (window.pendingAddImages) {
        window.pendingAddImages.length = 0;
        window.pendingAddImages.push(dataUrl);
      }
      refreshImgSlots('f', [dataUrl]);
    }

    if (window.prevProfit) window.prevProfit();
    toast('Pre-filled from AI identification ✓');
  }, 150);
}

export function idSearchPrices() {
  if (!_idResult) return;
  closeIdentify();
  openPriceResearch();
  // Switch to keyword tab and pre-fill
  prSwitchTab('kw');
  const kwInput = document.getElementById('prKwInput');
  if (kwInput) kwInput.value = _idResult.searchTerms || _idResult.name;
  lookupByKeyword();
}
