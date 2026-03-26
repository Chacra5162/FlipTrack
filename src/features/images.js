// ── IMAGE HANDLING ──────────────────────────────────────────────────────────
// Slots are dynamically generated based on subscription tier limits.
import { inv, activeDrawId, save, getInvItem } from '../data/store.js';
import { toast, trapFocus, releaseFocus } from '../utils/dom.js';
import { isStorageUrl, deleteImageFromStorage, uploadImageToStorage } from '../data/storage.js';
import { getSupabaseClient } from '../data/auth.js';
import { getCurrentUser } from '../data/auth.js';
import { getUserTier } from '../utils/gate.js';
import { IMAGE_LIMITS } from '../config/tiers.js';

let pendingAddImages = [];

// ── IMAGE LIMIT PER TIER ─────────────────────────────────────────────────
export function getImageLimit() {
  return IMAGE_LIMITS[getUserTier()] || IMAGE_LIMITS.free;
}

// ── Single source of truth for add-form images ────────────────────────────
export function getPendingAddImages() { return pendingAddImages; }
export function setPendingAddImages(imgs) { pendingAddImages = imgs; }
export function clearPendingAddImages() { pendingAddImages = []; }

export function getItemImages(item) {
  if (item.images && item.images.length) return [...item.images];
  if (item.image) return [item.image];
  return [];
}

// ── DYNAMIC SLOT GENERATION ──────────────────────────────────────────────
let _builtSlots = { f: 0, d: 0 };

/**
 * Build image slot DOM elements inside a container.
 * Called before refreshImgSlots whenever the limit may have changed.
 */
export function buildImgSlots(pfx) {
  const max = getImageLimit();
  if (_builtSlots[pfx] === max) return; // already correct
  const wrap = document.getElementById(pfx + 'ImgWrap');
  if (!wrap) return;

  // Update label text
  const label = pfx === 'd'
    ? document.querySelector('#dImgSec .dsec-ttl span')
    : document.querySelector('#fImgWrap')?.closest('.fgrp')?.querySelector('label span');
  if (label) label.textContent = `(up to ${max})`;

  let html = '';
  for (let i = 0; i < max; i++) {
    const n = i + 1;
    html += `<div class="img-slot${i > 0 ? ' img-slot-locked' : ''}" id="${pfx}Slot${i}">
      <img id="${pfx}SlotImg${i}" src="" alt="Item photo ${n}" style="display:none" onclick="openLightboxUrl(this.src)" onkeydown="if(event.key==='Enter')openLightboxUrl(this.src)" tabindex="0" role="button">
      ${i === 0 ? `<span class="img-slot-badge" id="${pfx}SlotBadge0" style="display:none">MAIN</span>` : ''}
      <button type="button" class="img-slot-rm" id="${pfx}SlotRm${i}" style="display:none" onclick="imgSlotRemove(event,'${pfx}',${i})" aria-label="Remove photo ${n}">\u00d7</button>
      <div class="img-slot-add" id="${pfx}SlotAdd${i}"${i > 0 ? ' style="opacity:0.35"' : ''}><div class="img-slot-icon">+</div><div class="img-slot-lbl">Add Photo</div></div>
      <input type="file" id="${pfx}SlotInput${i}" accept="image/*" class="img-slot-input"${i > 0 ? ' style="pointer-events:none;opacity:0"' : ''} onchange="imgSlotChange(event,'${pfx}',${i})">
    </div>`;
  }
  wrap.innerHTML = html;
  _builtSlots[pfx] = max;
}

// pfx: 'f' = add-form slots, 'd' = drawer slots
export function imgSlotChange(event, pfx, idx) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  // Enforce tier limit
  const max = getImageLimit();
  const currentCount = pfx === 'f' ? pendingAddImages.length : (getItemImages(getInvItem(activeDrawId) || {}).length);
  if (idx >= max || currentCount >= max) {
    toast(`Upgrade to add more photos (${max} max on your plan)`, true);
    return;
  }
  // For drawer slots use the actual item ID, not 'd', so cropConfirm can find the item
  const ctx = (pfx === 'f') ? ('f:' + idx) : (activeDrawId + ':' + idx);
  readImgFile(file, ctx);
}

export function imgSlotRemove(event, pfx, idx) {
  event.stopPropagation();
  event.preventDefault();
  if (pfx === 'f') {
    pendingAddImages.splice(idx, 1);
    refreshImgSlots('f', pendingAddImages);
  } else {
    const item = getInvItem(activeDrawId);
    if (!item) return;
    const imgs = getItemImages(item);
    const removed = imgs[idx];
    imgs.splice(idx, 1);
    item.images = imgs;
    item.image  = imgs[0] || null;
    save();
    refreshImgSlots('d', imgs);
    // Delete from Storage if it was a URL (not a pending base64)
    if (isStorageUrl(removed)) deleteImageFromStorage(removed);
  }
}

