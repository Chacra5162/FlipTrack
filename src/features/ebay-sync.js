/**
 * ebay-sync.js — eBay Listing Sync Module
 * Handles: Pull active listings from eBay, push new listings to eBay,
 * end/relist listings, and sync sold status.
 *
 * Uses the ebay-auth.js proxy for all API calls.
 */

import { inv, sales, save, refresh, markDirty, getInvItem, getSalesForItem, isInvDirty } from '../data/store.js';
import { EBAY_SYNC_INTERVAL } from '../config/timing.js';
import { ebayAPI, isEBayConnected, getEBayUsername } from './ebay-auth.js';
import { markPlatformStatus } from './crosslist.js';
import { autoDlistOnSale } from './crosslist.js';
import { getOrCreateBuyer } from '../views/buyers.js';
import { logSalePrice, logPriceChange, logItemEvent } from './price-history.js';
import { logReturn } from './returns.js';
import { toast } from '../utils/dom.js';
import { getMeta, setMeta } from '../data/idb.js';
import { localDate, uid } from '../utils/format.js';
import { addNotification } from './notification-center.js';
import { sendNotification } from './push-notifications.js';
import { sfx } from '../utils/sfx.js';

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const INVENTORY_API = '/sell/inventory/v1';
const FULFILLMENT_API = '/sell/fulfillment/v1';
const BROWSE_API = '/buy/browse/v1';

// CONDITION_MAP, ACCOUNT_API, and listing helpers moved to ebay-listing.js

// ── STATE ──────────────────────────────────────────────────────────────────
let _lastSyncTime = null;
let _syncing = false;
let _syncInterval = null;
let _orderSyncErrorLogged = false; // throttle repeated order-sync warnings
let _processedReturnIds = new Set(); // avoid duplicate return/cancel notifications
let _dismissedEBayIds = new Set(); // eBay IDs of items user deleted — prevent re-import
let _returnCheckInterval = null;
let _tradingApiBlocked = false; // set true after 403 — proxy doesn't support Trading API
let _offerApiBlocked = false;   // set true after 400 — account has invalid SKU data
const RETURN_CHECK_WINDOW = 30 * 86400000; // 30 days

/** eBay SKU must be alphanumeric (plus limited punctuation) and ≤50 chars */
function _isValidSku(sku) {
  return sku && sku.length <= 50 && /^[a-zA-Z0-9._\-*]+$/.test(sku) && !sku.startsWith('ebay-');
}

// ── INVENTORY INDEX (shared across all sync paths) ───────
function _normSku(s) { return (s||'').toString().replace(/[^A-Za-z0-9]/g,'').toLowerCase(); }
function _normName(n) {
  return (n||'').toString().toLowerCase().replace(/[\u2013\u2014]/g,'-')
    .replace(/\s*[-–—]\s*(sealed|mint|nwt|nib|new in box|new with tags|used|pre-?owned)\b.*$/i,'')
    .replace(/\s*\((sealed|mint|nwt|nib|new|used|pre-?owned)[^)]*\)\s*$/i,'')
    .replace(/[^\w\s]/g,' ').replace(/\s+/g,' ').trim();
}

function _buildInventoryIndex(items) {
  const idx = {
    bySku: new Map(),
    bySkuNorm: new Map(),
    byItemId: new Map(),
    byListing: new Map(),
    byNameNorm: new Map(),
    byId: new Map(),
    nameCollisions: new Set(), // normalized names that appear on 2+ items — don't name-match
  };
  for (const it of items) {
    if (it.sku) { idx.bySku.set(it.sku, it); idx.bySkuNorm.set(_normSku(it.sku), it); }
    if (it.ebayItemId) { idx.byItemId.set(it.ebayItemId, it); idx.bySkuNorm.set(_normSku(it.ebayItemId), it); }
    if (it.ebayListingId) idx.byListing.set(String(it.ebayListingId), it);
    if (it.name) {
      const nk = _normName(it.name);
      if (nk) {
        if (idx.byNameNorm.has(nk)) idx.nameCollisions.add(nk);
        else idx.byNameNorm.set(nk, it);
      }
    }
    if (it.id) idx.byId.set(it.id, it);
  }
  return idx;
}

function _findMatchingItem(idx, liveListingIds, { listingId, sku, itemId, name }) {
  const lid = listingId ? String(listingId) : null;
  if (lid && idx.byListing.has(lid)) return idx.byListing.get(lid);
  if (sku && idx.bySku.has(sku)) return idx.bySku.get(sku);
  if (sku && idx.byItemId.has(sku)) return idx.byItemId.get(sku);
  if (itemId && idx.byItemId.has(itemId)) return idx.byItemId.get(itemId);
  const skuNorm = _normSku(sku || itemId);
  if (skuNorm && idx.bySkuNorm.has(skuNorm)) return idx.bySkuNorm.get(skuNorm);
  const nameNorm = _normName(name);
  if (nameNorm && idx.byNameNorm.has(nameNorm) && !idx.nameCollisions.has(nameNorm)) {
    const candidate = idx.byNameNorm.get(nameNorm);
    const attached = candidate.ebayListingId && liveListingIds.has(String(candidate.ebayListingId));
    if (!attached) return candidate;
  }
  return null;
}

function _indexUpsert(idx, row) {
  if (row.sku) { idx.bySku.set(row.sku, row); idx.bySkuNorm.set(_normSku(row.sku), row); }
  if (row.ebayItemId) { idx.byItemId.set(row.ebayItemId, row); idx.bySkuNorm.set(_normSku(row.ebayItemId), row); }
  if (row.ebayListingId) idx.byListing.set(String(row.ebayListingId), row);
  if (row.name) {
    const nk = _normName(row.name);
    if (nk) {
      if (idx.byNameNorm.has(nk) && idx.byNameNorm.get(nk) !== row) idx.nameCollisions.add(nk);
      else idx.byNameNorm.set(nk, row);
    }
  }
  if (row.id) idx.byId.set(row.id, row);
}

export function detectInventoryDuplicates() {
  const bySkuNorm = new Map();
  const byListing = new Map();
  const dupes = [];
  for (const it of inv) {
    if (it.sold || it.deleted) continue;
    const skuKey = it.sku ? 'sku:' + _normSku(it.sku) : null;
    const lidKey = it.ebayListingId ? 'lid:' + it.ebayListingId : null;
    if (skuKey) {
      if (bySkuNorm.has(skuKey)) dupes.push({ a: bySkuNorm.get(skuKey), b: it, key: skuKey });
      else bySkuNorm.set(skuKey, it);
    }
    if (lidKey) {
      if (byListing.has(lidKey)) dupes.push({ a: byListing.get(lidKey), b: it, key: lidKey });
      else byListing.set(lidKey, it);
    }
  }
  return dupes;
}

export function mergeInventoryDuplicates() {
  const dupes = detectInventoryDuplicates();
  if (!dupes.length) return 0;

  const merged = new Set();
  let count = 0;
  for (const { a, b } of dupes) {
    if (merged.has(a.id) || merged.has(b.id) || a.id === b.id) continue;
    const aS = sales.filter(s => s.itemId === a.id).length;
    const bS = sales.filter(s => s.itemId === b.id).length;
    const aF = Object.values(a).filter(v => v != null && v !== '' && v !== 0).length;
    const [keeper, dupe] = (aS > bS || (aS === bS && aF >= Object.values(b).filter(v => v != null && v !== '' && v !== 0).length)) ? [a, b] : [b, a];
    keeper.qty = (keeper.qty || 0) + (dupe.qty || 0);
    for (const [k, v] of Object.entries(dupe)) {
      if (k === 'id' || k === 'qty' || k === 'added' || k === 'dateAdded') continue;
      if ((keeper[k] == null || keeper[k] === '' || keeper[k] === 0) && v != null && v !== '' && v !== 0) keeper[k] = v;
    }
    for (const s of sales) { if (s.itemId === dupe.id) { s.itemId = keeper.id; markDirty('sales', s.id); } }
    const di = inv.indexOf(dupe); if (di >= 0) inv.splice(di, 1);
    markDirty('inv', keeper.id);
    merged.add(dupe.id);
    count++;
  }

  return count;
}

// ── INITIALIZATION ─────────────────────────────────────────────────────────

/** Clear stored API-capability flags so the client retries blocked APIs.
 * Use after deploying edge function updates that add support for previously-blocked paths. */
export async function resetEBayApiFlags() {
  _tradingApiBlocked = false;
  _offerApiBlocked = false;
  try {
    await setMeta('ebay_trading_blocked', null);
    await setMeta('ebay_offer_blocked', null);
  } catch (_) {}
}

export async function initEBaySync() {
  _lastSyncTime = await getMeta('ebay_last_sync');
  try {
    const ids = await getMeta('ebay_processed_returns');
    if (ids) _processedReturnIds = new Set(JSON.parse(ids));
  } catch (_) {}
  try {
    const dismissed = await getMeta('ebay_dismissed_ids');
    if (dismissed) _dismissedEBayIds = new Set(JSON.parse(dismissed));
  } catch (_) {}
  // Restore API capability flags so we don't retry blocked APIs every session
  _tradingApiBlocked = !!(await getMeta('ebay_trading_blocked'));
  _offerApiBlocked = !!(await getMeta('ebay_offer_blocked'));
}

/** Mark eBay IDs as dismissed so they won't be re-imported on next sync. */
export function dismissEBayItem(item) {
  if (!item) return;
  if (item.ebayListingId) _dismissedEBayIds.add(item.ebayListingId);
  if (item.ebayItemId) _dismissedEBayIds.add(item.ebayItemId);
  if (_dismissedEBayIds.size > 0) {
    setMeta('ebay_dismissed_ids', JSON.stringify([..._dismissedEBayIds])).catch(() => {});
  }
}

/** Remove eBay IDs from dismissed list (e.g. when restoring from trash). */
export function undismissEBayItem(item) {
  if (!item) return;
  if (item.ebayListingId) _dismissedEBayIds.delete(item.ebayListingId);
  if (item.ebayItemId) _dismissedEBayIds.delete(item.ebayItemId);
  setMeta('ebay_dismissed_ids', JSON.stringify([..._dismissedEBayIds])).catch(() => {});
}

function _isDismissed(listingId, sku, ebayItemId) {
  if (listingId && _dismissedEBayIds.has(listingId)) return true;
  if (sku && _dismissedEBayIds.has(sku)) return true;
  if (ebayItemId && _dismissedEBayIds.has(ebayItemId)) return true;
  return false;
}

/**
 * Start periodic eBay sync (uses EBAY_SYNC_INTERVAL from timing.js).
 * Return/cancel checks run every 30 minutes.
 */
