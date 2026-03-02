// Book Mode - category-specific fields and logic for book items
// Dependencies: Global state (inv), utilities (toast, fmt)
// DOM elements, form helpers (toggleBookFields requires drawer.js)

export const BOOK_CONDITIONS = ['Like New', 'Very Good', 'Good', 'Acceptable', 'Poor'];
export const STD_CONDITIONS  = ['NWT', 'NWOT', 'EUC', 'GUC', 'Fair', 'Poor', 'New/Sealed', 'Refurbished'];

export function isBookCat(cat) {
  if (!cat) return false;
  const c = cat.toLowerCase().trim();
  return c === 'books' || c === 'book' || c === 'textbooks' || c === 'textbook'
    || c.startsWith('book') || c.endsWith('books');
}

export function toggleBookFields(prefix) {
  const catEl = document.getElementById(prefix === 'f' ? 'f_cat' : 'd_cat');
  const cat = catEl ? catEl.value.trim() : '';
  const isBook = isBookCat(cat);
  const bf = document.getElementById(prefix + '_book_fields');
  if (bf) bf.classList.toggle('on', isBook);
  swapConditionTags(prefix, isBook);
}

export function swapConditionTags(prefix, isBook) {
  const picker = document.getElementById(prefix + '_cond_picker');
  if (!picker) return;
  const currentVal = document.getElementById(prefix + '_condition')?.value || '';
  const tags = isBook ? BOOK_CONDITIONS : STD_CONDITIONS;
  picker.innerHTML = tags.map(t =>
    `<button type="button" class="cond-tag" onclick="setCondTag('${prefix}','${t}',this)">${t}</button>`
  ).join('');
  // Re-activate if value matches
  if (currentVal) loadCondTag(prefix, currentVal);
}

export function updateRankDisplay(prefix) {
  const el = document.getElementById(prefix + '_rank_display');
  const rank = parseInt(document.getElementById(prefix + '_sales_rank')?.value) || 0;
  if (!el) return;
  if (!rank) { el.innerHTML = ''; return; }
  let color, label;
  if (rank < 100000)       { color = 'var(--good)';    label = 'Fast seller — high demand'; }
  else if (rank < 500000)  { color = 'var(--accent)';  label = 'Moderate — sells within weeks'; }
  else if (rank < 1000000) { color = 'var(--warn)';    label = 'Slow — may take months'; }
  else                     { color = 'var(--danger)';  label = 'Very slow — consider skipping'; }
  el.innerHTML = `<span class="rank-dot" style="background:${color}"></span><span class="rank-label">#${rank.toLocaleString()} — ${label}</span>`;
}

