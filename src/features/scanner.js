// ── SCANNER (UPC/BARCODE) ────────────────────────────────────────────────────
import { trapFocus, releaseFocus } from '../utils/dom.js';

let _scanActive = false;
let _scanTargetId = null;
let _scanStream = null;
let _scanRaf = null;
let _quaggaActive = false;

/** Check if current scan target is an ISBN field */
function _isISBNTarget() {
  return _scanTargetId && _scanTargetId.endsWith('_isbn');
}

/** Validate a scanned value as a proper ISBN-13 (EAN-13 starting with 978 or 979) */
function _isValidISBN13(value) {
  const clean = (value || '').replace(/[^0-9]/g, '');
  if (clean.length !== 13) return false;
  if (!clean.startsWith('978') && !clean.startsWith('979')) return false;
  // Verify EAN-13 check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(clean[i]) * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(clean[12]);
}

export function _loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

export async function _ensureQuagga() {
  if (typeof Quagga !== 'undefined') return true;
  const urls = [
    'https://cdn.jsdelivr.net/npm/@ericblade/quagga2/dist/quagga.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js',
  ];
  for (const url of urls) {
    try { await _loadScript(url); if (typeof Quagga !== 'undefined') return true; } catch {}
  }
  return false;
}

export async function openScanner(targetInputId) {
  _scanTargetId = targetInputId;
  _scanActive   = true;

  document.getElementById('scannerOv').classList.add('on');
  setTimeout(() => trapFocus('#scannerOv'), 100);
  _setResult('Starting camera…', false);
  document.getElementById('scannerSub').textContent = _isISBNTarget()
    ? 'Point at the ISBN barcode (above or below the ISBN number on the back cover)'
    : 'Hold steady — auto-detects UPC, EAN, QR & more';
  document.getElementById('scannerCamSel').style.display = 'none';

  try {
    _scanStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    const video = document.getElementById('scannerVideo');
    video.srcObject = _scanStream;
    await video.play();

    _populateCamList();
    _setResult('Point camera at barcode…', false);

    if ('BarcodeDetector' in window) {
      _runNativeDetector(video);
    } else {
      // Fallback: Quagga2 — works in Safari, Firefox, all browsers
      _setResult('Loading decoder…', false);
      const ok = await _ensureQuagga();
      if (ok) {
        _runQuagga();
      } else {
        _setResult('⚠ Barcode decoder unavailable', true);
        document.getElementById('scannerSub').textContent = 'Check your connection and try again';
      }
    }
  } catch (e) {
    const msg = e ? (e.message || String(e)) : '';
    if (/permission|denied|not allowed/i.test(msg)) {
      _setResult('⚠ Camera permission denied', true);
      document.getElementById('scannerSub').textContent = 'Allow camera access in browser settings, then try again';
    } else {
      _setResult('⚠ Camera error: ' + (msg.slice(0, 80) || 'unknown'), true);
    }
  }
}

export function _runNativeDetector(video) {
  const isbnMode = _isISBNTarget();
  let detector;
  try {
    detector = new BarcodeDetector({
      formats: isbnMode
        ? ['ean_13']
        : ['ean_13','ean_8','upc_a','upc_e','code_128','code_39','qr_code','data_matrix','itf','aztec','pdf417']
    });
  } catch {
    detector = new BarcodeDetector();
  }
  const tick = async () => {
    if (!_scanActive) return;
    try {
      const codes = await detector.detect(video);
      for (const code of codes) {
        const val = code.rawValue;
        // In ISBN mode, only accept valid ISBN-13 (978/979 prefix + valid check digit)
        if (isbnMode) {
          if (_isValidISBN13(val)) { _onScanSuccess(val); return; }
          // Skip non-ISBN barcodes silently
        } else {
          _onScanSuccess(val); return;
        }
      }
    } catch {}
    _scanRaf = requestAnimationFrame(tick);
  };
  _scanRaf = requestAnimationFrame(tick);
}