export function startEBaySyncInterval() {
  if (_syncInterval) clearInterval(_syncInterval);
  if (_returnCheckInterval) clearInterval(_returnCheckInterval);
  _syncInterval = setInterval(() => {
    if (isEBayConnected() && !_syncing) {
      pullEBayListings({ silent: true }).catch(e => console.warn('eBay sync error:', e.message));
    }
  }, EBAY_SYNC_INTERVAL);
  // Return/cancel check — less frequent, broader window
  _returnCheckInterval = setInterval(() => {
    if (isEBayConnected() && !_syncing) {
      _syncEBayReturns().catch(e => console.warn('eBay return check error:', e.message));
    }
  }, 1800000); // 30 minutes
  // Run first return check after a short delay on startup
  setTimeout(() => {
    if (isEBayConnected() && !_syncing) {
      _syncEBayReturns().catch(e => console.warn('eBay return check error:', e.message));
    }
  }, 15000);
}

/**
 * Trigger an eBay sync on demand (e.g. after a local change).
 * Debounced to avoid rapid-fire syncs — waits 5s after last call.
 */
let _onDemandTimer = null;
export function triggerEBaySync() {
  if (!isEBayConnected() || _syncing) return;
  clearTimeout(_onDemandTimer);
  _onDemandTimer = setTimeout(() => {
    if (isEBayConnected() && !_syncing) {
      pullEBayListings({ silent: true }).catch(e => console.warn('eBay on-demand sync error:', e.message));
    }
  }, 5000);
}

export function stopEBaySyncInterval() {
  if (_syncInterval) { clearInterval(_syncInterval); _syncInterval = null; }
  if (_returnCheckInterval) { clearInterval(_returnCheckInterval); _returnCheckInterval = null; }
}

// ═══════════════════════════════════════════════════════════════════════════
// PULL: Fetch active listings from eBay → update local inventory status
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pull all active eBay listings and sync status to local inventory.
 * Uses Trading API GetMyeBaySelling as primary source (catches ALL listings),
 * with Inventory API as secondary for product details.
 * @returns {{ matched: number, imported: number, updated: number }}
 */
