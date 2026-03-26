/**
 * photo-tools.js — Photo Enhancement Suite
 * Background removal (Canvas-based edge detection), auto-crop,
 * watermark overlay, brightness/contrast, and batch processing.
 * All processing done client-side using Canvas API.
 */

import { inv, save, markDirty, getInvItem } from '../data/store.js';
import { toast } from '../utils/dom.js';
import { escHtml, escAttr } from '../utils/format.js';
import { getMeta, setMeta } from '../data/idb.js';

// ── SETTINGS ─────────────────────────────────────────────────────────────
let _watermarkText = 'FlipTrack';
let _watermarkOpacity = 0.3;
let _watermarkPosition = 'bottom-right'; // top-left, top-right, bottom-left, bottom-right, center
let _autoCropPadding = 10; // pixels
let _jpegQuality = 0.85;

export async function initPhotoSettings() {
  const saved = await getMeta('photo_settings');
  if (saved) {
    _watermarkText = saved.watermarkText || 'FlipTrack';
    _watermarkOpacity = saved.watermarkOpacity ?? 0.3;
    _watermarkPosition = saved.watermarkPosition || 'bottom-right';
    _autoCropPadding = saved.autoCropPadding ?? 10;
    _jpegQuality = saved.jpegQuality ?? 0.85;
  }
}

