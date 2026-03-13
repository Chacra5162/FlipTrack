// Currency format
export const fmt = n => { const v = Number(n||0); return '$' + (isFinite(v) ? v : 0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); };

// Percentage format
export const pct = n => { const v = n*100; return (isFinite(v) ? v : 0).toFixed(1)+'%'; };

// Unique ID generator — uses crypto.randomUUID for collision safety
export const uid = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2,10);

// Date string format — local timezone aware (v2)
const _dsRe = /^\d{4}-\d{2}-\d{2}$/;
export const ds = d => {
  if (!d) return '';
  const s = String(d);
  const parsed = _dsRe.test(s) ? new Date(s + 'T00:00:00') : new Date(s);
  return isNaN(parsed) ? '' : parsed.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
};

// Local date string (YYYY-MM-DD) — avoids UTC timezone shift from toISOString()
export const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

// HTML escape
export const escHtml = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

// HTML attribute escape (for values inside onclick="..." etc.)
export const escAttr = s => String(s || '').replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

// Debounce utility
export const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

// Stock color (ok/warn/low)
export const sc = (qty, alert, bulk) => !bulk ? (qty===0?'low':'ok') : qty===0?'low':qty<=(alert||2)?'warn':'ok';

// Make color (converts status to CSS variable)
export const mkc = c => ({ok:'var(--good)',warn:'var(--warn)',low:'var(--danger)'}[c] || 'var(--muted)');