export async function pullEBayListings({ silent = false } = {}) {
  if (!isEBayConnected()) throw new Error('eBay not connected');
  if (_syncing) throw new Error('Sync already in progress');
  _syncing = true;

  try {
    if (!silent) toast('Syncing eBay listings…');
    let matched = 0, imported = 0, updated = 0;
    const seenListingIds = new Set(); // Track eBay listing IDs for reconciliation
    const seenLocalIds = new Set(); // Local item IDs that matched any eBay listing this sync

    // Build shared inventory index (normalized SKU, fuzzy name, listing ID, etc.)
    const idx = _buildInventoryIndex(inv);
    // Legacy aliases so existing code paths keep working; they reference the same Maps
    const bySku = idx.bySku;
    const byEbayId = idx.byItemId;
    const byListingId = idx.byListing;

    // ── PRIMARY: Trading API GetMyeBaySelling ──────────────────────────
    // This returns ALL active listings regardless of how they were created
    let tradingWorked = false;
    if (_tradingApiBlocked) {
      console.warn('[eBay] Trading API not supported by proxy — skipping GetMyeBaySelling');
    } else try {
      let pageNum = 1;
      let totalPages = 1;

      while (pageNum <= totalPages) {
        const resp = await ebayAPI('POST', TRADING_API, {
          _tradingCall: 'GetMyeBaySelling',
          ActiveList: {
            Include: true,
            Pagination: { EntriesPerPage: 200, PageNumber: pageNum },
          },
          DetailLevel: 'ReturnAll',
        });

        const activeList = resp?.ActiveList || resp?.GetMyeBaySellingResponse?.ActiveList;
        if (!activeList) break;

        totalPages = parseInt(activeList?.PaginationResult?.TotalNumberOfPages || '1', 10);
        const items = activeList?.ItemArray?.Item || [];
        // Handle single-item response (XML→JSON can collapse array to object)
        const itemArr = Array.isArray(items) ? items : (items.ItemID ? [items] : []);

        for (const ebayItem of itemArr) {
          const listingId = String(ebayItem.ItemID || '');
          const sku = ebayItem.SKU || '';
          const title = ebayItem.Title || '';
          const price = parseFloat(
            ebayItem.SellingStatus?.CurrentPrice?.Value
            || ebayItem.SellingStatus?.CurrentPrice
            || ebayItem.BuyItNowPrice?.Value
            || ebayItem.StartPrice?.Value
            || '0'
          );
          const qty = parseInt(ebayItem.Quantity || '1', 10)
            - parseInt(ebayItem.SellingStatus?.QuantitySold || '0', 10);
          const listingType = ebayItem.ListingType || 'FixedPriceItem'; // Chinese = auction
          const isAuction = listingType === 'Chinese';
          const imageUrl = ebayItem.PictureDetails?.PictureURL;
          const images = Array.isArray(imageUrl) ? imageUrl : (imageUrl ? [imageUrl] : []);

          if (listingId) seenListingIds.add(listingId);

          // Match via shared index (exact ID → SKU → normalized SKU → fuzzy name)
          let local = _findMatchingItem(idx, seenListingIds, {
            listingId, sku, itemId: sku, name: title
          });

          if (local) {
            seenLocalIds.add(local.id);
            matched++;
            let changed = false;

            // Store eBay references
            if (local.ebayListingId !== listingId) { local.ebayListingId = listingId; changed = true; }
            if (sku && local.ebayItemId !== sku) { local.ebayItemId = sku; changed = true; }
            if (!local.url || !local.url.includes(listingId)) {
              local.url = `https://www.ebay.com/itm/${listingId}`;
              changed = true;
            }

            // Sync listing format
            const fmt = isAuction ? 'AUCTION' : 'FIXED_PRICE';
            if (local.ebayListingFormat !== fmt) { local.ebayListingFormat = fmt; changed = true; }

            // Ensure eBay is in platforms and marked active
            if (!local.platforms) local.platforms = [];
            if (!local.platforms.includes('eBay')) { local.platforms.push('eBay'); changed = true; }
            if (!local.platformStatus) local.platformStatus = {};
            if (local.platformStatus.eBay !== 'active') {
              markPlatformStatus(local.id, 'eBay', 'active');
              changed = true;
            }

            // Sync product details if local is missing them
            if (title && (!local.name || local.name === 'eBay Import' || local.name === local.sku)) {
              local.name = title; changed = true;
            }
            if (images.length && (!local.images || !local.images.length)) {
              local.images = images; local.image = images[0]; changed = true;
            }
            // Enrich missing price
            if ((!local.price || local.price <= 0) && price > 0) {
              local.price = price; changed = true;
            }

            if (changed) { markDirty('inv', local.id); updated++; }
          } else if (!_isDismissed(listingId, sku)) {
            // Import as new FlipTrack item
            const newId = uid();
            const newItem = {
              id: newId,
              name: title || 'eBay Import',
              sku: sku || '',
              price: price || 0,
              qty: Math.max(qty, 1),
              cost: 0,
              condition: 'good',
              category: '',
              platforms: ['eBay'],
              platformStatus: { eBay: 'active' },
              platformListingDates: { eBay: localDate() },
              platformListingExpiry: {},
              ebayItemId: sku || `ebay-${listingId}`,
              ebayListingId: listingId,
              ebayListingFormat: isAuction ? 'AUCTION' : 'FIXED_PRICE',
              url: `https://www.ebay.com/itm/${listingId}`,
              images: images,
              image: images[0] || '',
              notes: '',
              tags: [],
              dateAdded: new Date().toISOString(),
              _notifiedOfferIds: [],
            };
            inv.push(newItem);
            markDirty('inv', newId);
            // Register in shared index so subsequent paths find this row
            _indexUpsert(idx, newItem);
            imported++;
            logItemEvent(newId, 'ebay-import', `Imported from eBay: "${title}" (#${listingId})`);
          }
        }

        pageNum++;
      }

      // Only count as working if we actually found listings
      if (matched > 0 || imported > 0) {
        tradingWorked = true;
        console.warn(`[eBay] Trading API: matched=${matched}, imported=${imported}, updated=${updated}`);
      } else {
        console.warn('[eBay] Trading API returned 0 listings — trying fallbacks');
      }
    } catch (e) {
      if (e.message?.includes('not allowed') || e.message?.includes('403')) {
        _tradingApiBlocked = true;
        setMeta('ebay_trading_blocked', '1').catch(() => {});
      }
      console.warn('[eBay] GetMyeBaySelling failed:', e.message);
    }

    // ── SUPPLEMENT / FALLBACK: Offer API scan ─────────────────────────
    // Always run: enriches items with listingId, price, and format that
    // the Trading API may not provide (or fills everything if Trading failed)
    // Skip if Offer API is known broken (account has invalid SKU data)
    if (!_offerApiBlocked) {
      try {
        console.warn('[eBay] Running Offer API scan…');
        let offerOffset = 0;
        let offerHasMore = true;

        while (offerHasMore) {
          const resp = await ebayAPI('GET',
            `${INVENTORY_API}/offer?limit=200&offset=${offerOffset}`
          );
          const offers = resp?.offers || [];
          console.warn(`[eBay] Offer API page: ${offers.length} offers at offset ${offerOffset}`);
          if (offers.length < 200) offerHasMore = false;
          if (offers.length === 0 && offerOffset === 0) break;
          // Log first offer shape for debugging
          if (offerOffset === 0 && offers.length > 0) {
            const sample = offers[0];
            console.warn('[eBay] Offer sample:', JSON.stringify({
              sku: sample.sku, status: sample.status, format: sample.format,
              listingId: sample.listing?.listingId || sample.listingId,
              price: sample.pricingSummary?.price?.value,
              offerId: sample.offerId,
              keys: Object.keys(sample),
            }));
          }

          for (const offer of offers) {
            const sku = offer.sku || '';
            const lid = offer.listing?.listingId || offer.listingId || '';
            const status = offer.status;
            const format = offer.format || offer.listingPolicies?.listingFormat || 'FIXED_PRICE';
            const isAuction = format === 'AUCTION';
            const price = parseFloat(
              offer.pricingSummary?.price?.value
              || offer.pricingSummary?.auctionStartPrice?.value
              || offer.pricingSummary?.minimumAdvertisedPrice?.value || '0'
            );
            if (lid) seenListingIds.add(lid);

            // Match via shared index (tolerates dash-stripped SKUs, fuzzy name)
            let local = _findMatchingItem(idx, seenListingIds, {
              listingId: lid, sku, itemId: sku, name: null
            });

            // Any non-ended offer status means the item is live on eBay
            const isLive = status && status !== 'ENDED' && status !== 'WITHDRAWN';

            if (local) {
              seenLocalIds.add(local.id);
              matched++;
              let changed = false;
              if (sku && local.ebayItemId !== sku) { local.ebayItemId = sku; changed = true; }
              if (lid && local.ebayListingId !== lid) {
                local.ebayListingId = lid; changed = true;
                byListingId.set(lid, local);
              }
              if (!local.platforms?.includes('eBay')) {
                if (!local.platforms) local.platforms = [];
                local.platforms.push('eBay'); changed = true;
              }
              if (!local.platformStatus) local.platformStatus = {};
              if (isLive && local.platformStatus.eBay !== 'active') {
                markPlatformStatus(local.id, 'eBay', 'active'); changed = true;
              }
              // Detect ended offers — auction ended or listing withdrawn
              if (!isLive && status === 'ENDED' && local.platformStatus.eBay === 'active') {
                const listingFmt = isAuction ? 'AUCTION' : 'FIXED_PRICE';
                const label = local.name || local.sku || 'Item';
                if (isAuction && (local.qty || 0) === 0) local.qty = 1; // restore qty for unsold auctions
                if (isAuction) local.ebayCurrentBid = 0;
                markPlatformStatus(local.id, 'eBay', listingFmt === 'AUCTION' ? 'expired' : 'removed');
                changed = true;
                if (listingFmt === 'AUCTION') {
                  addNotification('info', 'Auction Ended',
                    `"${label}" auction ended — check eBay for final result`, local.id);
                  sendNotification('Auction Ended', `"${label}" — check eBay for final result`, `ft-auction-end-${lid}`);
                  logItemEvent(local.id, 'auction-end', 'Auction ended (detected via Offer API status)');
                } else {
                  addNotification('warning', 'eBay Listing Ended',
                    `"${label}" listing ended`, local.id);
                }
              }
              const fmt = isAuction ? 'AUCTION' : 'FIXED_PRICE';
              if (local.ebayListingFormat !== fmt) { local.ebayListingFormat = fmt; changed = true; }
              if (lid && !local.url?.includes(lid)) {
                local.url = `https://www.ebay.com/itm/${lid}`; changed = true;
              }
              // Enrich missing price from offer
              if ((!local.price || local.price <= 0) && price > 0) {
                local.price = price; changed = true;
              }
              // Enrich missing name from inventory item
              if ((!local.name || local.name === 'eBay Import' || local.name === sku) && sku) {
                try {
                  const invItem = await ebayAPI('GET',
                    `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`
                  );
                  const product = invItem?.product || {};
                  if (product.title) { local.name = product.title; changed = true; }
                  if (product.imageUrls?.length && (!local.images || !local.images.length)) {
                    local.images = product.imageUrls; local.image = product.imageUrls[0]; changed = true;
                  }
                } catch (_) {}
              }
              if (changed) { markDirty('inv', local.id); updated++; }
            } else if (isLive) {
              // Check dismissed status — but if the listing ID is NEW (not itself
              // dismissed), the user relisted on eBay, so allow re-import
              const lidDismissed = lid && _dismissedEBayIds.has(lid);
              const skuDismissed = sku && _dismissedEBayIds.has(sku);
              if (lidDismissed || (skuDismissed && !lid)) {
                // Listing ID itself is dismissed, or SKU dismissed with no new listing ID
                continue;
              }
              // If SKU was dismissed but listing ID is new → clear SKU dismissal (relisted)
              if (skuDismissed && lid) {
                _dismissedEBayIds.delete(sku);
                setMeta('ebay_dismissed_ids', JSON.stringify([..._dismissedEBayIds])).catch(() => {});
              }
              // Fetch product details from inventory item
              let title = sku || 'eBay Import';
              let images = [];
              try {
                const invItem = await ebayAPI('GET',
                  `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`
                );
                const product = invItem?.product || {};
                title = product.title || title;
                images = (product.imageUrls || []).filter(u => u?.startsWith('http'));
              } catch (_) {}

              const newId = uid();
              const newItem = {
                id: newId, name: title, sku, price, qty: offer.availableQuantity || 1,
                cost: 0, condition: 'good', category: '',
                platforms: ['eBay'], platformStatus: { eBay: 'active' },
                platformListingDates: { eBay: localDate() }, platformListingExpiry: {},
                ebayItemId: sku || `ebay-${lid}`, ebayListingId: lid,
                ebayListingFormat: isAuction ? 'AUCTION' : 'FIXED_PRICE',
                ebayBestOffer: !!offer.listingPolicies?.bestOfferTerms?.bestOfferEnabled,
                url: lid ? `https://www.ebay.com/itm/${lid}` : '',
                images, image: images[0] || '', notes: '', tags: [],
                dateAdded: new Date().toISOString(), _notifiedOfferIds: [],
              };
              inv.push(newItem);
              markDirty('inv', newId);
              _indexUpsert(idx, newItem);
              imported++;
              logItemEvent(newId, 'ebay-import', `Imported from eBay offer: "${title}"`);
            }
          }
          offerOffset += 200;
        }
        if (imported > 0 || matched > 0) tradingWorked = true;
        console.warn(`[eBay] Offer API: matched=${matched}, imported=${imported}`);
      } catch (e) {
        if (e.message?.includes('invalid value for a SKU') || e.message?.includes('25707')) {
          _offerApiBlocked = true;
          setMeta('ebay_offer_blocked', '1').catch(() => {});
        }
        console.warn('[eBay] Offer API scan failed:', e.message);
      }
    }

    // ── ALWAYS RUN: Browse API seller search ───────────────────────────
    // Browse API is the only reliable source of live price and format data
    // (Offer API often returns no pricingSummary for eBay.com-created listings)
    {
      try {
        let username = getEBayUsername();
        // If no username cached, try fetching it from eBay API
        if (!username) {
          try {
            console.warn('[eBay] No username cached — fetching from eBay API…');
            const userResp = await ebayAPI('GET', '/sell/account/v1/privilege');
            // The privilege endpoint doesn't return username directly, try Trading API
          } catch (_) {}
          // Try GetUser via Trading API proxy (skip if Trading API blocked)
          if (!_tradingApiBlocked) try {
            const userResp = await ebayAPI('POST', TRADING_API, {
              _tradingCall: 'GetUser',
              DetailLevel: 'ReturnAll'
            });
            const uname = userResp?.User?.UserID || userResp?.UserID || '';
            if (uname) {
              username = uname;
              console.warn('[eBay] Got username from Trading API:', username);
            }
          } catch (_) {}
          // Fallback: extract from any existing offer's marketplaceId or listing URL
          if (!username && !_offerApiBlocked) {
            try {
              const offerCheck = await ebayAPI('GET', `${INVENTORY_API}/offer?limit=1`);
              const firstOffer = offerCheck?.offers?.[0];
              const lid = firstOffer?.listing?.listingId || firstOffer?.listingId || '';
              if (lid) {
                // Try Browse API getItem to extract seller info
                const itemResp = await ebayAPI('GET',
                  `${BROWSE_API}/item/get_item_by_legacy_id?legacy_item_id=${lid}`
                );
                const sellerName = itemResp?.seller?.username || itemResp?.seller?.userId || '';
                if (sellerName) {
                  username = sellerName;
                  console.warn('[eBay] Got username from Browse item:', username);
                }
              }
            } catch (_) {}
          }
        }
        console.warn('[eBay] Browse API: username =', username || '(none)');
        if (username) {
          toast('Searching your eBay store…');
          const sellerFilter = `sellers:%7B${encodeURIComponent(username)}%7D`;
          // Try multiple broad search terms to maximize coverage
          // eBay Browse API requires non-empty q — use broad terms that match most listings
          const queries = ['a', 'e', 'the', 'new', 'lot', 'vintage', 'set', 'bag'];
          const seenBrowseIds = new Set();

          for (const q of queries) {
            try {
              const resp = await ebayAPI('GET',
                `${BROWSE_API}/item_summary/search?q=${encodeURIComponent(q)}&filter=${sellerFilter}&limit=200`
              );
              const summaries = resp?.itemSummaries || [];
              console.warn(`[eBay] Browse q="${q}": ${summaries.length} results`);

              for (const summary of summaries) {
                const legacyId = summary.legacyItemId || '';
                if (!legacyId || seenBrowseIds.has(legacyId)) continue;
                seenBrowseIds.add(legacyId);
                seenListingIds.add(legacyId);

                const title = summary.title || '';
                const buyOpts = summary.buyingOptions || [];
                const isAuction = buyOpts.includes('AUCTION');
                // For auctions: price = BIN price, currentBidPrice = current/start bid
                const binPrice = parseFloat(summary.price?.value || '0');
                const bidPrice = parseFloat(summary.currentBidPrice?.value || '0');
                const price = binPrice || bidPrice;
                const imageUrl = summary.image?.imageUrl || '';

                // Match via shared index (normalized SKU, fuzzy name, listing ID)
                let local = _findMatchingItem(idx, seenListingIds, {
                  listingId: legacyId, sku: null, itemId: `ebay-${legacyId}`, name: title
                });
                if (local) {
                  seenLocalIds.add(local.id);
                  matched++;
                  let changed = false;
                  if (local.ebayListingId !== legacyId) {
                    local.ebayListingId = legacyId; changed = true;
                    byListingId.set(legacyId, local); // Update lookup map
                  }
                  if (!local.platforms?.includes('eBay')) {
                    if (!local.platforms) local.platforms = [];
                    local.platforms.push('eBay'); changed = true;
                  }
                  if (!local.platformStatus) local.platformStatus = {};
                  if (local.platformStatus.eBay !== 'active') {
                    markPlatformStatus(local.id, 'eBay', 'active'); changed = true;
                  }
                  // Browse API = LIVE data — always overrides stale Offer API values
                  const fmt = isAuction ? 'AUCTION' : 'FIXED_PRICE';
                  if (local.ebayListingFormat !== fmt) { local.ebayListingFormat = fmt; changed = true; }
                  if (price > 0 && local.price !== price && !isInvDirty(local.id)) { local.price = price; changed = true; }
                  // Auction details: store BIN and start bid
                  if (isAuction) {
                    if (binPrice > 0 && local.ebayBuyItNowPrice !== binPrice) { local.ebayBuyItNowPrice = binPrice; changed = true; }
                    // Track current bid separately — NEVER overwrite original start price
                    if (bidPrice > 0 && local.ebayCurrentBid !== bidPrice) { local.ebayCurrentBid = bidPrice; changed = true; }
                    // Populate ebayAuctionStart only if it's empty (first sync)
                    if (bidPrice > 0 && !local.ebayAuctionStart) { local.ebayAuctionStart = bidPrice; changed = true; }
                  }
                  // BEST_OFFER only valid on fixed-price listings; ignore for auctions
                  if (!isAuction && buyOpts.includes('BEST_OFFER') && !local.ebayBestOffer) {
                    local.ebayBestOffer = true; changed = true;
                  }
                  if (title && (!local.name || local.name === 'eBay Import')) { local.name = title; changed = true; }
                  if (imageUrl && (!local.images || !local.images.length)) {
                    local.images = [imageUrl]; local.image = imageUrl; changed = true;
                  }
                  if (!local.url || !local.url.includes(legacyId)) {
                    local.url = `https://www.ebay.com/itm/${legacyId}`; changed = true;
                  }
                  if (changed) { markDirty('inv', local.id); updated++; }
                } else if (!_isDismissed(legacyId)) {
                  const newId = uid();
                  const newItem = {
                    id: newId, name: title || 'eBay Import', sku: '', price, qty: 1, cost: 0,
                    condition: 'good', category: '',
                    platforms: ['eBay'], platformStatus: { eBay: 'active' },
                    platformListingDates: { eBay: localDate() }, platformListingExpiry: {},
                    ebayItemId: `ebay-${legacyId}`, ebayListingId: legacyId,
                    ebayListingFormat: isAuction ? 'AUCTION' : 'FIXED_PRICE',
                    url: `https://www.ebay.com/itm/${legacyId}`,
                    images: imageUrl ? [imageUrl] : [], image: imageUrl || '',
                    notes: '', tags: [], dateAdded: new Date().toISOString(), _notifiedOfferIds: [],
                  };
                  inv.push(newItem);
                  markDirty('inv', newId);
                  _indexUpsert(idx, newItem);
                  imported++;
                  logItemEvent(newId, 'ebay-import', `Imported from eBay: "${title}" (#${legacyId})`);
                }
              }
              // Keep trying queries until we've found all items or exhausted queries
              // Each query finds items containing that term — need multiple for full coverage
              if (summaries.length >= 200) continue; // Might have more, try next query
              if (seenBrowseIds.size >= 50) break; // Found plenty, stop
            } catch (qErr) {
              console.warn(`[eBay] Browse q="${q}" failed:`, qErr.message);
              // If first attempt fails (empty q), try next query term
              continue;
            }
          }
          // Targeted search: for items still missing ebayListingId, search by name
          const stillMissing = inv.filter(i =>
            i.platforms?.includes('eBay') && i.ebayItemId && !i.ebayListingId
          );
          for (const item of stillMissing.slice(0, 10)) {
            try {
              // Use first 3 words of item name as search query
              const words = (item.name || '').split(/\s+/).slice(0, 3).join(' ').trim();
              if (!words || words.length < 3) continue;
              const resp = await ebayAPI('GET',
                `${BROWSE_API}/item_summary/search?q=${encodeURIComponent(words)}&filter=${sellerFilter}&limit=20`
              );
              for (const summary of (resp?.itemSummaries || [])) {
                const legacyId = summary.legacyItemId || '';
                if (!legacyId || seenBrowseIds.has(legacyId)) continue;
                seenBrowseIds.add(legacyId);
                seenListingIds.add(legacyId);

                const sTitle = (summary.title || '').toLowerCase().trim();
                const iTitle = (item.name || '').toLowerCase().trim();
                // Require title match (at least one should contain the other)
                if (!sTitle.includes(iTitle) && !iTitle.includes(sTitle) &&
                    !sTitle.split(' ').slice(0, 3).join(' ').includes(iTitle.split(' ').slice(0, 3).join(' '))) continue;

                let changed = false;
                item.ebayListingId = legacyId; changed = true;
                _indexUpsert(idx, item);
                if (item.platformStatus?.eBay !== 'active') {
                  markPlatformStatus(item.id, 'eBay', 'active'); changed = true;
                }
                const sPrice = parseFloat(summary.price?.value || '0');
                if (sPrice > 0 && item.price !== sPrice && !isInvDirty(item.id)) { item.price = sPrice; changed = true; }
                const sAuction = (summary.buyingOptions || []).includes('AUCTION');
                const sFmt = sAuction ? 'AUCTION' : 'FIXED_PRICE';
                if (item.ebayListingFormat !== sFmt) { item.ebayListingFormat = sFmt; changed = true; }
                if (!item.url || !item.url.includes(legacyId)) {
                  item.url = `https://www.ebay.com/itm/${legacyId}`; changed = true;
                }
                const sImg = summary.image?.imageUrl || '';
                if (sImg && (!item.images || !item.images.length)) {
                  item.images = [sImg]; item.image = sImg; changed = true;
                }
                if (changed) { markDirty('inv', item.id); updated++; }
                break; // Found match for this item
              }
            } catch (_) {}
          }

          if (imported > 0 || matched > 0) tradingWorked = true;
          console.warn(`[eBay] Browse API: matched=${matched}, imported=${imported}, updated=${updated}`);
        } else {
          console.warn('[eBay] No eBay username — skipping seller search, will use per-item lookup');
        }
      } catch (e) {
        console.warn('[eBay] Browse API search failed:', e.message);
      }
    }

    // ── Browse API getItemByLegacyId for LIVE data ──────────────────────
    // Only queries items NOT already covered by Trading API or Browse API
    // search earlier in this sync. Skips items whose listingId was already
    // seen — those already have fresh data.
    {
      const needsLiveData = inv.filter(i =>
        i.platforms?.includes('eBay') && i.ebayListingId
        && !seenListingIds.has(i.ebayListingId)
      );
      console.warn(`[eBay] Live data enrichment: ${needsLiveData.length} items need lookup (${seenListingIds.size} already synced)`);
      let liveUpdated = 0;
      // Prioritize auctions — their status changes matter most
      needsLiveData.sort((a, b) => (b.ebayListingFormat === 'AUCTION' ? 1 : 0) - (a.ebayListingFormat === 'AUCTION' ? 1 : 0));
      // Process up to 30 per sync (15 auctions + 15 others typically); auctions prioritized
      for (const item of needsLiveData.slice(0, 30)) {
        try {
          const resp = await ebayAPI('GET',
            `${BROWSE_API}/item/get_item_by_legacy_id?legacy_item_id=${item.ebayListingId}`
          );
          if (!resp) continue;
          // Listing still exists (no 404) — mark local as seen so reconcile won't mark it removed
          seenLocalIds.add(item.id);
          let changed = false;
          const buyOpts = resp.buyingOptions || [];
          const isAuction = buyOpts.includes('AUCTION');
          const fmt = isAuction ? 'AUCTION' : 'FIXED_PRICE';

          // Price: for auctions, prefer BIN as display price; store bid separately
          const browsePrice = parseFloat(resp.price?.value || '0');
          const browseBid = parseFloat(resp.currentBidPrice?.value || '0');
          const displayPrice = browsePrice || browseBid;

          if (displayPrice > 0 && item.price !== displayPrice && !isInvDirty(item.id)) {
            item.price = displayPrice; changed = true;
          }
          if (item.ebayListingFormat !== fmt) {
            item.ebayListingFormat = fmt; changed = true;
          }
          if (isAuction) {
            if (browsePrice > 0 && item.ebayBuyItNowPrice !== browsePrice) {
              item.ebayBuyItNowPrice = browsePrice; changed = true;
            }
            if (browseBid > 0 && item.ebayCurrentBid !== browseBid) {
              item.ebayCurrentBid = browseBid; changed = true;
            }
            if (browseBid > 0 && !item.ebayAuctionStart) {
              item.ebayAuctionStart = browseBid; changed = true;
            }
          }
          if (!isAuction && buyOpts.includes('BEST_OFFER') && !item.ebayBestOffer) {
            item.ebayBestOffer = true; changed = true;
          }
          // Title enrichment (only if generic)
          if (resp.title && (!item.name || item.name === 'eBay Import' || item.name === item.ebayItemId)) {
            item.name = resp.title; changed = true;
          }
          // Image enrichment (only if missing)
          const imgUrl = resp.image?.imageUrl || resp.thumbnailImages?.[0]?.imageUrl || '';
          if (imgUrl && (!item.images || !item.images.length)) {
            item.images = [imgUrl]; item.image = imgUrl; changed = true;
          }
          // Additional images from the listing
          if (resp.additionalImages?.length && (!item.images || item.images.length <= 1)) {
            const allImgs = [imgUrl, ...resp.additionalImages.map(i => i.imageUrl)].filter(Boolean);
            if (allImgs.length > (item.images?.length || 0)) {
              item.images = allImgs; item.image = allImgs[0]; changed = true;
            }
          }
          // If still no images, try Inventory API
          if ((!item.images || !item.images.length) && (item.ebayItemId || item.sku)) {
            try {
              const invSku = item.ebayItemId || item.sku;
              if (invSku && !invSku.startsWith('ebay-')) {
                const invResp = await ebayAPI('GET',
                  `${INVENTORY_API}/inventory_item/${encodeURIComponent(invSku)}`
                );
                const prodImgs = (invResp?.product?.imageUrls || []).filter(u => u?.startsWith('http'));
                if (prodImgs.length) {
                  item.images = prodImgs; item.image = prodImgs[0]; changed = true;
                }
              }
            } catch (_) {}
          }
          // Description enrichment
          if (resp.shortDescription && !item.notes) {
            item.notes = resp.shortDescription; changed = true;
          }
          // Status: if Browse API found it, it's live
          if (!item.platformStatus) item.platformStatus = {};
          if (item.platformStatus.eBay !== 'active') {
            markPlatformStatus(item.id, 'eBay', 'active'); changed = true;
          }

          if (changed) { markDirty('inv', item.id); updated++; liveUpdated++; }
        } catch (e) {
          // 404 = listing ended/not found — mark as ended and notify
          if (e.message?.includes('404') || e.message?.toLowerCase().includes('not found')) {
            const isAuction = item.ebayListingFormat === 'AUCTION';
            const prevStatus = item.platformStatus?.eBay;
            if (prevStatus === 'active') {
              if (isAuction && (item.qty || 0) === 0) item.qty = 1; // restore qty for unsold auctions
              if (isAuction) item.ebayCurrentBid = 0;
              markPlatformStatus(item.id, 'eBay', isAuction ? 'expired' : 'removed');
              markDirty('inv', item.id);
              const label = item.name || item.sku || 'Item';
              if (isAuction) {
                addNotification('info', 'Auction Ended',
                  `"${label}" auction ended — check eBay for final result`, item.id);
                sendNotification('Auction Ended', `"${label}" — check eBay for final result`, `ft-auction-end-${item.ebayListingId}`);
                logItemEvent(item.id, 'auction-end', 'Auction ended (detected via Browse API 404)');
              } else {
                addNotification('warning', 'eBay Listing Removed',
                  `"${label}" is no longer on eBay`, item.id);
                logItemEvent(item.id, 'ebay-removed', 'Listing no longer found on eBay');
              }
              updated++; liveUpdated++;
            }
          } else {
            console.warn(`[eBay] Live data for "${item.name}":`, e.message);
          }
        }
      }
      console.warn(`[eBay] Live data enrichment: ${liveUpdated} items updated`);
    }

    // ── FALLBACK 3: Inventory API (item discovery without offers) ─────
    if (!tradingWorked) {
      toast('Scanning eBay inventory…');
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const resp = await ebayAPI('GET',
          `${INVENTORY_API}/inventory_item?limit=${limit}&offset=${offset}`
        );
        const items = resp.inventoryItems || [];
        if (items.length < limit) hasMore = false;

        for (const ebayItem of items) {
          const sku = ebayItem.sku;
          let local = bySku.get(sku) || byEbayId.get(sku);

          if (local) {
            seenLocalIds.add(local.id);
            matched++;
            let changed = false;
            if (!local.ebayItemId || local.ebayItemId !== sku) { local.ebayItemId = sku; changed = true; }
            if (!local.platforms?.includes('eBay')) {
              if (!local.platforms) local.platforms = [];
              local.platforms.push('eBay'); changed = true;
            }
            if (!local.platformStatus) local.platformStatus = {};

            const avail = ebayItem.availability?.shipToLocationAvailability;
            if (avail) {
              const ebayQty = avail.quantity || 0;
              if (ebayQty === 0 && local.platformStatus.eBay === 'active') {
                markPlatformStatus(local.id, 'eBay', 'sold'); changed = true;
              } else if (ebayQty > 0 && local.platformStatus.eBay !== 'active') {
                markPlatformStatus(local.id, 'eBay', 'active'); changed = true;
              }
            }

            const product = ebayItem.product;
            if (product) {
              if (!local.name && product.title) { local.name = product.title; changed = true; }
              if (product.imageUrls?.length && (!local.images || !local.images.length)) {
                local.images = product.imageUrls; local.image = product.imageUrls[0]; changed = true;
              }
            }
            if (changed) { markDirty('inv', local.id); updated++; }
          } else if (!_isDismissed(null, sku)) {
            const product = ebayItem.product || {};
            const newId = uid();
            const newItem = {
              id: newId, name: product.title || sku || 'eBay Import', sku,
              price: 0, qty: ebayItem.availability?.shipToLocationAvailability?.quantity || 1,
              cost: 0, condition: 'good', category: '',
              platforms: ['eBay'], platformStatus: { eBay: 'active' },
              platformListingDates: { eBay: localDate() }, platformListingExpiry: {},
              ebayItemId: sku, ebayListingId: '',
              images: product.imageUrls || [], image: product.imageUrls?.[0] || '',
              notes: '', tags: [], dateAdded: new Date().toISOString(), _notifiedOfferIds: [],
            };
            inv.push(newItem);
            markDirty('inv', newId);
            _indexUpsert(idx, newItem);
            imported++;
            logItemEvent(newId, 'ebay-import', `Imported from eBay inventory (SKU: ${sku})`);
          }
        }
        offset += limit;
      }

      // Scan offers to pick up listing IDs, formats, and prices
      if (!_offerApiBlocked) try {
        const offerResp = await ebayAPI('GET', `${INVENTORY_API}/offer?limit=200`);
        for (const offer of (offerResp?.offers || [])) {
          const sku = offer.sku;
          const local = bySku.get(sku) || byEbayId.get(sku);
          if (!local) continue;
          let changed = false;
          const lid = offer.listing?.listingId || offer.listingId || '';
          if (lid && local.ebayListingId !== lid) { local.ebayListingId = lid; changed = true; }
          if (lid) seenListingIds.add(lid);
          const fmt = (offer.format || offer.listingPolicies?.listingFormat || 'FIXED_PRICE') === 'AUCTION' ? 'AUCTION' : 'FIXED_PRICE';
          if (local.ebayListingFormat !== fmt) { local.ebayListingFormat = fmt; changed = true; }
          if (!local.url && lid) { local.url = `https://www.ebay.com/itm/${lid}`; changed = true; }
          // Grab price from offer if item has none
          if (!local.price || local.price <= 0) {
            const p = parseFloat(offer.pricingSummary?.price?.value
              || offer.pricingSummary?.auctionStartPrice?.value || '0');
            if (p > 0) { local.price = p; changed = true; }
          }
          if (changed) { markDirty('inv', local.id); updated++; }
        }
      } catch (e) {
        if (e.message?.includes('invalid value for a SKU') || e.message?.includes('25707')) {
          _offerApiBlocked = true;
          setMeta('ebay_offer_blocked', '1').catch(() => {});
        }
        console.warn('[eBay] Offer scan failed:', e.message);
      }
    }

    // ── RECONCILE: Mark items removed if no longer on eBay ────────────
    // Guard: require BOTH a nonempty seen-listings set AND >=70% of local items
    // to have been matched. If most local items weren't matched, the sync
    // likely just didn't cover them all — safer to skip removal than to
    // false-flag many items as removed.
    const activeEbayItems = inv.filter(i => i.ebayListingId && i.platformStatus?.eBay === 'active');
    const matchRatio = activeEbayItems.length > 0 ? seenLocalIds.size / activeEbayItems.length : 0;
    if (seenListingIds.size > 0 && matchRatio >= 0.7) {
      for (const item of activeEbayItems) {
        // Skip items that matched ANY eBay listing this sync (by ID, SKU, or name)
        if (seenLocalIds.has(item.id)) continue;
        if (seenListingIds.has(item.ebayListingId)) continue;
        console.warn(`[eBay] Listing removed: "${item.name}" (#${item.ebayListingId})`);
        markPlatformStatus(item.id, 'eBay', 'removed');
        logItemEvent(item.id, 'ebay-sync', 'eBay removed this listing — check Seller Hub');
        markDirty('inv', item.id);
        updated++;
        const label = item.name || item.sku || 'Item';
        addNotification('warning', 'eBay Removed Listing', `"${label}" was removed by eBay.`, item.id);
      }
    } else if (seenListingIds.size > 0) {
      console.warn(`[eBay] Reconcile skipped — match ratio too low (${Math.round(matchRatio * 100)}%). Sync likely incomplete.`);
    }

    // Check recent orders for sold items
    await _syncEBayOrders();

    // Check for best offers and ended auctions
    await _syncEBayOffers().catch(e => console.warn('[eBay] Offer sync:', e.message));
    await _syncEBayAuctions().catch(e => console.warn('[eBay] Auction sync:', e.message));

    _lastSyncTime = new Date().toISOString();
    await setMeta('ebay_last_sync', _lastSyncTime);

    if (updated > 0 || imported > 0) { save(); refresh(); }

    // User feedback
    if (imported > 0) {
      toast(`eBay sync: ${imported} listing${imported > 1 ? 's' : ''} imported, ${matched} matched`);
    } else if (updated > 0) {
      toast(`eBay sync: ${updated} item${updated > 1 ? 's' : ''} updated`);
    } else if (matched > 0) {
      toast(`eBay sync complete — ${matched} listing${matched > 1 ? 's' : ''} in sync`);
    } else {
      toast('eBay sync complete — no active listings found');
    }

    return { matched, imported, updated };
  } catch (e) {
    toast(`eBay sync failed: ${e.message}`, true);
    throw e;
  } finally {
    _syncing = false;
  }
}

