/**
 * batch-list.js — Batch Listing Mode
 * Select multiple items, choose platforms, generate listing text for all,
 * and open deep links in sequence.
 */

import { inv, save, refresh, markDirty, getInvItem } from '../data/store.js';
import { fmt, escHtml } from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { getPlatforms } from './platforms.js';
import { PLATFORMS } from '../config/platforms.js';
import { generateListingLink, generateListingText, copyListingText } from './deep-links.js';
import { getTemplatesForCategory } from './listing-templates.js';
import { markPlatformStatus, setListingDate } from './crosslist.js';
import { pushItemToEBay, publishEBayListing } from './ebay-sync.js';
import { isEBayConnected } from './ebay-auth.js';

// ── STATE ─────────────────────────────────────────────────────────────────
let _batchItems = []; // array of item IDs
let _batchPlatforms = new Set();
let _batchTemplate = null;
let _batchProgress = { current: 0, total: 0, status: 'idle' }; // idle | running | done

/**
 * Initialize batch listing mode with selected items.
 * @param {string[]} itemIds
 */
export function startBatchList(itemIds) {
  _batchItems = itemIds.filter(id => {
    const item = getInvItem(id);
    return item && (item.qty || 0) > 0;
  });
  _batchPlatforms.clear();
  _batchTemplate = null;
  _batchProgress = { current: 0, total: 0, status: 'idle' };
}

/**
 * Toggle a platform for batch listing.
 */
export function batchTogglePlatform(platform) {
  if (_batchPlatforms.has(platform)) _batchPlatforms.delete(platform);
  else _batchPlatforms.add(platform);
}

/**
 * Set the template for batch listing.
 */
export function batchSetTemplate(templateId) {
  _batchTemplate = templateId;
}

/**
 * Get current batch state.
 */
export function getBatchState() {
  return {
    items: _batchItems.map(id => getInvItem(id)).filter(Boolean),
    platforms: [..._batchPlatforms],
    template: _batchTemplate,
    progress: { ..._batchProgress },
  };
}

/**
 * Execute batch listing — opens deep links and copies text for each item×platform combo.
 * For eBay: uses the API if connected.
 * For others: opens deep link + copies listing text to clipboard.
 * @param {Object} [opts]
 * @param {number} [opts.delayMs=2000] - Delay between opening links
 * @param {Function} [opts.onProgress] - Progress callback
 * @returns {Promise<{ success: number, failed: number, skipped: number }>}
 */
export async function executeBatchList(opts = {}) {
  const delayMs = opts.delayMs || 2000;
  const platforms = [..._batchPlatforms];
  const items = _batchItems.map(id => getInvItem(id)).filter(Boolean);

  if (!items.length || !platforms.length) {
    toast('Select items and platforms first', true);
    return { success: 0, failed: 0, skipped: 0 };
  }

  const total = items.length * platforms.length;
  _batchProgress = { current: 0, total, status: 'running' };

  let success = 0, failed = 0, skipped = 0;

  for (const item of items) {
    for (const platform of platforms) {
      _batchProgress.current++;
      if (opts.onProgress) opts.onProgress(_batchProgress);

      // Skip if already actively listed on this platform
      if (item.platformStatus?.[platform] === 'active') {
        skipped++;
        continue;
      }

      try {
        if (platform === 'eBay' && isEBayConnected()) {
          // Use eBay API
          const pushResult = await pushItemToEBay(item.id);
          if (pushResult.success && item.price > 0) {
            await publishEBayListing(item.id);
          }
          success++;
        } else {
          // Generate listing text and copy to clipboard
          const template = _batchTemplate ? { titleFormula: _batchTemplate } : null;
          const { title, description } = generateListingText(item, template);
          await navigator.clipboard.writeText(`${title}\n\n${description}`);

          // Open platform deep link
          const url = generateListingLink(platform, item);
          window.open(url, '_blank');

          // Mark as draft
          markPlatformStatus(item.id, platform, 'draft');
          setListingDate(item.id, platform, new Date().toISOString().split('T')[0]);
          markDirty('inv', item.id);

          success++;

          // Delay between opens to avoid browser popup blocking
          if (delayMs > 0) {
            await new Promise(r => setTimeout(r, delayMs));
          }
        }
      } catch (e) {
        console.warn(`Batch list error for ${item.name} on ${platform}:`, e.message);
        failed++;
      }
    }
  }

  save();
  refresh();
  _batchProgress.status = 'done';

  toast(`Batch listing complete: ${success} listed, ${skipped} skipped, ${failed} failed`);
  return { success, failed, skipped };
}

