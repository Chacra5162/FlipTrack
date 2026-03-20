/**
 * ebay-sync.js — eBay Listing Sync Module
 * Handles: Pull active listings from eBay, push new listings to eBay,
 * end/relist listings, and sync sold status.
 *
 * Uses the ebay-auth.js proxy for all API calls.
 */

import { inv, sales, save, refresh, markDirty, getInvItem } from '../data/store.js';
import { ebayAPI, isEBayConnected } from './ebay-auth.js';
import { markPlatformStatus, setListingDate } from './crosslist.js';
import { autoDlistOnSale } from './crosslist.js';
import { logSalePrice, logPriceChange, logItemEvent } from './price-history.js';
import { logReturn } from './returns.js';
import { toast } from '../utils/dom.js';
import { getMeta, setMeta } from '../data/idb.js';
import { escHtml, localDate, uid} from '../utils/format.js';
import { generateListing } from './ai-listing.js';
import { addNotification } from './notification-center.js';
import { sendNotification } from './push-notifications.js';
import { sfx } from '../utils/sfx.js';

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const INVENTORY_API = '/sell/inventory/v1';
const FULFILLMENT_API = '/sell/fulfillment/v1';

// eBay condition enum mapping (Inventory API ConditionEnum values)
// See: https://developer.ebay.com/api-docs/sell/inventory/types/slr:ConditionEnum
const CONDITION_MAP = {
  'new':           { id: 1000, enumVal: 'NEW' },
  'nwt':           { id: 1000, enumVal: 'NEW' },
  'new/sealed':    { id: 1000, enumVal: 'NEW' },
  'like new':      { id: 3000, enumVal: 'LIKE_NEW' },
  'nwot':          { id: 1500, enumVal: 'NEW_OTHER' },
  'open box':      { id: 1500, enumVal: 'NEW_OTHER' },
  'excellent':     { id: 2750, enumVal: 'USED_EXCELLENT' },
  'refurbished':   { id: 2750, enumVal: 'SELLER_REFURBISHED' },
  'euc':           { id: 4000, enumVal: 'USED_VERY_GOOD' },
  'very good':     { id: 4000, enumVal: 'USED_VERY_GOOD' },
  'good':          { id: 5000, enumVal: 'USED_GOOD' },
  'guc':           { id: 5000, enumVal: 'USED_GOOD' },
  'acceptable':    { id: 6000, enumVal: 'USED_ACCEPTABLE' },
  'fair':          { id: 6000, enumVal: 'USED_ACCEPTABLE' },
  'poor':          { id: 7000, enumVal: 'FOR_PARTS_OR_NOT_WORKING' },
};

const ACCOUNT_API = '/sell/account/v1';

// ── STATE ──────────────────────────────────────────────────────────────────
let _lastSyncTime = null;
let _syncing = false;
let _syncInterval = null;
let _policiesCache = null;
let _locationKeyCache = null;
let _aspectsCache = {};  // categoryId → { required: [...], timestamp }
let _orderSyncErrorLogged = false; // throttle repeated order-sync warnings
let _processedReturnIds = new Set(); // avoid duplicate return/cancel notifications
let _returnCheckInterval = null;
const RETURN_CHECK_WINDOW = 30 * 86400000; // 30 days

// ── INITIALIZATION ─────────────────────────────────────────────────────────

export async function initEBaySync() {
  _lastSyncTime = await getMeta('ebay_last_sync');
  try {
    const ids = await getMeta('ebay_processed_returns');
    if (ids) _processedReturnIds = new Set(JSON.parse(ids));
  } catch (_) {}
}

/**
 * Start periodic eBay sync (every 5 minutes).
 * Return/cancel checks run every 30 minutes.
 */