/**
 * Backfill tracking, buyer, and address data on existing sales
 * that were recorded before these fields were captured.
 * Fetches shipping fulfillments from eBay API for tracking numbers.
 */
async function _backfillOrderData(order) {
  const existing = sales.filter(s => s.ebayOrderId === order.orderId);
  if (!existing.length) return;

  // Extract buyer info from order (try multiple field paths)
  const buyerName = order.buyer?.username
    || order.buyer?.buyerRegistrationAddress?.fullName
    || null;
  const shipTo = (order.fulfillmentStartInstructions || [])[0]?.shippingStep?.shipTo;
  const fullName = shipTo?.fullName || shipTo?.name || null;

  // Fetch actual shipping fulfillments for tracking + shipped date
  let trackCode = null;
  let carrier = null;
  let shippedDate = null;
  try {
    const fulfResp = await ebayAPI('GET',
      `${FULFILLMENT_API}/order/${order.orderId}/shipping_fulfillment`
    );
    const fulfillments = fulfResp.fulfillments || fulfResp.shippingFulfillments || [];
    if (fulfillments.length) {
      const f = fulfillments[0];
      trackCode = f.shipmentTrackingNumber || f.trackingNumber || null;
      carrier = f.shippingCarrierCode || null;
      shippedDate = f.shippedDate || null;
    }
  } catch (e) {
    console.warn('FlipTrack: backfill tracking fetch error:', e.message);
  }

  // Derive order item subtotal (matches eBay's displayed "Subtotal")
  const ps = order.pricingSummary || {};
  const bfOrderTotal = parseFloat(ps.total?.value || '0');
  const bfOrderDelivery = parseFloat(ps.deliveryCost?.value || '0');
  const bfOrderTax = parseFloat(ps.tax?.value || '0');
  const orderSubtotal = parseFloat(ps.priceSubtotal?.value || '0')
    || (bfOrderTotal - bfOrderDelivery - bfOrderTax);
  const orderFee = parseFloat(order.totalMarketplaceFee?.value || '0');

  let updated = false;
  const lineItems = order.lineItems || [];
  for (const sale of existing) {
    // ── Correct price to match eBay's Subtotal ──
    // Use prorated orderSubtotal (= priceSubtotal or total - delivery - tax)
    if (orderSubtotal > 0) {
      const correctPrice = lineItems.length === 1
        ? orderSubtotal
        : (() => {
            // For multi-item orders, prorate by this sale's share
            const allLineTotals = lineItems.reduce(
              (s, li) => s + parseFloat(li.total?.value || '0'), 0);
            const matchLine = lineItems.find(li =>
              Math.abs(parseFloat(li.total?.value || '0') - (sale.price * sale.qty)) < 1
              || Math.abs(parseFloat(li.total?.value || '0') - (sale.listPrice * sale.qty)) < 1);
            const lt = parseFloat(matchLine?.total?.value || '0');
            return allLineTotals > 0 ? orderSubtotal * (lt / allLineTotals) : orderSubtotal;
          })();
      const perUnit = sale.qty > 1 ? correctPrice / sale.qty : correctPrice;
      const rounded = Math.round(perUnit * 100) / 100;
      if (Math.abs(sale.price - rounded) > 0.01) {
        sale.price = rounded;
        updated = true;
      }
    }
    // Backfill / correct fees — prefer totalMarketplaceFee, fall back to
    // lineItem.marketplaceFees sum. Never use pricingSummary.fee (overcounts).
    {
      const lineItem = lineItems.length === 1 ? lineItems[0]
        : (lineItems.find(li =>
            Math.abs(parseFloat(li.total?.value || '0') - (sale.price * sale.qty)) < 1
            || Math.abs(parseFloat(li.total?.value || '0') - (sale.listPrice * sale.qty)) < 1));
      const lineItemFees = lineItem
        ? (lineItem.marketplaceFees || []).reduce((s, f) => s + parseFloat(f.amount?.value || '0'), 0)
        : 0;
      const lineItemTotal = parseFloat(lineItem?.total?.value || '0');
      const lineShare = orderSubtotal > 0 ? lineItemTotal / orderSubtotal : 1;
      const correctFee = orderFee > 0
        ? Math.round(orderFee * lineShare * 100) / 100
        : (lineItemFees > 0 ? Math.round(lineItemFees * 100) / 100 : 0);
      if (correctFee > 0 && Math.abs((sale.fees || 0) - correctFee) > 0.01) {
        sale.fees = correctFee;
        updated = true;
      }
    }
    // Backfill addlFeeBasis (eBay's fee basis = order total incl. tax+ship)
    if (!sale.addlFeeBasis && bfOrderTotal > 0) {
      sale.addlFeeBasis = Math.round(bfOrderTotal * 100) / 100;
      updated = true;
    }
    // Note: ship intentionally NOT backfilled from buyer's deliveryCost.
    // Buyer's shipping payment offsets the label cost (net ~$0 to seller).
    // If seller paid for labels separately, they should adjust ship manually.
    // Backfill tracking
    if (!sale.tracking && trackCode) {
      sale.tracking = trackCode;
      sale.trackingCarrier = carrier;
      updated = true;
    }
    // Backfill shipped status + date (only if not already set — don't overwrite manual corrections)
    if (shippedDate && !sale.shippedDate) {
      sale.shipped = true;
      sale.shippedDate = shippedDate;
      updated = true;
    }
    // Backfill buyer CRM link
    const name = buyerName || fullName;
    if (!sale.buyerId && name) {
      const buyer = await getOrCreateBuyer(name, 'eBay');
      if (buyer) { sale.buyerId = buyer.id; updated = true; }
    }
    // Backfill address
    if (!sale.buyerAddress && shipTo?.contactAddress) {
      sale.buyerAddress = shipTo.contactAddress.addressLine1 || null;
      sale.buyerCity = shipTo.contactAddress.city || null;
      sale.buyerState = shipTo.contactAddress.stateOrProvince || null;
      sale.buyerZip = shipTo.contactAddress.postalCode || null;
      updated = true;
    }
    if (updated) markDirty('sales', sale.id);
  }
  return updated;
}

