/**
 * sourcing-mode.js — Full-screen sourcing assistant for in-store use
 * Camera capture → AI identify → comps lookup → source score → quick add
 */

import { inv, save, refresh, markDirty } from '../data/store.js';
import { uid, fmt, pct, escHtml, escAttr, localDate } from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { computeSourceScore } from './source-score.js';
import { setPendingAddImages } from '../modals/add-item.js';
import { refreshImgSlots } from './images.js';

let _sourcingOpen = false;
let _aiResult = null;
let _compsResult = null;
let _sourceVerdict = null;
let _capturedImage = null;

// ── CROSSLIST QUEUE ─────────────────────────────────────────────────────────
// Items scanned in sourcing mode can be auto-queued for crosslisting
const CROSSLIST_QUEUE_KEY = 'ft_src_crosslist_queue';

function _getCrosslistQueue() {
  try { return JSON.parse(localStorage.getItem(CROSSLIST_QUEUE_KEY) || '[]'); }
  catch { return []; }
}

function _saveCrosslistQueue(q) {
  localStorage.setItem(CROSSLIST_QUEUE_KEY, JSON.stringify(q.slice(-200)));
}

export function getSrcCrosslistQueue() { return _getCrosslistQueue(); }

export function srcRemoveFromQueue(itemId) {
  const q = _getCrosslistQueue().filter(e => e.itemId !== itemId);
  _saveCrosslistQueue(q);
  toast('Removed from crosslist queue');
}

export function srcClearQueue() {
  _saveCrosslistQueue([]);
  toast('Queue cleared');
}

export function srcQueueCount() {
  return _getCrosslistQueue().length;
}

export function openSourcingMode() {
  _sourcingOpen = true;
  _aiResult = null;
  _compsResult = null;
  _sourceVerdict = null;
  _capturedImage = null;

  const ov = document.getElementById('sourcingModeOv');
  if (!ov) return;
  ov.style.display = '';
  ov.innerHTML = _renderSourcingUI('capture');
  _startCamera();
}

export function closeSourcingMode() {
  _sourcingOpen = false;
  _stopCamera();
  const ov = document.getElementById('sourcingModeOv');
  if (ov) { ov.style.display = 'none'; ov.innerHTML = ''; }
}

// ── CAMERA ────────────────────────────────────────────────────────────────

let _stream = null;

async function _startCamera() {
  const video = document.getElementById('srcVideo');
  if (!video) return;
  try {
    _stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    video.srcObject = _stream;
  } catch (e) {
    toast('Camera access denied', true);
    console.warn('Sourcing camera:', e.message);
  }
}

function _stopCamera() {
  if (_stream) {
    _stream.getTracks().forEach(t => t.stop());
    _stream = null;
  }
}

export function srcCapture() {
  const video = document.getElementById('srcVideo');
  if (!video) return;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext('2d').drawImage(video, 0, 0);
  _capturedImage = canvas.toDataURL('image/jpeg', 0.85);
  _stopCamera();

  const ov = document.getElementById('sourcingModeOv');
  if (ov) ov.innerHTML = _renderSourcingUI('analyzing');

  // Show captured image
  const preview = document.getElementById('srcPreview');
  if (preview) preview.src = _capturedImage;

  _runAnalysis();
}

export function srcRetake() {
  _aiResult = null;
  _compsResult = null;
  _sourceVerdict = null;
  _capturedImage = null;
  const ov = document.getElementById('sourcingModeOv');
  if (ov) ov.innerHTML = _renderSourcingUI('capture');
  _startCamera();
}

// ── ANALYSIS PIPELINE ─────────────────────────────────────────────────────

async function _runAnalysis() {
  try {
    // Step 1: AI Identify
    const { idCompressForAI } = await import('./identify.js');
    const compressed = idCompressForAI(_capturedImage, 'image/jpeg');
    const aiResp = await _callIdentifyEdge(compressed);
    _aiResult = aiResp;

    // Step 2: Fetch comps
    const { fetchComps } = await import('./comps.js');
    const keyword = _aiResult.name || _aiResult.title || 'unknown item';
    _compsResult = await fetchComps(keyword, { limit: 6 });

    // Step 3: Compute source score
    const userCost = parseFloat(document.getElementById('srcCostInput')?.value) || 0;
    _sourceVerdict = computeSourceScore({
      compData: _compsResult,
      aiResult: _aiResult,
      userCost,
    });

    _renderResults();
  } catch (e) {
    console.warn('Sourcing analysis error:', e.message);
    toast('Analysis failed: ' + e.message, true);
    const ov = document.getElementById('sourcingModeOv');
    if (ov) ov.innerHTML = _renderSourcingUI('error', e.message);
  }
}

