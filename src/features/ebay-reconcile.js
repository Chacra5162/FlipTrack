// ebay-reconcile.js — Compare FlipTrack inventory vs live eBay listings
import { inv, save, refresh, markDirty, isVariant } from '../data/store.js';
import { ebayAPI, isEBayConnected, getEBayUsername, setEBayUsername } from './ebay-auth.js';
import { pullEBayListings, endEBayListingByLid, importEBayItem } from './ebay-sync.js';
import { markPlatformStatus } from './crosslist.js';
import { toast, releaseFocus, trapFocus } from '../utils/dom.js';
import { fmt, escHtml, escAttr } from '../utils/format.js';

const BROWSE_API = '/buy/browse/v1';

let _isReconciling = false;
let _reconcileCancelled = false;
let _lastReconcile = null; // cache so button handlers don't re-fetch

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
  const listings = new Map();
  const progressEl = document.getElementById('reconcileProgress');

  // ── Phase 0: Trading API GetMyeBaySelling — 1 call per 200 listings ──────
  // Most efficient path: returns the complete active listing set directly.
  // Falls back to the keyword sweep (Phase 1) only if Trading API is unavailable.
  let tradingSucceeded = false;
  if (progressEl) progressEl.textContent = 'Fetching live eBay listings…';
  try {
    let pageNum = 1, totalPages = 1;
    while (pageNum <= totalPages) {
      if (_reconcileCancelled) throw new Error('Reconciliation cancelled');
      const resp = await ebayAPI('POST', '/ws/api.dll', {
        _tradingCall: 'GetMyeBaySelling',
        ActiveList: { Include: true, Pagination: { EntriesPerPage: 200, PageNumber: pageNum }, Sort: 1 },
        DetailLevel: 'ReturnAll',
      });
      const activeList = resp?.ActiveList || resp?.GetMyeBaySellingResponse?.ActiveList;
      if (!activeList) break;
      totalPages = parseInt(activeList?.PaginationResult?.TotalNumberOfPages || '1', 10);
      const items = activeList?.ItemArray?.Item || [];
      const itemArr = Array.isArray(items) ? items : (items.ItemID ? [items] : []);
      for (const ebayItem of itemArr) {
        const lid = String(ebayItem.ItemID || '');
        if (!lid || listings.has(lid)) continue;
        const isAuction = ebayItem.ListingType === 'Chinese';
        const price = parseFloat(
          ebayItem.SellingStatus?.CurrentPrice?.Value
          || ebayItem.BuyItNowPrice?.Value
          || ebayItem.StartPrice?.Value || '0'
        );
        const imgRaw = ebayItem.PictureDetails?.PictureURL;
        listings.set(lid, {
          listingId: lid, title: ebayItem.Title || '',
          price: isAuction ? 0 : price,
          currentBid: isAuction ? price : 0,
          isAuction,
          url: `https://www.ebay.com/itm/${lid}`,
          image: Array.isArray(imgRaw) ? imgRaw[0] : (imgRaw || ''),
        });
      }
      if (progressEl) progressEl.textContent = `Fetched ${listings.size} listings… (page ${pageNum}/${totalPages})`;
      pageNum++;
    }
    if (listings.size > 0) tradingSucceeded = true;
  } catch (e) {
    if (e.message?.includes('cancelled')) throw e;
    console.warn('[Reconcile] Trading API unavailable, falling back to keyword search:', e.message);
  }

  // ── Phase 1: Broad seller keyword search (fallback when Trading API fails) ─
  if (!tradingSucceeded) {
    const tokenCounts = new Map();
    for (const item of inv) {
      if (item.sold || item.deleted) continue;
      if (!item.platforms?.includes('eBay') && !item.ebayItemId) continue;
      for (const w of (item.name || '').toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/)) {
        if (w.length >= 3 && !/^(the|and|for|with|new|used|size|pack|lot)$/.test(w)) {
          tokenCounts.set(w, (tokenCounts.get(w) || 0) + 1);
        }
      }
    }
    const inventoryKeywords = [...tokenCounts.entries()].sort((a,b) => b[1] - a[1]).slice(0, 24).map(e => e[0]);
    const broadTerms = ['the', 'for', 'new', 'lot', 'vintage', 'set', 'size', 'men', 'women', 'with', 'and'];
    const queries = [...new Set([...broadTerms, ...inventoryKeywords])];
    const BATCH2 = 5;
    for (let qi = 0; qi < queries.length; qi += BATCH2) {
      if (_reconcileCancelled) throw new Error('Reconciliation cancelled');
      const batch = queries.slice(qi, qi + BATCH2);
      if (progressEl) progressEl.textContent = `Searching eBay listings… (${Math.min(qi + BATCH2, queries.length)}/${queries.length} queries — ${listings.size} found)`;
      await Promise.all(batch.map(async q => {
        try {
          const resp = await ebayAPI('GET',
            `${BROWSE_API}/item_summary/search?q=${encodeURIComponent(q)}&filter=${sellerFilter}&limit=200`
          );
          for (const s of (resp?.itemSummaries || [])) {
            const lid = s.legacyItemId || '';
            if (!lid || listings.has(lid)) continue;
            const isAuction = (s.buyingOptions || []).includes('AUCTION');
            listings.set(lid, {
              listingId: lid, title: s.title || '',
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
      }));
    }
  }

  // ── Phase 2: Per-listing check for known IDs missed by Phase 0/1 ──────────
  // When Trading API returned all listings this is a no-op. When falling back
  // to keyword search, this catches listings with unusual titles.
  const knownLids = [...new Set(inv
    .filter(i => i.ebayListingId && !i.sold && !i.deleted)
    .map(i => String(i.ebayListingId))
  )].filter(lid => !listings.has(lid));

  if (knownLids.length > 0) {
    if (progressEl) progressEl.textContent = `Verifying ${knownLids.length} remaining known listing${knownLids.length > 1 ? 's' : ''}…`;
    const BATCH1 = 6;
    for (let i = 0; i < knownLids.length; i += BATCH1) {
      if (_reconcileCancelled) throw new Error('Reconciliation cancelled');
      await Promise.all(knownLids.slice(i, i + BATCH1).map(async lid => {
        try {
          const resp = await ebayAPI('GET', `${BROWSE_API}/item/get_item_by_legacy_id?legacy_item_id=${lid}&fieldgroups=PRODUCT`);
          if (!resp?.itemId) return;
          const isAuction = (resp.buyingOptions || []).includes('AUCTION');
          listings.set(lid, {
            listingId: lid,
            title: resp.title || '',
            price: parseFloat(resp.price?.value || '0'),
            currentBid: parseFloat(resp.currentBidPrice?.value || '0'),
            isAuction,
            url: resp.itemWebUrl || `https://www.ebay.com/itm/${lid}`,
            image: resp.image?.imageUrl || resp.thumbnailImages?.[0]?.imageUrl || '',
          });
        } catch (_) { /* 404 = listing ended/removed — correctly absent from results */ }
      }));
    }
  }

  return listings;
}

export async function buildReconciliation() {
  if (!isEBayConnected()) throw new Error('eBay not connected');
  if (_isReconciling) { _isReconciling = false; } // Reset stale guard from prior crash
  _isReconciling = true;

  try {
    const ebayMap = await _fetchEBayListings();

    // Only count items that could plausibly exist on eBay: active status AND
    // some eBay reference (listingId or inventory SKU). Pure phantoms with
    // neither are reconciled separately by the eBay sync itself. Variant
    // children are excluded — when a multi-variant listing is live on eBay
    // it shows as a single listing, not one per variant, so counting each
    // child inflates the local total over eBay's.
    const localActive = inv.filter(i =>
      i.platforms?.includes('eBay')
      && i.platformStatus?.eBay === 'active'
      && (i.ebayListingId || i.ebayItemId)
      && !isVariant(i)
    );
    const _norm = s => (s||'').toString().toLowerCase().replace(/[^\w\s]/g,' ').replace(/\s+/g,' ').trim();
    // Strip common eBay title noise words so "NEW Blue Shirt Free Ship" matches "Blue Shirt"
    const _stripNoise = s => _norm(s).replace(/\b(new|nib|nwt|nwob|mint|sealed|used|brand new|free ship(ping)?|w\/|with|tags?|authentic|lot of \d+|pack of \d+|bundle)\b/g, ' ').replace(/\s+/g, ' ').trim();
    const _tokenSet = s => new Set(_stripNoise(s).split(' ').filter(w => w.length >= 3));
    const localByLid = new Map();
    const localBySku = new Map();
    const localByName = new Map();
    const localTokenSets = []; // [{item, tokens}]
    for (const item of localActive) {
      if (item.ebayListingId) localByLid.set(String(item.ebayListingId), item);
      if (item.sku) localBySku.set(item.sku.toLowerCase(), item);
      if (item.ebayItemId) localBySku.set(item.ebayItemId.toLowerCase(), item);
      if (item.name) {
        localByName.set(_norm(item.name), item);
        localTokenSets.push({ item, tokens: _tokenSet(item.name) });
      }
    }
    const findLocalForListing = (listing) => {
      if (localByLid.has(listing.listingId)) return localByLid.get(listing.listingId);
      const titleNorm = _norm(listing.title);
      if (titleNorm && localByName.has(titleNorm)) return localByName.get(titleNorm);
      // Fuzzy token-overlap match — ≥60% of local's tokens appear in eBay title
      const ebayTokens = _tokenSet(listing.title);
      if (ebayTokens.size === 0) return null;
      let best = null, bestScore = 0;
      for (const { item, tokens } of localTokenSets) {
        if (tokens.size < 2) continue;
        let hits = 0;
        for (const t of tokens) if (ebayTokens.has(t)) hits++;
        const score = hits / tokens.size;
        if (score >= 0.6 && score > bestScore) { best = item; bestScore = score; }
      }
      return best;
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

    // Phase 3: Verify items that appear "FlipTrack-only" by fetching eBay directly.
    // Keyword search + fuzzy matching can miss items with unusual titles or stale IDs.
    // For each candidate: first try a direct listing-ID lookup, then a name search.
    if (localOnly.length > 0) {
      const sellerUsername = getEBayUsername();
      const sellerFilter = sellerUsername
        ? `sellers:%7B${encodeURIComponent(sellerUsername)}%7D`
        : null;

      const BATCH3 = 4;
      for (let vi = 0; vi < localOnly.length; vi += BATCH3) {
        if (_reconcileCancelled) break;
        await Promise.all(localOnly.slice(vi, vi + BATCH3).map(async item => {
          // Step A: direct listing ID lookup if we have one not yet in ebayMap
          const lid = String(item.ebayListingId || '');
          if (lid && !ebayMap.has(lid)) {
            try {
              const resp = await ebayAPI('GET', `${BROWSE_API}/item/get_item_by_legacy_id?legacy_item_id=${lid}`);
              if (resp?.itemId) {
                const isAuction = (resp.buyingOptions || []).includes('AUCTION');
                ebayMap.set(lid, {
                  listingId: lid, title: resp.title || '',
                  price: parseFloat(resp.price?.value || '0'),
                  currentBid: parseFloat(resp.currentBidPrice?.value || '0'),
                  isAuction, url: resp.itemWebUrl || `https://www.ebay.com/itm/${lid}`,
                  image: resp.image?.imageUrl || resp.thumbnailImages?.[0]?.imageUrl || '',
                });
                matchedLocal.add(item.id);
                return;
              }
            } catch (_) {}
          } else if (lid && ebayMap.has(lid)) {
            matchedLocal.add(item.id);
            return;
          }

          // Step B: name search — finds items with wrong/missing listing IDs
          if (!item.name || !sellerFilter) return;
          try {
            const q = encodeURIComponent(item.name.slice(0, 80));
            const resp = await ebayAPI('GET',
              `${BROWSE_API}/item_summary/search?q=${q}&filter=${sellerFilter}&limit=10`
            );
            for (const s of (resp?.itemSummaries || [])) {
              const foundLid = s.legacyItemId || '';
              if (!foundLid) continue;
              const sTokens = _tokenSet(s.title || '');
              const iTokens = _tokenSet(item.name);
              if (iTokens.size < 2) continue;
              let hits = 0;
              for (const t of iTokens) if (sTokens.has(t)) hits++;
              if (hits / iTokens.size >= 0.5) {
                if (!ebayMap.has(foundLid)) {
                  const isAuction = (s.buyingOptions || []).includes('AUCTION');
                  ebayMap.set(foundLid, {
                    listingId: foundLid, title: s.title || '',
                    price: parseFloat(s.price?.value || '0'),
                    currentBid: parseFloat(s.currentBidPrice?.value || '0'),
                    isAuction, url: s.itemWebUrl || `https://www.ebay.com/itm/${foundLid}`,
                    image: s.image?.imageUrl || s.thumbnailImages?.[0]?.imageUrl || '',
                  });
                }
                matchedLocal.add(item.id);
                break;
              }
            }
          } catch (e) {
            if (e.message?.includes('cancelled')) throw e;
          }
        }));
      }

      // Rebuild localOnly — items confirmed via Phase 3 are no longer "FlipTrack-only"
      localOnly.length = 0;
      for (const item of localActive) {
        if (matchedLocal.has(item.id)) continue;
        const lid = String(item.ebayListingId || '');
        if (!lid || !ebayMap.has(lid)) localOnly.push(item);
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

    _lastReconcile = { ebayOnly, localOnly, mismatched, ebayTotal: ebayMap.size, localTotal: localActive.length };
    return _lastReconcile;
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
  _lastReconcile = null; // always re-fetch when modal is explicitly opened

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

  // Phantom candidates: live on eBay but either sold locally or never imported.
  // Only mark as phantom when the item is truly orphaned (!localItemId) or the
  // local copy is marked sold/sold-elsewhere. Do NOT auto-end listings whose local
  // status is 'removed' or 'expired' — those represent a data inconsistency where
  // FlipTrack thinks eBay already removed it, but it's still live. Ending those
  // automatically has caused active listings to be taken down in error.
  const _isPhantom = l => !l.localItemId || l.localStatus === 'sold' || l.localStatus === 'sold-elsewhere';
  const phantomCount = r.ebayOnly.filter(_isPhantom).length;
  const ebayOnlyHtml = r.ebayOnly.length ? `
    <div style="margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;flex-wrap:wrap">
        <div style="font-family:'Syne',sans-serif;font-weight:700;color:var(--accent)">📥 On eBay, Not in FlipTrack (${r.ebayOnly.length})</div>
        ${phantomCount > 0 ? `<button class="btn-secondary" onclick="reconcileDumpAllPhantoms()" style="font-size:11px">🚫 End ${phantomCount} Phantom${phantomCount > 1 ? 's' : ''} on eBay</button>` : ''}
      </div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:10px">These listings are live on eBay but either missing from your inventory or marked inactive locally. Use "End on eBay" to take down listings that shouldn't be live anymore (e.g. already sold elsewhere). Items showing "removed" or "expired" locally may be a sync mismatch — use "Mark Active" to restore them, or "End on eBay" only if you're sure.</div>
      <table class="ih-table"><thead><tr>
        <th>Title</th><th>Price</th><th>Format</th><th>Local Status</th><th>Action</th>
      </tr></thead><tbody>
        ${r.ebayOnly.map(l => {
          const isConflict = l.localStatus === 'removed' || l.localStatus === 'expired';
          return `<tr${isConflict ? ' style="background:rgba(255,165,0,0.07)"' : ''}>
          <td class="ih-td-name"><a href="${escAttr(l.url)}" target="_blank" rel="noopener" style="color:var(--accent)">${escHtml(l.title.slice(0, 50))}</a>${isConflict ? ' <span style="font-size:10px;color:var(--warn)" title="FlipTrack marked this removed/expired but it\'s still live on eBay">⚠ sync conflict</span>' : ''}</td>
          <td>${l.isAuction ? fmt(l.currentBid || l.price) + ' bid' : fmt(l.price)}</td>
          <td>${l.isAuction ? 'Auction' : 'Fixed'}</td>
          <td style="color:${l.localStatus ? (isConflict ? 'var(--warn)' : 'var(--warn)') : 'var(--muted)'}">${l.localStatus || 'not imported'}</td>
          <td style="white-space:nowrap">${l.localItemId
            ? `<button class="act-btn" onclick="reconcileMarkActive('${escAttr(l.localItemId)}')">Mark Active</button>`
            : `<button class="act-btn" onclick="reconcileImport('${escAttr(l.listingId)}')">Import</button>`}
            <button class="act-btn red" onclick="reconcileEndListing('${escAttr(l.listingId)}','${escAttr(l.localItemId || '')}')" title="End this listing on eBay">End on eBay</button>
          </td>
        </tr>`;
        }).join('')}
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
          <td style="white-space:nowrap">
            <button class="act-btn" onclick="reconcileAcceptEbay('${escAttr(m.item.id)}','${escAttr(d.field)}',${JSON.stringify(d.remote).replace(/"/g,'&quot;')})" title="Update FlipTrack to match eBay">Use eBay</button>
            <button class="act-btn" onclick="openDrawer('${escAttr(m.item.id)}')">Review</button>
          </td>
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

/**
 * One-click repair: match ALL local eBay items to live listings and fix linkage.
 * For every item with eBay platform tag or ebayItemId, finds the live listing
 * by SKU, name, or listing ID and writes back the correct ebayListingId,
 * platformStatus, and URL.
 */
export async function repairEBayLinkage() {
  if (!isEBayConnected()) { toast('eBay not connected', true); return; }
  toast('Repairing eBay linkage — this may take 30 seconds…');

  try {
    const ebayMap = await _fetchEBayListings();
    const _norm = s => (s||'').toString().toLowerCase().replace(/[^\w\s]/g,' ').replace(/\s+/g,' ').trim();
    const _stripNoise = s => _norm(s).replace(/\b(new|nib|nwt|nwob|mint|sealed|used|brand new|free ship(ping)?|w\/|with|tags?|authentic|lot of \d+|pack of \d+|bundle)\b/g, ' ').replace(/\s+/g, ' ').trim();
    const _tokenSet = s => new Set(_stripNoise(s).split(' ').filter(w => w.length >= 3));

    // Index eBay listings by various keys for fast lookup
    const ebayByLid = new Map();
    const ebayBySku = new Map();
    const ebayTokens = [];
    for (const [lid, listing] of ebayMap) {
      ebayByLid.set(lid, listing);
      ebayTokens.push({ listing, tokens: _tokenSet(listing.title) });
    }

    // Get all local items that should be on eBay
    const ebayItems = inv.filter(i =>
      (i.platforms?.includes('eBay') || i.ebayItemId || i.ebayListingId) &&
      !i.sold && !i.deleted
    );

    let linked = 0, alreadyLinked = 0, notFound = 0;

    for (const item of ebayItems) {
      // Already correctly linked?
      if (item.ebayListingId && ebayByLid.has(item.ebayListingId)) {
        // Ensure status is active
        if (item.platformStatus?.eBay !== 'active') {
          markPlatformStatus(item.id, 'eBay', 'active');
          markDirty('inv', item.id);
          linked++;
        } else {
          alreadyLinked++;
        }
        continue;
      }

      // Try to find the matching eBay listing
      let match = null;

      // 1. By listing ID (stale but might still work)
      if (item.ebayListingId && ebayByLid.has(item.ebayListingId)) {
        match = ebayByLid.get(item.ebayListingId);
      }

      // 2. By exact normalized name
      if (!match) {
        const itemNorm = _norm(item.name);
        for (const [, listing] of ebayMap) {
          if (_norm(listing.title) === itemNorm) { match = listing; break; }
        }
      }

      // 3. By token overlap (≥60%)
      if (!match && item.name) {
        const itemTokens = _tokenSet(item.name);
        if (itemTokens.size >= 2) {
          let bestScore = 0;
          for (const { listing, tokens } of ebayTokens) {
            let hits = 0;
            for (const t of itemTokens) if (tokens.has(t)) hits++;
            const score = hits / itemTokens.size;
            if (score >= 0.6 && score > bestScore) { match = listing; bestScore = score; }
          }
        }
      }

      if (match) {
        item.ebayListingId = match.listingId;
        item.url = match.url || `https://www.ebay.com/itm/${match.listingId}`;
        if (!item.platformStatus) item.platformStatus = {};
        item.platformStatus.eBay = 'active';
        if (!item.platforms) item.platforms = [];
        if (!item.platforms.includes('eBay')) item.platforms.push('eBay');
        markDirty('inv', item.id);
        linked++;
      } else {
        notFound++;
      }
    }

    if (linked > 0) { save(); refresh(); }
    const msg = [];
    if (linked > 0) msg.push(`${linked} linked`);
    if (alreadyLinked > 0) msg.push(`${alreadyLinked} already OK`);
    if (notFound > 0) msg.push(`${notFound} not found on eBay`);
    toast(msg.join(' · ') || 'No eBay items found');
    return { linked, alreadyLinked, notFound };
  } catch (e) {
    toast('Repair failed: ' + e.message, true);
  }
}

/**
 * End a single "phantom" listing on eBay — a listing that's live on eBay
 * but already marked sold locally or not in FlipTrack at all.
 */
export async function reconcileEndListing(listingId, localItemId) {
  if (!listingId) return;
  if (!confirm(`End eBay listing #${listingId}? This will take it down from eBay immediately.`)) return;
  const r = await endEBayListingByLid(listingId, localItemId || null);
  if (r.success) {
    toast(`eBay listing #${listingId} ended ✓`);
    openReconcileModal();
  } else {
    toast(`Failed to end listing: ${r.error || 'unknown error'}`, true);
  }
}

/**
 * Bulk-end every eBay-only phantom (live on eBay, sold-or-missing locally).
 * Uses cached reconcile data so there's no re-fetch delay when called from
 * within the reconcile modal. End calls run in parallel (batches of 5) to
 * avoid Trading API rate limits while still being much faster than sequential.
 */
export async function reconcileDumpAllPhantoms() {
  const r = _lastReconcile || await buildReconciliation();
  // Only end listings that are truly orphaned (no local match at all) or whose
  // local copy is explicitly sold/sold-elsewhere. Never auto-end 'removed' or
  // 'expired' items — those are data-conflict cases, not confirmed phantoms.
  const phantoms = r.ebayOnly.filter(l => !l.localItemId || l.localStatus === 'sold' || l.localStatus === 'sold-elsewhere');
  // Safety re-check against current live state — never end a listing whose
  // local item is CURRENTLY active (stale cache or race condition protection).
  const safePhantoms = phantoms.filter(l => {
    if (!l.localItemId) return true;
    const localItem = inv.find(i => i.id === l.localItemId);
    return !localItem || localItem.platformStatus?.eBay !== 'active';
  });
  if (!safePhantoms.length) { toast('No phantom listings to end'); return; }
  if (!confirm(`End ${safePhantoms.length} phantom listing${safePhantoms.length > 1 ? 's' : ''} on eBay? This takes them down immediately and cannot be undone.`)) return;
  _lastReconcile = null; // stale after we end listings
  const BATCH = 5;
  let ok = 0, failed = 0;
  for (let i = 0; i < safePhantoms.length; i += BATCH) {
    const results = await Promise.all(
      safePhantoms.slice(i, i + BATCH).map(l => endEBayListingByLid(l.listingId, l.localItemId || null))
    );
    for (const res of results) { if (res.success) ok++; else failed++; }
  }
  save(); refresh();
  toast(`Ended ${ok} listing${ok === 1 ? '' : 's'}${failed ? ` (${failed} failed)` : ''}`);
  openReconcileModal();
}

export function reconcileMarkEnded(itemId) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return;
  const isAuction = item.ebayListingFormat === 'AUCTION';
  markPlatformStatus(itemId, 'eBay', isAuction ? 'expired' : 'removed');
  markDirty('inv', itemId);
  save(); refresh();
  toast(`Marked "${item.name?.slice(0, 30) || 'item'}" as ${isAuction ? 'expired' : 'removed'}`);
  if (_lastReconcile) {
    _lastReconcile.localOnly = _lastReconcile.localOnly.filter(i => i.id !== itemId);
    _lastReconcile.localTotal = Math.max(0, (_lastReconcile.localTotal || 1) - 1);
    _renderReconcileResults(_lastReconcile);
  } else {
    openReconcileModal();
  }
}

export function reconcileMarkActive(itemId) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return;
  markPlatformStatus(itemId, 'eBay', 'active');
  markDirty('inv', itemId);
  save(); refresh();
  toast(`Marked "${item.name?.slice(0, 30) || 'item'}" as active`);
  if (_lastReconcile) {
    _lastReconcile.ebayOnly = _lastReconcile.ebayOnly.filter(l => l.localItemId !== itemId);
    _renderReconcileResults(_lastReconcile);
  } else {
    openReconcileModal();
  }
}

/** Accept eBay's value for a specific field on one item. */
export function reconcileAcceptEbay(itemId, field, remoteValue) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return;
  if (field === 'price') item.price = parseFloat(remoteValue) || 0;
  else if (field === 'format') item.ebayListingFormat = String(remoteValue);
  else if (field === 'listingId') {
    item.ebayListingId = String(remoteValue);
    item.url = `https://www.ebay.com/itm/${remoteValue}`;
  }
  markDirty('inv', itemId);
  save(); refresh();
  toast(`Updated ${field} for "${(item.name || 'item').slice(0, 25)}"`);
  if (_lastReconcile) {
    for (const m of _lastReconcile.mismatched) {
      if (m.item.id === itemId) { m.diffs = m.diffs.filter(d => d.field !== field); break; }
    }
    _lastReconcile.mismatched = _lastReconcile.mismatched.filter(m => m.diffs.length > 0);
    _renderReconcileResults(_lastReconcile);
  } else {
    openReconcileModal();
  }
}