/**
 * Check recent eBay orders and mark items as sold locally.
 * @param {number} [lookbackMs] - Optional lookback window in ms (default: since last sync or 24h)
 */
async function _syncEBayOrders(lookbackMs) {
  try {
    // eBay Fulfillment API expects ISO 8601 with explicit 'T' and 'Z' — strip milliseconds
    // to avoid timezone parsing issues on eBay's end
    // Always look back at least 48h so recently created sales get tracking
    // backfilled on subsequent syncs (dedup via knownOrderIds prevents duplicates)
    const MIN_ORDER_LOOKBACK = 172800000; // 48h
    const sinceRaw = lookbackMs
      ? new Date(Date.now() - lookbackMs)
      : new Date(Date.now() - Math.max(
          _lastSyncTime ? Date.now() - new Date(_lastSyncTime).getTime() : 86400000,
          MIN_ORDER_LOOKBACK
        ));
    const nowRaw = new Date();

    // Format as yyyy-MM-ddTHH:mm:ssZ (no milliseconds — eBay chokes on .000Z)
    const fmtDate = d => d.toISOString().replace(/\.\d{3}Z$/, 'Z');
    const since = fmtDate(sinceRaw);
    const now = fmtDate(nowRaw);

    const filter = `creationdate:[${since}..${now}]`;
    const resp = await ebayAPI('GET',
      `${FULFILLMENT_API}/order?filter=${encodeURIComponent(filter)}&limit=50`
    );

    const orders = resp.orders || [];
    // Build set of already-recorded eBay order IDs to prevent duplicates
    const knownOrderIds = new Set(sales.filter(s => s.ebayOrderId).map(s => s.ebayOrderId));
    // Build O(1) lookup maps for matching eBay orders to local items
    const bySku = new Map();
    const byEbayItemId = new Map();
    const byListingId = new Map();
    for (const item of inv) {
      if (item.sku) bySku.set(item.sku, item);
      if (item.ebayItemId) byEbayItemId.set(item.ebayItemId, item);
      if (item.ebayListingId) byListingId.set(item.ebayListingId, item);
    }
    for (const order of orders) {
      // Backfill existing sales missing tracking/buyer data
      if (order.orderId && knownOrderIds.has(order.orderId)) {
        await _backfillOrderData(order);
        continue;
      }

      // Fetch shipping fulfillment for tracking (once per order, shared across line items)
      let orderTracking = null;
      let orderCarrier = null;
      let orderShippedDate = null;
      try {
        const fulfResp = await ebayAPI('GET',
          `${FULFILLMENT_API}/order/${order.orderId}/shipping_fulfillment`
        );
        const shipFulfillments = fulfResp.fulfillments || fulfResp.shippingFulfillments || [];
        if (shipFulfillments.length) {
          const sf = shipFulfillments[0];
          orderTracking = sf.shipmentTrackingNumber || sf.trackingNumber || null;
          orderCarrier = sf.shippingCarrierCode || null;
          orderShippedDate = sf.shippedDate || null;
        }
      } catch (_) { /* Not shipped yet — tracking will be backfilled on next sync */ }

      // Order-level pricing — derive item subtotal (what eBay shows as "Subtotal")
      // priceSubtotal is the clean item-only amount; if missing, derive from total
      const ps = order.pricingSummary || {};
      const orderTotal = parseFloat(ps.total?.value || '0');
      const orderDelivery = parseFloat(ps.deliveryCost?.value || '0');
      const orderTax = parseFloat(ps.tax?.value || '0');
      const orderSubtotal = parseFloat(ps.priceSubtotal?.value || '0')
        || (orderTotal - orderDelivery - orderTax);
      // Use totalMarketplaceFee if available, otherwise lineItem.marketplaceFees.
      // Store performance surcharges (e.g. 6% below-standard) aren't in the API —
      // user adds those via the addlFeePct field on the sale record.
      const orderTotalFee = parseFloat(order.totalMarketplaceFee?.value || '0');

      for (const lineItem of (order.lineItems || [])) {
        const sku = lineItem.sku;
        const legacyId = lineItem.legacyItemId;

        // Match by ebayItemId, sku, or eBay listing ID
        const local = (sku && (byEbayItemId.get(sku) || bySku.get(sku)))
          || (legacyId && byListingId.get(legacyId));
        if (!local || local.platformStatus?.eBay === 'sold') continue;

        // Decrement quantity by sold amount
        const soldQty = parseInt(lineItem.quantity, 10) || 1;
        local.qty = Math.max(0, (local.qty || 1) - soldQty);

        markPlatformStatus(local.id, 'eBay', 'sold');
        // Auto-delist on other platforms if fully sold out
        if (local.qty <= 0) {
          autoDlistOnSale(local.id, 'eBay');
        }

        // ── Item price: use prorated order subtotal ──
        // lineItem.total can include handling fees/adjustments ($1.08 extra in
        // user's case). orderSubtotal (= priceSubtotal or total-delivery-tax)
        // matches eBay's displayed "Subtotal" — prorate for multi-item orders.
        const lineTotal = parseFloat(lineItem.total?.value || '0');
        const lineItems = order.lineItems || [];
        const allLineTotals = lineItems.reduce(
          (s, li) => s + parseFloat(li.total?.value || '0'), 0);
        const itemSubtotal = lineItems.length === 1
          ? orderSubtotal
          : (allLineTotals > 0 ? orderSubtotal * (lineTotal / allLineTotals) : lineTotal);

        // Fees: totalMarketplaceFee matches eBay's "Transaction fees" display.
        // lineItem.marketplaceFees is a fallback but may miss promoted listing fees.
        const lineShare = orderSubtotal > 0 ? itemSubtotal / orderSubtotal : 1;
        const proratedOrderFee = orderTotalFee * lineShare;
        const lineItemFees = (lineItem.marketplaceFees || []).reduce((sum, f) =>
          sum + parseFloat(f.amount?.value || '0'), 0);
        const fees = proratedOrderFee > 0 ? proratedOrderFee : lineItemFees;

        // price = item selling price per unit (matches eBay's displayed item price)
        // ship = 0 (buyer's shipping payment covers label cost; user can adjust
        //   manually for free-shipping listings where seller absorbs label cost)
        const price = soldQty > 1 ? itemSubtotal / soldQty : itemSubtotal;
        if (itemSubtotal > 0) {
          logSalePrice(local.id, itemSubtotal, 'eBay');
        }

        // Extract buyer address from shipping instructions
        const fulfillment = (order.fulfillmentStartInstructions || [])[0];
        const shipTo = fulfillment?.shippingStep?.shipTo;
        const buyerAddress = shipTo?.contactAddress?.addressLine1 || null;
        const buyerCity = shipTo?.contactAddress?.city || null;
        const buyerState = shipTo?.contactAddress?.stateOrProvince || null;
        const buyerZip = shipTo?.contactAddress?.postalCode || null;

        // Dedup: if user manually recorded this sale before sync caught it,
        // link it to the eBay order instead of creating a duplicate
        const orderDate = order.creationDate ? new Date(order.creationDate).getTime() : 0;
        const manualCollision = sales.find(s =>
          !s.ebayOrderId && s.itemId === local.id && s.platform === 'eBay' &&
          Math.abs(new Date(s.date).getTime() - orderDate) < 86400000 // same day
        );
        if (manualCollision) {
          manualCollision.ebayOrderId = order.orderId;
          if (!manualCollision.tracking && orderTracking) {
            manualCollision.tracking = orderTracking;
            manualCollision.trackingCarrier = orderCarrier;
          }
          markDirty('sales', manualCollision.id);
          continue;
        }

        // Create actual sale record (matching recSale() structure)
        // addlFeeBasis = eBay's "Fees based on" amount (order total incl. tax+ship)
        // so user can enter addlFeePct (e.g. 6% below-standard) on the correct basis
        const feeBasis = lineItems.length === 1
          ? orderTotal
          : (allLineTotals > 0 ? orderTotal * (lineTotal / allLineTotals) : orderTotal);
        const sale = {
          id: uid(), itemId: local.id, price,
          listPrice: local.price || 0, qty: soldQty, platform: 'eBay',
          fees: Math.round(fees * 100) / 100,
          addlFeeBasis: feeBasis > 0 ? Math.round(feeBasis * 100) / 100 : undefined,
          ship: 0,
          date: order.creationDate || new Date().toISOString(),
          originalDate: order.creationDate || null,
          tracking: orderTracking,
          trackingCarrier: orderCarrier,
          ebayOrderId: order.orderId || null,
          buyerAddress, buyerCity, buyerState, buyerZip,
        };
        if (orderShippedDate) {
          sale.shipped = true;
          sale.shippedDate = orderShippedDate;
        }

        // Auto-link buyer to CRM
        const buyerName = order.buyer?.username || shipTo?.fullName || null;
        if (buyerName) {
          const buyer = await getOrCreateBuyer(buyerName, 'eBay');
          if (buyer) sale.buyerId = buyer.id;
        }

        sales.push(sale);
        markDirty('sales', sale.id);
        markDirty('inv', local.id);

        // 🎉 Notify user of the sale
        const label = local.name || local.sku || 'Item';
        const priceStr = price > 0 ? ` for $${price.toFixed(2)}` : '';
        toast(`🎉 eBay Sale! ${label}${priceStr}`);
        addNotification('sale', 'eBay Sale', `${label} sold${priceStr}`, local.id);
        sendNotification('eBay Sale!', `${label} sold${priceStr}`, `ft-ebay-sale-${local.id}-${order.orderId}`);
        try { sfx.sale(); } catch (_) {}
      }
    }
    // Reset error throttle on success
    _orderSyncErrorLogged = false;
  } catch (e) {
    // Non-critical — orders sync is best-effort; log once to avoid console spam
    if (!_orderSyncErrorLogged) {
      console.warn('eBay orders sync error:', e.message);
      _orderSyncErrorLogged = true;
    }
  }
}

