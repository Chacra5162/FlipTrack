// Materials modal - supplies/materials management for sales
// Dependencies: Global state (supplies), utilities (toast), data persistence (saveSupplies, renderSupplies, checkSupplyAlerts)

let _pendingSaleCallback = null;

export function openMaterialsModal(onConfirm) {
  if (!supplies.length) { onConfirm([]); return; }
  _pendingSaleCallback = onConfirm;
  const body = document.getElementById('matsBody');
  body.innerHTML = supplies.map(s => {
    const isLow = s.qty <= (s.alert || 5);
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--surface);border:1px solid ${isLow?'rgba(255,107,107,0.35)':'var(--border)'};border-radius:2px">
      <input type="checkbox" id="mat_${s.id}" style="width:16px;height:16px;accent-color:var(--accent);flex-shrink:0">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-family:'Syne',sans-serif;font-weight:600">${s.name}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">${s.category} · ${s.qty} in stock${isLow ? ' · <span style="color:#ff6b6b">LOW</span>' : ''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
        <span style="font-size:10px;color:var(--muted);font-family:'DM Mono',monospace">Qty used:</span>
        <input type="number" id="matqty_${s.id}" value="1" min="1" max="${s.qty}"
          style="width:48px;text-align:center;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:12px;padding:4px 6px">
      </div>
    </div>`;
  }).join('');
  document.getElementById('matsOv').classList.add('on');
}

export function confirmMaterials() {
  const used = [];
  for (const s of supplies) {
    const cb = document.getElementById('mat_' + s.id);
    if (cb && cb.checked) {
      const qtyUsed = parseInt(document.getElementById('matqty_' + s.id).value) || 1;
      used.push({ supplyId: s.id, qty: qtyUsed });
      s.qty = Math.max(0, s.qty - qtyUsed);
    }
  }
  document.getElementById('matsOv').classList.remove('on');
  if (used.length) {
    saveSupplies();
    renderSupplies();
    checkSupplyAlerts();
    toast(`Materials deducted ✓`);
  }
  if (_pendingSaleCallback) { _pendingSaleCallback(used); _pendingSaleCallback = null; }
}

export function skipMaterials() {
  document.getElementById('matsOv').classList.remove('on');
  if (_pendingSaleCallback) { _pendingSaleCallback([]); _pendingSaleCallback = null; }
}