// Update slot visuals in place
export function refreshImgSlots(pfx, images) {
  buildImgSlots(pfx); // ensure slots exist
  const max = getImageLimit();
  for (let i = 0; i < max; i++) {
    const slot  = document.getElementById(pfx + 'Slot' + i);
    const imgEl = document.getElementById(pfx + 'SlotImg' + i);
    const rm    = document.getElementById(pfx + 'SlotRm' + i);
    const add   = document.getElementById(pfx + 'SlotAdd' + i);
    const badge = document.getElementById(pfx + 'SlotBadge' + i);
    const input = document.getElementById(pfx + 'SlotInput' + i);
    if (!slot) continue;

    if (i < images.length) {
      // Filled — show preview, disable input so it can't intercept remove button
      slot.className = 'img-slot filled';
      imgEl.src = images[i];
      imgEl.style.display = 'block';
      if (rm)    { rm.style.display = 'flex'; }
      if (add)   { add.style.display = 'none'; }
      if (badge) { badge.style.display = i === 0 ? 'block' : 'none'; }
      if (input) { input.style.pointerEvents = 'none'; input.style.opacity = '0'; }
    } else if (i === images.length) {
      // Next available — show + icon, enable input as transparent tap target
      slot.className = 'img-slot';
      imgEl.src = ''; imgEl.style.display = 'none';
      if (rm)    { rm.style.display = 'none'; }
      if (add)   { add.style.display = 'flex'; add.style.opacity = '1'; }
      if (badge) { badge.style.display = 'none'; }
      if (input) { input.style.pointerEvents = 'auto'; input.style.opacity = '0'; }
    } else {
      // Future slot — locked/dimmed, input disabled
      slot.className = 'img-slot img-slot-locked';
      imgEl.src = ''; imgEl.style.display = 'none';
      if (rm)    { rm.style.display = 'none'; }
      if (add)   { add.style.display = 'flex'; add.style.opacity = '0.3'; }
      if (badge) { badge.style.display = 'none'; }
      if (input) { input.style.pointerEvents = 'none'; input.style.opacity = '0'; }
    }
  }
}

export function renderAddFormImages() {
  buildImgSlots('f');
  refreshImgSlots('f', pendingAddImages);
}

export function renderDrawerImg(itemId) {
  buildImgSlots('d');
  const item = getInvItem(itemId);
  refreshImgSlots('d', item ? getItemImages(item) : []);
}

const MAX_IMG_SIZE = 15 * 1024 * 1024; // 15 MB

export function readImgFile(file, ctx) {
  if (file.size > MAX_IMG_SIZE) {
    toast('Image too large (max 15 MB)', true);
    return;
  }
  const reader = new FileReader();
  reader.onload = e => openCropModal(e.target.result, file.type, ctx);
  reader.readAsDataURL(file);
}

export function imgDragOver(e) { e.preventDefault(); }
export function imgDragLeave() {}
export function imgDrop(e, pfx) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) readImgFile(file, pfx + ':0');
}

// ── LIGHTBOX STATE ──────────────────────────────────────────────────────────
let _lbImages = [];   // array of image URLs currently in lightbox
let _lbIndex  = 0;    // current index within _lbImages
let _lbSwipe  = null; // touch start coords for swipe

function _lbUpdate() {
  const img    = document.getElementById('lightboxImg');
  const counter = document.getElementById('lightboxCounter');
  const prev   = document.getElementById('lightboxPrev');
  const next   = document.getElementById('lightboxNext');
  const nameEl = document.getElementById('lightboxName');
  if (img) {
    img.src = _lbImages[_lbIndex] || '';
    if (nameEl?.textContent) {
      img.alt = nameEl.textContent + (counter?.textContent ? ` (${counter.textContent})` : '');
    }
  }
  if (counter) counter.textContent = _lbImages.length > 1 ? `${_lbIndex + 1} / ${_lbImages.length}` : '';
  if (prev) prev.style.display = _lbImages.length > 1 ? 'flex' : 'none';
  if (next) next.style.display = _lbImages.length > 1 ? 'flex' : 'none';
}

function _attachLbListeners() {
  if (_lbListenersActive) return;
  document.addEventListener('keydown', _lbKeyHandler);
  document.addEventListener('touchstart', _lbTouchStartHandler, { passive: true });
  document.addEventListener('touchend', _lbTouchEndHandler);
  _lbListenersActive = true;
}

export function openLightbox(itemId) {
  const item = getInvItem(itemId);
  _lbImages = item ? getItemImages(item) : [];
  _lbIndex = 0;
  if (_lbImages.length) {
    _lbUpdate();
    document.getElementById('lightbox').classList.add('on');
    setTimeout(() => trapFocus('#lightbox'), 100);
    _attachLbListeners();
    const nameEl = document.getElementById('lightboxName');
    if (nameEl) nameEl.textContent = item?.name || '';
  }
}

export function openLightboxUrl(url) {
  if (!url) return;
  // If called from a drawer slot, try to find the item and load all images
  const itemId = activeDrawId;
  if (itemId) {
    const item = getInvItem(itemId);
    if (item) {
      _lbImages = getItemImages(item);
      _lbIndex = Math.max(0, _lbImages.indexOf(url));
      if (_lbIndex === -1) { _lbImages = [url]; _lbIndex = 0; }
      _lbUpdate();
      document.getElementById('lightbox').classList.add('on');
      setTimeout(() => trapFocus('#lightbox'), 100);
      _attachLbListeners();
      const nameEl = document.getElementById('lightboxName');
      if (nameEl) nameEl.textContent = item.name || '';
      return;
    }
  }
  // Fallback: single image
  _lbImages = [url];
  _lbIndex = 0;
  _lbUpdate();
  document.getElementById('lightbox').classList.add('on');
  setTimeout(() => trapFocus('#lightbox'), 100);
  _attachLbListeners();
}

export function lightboxPrev() {
  if (_lbImages.length < 2) return;
  _lbIndex = (_lbIndex - 1 + _lbImages.length) % _lbImages.length;
  _lbUpdate();
}

export function lightboxNext() {
  if (_lbImages.length < 2) return;
  _lbIndex = (_lbIndex + 1) % _lbImages.length;
  _lbUpdate();
}

// ── CROP ENGINE ───────────────────────────────────────────────────────────────

let _crop = {
  ctx: null, origDataUrl: null, mimeType: null,
  img: null, scale: 1, offsetX: 0, offsetY: 0,
  rect: null,          // { x, y, w, h } in canvas display coords
  drag: null,          // 'new' | 'move' | 'nw'|'ne'|'sw'|'se'
  dragStart: null,     // { mx, my, rx, ry, rw, rh }
  aspect: null,        // null = free, else { w, h }
};