export async function savePhotoSettings(settings) {
  _watermarkText = settings.watermarkText || _watermarkText;
  _watermarkOpacity = settings.watermarkOpacity ?? _watermarkOpacity;
  _watermarkPosition = settings.watermarkPosition || _watermarkPosition;
  _autoCropPadding = settings.autoCropPadding ?? _autoCropPadding;
  _jpegQuality = settings.jpegQuality ?? _jpegQuality;
  await setMeta('photo_settings', {
    watermarkText: _watermarkText,
    watermarkOpacity: _watermarkOpacity,
    watermarkPosition: _watermarkPosition,
    autoCropPadding: _autoCropPadding,
    jpegQuality: _jpegQuality,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKGROUND REMOVAL — Simple edge-detection threshold approach
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Remove background from an image using multi-reference colour sampling,
 * gradient-aware flood fill, and Gaussian edge softening.
 * @param {string} imgSrc - Image URL or data URL
 * @param {Object} [opts]
 * @param {number} [opts.tolerance=48] - Colour distance threshold
 * @param {number} [opts.feather=3] - Edge softening blur radius
 * @returns {Promise<string>} Data URL of processed image (PNG with transparency)
 */
export async function removeBackground(imgSrc, opts = {}) {
  const tolerance = opts.tolerance ?? 48;
  const feather = opts.feather ?? 3;

  const img = await _loadImage(imgSrc);
  const canvas = document.createElement('canvas');
  const w = img.width, h = img.height;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;

  // 1. Dense edge sampling → find dominant background colours (up to 3 clusters)
  const edgeSamples = [];
  for (let x = 0; x < w; x++) {
    edgeSamples.push([d[x * 4], d[x * 4 + 1], d[x * 4 + 2]]);
    const bi = ((h - 1) * w + x) * 4;
    edgeSamples.push([d[bi], d[bi + 1], d[bi + 2]]);
  }
  for (let y = 1; y < h - 1; y++) {
    edgeSamples.push([d[(y * w) * 4], d[(y * w) * 4 + 1], d[(y * w) * 4 + 2]]);
    const ri = (y * w + w - 1) * 4;
    edgeSamples.push([d[ri], d[ri + 1], d[ri + 2]]);
  }
  edgeSamples.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
  const med = arr => { const s = arr.slice().sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
  const thirds = [
    edgeSamples.slice(0, Math.floor(edgeSamples.length / 3)),
    edgeSamples.slice(Math.floor(edgeSamples.length / 3), Math.floor(edgeSamples.length * 2 / 3)),
    edgeSamples.slice(Math.floor(edgeSamples.length * 2 / 3)),
  ];
  const bgColors = thirds.map(t => [med(t.map(s => s[0])), med(t.map(s => s[1])), med(t.map(s => s[2]))]);

  // 2. Gradient magnitude for adaptive tolerance
  const gradient = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const lx = (y * w + x - 1) * 4, rx = (y * w + x + 1) * 4;
      const ty = ((y - 1) * w + x) * 4, by = ((y + 1) * w + x) * 4;
      const gx = Math.abs(d[rx] - d[lx]) + Math.abs(d[rx + 1] - d[lx + 1]) + Math.abs(d[rx + 2] - d[lx + 2]);
      const gy = Math.abs(d[by] - d[ty]) + Math.abs(d[by + 1] - d[ty + 1]) + Math.abs(d[by + 2] - d[ty + 2]);
      gradient[y * w + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // 3. Multi-reference BFS flood fill with 8-connectivity
  const minDist = (i) => {
    let best = Infinity;
    for (const bg of bgColors) {
      const dr = d[i] - bg[0], dg = d[i + 1] - bg[1], db = d[i + 2] - bg[2];
      best = Math.min(best, Math.sqrt(dr * dr + dg * dg + db * db));
    }
    return best;
  };

  const mask = new Uint8Array(w * h);
  const queue = [];
  // Seed edges
  for (let x = 0; x < w; x++) {
    if (minDist(x * 4) < tolerance) { mask[x] = 1; queue.push(x); }
    const bi = (h - 1) * w + x;
    if (minDist(bi * 4) < tolerance) { mask[bi] = 1; queue.push(bi); }
  }
  for (let y = 1; y < h - 1; y++) {
    const li = y * w;
    if (minDist(li * 4) < tolerance) { mask[li] = 1; queue.push(li); }
    const ri = y * w + w - 1;
    if (minDist(ri * 4) < tolerance) { mask[ri] = 1; queue.push(ri); }
  }
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % w, y = (idx - x) / w;
    const nb = [];
    if (x > 0) nb.push(idx - 1);
    if (x < w - 1) nb.push(idx + 1);
    if (y > 0) nb.push(idx - w);
    if (y < h - 1) nb.push(idx + w);
    if (x > 0 && y > 0) nb.push(idx - w - 1);
    if (x < w - 1 && y > 0) nb.push(idx - w + 1);
    if (x > 0 && y < h - 1) nb.push(idx + w - 1);
    if (x < w - 1 && y < h - 1) nb.push(idx + w + 1);
    for (const n of nb) {
      if (mask[n]) continue;
      const grad = gradient[n];
      const tol = grad > 80 ? tolerance * 0.5 : grad > 40 ? tolerance * 0.75 : tolerance;
      if (minDist(n * 4) < tol) { mask[n] = 1; queue.push(n); }
    }
  }

  // 4. Gaussian-like edge softening (3-pass box blur)
  const soft = new Float32Array(w * h);
  for (let i = 0; i < mask.length; i++) soft[i] = mask[i] === 1 ? 0.0 : 1.0;
  for (let pass = 0; pass < 3; pass++) {
    const tmp = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0, cnt = 0;
        for (let dx = -feather; dx <= feather; dx++) { const nx = x + dx; if (nx >= 0 && nx < w) { sum += soft[y * w + nx]; cnt++; } }
        tmp[y * w + x] = sum / cnt;
      }
    }
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        let sum = 0, cnt = 0;
        for (let dy = -feather; dy <= feather; dy++) { const ny = y + dy; if (ny >= 0 && ny < h) { sum += tmp[ny * w + x]; cnt++; } }
        soft[y * w + x] = sum / cnt;
      }
    }
  }

  // 5. Apply alpha
  for (let i = 0; i < w * h; i++) {
    d[i * 4 + 3] = Math.round(Math.min(1, Math.max(0, soft[i])) * 255);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-CROP — Trim transparent/white edges
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Auto-crop an image by trimming near-white or transparent edges.
 * @param {string} imgSrc - Image URL or data URL
 * @param {Object} [opts]
 * @param {number} [opts.padding] - Padding around detected content
 * @param {number} [opts.threshold=250] - What counts as "white/empty"
 * @returns {Promise<string>} Data URL of cropped image
 */
export async function autoCrop(imgSrc, opts = {}) {
  const padding = opts.padding ?? _autoCropPadding;
  const threshold = opts.threshold ?? 250;

  const img = await _loadImage(imgSrc);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const w = canvas.width, h = canvas.height;

  let top = h, left = w, bottom = 0, right = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a > 10 && (r < threshold || g < threshold || b < threshold)) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }

  if (bottom <= top || right <= left) return imgSrc; // Nothing to crop

  // Add padding
  top = Math.max(0, top - padding);
  left = Math.max(0, left - padding);
  bottom = Math.min(h - 1, bottom + padding);
  right = Math.min(w - 1, right + padding);

  const cropW = right - left + 1;
  const cropH = bottom - top + 1;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = cropW;
  outCanvas.height = cropH;
  const outCtx = outCanvas.getContext('2d');
  outCtx.drawImage(canvas, left, top, cropW, cropH, 0, 0, cropW, cropH);

  return outCanvas.toDataURL('image/jpeg', _jpegQuality);
}

