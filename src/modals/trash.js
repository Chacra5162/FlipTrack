// Trash/Recently Deleted modal and undo system
// Dependencies: Global state (inv, sales, _undoStack, _trash), utilities (toast, uid)
// DOM elements, data persistence (save, refresh)

let _trash = JSON.parse(localStorage.getItem('ft_trash') || '[]');

// UNDO SYSTEM
export function pushUndo(action, data) {
  _undoStack.push({ action, data, ts: Date.now() });
  if (_undoStack.length > 20) _undoStack.shift();
}

export function showUndoToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = '';
  const span = document.createElement('span');
  span.textContent = msg + ' ';
  const btn = document.createElement('button');
  btn.textContent = 'Undo';
  btn.style.cssText = 'background:rgba(0,0,0,0.3);border:1px solid rgba(0,0,0,0.4);color:#fff;padding:3px 10px;margin-left:8px;cursor:pointer;font-family:Syne,sans-serif;font-weight:700;font-size:11px';
  btn.onclick = () => { performUndo(); t.classList.remove('on'); };
  t.appendChild(span);
  t.appendChild(btn);
  t.classList.remove('err');
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 8000);
}

export function performUndo() {
  const entry = _undoStack.pop();
  if (!entry) { toast('Nothing to undo'); return; }
  if (entry.action === 'delete') {
    inv.push(entry.data);
    save(); refresh();
    toast('Item restored ✓');
  } else if (entry.action === 'sold') {
    // Restore inventory item qty and remove the sale
    const item = inv.find(i => i.id === entry.data.itemId);
    if (item) item.qty = (item.qty || 0) + (entry.data.qty || 1);
    sales = sales.filter(s => s.id !== entry.data.saleId);
    save(); refresh();
    toast('Sale undone ✓');
  }
}

export function saveTrash() {
  // Keep only last 30 items, max 7 days old
  const cutoff = Date.now() - 7 * 86400000;
  _trash = _trash.filter(t => t.deletedAt > cutoff).slice(-30);
  try { localStorage.setItem('ft_trash', JSON.stringify(_trash)); } catch {}
}

export function softDeleteItem(id) {
  const item = inv.find(i => i.id === id);
  if (!item) return;
  pushUndo('delete', {...item});
  _trash.push({ ...JSON.parse(JSON.stringify(item)), deletedAt: Date.now() });
  saveTrash();
  inv = inv.filter(i => i.id !== id);
  showUndoToast('Item deleted');
}

export function restoreItem(trashIdx) {
  const item = _trash[trashIdx];
  if (!item) return;
  const { deletedAt, ...restored } = item;
  inv.push(restored);
  _trash.splice(trashIdx, 1);
  saveTrash();
  save(); refresh(); _sfx.create();
  toast('Restored: ' + restored.name + ' ✓');
  autoSync();
}

export function openTrashModal() {
  const cutoff = Date.now() - 7 * 86400000;
  _trash = _trash.filter(t => t.deletedAt > cutoff);
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
  _trash = [];
  saveTrash();
  closeTrashModal();
  toast('Trash emptied');
}

// Cloud sync deletion (stub - needs actual implementation)
export async function pushDeleteToCloud(table, ids) {
  // This is a stub function that needs to be implemented with actual cloud sync logic
  // For now, it's a no-op that can be awaited
  return Promise.resolve();
}