export async function reconcileFixLinkage() {
  // Use cached result — this is always called from within the reconcile modal
  // which already completed a full reconciliation. Re-fetching wastes 4+ minutes.
  const r = _lastReconcile || await buildReconciliation();
  let fixed = 0;
  for (const m of r.mismatched) {
    const d = m.diffs.find(x => x.field === 'listingId');
    if (!d) continue;
    const newLid = String(d.remote);
    m.item.ebayListingId = newLid;
    m.item.url = `https://www.ebay.com/itm/${newLid}`;
    markDirty('inv', m.item.id);
    m.diffs = m.diffs.filter(x => x.field !== 'listingId');
    fixed++;
  }
  if (fixed > 0) {
    save(); refresh();
    toast(`Linked ${fixed} item${fixed > 1 ? 's' : ''} to live eBay listings`);
    if (_lastReconcile) {
      _lastReconcile.mismatched = _lastReconcile.mismatched.filter(m => m.diffs.length > 0);
      _renderReconcileResults(_lastReconcile);
      return;
    }
  }
  _lastReconcile = null;
  openReconcileModal();
}

export async function reconcileImport(listingId) {
  if (!listingId) return;
  toast('Importing listing…');
  try {
    const result = await importEBayItem(String(listingId));
    if (result.success) {
      toast(`Imported: "${(result.item?.name || listingId).slice(0, 40)}" ✓`);
      refresh();
      if (_lastReconcile) {
        _lastReconcile.ebayOnly = _lastReconcile.ebayOnly.filter(l => l.listingId !== String(listingId));
        _renderReconcileResults(_lastReconcile);
      } else {
        openReconcileModal();
      }
    } else {
      toast(result.error || 'Import failed', true);
    }
  } catch (e) {
    toast('Import failed: ' + e.message, true);
  }
}