async function _callIdentifyEdge(imageData) {
  const { SB_URL, SB_KEY } = await import('../config/constants.js');
  const res = await fetch(`${SB_URL}/functions/v1/identify-item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SB_KEY}` },
    body: JSON.stringify({ image: imageData }),
  });
  if (!res.ok) throw new Error('AI identify failed');
  return res.json();
}

export function srcUpdateCost() {
  const userCost = parseFloat(document.getElementById('srcCostInput')?.value) || 0;
  if (_compsResult && _aiResult) {
    _sourceVerdict = computeSourceScore({ compData: _compsResult, aiResult: _aiResult, userCost });
    _renderResults();
  }
}

function _renderResults() {
  const ov = document.getElementById('sourcingModeOv');
  if (ov) ov.innerHTML = _renderSourcingUI('results');
}

// ── QUICK ADD TO INVENTORY ────────────────────────────────────────────────

export function srcAddToInventory() {
  if (!_aiResult) { toast('No analysis result', true); return; }

  // Capture all data before closeSourcingMode clears it
  const r = _aiResult;
  const comps = _compsResult;
  const image = _capturedImage;
  const cost = parseFloat(document.getElementById('srcCostInput')?.value) || 0;
  const price = comps?.suggestedPrice || r.suggestedPrice || 0;

  // Check if user wants to auto-queue for crosslisting
  const autoQueue = document.getElementById('srcAutoCrosslist')?.checked;
  const selectedPlatforms = [];
  if (autoQueue) {
    document.querySelectorAll('.src-plat-cb:checked').forEach(cb => {
      selectedPlatforms.push(cb.value);
    });
  }

  // Store crosslist intent for after item is added
  const crosslistIntent = autoQueue && selectedPlatforms.length > 0
    ? { platforms: selectedPlatforms, name: r.name || r.title, cost, price }
    : null;

  closeSourcingMode();

  // Switch to inventory view and open Add modal
  if (window.switchView) window.switchView('inventory', null);
  if (window.openAddModal) window.openAddModal();

  // Pre-fill form fields from sourcing analysis
  setTimeout(() => {
    try {
      const _set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };

      _set('f_name', r.name || r.title);
      _set('f_cost', cost || '');
      _set('f_price', price || '');
      _set('f_brand', r.brand);
      _set('f_source', 'Sourcing Mode');

      // Category + subcategory
      const catEl = document.getElementById('f_cat');
      if (catEl && r.category) {
        catEl.value = r.category;
        if (window.syncAddSubcat) window.syncAddSubcat();
      }
      _set('f_subcat_txt', r.subcategory);

      // Condition
      if (r.condition) {
        const condEl = document.getElementById('f_condition');
        if (condEl) condEl.value = r.condition;
        if (window.loadCondTag) window.loadCondTag('f', r.condition);
      }

      // Detail fields
      _set('f_color', r.color);
      _set('f_size', r.size);
      _set('f_material', r.material);
      _set('f_model', r.modelNumber || r.model);
      _set('f_upc', r.upc);

      // Build notes from extra AI details
      const notesParts = [];
      if (r.details) notesParts.push(r.details);
      if (r.year) notesParts.push('Year: ' + r.year);
      if (notesParts.length) _set('f_notes', notesParts.join(' | '));

      // Pass captured image to the add form
      if (image) {
        setPendingAddImages([image]);
        refreshImgSlots('f', [image]);
      }

      if (window.prevProfit) window.prevProfit();

      const filled = [r.name, r.brand, r.category, cost, price, r.condition].filter(Boolean).length;

      // Queue for crosslisting if requested
      if (crosslistIntent) {
        const q = _getCrosslistQueue();
        q.push({
          itemName: crosslistIntent.name,
          platforms: crosslistIntent.platforms,
          cost: crosslistIntent.cost,
          price: crosslistIntent.price,
          queued: new Date().toISOString(),
          itemId: null, // Will be matched after save
        });
        _saveCrosslistQueue(q);
        toast(`Pre-filled ${filled} fields · Queued for ${crosslistIntent.platforms.join(', ')}`);
      } else {
        toast(`Pre-filled ${filled} fields from scan`);
      }
    } catch (err) {
      console.error('FlipTrack: srcAddToInventory prefill error:', err);
      toast('Opened add form — some fields may need manual entry');
    }
  }, 200);
}

