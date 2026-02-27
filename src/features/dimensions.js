// ── PACKAGE DIMENSIONS ──────────────────────────────────────────────────────

// Per-context unit state ('in' or 'cm')
const dimUnit = { d: 'in', f: 'in' };

function setDimUnit(ctx, unit) {
  dimUnit[ctx] = unit;
  document.getElementById(`${ctx}_unit_in`)?.classList.toggle('active', unit === 'in');
  document.getElementById(`${ctx}_unit_cm`)?.classList.toggle('active', unit === 'cm');

  const isIn = unit === 'in';
  const majLbl = document.getElementById(`${ctx}_wt_maj_lbl`);
  const minLbl = document.getElementById(`${ctx}_wt_min_lbl`);
  const dimLbl = document.getElementById(`${ctx}_dim_unit_lbl`);
  if (majLbl) majLbl.textContent = isIn ? 'lb' : 'kg';
  if (minLbl) { minLbl.textContent = isIn ? 'oz' : 'g'; }
  if (dimLbl) dimLbl.textContent  = isIn ? 'in' : 'cm';

  updateDimWeight(ctx);
}

function updateDimWeight(ctx) {
  const maj  = parseFloat(document.getElementById(`${ctx}_wt_maj`)?.value) || 0;
  const min  = parseFloat(document.getElementById(`${ctx}_wt_min`)?.value) || 0;
  const L    = parseFloat(document.getElementById(`${ctx}_len`)?.value) || 0;
  const W    = parseFloat(document.getElementById(`${ctx}_wid`)?.value) || 0;
  const H    = parseFloat(document.getElementById(`${ctx}_hgt`)?.value) || 0;
  const unit = dimUnit[ctx] || 'in';
  const lbl  = document.getElementById(`${ctx}_dimwt_val`);
  if (!lbl) return;

  if (L && W && H) {
    // Dimensional weight: (L×W×H) / divisor
    // USPS/UPS use 139 (in³/lb) or 5000 (cm³/kg)
    let dw;
    if (unit === 'in') {
      dw = (L * W * H) / 139;
      lbl.textContent = `dim wt: ${dw.toFixed(2)} lb`;
    } else {
      dw = (L * W * H) / 5000;
      lbl.textContent = `dim wt: ${dw.toFixed(2)} kg`;
    }
    // Highlight if dim weight exceeds actual weight
    const actualLb = unit === 'in' ? (maj + min / 16) : (maj + min / 1000) * 2.205;
    lbl.style.color = dw > actualLb ? 'var(--danger)' : 'var(--accent)';
    lbl.title = dw > actualLb ? 'Carrier may charge dimensional weight' : 'Actual weight is heavier';
  } else {
    lbl.textContent = '';
  }
  suggestPackaging(ctx);
}

// ── PACKAGING SUGGESTION ENGINE ─────────────────────────────────────────────

function toInches(v, unit) { return unit === 'cm' ? v / 2.54 : v; }
function toLbs(maj, min, unit) {
  if (unit === 'in') return maj + min / 16;
  return (maj + min / 1000) * 2.205;
}

