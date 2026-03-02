// ── SUPPLIES ──────────────────────────────────────────────────────────────────
import { supplies } from '../data/store.js';
import { uid, fmt } from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { getSupabaseClient } from '../data/auth.js';
import { getCurrentUser } from '../data/auth.js';

function saveSupplies() {
  localStorage.setItem('ft_supplies', JSON.stringify(supplies));
  syncSupplies();
}

async function syncSupplies() {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();
  if (!_sb || !_currentUser) return;
  try {
    const acctId = _currentUser.id;
    const rows = supplies.map(s => ({ id: s.id, account_id: acctId, data: s }));
    await _sb.from('ft_supplies').upsert(rows, { onConflict: 'id' });
  } catch {}
}

async function pullSupplies() {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();
  if (!_sb || !_currentUser) return;
  try {
    const acctId = _currentUser.id;
    const { data } = await _sb.from('ft_supplies').select('data').eq('account_id', acctId);
    if (data && data.length) {
      supplies.length = 0;
      supplies.push(...data.map(r => r.data).filter(Boolean));
    }
    saveLocalSupplies();
  } catch {}
}

function saveLocalSupplies() {
  localStorage.setItem('ft_supplies', JSON.stringify(supplies));
}

function addSupply() {
  const name = document.getElementById('sup_name').value.trim();
  if (!name) { toast('Supply name required', true); return; }
  const qty  = parseInt(document.getElementById('sup_qty').value) || 0;
  const alert= parseInt(document.getElementById('sup_alert').value) || 5;
  supplies.push({
    id:    uid(),
    name,
    category: document.getElementById('sup_cat').value,
    qty,
    cost:  parseFloat(document.getElementById('sup_cost').value) || 0,
    alert,
    notes: document.getElementById('sup_notes').value.trim(),
    added: new Date().toISOString()
  });
  ['sup_name','sup_qty','sup_cost','sup_alert','sup_notes'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('sup_cat').value = 'Boxes';
  saveSupplies();
  renderSupplies();
  toast('Supply added ✓');
}

function updateSupplyQty(id, delta) {
  const s = supplies.find(s => s.id === id);
  if (!s) return;
  s.qty = Math.max(0, (s.qty || 0) + delta);
  saveSupplies();
  renderSupplies();
}

function setSupplyQty(id, val) {
  const s = supplies.find(s => s.id === id);
  if (!s) return;
  s.qty = Math.max(0, parseInt(val) || 0);
  saveSupplies();
  checkSupplyAlerts();
}

function delSupply(id) {
  const idx = supplies.findIndex(s => s.id === id);
  if (idx !== -1) supplies.splice(idx, 1);
  saveSupplies();
  renderSupplies();
  toast('Removed ✓');
}

function renderSupplies() {
  const tbody = document.getElementById('supBody');
  const empty = document.getElementById('supEmpty');
  const badge = document.getElementById('supLowBadge');
  if (!tbody) return;
  const lowCount = supplies.filter(s => s.qty <= (s.alert || 5)).length;
  if (badge) badge.style.display = lowCount ? '' : 'none';
  if (!supplies.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  tbody.innerHTML = supplies.map(s => {
    const isLow = s.qty <= (s.alert || 5);
    const qtyColor = s.qty === 0 ? 'color:#ff6b6b;font-weight:700' : isLow ? 'color:#ffaa33;font-weight:700' : '';
    const lowTag = isLow ? `<span style="font-size:9px;background:rgba(255,107,107,0.15);color:#ff6b6b;padding:1px 6px;font-family:'DM Mono',monospace;margin-left:6px">LOW</span>` : '';
    return `<tr>
      <td><div class="item-name">${s.name}${lowTag}</div></td>
      <td><span class="cat-tag">${s.category||'Other'}</span></td>
      <td style="${qtyColor}">
        <div style="display:flex;align-items:center;gap:6px">
          <button onclick="updateSupplyQty('${s.id}',-1)" style="background:var(--surface3);border:1px solid var(--border);color:var(--text);width:22px;height:22px;cursor:pointer;font-size:14px;line-height:1;padding:0">−</button>
          <input type="number" value="${s.qty}" min="0" onchange="setSupplyQty('${s.id}',this.value)"
            style="width:52px;text-align:center;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:12px;padding:3px 4px">
          <button onclick="updateSupplyQty('${s.id}',1)" style="background:var(--surface3);border:1px solid var(--border);color:var(--text);width:22px;height:22px;cursor:pointer;font-size:14px;line-height:1;padding:0">+</button>
        </div>
      </td>
      <td style="color:var(--muted);font-size:12px">${s.cost ? fmt(s.cost) : '—'}</td>
      <td style="color:var(--muted);font-size:12px">${s.alert || 5}</td>
      <td style="color:var(--muted);font-size:11px">${s.notes||'—'}</td>
      <td style="text-align:right"><button class="btn-danger" style="font-size:11px;padding:4px 10px" onclick="delSupply('${s.id}')">Remove</button></td>
    </tr>`;
  }).join('');
}

function checkSupplyAlerts() {
  const low = supplies.filter(s => s.qty <= (s.alert || 5) && s.qty >= 0);
  if (!low.length) return;
  const names = low.map(s => `${s.name} (${s.qty} left)`).join(', ');
  toast(`⚠ Low stock: ${names}`, true, 5000);
}

export { saveSupplies, syncSupplies, pullSupplies, saveLocalSupplies, addSupply, updateSupplyQty, setSupplyQty, delSupply, renderSupplies, checkSupplyAlerts };
