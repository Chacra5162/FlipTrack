// ebay-reconcile.js — Compare FlipTrack inventory vs live eBay listings
import { inv, save, refresh, markDirty } from '../data/store.js';
import { ebayAPI, isEBayConnected, getEBayUsername, setEBayUsername } from './ebay-auth.js';
import { pullEBayListings } from './ebay-sync.js';
import { markPlatformStatus } from './crosslist.js';
import { toast, releaseFocus, trapFocus } from '../utils/dom.js';
import { fmt, escHtml, escAttr } from '../utils/format.js';

const BROWSE_API = '/buy/browse/v1';

let _isReconciling = false;
let _reconcileCancelled = false;

async function _fetchEBayListings() {
  let username = getEBayUsername();
  if (!username) {
    const progressEl = document.getElementById('reconcileProgress');
    if (progressEl) progressEl.textContent = 'Discovering eBay username…';
    try { await pullEBayListings({ silent: true }); } catch (_) {}
    username = getEBayUsername();
  }
  if (!username) {
    try {
      const resp = await ebayAPI('GET', '/sell/fulfillment/v1/order?limit=10');
      for (const o of (resp?.orders || [])) {
        const lid = o?.lineItems?.[0]?.legacyItemId;
        if (!lid) continue;
        try {
          const ir = await ebayAPI('GET', `${BROWSE_API}/item/get_item_by_legacy_id?legacy_item_id=${lid}`);
          const s = ir?.seller?.username || ir?.seller?.userId;
          if (s) { username = s; setEBayUsername(username); break; }
        } catch (_) {}
      }
    } catch (_) {}
  }
  if (!username) throw new Error('eBay username not available. Make a sale or sync first to let FlipTrack discover it.');

  const sellerFilter = `sellers:%7B${encodeURIComponent(username)}%7D`;
  const queries = ['a', 'e', 'the', 'new', 'lot', 'vintage', 'set', 'bag', 'or', 'of', 'in'];
  const listings = new Map();

  for (let qi = 0; qi < queries.length; qi++) {
    if (_reconcileCancelled) throw new Error('Reconciliation cancelled');
    const q = queries[qi];
    const progressEl = document.getElementById('reconcileProgress');
    if (progressEl) progressEl.textContent = `Fetching… (${qi + 1}/${queries.length})`;
    try {
      const resp = await ebayAPI('GET',
        `${BROWSE_API}/item_summary/search?q=${encodeURIComponent(q)}&filter=${sellerFilter}&limit=200`
      );
      const summaries = resp?.itemSummaries || [];
      for (const s of summaries) {
        const lid = s.legacyItemId || '';
        if (!lid || listings.has(lid)) continue;
        const isAuction = (s.buyingOptions || []).includes('AUCTION');
        listings.set(lid, {
          listingId: lid,
          title: s.title || '',
          price: parseFloat(s.price?.value || '0'),
          currentBid: parseFloat(s.currentBidPrice?.value || '0'),
          isAuction,
          url: s.itemWebUrl || `https://www.ebay.com/itm/${lid}`,
          image: s.image?.imageUrl || s.thumbnailImages?.[0]?.imageUrl || '',
        });
      }
    } catch (e) {
      if (e.message?.includes('cancelled')) throw e;
      console.warn(`[Reconcile] query "${q}" failed:`, e.message);
    }
  }
  return listings;
}