const PACKAGING_DB = [
  { id:'poly-sm',  icon:'📦', name:'Poly Mailer (S)',         dims:[6,9,0],          maxWt:0.5, type:'mailer',
    note:'Clothing, soft goods under 8oz. Lightweight & waterproof.' },
  { id:'poly-md',  icon:'📦', name:'Poly Mailer (M)',         dims:[10,13,0],         maxWt:1,   type:'mailer',
    note:'T-shirts, jeans, folded apparel. Most common reseller mailer.' },
  { id:'poly-lg',  icon:'📦', name:'Poly Mailer (L)',         dims:[14.5,19,0],       maxWt:2,   type:'mailer',
    note:'Bulkier clothing, hoodies, jackets, multiple garments.' },
  { id:'bubble-sm',icon:'🫧', name:'Bubble Mailer (S)',       dims:[4,8,0],           maxWt:0.5, type:'mailer',
    note:'Jewelry, coins, small electronics, accessories.' },
  { id:'bubble-md',icon:'🫧', name:'Bubble Mailer (M)',       dims:[8.5,11,0],        maxWt:1,   type:'mailer',
    note:'Phone cases, small accessories, books under 1 lb.' },
  { id:'bubble-lg',icon:'🫧', name:'Bubble Mailer (L)',       dims:[10.5,16,0],       maxWt:2,   type:'mailer',
    note:'Shoes (soft), stacked books, light electronics.' },
  { id:'flat-env', icon:'✉️', name:'USPS Flat Rate Env',      dims:[12.5,9.5,0],      maxWt:70,  type:'flatrate',
    note:'Up to 70 lbs, flat rate pricing. Great for coins, hardware.' },
  { id:'fr-padded',icon:'✉️', name:'USPS Padded Flat Rate',   dims:[12.5,9.5,0],      maxWt:70,  type:'flatrate',
    note:'Same flat rate price but padded. Good for fragile flat items.' },
  { id:'pri-sm',   icon:'📫', name:'Priority Small Flat Rate',dims:[8.625,5.375,1.625],maxWt:70, type:'priority',
    note:'Wallets, sunglasses, cards, thin documents.' },
  { id:'pri-md-1', icon:'📫', name:'Priority Medium (Top)',   dims:[11,8.5,5.5],      maxWt:70,  type:'priority',
    note:'Most versatile flat rate — shoes, folded clothes, small appliances.' },
  { id:'pri-md-2', icon:'📫', name:'Priority Medium (Side)',  dims:[13.625,11.875,3.375],maxWt:70,type:'priority',
    note:'Wide, flat items — art prints, keyboards, flat goods.' },
  { id:'pri-lg',   icon:'📫', name:'Priority Large Flat Rate',dims:[12,12,5.5],       maxWt:70,  type:'priority',
    note:'Best for 2–20 lb items shipping coast-to-coast.' },
  { id:'box-xs',   icon:'🗃️', name:'Box 6×6×6"',             dims:[6,6,6],           maxWt:10,  type:'box',
    note:'Mugs, small electronics, candles, collectibles.' },
  { id:'box-sm',   icon:'🗃️', name:'Box 8×8×8"',             dims:[8,8,8],           maxWt:20,  type:'box',
    note:'Shoes, books, small appliances, hats.' },
  { id:'box-md',   icon:'🗃️', name:'Box 12×12×8"',           dims:[12,12,8],         maxWt:40,  type:'box',
    note:'Handbags, boots, cameras + accessories, stacked books.' },
  { id:'box-lg',   icon:'🗃️', name:'Box 18×18×16"',          dims:[18,18,16],        maxWt:65,  type:'box',
    note:'Coats, keyboards, record players, printers.' },
  { id:'box-xl',   icon:'🗃️', name:'Box 24×24×18"',          dims:[24,24,18],        maxWt:70,  type:'box',
    note:'Luggage, monitors, large artwork, bundled clothing.' },
];

const PADDING_OPTIONS = [
  { name:'Bubble wrap',      icon:'🫧', when:(lbs,pad)     => pad || lbs > 1 },
  { name:'Packing peanuts',  icon:'🤍', when:(lbs,pad,vol) => pad && vol > 200 },
  { name:'Kraft paper fill', icon:'📄', when:(lbs,pad,vol) => vol > 100 },
  { name:'Foam sheets',      icon:'🟫', when:(lbs,pad)     => pad },
  { name:'Air pillows',      icon:'💨', when:(lbs,pad,vol) => vol > 300 && !pad },
  { name:'Tissue paper',     icon:'🎀', when:(lbs)         => lbs < 1 },
  { name:'Double-boxing',    icon:'📦', when:(lbs,pad)     => pad && lbs > 5 },
];

