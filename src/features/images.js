// ── IMAGE HANDLING ──────────────────────────────────────────────────────────
// Slots are static HTML — we only update src/classes, never rebuild DOM nodes.
import { inv, activeDrawId, save } from '../data/store.js';
import { toast } from '../utils/dom.js';
import { isStorageUrl, deleteImageFromStorage, uploadImageToStorage } from '../data/storage.js';
import { getSupabaseClient } from '../data/auth.js';
import { getCurrentUser } from '../data/auth.js';

let pendingAddImages = [];

export function getItemImages(item) {
  if (item.images && item.images.length) return [...item.images];
  if (item.image) return [item.image];
  return [];
}

// pfx: 'f' = add-form slots, 'd' = drawer slots
export function imgSlotChange(event, pfx, idx) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
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
    const item = inv.find(i => i.id === activeDrawId);
    if (!item) return;
    const imgs = getItemImages(item);
    const removed = imgs[idx];
    imgs.splice(idx, 1);
    item.images = imgs;
    item.image  = imgs[0] || null;
    save();
    refreshImgSlots('d', imgs);
    if (window.renderInv) window.renderInv();
    // Delete from Storage if it was a URL (not a pending base64)
    if (isStorageUrl(removed)) deleteImageFromStorage(removed);
  }
}

// Update slot visuals in place — no DOM creation/destruction
// Inputs are always in DOM; enabled/disabled via pointer-events not display:none
export function refreshImgSlots(pfx, images) {
  for (let i = 0; i < 3; i++) {
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
  refreshImgSlots('f', pendingAddImages);
}

export function renderDrawerImg(itemId) {
  const item = inv.find(i => i.id === itemId);
  refreshImgSlots('d', item ? getItemImages(item) : []);
}

export function readImgFile(file, ctx) {
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

export function openLightbox(itemId) {
  const item = inv.find(i => i.id === itemId);
  const imgs = item ? getItemImages(item) : [];
  if (imgs.length) openLightboxUrl(imgs[0]);
}
export function openLightboxUrl(url) {
  if (!url) return;
  document.getElementById('lightboxImg').src = url;
  document.getElementById('lightbox').classList.add('on');
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
      if (slotIdx >= pendingAddImages.length) pendingAddImages.push(compressed);
      else pendingAddImages[slotIdx] = compressed;
      refreshImgSlots('f', pendingAddImages);
      toast('Photo added ✓');
    } else {
      // Drawer (existing item) — show base64 immediately, upload in background
      const itemId = ctxId || savedDrawId;
      const item = inv.find(i => i.id === itemId);
      if (item) {
        const imgs = getItemImages(item);
        if (slotIdx >= imgs.length) imgs.push(compressed);
        else imgs[slotIdx] = compressed;
        item.images = imgs.slice();
        item.image  = imgs[0] || null;
        refreshImgSlots('d', item.images);
        if (window.renderInv) window.renderInv();
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
            if (window.renderInv) window.renderInv();
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
export function closeLightbox() {
  document.getElementById('lightbox').classList.remove('on');
  document.getElementById('lightboxImg').src = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
