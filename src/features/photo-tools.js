/**
 * photo-tools.js — Photo Enhancement Suite
 * Background removal (Canvas-based edge detection), auto-crop,
 * watermark overlay, brightness/contrast, and batch processing.
 * All processing done client-side using Canvas API.
 */

import { inv, save, markDirty, getInvItem } from '../data/store.js';
import { toast } from '../utils/dom.js';
import { escHtml } from '../utils/format.js';
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
 * Remove background from an image using luminance thresholding.
 * Works best on product photos with solid/white backgrounds.
 * @param {string} imgSrc - Image URL or data URL
 * @param {Object} [opts]
 * @param {number} [opts.threshold=240] - Luminance threshold (0-255)
 * @param {number} [opts.feather=2] - Edge feathering radius
 * @returns {Promise<string>} Data URL of processed image
 */
export async function removeBackground(imgSrc, opts = {}) {
  const threshold = opts.threshold ?? 240;
  const feather = opts.feather ?? 2;

  const img = await _loadImage(imgSrc);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Flood-fill from edges to find background
  const w = canvas.width, h = canvas.height;
  const visited = new Uint8Array(w * h);
  const isBg = new Uint8Array(w * h);
  const queue = [];

  // Seed from all edges
  for (let x = 0; x < w; x++) { queue.push(x); queue.push(x + (h - 1) * w); }
  for (let y = 0; y < h; y++) { queue.push(y * w); queue.push((w - 1) + y * w); }

  while (queue.length) {
    const idx = queue.pop();
    if (idx < 0 || idx >= w * h || visited[idx]) continue;
    visited[idx] = 1;

    const pi = idx * 4;
    const r = data[pi], g = data[pi + 1], b = data[pi + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    if (luminance >= threshold) {
      isBg[idx] = 1;
      const x = idx % w, y = Math.floor(idx / w);
      if (x > 0) queue.push(idx - 1);
      if (x < w - 1) queue.push(idx + 1);
      if (y > 0) queue.push(idx - w);
      if (y < h - 1) queue.push(idx + w);
    }
  }

  // Apply feathering and make background transparent
  for (let i = 0; i < w * h; i++) {
    if (isBg[i]) {
      data[i * 4 + 3] = 0; // Fully transparent
    } else if (feather > 0) {
      // Check distance to nearest background pixel for feathering
      const x = i % w, y = Math.floor(i / w);
      let minDist = feather + 1;
      for (let dy = -feather; dy <= feather; dy++) {
        for (let dx = -feather; dx <= feather; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h && isBg[ny * w + nx]) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            minDist = Math.min(minDist, dist);
          }
        }
      }
      if (minDist <= feather) {
        data[i * 4 + 3] = Math.round(255 * (minDist / feather));
      }
    }
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
        <button class="pt-btn" onclick="ptRemoveBg('${escHtml(itemId)}')" title="Remove background">
          🪄 Remove BG
        </button>
        <button class="pt-btn" onclick="ptAutoCrop('${escHtml(itemId)}')" title="Auto-crop whitespace">
          ✂️ Auto-Crop
        </button>
        <button class="pt-btn" onclick="ptWatermark('${escHtml(itemId)}')" title="Add watermark">
          💧 Watermark
        </button>
        <button class="pt-btn" onclick="ptSquare('${escHtml(itemId)}')" title="Square pad for marketplace">
          ⬜ Square Pad
        </button>
      </div>
      <div class="pt-sliders">
        <label class="pt-slider-row">
          <span>Brightness</span>
          <input type="range" min="-50" max="50" value="0" id="ptBrightness"
            oninput="ptAdjustPreview('${escHtml(itemId)}')">
        </label>
        <label class="pt-slider-row">
          <span>Contrast</span>
          <input type="range" min="-50" max="50" value="0" id="ptContrast"
            oninput="ptAdjustPreview('${escHtml(itemId)}')">
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