function suggestPackaging(ctx) {
  const wrap = document.getElementById(`${ctx}_pkg_suggestion`);
  if (!wrap) return;

  const unit = dimUnit[ctx] || 'in';
  const maj  = parseFloat(document.getElementById(`${ctx}_wt_maj`)?.value) || 0;
  const min  = parseFloat(document.getElementById(`${ctx}_wt_min`)?.value) || 0;
  const rawL = parseFloat(document.getElementById(`${ctx}_len`)?.value) || 0;
  const rawW = parseFloat(document.getElementById(`${ctx}_wid`)?.value) || 0;
  const rawH = parseFloat(document.getElementById(`${ctx}_hgt`)?.value) || 0;

  const hasWeight = maj > 0 || min > 0;
  const hasDims   = rawL > 0 && rawW > 0 && rawH > 0;
  if (!hasWeight && !hasDims) { wrap.innerHTML = ''; return; }

  const lbs  = toLbs(maj, min, unit);
  const L    = toInches(rawL, unit);
  const W    = toInches(rawW, unit);
  const H    = toInches(rawH, unit);
  const dims = hasDims ? [L, W, H].sort((a,b)=>b-a) : [0,0,0];
  const vol  = dims[0] * dims[1] * dims[2];

  // Fragility/density heuristic
  const density  = vol > 0 ? lbs / (vol / 1728) : 0; // lbs/ft³
  const needsPad = density > 10 || (lbs > 0.5 && vol < 50);

  const scored = PACKAGING_DB.map(pkg => {
    const pd = [...pkg.dims].sort((a,b)=>b-a);
    let fits = lbs <= pkg.maxWt;

    if (hasDims && fits) {
      if (pd[2] === 0) {
        // flat mailer — item must fold or be flat
        if (dims[0] > pd[0] - 1 || dims[1] > pd[1] - 1) fits = false;
        if (H > 2) fits = false;
      } else {
        if (dims[0] > pd[0] - 1 || dims[1] > pd[1] - 1 || dims[2] > pd[2] - 0.5) fits = false;
      }
    }
    if (!fits) return null;

    const pkgVol   = pd[0] * pd[1] * Math.max(pd[2], 1);
    const waste    = vol > 0 ? pkgVol / vol : pkgVol;
    let score      = 1000 / waste;

    if (pkg.type === 'flatrate' && lbs > 3)  score += 200;
    if (pkg.type === 'flatrate' && lbs > 8)  score += 400;
    if (pkg.type === 'mailer'   && lbs < 1 && !needsPad) score += 300;
    if (pkg.type === 'mailer'   && needsPad) score -= 200;

    return { ...pkg, score };
  }).filter(Boolean).sort((a,b)=>b.score-a.score);

  if (!scored.length) {
    wrap.innerHTML = `<div class="pkg-suggest"><div class="pkg-suggest-hd"><span class="pkg-suggest-icon">⚠️</span><span class="pkg-suggest-ttl">No standard package found</span><span class="pkg-suggest-sub">May require custom or freight packaging</span></div></div>`;
    return;
  }

  const top3 = scored.slice(0, 3);
  const pads = PADDING_OPTIONS.filter(p => p.when(lbs, needsPad, vol));

  const cards = top3.map((pkg, i) => {
    const ds = pkg.dims[2] === 0
      ? `${pkg.dims[0]}" × ${pkg.dims[1]}"`
      : `${pkg.dims[0]}" × ${pkg.dims[1]}" × ${pkg.dims[2]}"`;
    return `<div class="pkg-card${i===0?' best':''}">
      ${i===0?'<div class="pkg-best-tag">Best fit</div>':''}
      <div class="pkg-card-ico">${pkg.icon}</div>
      <div class="pkg-card-name">${pkg.name}</div>
      <div class="pkg-card-dim">${ds}</div>
      <div class="pkg-card-note">${pkg.note}</div>
    </div>`;
  }).join('');

  const padRow = pads.length ? `<div class="pkg-padding-list">
    <span class="pkg-padding-ttl">Fill &amp; Protection:</span>
    ${pads.map(p=>`<span class="pkg-pad-chip">${p.icon} ${p.name}</span>`).join('')}
  </div>` : '';

  const wtStr  = hasWeight ? `${lbs.toFixed(2)} lb` : 'weight not set';
  const dimStr = hasDims   ? `${L.toFixed(1)}" × ${W.toFixed(1)}" × ${H.toFixed(1)}"` : 'dims not set';

  wrap.innerHTML = `<div class="pkg-suggest">
    <div class="pkg-suggest-hd">
      <span class="pkg-suggest-icon">📬</span>
      <span class="pkg-suggest-ttl">Packaging Suggestions</span>
      <span class="pkg-suggest-sub">${wtStr} · ${dimStr}</span>
    </div>
    <div class="pkg-cards">${cards}</div>
    ${padRow}
  </div>`;
}

// Convert stored values back to form fields
function loadDimsToForm(ctx, item) {
  const u = item.dimUnit || 'in';
  dimUnit[ctx] = u;
  document.getElementById(`${ctx}_unit_in`)?.classList.toggle('active', u === 'in');
  document.getElementById(`${ctx}_unit_cm`)?.classList.toggle('active', u === 'cm');
  setDimUnit(ctx, u); // updates labels

  const idMap = {
    wt_maj: 'weightMaj', wt_min: 'weightMin',
    len: 'dimL', wid: 'dimW', hgt: 'dimH',
  };
  for (const [field, key] of Object.entries(idMap)) {
    const el = document.getElementById(`${ctx}_${field}`);
    if (el) el.value = item[key] || '';
  }
  updateDimWeight(ctx);
}

// Read form fields and return dim fields object
function getDimsFromForm(ctx) {
  return {
    dimUnit  : dimUnit[ctx] || 'in',
    weightMaj: parseFloat(document.getElementById(`${ctx}_wt_maj`)?.value) || 0,
    weightMin: parseFloat(document.getElementById(`${ctx}_wt_min`)?.value) || 0,
    dimL     : parseFloat(document.getElementById(`${ctx}_len`)?.value) || 0,
    dimW     : parseFloat(document.getElementById(`${ctx}_wid`)?.value) || 0,
    dimH     : parseFloat(document.getElementById(`${ctx}_hgt`)?.value) || 0,
  };
}

function clearDimForm(ctx) {
  ['wt_maj','wt_min','len','wid','hgt'].forEach(f => {
    const el = document.getElementById(`${ctx}_${f}`);
    if (el) el.value = '';
  });
  dimUnit[ctx] = 'in';
  setDimUnit(ctx, 'in');
}

export { setDimUnit, updateDimWeight, toInches, toLbs, suggestPackaging, loadDimsToForm, getDimsFromForm, clearDimForm, dimUnit, PACKAGING_DB, PADDING_OPTIONS };