/**
 * Retroactively resync eBay orders from the past N days.
 * Skips orders already recorded (by ebayOrderId). Useful for catching
 * sales missed due to earlier matching bugs or sync gaps.
 * @param {number} [days=7] - Number of days to look back
 * @returns {{ found: number }} Number of new sales found
 */
export async function resyncEBayOrders(days = 7) {
  if (!isEBayConnected()) { toast('eBay not connected', true); return { found: 0 }; }
  const before = sales.length;
  toast(`Checking eBay orders from last ${days} days…`);
  await _syncEBayOrders(days * 86400000);
  const found = sales.length - before;
  save(); refresh();
  if (found > 0) {
    toast(`Found ${found} missed eBay sale${found > 1 ? 's' : ''} + backfilled existing data`);
  } else {
    toast('Backfilled tracking & buyer data for existing sales');
  }
  return { found };
}

/**
 * Backfill tracking, buyer, and address data for existing eBay sales.
 * Pulls the last 30 days of orders and patches any sales missing this data.
 */
export async function backfillEBayData() {
  if (!isEBayConnected()) { toast('eBay not connected — connect in Settings', true); return; }
  const ebayCount = sales.filter(s => s.platform === 'eBay' && s.ebayOrderId).length;
  const missingBuyer = sales.filter(s => s.platform === 'eBay' && s.ebayOrderId && !s.buyerId).length;
  const missingTracking = sales.filter(s => s.platform === 'eBay' && s.ebayOrderId && !s.tracking).length;
  toast(`Syncing ${ebayCount} eBay sales (${missingBuyer} missing buyer, ${missingTracking} missing tracking)…`);
  await resyncEBayOrders(30);
}