export async function buildReconciliation() {
  if (!isEBayConnected()) throw new Error('eBay not connected');
  if (_isReconciling) throw new Error('Reconciliation already running');
  _isReconciling = true;

  try {
    const ebayMap = await _fetchEBayListings();

    const localActive = inv.filter(i => i.platforms?.includes('eBay') && i.platformStatus?.eBay === 'active');
    // Build lookup maps — try to match by listing ID, SKU, ebayItemId, and normalized title
    const _norm = s => (s||'').toString().toLowerCase().replace(/[^\w\s]/g,' ').replace(/\s+/g,' ').trim();
    const localByLid = new Map();
    const localBySku = new Map();
    const localByName = new Map();
    for (const item of localActive) {
      if (item.ebayListingId) localByLid.set(String(item.ebayListingId), item);
      if (item.sku) localBySku.set(item.sku.toLowerCase(), item);
      if (item.ebayItemId) localBySku.set(item.ebayItemId.toLowerCase(), item);
      if (item.name) localByName.set(_norm(item.name), item);
    }
    // Helper: find ANY local item matching an eBay listing
    const findLocalForListing = (listing) => {
      if (localByLid.has(listing.listingId)) return localByLid.get(listing.listingId);
      const titleNorm = _norm(listing.title);
      if (titleNorm && localByName.has(titleNorm)) return localByName.get(titleNorm);
      return null;
    };
    // Track which local items got matched (so we know what's truly local-only)
    const matchedLocal = new Set();

    const ebayOnly = [];
    for (const [lid, listing] of ebayMap) {
      const match = findLocalForListing(listing);
      if (match) {
        matchedLocal.add(match.id);
        // If the match exists but its ebayListingId is missing/stale, we'll flag as mismatch later
        continue;
      }
      const anyLocal = inv.find(i => String(i.ebayListingId || '') === lid);
      ebayOnly.push({ ...listing, localStatus: anyLocal?.platformStatus?.eBay || null, localItemId: anyLocal?.id || null });
    }

    const localOnly = [];
    for (const item of localActive) {
      if (matchedLocal.has(item.id)) continue;
      const lid = String(item.ebayListingId || '');
      if (!lid || !ebayMap.has(lid)) {
        localOnly.push(item);
      }
    }

    // 3. Mismatched: both sides have the listing but data differs.
    // Use the same fuzzy matcher as above so items without a stored
    // ebayListingId still get compared via name.
    const mismatched = [];
    for (const [lid, listing] of ebayMap) {
      const item = localByLid.get(lid) || findLocalForListing(listing);
      if (!item) continue;
      const diffs = [];
      if (!listing.isAuction) {
        const localPrice = item.price || 0;
        if (Math.abs(localPrice - listing.price) > 0.01 && listing.price > 0) {
          diffs.push({ field: 'price', local: localPrice, remote: listing.price });
        }
      }
      const localFmt = item.ebayListingFormat || 'FIXED_PRICE';
      const remoteFmt = listing.isAuction ? 'AUCTION' : 'FIXED_PRICE';
      if (localFmt !== remoteFmt) {
        diffs.push({ field: 'format', local: localFmt, remote: remoteFmt });
      }
      // Listing ID drift: we matched by name but the stored ID differs
      if (String(item.ebayListingId || '') !== lid) {
        diffs.push({ field: 'listingId', local: item.ebayListingId || '(none)', remote: lid });
      }
      if (diffs.length) {
        mismatched.push({ item, listing, diffs });
      }
    }

    return { ebayOnly, localOnly, mismatched, ebayTotal: ebayMap.size, localTotal: localActive.length };
  } finally {
    _isReconciling = false;
  }
}

