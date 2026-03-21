/**
 * poshmark-sync.js — Phase 1: Manual Poshmark sold-status reconciliation
 * Shows Poshmark-listed items with Mark as Sold / Still Active buttons.
 */

import { inv, sales, save, refresh, markDirty } from '../data/store.js';
import { uid, fmt, escHtml, escAttr, localDate } from '../utils/format.js';
import { toast, trapFocus, releaseFocus } from '../utils/dom.js';
import { getPlatforms } from './platforms.js';
import { markPlatformStatus } from './crosslist.js';

/**
 * Open Poshmark reconciliation modal
 */
export function openPoshmarkSync() {
  const poshItems = inv.filter(i => {
    const plats = getPlatforms(i);
    return plats.includes('Poshmark') && (i.qty || 0) > 0 && !i._del;
  });

  if (!poshItems.length) {
    toast('No active Poshmark items found', true);
    return;
  }

  const ov = document.getElementById('poshmarkSyncOv');
  if (!ov) return;

  ov.innerHTML = `
    <div class="modal" style="max-width:600px;width:95vw">
      <div class="modal-hd">
        <div class="modal-ttl">Poshmark Sales Check</div>
        <button class="modal-x" onclick="closePoshmarkSync()" aria-label="Close">×</button>
      </div>
      <div class="modal-bd" style="max-height:60vh;overflow-y:auto">
        <div style="font-size:11px;color:var(--muted);margin-bottom:12px">
          Review your Poshmark items. Mark any that have sold on Poshmark.
        </div>
        <div id="poshSyncList">
          ${poshItems.map(item => {
            const eid = escAttr(item.id);
            const status = item.platformStatus?.Poshmark || 'active';
            const isSold = status === 'sold';
            return `<div class="posh-sync-row" id="posh-row-${eid}" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)${isSold ? ';opacity:0.5' : ''}">
              <div style="flex:1;overflow:hidden">
                <div style="font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(item.name)}</div>
                <div style="font-size:10px;color:var(--muted)">${fmt(item.price)} · ${item.qty} in stock</div>
              </div>
              ${isSold
                ? `<span style="font-size:10px;color:var(--good);font-family:'DM Mono',monospace">Sold</span>`
                : `<button class="act-btn" onclick="poshMarkSold('${eid}')" style="font-size:10px;white-space:nowrap">Mark Sold</button>
                   <button class="act-btn" style="font-size:10px;color:var(--muted);white-space:nowrap" disabled>Active</button>`
              }
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="modal-ft">
        <button class="btn-secondary" onclick="closePoshmarkSync()">Done</button>
      </div>
    </div>`;

  ov.classList.add('on');
  setTimeout(() => trapFocus('#poshmarkSyncOv'), 100);
}

/**
 * Close Poshmark sync modal
 */
export function closePoshmarkSync() {
  const ov = document.getElementById('poshmarkSyncOv');
  if (ov) { ov.classList.remove('on'); ov.innerHTML = ''; }
  releaseFocus();
}

/**
 * Mark a Poshmark item as sold — update platform status, prompt to record sale
 */
export function poshMarkSold(itemId) {
  const item = inv.find(i => i.id === itemId);
  if (!item) { toast('Item not found', true); return; }

  // Update platform status
  if (!item.platformStatus) item.platformStatus = {};
  item.platformStatus.Poshmark = 'sold';
  markDirty('inv', item.id);

  // Record a sale at list price
  const saleId = uid();
  sales.push({
    id: saleId,
    itemId: item.id,
    price: item.price || 0,
    listPrice: item.price || 0,
    qty: 1,
    platform: 'Poshmark',
    fees: Math.round((item.price || 0) * 0.20 * 100) / 100, // Poshmark 20% fee
    ship: 0,
    date: localDate(),
  });
  markDirty('sales', saleId);

  item.qty = Math.max(0, (item.qty || 1) - 1);
  markDirty('inv', item.id);
  save();

  // Update the row in the modal
  const row = document.getElementById(`posh-row-${escAttr(itemId)}`);
  if (row) {
    row.style.opacity = '0.5';
    row.querySelector('.act-btn')?.replaceWith(
      Object.assign(document.createElement('span'), {
        style: 'font-size:10px;color:var(--good);font-family:"DM Mono",monospace',
        textContent: 'Sold ✓'
      })
    );
  }

  toast(`${item.name} — Poshmark sale recorded`);
  refresh();
  if (typeof window.updateDashStats === 'function') window.updateDashStats();
}