const HANDLE_R = ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 14 : 7;

export function openCropModal(dataUrl, mimeType, ctx) {
  _crop.ctx = ctx;
  _crop.origDataUrl = dataUrl;
  _crop.mimeType = mimeType;
  _crop.aspect = null;

  const img = new Image();
  img.onload = () => {
    _crop.img = img;

    const wrap = document.getElementById('cropCanvasWrap');
    const canvas = document.getElementById('cropCanvas');
    const maxW = Math.min(window.innerWidth * 0.9, 520);
    const maxH = window.innerHeight * 0.55;
    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    canvas.width  = Math.round(img.width  * scale);
    canvas.height = Math.round(img.height * scale);
    _crop.scale   = scale;

    // Default crop = full image
    _crop.rect = { x: 0, y: 0, w: canvas.width, h: canvas.height };
    cropDraw();

    // Bind events — use addEventListener with passive:false for iOS
    canvas.onmousedown  = cropMouseDown;
    canvas.onmousemove  = cropMouseMove;
    canvas.onmouseup    = cropMouseUp;
    // Remove old touch listeners before adding new ones
    canvas.removeEventListener('touchstart', cropTouchStart);
    canvas.removeEventListener('touchmove',  cropTouchMove);
    canvas.removeEventListener('touchend',   cropTouchEnd);
    canvas.addEventListener('touchstart', cropTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  cropTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   cropTouchEnd,   { passive: false });

    const ov = document.getElementById('cropOv');
    ov.style.display = 'flex';
    ov.classList.add('on');
  };
  img.src = dataUrl;
}

export function cropDraw() {
  const canvas = document.getElementById('cropCanvas');
  const c = canvas.getContext('2d');
  const { img, scale, rect } = _crop;

  c.clearRect(0, 0, canvas.width, canvas.height);
  c.drawImage(img, 0, 0, canvas.width, canvas.height);

  if (!rect) return;

  // Dim outside crop
  c.fillStyle = 'rgba(0,0,0,0.55)';
  c.fillRect(0,           0,           canvas.width, rect.y);             // top
  c.fillRect(0,           rect.y+rect.h, canvas.width, canvas.height - rect.y - rect.h); // bottom
  c.fillRect(0,           rect.y,      rect.x,       rect.h);             // left
  c.fillRect(rect.x+rect.w, rect.y,   canvas.width - rect.x - rect.w, rect.h); // right

  // Crop border
  c.strokeStyle = '#57c8ff';
  c.lineWidth = 1.5;
  c.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);

  // Rule-of-thirds grid
  c.strokeStyle = 'rgba(87,200,255,0.25)';
  c.lineWidth = 0.5;
  for (let i = 1; i < 3; i++) {
    const x = rect.x + (rect.w / 3) * i;
    const y = rect.y + (rect.h / 3) * i;
    c.beginPath(); c.moveTo(x, rect.y); c.lineTo(x, rect.y + rect.h); c.stroke();
    c.beginPath(); c.moveTo(rect.x, y); c.lineTo(rect.x + rect.w, y); c.stroke();
  }

  // Corner handles
  const corners = [
    [rect.x,          rect.y         ],
    [rect.x + rect.w, rect.y         ],
    [rect.x,          rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h],
  ];
  for (const [cx2, cy2] of corners) {
    c.fillStyle = '#57c8ff';
    c.beginPath();
    c.arc(cx2, cy2, HANDLE_R, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#0a0a0f';
    c.beginPath();
    c.arc(cx2, cy2, HANDLE_R - 2.5, 0, Math.PI * 2);
    c.fill();
  }
}

export function cropHitTest(mx, my) {
  const { rect } = _crop;
  if (!rect) return null;
  const H = HANDLE_R + 3;
  const corners = {
    nw: [rect.x,          rect.y         ],
    ne: [rect.x + rect.w, rect.y         ],
    sw: [rect.x,          rect.y + rect.h],
    se: [rect.x + rect.w, rect.y + rect.h],
  };
  for (const [key, [cx2, cy2]] of Object.entries(corners)) {
    if (Math.abs(mx - cx2) < H && Math.abs(my - cy2) < H) return key;
  }
  if (mx > rect.x && mx < rect.x + rect.w && my > rect.y && my < rect.y + rect.h) return 'move';
  return 'new';
}

export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export function cropApplyAspect(rect) {
  if (!_crop.aspect) return rect;
  const { w: aw, h: ah } = _crop.aspect;
  const canvas = document.getElementById('cropCanvas');
  // Keep width, adjust height
  let h = (rect.w / aw) * ah;
  if (rect.y + h > canvas.height) {
    h = canvas.height - rect.y;
    rect.w = (h / ah) * aw;
  }
  rect.h = h;
  return rect;
}

export function cropMouseDown(e) {
  e.preventDefault();
  const canvas = document.getElementById('cropCanvas');
  const r = canvas.getBoundingClientRect();
  const sx = canvas.width / r.width;
  const sy = canvas.height / r.height;
  cropStartDrag((e.clientX - r.left) * sx, (e.clientY - r.top) * sy);
}
export function cropMouseMove(e) {
  if (!_crop.drag) return;
  e.preventDefault();
  const canvas = document.getElementById('cropCanvas');
  const r = canvas.getBoundingClientRect();
  const sx = canvas.width / r.width;
  const sy = canvas.height / r.height;
  cropMoveDrag((e.clientX - r.left) * sx, (e.clientY - r.top) * sy);
}
export function cropMouseUp(e) { cropEndDrag(); }

// Global mouseup/touchend so dragging outside canvas still ends cleanly
document.addEventListener('mouseup', () => { if (_crop.drag) cropEndDrag(); });

