// ── BATCH SCAN MODE ───────────────────────────────────────────────────────
import { inv, save, refresh } from '../data/store.js';
import { uid, escHtml } from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { _sfx } from '../utils/sfx.js';
import { autoSync } from '../data/sync.js';

let _batchStream = null;
let _batchActive = false;
let _batchItems  = [];
let _batchScannedCodes = new Set();
let _batchRaf = null;

export async function openBatchScan() {
  _batchItems = [];
  _batchScannedCodes.clear();
  document.getElementById('batchOv').classList.add('on');
  document.getElementById('batchSource').value = '';
  renderBatchList();

  try {
    _batchStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    const video = document.getElementById('batchVideo');
    video.srcObject = _batchStream;
    await video.play();
    _batchActive = true;
    document.getElementById('batchScanStatus').textContent = 'Point camera at barcodes…';

    if ('BarcodeDetector' in window) {
      _runBatchDetector(video);
    } else {
      const ok = await _ensureQuagga();
      if (ok) _runBatchQuagga(video);
      else document.getElementById('batchScanStatus').textContent = 'Camera ready — use + Manual to add items';
    }
  } catch(e) {
    document.getElementById('batchScanStatus').textContent = 'Camera unavailable — use + Manual to add items';
  }
}

export function closeBatchScan() {
  _batchActive = false;
  if (_batchRaf) cancelAnimationFrame(_batchRaf);
  if (_batchStream) { _batchStream.getTracks().forEach(t => t.stop()); _batchStream = null; }
  document.getElementById('batchOv').classList.remove('on');
}

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
      }).catch(() => {});
    }
    _batchRaf = requestAnimationFrame(tick);
  }
  tick();
}

export function _runBatchQuagga(video) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  function tick() {
    if (!_batchActive) return;
    if (video.readyState >= 2) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
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
    setTimeout(() => { if (_batchActive) _batchRaf = requestAnimationFrame(tick); }, 500);
  }
  tick();
}

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
    const skuDate = new Date().toISOString().slice(0,10).replace(/-/g,'');
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