export async function openReconcileModal() {
  if (!isEBayConnected()) { toast('eBay not connected — connect in Settings', true); return; }

  let modal = document.getElementById('reconcileOv');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'reconcileOv';
    modal.className = 'overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.onclick = (e) => { if (e.target === modal) closeReconcileModal(); };
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal" style="max-width:900px;width:92vw;max-height:85vh;display:flex;flex-direction:column">
      <div class="modal-hdr" style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--border)">
        <div class="modal-ttl" style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px">eBay Reconciliation</div>
        <button onclick="closeReconcileModal()" style="background:none;border:none;color:var(--muted);font-size:22px;cursor:pointer;line-height:1">×</button>
      </div>
      <div id="reconcileBody" style="padding:18px;overflow-y:auto;flex:1">
        <div style="text-align:center;padding:40px">
          <div class="spinner" style="margin:0 auto 18px;width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:ft-spin 0.8s linear infinite"></div>
          <div id="reconcileProgress" style="font-size:13px;color:var(--muted);margin-bottom:8px">Fetching live eBay listings…</div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:16px">This may take 10-20 seconds</div>
          <button class="btn-secondary" onclick="cancelReconcile()" style="font-size:11px">Cancel</button>
        </div>
        <style>@keyframes ft-spin { to { transform: rotate(360deg); } }</style>
      </div>
    </div>`;
  modal.style.display = '';
  modal.classList.add('on');
  trapFocus('#reconcileOv .modal');
  _reconcileCancelled = false;

  try {
    const r = await buildReconciliation();
    _renderReconcileResults(r);
  } catch (e) {
    if (e.message?.includes('cancelled')) {
      closeReconcileModal();
      toast('Reconciliation cancelled');
      return;
    }
    document.getElementById('reconcileBody').innerHTML = `
      <div style="padding:20px;color:var(--danger)">
        <strong>Error:</strong> ${escHtml(e.message)}
      </div>`;
  }
}

export function cancelReconcile() {
  _reconcileCancelled = true;
}

export function closeReconcileModal() {
  const modal = document.getElementById('reconcileOv');
  if (modal) { modal.classList.remove('on'); modal.style.display = 'none'; }
  releaseFocus();
}

function _renderReconcileResults(r) {
  const body = document.getElementById('reconcileBody');
  if (!body) return;

  const ebayOnlyHtml = r.ebayOnly.length ? `
    <div style="margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-family:'Syne',sans-serif;font-weight:700;color:var(--accent)">📥 On eBay, Not in FlipTrack (${r.ebayOnly.length})</div>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:10px">These listings are live on eBay but either missing from your inventory or marked inactive locally.</div>
      <table class="ih-table"><thead><tr>
        <th>Title</th><th>Price</th><th>Format</th><th>Local Status</th><th>Action</th>
      </tr></thead><tbody>
        ${r.ebayOnly.map(l => `<tr>
          <td class="ih-td-name"><a href="${escAttr(l.url)}" target="_blank" rel="noopener" style="color:var(--accent)">${escHtml(l.title.slice(0, 50))}</a></td>
          <td>${l.isAuction ? fmt(l.currentBid || l.price) + ' bid' : fmt(l.price)}</td>
          <td>${l.isAuction ? 'Auction' : 'Fixed'}</td>
          <td style="color:${l.localStatus ? 'var(--warn)' : 'var(--muted)'}">${l.localStatus || 'not imported'}</td>
          <td>${l.localItemId
            ? `<button class="act-btn" onclick="reconcileMarkActive('${escAttr(l.localItemId)}')">Mark Active</button>`
            : `<button class="act-btn" onclick="reconcileImport('${escAttr(l.listingId)}')">Import</button>`}</td>
        </tr>`).join('')}
      </tbody></table>
    </div>` : '';

  const localOnlyHtml = r.localOnly.length ? `
    <div style="margin-bottom:24px">
      <div style="font-family:'Syne',sans-serif;font-weight:700;color:var(--warn);margin-bottom:10px">📤 In FlipTrack, Not on eBay (${r.localOnly.length})</div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:10px">FlipTrack shows these as active on eBay, but they're not in eBay's live listings. They likely ended, sold, or were removed.</div>
      <table class="ih-table"><thead><tr>
        <th>Item</th><th>Qty</th><th>Price</th><th>Format</th><th>Action</th>
      </tr></thead><tbody>
        ${r.localOnly.map(i => `<tr>
          <td class="ih-td-name" style="cursor:pointer" onclick="openDrawer('${escAttr(i.id)}')">${escHtml((i.name || 'Unnamed').slice(0, 50))}</td>
          <td>${i.qty || 0}</td>
          <td>${fmt(i.price || 0)}</td>
          <td>${i.ebayListingFormat === 'AUCTION' ? 'Auction' : 'Fixed'}</td>
          <td>
            <button class="act-btn" onclick="reconcileMarkEnded('${escAttr(i.id)}')" title="Mark as ended/expired">Mark Ended</button>
            <button class="act-btn" onclick="openDrawer('${escAttr(i.id)}')">Edit</button>
          </td>
        </tr>`).join('')}
      </tbody></table>
    </div>` : '';

  const linkageCount = r.mismatched.filter(m => m.diffs.some(d => d.field === 'listingId')).length;
  const mismatchHtml = r.mismatched.length ? `
    <div style="margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-family:'Syne',sans-serif;font-weight:700;color:var(--accent2)">⚠ Data Mismatches (${r.mismatched.length})</div>
        ${linkageCount > 0 ? `<button class="btn-secondary" onclick="reconcileFixLinkage()" style="font-size:11px">🔗 Fix ${linkageCount} Linkage Issue${linkageCount > 1 ? 's' : ''}</button>` : ''}
      </div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:10px">Both sides have the listing but values differ. "listingId" mismatches mean FlipTrack has the item but isn't linked to the live eBay listing — click "Fix Linkage" to auto-repair.</div>
      <table class="ih-table"><thead><tr>
        <th>Item</th><th>Field</th><th>FlipTrack</th><th>eBay</th><th>Action</th>
      </tr></thead><tbody>
        ${r.mismatched.flatMap(m => m.diffs.map(d => `<tr>
          <td class="ih-td-name" style="cursor:pointer" onclick="openDrawer('${escAttr(m.item.id)}')">${escHtml((m.item.name || 'Unnamed').slice(0, 40))}</td>
          <td><strong>${escHtml(d.field)}</strong></td>
          <td>${d.field === 'price' ? fmt(d.local) : escHtml(String(d.local))}</td>
          <td style="color:var(--accent)">${d.field === 'price' ? fmt(d.remote) : escHtml(String(d.remote))}</td>
          <td><button class="act-btn" onclick="openDrawer('${escAttr(m.item.id)}')">Review</button></td>
        </tr>`)).join('')}
      </tbody></table>
    </div>` : '';

  const summaryHtml = `
    <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
      <div class="ih-card"><div class="ih-card-val">${r.ebayTotal}</div><div class="ih-card-lbl">Live on eBay</div></div>
      <div class="ih-card"><div class="ih-card-val">${r.localTotal}</div><div class="ih-card-lbl">Active in FlipTrack</div></div>
      <div class="ih-card ${r.ebayOnly.length ? 'ih-card-warn' : ''}"><div class="ih-card-val">${r.ebayOnly.length}</div><div class="ih-card-lbl">eBay-only</div></div>
      <div class="ih-card ${r.localOnly.length ? 'ih-card-warn' : ''}"><div class="ih-card-val">${r.localOnly.length}</div><div class="ih-card-lbl">FlipTrack-only</div></div>
      <div class="ih-card ${r.mismatched.length ? 'ih-card-warn' : ''}"><div class="ih-card-val">${r.mismatched.length}</div><div class="ih-card-lbl">Mismatched</div></div>
    </div>`;

  const allClearHtml = (!r.ebayOnly.length && !r.localOnly.length && !r.mismatched.length) ? `
    <div style="text-align:center;padding:40px;color:var(--good)">
      <div style="font-size:48px;margin-bottom:10px">✓</div>
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:18px">Everything in sync!</div>
      <div style="font-size:12px;color:var(--muted);margin-top:6px">Your FlipTrack inventory matches your live eBay listings.</div>
    </div>` : '';

  body.innerHTML = summaryHtml + allClearHtml + ebayOnlyHtml + localOnlyHtml + mismatchHtml;
}

export function reconcileMarkEnded(itemId) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return;
  const isAuction = item.ebayListingFormat === 'AUCTION';
  markPlatformStatus(itemId, 'eBay', isAuction ? 'expired' : 'removed');
  markDirty('inv', itemId);
  save(); refresh();
  toast(`Marked "${item.name?.slice(0, 30) || 'item'}" as ${isAuction ? 'expired' : 'removed'}`);
  openReconcileModal();
}

export function reconcileMarkActive(itemId) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return;
  markPlatformStatus(itemId, 'eBay', 'active');
  markDirty('inv', itemId);
  save(); refresh();
  toast(`Marked "${item.name?.slice(0, 30) || 'item'}" as active`);
  openReconcileModal();
}

export async function reconcileFixLinkage() {
  const r = await buildReconciliation();
  let fixed = 0;
  for (const m of r.mismatched) {
    const d = m.diffs.find(x => x.field === 'listingId');
    if (!d) continue;
    const newLid = String(d.remote);
    m.item.ebayListingId = newLid;
    m.item.url = `https://www.ebay.com/itm/${newLid}`;
    markDirty('inv', m.item.id);
    fixed++;
  }
  if (fixed > 0) { save(); refresh(); toast(`Linked ${fixed} item${fixed > 1 ? 's' : ''} to live eBay listings`); }
  openReconcileModal();
}

export function reconcileImport(listingId) {
  closeReconcileModal();
  if (typeof window.promptImportEBay === 'function') {
    window.promptImportEBay();
  } else {
    toast('Use More ▾ → Import from eBay to add this listing', true);
  }
}