export function cropTouchStart(e) {
  e.preventDefault();
  const canvas = document.getElementById('cropCanvas');
  const r = canvas.getBoundingClientRect();
  const sx = canvas.width / r.width;
  const sy = canvas.height / r.height;
  const t = e.touches[0];
  cropStartDrag((t.clientX - r.left) * sx, (t.clientY - r.top) * sy);
}
export function cropTouchMove(e) {
  e.preventDefault();
  if (!_crop.drag) return;
  const canvas = document.getElementById('cropCanvas');
  const r = canvas.getBoundingClientRect();
  const sx = canvas.width / r.width;
  const sy = canvas.height / r.height;
  const t = e.touches[0];
  cropMoveDrag((t.clientX - r.left) * sx, (t.clientY - r.top) * sy);
}
export function cropTouchEnd(e) { e.preventDefault(); cropEndDrag(); }

export function cropStartDrag(mx, my) {
  const hit = cropHitTest(mx, my);
  const r   = _crop.rect || { x:0, y:0, w:0, h:0 };
  _crop.drag      = hit;
  _crop.dragStart = { mx, my, rx: r.x, ry: r.y, rw: r.w, rh: r.h };
  const canvas = document.getElementById('cropCanvas');
  canvas.style.cursor = hit === 'move' ? 'grabbing' : hit === 'new' ? 'crosshair' : 'nwse-resize';
  if (hit === 'new') _crop.rect = { x: mx, y: my, w: 0, h: 0 };
}

export function cropMoveDrag(mx, my) {
  if (!_crop.drag) return;
  const { drag, dragStart } = _crop;
  const canvas = document.getElementById('cropCanvas');
  const CW = canvas.width, CH = canvas.height;
  const dx = mx - dragStart.mx, dy = my - dragStart.my;
  const s  = dragStart;
  let r    = { ..._crop.rect };

  if (drag === 'new') {
    r.x = Math.min(s.rx, mx); r.y = Math.min(s.ry, my);
    r.w = Math.abs(mx - s.rx); r.h = Math.abs(my - s.ry);
    if (_crop.aspect) r = cropApplyAspect(r);
  } else if (drag === 'move') {
    r.x = clamp(s.rx + dx, 0, CW - s.rw);
    r.y = clamp(s.ry + dy, 0, CH - s.rh);
  } else if (drag === 'nw') {
    const nx = clamp(s.rx + dx, 0, s.rx + s.rw - 10);
    const ny = clamp(s.ry + dy, 0, s.ry + s.rh - 10);
    r.w = s.rx + s.rw - nx; r.h = s.ry + s.rh - ny; r.x = nx; r.y = ny;
    if (_crop.aspect) { r.h = (r.w / _crop.aspect.w) * _crop.aspect.h; r.y = s.ry + s.rh - r.h; }
  } else if (drag === 'ne') {
    r.w = clamp(s.rw + dx, 10, CW - s.rx);
    const ny = clamp(s.ry + dy, 0, s.ry + s.rh - 10);
    r.h = s.ry + s.rh - ny; r.y = ny;
    if (_crop.aspect) { r.h = (r.w / _crop.aspect.w) * _crop.aspect.h; r.y = s.ry + s.rh - r.h; }
  } else if (drag === 'sw') {
    const nx = clamp(s.rx + dx, 0, s.rx + s.rw - 10);
    r.w = s.rx + s.rw - nx; r.x = nx;
    r.h = clamp(s.rh + dy, 10, CH - s.ry);
    if (_crop.aspect) r.h = (r.w / _crop.aspect.w) * _crop.aspect.h;
  } else if (drag === 'se') {
    r.w = clamp(s.rw + dx, 10, CW - s.rx);
    r.h = clamp(s.rh + dy, 10, CH - s.ry);
    if (_crop.aspect) r.h = (r.w / _crop.aspect.w) * _crop.aspect.h;
  }

  // Clamp to canvas bounds
  r.x = clamp(r.x, 0, CW); r.y = clamp(r.y, 0, CH);
  r.w = clamp(r.w, 0, CW - r.x); r.h = clamp(r.h, 0, CH - r.y);
  _crop.rect = r;
  cropDraw();
}

export function cropEndDrag() {
  _crop.drag = null;
  _crop.dragStart = null;
  document.getElementById('cropCanvas').style.cursor = 'crosshair';
}

export function cropReset() {
  const canvas = document.getElementById('cropCanvas');
  _crop.rect = { x: 0, y: 0, w: canvas.width, h: canvas.height };
  _crop.aspect = null;
  cropDraw();
}

export function cropSetAspect(aw, ah) {
  _crop.aspect = { w: aw, h: ah };
  const canvas = document.getElementById('cropCanvas');
  // Apply to current rect from center
  const r = _crop.rect || { x: 0, y: 0, w: canvas.width, h: canvas.height };
  r.h = (r.w / aw) * ah;
  if (r.y + r.h > canvas.height) {
    r.h = canvas.height - r.y;
    r.w = (r.h / ah) * aw;
  }
  _crop.rect = r;
  cropDraw();
}

/**
 * White Background — pads the image onto a square white canvas.
 * Great for marketplace listings where clean white backgrounds convert better.
 */
