/**
 * social-gallery.js — Inventory Photo Gallery / Social Content
 * Generate branded photo collages from inventory for Instagram/TikTok.
 * Layouts: 2x2 grid, 3x3 grid, single hero with details.
 */

import { getInvItem } from '../data/store.js';
import { getItemImages } from './images.js';
import { fmt, escHtml, escAttr } from '../utils/format.js';
import { toast, trapFocus, releaseFocus } from '../utils/dom.js';

const LAYOUTS = {
  '2x2':    { cols: 2, rows: 2, w: 1080, h: 1080, label: '2x2 Grid' },
  '3x3':    { cols: 3, rows: 3, w: 1080, h: 1080, label: '3x3 Grid' },
  'hero':   { cols: 1, rows: 1, w: 1080, h: 1350, label: 'Single Hero' },
  'stories': { cols: 2, rows: 3, w: 1080, h: 1920, label: 'Stories' },
};

const ACCENT = '#57c8ff';
const BG = '#0d1117';
const TEXT = '#e6edf3';

let _selectedItems = [];
let _currentLayout = '2x2';

function _loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Generate a collage canvas from selected items.
 * @param {string[]} itemIds - Inventory item IDs
 * @param {string} layout - Layout key from LAYOUTS
 * @returns {Promise<string>} data URL of collage
 */
export async function generateCollage(itemIds, layout = '2x2') {
  const cfg = LAYOUTS[layout] || LAYOUTS['2x2'];
  const canvas = document.createElement('canvas');
  canvas.width = cfg.w;
  canvas.height = cfg.h;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, cfg.w, cfg.h);

  const items = itemIds.map(id => getInvItem(id)).filter(Boolean);
  const maxCells = cfg.cols * cfg.rows;
  const cellItems = items.slice(0, maxCells);

  if (layout === 'hero' && cellItems.length) {
    // Single hero layout with item details
    await _renderHero(ctx, cellItems[0], cfg);
  } else {
    // Grid layout
    const pad = 4;
    const cellW = (cfg.w - pad * (cfg.cols + 1)) / cfg.cols;
    const cellH = ((cfg.h - 60) - pad * (cfg.rows + 1)) / cfg.rows; // Reserve 60px for header

    // Header
    ctx.fillStyle = ACCENT;
    ctx.font = '700 24px "Syne", sans-serif';
    ctx.fillText('FlipTrack', 20, 35);
    ctx.fillStyle = '#8b949e';
    ctx.font = '400 13px "DM Mono", monospace';
    ctx.fillText(`${cellItems.length} items`, cfg.w - 20 - ctx.measureText(`${cellItems.length} items`).width, 35);

    const yOffset = 50;

    for (let i = 0; i < cellItems.length; i++) {
      const col = i % cfg.cols;
      const row = Math.floor(i / cfg.cols);
      const x = pad + col * (cellW + pad);
      const y = yOffset + pad + row * (cellH + pad);

      const imgs = getItemImages(cellItems[i]);
      if (imgs[0]) {
        try {
          const img = await _loadImage(imgs[0]);
          // Draw image filling cell (cover)
          const scale = Math.max(cellW / img.width, cellH / img.height);
          const sw = cellW / scale, sh = cellH / scale;
          const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
          ctx.drawImage(img, sx, sy, sw, sh, x, y, cellW, cellH);
        } catch {
          ctx.fillStyle = '#161b22';
          ctx.fillRect(x, y, cellW, cellH);
        }
      } else {
        ctx.fillStyle = '#161b22';
        ctx.fillRect(x, y, cellW, cellH);
      }

      // Price overlay
      const item = cellItems[i];
      if (item.price) {
        const priceText = fmt(item.price);
        ctx.font = '700 16px "DM Mono", monospace';
        const tw = ctx.measureText(priceText).width;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x + cellW - tw - 14, y + cellH - 28, tw + 10, 24);
        ctx.fillStyle = ACCENT;
        ctx.fillText(priceText, x + cellW - tw - 9, y + cellH - 10);
      }

      // Name overlay
      if (item.name) {
        const name = item.name.length > 25 ? item.name.slice(0, 22) + '...' : item.name;
        ctx.font = '500 12px "Syne", sans-serif';
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x, y, cellW, 24);
        ctx.fillStyle = TEXT;
        ctx.fillText(name, x + 6, y + 16);
      }
    }
  }

  // Watermark
  ctx.fillStyle = 'rgba(87,200,255,0.25)';
  ctx.font = '400 10px "DM Mono", monospace';
  ctx.fillText('FlipTrack', cfg.w - 70, cfg.h - 8);

  return canvas.toDataURL('image/png');
}