export function startEBaySyncInterval() {
  if (_syncInterval) clearInterval(_syncInterval);
  if (_returnCheckInterval) clearInterval(_returnCheckInterval);
  _syncInterval = setInterval(() => {
    if (isEBayConnected() && !_syncing) {
      pullEBayListings().catch(e => { console.warn('eBay sync error:', e.message); toast('eBay sync failed — will retry', true); });
    }
  }, 300000); // 5 minutes
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

export function stopEBaySyncInterval() {
  if (_syncInterval) { clearInterval(_syncInterval); _syncInterval = null; }
  if (_returnCheckInterval) { clearInterval(_returnCheckInterval); _returnCheckInterval = null; }
}

// ═══════════════════════════════════════════════════════════════════════════
// PULL: Fetch active listings from eBay → update local inventory status
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pull all active eBay inventory items and sync status to local inventory.
 * Matches by SKU (primary) or eBay item ID (secondary).
 * @returns {{ matched: number, unmatched: number, updated: number }}
 */
export async function pullEBayListings() {
  if (!isEBayConnected()) throw new Error('eBay not connected');
  if (_syncing) throw new Error('Sync already in progress');
  _syncing = true;

  try {
    let matched = 0, unmatched = 0, updated = 0;
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    const seenSkus = new Set(); // Track SKUs found on eBay for reconciliation

    // Build O(1) lookup maps to avoid O(n²) inv.find() inside the loop
    const bySku = new Map();
    const byEbayId = new Map();
    for (const item of inv) {
      if (item.sku) bySku.set(item.sku, item);
      if (item.ebayItemId) byEbayId.set(item.ebayItemId, item);
    }

    while (hasMore) {
      const resp = await ebayAPI('GET',
        `${INVENTORY_API}/inventory_item?limit=${limit}&offset=${offset}`
      );

      const items = resp.inventoryItems || [];
      if (items.length < limit) hasMore = false;

      for (const ebayItem of items) {
        const sku = ebayItem.sku;
        seenSkus.add(sku);
        // O(1) match by SKU first, then by stored eBay item ID
        let local = bySku.get(sku) || byEbayId.get(sku);

        if (local) {
          matched++;
          let changed = false;

          // Store eBay SKU reference
          if (!local.ebayItemId || local.ebayItemId !== sku) {
            local.ebayItemId = sku;
            changed = true;
          }

          // Update eBay availability status
          const avail = ebayItem.availability?.shipToLocationAvailability;
          if (avail) {
            const ebayQty = avail.quantity || 0;
            if (ebayQty === 0 && local.platformStatus?.eBay === 'active') {
              markPlatformStatus(local.id, 'eBay', 'sold');
              logItemEvent(local.id, 'ebay-sync', 'eBay sync: quantity reached 0 — marked sold');
              changed = true;
            } else if (ebayQty > 0 && local.platformStatus?.eBay !== 'active') {
              // Mark as active when eBay has stock (handles items listed outside FlipTrack)
              markPlatformStatus(local.id, 'eBay', 'active');
              logItemEvent(local.id, 'ebay-sync', 'eBay sync: listing detected as active');
              changed = true;
            }
          }

          // Sync product details if local is missing them
          const product = ebayItem.product;
          if (product) {
            if (!local.name && product.title) { local.name = product.title; changed = true; }
            if (!local.upc && product.upc?.length) { local.upc = product.upc[0]; changed = true; }
            if (product.imageUrls?.length && (!local.images || !local.images.length)) {
              local.images = product.imageUrls;
              local.image = product.imageUrls[0];
              changed = true;
            }
          }

          if (changed) {
            markDirty('inv', local.id);
            updated++;
          }
        } else {
          unmatched++;
        }
      }

      offset += limit;
    }

    // Reconcile: mark local items as ended if they were active but no longer on eBay
    const activeEbayItems = inv.filter(i =>
      i.ebayItemId && i.platformStatus?.eBay === 'active'
    );
    for (const item of activeEbayItems) {
      if (!seenSkus.has(item.ebayItemId)) {
        console.warn(`[eBay] Listing ended externally: "${item.name}" (SKU: ${item.ebayItemId})`);
        markPlatformStatus(item.id, 'eBay', 'ended');
        logItemEvent(item.id, 'ebay-sync', 'eBay sync: listing ended externally');
        markDirty('inv', item.id);
        updated++;
        const label = item.name || item.sku || 'Item';
        toast(`eBay listing ended: ${label}`);
        addNotification('info', 'eBay Listing Ended', `${label} is no longer active on eBay`, item.id);
      }
    }

    // FlipTrack is the source of truth for prices — push outward only.
    // Price pull from eBay removed; local edits & repricing rules push to eBay.

    // Check recent orders for sold items
    await _syncEBayOrders();

    _lastSyncTime = new Date().toISOString();
    await setMeta('ebay_last_sync', _lastSyncTime);

    if (updated > 0) { save(); refresh(); }

    return { matched, unmatched, updated };
  } finally {
    _syncing = false;
  }
}

/**
 * Check recent eBay orders and mark items as sold locally.
 * @param {number} [lookbackMs] - Optional lookback window in ms (default: since last sync or 24h)
 */
async function _syncEBayOrders(lookbackMs) {
  try {
    // eBay Fulfillment API expects ISO 8601 with explicit 'T' and 'Z' — strip milliseconds
    // to avoid timezone parsing issues on eBay's end
    const sinceRaw = lookbackMs
      ? new Date(Date.now() - lookbackMs)
      : _lastSyncTime
        ? new Date(_lastSyncTime)
        : new Date(Date.now() - 86400000);
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
      // Skip orders we've already recorded
      if (order.orderId && knownOrderIds.has(order.orderId)) continue;
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
        // Sale price and fees from order
        const price = parseFloat(lineItem.total?.value || '0');
        if (price > 0) {
          logSalePrice(local.id, price, 'eBay');
        }

        // Create actual sale record (matching recSale() structure)
        const sale = {
          id: uid(), itemId: local.id, price: soldQty > 1 ? price / soldQty : price,
          listPrice: local.price || 0, qty: soldQty, platform: 'eBay',
          fees: 0, ship: 0,
          date: order.creationDate || new Date().toISOString(),
          tracking: null, ebayOrderId: order.orderId || null,
        };
        sales.push(sale);
        markDirty('sales', sale.id);
        markDirty('inv', local.id);

        // 🎉 Notify user of the sale
        const label = local.name || local.sku || 'Item';
        const priceStr = price > 0 ? ` for $${price.toFixed(2)}` : '';
        toast(`🎉 eBay Sale! ${label}${priceStr}`);
        addNotification('sale', 'eBay Sale', `${label} sold${priceStr}`, local.id);
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
  if (found > 0) {
    save(); refresh();
    toast(`Found ${found} missed eBay sale${found > 1 ? 's' : ''}!`);
  } else {
    toast('No missed eBay sales found');
  }
  return { found };
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
              const sale = sales.find(s => s.itemId === local.id && s.platform === 'eBay' && !s.returnInfo);
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
              const sale = sales.find(s => s.itemId === local.id && s.platform === 'eBay' && !s.returnInfo);
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
      i.ebayItemId && i.platformStatus?.eBay === 'active'
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

// ═══════════════════════════════════════════════════════════════════════════
// PUSH: Create/update listing on eBay from local inventory item
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build eBay inventory item payload from a local FlipTrack item.
 */
function _buildInventoryPayload(item) {
  const condition = (item.condition || 'good').toLowerCase().trim();
  const condInfo = CONDITION_MAP[condition] || CONDITION_MAP['good'];
  const isNew = condInfo.enumVal === 'NEW' || condInfo.enumVal === 'NEW_OTHER' || condInfo.enumVal === 'LIKE_NEW';

  // eBay requires at least one image URL
  const imageUrls = (item.images || []).filter(url =>
    url && typeof url === 'string' && url.startsWith('http')
  ).slice(0, 12);
  if (imageUrls.length === 0) {
    throw new Error('eBay requires at least one image. Add a photo to this item first.');
  }

  const payload = {
    availability: {
      shipToLocationAvailability: {
        quantity: item.qty || 1,
      },
    },
    condition: String(condInfo.enumVal),
    product: {
      title: (item.name || 'Item').slice(0, 80),
      description: _buildDescription(item),
      imageUrls,
    },
  };

  // conditionDescription — only use the dedicated condition field, never internal notes
  if (!isNew && item.conditionDesc) {
    payload.conditionDescription = String(item.conditionDesc).slice(0, 1000);
  }

  // Only add aspects if we have meaningful ones (empty object causes 400)
  const aspects = _buildAspects(item);
  if (Object.keys(aspects).length > 0) {
    payload.product.aspects = aspects;
  }

  // Package weight — read from weightMaj/weightMin (lb/oz or kg/g)
  const unit = item.dimUnit || 'in';
  const maj = parseFloat(item.weightMaj) || 0;
  const min = parseFloat(item.weightMin) || 0;
  let weightLbs;
  if (unit === 'cm') {
    // kg + g → convert to lbs
    weightLbs = (maj + min / 1000) * 2.205;
  } else {
    // lb + oz
    weightLbs = maj + min / 16;
  }
  if (weightLbs <= 0) weightLbs = 1; // default 1 lb if not set
  payload.packageWeightAndSize = {
    weight: {
      value: Math.round(weightLbs * 100) / 100,
      unit: 'POUND',
    },
  };

  // Package dimensions if provided
  const dimL = parseFloat(item.dimL) || 0;
  const dimW = parseFloat(item.dimW) || 0;
  const dimH = parseFloat(item.dimH) || 0;
  if (dimL > 0 && dimW > 0 && dimH > 0) {
    let lenIn = dimL, widIn = dimW, hgtIn = dimH;
    if (unit === 'cm') {
      lenIn = dimL / 2.54;
      widIn = dimW / 2.54;
      hgtIn = dimH / 2.54;
    }
    payload.packageWeightAndSize.dimensions = {
      length: Math.round(lenIn * 10) / 10,
      width: Math.round(widIn * 10) / 10,
      height: Math.round(hgtIn * 10) / 10,
      unit: 'INCH',
    };
  }

  // Add UPC if available and valid (must be 12 or 13 digits)
  if (item.upc) {
    const upcClean = item.upc.replace(/[^0-9]/g, '');
    if (upcClean.length === 12 || upcClean.length === 13) {
      payload.product.upc = [upcClean];
    }
  }

  // Add ISBN for books
  if (item.isbn) {
    payload.product.isbn = [item.isbn];
  }

  // Brand and MPN are required by most eBay categories as product identifiers
  payload.product.brand = item.brand || 'Unbranded';
  payload.product.mpn = item.mpn || 'Does Not Apply';

  return payload;
}

/**
 * Generate an AI description for the item and cache it in item._aiDesc.
 * Falls back to the template description if AI is unavailable.
 */
async function _ensureDescription(item) {
  // Already has a user-written or cached AI description — nothing to do
  if (item.ebayDesc) return;
  if (item._aiDesc) return;

  try {
    console.log('[eBay] Generating AI description for', item.name);
    const result = await generateListing(item, { platform: 'eBay' });
    if (result.description) {
      // Cache the AI description on the item so it persists
      item.ebayDesc = result.description.slice(0, 4000);
      // Also store the AI title suggestion — user can use it later
      if (result.title && !item.aiListing) {
        item.aiListing = { title: result.title, description: result.description,
          keywords: result.keywords, generatedAt: new Date().toISOString(), platform: 'eBay' };
      }
      markDirty('inv', item.id);
      save();
      console.log('[eBay] AI description generated and saved');
    }
  } catch (e) {
    console.warn('[eBay] AI description generation failed, using template:', e.message);
    // Fall through — _buildDescription will use the template
  }
}

function _buildDescription(item) {
  // If user wrote a custom eBay description or AI generated one, use it
  if (item.ebayDesc) return String(item.ebayDesc).slice(0, 4000);

  // Fallback: auto-generate a compact HTML listing description (must stay under 4000 chars)
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const title = esc(item.name || 'Item');
  const brandLine = (item.brand && item.brand !== 'Unbranded') ? esc(item.brand) + ' ' : '';

  // Build specification rows — compact inline styles
  const specs = [];
  const addSpec = (label, val) => { if (val) specs.push(`<b>${label}:</b> ${esc(val)}`); };
  addSpec('Brand', item.brand && item.brand !== 'Unbranded' ? item.brand : null);
  addSpec('Model', item.model);
  addSpec('Color', item.color);
  addSpec('Size', item.size);
  addSpec('Material', item.material);
  addSpec('Style', item.style);
  addSpec('Pattern', item.pattern);
  addSpec('Condition', item.condition);
  addSpec('Author', item.author);
  addSpec('Publisher', item.publisher);
  addSpec('ISBN', item.isbn);

  const specsHtml = specs.length > 0
    ? `<p>${specs.join(' &bull; ')}</p>` : '';

  const notesHtml = ''; // Notes are private — never include in public listings

  const html = `<div style="font-family:sans-serif;max-width:700px;margin:0 auto">` +
    `<h2 style="margin:0 0 8px">${brandLine}${title}</h2>` +
    specsHtml + notesHtml +
    `<p style="color:#555;font-size:13px">Ships within 1 business day. Check out my other listings!</p>` +
    `</div>`;

  if (html.length > 4000) {
    const fallback = `<div><h2>${brandLine}${title}</h2>` +
      `<p>${specs.slice(0, 6).join(' &bull; ')}</p></div>`;
    return fallback.slice(0, 4000);
  }
  return html;
}

function _isClothingCategory(item) {
  const cat = (item.category || '').toLowerCase();
  const subcat = (item.subcategory || '').toLowerCase();
  return cat === 'clothing' || cat === 'shoes' || cat === 'apparel'
    || subcat.includes('footwear') || subcat.includes('accessories');
}

function _getDepartment(item) {
  // Infer eBay Department from subcategory, subtype, or item name
  if (item.department) return item.department;
  const sub = (item.subcategory || '').toLowerCase();
  const typ = (item.subtype || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  // Check subcategory
  if (sub.includes('men') && !sub.includes('women')) return "Men's";
  if (sub.includes('women')) return "Women's";
  if (sub.includes('children') || sub.includes('kid') || sub.includes('boy') || sub.includes('girl')) return 'Kids';
  // Check subtype
  if (typ.includes('men') && !typ.includes('women')) return "Men's";
  if (typ.includes('women')) return "Women's";
  // Check item name as last resort
  if (/\bmen'?s?\b/i.test(name) && !/\bwomen/i.test(name)) return "Men's";
  if (/\bwomen'?s?\b/i.test(name)) return "Women's";
  if (/\bboy'?s?\b/i.test(name)) return "Boys'";
  if (/\bgirl'?s?\b/i.test(name)) return "Girls'";
  if (/\bkids?\b|\bchild/i.test(name)) return 'Unisex Kids';
  if (/\bunisex\b/i.test(name)) return 'Unisex Adults';
  // Default — eBay requires this field for clothing
  return 'Unisex Adults';
}

function _buildAspects(item) {
  const aspects = {};
  // Brand is required by most eBay categories — default to "Unbranded"
  aspects['Brand'] = [item.brand || 'Unbranded'];
  if (item.color) aspects['Color'] = [item.color];
  if (item.size) aspects['Size'] = [item.size];
  if (item.material) aspects['Material'] = [item.material];
  if (item.style) aspects['Style'] = [item.style];
  if (item.pattern) aspects['Pattern'] = [item.pattern];
  if (item.model) aspects['Model'] = [item.model];
  aspects['MPN'] = [item.mpn || 'Does Not Apply'];

  // Size Type & Department — required by most eBay clothing/apparel categories.
  // Always send these when detectable; eBay ignores unneeded aspects silently.
  const dept = item.department || _getDepartment(item);
  aspects['Department'] = [dept];
  aspects['Size Type'] = [item.sizeType || 'Regular'];

  // Clothing extras
  if (item.inseam) aspects['Inseam'] = [item.inseam];
  if (item.garmentCare) aspects['Garment Care'] = [item.garmentCare];
  if (item.fit) aspects['Fit'] = [item.fit];
  if (item.closure) aspects['Closure'] = [item.closure];
  if (item.neckline) aspects['Neckline'] = [item.neckline];
  if (item.sleeveLength) aspects['Sleeve Length'] = [item.sleeveLength];
  if (item.rise) aspects['Rise'] = [item.rise];
  if (item.occasion) aspects['Occasion'] = [item.occasion];

  // Footwear-specific
  if (item.shoeSize) aspects['US Shoe Size'] = [item.shoeSize];
  if (item.shoeWidth) aspects['Shoe Width'] = [item.shoeWidth];

  // Other
  if (item.season) aspects['Season'] = [item.season];
  if (item.theme) aspects['Theme'] = [item.theme];
  if (item.vintage) aspects['Vintage'] = [item.vintage];
  if (item.countryMfg) aspects['Country/Region of Manufacture'] = [item.countryMfg];

  // Book-specific aspects
  if (item.author) aspects['Author'] = [item.author];
  if (item.publisher) aspects['Publisher'] = [item.publisher];
  if (item.edition) aspects['Edition'] = [item.edition];
  if (item.pubYear) aspects['Publication Year'] = [String(item.pubYear)];
  if (item.coverType) aspects['Format'] = [item.coverType === 'hardcover' ? 'Hardcover' : 'Paperback'];
  if (item.isbn) aspects['ISBN'] = [item.isbn];
  return aspects;
}

/**
 * Parse missing aspect name(s) from an eBay error message.
 * eBay format: "The item specific <NAME> is missing."
 * @param {string} msg - Error message
 * @returns {string[]} Array of missing aspect names
 */
function _parseMissingAspects(msg) {
  const names = [];
  const re = /item specific (\w[\w\s/&'-]*?) is missing/gi;
  let m;
  while ((m = re.exec(msg)) !== null) names.push(m[1].trim());
  // eBay also uses "Input data for tag <X> is invalid or missing" format
  const re2 = /tag <(\w+)> is invalid or missing/gi;
  while ((m = re2.exec(msg)) !== null) {
    const tag = m[1].trim();
    // BrandMPN is a combined tag — ensure both Brand and MPN are present
    if (tag === 'BrandMPN') { names.push('Brand'); names.push('MPN'); }
    else names.push(tag);
  }
  return names;
}

/**
 * PUT an inventory item to eBay with automatic retry for missing aspects.
 * If the first PUT fails with "item specific X is missing", we add X with
 * a default value and retry once.
 */
async function _putInventoryWithRetry(sku, payload, item) {
  try {
    await ebayAPI('PUT', `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`, payload);
    return;
  } catch (e) {
    const missing = _parseMissingAspects(e.message || '');
    if (missing.length === 0) throw e; // not a missing-aspect error

    console.log('[eBay] Missing aspects detected:', missing.join(', '), '— auto-filling and retrying');
    if (!payload.product) payload.product = {};
    if (!payload.product.aspects) payload.product.aspects = {};

    for (const name of missing) {
      if (payload.product.aspects[name]) continue; // already there somehow
      const defaultFn = _ASPECT_DEFAULTS[name.toLowerCase()];
      payload.product.aspects[name] = [defaultFn ? String(defaultFn(item)) : 'N/A'];
    }

    // Retry once with patched aspects
    console.log('[eBay] Retrying PUT with patched aspects');
    await ebayAPI('PUT', `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`, payload);
  }
}

/**
 * Create or update an inventory item on eBay.
 * @param {string} itemId - Local FlipTrack item ID
 * @returns {Promise<{ success: boolean, sku: string }>}
 */
export async function pushItemToEBay(itemId) {
  if (!isEBayConnected()) throw new Error('eBay not connected');

  const item = getInvItem(itemId);
  if (!item) throw new Error('Item not found');

  // Use existing eBay SKU or FlipTrack SKU or generate one
  const sku = item.ebayItemId || item.sku || `FT-${itemId.slice(0, 12)}`;

  // Generate AI description if user left it blank
  await _ensureDescription(item);
  const payload = _buildInventoryPayload(item);

  // Auto-detect category, validate condition, and fill required aspects
  try {
    const catId = await _suggestCategory(item.name || 'item');
    if (catId) {
      // Validate condition is accepted for this category
      const validEnum = await _getValidCondition(catId, payload.condition);
      if (validEnum !== payload.condition) {
        console.log('[eBay] Condition', payload.condition, 'not valid for category', catId, '→ using', validEnum);
        payload.condition = String(validEnum);
      }
      if (payload.product?.aspects) {
        await _fillMissingAspects(payload.product.aspects, catId, item);
      }
    }
  } catch (e) { console.warn('[eBay] Pre-fill skipped:', e.message); }

  console.log('[eBay] Inventory payload:', JSON.stringify(payload, null, 2));

  try {
    // PUT creates or updates the inventory item (with auto-retry for missing aspects)
    await _putInventoryWithRetry(sku, payload, item);

    // Store eBay reference on local item
    item.ebayItemId = sku;
    if (!item.platforms) item.platforms = [];
    if (!item.platforms.includes('eBay')) item.platforms.push('eBay');
    // Remove "Unlisted" tag now that item is on a real platform
    const uIdx = item.platforms.indexOf('Unlisted');
    if (uIdx !== -1) item.platforms.splice(uIdx, 1);
    if (!item.platformStatus) item.platformStatus = {};
    item.platformStatus['eBay'] = 'draft'; // Not yet published — needs an offer

    setListingDate(itemId, 'eBay', localDate());
    markDirty('inv', itemId);
    save();

    logItemEvent(itemId, 'ebay-push', `Pushed to eBay inventory (SKU: ${sku})`);
    toast(`Pushed "${escHtml(item.name)}" to eBay inventory (SKU: ${sku})`);
    return { success: true, sku };
  } catch (e) {
    toast(`eBay push error: ${e.message}`, true);
    return { success: false, sku };
  }
}

/**
 * Update an already-published eBay listing with latest item data.
 * Updates the inventory item (aspects, description, images, weight, etc.),
 * syncs the offer price, and re-publishes the offer so changes appear live.
 */
export async function updateEBayListing(itemId) {
  if (!isEBayConnected()) throw new Error('eBay not connected');

  const item = getInvItem(itemId);
  if (!item) throw new Error('Item not found');
  if (!item.ebayItemId) throw new Error('Item not on eBay');

  const sku = item.ebayItemId;

  // 1. Update the inventory item with latest data
  await _ensureDescription(item);
  const payload = _buildInventoryPayload(item);

  // Auto-detect category, validate condition, and fill required aspects before pushing
  try {
    const catId = await _suggestCategory(item.name || 'item');
    if (catId) {
      const validEnum = await _getValidCondition(catId, payload.condition);
      if (validEnum !== payload.condition) {
        console.log('[eBay] Condition', payload.condition, 'not valid for category', catId, '→ using', validEnum);
        payload.condition = String(validEnum);
      }
      if (payload.product?.aspects) {
        await _fillMissingAspects(payload.product.aspects, catId, item);
      }
    }
  } catch (e) { console.warn('[eBay] Pre-fill skipped:', e.message); }

  console.log('[eBay] Updating inventory item:', sku);
  await _putInventoryWithRetry(sku, payload, item);
  console.log('[eBay] Inventory item updated');

  // 2. Find the existing offer, update price + qty, and re-publish
  try {
    const existing = await ebayAPI('GET', `${INVENTORY_API}/offer?sku=${encodeURIComponent(sku)}`);
    if (existing?.offers?.length > 0) {
      const offer = existing.offers[0];
      const offerId = offer.offerId;
      const currentPrice = item.price || 0;

      // Update the offer with current price and quantity
      if (currentPrice > 0) {
        const offerUpdate = {
          pricingSummary: {
            price: {
              value: currentPrice.toFixed(2),
              currency: 'USD',
            },
          },
          availableQuantity: item.qty || 1,
        };

        // Preserve existing offer fields that eBay requires
        if (offer.categoryId) offerUpdate.categoryId = offer.categoryId;
        if (offer.listingPolicies) offerUpdate.listingPolicies = offer.listingPolicies;
        if (offer.merchantLocationKey) offerUpdate.merchantLocationKey = offer.merchantLocationKey;
        if (offer.format) offerUpdate.format = offer.format;
        if (offer.listingDuration) offerUpdate.listingDuration = offer.listingDuration;

        console.log('[eBay] Updating offer price to $' + currentPrice.toFixed(2));
        await ebayAPI('PUT', `${INVENTORY_API}/offer/${offerId}`, offerUpdate);
      }

      console.log('[eBay] Re-publishing offer to push changes live:', offerId);
      const pubResp = await ebayAPI('POST', `${INVENTORY_API}/offer/${offerId}/publish`);
      console.log('[eBay] Listing updated live, listingId:', pubResp.listingId);
    } else {
      console.log('[eBay] No offer found — inventory item updated but listing may need manual publish');
    }
  } catch (pubErr) {
    // Publish can fail if listing is already up-to-date or other reasons
    console.warn('[eBay] Re-publish note:', pubErr.message);
  }

  logItemEvent(itemId, 'ebay-update', 'eBay listing updated with latest details');
  return { success: true };
}

/**
 * Push only the price to eBay (lightweight — no inventory item update).
 * Used for inline price edits where we just need to sync the new price fast.
 * @param {string} itemId - Local FlipTrack item ID
 * @returns {Promise<{ success: boolean }>}
 */
export async function pushEBayPrice(itemId) {
  if (!isEBayConnected()) return { success: false };

  const item = getInvItem(itemId);
  if (!item || !item.ebayItemId) return { success: false };
  if (!item.price || item.price <= 0) return { success: false };

  const sku = item.ebayItemId;

  try {
    // Fetch the existing offer for this SKU
    const existing = await ebayAPI('GET', `${INVENTORY_API}/offer?sku=${encodeURIComponent(sku)}`);
    if (!existing?.offers?.length) {
      console.log('[eBay] No offer found for SKU', sku, '— skipping price push');
      return { success: false };
    }

    const offer = existing.offers[0];
    const offerId = offer.offerId;
    const ebayPrice = parseFloat(offer.pricingSummary?.price?.value || '0');

    // Only update if price actually changed
    if (Math.abs(ebayPrice - item.price) < 0.01) {
      console.log('[eBay] Price already in sync ($' + item.price.toFixed(2) + ')');
      return { success: true };
    }

    // Build minimal offer update payload
    const offerUpdate = {
      pricingSummary: {
        price: {
          value: item.price.toFixed(2),
          currency: 'USD',
        },
      },
      availableQuantity: item.qty || 1,
    };

    // Preserve required offer fields
    if (offer.categoryId) offerUpdate.categoryId = offer.categoryId;
    if (offer.listingPolicies) offerUpdate.listingPolicies = offer.listingPolicies;
    if (offer.merchantLocationKey) offerUpdate.merchantLocationKey = offer.merchantLocationKey;
    if (offer.format) offerUpdate.format = offer.format;
    if (offer.listingDuration) offerUpdate.listingDuration = offer.listingDuration;

    console.log('[eBay] Pushing price update: $' + ebayPrice.toFixed(2) + ' → $' + item.price.toFixed(2));
    await ebayAPI('PUT', `${INVENTORY_API}/offer/${offerId}`, offerUpdate);

    // Re-publish to make it live
    await ebayAPI('POST', `${INVENTORY_API}/offer/${offerId}/publish`);
    console.log('[eBay] Price synced to eBay ✓');

    return { success: true };
  } catch (e) {
    console.warn('[eBay] Price push failed:', e.message);
    return { success: false };
  }
}

/**
 * Fetch the seller's eBay business policies (payment, return, fulfillment).
 * Caches after first successful call.
 * @returns {Promise<{paymentPolicyId: string, returnPolicyId: string, fulfillmentPolicyId: string} | null>}
 */
async function _fetchBusinessPolicies() {
  if (_policiesCache) return _policiesCache;
  try {
    const mp = 'marketplace_id=EBAY_US';
    const [payment, returns, fulfillment] = await Promise.all([
      ebayAPI('GET', `${ACCOUNT_API}/payment_policy?${mp}`),
      ebayAPI('GET', `${ACCOUNT_API}/return_policy?${mp}`),
      ebayAPI('GET', `${ACCOUNT_API}/fulfillment_policy?${mp}`),
    ]);

    const payId = payment?.paymentPolicies?.[0]?.paymentPolicyId;
    const retId = returns?.returnPolicies?.[0]?.returnPolicyId;
    const fulId = fulfillment?.fulfillmentPolicies?.[0]?.fulfillmentPolicyId;

    if (payId && retId && fulId) {
      _policiesCache = { paymentPolicyId: payId, returnPolicyId: retId, fulfillmentPolicyId: fulId };
      return _policiesCache;
    }
    return null;
  } catch (e) {
    console.warn('[eBay] Could not fetch business policies:', e.message);
    return null;
  }
}

/**
 * Suggest an eBay category ID from an item title using the Taxonomy API.
 * @param {string} query - Item title or search phrase
 * @returns {Promise<string|null>} eBay category ID or null
 */
async function _suggestCategory(query) {
  try {
    const q = encodeURIComponent(query.slice(0, 100));
    const resp = await ebayAPI('GET',
      `/commerce/taxonomy/v1/category_tree/0/get_category_suggestions?q=${q}`);
    const suggestion = resp?.categorySuggestions?.[0];
    return suggestion?.category?.categoryId || null;
  } catch (e) {
    console.warn('[eBay] Category suggestion failed:', e.message);
    return null;
  }
}

/**
 * Fetch the seller's merchant inventory location key (if any).
 * eBay may require this on offers depending on the seller's account setup.
 * @returns {Promise<string|null>} merchantLocationKey or null
 */
async function _fetchMerchantLocation() {
  if (_locationKeyCache) return _locationKeyCache;
  try {
    const resp = await ebayAPI('GET', `${INVENTORY_API}/location?limit=5`);
    const locations = resp?.locations || [];
    if (locations.length > 0) {
      _locationKeyCache = locations[0].merchantLocationKey;
      console.log('[eBay] Found merchant location:', _locationKeyCache);
      return _locationKeyCache;
    }

    // No location exists — create one (eBay needs this for Item.Country)
    const key = 'fliptrack-default';
    console.log('[eBay] Creating default merchant location…');
    await ebayAPI('POST', `${INVENTORY_API}/location/${key}`, {
      location: {
        address: {
          postalCode: '10001',
          country: 'US',
        },
      },
      locationTypes: ['WAREHOUSE'],
      name: 'Default',
      merchantLocationStatus: 'ENABLED',
    });
    _locationKeyCache = key;
    console.log('[eBay] Created merchant location:', key);
    return _locationKeyCache;
  } catch (e) {
    console.warn('[eBay] Could not fetch/create merchant location:', e.message);
    return null;
  }
}

/**
 * Fetch valid condition IDs for an eBay category and return the best match.
 * If our preferred condition isn't valid, picks the closest valid one.
 * @param {string} categoryId - eBay category ID
 * @param {string} preferredEnum - e.g. 'USED_GOOD', 'NEW', etc.
 * @returns {Promise<string>} Valid ConditionEnum value
 */
async function _getValidCondition(categoryId, preferredEnum) {
  try {
    const resp = await ebayAPI('GET',
      `/commerce/taxonomy/v1/category_tree/0/get_item_conditions_policies?category_id=${categoryId}`);
    const condArr = resp?.itemConditionPolicies?.[0]?.itemConditions || [];
    const validIds = condArr.map(c => String(c.conditionId));
    console.log('[eBay] Valid conditions for category', categoryId, ':', validIds.join(','));

    // Build reverse map: conditionId → enumVal
    const allConds = Object.values(CONDITION_MAP);
    const preferredId = allConds.find(c => c.enumVal === preferredEnum)?.id;

    if (preferredId && validIds.includes(String(preferredId))) {
      return preferredEnum; // our condition is valid
    }

    // Condition not valid — find the closest valid one
    // Priority: try broader used conditions, then fall back to the first non-new valid one
    const usedFallbackOrder = [3000, 4000, 5000, 6000, 2750, 7000, 1500, 1000];
    const newFallbackOrder = [1000, 1500, 3000];
    const isNewPref = ['NEW', 'NEW_OTHER', 'LIKE_NEW'].includes(preferredEnum);
    const order = isNewPref ? newFallbackOrder : usedFallbackOrder;

    for (const id of order) {
      if (validIds.includes(String(id))) {
        const match = allConds.find(c => c.id === id);
        if (match) {
          console.log('[eBay] Condition', preferredEnum, 'not valid, falling back to', match.enumVal);
          return match.enumVal;
        }
      }
    }

    // Last resort — use whatever eBay says is first valid
    if (condArr.length > 0 && condArr[0]?.conditionId) {
      const firstValid = allConds.find(c => c.id === parseInt(condArr[0].conditionId));
      if (firstValid) return firstValid.enumVal;
    }
    return preferredEnum; // return original and let eBay error if needed
  } catch (e) {
    console.warn('[eBay] Could not fetch valid conditions:', e.message);
    return preferredEnum; // fallback to original on API error
  }
}

/**
 * Fetch required item aspects for a given eBay category from the Taxonomy API.
 * Caches results for 1 hour per category.
 * @param {string} categoryId
 * @returns {Promise<Array<{ name: string, required: boolean, mode: string, values: string[] }>>}
 */
async function _fetchRequiredAspects(categoryId) {
  // Check cache (1 hour TTL)
  const cached = _aspectsCache[categoryId];
  if (cached && Date.now() - cached.timestamp < 3600000) return cached.aspects;

  try {
    const resp = await ebayAPI('GET',
      `/commerce/taxonomy/v1/category_tree/0/get_item_aspects_for_category?category_id=${categoryId}`);
    const raw = resp?.aspects || [];
    const aspects = raw.map(a => ({
      name: a.localizedAspectName || '',
      required: a.aspectConstraint?.aspectRequired === true,
      mode: a.aspectConstraint?.aspectMode || 'FREE_TEXT',
      values: (a.aspectValues || []).map(v => v.localizedValue).filter(Boolean),
    }));
    _aspectsCache[categoryId] = { aspects, timestamp: Date.now() };
    console.log('[eBay] Fetched', aspects.length, 'aspects for category', categoryId,
      '—', aspects.filter(a => a.required).length, 'required');
    return aspects;
  } catch (e) {
    console.warn('[eBay] Could not fetch required aspects for category', categoryId, ':', e.message);
    return [];
  }
}

/**
 * Smart defaults for common required eBay aspects that we can't infer from item data.
 * Keys are lowercased aspect names.
 */
const _ASPECT_DEFAULTS = {
  'type':             (item) => item.subtype || item.subcategory || 'Other',
  'style':            (item) => item.style || 'Classic',
  'closure':          (_) => 'Pull On',
  'pattern':          (item) => item.pattern || 'Solid',
  'material':         (item) => item.material || 'N/A',
  'color':            (item) => item.color || 'Multicolor',
  'features':         (_) => 'N/A',
  'theme':            (_) => 'Classic',
  'occasion':         (_) => 'Casual',
  'season':           (_) => 'All Seasons',
  'fit':              (_) => 'Regular',
  'rise':             (_) => 'Mid Rise',
  'leg style':        (_) => 'Straight',
  'sleeve length':    (_) => 'Short Sleeve',
  'neckline':         (_) => 'Crew Neck',
  'vintage':          (_) => 'No',
  'country/region of manufacture': (_) => 'Unknown',
  'character':        (_) => 'N/A',
  'model':            (item) => item.model || 'N/A',
  'connectivity':     (_) => 'N/A',
  'number of items in set': (_) => '1',
  'unit type':        (_) => 'Unit',
  'unit quantity':    (_) => '1',
};

/**
 * Fill any missing REQUIRED aspects using eBay Taxonomy data + smart defaults.
 * Merges into the existing aspects object in-place.
 * @param {Object} aspects - Existing aspects map (mutated)
 * @param {string} categoryId - eBay category ID
 * @param {Object} item - FlipTrack item
 * @returns {Promise<Object>} The aspects object (same ref, possibly expanded)
 */
async function _fillMissingAspects(aspects, categoryId, item) {
  const required = await _fetchRequiredAspects(categoryId);
  if (!required.length) return aspects;

  const existingLower = {};
  for (const k of Object.keys(aspects)) existingLower[k.toLowerCase()] = k;

  let filled = 0;
  for (const asp of required) {
    if (!asp.required) continue;
    const key = asp.name;
    const keyLow = key.toLowerCase();

    // Already provided
    if (existingLower[keyLow]) continue;

    // Try smart default function
    const defaultFn = _ASPECT_DEFAULTS[keyLow];
    if (defaultFn) {
      const val = defaultFn(item);
      // Validate against allowed values if SELECTION_ONLY
      if (asp.mode === 'SELECTION_ONLY' && asp.values.length > 0) {
        // Try to match our default to an allowed value (case-insensitive)
        const match = asp.values.find(v => v.toLowerCase() === String(val).toLowerCase());
        aspects[key] = [match || asp.values[0]];
      } else {
        aspects[key] = [String(val)];
      }
      filled++;
      continue;
    }

    // No smart default — use first allowed value or generic fallback
    if (asp.values.length > 0) {
      aspects[key] = [asp.values[0]];
      filled++;
    } else {
      // Free text required aspect with no values list — use generic
      aspects[key] = ['N/A'];
      filled++;
    }
  }

  if (filled > 0) {
    console.log('[eBay] Auto-filled', filled, 'missing required aspects for category', categoryId);
  }
  return aspects;
}

/**
 * Create an offer and publish it to make an eBay listing live.
 * Requires the item to already be in eBay inventory (via pushItemToEBay).
 * Auto-detects business policies and category if not provided.
 * @param {string} itemId - Local FlipTrack item ID
 * @param {Object} [options] - Listing options
 * @param {string} [options.categoryId] - eBay category ID
 * @param {string} [options.listingDuration] - 'GTC' or 'DAYS_7', etc.
 * @returns {Promise<{ success: boolean, listingId?: string }>}
 */
export async function publishEBayListing(itemId, options = {}) {
  if (!isEBayConnected()) throw new Error('eBay not connected');

  const item = getInvItem(itemId);
  if (!item) throw new Error('Item not found');
  if (!item.ebayItemId) throw new Error('Item not in eBay inventory. Push it first.');

  const sku = item.ebayItemId;
  const price = item.price || 0;
  if (price <= 0) throw new Error('Item needs a price before listing');

  // Auto-detect category first — we need it for condition validation
  let categoryId = options.categoryId || null;
  if (!categoryId) {
    categoryId = await _suggestCategory(item.name || 'item');
  }
  if (!categoryId) {
    throw new Error('Could not determine eBay category. Please set a category for this item.');
  }

  // Validate condition against category — some categories only accept certain conditions
  const condition = (item.condition || 'good').toLowerCase().trim();
  const condInfo = CONDITION_MAP[condition] || CONDITION_MAP['good'];
  const validEnum = await _getValidCondition(categoryId, condInfo.enumVal);
  if (validEnum !== condInfo.enumVal) {
    console.log('[eBay] Overriding condition from', condInfo.enumVal, 'to', validEnum, 'for category', categoryId);
  }

  // Generate AI description if user left it blank
  await _ensureDescription(item);

  // Delete existing stale inventory item and re-create with correct brand/mpn
  try {
    console.log('[eBay] Deleting stale inventory item to re-create with brand/mpn');
    // Delete any existing offers first (eBay won't delete inventory items with offers)
    try {
      const existingOffers = await ebayAPI('GET', `${INVENTORY_API}/offer?sku=${encodeURIComponent(sku)}`);
      for (const o of (existingOffers?.offers || [])) {
        await ebayAPI('DELETE', `${INVENTORY_API}/offer/${o.offerId}`);
      }
    } catch (_) {}
    try { await ebayAPI('DELETE', `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`); } catch (_) {}
  } catch (_) {}

  // Push fresh inventory item with all required fields
  try {
    const invPayload = _buildInventoryPayload(item);
    invPayload.condition = String(validEnum); // use validated condition
    // Auto-fill any missing required aspects for this category
    if (invPayload.product?.aspects) {
      await _fillMissingAspects(invPayload.product.aspects, categoryId, item);
    }
    console.log('[eBay] Pushing fresh inventory item with validated condition:', validEnum);
    await _putInventoryWithRetry(sku, invPayload, item);
    console.log('[eBay] Inventory push succeeded');
  } catch (invErr) {
    console.warn('[eBay] Full push failed:', invErr.message, '— trying aspect-only patch');
    try {
      const existing = await ebayAPI('GET', `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`);
      const aspects = _buildAspects(item);
      await _fillMissingAspects(aspects, categoryId, item);
      if (!existing.product) existing.product = {};
      existing.product.aspects = { ...(existing.product.aspects || {}), ...aspects };
      existing.product.brand = item.brand || 'Unbranded';
      existing.product.mpn = item.mpn || 'Does Not Apply';
      existing.condition = String(validEnum); // fix condition on existing item too
      console.log('[eBay] Patching aspects + brand/mpn + condition on existing inventory item');
      await ebayAPI('PUT', `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`, existing);
      console.log('[eBay] Aspect patch succeeded');
    } catch (patchErr) {
      console.warn('[eBay] Aspect patch also failed:', patchErr.message);
    }
  }

  // Auto-detect business policies if not provided
  const hasPolicies = options.paymentPolicyId || options.returnPolicyId || options.fulfillmentPolicyId;
  let listingPolicies = null;
  if (hasPolicies) {
    listingPolicies = {};
    if (options.paymentPolicyId) listingPolicies.paymentPolicyId = options.paymentPolicyId;
    if (options.returnPolicyId) listingPolicies.returnPolicyId = options.returnPolicyId;
    if (options.fulfillmentPolicyId) listingPolicies.fulfillmentPolicyId = options.fulfillmentPolicyId;
  } else {
    const policies = await _fetchBusinessPolicies();
    if (policies) {
      listingPolicies = {
        paymentPolicyId: policies.paymentPolicyId,
        returnPolicyId: policies.returnPolicyId,
        fulfillmentPolicyId: policies.fulfillmentPolicyId,
      };
    }
  }
  if (!listingPolicies) {
    throw new Error('eBay requires business policies (payment, return, shipping). Set these up in eBay Seller Hub first.');
  }

  // Merchant location is required — provides Item.Country for the listing
  const merchantLocationKey = await _fetchMerchantLocation();
  if (!merchantLocationKey) {
    throw new Error('Could not set up eBay inventory location. Go to eBay Seller Hub → Shipping → Locations and add one.');
  }

  const offerPayload = {
    sku,
    marketplaceId: 'EBAY_US',
    format: 'FIXED_PRICE',
    listingDuration: options.listingDuration || 'GTC',
    categoryId,
    merchantLocationKey,
    listingPolicies,
    pricingSummary: {
      price: {
        value: price.toFixed(2),
        currency: 'USD',
      },
    },
    availableQuantity: item.qty || 1,
  };

  try {
    // Check for existing offers for this SKU first
    let offerId = null;
    try {
      const existing = await ebayAPI('GET', `${INVENTORY_API}/offer?sku=${encodeURIComponent(sku)}`);
      if (existing?.offers?.length > 0) {
        offerId = existing.offers[0].offerId;
        console.log('[eBay] Found existing offer:', offerId, '— updating it');
      }
    } catch (_) { /* no existing offers */ }

    if (offerId) {
      // Update existing offer — eBay update payload must NOT include sku or marketplaceId
      const { sku: _s, marketplaceId: _m, ...updatePayload } = offerPayload;
      console.log('[eBay] Updating offer:', offerId, JSON.stringify(updatePayload));
      try {
        await ebayAPI('PUT', `${INVENTORY_API}/offer/${offerId}`, updatePayload);
      } catch (updateErr) {
        console.warn('[eBay] Offer update failed:', updateErr.message, '— deleting and recreating');
        // If update fails, delete the stale offer and create fresh
        try { await ebayAPI('DELETE', `${INVENTORY_API}/offer/${offerId}`); } catch (_) {}
        offerId = null;
      }
    }

    // Create offer if none exists (or old one was deleted)
    if (!offerId) {
      console.log('[eBay] Creating offer:', JSON.stringify(offerPayload));
      const offerResp = await ebayAPI('POST', `${INVENTORY_API}/offer`, offerPayload);
      offerId = offerResp.offerId;

      if (!offerId) {
        const ebayMsg = offerResp.errors?.[0]?.longMessage || offerResp.errors?.[0]?.message || '';
        throw new Error(ebayMsg || 'Could not create offer. Set up business policies in eBay Seller Hub first.');
      }
    }

    // Publish offer (makes it live) — with retry for missing aspects
    console.log('[eBay] Publishing offer:', offerId);
    let publishResp;
    try {
      publishResp = await ebayAPI('POST', `${INVENTORY_API}/offer/${offerId}/publish`);
    } catch (pubErr) {
      const missing = _parseMissingAspects(pubErr.message || '');
      if (missing.length === 0) throw pubErr;
      // Fetch existing inventory item from eBay and patch aspects directly
      console.log('[eBay] Publish failed — missing aspects:', missing.join(', '), '— fetching existing item and patching');
      const existing = await ebayAPI('GET', `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`);
      if (!existing.product) existing.product = {};
      if (!existing.product.aspects) existing.product.aspects = {};
      // Force-set Brand and MPN at both product level and aspects level
      existing.product.brand = item.brand || 'Unbranded';
      existing.product.mpn = item.mpn || 'Does Not Apply';
      existing.product.aspects['Brand'] = [item.brand || 'Unbranded'];
      existing.product.aspects['MPN'] = [item.mpn || 'Does Not Apply'];
      for (const name of missing) {
        if (name === 'Brand' || name === 'MPN') continue; // already handled
        if (existing.product.aspects[name]) continue;
        const defaultFn = _ASPECT_DEFAULTS[name.toLowerCase()];
        existing.product.aspects[name] = [defaultFn ? String(defaultFn(item)) : 'Does Not Apply'];
      }
      console.log('[eBay] Patching inventory item with brand/mpn + aspects:', JSON.stringify(existing.product.aspects));
      await ebayAPI('PUT', `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`, existing);
      publishResp = await ebayAPI('POST', `${INVENTORY_API}/offer/${offerId}/publish`);
    }
    const listingId = publishResp.listingId;

    // Update local item
    item.platformStatus['eBay'] = 'active';
    item.ebayListingId = listingId;
    item.url = listingId ? `https://www.ebay.com/itm/${listingId}` : item.url;
    setListingDate(itemId, 'eBay', localDate());
    markDirty('inv', itemId);
    save();

    logItemEvent(itemId, 'listed', `Published on eBay — Listing #${listingId}`);
    toast(`Listed on eBay! Item #${listingId}`);
    return { success: true, listingId };
  } catch (e) {
    console.error('[eBay] PUBLISH ERROR DETAIL:', e.message);
    // Auto-reset: clear stale eBay refs and retry as a completely fresh listing
    if (item.ebayItemId) {
      console.log('[eBay] Auto-resetting stale eBay data and retrying as fresh item');
      toast('Retrying as fresh listing…');
      // Clean up stale data on eBay
      try {
        const staleOffers = await ebayAPI('GET', `${INVENTORY_API}/offer?sku=${encodeURIComponent(sku)}`);
        for (const o of (staleOffers?.offers || [])) {
          try { await ebayAPI('DELETE', `${INVENTORY_API}/offer/${o.offerId}`); } catch (_) {}
        }
      } catch (_) {}
      try { await ebayAPI('DELETE', `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`); } catch (_) {}
      // Clear local eBay refs
      delete item.ebayItemId;
      delete item.ebayListingId;
      if (item.platformStatus) delete item.platformStatus['eBay'];
      markDirty('inv', itemId);
      save();
      // Retry: push + publish as brand new
      try {
        const pushResult = await pushItemToEBay(itemId);
        if (pushResult.success) {
          const pubResult = await publishEBayListing(itemId);
          return pubResult;
        }
      } catch (retryErr) {
        toast(`eBay listing error: ${retryErr.message}`, true);
        return { success: false };
      }
    }
    toast(`eBay listing error: ${e.message}`, true);
    return { success: false };
  }
}

/**
 * End (delist) an active eBay listing.
 * @param {string} itemId - Local FlipTrack item ID
 */
export async function endEBayListing(itemId) {
  if (!isEBayConnected()) throw new Error('eBay not connected');

  const item = getInvItem(itemId);
  if (!item || !item.ebayItemId) throw new Error('Item not on eBay');

  try {
    // Set quantity to 0 to effectively end the listing
    await ebayAPI('PUT', `${INVENTORY_API}/inventory_item/${encodeURIComponent(item.ebayItemId)}`, {
      availability: {
        shipToLocationAvailability: { quantity: 0 },
      },
    });

    markPlatformStatus(itemId, 'eBay', 'delisted');
    logItemEvent(itemId, 'delisted', 'eBay listing ended');
    markDirty('inv', itemId);
    save();

    toast('eBay listing ended');
    return { success: true };
  } catch (e) {
    toast(`eBay end listing error: ${e.message}`, true);
    return { success: false };
  }
}

/**
 * Relist an ended/expired eBay listing by restoring quantity.
 */
export async function relistOnEBay(itemId) {
  if (!isEBayConnected()) throw new Error('eBay not connected');

  const item = getInvItem(itemId);
  if (!item || !item.ebayItemId) {
    // If no eBay SKU, push as new
    return pushItemToEBay(itemId);
  }

  try {
    await ebayAPI('PUT', `${INVENTORY_API}/inventory_item/${encodeURIComponent(item.ebayItemId)}`, {
      availability: {
        shipToLocationAvailability: { quantity: item.qty || 1 },
      },
    });

    markPlatformStatus(itemId, 'eBay', 'active');
    setListingDate(itemId, 'eBay', localDate());
    logItemEvent(itemId, 'relisted', 'Relisted on eBay');
    markDirty('inv', itemId);
    save();

    toast('Relisted on eBay');
    return { success: true };
  } catch (e) {
    toast(`eBay relist error: ${e.message}`, true);
    return { success: false };
  }
}

// ── GETTERS ────────────────────────────────────────────────────────────────

export function isEBaySyncing() { return _syncing; }
export function getLastEBaySyncTime() { return _lastSyncTime; }