export function cropWhiteBg() {
  const { img, scale } = _crop;
  if (!img) return;

  // Use current crop area (or full image if no crop)
  const rect = _crop.rect || { x: 0, y: 0, w: img.width * scale, h: img.height * scale };
  const sx = rect.x / scale, sy = rect.y / scale;
  const sw = rect.w / scale, sh = rect.h / scale;

  // Create a square canvas with padding
  const maxDim = Math.max(sw, sh);
  const padding = Math.round(maxDim * 0.08);
  const canvasSize = Math.round(maxDim + padding * 2);

  const out = document.createElement('canvas');
  out.width = canvasSize;
  out.height = canvasSize;
  const c = out.getContext('2d');

  // White background
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, canvasSize, canvasSize);

  // Center the image
  const dx = Math.round((canvasSize - sw) / 2);
  const dy = Math.round((canvasSize - sh) / 2);
  c.drawImage(img, sx, sy, sw, sh, dx, dy, Math.round(sw), Math.round(sh));

  // Replace the image in crop modal
  const newDataUrl = out.toDataURL('image/jpeg', 0.92);
  const newImg = new Image();
  newImg.onload = () => {
    _crop.img = newImg;
    const canvas = document.getElementById('cropCanvas');
    const maxW = Math.min(window.innerWidth * 0.9, 520);
    const maxH = window.innerHeight * 0.55;
    const newScale = Math.min(maxW / newImg.width, maxH / newImg.height, 1);
    canvas.width = Math.round(newImg.width * newScale);
    canvas.height = Math.round(newImg.height * newScale);
    _crop.scale = newScale;
    _crop.rect = { x: 0, y: 0, w: canvas.width, h: canvas.height };
    cropDraw();
    toast('White background applied ✓');
  };
  newImg.src = newDataUrl;
}

/**
 * Auto-enhance — adjusts brightness and contrast for listing photos.
 */
export function cropAutoEnhance() {
  const { img, scale } = _crop;
  if (!img) return;

  const rect = _crop.rect || { x: 0, y: 0, w: img.width * scale, h: img.height * scale };
  const sx = rect.x / scale, sy = rect.y / scale;
  const sw = rect.w / scale, sh = rect.h / scale;

  const out = document.createElement('canvas');
  const W = Math.round(sw), H = Math.round(sh);
  out.width = W; out.height = H;
  const c = out.getContext('2d');
  c.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);

  const imgData = c.getImageData(0, 0, W, H);
  const d = imgData.data;
  const total = W * H;
  if (total < 4) { toast('Image too small to enhance'); return; }

  // 1. Build per-channel histograms
  const histR = new Uint32Array(256), histG = new Uint32Array(256), histB = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) {
    histR[d[i]]++; histG[d[i + 1]]++; histB[d[i + 2]]++;
  }

  // 2. Auto-levels with 0.5% clip on each end (removes outliers)
  const clipPx = Math.floor(total * 0.005);
  const findClip = (hist) => {
    let lo = 0, hi = 255, sumLo = 0, sumHi = 0;
    while (lo < 255 && sumLo < clipPx) sumLo += hist[lo++];
    while (hi > 0 && sumHi < clipPx) sumHi += hist[hi--];
    if (lo >= hi) { lo = 0; hi = 255; }
    return [lo, hi];
  };
  const [rLo, rHi] = findClip(histR);
  const [gLo, gHi] = findClip(histG);
  const [bLo, bHi] = findClip(histB);

  // Build lookup tables for each channel
  const buildLUT = (lo, hi) => {
    const lut = new Uint8Array(256);
    const range = hi - lo || 1;
    for (let i = 0; i < 256; i++) lut[i] = Math.min(255, Math.max(0, Math.round((i - lo) * 255 / range)));
    return lut;
  };
  const lutR = buildLUT(rLo, rHi), lutG = buildLUT(gLo, gHi), lutB = buildLUT(bLo, bHi);

  // 3. White balance correction — shift grey-point to neutral
  let avgR = 0, avgG = 0, avgB = 0, midCount = 0;
  for (let i = 0; i < d.length; i += 4) {
    const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    if (lum > 60 && lum < 200) { avgR += d[i]; avgG += d[i + 1]; avgB += d[i + 2]; midCount++; }
  }
  let wbR = 1, wbG = 1, wbB = 1;
  if (midCount > 100) {
    avgR /= midCount; avgG /= midCount; avgB /= midCount;
    const grey = (avgR + avgG + avgB) / 3;
    wbR = grey / (avgR || 1); wbG = grey / (avgG || 1); wbB = grey / (avgB || 1);
    // Clamp to prevent extreme shifts
    wbR = Math.max(0.8, Math.min(1.2, wbR));
    wbG = Math.max(0.8, Math.min(1.2, wbG));
    wbB = Math.max(0.8, Math.min(1.2, wbB));
  }

  // 4. Apply levels + white balance + saturation boost (20%)
  const satBoost = 1.20;
  for (let i = 0; i < d.length; i += 4) {
    let r = lutR[d[i]], g = lutG[d[i + 1]], b = lutB[d[i + 2]];
    // White balance
    r = Math.min(255, Math.round(r * wbR));
    g = Math.min(255, Math.round(g * wbG));
    b = Math.min(255, Math.round(b * wbB));
    // Saturation boost in-place (HSL-based)
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max !== min) {
      const mid = l / 255;
      const mixAmt = 1 - satBoost;
      r = Math.min(255, Math.max(0, Math.round(r + (l - r) * mixAmt)));
      g = Math.min(255, Math.max(0, Math.round(g + (l - g) * mixAmt)));
      b = Math.min(255, Math.max(0, Math.round(b + (l - b) * mixAmt)));
    }
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  c.putImageData(imgData, 0, 0);

  // 5. Mild sharpen via unsharp mask (composite trick)
  const sharp = document.createElement('canvas');
  sharp.width = W; sharp.height = H;
  const sc = sharp.getContext('2d');
  sc.drawImage(out, 0, 0);
  // Blur layer
  sc.filter = 'blur(1px)';
  sc.drawImage(out, 0, 0);
  sc.filter = 'none';
  // Subtract blur from original for edge emphasis
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;
  c.drawImage(out, 0, 0); // reset to leveled image
  // Blend sharpened edges
  c.globalCompositeOperation = 'overlay';
  c.globalAlpha = 0.15;
  c.drawImage(out, 0, 0);
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;

  const newDataUrl = out.toDataURL('image/jpeg', 0.92);
  const newImg = new Image();
  newImg.onload = () => {
    _crop.img = newImg;
    const canvas = document.getElementById('cropCanvas');
    const maxW = Math.min(window.innerWidth * 0.9, 520);
    const maxH = window.innerHeight * 0.55;
    const newScale = Math.min(maxW / newImg.width, maxH / newImg.height, 1);
    canvas.width = Math.round(newImg.width * newScale);
    canvas.height = Math.round(newImg.height * newScale);
    _crop.scale = newScale;
    _crop.rect = { x: 0, y: 0, w: canvas.width, h: canvas.height };
    cropDraw();
    toast('Enhanced ✓');
  };
  newImg.src = newDataUrl;
}