/**
 * Check recent eBay orders for cancellations and returns.
 * Runs on a broader window (30 days) to catch returns on older orders.
 * Fires urgent notifications so users can respond quickly.
 */
async function _syncEBayReturns() {
  try {
    const fmtDate = d => d.toISOString().replace(/\.\d{3}Z$/, 'Z');
    const since = fmtDate(new Date(Date.now() - RETURN_CHECK_WINDOW));
    const now = fmtDate(new Date());

    // Build O(1) lookup maps
    const retBySku = new Map();
    const retByEbayId = new Map();
    for (const item of inv) {
      if (item.sku) retBySku.set(item.sku, item);
      if (item.ebayItemId) retByEbayId.set(item.ebayItemId, item);
    }

    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const filter = `creationdate:[${since}..${now}]`;
      const resp = await ebayAPI('GET',
        `${FULFILLMENT_API}/order?filter=${encodeURIComponent(filter)}&limit=${limit}&offset=${offset}`
      );

      const orders = resp.orders || [];
      if (orders.length < limit) hasMore = false;

      for (const order of orders) {
        const orderId = order.orderId;

        // ── Check for cancellation requests ──
        const cancelState = order.cancelStatus?.cancelState;
        if (cancelState && cancelState !== 'NONE_REQUESTED') {
          const cancelKey = `cancel-${orderId}`;
          if (!_processedReturnIds.has(cancelKey)) {
            _processedReturnIds.add(cancelKey);
            const lineItem = order.lineItems?.[0];
            const sku = lineItem?.sku;
            const local = sku ? (retByEbayId.get(sku) || retBySku.get(sku)) : null;
            const label = local?.name || lineItem?.title || sku || 'Unknown item';
            const price = parseFloat(lineItem?.total?.value || order.pricingSummary?.total?.value || '0');
            const reason = order.cancelStatus?.cancelRequests?.[0]?.cancelReason || 'Buyer requested';

            // Map eBay cancel states to user-friendly labels
            const stateLabel = cancelState === 'CANCEL_REQUESTED' ? 'Cancel Requested'
              : cancelState === 'CANCEL_PENDING' ? 'Cancel Pending'
              : cancelState === 'CANCEL_CLOSED_WITH_REFUND' ? 'Cancelled & Refunded'
              : cancelState === 'CANCEL_CLOSED_NO_REFUND' ? 'Cancelled (No Refund)'
              : 'Cancellation';

            // Try to find matching sale and log return
            if (local) {
              const sale = getSalesForItem(local.id).find(s => s.platform === 'eBay' && !s.returnInfo);
              if (sale) {
                logReturn(sale.id, `eBay Cancel: ${reason}`, price, `Auto-detected: ${stateLabel}`, cancelState.includes('REFUND'));
              }
              // Restock if cancel is confirmed
              if (cancelState === 'CANCEL_CLOSED_WITH_REFUND' || cancelState === 'CANCEL_CLOSED_NO_REFUND') {
                local.qty = (local.qty || 0) + (parseInt(lineItem?.quantity, 10) || 1);
                markPlatformStatus(local.id, 'eBay', 'active');
                markDirty('inv', local.id);
              }
            }

            // Urgent notification
            const priceStr = price > 0 ? ` ($${price.toFixed(2)})` : '';
            toast(`⚠️ eBay ${stateLabel}: ${label}${priceStr}`, true);
            addNotification('sale', `⚠️ ${stateLabel}`, `${label}${priceStr} — ${reason}`, local?.id || null);
            sendNotification(`eBay ${stateLabel}`, `${label}${priceStr} — ${reason}`, cancelKey);
            try { sfx.urgent(); } catch (_) {}
          }
        }

        // ── Check for refunds (returns) on line items ──
        for (const lineItem of (order.lineItems || [])) {
          const refunds = lineItem.refunds || [];
          for (const refund of refunds) {
            const refundKey = `refund-${orderId}-${refund.refundId || refund.refundDate}`;
            if (_processedReturnIds.has(refundKey)) continue;
            _processedReturnIds.add(refundKey);

            const sku = lineItem.sku;
            const local = sku ? (retByEbayId.get(sku) || retBySku.get(sku)) : null;
            const label = local?.name || lineItem.title || sku || 'Unknown item';
            const refundAmount = parseFloat(refund.refundAmount?.value || lineItem.total?.value || '0');

            // Try to find matching sale and log return
            if (local) {
              const sale = getSalesForItem(local.id).find(s => s.platform === 'eBay' && !s.returnInfo);
              if (sale) {
                logReturn(sale.id, 'eBay Return/Refund', refundAmount, `Auto-detected refund on order ${orderId}`, true);
              }
              // Restock the item
              local.qty = (local.qty || 0) + (parseInt(lineItem.quantity, 10) || 1);
              markPlatformStatus(local.id, 'eBay', 'active');
              markDirty('inv', local.id);
            }

            // Urgent notification
            const amtStr = refundAmount > 0 ? ` ($${refundAmount.toFixed(2)})` : '';
            toast(`⚠️ eBay Return: ${label}${amtStr}`, true);
            addNotification('sale', '⚠️ eBay Return', `${label} refunded${amtStr}`, local?.id || null);
            sendNotification('eBay Return', `${label} refunded${amtStr}`, refundKey);
            try { sfx.urgent(); } catch (_) {}
          }
        }
      }

      offset += limit;
    }

    // Persist processed IDs (keep last 500 to prevent unbounded growth)
    const ids = [..._processedReturnIds].slice(-500);
    _processedReturnIds = new Set(ids);
    await setMeta('ebay_processed_returns', JSON.stringify(ids));

  } catch (e) {
    console.warn('[eBay] Return/cancel sync error:', e.message);
  }
}

/**
 * Sync prices from eBay offers back to local inventory.
 * Fetches offers for all eBay-linked items and updates local prices
 * if the eBay price has changed (e.g., revised in Seller Hub).
 * @returns {number} Number of items updated
 */
async function _syncEBayPrices() {
  let updated = 0;
  try {
    // Collect all eBay-linked items with active status
    const ebayItems = inv.filter(i =>
      i.ebayItemId && _isValidSku(i.ebayItemId) && i.platformStatus?.eBay === 'active'
    );
    if (ebayItems.length === 0) return 0;

    // Batch fetch offers by SKU (eBay allows one SKU per request)
    // Process in parallel batches of 5 to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < ebayItems.length; i += batchSize) {
      const batch = ebayItems.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(item =>
          ebayAPI('GET', `${INVENTORY_API}/offer?sku=${encodeURIComponent(item.ebayItemId)}`)
            .then(resp => ({ item, resp }))
        )
      );

      for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        const { item, resp } = result.value;
        const offers = resp?.offers || [];
        if (offers.length === 0) continue;

        const ebayPrice = parseFloat(offers[0].pricingSummary?.price?.value || '0');
        if (ebayPrice <= 0) continue;

        const localPrice = item.price || 0;
        // Only update if there's a meaningful difference (>1 cent)
        if (Math.abs(ebayPrice - localPrice) >= 0.01) {
          console.warn(`[eBay] Price sync: "${item.name}" $${localPrice.toFixed(2)} → $${ebayPrice.toFixed(2)} (from eBay)`);
          item.price = ebayPrice;
          logPriceChange(item.id, ebayPrice, 'ebay-sync');
          markDirty('inv', item.id);
          updated++;
        }
      }
    }

    if (updated > 0) {
      console.warn(`[eBay] Synced ${updated} price(s) from eBay`);
    }
  } catch (e) {
    console.warn('[eBay] Price sync error:', e.message);
  }
  return updated;
}

