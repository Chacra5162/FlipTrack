// ── BATCH SCAN MODE ───────────────────────────────────────────────────────
import { inv, save, refresh } from '../data/store.js';
import { uid, escHtml, localDate} from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { _sfx } from '../utils/sfx.js';
import { autoSync } from '../data/sync.js';
import { _ensureQuagga } from './scanner.js';

let _batchStream = null;
let _batchActive = false;
let _batchItems  = [];
let _batchScannedCodes = new Set();
let _batchRaf = null;
let _batchTimer = null;

function _isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 820;
}

/* ── Open Batch Scan ───────────────────────────────────────────────── */
export async function openBatchScan() {
  _batchItems = [];
  _batchScannedCodes.clear();
  document.getElementById('batchOv').classList.add('on');
  document.getElementById('batchSource').value = '';
  renderBatchList();

  const camWrap = document.getElementById('batchCamWrap');
  const statusEl = document.getElementById('batchScanStatus');

  if (_isMobile()) {
    // ── Mobile: photo-capture mode (no getUserMedia needed) ──
    _batchActive = true;
    _setupMobileCapture(camWrap, statusEl);
  } else {
    // ── Desktop: live video stream ──
    try {
      _batchStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      const video = document.getElementById('batchVideo');
      video.srcObject = _batchStream;
      video.style.display = '';
      await video.play();
      _batchActive = true;
      statusEl.textContent = 'Point camera at barcodes…';

      if ('BarcodeDetector' in window) {
        _runBatchDetector(video);
      } else {
        const ok = await _ensureQuagga();
        if (ok) _runBatchQuagga(video);
        else statusEl.textContent = 'Camera ready — use + Manual to add items';
      }
    } catch(e) {
      // Desktop fallback: offer photo capture too
      console.warn('FlipTrack: batch camera error:', e.message);
      _batchActive = true;
      _setupMobileCapture(camWrap, statusEl);
    }
  }
}

/* ── Mobile photo-capture UI ───────────────────────────────────────── */
function _setupMobileCapture(camWrap, statusEl) {
  // Hide the video element
  const video = document.getElementById('batchVideo');
  if (video) video.style.display = 'none';

  // Remove old capture UI if present
  const old = document.getElementById('batchCaptureZone');
  if (old) old.remove();

  // Create capture zone
  const zone = document.createElement('div');
  zone.id = 'batchCaptureZone';
  zone.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px 16px;min-height:140px;';

  // Hidden file input (triggers native camera)
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.capture = 'environment';
  fileInput.id = 'batchCamInput';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', (e) => _onPhotoCaptured(e, statusEl));

  // Snap button
  const snapBtn = document.createElement('button');
  snapBtn.id = 'batchSnapBtn';
  snapBtn.textContent = '📷 Snap Barcode';
  snapBtn.style.cssText = 'background:var(--accent);color:#000;border:none;padding:14px 32px;font-family:"DM Mono",monospace;font-size:14px;font-weight:700;cursor:pointer;border-radius:6px;letter-spacing:0.5px;';
  snapBtn.addEventListener('click', () => fileInput.click());

  const hint = document.createElement('div');
  hint.style.cssText = 'font-size:11px;color:var(--muted);text-align:center;font-family:"DM Mono",monospace;';
  hint.textContent = 'Take a photo of each barcode — tap again for more';

  zone.appendChild(fileInput);
  zone.appendChild(snapBtn);
  zone.appendChild(hint);
  camWrap.appendChild(zone);

  statusEl.textContent = 'Tap 📷 to scan barcodes one at a time';
}