/**
 * Remove background — multi-reference colour sampling with adaptive tolerance,
 * gradient-aware flood fill, morphological cleanup, and Gaussian edge softening.
 */
export function cropRemoveBg() {
  const { img, scale } = _crop;
  if (!img) return;
  toast('Removing background…');

  const rect = _crop.rect || { x: 0, y: 0, w: img.width * scale, h: img.height * scale };
  const sx = rect.x / scale, sy = rect.y / scale;
  const sw = rect.w / scale, sh = rect.h / scale;

  const out = document.createElement('canvas');
  const W = Math.round(sw), H = Math.round(sh);
  out.width = W; out.height = H;
  const c = out.getContext('2d');
  c.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);

  const imgData = c.getImageData(0, 0, W, H);
  const d = imgData.data;

  // 1. Sample edge pixels densely (every pixel on all 4 edges)
  const edgeSamples = [];
  for (let x = 0; x < W; x++) {
    edgeSamples.push([d[x * 4], d[x * 4 + 1], d[x * 4 + 2]]);
    const bi = ((H - 1) * W + x) * 4;
    edgeSamples.push([d[bi], d[bi + 1], d[bi + 2]]);
  }
  for (let y = 1; y < H - 1; y++) {
    const li = (y * W) * 4;
    edgeSamples.push([d[li], d[li + 1], d[li + 2]]);
    const ri = (y * W + W - 1) * 4;
    edgeSamples.push([d[ri], d[ri + 1], d[ri + 2]]);
  }

  // 2. Cluster edge colours — find up to 3 dominant background colours via k-means-lite
  // Sort by luminance and take median of each third for multi-tone background support
  edgeSamples.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
  const median3 = (arr) => {
    const sorted = arr.slice().sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };
  const thirds = [
    edgeSamples.slice(0, Math.floor(edgeSamples.length / 3)),
    edgeSamples.slice(Math.floor(edgeSamples.length / 3), Math.floor(edgeSamples.length * 2 / 3)),
    edgeSamples.slice(Math.floor(edgeSamples.length * 2 / 3)),
  ];
  const bgColors = thirds.map(t => [
    median3(t.map(s => s[0])),
    median3(t.map(s => s[1])),
    median3(t.map(s => s[2])),
  ]);

  // 3. Compute edge gradient magnitude for adaptive tolerance
  const gradient = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const idx = (y * W + x) * 4;
      const lx = ((y * W + x - 1) * 4), rx = ((y * W + x + 1) * 4);
      const ty = (((y - 1) * W + x) * 4), by = (((y + 1) * W + x) * 4);
      const gx = Math.abs(d[rx] - d[lx]) + Math.abs(d[rx + 1] - d[lx + 1]) + Math.abs(d[rx + 2] - d[lx + 2]);
      const gy = Math.abs(d[by] - d[ty]) + Math.abs(d[by + 1] - d[ty + 1]) + Math.abs(d[by + 2] - d[ty + 2]);
      gradient[y * W + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // 4. Multi-reference flood fill with adaptive tolerance
  const BASE_TOL = 48;
  const mask = new Uint8Array(W * H); // 0=unknown, 1=bg, 2=fg
  const queue = [];

  const minColorDist = (i) => {
    let best = Infinity;
    for (const bg of bgColors) {
      const dr = d[i] - bg[0], dg = d[i + 1] - bg[1], db = d[i + 2] - bg[2];
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist < best) best = dist;
    }
    return best;
  };

  // Seed all 4 edges
  for (let x = 0; x < W; x++) {
    if (minColorDist(x * 4) < BASE_TOL) { mask[x] = 1; queue.push(x); }
    const bi = (H - 1) * W + x;
    if (minColorDist(bi * 4) < BASE_TOL) { mask[bi] = 1; queue.push(bi); }
  }
  for (let y = 1; y < H - 1; y++) {
    const li = y * W;
    if (minColorDist(li * 4) < BASE_TOL) { mask[li] = 1; queue.push(li); }
    const ri = y * W + W - 1;
    if (minColorDist(ri * 4) < BASE_TOL) { mask[ri] = 1; queue.push(ri); }
  }

  // BFS with gradient-adaptive tolerance
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % W, y = (idx - x) / W;
    const neighbors = [];
    if (x > 0) neighbors.push(idx - 1);
    if (x < W - 1) neighbors.push(idx + 1);
    if (y > 0) neighbors.push(idx - W);
    if (y < H - 1) neighbors.push(idx + W);
    // 8-connected for better fill
    if (x > 0 && y > 0) neighbors.push(idx - W - 1);
    if (x < W - 1 && y > 0) neighbors.push(idx - W + 1);
    if (x > 0 && y < H - 1) neighbors.push(idx + W - 1);
    if (x < W - 1 && y < H - 1) neighbors.push(idx + W + 1);
    for (const n of neighbors) {
      if (mask[n] !== 0) continue;
      // Reduce tolerance at high-gradient edges (where subject meets background)
      const grad = gradient[n];
      const tol = grad > 80 ? BASE_TOL * 0.5 : grad > 40 ? BASE_TOL * 0.75 : BASE_TOL;
      if (minColorDist(n * 4) < tol) {
        mask[n] = 1;
        queue.push(n);
      }
    }
  }

  // 5. Morphological close (dilate then erode) to fill small holes in foreground
  const morphR = 2;
  const morphTemp = new Uint8Array(W * H);
  // Dilate foreground (erode background)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let hasFg = false;
      for (let dy = -morphR; dy <= morphR && !hasFg; dy++) {
        for (let dx = -morphR; dx <= morphR && !hasFg; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < H && nx >= 0 && nx < W && mask[ny * W + nx] !== 1) hasFg = true;
        }
      }
      morphTemp[y * W + x] = hasFg ? 0 : 1;
    }
  }
  // Erode back (dilate background)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let hasBg = false;
      for (let dy = -morphR; dy <= morphR && !hasBg; dy++) {
        for (let dx = -morphR; dx <= morphR && !hasBg; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < H && nx >= 0 && nx < W && morphTemp[ny * W + nx] === 1) hasBg = true;
        }
      }
      mask[y * W + x] = hasBg ? 1 : (mask[y * W + x] === 1 ? 1 : 0);
    }
  }

  // 6. Build soft alpha mask with Gaussian-like blur (3-pass box blur, radius 3)
  const soft = new Float32Array(W * H);
  for (let i = 0; i < mask.length; i++) soft[i] = mask[i] === 1 ? 0.0 : 1.0;

  const blurR = 3;
  const blurPasses = 3; // 3-pass box blur approximates Gaussian
  for (let pass = 0; pass < blurPasses; pass++) {
    const tmp = new Float32Array(W * H);
    // Horizontal
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let sum = 0, cnt = 0;
        for (let dx = -blurR; dx <= blurR; dx++) {
          const nx = x + dx;
          if (nx >= 0 && nx < W) { sum += soft[y * W + nx]; cnt++; }
        }
        tmp[y * W + x] = sum / cnt;
      }
    }
    // Vertical
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        let sum = 0, cnt = 0;
        for (let dy = -blurR; dy <= blurR; dy++) {
          const ny = y + dy;
          if (ny >= 0 && ny < H) { sum += tmp[ny * W + x]; cnt++; }
        }
        soft[y * W + x] = sum / cnt;
      }
    }
  }

  // 7. Composite onto white background using softened alpha
  for (let i = 0; i < W * H; i++) {
    const a = Math.min(1, Math.max(0, soft[i]));
    const pi = i * 4;
    d[pi]     = Math.round(d[pi]     * a + 255 * (1 - a));
    d[pi + 1] = Math.round(d[pi + 1] * a + 255 * (1 - a));
    d[pi + 2] = Math.round(d[pi + 2] * a + 255 * (1 - a));
    d[pi + 3] = 255;
  }
  c.putImageData(imgData, 0, 0);

  const newDataUrl = out.toDataURL('image/jpeg', 0.92);
  const newImg = new Image();
  newImg.onload = () => {
    _crop.img = newImg;
    const canvas = document.getElementById('cropCanvas');
    const maxW = Math.min(window.innerWidth * 0.9, 520);
    const maxH = window.innerHeight * 0.55;
    const newScale = Math.min(maxW / newImg.width, maxH / newImg.height, 1);
    canvas.width = Math.round(newImg.width * newScale);
    canvas.height = Math.round(newImg.height * newScale);
    _crop.scale = newScale;
    _crop.rect = { x: 0, y: 0, w: canvas.width, h: canvas.height };
    cropDraw();
    toast('Background removed ✓');
  };
  newImg.src = newDataUrl;
}