// (Browse API and Offer import logic is integrated into pullEBayListings above)

// ═══════════════════════════════════════════════════════════════════════════
// SYNC: Best Offers and Auction Status
// ═══════════════════════════════════════════════════════════════════════════

const TRADING_API = '/ws/api.dll';

/**
 * Check for pending Best Offers on active eBay listings.
 * Uses the Trading API GetBestOffers call.
 */
async function _syncEBayOffers() {
  if (_tradingApiBlocked) return 0; // Trading API required — skip if proxy doesn't support it
  const ebayItems = inv.filter(i =>
    i.ebayListingId && i.platformStatus?.eBay === 'active' && i.ebayBestOffer
  );
  if (!ebayItems.length) return 0;

  let notified = 0;
  for (const item of ebayItems) {
    try {
      // Skip items with invalid SKUs for the Offer API pre-check
      if (_isValidSku(item.ebayItemId)) {
        const resp = await ebayAPI('GET',
          `${INVENTORY_API}/offer?sku=${encodeURIComponent(item.ebayItemId)}`
        );
        const offer = resp?.offers?.[0];
        if (!offer) continue;
      }

      // Check the listing for best offers via Trading API GetBestOffers
      const offersResp = await ebayAPI('POST', TRADING_API, {
        _tradingCall: 'GetBestOffers',
        ItemID: item.ebayListingId,
        Status: 'Active',
      });

      const bestOffers = offersResp?.BestOfferArray?.BestOffer || [];
      const pending = bestOffers.filter(o => o.Status === 'Pending');
      if (!pending.length) continue;

      // Track which offers we've already notified about
      const notifiedOffers = new Set(item._notifiedOfferIds || []);
      for (const bo of pending) {
        const offerId = bo.BestOfferID;
        if (notifiedOffers.has(offerId)) continue;
        notifiedOffers.add(offerId);

        const amount = parseFloat(bo.Price?.Value || bo.Price || 0);
        const buyer = bo.Buyer?.UserID || 'Unknown buyer';
        const label = item.name || item.sku || 'Item';

        addNotification('price', 'Best Offer Received',
          `${buyer} offered $${amount.toFixed(2)} for "${label}"`, item.id);
        sendNotification('Best Offer Received', `${buyer} offered $${amount.toFixed(2)} for "${label}"`, `ft-ebay-offer-${offerId}`);
        logItemEvent(item.id, 'ebay-offer',
          `Best offer: $${amount.toFixed(2)} from ${buyer}`);
        notified++;
      }
      item._notifiedOfferIds = [...notifiedOffers];
      markDirty('inv', item.id);
    } catch (e) {
      // Trading API may not be available — skip silently
      console.warn('[eBay] Offer check failed for', item.name, ':', e.message);
    }
  }
  if (notified > 0) save();
  return notified;
}

/**
 * Check for ended auctions and notify the user.
 * Uses Trading API GetItem to check individual auction status.
 * Only runs for auctions that pullEBayListings didn't already handle.
 */
async function _syncEBayAuctions() {
  if (_tradingApiBlocked) return 0; // Trading API required — skip if proxy doesn't support it
  const auctionItems = inv.filter(i =>
    i.ebayListingId &&
    i.ebayListingFormat === 'AUCTION' &&
    i.platformStatus?.eBay === 'active'
  );
  if (!auctionItems.length) return 0;

  let updated = 0;
  for (const item of auctionItems) {
    try {
      // Use Trading API GetItem to check actual listing status
      const resp = await ebayAPI('POST', TRADING_API, {
        _tradingCall: 'GetItem',
        ItemID: item.ebayListingId,
        DetailLevel: 'ReturnAll',
      });

      const ebayItem = resp?.Item || resp?.GetItemResponse?.Item;
      if (!ebayItem) continue; // can't determine status — skip

      const listingStatus = ebayItem.SellingStatus?.ListingStatus;
      // Active/pending listings — nothing to do
      if (listingStatus === 'Active') continue;

      // Auction completed or ended
      const label = item.name || item.sku || 'Item';
      const soldQty = parseInt(ebayItem.SellingStatus?.QuantitySold || '0', 10);

      if (listingStatus === 'Completed' && soldQty > 0) {
        const soldPrice = parseFloat(ebayItem.SellingStatus?.CurrentPrice?.Value || '0');
        addNotification('sale', 'Auction Sold!',
          `"${label}" sold for $${soldPrice.toFixed(2)}`, item.id);
        sendNotification('Auction Sold!', `"${label}" sold for $${soldPrice.toFixed(2)}`, `ft-ebay-auction-${item.ebayListingId}`);
        logItemEvent(item.id, 'auction-end',
          `Auction ended — sold for $${soldPrice.toFixed(2)}`);
        updated++;
      } else if (listingStatus === 'Completed' || listingStatus === 'Ended') {
        // Auction ended with no winner (no bids, reserve not met, or withdrawn).
        // Restore inventory qty if it was zeroed out, so user can relist.
        if ((item.qty || 0) === 0) item.qty = 1;
        markPlatformStatus(item.id, 'eBay', 'expired');
        item.ebayCurrentBid = 0; // clear stale bid
        markDirty('inv', item.id);
        addNotification('info', 'Auction Ended',
          `"${label}" auction ended without a sale — qty restored`, item.id);
        sendNotification('Auction Ended', `"${label}" ended without selling`, `ft-auction-ended-${item.ebayListingId}`);
        logItemEvent(item.id, 'auction-end', 'Auction ended without a sale — qty restored to 1');
        updated++;
      }
    } catch (e) {
      // If Trading API not available, skip silently — pullEBayListings handles discovery
      console.warn('[eBay] Auction check failed for', item.name, ':', e.message);
    }
  }
  if (updated > 0) { save(); refresh(); }
  return updated;
}

// ═══════════════════════════════════════════════════════════════════════════
// PUSH: Re-export from ebay-listing.js (split for bundle size)
// ═══════════════════════════════════════════════════════════════════════════
export {
  pushItemToEBay,
  publishEBayListing,
  updateEBayListing,
  pushEBayPrice,
  endEBayListing,
  relistOnEBay,
} from './ebay-listing.js';

// ── REMOVED: All push/publish/listing code moved to ebay-listing.js ──
// This comment marks where ~1150 lines of code used to be.


// ── MANUAL IMPORT ─────────────────────────────────────────────────────────

/**
 * Import a single eBay listing by URL or listing ID.
 * Uses Browse API getItemByLegacyId — works without username.
 * @param {string} input - eBay URL (e.g. ebay.com/itm/123456) or numeric listing ID
 * @returns {Promise<{success: boolean, item?: Object, error?: string}>}
 */
export async function importEBayItem(input) {
  if (!isEBayConnected()) return { success: false, error: 'eBay not connected' };

  // Extract listing ID from URL or use as-is
  let listingId = input.trim();
  const urlMatch = listingId.match(/\/itm\/(?:[^/]*\/)?(\d+)/);
  if (urlMatch) listingId = urlMatch[1];
  // Strip non-numeric characters
  listingId = listingId.replace(/\D/g, '');
  if (!listingId) return { success: false, error: 'Invalid listing ID or URL' };

  // Check if already in inventory
  const existing = inv.find(i => i.ebayListingId === listingId);
  if (existing) {
    return { success: false, error: `Already in inventory: "${existing.name}"` };
  }

  // Clear dismissal if this listing was previously dismissed
  if (_dismissedEBayIds.has(listingId)) {
    _dismissedEBayIds.delete(listingId);
    setMeta('ebay_dismissed_ids', JSON.stringify([..._dismissedEBayIds])).catch(() => {});
  }

  try {
    const resp = await ebayAPI('GET',
      `${BROWSE_API}/item/get_item_by_legacy_id?legacy_item_id=${listingId}`
    );
    if (!resp) return { success: false, error: 'eBay returned no data for this listing' };

    const title = resp.title || 'eBay Import';
    const buyOpts = resp.buyingOptions || [];
    const isAuction = buyOpts.includes('AUCTION');
    const browsePrice = parseFloat(resp.price?.value || '0');
    const browseBid = parseFloat(resp.currentBidPrice?.value || '0');
    const price = browsePrice || browseBid;
    // Try multiple image paths — Browse API structure varies through proxy
    const imgUrl = resp.image?.imageUrl || resp.thumbnailImages?.[0]?.imageUrl || '';
    const addlImgs = (resp.additionalImages || []).map(i => i?.imageUrl).filter(Boolean);
    const allImgs = [imgUrl, ...addlImgs].filter(Boolean);
    // If no images from Browse API, try fetching from Inventory API
    if (allImgs.length === 0 && (resp.sku || resp.legacyItemId)) {
      try {
        const invSku = resp.sku || `ebay-${listingId}`;
        const invItem = await ebayAPI('GET',
          `${INVENTORY_API}/inventory_item/${encodeURIComponent(invSku)}`
        );
        const prodImgs = invItem?.product?.imageUrls || [];
        allImgs.push(...prodImgs.filter(u => u?.startsWith('http')));
      } catch (_) {}
    }
    console.warn(`[eBay] Import images: ${allImgs.length} found, resp.image=${JSON.stringify(resp.image)?.slice(0,100)}`);

    const newId = uid();
    const newItem = {
      id: newId, name: title, sku: resp.sku || '', price, qty: 1, cost: 0,
      condition: (resp.condition || 'good').toLowerCase(),
      category: resp.categoryPath?.split('|')?.[0]?.trim() || '',
      platforms: ['eBay'], platformStatus: { eBay: 'active' },
      platformListingDates: { eBay: localDate() }, platformListingExpiry: {},
      ebayItemId: resp.sku || `ebay-${listingId}`, ebayListingId: listingId,
      ebayListingFormat: isAuction ? 'AUCTION' : 'FIXED_PRICE',
      ebayBestOffer: buyOpts.includes('BEST_OFFER'),
      url: `https://www.ebay.com/itm/${listingId}`,
      images: allImgs, image: allImgs[0] || '',
      notes: resp.shortDescription || '', tags: [],
      dateAdded: new Date().toISOString(), _notifiedOfferIds: [],
    };
    if (isAuction) {
      if (browsePrice > 0) newItem.ebayBuyItNowPrice = browsePrice;
      if (browseBid > 0) newItem.ebayAuctionStart = browseBid;
    }

    inv.push(newItem);
    markDirty('inv', newId);
    save();
    logItemEvent(newId, 'ebay-import', `Manually imported from eBay: "${title}" (#${listingId})`);

    return { success: true, item: newItem };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ── GETTERS ────────────────────────────────────────────────────────────────

export function isEBaySyncing() { return _syncing; }
export function getLastEBaySyncTime() { return _lastSyncTime; }
