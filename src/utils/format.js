// Currency format
export const fmt = n => '$' + Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});

// Percentage format
export const pct = n => (n*100).toFixed(1)+'%';

// Unique ID generator
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);

// Date string format
export const ds = d => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});

// HTML escape
export const escHtml = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

// Debounce utility
export const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

// Stock color (ok/warn/low)
export const sc = (qty, alert, bulk) => !bulk ? (qty===0?'low':'ok') : qty===0?'low':qty<=(alert||2)?'warn':'ok';

// Make color (converts status to CSS variable)
export const mkc = c => ({ok:'var(--good)',warn:'var(--warn)',low:'var(--danger)'}[c]);