/**
 * Generate all listing text for batch items (for bulk copy).
 * @returns {string} Combined listing text for all items
 */
export function generateBatchText() {
  const items = _batchItems.map(id => getInvItem(id)).filter(Boolean);
  const texts = items.map(item => {
    const { title, description } = generateListingText(item, _batchTemplate);
    return `=== ${title} ===\n${description}\n`;
  });
  return texts.join('\n---\n\n');
}

/**
 * Copy all batch listing text to clipboard.
 */
export async function copyBatchText() {
  const text = generateBatchText();
  try {
    await navigator.clipboard.writeText(text);
    toast(`Copied listing text for ${_batchItems.length} items ✓`);
  } catch (e) {
    toast('Copy failed', true);
  }
}

/**
 * Render the batch listing panel HTML.
 * @returns {string}
 */
export function renderBatchListPanel() {
  const state = getBatchState();

  if (!state.items.length) {
    return `<div class="bl-empty">
      <p>No items selected for batch listing.</p>
      <p style="color:var(--muted)">Select items from inventory using checkboxes, then click "Batch List".</p>
    </div>`;
  }

  let html = `<div class="bl-panel">
    <div class="bl-header">
      <span class="bl-count">${state.items.length} items selected</span>
      <button class="btn-sm" onclick="blClearSelection()">Clear</button>
    </div>
  `;

  // Platform picker
  html += `<div class="bl-section"><div class="bl-section-title">Platforms to list on:</div><div class="bl-plat-grid">`;
  const topPlatforms = ['eBay', 'Poshmark', 'Mercari', 'Depop', 'Etsy', 'Facebook Marketplace', 'Amazon', 'Grailed', 'Vinted', 'Whatnot'];
  for (const p of topPlatforms) {
    const active = state.platforms.includes(p);
    const ebayNote = p === 'eBay' && isEBayConnected() ? ' (API)' : '';
    html += `<button class="bl-plat-chip ${active ? 'active' : ''}" onclick="blTogglePlatform('${escHtml(p)}')">${escHtml(p)}${ebayNote}</button>`;
  }
  html += `</div></div>`;

  // Items preview
  html += `<div class="bl-section"><div class="bl-section-title">Items:</div><div class="bl-items">`;
  for (const item of state.items.slice(0, 10)) {
    html += `
      <div class="bl-item-row">
        <span class="bl-item-name">${escHtml((item.name || 'Item').slice(0, 40))}</span>
        <span class="bl-item-price">${fmt(item.price || 0)}</span>
        <span class="bl-item-plats">${getPlatforms(item).join(', ') || 'None'}</span>
      </div>
    `;
  }
  if (state.items.length > 10) {
    html += `<div class="bl-more">+ ${state.items.length - 10} more</div>`;
  }
  html += `</div></div>`;

  // Actions
  html += `
    <div class="bl-actions">
      <button class="btn-primary" onclick="blExecute()" ${!state.platforms.length ? 'disabled' : ''}>
        🚀 Start Batch Listing
      </button>
      <button class="btn-secondary" onclick="blCopyAll()">
        📋 Copy All Listing Text
      </button>
    </div>
  `;

  // Progress (shown during execution)
  if (state.progress.status === 'running') {
    const pct = state.progress.total > 0 ? Math.round(state.progress.current / state.progress.total * 100) : 0;
    html += `
      <div class="bl-progress">
        <div class="bl-progress-bar"><div class="bl-progress-fill" style="width:${pct}%"></div></div>
        <div class="bl-progress-text">${state.progress.current} / ${state.progress.total}</div>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

// ── CLEAR ──────────────────────────────────────────────────────────────
export function clearBatchList() {
  _batchItems = [];
  _batchPlatforms.clear();
  _batchTemplate = null;
  _batchProgress = { current: 0, total: 0, status: 'idle' };
}