/* ── Process a captured photo ──────────────────────────────────────── */
async function _onPhotoCaptured(e, statusEl) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  statusEl.textContent = 'Analyzing photo…';

  try {
    // Load image into canvas
    const img = await _loadImageFile(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    let found = false;

    // Try BarcodeDetector first (Chrome, Edge, Safari 17.2+)
    if ('BarcodeDetector' in window) {
      try {
        let detector;
        try {
          detector = new BarcodeDetector({
            formats: ['ean_13','ean_8','upc_a','upc_e','code_128','code_39','itf']
          });
        } catch { detector = new BarcodeDetector(); }

        const codes = await detector.detect(canvas);
        for (const c of codes) {
          const val = c.rawValue.trim();
          if (val && !_batchScannedCodes.has(val)) {
            _batchScannedCodes.add(val);
            batchAddScanned(val);
            found = true;
          }
        }
      } catch (err) {
        console.warn('FlipTrack: BarcodeDetector failed on photo:', err.message);
      }
    }

    // Fallback: Quagga
    if (!found) {
      const ok = await _ensureQuagga();
      if (ok) {
        const result = await _quaggaDecodeImage(canvas);
        if (result) {
          const val = result.trim();
          if (val && !_batchScannedCodes.has(val)) {
            _batchScannedCodes.add(val);
            batchAddScanned(val);
            found = true;
          }
        }
      }
    }

    if (!found) {
      statusEl.textContent = 'No barcode found — try again closer';
      toast('No barcode detected — try a clearer photo', true);
    }
  } catch (err) {
    console.warn('FlipTrack: photo decode error:', err);
    statusEl.textContent = 'Could not read photo — try again';
  }

  // Reset file input so the same photo can be re-selected
  e.target.value = '';
}

/* ── Load an image File into an HTMLImageElement ───────────────────── */
function _loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(img.src); resolve(img); };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/* ── Quagga single-image decode (Promise wrapper) ─────────────────── */
function _quaggaDecodeImage(canvas) {
  return new Promise((resolve) => {
    try {
      Quagga.decodeSingle({
        decoder: { readers: ['ean_reader','upc_reader','upc_e_reader','code_128_reader'] },
        locate: true,
        src: canvas.toDataURL('image/jpeg', 0.85),
      }, result => {
        if (result && result.codeResult && result.codeResult.code) {
          resolve(result.codeResult.code);
        } else {
          resolve(null);
        }
      });
    } catch {
      resolve(null);
    }
  });
}

/* ── Close Batch Scan ──────────────────────────────────────────────── */
export function closeBatchScan() {
  _batchActive = false;
  if (_batchTimer) { clearTimeout(_batchTimer); _batchTimer = null; }
  if (_batchRaf) { cancelAnimationFrame(_batchRaf); _batchRaf = null; }
  if (_batchStream) { _batchStream.getTracks().forEach(t => t.stop()); _batchStream = null; }

  // Restore video, remove capture zone
  const video = document.getElementById('batchVideo');
  if (video) video.style.display = '';
  const zone = document.getElementById('batchCaptureZone');
  if (zone) zone.remove();

  document.getElementById('batchOv').classList.remove('on');
}

/* ── Desktop: live video BarcodeDetector loop ──────────────────────── */
export function _runBatchDetector(video) {
  let detector;
  try {
    detector = new BarcodeDetector({
      formats: ['ean_13','ean_8','upc_a','upc_e','code_128','code_39','itf']
    });
  } catch { detector = new BarcodeDetector(); }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  function tick() {
    if (!_batchActive) return;
    if (video.readyState >= 2) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      detector.detect(canvas).then(codes => {
        for (const c of codes) {
          const val = c.rawValue.trim();
          if (val && !_batchScannedCodes.has(val)) {
            _batchScannedCodes.add(val);
            batchAddScanned(val);
          }
        }
      }).catch(e => console.warn('FlipTrack: barcode detect failed:', e.message));
    }
    _batchRaf = requestAnimationFrame(tick);
  }
  tick();
}

/* ── Desktop: live video Quagga fallback loop ──────────────────────── */
export function _runBatchQuagga(video) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  function tick() {
    if (!_batchActive) return;
    if (video.readyState >= 2) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      Quagga.decodeSingle({
        decoder: { readers: ['ean_reader','upc_reader','upc_e_reader','code_128_reader'] },
        locate: true,
        src: canvas.toDataURL('image/jpeg', 0.8),
      }, result => {
        if (result && result.codeResult) {
          const val = result.codeResult.code.trim();
          if (val && !_batchScannedCodes.has(val)) {
            _batchScannedCodes.add(val);
            batchAddScanned(val);
          }
        }
      });
    }
    _batchTimer = setTimeout(() => { if (_batchActive) _batchRaf = requestAnimationFrame(tick); }, 500);
  }
  tick();
}

