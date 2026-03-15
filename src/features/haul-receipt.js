/**
 * haul-receipt.js — Shareable Haul ROI Receipt
 * Generates a receipt-style card after a sourcing trip as a downloadable PNG.
 * Instagram portrait format (1080x1350) with FlipTrack branding.
 */

import { inv, sales } from '../data/store.js';
import { getHaulROI, getHaulItems } from '../features/haul.js';
import { fmt, pct } from '../utils/format.js';
import { toast } from '../utils/dom.js';

const W = 1080;
const H = 1350;
const PAD = 60;
const ACCENT = '#57c8ff';
const BG = '#0d1117';
const SURFACE = '#161b22';
const TEXT = '#e6edf3';
const MUTED = '#8b949e';
const GOOD = '#00c888';

function _loadFont() {
  // Ensure fonts are loaded for canvas rendering
  return Promise.all([
    document.fonts.load('700 28px "Syne"').catch(() => {}),
    document.fonts.load('400 18px "DM Mono"').catch(() => {}),
  ]);
}

/**
 * Generate a canvas receipt image for a haul.
 * @param {Object} haul - Haul object from store
 * @returns {Promise<string>} data URL of the receipt PNG
 */
export async function generateHaulReceipt(haul) {
  if (!haul) throw new Error('No haul provided');

  await _loadFont();

  const roi = getHaulROI(haul, inv, sales);
  const items = getHaulItems(haul, inv);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Background ────────────────────────────────────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Subtle gradient overlay
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(87,200,255,0.03)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  let y = PAD;

  // ── Header ────────────────────────────────────────────────────────
  ctx.fillStyle = ACCENT;
  ctx.font = '700 36px "Syne", sans-serif';
  ctx.fillText('FlipTrack', PAD, y + 30);
  ctx.fillStyle = MUTED;
  ctx.font = '400 16px "DM Mono", monospace';
  ctx.fillText('SOURCING RECEIPT', W - PAD - ctx.measureText('SOURCING RECEIPT').width, y + 30);
  y += 60;

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  y += 30;

  // ── Haul Info ─────────────────────────────────────────────────────
  ctx.fillStyle = TEXT;
  ctx.font = '700 28px "Syne", sans-serif';
  ctx.fillText(haul.name || 'Sourcing Trip', PAD, y + 24);
  y += 40;

  ctx.fillStyle = MUTED;
  ctx.font = '400 18px "DM Mono", monospace';
  const info = [haul.date, haul.location].filter(Boolean).join(' · ');
  if (info) { ctx.fillText(info, PAD, y + 16); y += 32; }
  y += 10;

  // ── Stats Grid ────────────────────────────────────────────────────
  const stats = [
    { label: 'ITEMS', value: String(roi.totalItems || items.length || 0) },
    { label: 'INVESTED', value: _fmtNum(roi.totalCost) },
    { label: 'EST. VALUE', value: _fmtNum(roi.totalRevenue) },
    { label: 'PROFIT', value: _fmtNum(roi.profit) },
    { label: 'ROI', value: (roi.roi * 100).toFixed(0) + '%' },
    { label: 'SOLD', value: String(roi.soldCount || 0) },
  ];

  const colW = (W - PAD * 2) / 3;
  stats.forEach((stat, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = PAD + col * colW;
    const sy = y + row * 90;

    // Background card
    ctx.fillStyle = SURFACE;
    _roundRect(ctx, x + 4, sy, colW - 8, 76, 10);
    ctx.fill();

    // Value
    ctx.fillStyle = stat.label === 'PROFIT' ? (roi.profit >= 0 ? GOOD : '#ef5350') : ACCENT;
    ctx.font = '700 28px "DM Mono", monospace';
    ctx.fillText(stat.value, x + 16, sy + 36);

    // Label
    ctx.fillStyle = MUTED;
    ctx.font = '400 13px "DM Mono", monospace';
    ctx.fillText(stat.label, x + 16, sy + 58);
  });
  y += 200;

  // ── Item List ─────────────────────────────────────────────────────
  ctx.fillStyle = MUTED;
  ctx.font = '400 14px "DM Mono", monospace';
  ctx.fillText('ITEMS', PAD, y);
  y += 20;

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  y += 12;

  const maxItems = Math.min(items.length, 12);
  for (let i = 0; i < maxItems; i++) {
    const item = items[i];
    ctx.fillStyle = TEXT;
    ctx.font = '400 16px "DM Mono", monospace';
    const name = (item.name || 'Item').length > 40 ? (item.name || 'Item').slice(0, 37) + '...' : (item.name || 'Item');
    ctx.fillText(name, PAD, y + 16);

    ctx.fillStyle = ACCENT;
    const price = fmt(item.price || 0);
    ctx.fillText(price, W - PAD - ctx.measureText(price).width, y + 16);
    y += 30;
  }
  if (items.length > maxItems) {
    ctx.fillStyle = MUTED;
    ctx.font = '400 14px "DM Mono", monospace';
    ctx.fillText(`+${items.length - maxItems} more items`, PAD, y + 14);
    y += 28;
  }

  // ── Footer ────────────────────────────────────────────────────────
  y = H - 40;
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(0, y - 20, W, 60);
  ctx.fillStyle = MUTED;
  ctx.font = '400 13px "DM Mono", monospace';
  ctx.fillText('Generated by FlipTrack — Built for flippers, not retailers', PAD, y + 6);

  return canvas.toDataURL('image/png');
}

function _fmtNum(val) {
  if (val == null) return '$0';
  return '$' + Math.abs(val).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Download the receipt as a PNG file.
 */
export async function downloadHaulReceipt(haul) {
  try {
    const dataUrl = await generateHaulReceipt(haul);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `fliptrack-haul-${(haul.name || 'receipt').replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('Receipt downloaded');
  } catch (e) {
    toast('Failed to generate receipt: ' + e.message, true);
  }
}

/**
 * Copy the receipt image to clipboard.
 */
export async function copyHaulReceipt(haul) {
  try {
    const dataUrl = await generateHaulReceipt(haul);
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    toast('Receipt copied to clipboard');
  } catch (e) {
    toast('Copy failed — try downloading instead', true);
  }
}