export async function lookupISBN(prefix) {
  const isbnRaw = document.getElementById(prefix + '_isbn')?.value.replace(/[-\s]/g, '') || '';
  if (!isbnRaw || (isbnRaw.length !== 10 && isbnRaw.length !== 13)) {
    toast('Enter a valid ISBN-10 or ISBN-13', true); return;
  }
  const btn = document.getElementById(prefix + '_isbn_btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Looking up…'; }
  try {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbnRaw}&format=json&jscmd=data`);
    const data = await res.json();
    const key = `ISBN:${isbnRaw}`;
    if (!data[key]) { toast('ISBN not found — try entering details manually', true); return; }
    const book = data[key];

    // Fill book fields
    const nameEl = document.getElementById(prefix === 'f' ? 'f_name' : 'd_name');
    if (nameEl && book.title && !nameEl.value) nameEl.value = book.title;

    const authorEl = document.getElementById(prefix + '_author');
    if (authorEl && book.authors?.length) authorEl.value = book.authors.map(a => a.name).join(', ');

    const pubEl = document.getElementById(prefix + '_publisher');
    if (pubEl && book.publishers?.length) pubEl.value = book.publishers[0].name;

    const yearEl = document.getElementById(prefix + '_pub_year');
    if (yearEl && book.publish_date) {
      const yearMatch = book.publish_date.match(/\d{4}/);
      if (yearMatch) yearEl.value = yearMatch[0];
    }

    // Set category to Books if not already
    const catEl = document.getElementById(prefix === 'f' ? 'f_cat' : 'd_cat');
    if (catEl && !isBookCat(catEl.value)) {
      catEl.value = 'Books';
      if (prefix === 'f') syncAddSubcat();
      else syncDrawerSubcat();
    }

    // Try to set subcategory from subjects
    if (book.subjects?.length) {
      const subEl = document.getElementById(prefix + '_subcat_txt');
      if (subEl && !subEl.value) subEl.value = book.subjects[0].name;
    }

    toast('ISBN found: ' + (book.title || isbnRaw) + ' ✓');
  } catch (e) {
    toast('ISBN lookup failed: ' + e.message, true);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔍 Lookup'; }
  }
}

export function calcFBA(prefix) {
  const price = parseFloat(document.getElementById(prefix === 'f' ? 'f_price' : 'd_price')?.value) || 0;
  const cost = parseFloat(document.getElementById(prefix === 'f' ? 'f_cost' : 'd_cost')?.value) || 0;
  const shipSelf = parseFloat(document.getElementById(prefix === 'f' ? 'f_ship' : 'd_ship')?.value) || 4.50;
  const panel = document.getElementById(prefix + '_fba_panel');
  if (!panel) return;
  if (!price) { toast('Set a list price first', true); return; }

  // Amazon book fees (approximate)
  const referralFee = price * 0.15; // 15% referral
  const closingFee = 1.80; // variable closing fee for media

  // FBA
  const fbaFulfill = 3.07; // standard media fulfillment
  const fbaStorage = 0.10; // est monthly storage per book
  const fbaTotalFees = referralFee + closingFee + fbaFulfill + fbaStorage;
  const fbaProfit = price - cost - fbaTotalFees;

  // Merchant Fulfilled (MF)
  const mfShipCredit = price >= 10 ? 3.99 : 3.49; // Amazon shipping credit for media
  const mfTotalFees = referralFee + closingFee;
  const mfShipCost = shipSelf;
  const mfProfit = price - cost - mfTotalFees - mfShipCost + mfShipCredit;

  const fbaWins = fbaProfit > mfProfit;
  const fmtV = v => `<span style="color:${v >= 0 ? 'var(--good)' : 'var(--danger)'}">${fmt(v)}</span>`;

  panel.classList.add('on');
  panel.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">
      <div>
        <div style="font-size:10px;font-weight:700;color:var(--accent3);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;text-align:center">FBA</div>
        <div class="fba-row"><span class="fba-lbl">Referral (15%)</span><span class="fba-val">${fmt(referralFee)}</span></div>
        <div class="fba-row"><span class="fba-lbl">Closing Fee</span><span class="fba-val">${fmt(closingFee)}</span></div>
        <div class="fba-row"><span class="fba-lbl">Fulfillment</span><span class="fba-val">${fmt(fbaFulfill)}</span></div>
        <div class="fba-row"><span class="fba-lbl">Storage/mo</span><span class="fba-val">${fmt(fbaStorage)}</span></div>
        <div class="fba-row fba-total"><span class="fba-lbl">Profit</span><span class="fba-val">${fmtV(fbaProfit)}</span></div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;text-align:center">Self-Ship</div>
        <div class="fba-row"><span class="fba-lbl">Referral (15%)</span><span class="fba-val">${fmt(referralFee)}</span></div>
        <div class="fba-row"><span class="fba-lbl">Closing Fee</span><span class="fba-val">${fmt(closingFee)}</span></div>
        <div class="fba-row"><span class="fba-lbl">Shipping</span><span class="fba-val">${fmt(mfShipCost)}</span></div>
        <div class="fba-row"><span class="fba-lbl">Ship Credit</span><span class="fba-val" style="color:var(--good)">+${fmt(mfShipCredit)}</span></div>
        <div class="fba-row fba-total"><span class="fba-lbl">Profit</span><span class="fba-val">${fmtV(mfProfit)}</span></div>
      </div>
    </div>
    <div class="fba-winner" style="background:${fbaWins ? 'rgba(123,97,255,0.1);color:var(--accent3)' : 'rgba(87,200,255,0.1);color:var(--accent)'}">
      ${fbaWins ? '📦 FBA wins' : '📮 Self-Ship wins'} by ${fmt(Math.abs(fbaProfit - mfProfit))} per unit
    </div>
    <div style="margin-top:10px;padding:8px 10px;background:rgba(255,184,0,0.06);border:1px solid rgba(255,184,0,0.15);font-size:10px;color:var(--warn);font-family:'DM Mono',monospace">⚠ Fee estimates shown are for Books/Media category. Other categories (electronics, apparel, etc.) have different fee structures.</div>`;
}

