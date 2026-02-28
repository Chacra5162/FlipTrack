// Trash/Recently Deleted modal
// Core trash logic (softDeleteItem, restoreItem, pushUndo, etc.) lives in store.js
// This module only handles the trash modal UI.

import { _trash, saveTrash, save, refresh, restoreItem as storeRestoreItem } from '../data/store.js';
import { toast } from '../utils/dom.js';
import { escHtml } from '../utils/format.js';

export function openTrashModal() {
  // Prune expired items in-place
  const cutoff = Date.now() - 7 * 86400000;
  for (let i = _trash.length - 1; i >= 0; i--) {
    if (_trash[i].deletedAt <= cutoff) _trash.splice(i, 1);
  }
  if (!_trash.length) { toast('Trash is empty'); return; }

  const list = _trash.map((item, idx) => {
    const ago = Math.floor((Date.now() - item.deletedAt) / 60000);
    const agoStr = ago < 60 ? ago + 'm ago' : ago < 1440 ? Math.floor(ago/60) + 'h ago' : Math.floor(ago/1440) + 'd ago';
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(item.name)}</div>
        <div style="font-size:10px;color:var(--muted);font-family:'DM Mono',monospace">${item.sku || '—'} · ${agoStr}</div>
      </div>
      <button onclick="restoreItem(${idx});closeTrashModal()" style="background:none;border:1px solid var(--good);color:var(--good);font-size:10px;padding:4px 10px;cursor:pointer;font-family:'DM Mono',monospace">Restore</button>
    </div>`;
  }).reverse().join('');

  document.getElementById('trashBody').innerHTML = list;
  document.getElementById('trashOv').classList.add('on');
}

export function closeTrashModal() {
  document.getElementById('trashOv').classList.remove('on');
}

export function emptyTrash() {
  if (!confirm('Permanently delete all ' + _trash.length + ' items?')) return;
  _trash.length = 0; // clear in-place (can't reassign imported binding)
  saveTrash();
  closeTrashModal();
  toast('Trash emptied');
}