/** After an item is saved from sourcing, link it to the crosslist queue entry */
export function srcLinkQueueItem(itemId, itemName) {
  const q = _getCrosslistQueue();
  const entry = q.find(e => !e.itemId && e.itemName === itemName);
  if (entry) {
    entry.itemId = itemId;
    _saveCrosslistQueue(q);
  }
}

// ── UI RENDERING ──────────────────────────────────────────────────────────

function _renderSourcingUI(state, errorMsg) {
  const base = `
    <div style="position:fixed;inset:0;z-index:9999;background:var(--bg);display:flex;flex-direction:column;overflow:auto">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border)">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--text)">Sourcing Mode</div>
        <button onclick="closeSourcingMode()" style="background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:4px">✕</button>
      </div>`;

  if (state === 'capture') {
    return base + `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;gap:16px">
        <video id="srcVideo" autoplay playsinline muted style="width:100%;max-width:500px;border-radius:12px;background:#000"></video>
        <button onclick="srcCapture()" style="width:80px;height:80px;border-radius:50%;background:var(--accent);border:4px solid var(--text);cursor:pointer;font-size:24px;color:#0a0a0f">📸</button>
        <div style="font-size:12px;color:var(--muted)">Point at an item and tap to analyze</div>
      </div>
    </div>`;
  }

  if (state === 'analyzing') {
    return base + `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;gap:16px">
        <img id="srcPreview" style="width:100%;max-width:300px;border-radius:12px" alt="Captured">
        <div style="font-size:14px;color:var(--accent);font-family:'DM Mono',monospace">Analyzing...</div>
        <div style="font-size:11px;color:var(--muted)">AI identification + market comps</div>
      </div>
    </div>`;
  }

  if (state === 'error') {
    return base + `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;gap:16px">
        <div style="font-size:14px;color:var(--danger)">${escHtml(errorMsg || 'Unknown error')}</div>
        <button onclick="srcRetake()" class="btn-primary" style="padding:10px 24px">Try Again</button>
      </div>
    </div>`;
  }

  // Results state
  const v = _sourceVerdict || {};
  const verdictColor = v.verdict === 'BUY' ? 'var(--good)' : v.verdict === 'MAYBE' ? 'var(--warn)' : 'var(--danger)';
  const verdictIcon = v.verdict === 'BUY' ? '✅' : v.verdict === 'MAYBE' ? '🤔' : '❌';
  const comps = (_compsResult?.items || []).slice(0, 3);
  const cost = parseFloat(document.getElementById('srcCostInput')?.value) || 0;
  const sugPrice = _compsResult?.suggestedPrice || v.suggestedPrice || 0;
  const roi = cost > 0 && sugPrice > 0 ? ((sugPrice - cost) / cost) : 0;

  return base + `
    <div style="flex:1;overflow-y:auto;padding:16px">
      <div style="display:flex;gap:12px;margin-bottom:16px">
        <img src="${_capturedImage || ''}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;flex-shrink:0" alt="">
        <div style="flex:1">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:var(--text)">${escHtml(_aiResult?.name || 'Unknown')}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">${escHtml(_aiResult?.category || '')} ${_aiResult?.brand ? '· ' + escHtml(_aiResult.brand) : ''}</div>
        </div>
      </div>

      <div style="text-align:center;padding:16px;background:var(--surface);border-radius:10px;border:2px solid ${verdictColor};margin-bottom:16px">
        <div style="font-size:28px;margin-bottom:4px">${verdictIcon}</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:20px;color:${verdictColor}">${v.verdict || 'PASS'}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">Score: ${v.score || 0}/100</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
        <div style="background:var(--surface);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase">Suggested Price</div>
          <div style="font-family:'DM Mono',monospace;font-weight:700;font-size:16px;color:var(--good)">${fmt(sugPrice)}</div>
        </div>
        <div style="background:var(--surface);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase">ROI</div>
          <div style="font-family:'DM Mono',monospace;font-weight:700;font-size:16px;color:${roi > 0.5 ? 'var(--good)' : roi > 0 ? 'var(--warn)' : 'var(--danger)'}">${cost > 0 ? pct(roi) : '—'}</div>
        </div>
      </div>

      <div style="margin-bottom:16px">
        <label style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Your Cost</label>
        <input type="number" id="srcCostInput" placeholder="0.00" step="0.01" value="${cost || ''}" oninput="srcUpdateCost()"
          style="width:100%;padding:10px 12px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:14px;border-radius:8px;margin-top:4px;box-sizing:border-box">
      </div>

      ${comps.length ? `
        <div style="margin-bottom:16px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:8px">Recent Sold Comps</div>
          ${comps.map(c => {
            const safeUrl = (() => {
              if (!c.itemUrl) return '';
              try { const u = new URL(c.itemUrl); return (u.protocol === 'https:' || u.protocol === 'http:') ? c.itemUrl : ''; } catch { return ''; }
            })();
            const clickAttr = safeUrl ? ` onclick="window.open('${escAttr(safeUrl)}','_blank')" style="display:flex;align-items:center;gap:8px;padding:8px 6px;border-bottom:1px solid var(--border);cursor:pointer;border-radius:6px;transition:background 0.15s"` : ` style="display:flex;align-items:center;gap:8px;padding:8px 6px;border-bottom:1px solid var(--border)"`;
            return `
            <div${clickAttr}>
              ${c.image ? `<img src="${escAttr(c.image)}" style="width:44px;height:44px;object-fit:cover;border-radius:6px;flex-shrink:0" loading="lazy" alt="">` : ''}
              <div style="flex:1;overflow:hidden">
                <div style="font-size:11px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(c.title || '')}</div>
                <div style="font-size:10px;color:var(--muted)">${escHtml(c.condition || '')}${c.sold ? ' · ' + escHtml(c.sold) : ''}${safeUrl ? ' · tap to view' : ''}</div>
              </div>
              <span style="font-family:'DM Mono',monospace;font-size:13px;font-weight:700;color:var(--good)">${fmt(c.price || 0)}</span>
            </div>`;
          }).join('')}
        </div>
      ` : ''}

      ${(() => {
        const keyword = _aiResult?.name || _aiResult?.keyword || '';
        if (!keyword) return '';
        const q = encodeURIComponent(keyword);
        return `
        <div style="margin-bottom:16px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:8px">Search Marketplaces</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <a href="https://www.ebay.com/sch/i.html?_nkw=${q}&LH_Sold=1&LH_Complete=1" target="_blank" rel="noopener"
              style="padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--accent);font-size:11px;font-weight:600;text-decoration:none">eBay Sold</a>
            <a href="https://www.ebay.com/sch/i.html?_nkw=${q}" target="_blank" rel="noopener"
              style="padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11px;font-weight:600;text-decoration:none">eBay Active</a>
            <a href="https://www.mercari.com/search/?keyword=${q}" target="_blank" rel="noopener"
              style="padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11px;font-weight:600;text-decoration:none">Mercari</a>
            <a href="https://poshmark.com/search?query=${q}" target="_blank" rel="noopener"
              style="padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11px;font-weight:600;text-decoration:none">Poshmark</a>
          </div>
        </div>`;
      })()}

      <div style="margin-bottom:16px;background:var(--surface);border-radius:8px;padding:10px 12px">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:8px">
          <input type="checkbox" id="srcAutoCrosslist" onchange="srcToggleCrosslist()" style="accent-color:var(--accent)">
          <span style="font-size:12px;color:var(--text);font-weight:600">Auto-queue for crosslisting</span>
        </label>
        <div id="srcPlatformPicks" style="display:none;flex-wrap:wrap;gap:6px">
          ${['eBay','Poshmark','Mercari','Whatnot','Depop','Facebook'].map(p =>
            `<label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--muted);cursor:pointer">
              <input type="checkbox" class="src-plat-cb" value="${p}" style="accent-color:var(--accent)"> ${p}
            </label>`
          ).join('')}
        </div>
      </div>

      <div style="display:flex;gap:8px">
        <button onclick="srcRetake()" class="btn-secondary" style="flex:1;padding:12px">Retake</button>
        <button onclick="srcAddToInventory()" class="btn-primary" style="flex:1;padding:12px">Add to Inventory</button>
      </div>
    </div>
  </div>`;
}

export function srcToggleCrosslist() {
  const checked = document.getElementById('srcAutoCrosslist')?.checked;
  const picks = document.getElementById('srcPlatformPicks');
  if (picks) picks.style.display = checked ? 'flex' : 'none';
}