export function _runQuagga() {
  _quaggaActive = true;
  const isbnMode = _isISBNTarget();
  // Quagga2 takes over the video element directly via a live stream config
  const video = document.getElementById('scannerVideo');
  Quagga.init({
    inputStream: {
      name: 'Live',
      type: 'LiveStream',
      target: video,
      constraints: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      area: { top: '20%', right: '10%', left: '10%', bottom: '20%' },
    },
    decoder: {
      readers: isbnMode
        ? ['ean_reader']
        : ['ean_reader','ean_8_reader','upc_reader','upc_e_reader','code_128_reader','code_39_reader','i2of5_reader'],
      multiple: false,
    },
    locate: true,
    numOfWorkers: 0, // 0 = main thread, avoids SharedArrayBuffer issues on iOS
  }, (err) => {
    if (err) {
      _quaggaActive = false;
      _setResult('⚠ Decoder failed to start', true);
      document.getElementById('scannerSub').textContent = err.message || String(err);
      return;
    }
    Quagga.start();
    _setResult(isbnMode ? 'Point at ISBN barcode…' : 'Point camera at barcode…', false);
  });

  Quagga.onDetected((result) => {
    if (!_scanActive || !_quaggaActive) return;
    const code = result && result.codeResult && result.codeResult.code;
    if (!code) return;
    // In ISBN mode, only accept valid ISBN-13
    if (isbnMode && !_isValidISBN13(code)) return;
    _onScanSuccess(code);
  });
}

export function _stopQuagga() {
  if (_quaggaActive) {
    _quaggaActive = false;
    try { Quagga.offDetected(); Quagga.stop(); } catch {}
  }
}

export async function _populateCamList() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter(d => d.kind === 'videoinput');
    if (cams.length < 2) return;
    const sel = document.getElementById('scannerCamSel');
    sel.innerHTML = cams.map((c, i) =>
      `<option value="${c.deviceId}">${c.label || 'Camera ' + (i + 1)}</option>`
    ).join('');
    const activeId = _scanStream && _scanStream.getVideoTracks()[0]
      && _scanStream.getVideoTracks()[0].getSettings().deviceId;
    if (activeId) sel.value = activeId;
    sel.style.display = 'block';
  } catch {}
}

export async function switchCamera(deviceId) {
  if (!_scanActive) return;
  _stopQuagga();
  _stopStream();
  try {
    _scanStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    const video = document.getElementById('scannerVideo');
    video.srcObject = _scanStream;
    await video.play();
    _setResult('Point camera at barcode…', false);
    if ('BarcodeDetector' in window) _runNativeDetector(video);
    else _runQuagga();
  } catch {
    _setResult('⚠ Could not switch camera', true);
  }
}

export function _stopStream() {
  cancelAnimationFrame(_scanRaf); _scanRaf = null;
  if (_scanStream) { _scanStream.getTracks().forEach(t => t.stop()); _scanStream = null; }
  const v = document.getElementById('scannerVideo');
  if (v) { v.pause(); v.srcObject = null; }
}

export function _setResult(text, isError) {
  const el = document.getElementById('scannerResult');
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? '#ff6b6b' : 'var(--accent)';
}

export function _onScanSuccess(value) {
  if (!_scanActive) return;
  _scanActive = false;
  const isbnMode = _isISBNTarget();
  // Clean the value — strip non-digit chars for ISBN
  const cleanValue = isbnMode ? value.replace(/[^0-9]/g, '') : value;
  const el = document.getElementById('scannerResult');
  el.innerHTML = isbnMode
    ? `✓ ISBN: <strong>${cleanValue}</strong>`
    : `✓ <strong>${value}</strong>`;
  el.style.color = 'var(--accent)';
  if (navigator.vibrate) navigator.vibrate(80);

  if (_scanTargetId === '__priceResearch__') {
    const stripped = value.replace(/^[^0-9]+/, '').trim();
    setTimeout(() => {
      closeScanner();
      document.getElementById('prUpcInput').value = stripped;
      document.getElementById('prOv').classList.add('on');
      lookupPrices();
    }, 700);
  } else {
    const input = document.getElementById(_scanTargetId);
    if (input) { input.value = cleanValue; input.dispatchEvent(new Event('input')); }
    setTimeout(() => closeScanner(), 800);
  }
}

export function closeScanner() {
  _scanActive = false;
  _stopQuagga();
  _stopStream();
  document.getElementById('scannerOv').classList.remove('on');
  releaseFocus();
  document.getElementById('scannerCamSel').style.display = 'none';
  _setResult('Point camera at barcode…', false);
  document.getElementById('scannerSub').textContent = 'Hold steady — auto-detects UPC, EAN, QR & more';
  if (_scanTargetId === '__priceResearch__') {
    document.getElementById('prOv').classList.add('on');
  }
}