/* ── Add a scanned item ────────────────────────────────────────────── */
export function batchAddScanned(upc) {
  // Check if already in inventory
  const existing = inv.find(i => i.upc === upc);
  _batchItems.push({
    id: uid(),
    upc: upc,
    name: existing ? existing.name : '',
    cost: existing ? existing.cost : 0,
    price: existing ? existing.price : 0,
    category: existing ? (existing.category || '') : '',
    isExisting: !!existing,
  });
  _sfx.create();
  document.getElementById('batchScanStatus').textContent = 'Scanned: ' + upc + ' ✓';
  renderBatchList();
}

export function batchManualAdd() {
  _batchItems.push({
    id: uid(),
    upc: '',
    name: '',
    cost: 0,
    price: 0,
    category: '',
    isExisting: false,
  });
  renderBatchList();
  // Focus the last name input
  setTimeout(() => {
    const inputs = document.querySelectorAll('#batchList .batch-name-input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  }, 50);
}

export function batchRemoveItem(id) {
  _batchItems = _batchItems.filter(i => i.id !== id);
  renderBatchList();
}

export function renderBatchList() {
  const list = document.getElementById('batchList');
  const empty = document.getElementById('batchEmpty');
  const countEl = document.getElementById('batchCount');
  const btn = document.getElementById('batchAddBtn');

  countEl.textContent = _batchItems.length + ' item' + (_batchItems.length !== 1 ? 's' : '');
  btn.disabled = !_batchItems.length;

  if (!_batchItems.length) {
    empty.style.display = '';
    list.querySelectorAll('.batch-item').forEach(el => el.remove());
    return;
  }
  empty.style.display = 'none';

  // Rebuild items
  const html = _batchItems.map((item, idx) => `<div class="batch-item" data-batch-id="${item.id}">
    <div style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace;width:20px;text-align:center">${idx + 1}</div>
    <div class="batch-item-info">
      <input class="batch-name-input" type="text" value="${escHtml(item.name)}" placeholder="Item name *"
        oninput="_batchItems.find(i=>i.id==='${item.id}').name=this.value"
        style="background:none;border:none;border-bottom:1px solid var(--border);color:var(--text);font-size:12px;font-weight:600;width:100%;padding:3px 0;font-family:inherit">
      <div class="batch-item-upc">${item.upc ? item.upc : 'No barcode'}${item.isExisting ? ' · <span style="color:var(--accent)">found in inventory</span>' : ''}</div>
    </div>
    <div class="batch-item-fields">
      <input type="number" placeholder="Cost" value="${item.cost || ''}" step="0.01"
        oninput="_batchItems.find(i=>i.id==='${item.id}').cost=parseFloat(this.value)||0">
      <input type="number" placeholder="Price" value="${item.price || ''}" step="0.01"
        oninput="_batchItems.find(i=>i.id==='${item.id}').price=parseFloat(this.value)||0">
    </div>
    <button class="batch-item-rm" onclick="batchRemoveItem('${item.id}')">×</button>
  </div>`).join('');

  // Keep empty hidden, replace items
  const existingItems = list.querySelectorAll('.batch-item');
  existingItems.forEach(el => el.remove());
  empty.insertAdjacentHTML('afterend', html);
}

export function batchAddAll() {
  const source = document.getElementById('batchSource').value.trim();
  let added = 0;

  for (const item of _batchItems) {
    const name = item.name.trim();
    if (!name) continue;

    const cat = item.category || '';
    const skuDate = localDate().replace(/-/g,'');
    const skuCat = (cat || 'GEN').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4).padEnd(3,'X');
    const skuRand = Math.random().toString(36).slice(2,5).toUpperCase();
    const autoSku = skuCat + '-' + skuDate + '-' + skuRand;

    inv.push({
      id: uid(),
      name: name,
      sku: autoSku,
      upc: item.upc || '',
      category: cat,
      subcategory: '',
      subtype: '',
      platform: 'Other',
      platforms: [],
      cost: item.cost || 0,
      price: item.price || 0,
      qty: 1,
      bulk: false,
      fees: 0,
      ship: 0,
      lowAlert: 2,
      notes: source ? 'Batch scanned from ' + source : 'Batch scanned',
      source: source,
      images: [],
      image: null,
      added: new Date().toISOString(),
    });
    added++;
  }

  if (!added) { toast('No items with names to add', true); return; }

  save();
  refresh();
  _sfx.create();
  toast(added + ' item' + (added !== 1 ? 's' : '') + ' added to inventory ✓');
  closeBatchScan();
  autoSync();
}
