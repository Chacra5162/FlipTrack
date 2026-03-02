import { expenses, save } from '../data/store.js';
import { fmt, ds, escHtml, uid } from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { _sfx } from '../utils/sfx.js';
import { parseNum, validateNumericInput } from '../utils/validate.js';
import { pushDeleteToCloud, autoSync } from '../data/sync.js';

// ── STATE ─────────────────────────────────────────────────────────────────────

let _expSearch = '';
let _expDateFrom = '';
let _expDateTo = '';

export function setExpSearch(val) { _expSearch = (val || '').toLowerCase(); renderExpenses(); }
export function setExpDateFrom(val) { _expDateFrom = val || ''; renderExpenses(); }
export function setExpDateTo(val) { _expDateTo = val || ''; renderExpenses(); }
export function clearExpFilters() { _expSearch = ''; _expDateFrom = ''; _expDateTo = ''; renderExpenses(); }

const EXP_CAT_CLASS = {
  'Shipping Supplies':'exp-shipping', 'Packaging Materials':'exp-packaging',
  'Platform Fees':'exp-fees', 'Sourcing':'exp-sourcing', 'Storage':'exp-storage',
  'Printing':'exp-printing', 'Software':'exp-software', 'Marketing':'exp-marketing',
  'Returns':'exp-returns', 'Office Supplies':'exp-office', 'Other':'exp-other',
};

export function setDefaultExpDate() {
  const d = document.getElementById('exp_date');
  if (d && !d.value) d.value = new Date().toISOString().split('T')[0];
}

export function addExpense() {
  const date = document.getElementById('exp_date').value;
  const cat  = document.getElementById('exp_cat').value;
  const desc = document.getElementById('exp_desc').value.trim();

  // Validate numeric field
  const amtEl = document.getElementById('exp_amt');
  const amt = parseNum(amtEl.value, { fieldName: 'Amount', allowZero: false });
  if (isNaN(amt) && amtEl.value.trim() !== '') {
    validateNumericInput(amtEl, { fieldName: 'Amount' });
    return;
  }

  if (!date)         { toast('Please enter a date', true); return; }
  if (!desc)         { toast('Please enter a description', true); return; }
  if (!amt || amt<=0){ toast('Please enter a valid amount', true); return; }

  expenses.push({ id: uid(), date, category: cat, description: desc, amount: amt });
  save();
  renderExpenses();
  // Clear form fields except date and category
  document.getElementById('exp_desc').value = '';
  document.getElementById('exp_amt').value  = '';
  _sfx.expense(); toast('Expense added ✓');
}

export async function delExpense(id) {
  if (!confirm('Delete this expense?')) return;
  const idx = expenses.findIndex(e => e.id === id);
  if (idx >= 0) expenses.splice(idx, 1);
  save();
  renderExpenses();
  toast('Expense deleted');
  await pushDeleteToCloud('ft_expenses',[id]);
  autoSync();
}

export function renderExpenses() {
  const filt  = document.getElementById('expCatFilt')?.value || 'all';
  const tbody = document.getElementById('expBody');
  const empty = document.getElementById('expEmpty');
  const lbl   = document.getElementById('expTotalLbl');

  const filtered = [...expenses]
    .filter(e => filt === 'all' || e.category === filt)
    .filter(e => !_expSearch || (e.description || '').toLowerCase().includes(_expSearch) || (e.category || '').toLowerCase().includes(_expSearch))
    .filter(e => !_expDateFrom || e.date >= _expDateFrom)
    .filter(e => !_expDateTo || e.date <= _expDateTo)
    .sort((a,b) => new Date(b.date) - new Date(a.date));

  const total = filtered.reduce((a,e) => a + (e.amount||0), 0);
  if (lbl) lbl.textContent = `${filtered.length} expense${filtered.length!==1?'s':''} · ${fmt(total)}`;

  // Render filter bar
  const filterBar = document.getElementById('expFilterBar');
  if (filterBar) {
    filterBar.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 0">
      <input type="text" placeholder="Search expenses..." value="${escHtml(_expSearch)}"
             oninput="setExpSearch(this.value)"
             style="flex:1;min-width:150px;padding:6px 10px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:12px;font-family:'DM Mono',monospace">
      <input type="date" value="${_expDateFrom}" onchange="setExpDateFrom(this.value)" title="From date"
             style="padding:5px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:11px;font-family:'DM Mono',monospace">
      <span style="color:var(--muted);font-size:11px">to</span>
      <input type="date" value="${_expDateTo}" onchange="setExpDateTo(this.value)" title="To date"
             style="padding:5px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:11px;font-family:'DM Mono',monospace">
      ${(_expSearch || _expDateFrom || _expDateTo) ? `<button onclick="clearExpFilters()" style="padding:5px 10px;background:var(--surface);border:1px solid var(--border);color:var(--danger);font-size:11px;cursor:pointer;font-family:'DM Mono',monospace">Clear</button>` : ''}
    </div>`;
  }

  if (!filtered.length) {
    if (tbody) tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  tbody.innerHTML = filtered.map(e => {
    const cls = EXP_CAT_CLASS[e.category] || 'exp-other';
    const safeDesc = escHtml(e.description);
    const desc = e.description.replace(/"/g,'&quot;');
    return `<tr>
      <td style="color:var(--muted);font-size:11px">${ds(e.date)}</td>
      <td title="${desc}"><span class="exp-cat-badge ${cls}">${e.category}</span><span class="exp-desc-mobile"> · ${safeDesc}</span></td>
      <td title="${desc}">${safeDesc}</td>
      <td style="text-align:right;font-family:'DM Mono',monospace;font-weight:600;color:var(--danger)">
        ${fmt(e.amount)}&nbsp;<button class="act-btn red exp-del-mobile" onclick="delExpense('${e.id}')" style="margin-left:4px;vertical-align:middle">✕</button>
      </td>
      <td style="text-align:right"><button class="act-btn red exp-del-desktop" onclick="delExpense('${e.id}')">✕</button></td>
    </tr>`;
  }).join('');
}