async function _renderHero(ctx, item, cfg) {
  const imgs = getItemImages(item);

  // Photo
  if (imgs[0]) {
    try {
      const img = await _loadImage(imgs[0]);
      const imgH = cfg.h * 0.65;
      const scale = Math.max(cfg.w / img.width, imgH / img.height);
      const sw = cfg.w / scale, sh = imgH / scale;
      const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cfg.w, imgH);
    } catch {}
  }

  // Details section
  const detailY = cfg.h * 0.65 + 20;
  ctx.fillStyle = ACCENT;
  ctx.font = '700 20px "Syne", sans-serif';
  ctx.fillText('FlipTrack', 40, detailY);

  ctx.fillStyle = TEXT;
  ctx.font = '700 28px "Syne", sans-serif';
  ctx.fillText(item.name || 'Item', 40, detailY + 50);

  ctx.fillStyle = '#8b949e';
  ctx.font = '400 16px "DM Mono", monospace';
  const meta = [item.brand, item.category, item.condition].filter(Boolean).join(' · ');
  if (meta) ctx.fillText(meta, 40, detailY + 80);

  ctx.fillStyle = ACCENT;
  ctx.font = '700 36px "DM Mono", monospace';
  if (item.price) ctx.fillText(fmt(item.price), 40, detailY + 130);
}

/**
 * Open the gallery builder modal overlay.
 */
export function openGalleryBuilder(itemIds) {
  _selectedItems = itemIds || [];
  _currentLayout = _selectedItems.length === 1 ? 'hero' : '2x2';

  const ov = document.getElementById('galleryOv');
  if (!ov) return;
  ov.classList.add('on');
  trapFocus('#galleryOv');
  _renderGalleryPreview();
}

export function closeGalleryBuilder() {
  releaseFocus();
  const ov = document.getElementById('galleryOv');
  if (ov) ov.classList.remove('on');
  _selectedItems = [];
}

export function setGalleryLayout(layout) {
  _currentLayout = layout;
  _renderGalleryPreview();
}

async function _renderGalleryPreview() {
  const preview = document.getElementById('galleryPreview');
  if (!preview || !_selectedItems.length) return;
  preview.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:11px">Generating preview…</div>';
  try {
    const dataUrl = await generateCollage(_selectedItems, _currentLayout);
    preview.innerHTML = `<img src="${escAttr(dataUrl)}" style="max-width:100%;border-radius:6px;border:1px solid var(--border)">`;
  } catch (e) {
    preview.innerHTML = `<div style="text-align:center;padding:20px;color:var(--danger);font-size:11px">Failed to generate preview</div>`;
  }
}

export async function downloadCollage() {
  try {
    const dataUrl = await generateCollage(_selectedItems, _currentLayout);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `fliptrack-gallery-${_currentLayout}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('Collage downloaded');
  } catch (e) {
    toast('Failed to generate collage', true);
  }
}

export async function copyCollage() {
  try {
    const dataUrl = await generateCollage(_selectedItems, _currentLayout);
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    toast('Collage copied to clipboard');
  } catch {
    toast('Copy failed — try downloading instead', true);
  }
}