/**
 * Rotate image 90° clockwise.
 */
export function cropRotate() {
  const { img, scale } = _crop;
  if (!img) return;

  const out = document.createElement('canvas');
  out.width = img.height;
  out.height = img.width;
  const c = out.getContext('2d');
  c.translate(out.width, 0);
  c.rotate(Math.PI / 2);
  c.drawImage(img, 0, 0);

  const newDataUrl = out.toDataURL('image/jpeg', 0.92);
  const newImg = new Image();
  newImg.onload = () => {
    _crop.img = newImg;
    const canvas = document.getElementById('cropCanvas');
    const maxW = Math.min(window.innerWidth * 0.9, 520);
    const maxH = window.innerHeight * 0.55;
    const newScale = Math.min(maxW / newImg.width, maxH / newImg.height, 1);
    canvas.width = Math.round(newImg.width * newScale);
    canvas.height = Math.round(newImg.height * newScale);
    _crop.scale = newScale;
    _crop.rect = { x: 0, y: 0, w: canvas.width, h: canvas.height };
    cropDraw();
    toast('Rotated 90° ✓');
  };
  newImg.src = newDataUrl;
}

export function cropCancel() {
  const ov = document.getElementById('cropOv');
  ov.classList.remove('on');
  ov.style.display = 'none';
  _crop = { ctx: null, origDataUrl: null, mimeType: null, img: null, scale: 1, rect: null, drag: null, dragStart: null, aspect: null };
}