export function getBookFields(prefix) {
  return {
    isbn: document.getElementById(prefix + '_isbn')?.value.trim() || '',
    author: document.getElementById(prefix + '_author')?.value.trim() || '',
    publisher: document.getElementById(prefix + '_publisher')?.value.trim() || '',
    edition: document.getElementById(prefix + '_edition')?.value.trim() || '',
    printing: document.getElementById(prefix + '_printing')?.value.trim() || '',
    pubYear: parseInt(document.getElementById(prefix + '_pub_year')?.value) || null,
    signed: document.getElementById(prefix + '_signed')?.checked || false,
    salesRank: parseInt(document.getElementById(prefix + '_sales_rank')?.value) || null,
  };
}

export function loadBookFields(prefix, item) {
  document.getElementById(prefix + '_isbn').value = item.isbn || '';
  document.getElementById(prefix + '_author').value = item.author || '';
  document.getElementById(prefix + '_publisher').value = item.publisher || '';
  document.getElementById(prefix + '_edition').value = item.edition || '';
  document.getElementById(prefix + '_printing').value = item.printing || '';
  document.getElementById(prefix + '_pub_year').value = item.pubYear || '';
  document.getElementById(prefix + '_signed').checked = !!item.signed;
  document.getElementById(prefix + '_sales_rank').value = item.salesRank || '';
  updateRankDisplay(prefix);
  // Hide FBA panel on load
  const fp = document.getElementById(prefix + '_fba_panel');
  if (fp) { fp.classList.remove('on'); fp.innerHTML = ''; }
}

export function clearBookFields(prefix) {
  ['isbn','author','publisher','edition','printing','pub_year','sales_rank'].forEach(f => {
    const el = document.getElementById(prefix + '_' + f);
    if (el) el.value = '';
  });
  const signed = document.getElementById(prefix + '_signed');
  if (signed) signed.checked = false;
  const rd = document.getElementById(prefix + '_rank_display');
  if (rd) rd.innerHTML = '';
  const fp = document.getElementById(prefix + '_fba_panel');
  if (fp) { fp.classList.remove('on'); fp.innerHTML = ''; }
  const bf = document.getElementById(prefix + '_book_fields');
  if (bf) bf.classList.remove('on');
}

// Import for ISBN lookup functionality
function syncAddSubcat() {
  const cat = document.getElementById('f_cat').value.trim();
  const subs = SUBCATS[cat] || [];
  const dl = document.getElementById('f_subcat_dl');
  if (dl) dl.innerHTML = subs.map(s => `<option value="${s}">`).join('');
  // populateSubcatSelect('f_subcat', cat, document.getElementById('f_subcat_txt').value);
  // populateSubtypeSelect('f_subtype', document.getElementById('f_subcat').value, '');
  // toggleBookFields('f');
}

function syncDrawerSubcat() {
  const cat = document.getElementById('d_cat').value.trim();
  const subs = SUBCATS[cat] || [];
  const dl = document.getElementById('d_subcat_dl');
  if (dl) dl.innerHTML = subs.map(s => `<option value="${s}">`).join('');
  // populateSubcatSelect('d_subcat', cat, document.getElementById('d_subcat_txt').value);
  // populateSubtypeSelect('d_subtype', document.getElementById('d_subcat').value, '');
  // toggleBookFields('d');
}

// Note: loadCondTag is imported from drawer.js in actual usage
function loadCondTag(prefix, value) {
  const hiddenInput = document.getElementById(prefix + '_condition');
  const picker = document.getElementById(prefix + '_cond_picker');
  if (!hiddenInput || !picker) return;
  hiddenInput.value = value || '';
  picker.querySelectorAll('.cond-tag').forEach(b => {
    b.classList.toggle('active', b.textContent.trim() === value);
  });
}