// ═══════════════════════════════════════════════════════════════════════════
// WATERMARK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add a text watermark to an image.
 * @param {string} imgSrc - Image URL or data URL
 * @param {Object} [opts]
 * @param {string} [opts.text] - Watermark text
 * @param {number} [opts.opacity] - 0-1
 * @param {string} [opts.position] - Position preset
 * @returns {Promise<string>} Data URL
 */
export async function addWatermark(imgSrc, opts = {}) {
  const text = opts.text || _watermarkText;
  const opacity = opts.opacity ?? _watermarkOpacity;
  const position = opts.position || _watermarkPosition;

  const img = await _loadImage(imgSrc);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // Watermark text
  const fontSize = Math.max(14, Math.round(img.width / 20));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.globalAlpha = opacity;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 2;

  const metrics = ctx.measureText(text);
  const tw = metrics.width;
  const pad = fontSize;

  let x, y;
  switch (position) {
    case 'top-left': x = pad; y = pad + fontSize; break;
    case 'top-right': x = img.width - tw - pad; y = pad + fontSize; break;
    case 'bottom-left': x = pad; y = img.height - pad; break;
    case 'center': x = (img.width - tw) / 2; y = img.height / 2; break;
    default: x = img.width - tw - pad; y = img.height - pad; // bottom-right
  }

  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;

  return canvas.toDataURL('image/jpeg', _jpegQuality);
}

// ═══════════════════════════════════════════════════════════════════════════
// BRIGHTNESS / CONTRAST / SATURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Adjust brightness and contrast of an image.
 * @param {string} imgSrc
 * @param {Object} opts
 * @param {number} [opts.brightness=0] - -100 to 100
 * @param {number} [opts.contrast=0] - -100 to 100
 * @param {number} [opts.saturation=0] - -100 to 100
 * @returns {Promise<string>} Data URL
 */
export async function adjustImage(imgSrc, opts = {}) {
  const brightness = (opts.brightness || 0) / 100;
  const contrast = (opts.contrast || 0) / 100;
  const saturation = (opts.saturation || 0) / 100;

  const img = await _loadImage(imgSrc);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');

  // Use CSS filters if supported (much faster)
  const filters = [];
  if (brightness) filters.push(`brightness(${1 + brightness})`);
  if (contrast) filters.push(`contrast(${1 + contrast})`);
  if (saturation) filters.push(`saturate(${1 + saturation})`);

  if (filters.length) ctx.filter = filters.join(' ');
  ctx.drawImage(img, 0, 0);
  ctx.filter = 'none';

  return canvas.toDataURL('image/jpeg', _jpegQuality);
}

// ═══════════════════════════════════════════════════════════════════════════
// SQUARE PADDING — Make image square with white/transparent padding
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pad image to square (marketplace-friendly).
 * @param {string} imgSrc
 * @param {Object} [opts]
 * @param {string} [opts.bgColor='#ffffff'] - Background color
 * @param {number} [opts.size=1200] - Target square size
 * @returns {Promise<string>} Data URL
 */