export function cropConfirm() {
  const { img, rect, scale, ctx, mimeType } = _crop;
  if (!img || !rect || rect.w < 2 || rect.h < 2) { cropCancel(); return; }

  // Convert display coords → original image coords
  const sx = rect.x / scale, sy = rect.y / scale;
  const sw = rect.w / scale, sh = rect.h / scale;

  const out = document.createElement('canvas');
  out.width  = Math.round(sw);
  out.height = Math.round(sh);
  out.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, out.width, out.height);

  const cropped = out.toDataURL('image/jpeg', 0.92);

  // Close overlay immediately — use explicit 'none' not '' so iOS definitely hides it
  const ov = document.getElementById('cropOv');
  ov.classList.remove('on');
  ov.style.display = 'none';

  // Capture state before any async work
  const savedCtx = ctx;
  const savedDrawId = activeDrawId;
  _crop = { ctx: null, origDataUrl: null, mimeType: null, img: null, scale: 1, rect: null, drag: null, dragStart: null, aspect: null };

  compressImage(cropped, mimeType, (compressed, didCompress) => {
    const [ctxId, slotStr] = (savedCtx || '').split(':');
    const slotIdx = parseInt(slotStr) || 0;

    if (ctxId === 'f') {
      // Add form — store base64 for immediate preview; upload happens in addItem()
      const fMax = getImageLimit();
      if (pendingAddImages.length >= fMax && slotIdx >= fMax) {
        toast(`Photo limit reached (${fMax} on your plan)`, true); return;
      }
      if (slotIdx >= pendingAddImages.length) pendingAddImages.push(compressed);
      else pendingAddImages[slotIdx] = compressed;
      refreshImgSlots('f', pendingAddImages);
      toast('Photo added ✓');
    } else {
      // Drawer (existing item) — show base64 immediately, upload in background
      const itemId = ctxId || savedDrawId;
      const item = getInvItem(itemId);
      if (item) {
        const imgs = getItemImages(item);
        const dMax = getImageLimit();
        if (imgs.length >= dMax && slotIdx >= dMax) {
          toast(`Photo limit reached (${dMax} on your plan)`, true); return;
        }
        if (slotIdx >= imgs.length) imgs.push(compressed);
        else imgs[slotIdx] = compressed;
        item.images = imgs.slice();
        item.image  = imgs[0] || null;
        refreshImgSlots('d', item.images);
        toast('Photo added — uploading…');

        // Upload to Storage, replace base64 with URL
        uploadImageToStorage(compressed, itemId, slotIdx)
          .then(url => {
            const current = getItemImages(item);
            const bi = current.indexOf(compressed);
            if (bi !== -1) current[bi] = url;
            else current[slotIdx] = url;
            item.images = current;
            item.image  = current[0] || null;
            save();
            refreshImgSlots('d', item.images);
            toast('Photo saved ✓');
          })
          .catch(e => {
            console.warn('FlipTrack: upload failed, keeping base64:', e.message);
            save(); // save base64 as fallback
            toast('Photo saved locally ✓');
          });
      }
    }
  });
}

/**
 * Compress a base64 image to fit under TARGET_KB using a canvas.
 * Iteratively reduces quality and/or dimensions until small enough.
 */
export function compressImage(dataUrl, mimeType, callback) {
  const TARGET_KB = 200;         // target storage size in KB (~270KB base64 string)
  const MAX_DIM   = 900;         // max width or height in px
  const MIN_QUALITY = 0.30;      // don't go below 30% quality
  const outputType  = 'image/jpeg'; // always output JPEG for compression

  const img = new Image();
  img.onload = () => {
    // Check if compression is needed
    const originalKB = Math.round(dataUrl.length * 0.75 / 1024);
    if (originalKB <= TARGET_KB && img.width <= MAX_DIM && img.height <= MAX_DIM) {
      callback(dataUrl, false); // already small enough
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx2   = canvas.getContext('2d');

    // Scale down if dimensions exceed MAX_DIM
    let w = img.width, h = img.height;
    if (w > MAX_DIM || h > MAX_DIM) {
      const scale = Math.min(MAX_DIM / w, MAX_DIM / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    canvas.width  = w;
    canvas.height = h;
    ctx2.drawImage(img, 0, 0, w, h);

    // Binary-search quality down until under TARGET_KB
    let quality = 0.85;
    let result  = canvas.toDataURL(outputType, quality);

    while (result.length * 0.75 / 1024 > TARGET_KB && quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - 0.10);
      result  = canvas.toDataURL(outputType, quality);
    }

    // If still over (very large image at min quality), halve dimensions once more
    if (result.length * 0.75 / 1024 > TARGET_KB) {
      canvas.width  = Math.round(w * 0.65);
      canvas.height = Math.round(h * 0.65);
      ctx2.drawImage(img, 0, 0, canvas.width, canvas.height);
      result = canvas.toDataURL(outputType, MIN_QUALITY);
    }

    callback(result, true);
  };
  img.src = dataUrl;
}

// LIGHTBOX
// Named handlers for proper cleanup
function _lbKeyHandler(e) {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('on')) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowLeft') lightboxPrev();
  else if (e.key === 'ArrowRight') lightboxNext();
}
let _lbTouchX = 0;
function _lbTouchStartHandler(e) {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('on')) return;
  _lbTouchX = e.touches[0].clientX;
}
function _lbTouchEndHandler(e) {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('on') || !_lbTouchX) return;
  const diff = e.changedTouches[0].clientX - _lbTouchX;
  _lbTouchX = 0;
  if (Math.abs(diff) < 50) return;
  if (diff > 0) lightboxPrev();
  else lightboxNext();
}
let _lbListenersActive = false;

export function closeLightbox() {
  document.getElementById('lightbox').classList.remove('on');
  releaseFocus();
  document.getElementById('lightboxImg').src = '';
  _lbImages = [];
  _lbIndex = 0;
  // Clean up global listeners
  if (_lbListenersActive) {
    document.removeEventListener('keydown', _lbKeyHandler);
    document.removeEventListener('touchstart', _lbTouchStartHandler);
    document.removeEventListener('touchend', _lbTouchEndHandler);
    _lbListenersActive = false;
  }
}