export async function squarePad(imgSrc, opts = {}) {
  const bgColor = opts.bgColor || '#ffffff';
  const size = opts.size || 1200;

  const img = await _loadImage(imgSrc);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Scale image to fit
  const scale = Math.min(size / img.width, size / img.height) * 0.9;
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (size - w) / 2;
  const y = (size - h) / 2;

  ctx.drawImage(img, x, y, w, h);

  return canvas.toDataURL('image/jpeg', _jpegQuality);
}

// ═══════════════════════════════════════════════════════════════════════════
// BATCH PROCESSING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Apply a set of transforms to multiple images.
 * @param {string[]} imgSrcs - Array of image URLs/data URLs
 * @param {Object} transforms - Which transforms to apply
 * @param {boolean} [transforms.removeBackground]
 * @param {boolean} [transforms.autoCrop]
 * @param {boolean} [transforms.addWatermark]
 * @param {boolean} [transforms.squarePad]
 * @param {Object} [transforms.adjust] - { brightness, contrast, saturation }
 * @param {Function} [onProgress] - callback(current, total)
 * @returns {Promise<string[]>} Processed data URLs
 */
export async function batchProcess(imgSrcs, transforms, onProgress) {
  const results = [];
  for (let i = 0; i < imgSrcs.length; i++) {
    let src = imgSrcs[i];
    try {
      if (transforms.removeBackground) src = await removeBackground(src);
      if (transforms.autoCrop) src = await autoCrop(src);
      if (transforms.adjust) src = await adjustImage(src, transforms.adjust);
      if (transforms.squarePad) src = await squarePad(src);
      if (transforms.addWatermark) src = await addWatermark(src);
      results.push(src);
    } catch (e) {
      console.warn(`Photo tool error on image ${i}:`, e.message);
      results.push(imgSrcs[i]); // Keep original on error
    }
    if (onProgress) onProgress(i + 1, imgSrcs.length);
  }
  return results;
}

/**
 * Render the photo tools UI panel (for drawer or standalone modal).
 * @param {string} imgSrc - Current image
 * @param {string} itemId - Item ID for callbacks
 * @returns {string} HTML
 */
export function renderPhotoToolsPanel(imgSrc, itemId) {
  if (!imgSrc) {
    return '<div class="pt-empty">No image to edit. Add a photo first.</div>';
  }

  return `
    <div class="pt-panel" data-item="${escHtml(itemId)}">
      <div class="pt-preview">
        <img src="${escHtml(imgSrc)}" id="ptPreview" class="pt-img" alt="Preview">
      </div>
      <div class="pt-tools">
        <button class="pt-btn" onclick="ptRemoveBg('${escAttr(itemId)}')" title="Remove background">
          🪄 Remove BG
        </button>
        <button class="pt-btn" onclick="ptAutoCrop('${escAttr(itemId)}')" title="Auto-crop whitespace">
          ✂️ Auto-Crop
        </button>
        <button class="pt-btn" onclick="ptWatermark('${escAttr(itemId)}')" title="Add watermark">
          💧 Watermark
        </button>
        <button class="pt-btn" onclick="ptSquare('${escAttr(itemId)}')" title="Square pad for marketplace">
          ⬜ Square Pad
        </button>
      </div>
      <div class="pt-sliders">
        <label class="pt-slider-row">
          <span>Brightness</span>
          <input type="range" min="-50" max="50" value="0" id="ptBrightness"
            oninput="ptAdjustPreview('${escAttr(itemId)}')">
        </label>
        <label class="pt-slider-row">
          <span>Contrast</span>
          <input type="range" min="-50" max="50" value="0" id="ptContrast"
            oninput="ptAdjustPreview('${escAttr(itemId)}')">
        </label>
      </div>
    </div>
  `;
}

// ── HELPERS ──────────────────────────────────────────────────────────────

function _loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

// Getters for settings
export function getPhotoSettings() {
  return { watermarkText: _watermarkText, watermarkOpacity: _watermarkOpacity, watermarkPosition: _watermarkPosition, autoCropPadding: _autoCropPadding, jpegQuality: _jpegQuality };
}
