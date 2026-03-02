/**
 * ebay-sync.js — eBay Listing Sync Module
 * Handles: Pull active listings from eBay, push new listings to eBay,
 * end/relist listings, and sync sold status.
 *
 * Uses the ebay-auth.js proxy for all API calls.
 */

import { inv, save, refresh, markDirty, getInvItem } from '../data/store.js';
import { ebayAPI, isEBayConnected } from './ebay-auth.js';
import { markPlatformStatus, setListingDate } from './crosslist.js';
import { autoDlistOnSale } from './crosslist.js';
import { logSalePrice } from './price-history.js';
import { toast } from '../utils/dom.js';
import { getMeta, setMeta } from '../data/idb.js';
import { escHtml } from '../utils/format.js';

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const INVENTORY_API = '/sell/inventory/v1';
const FULFILLMENT_API = '/sell/fulfillment/v1';

// eBay condition ID mapping
const CONDITION_MAP = {
  'new':        { id: 1000, name: 'New' },
  'like new':   { id: 3000, name: 'Like New' },
  'open box':   { id: 1500, name: 'Open Box' },
  'excellent':  { id: 2750, name: 'Excellent - Refurbished' },
  'very good':  { id: 4000, name: 'Very Good' },
  'good':       { id: 5000, name: 'Good' },
  'acceptable': { id: 6000, name: 'Acceptable' },
  'fair':       { id: 6000, name: 'Acceptable' },
  'poor':       { id: 7000, name: 'For parts or not working' },
};

// ── STATE ──────────────────────────────────────────────────────────────────
let _lastSyncTime = null;
let _syncing = false;
let _syncInterval = null;

// ── INITIALIZATION ─────────────────────────────────────────────────────────

export async function initEBaySync() {
  _lastSyncTime = await getMeta('ebay_last_sync');
}

/**
 * Start periodic eBay sync (every 5 minutes).
 */
export function startEBaySyncInterval() {
  if (_syncInterval) clearInterval(_syncInterval);
  _syncInterval = setInterval(() => {
    if (isEBayConnected() && !_syncing) {
      pullEBayListings().catch(e => console.warn('eBay sync error:', e.message));
    }
  }, 300000); // 5 minutes
}

export function stopEBaySyncInterval() {
  if (_syncInterval) { clearInterval(_syncInterval); _syncInterval = null; }
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

    while (hasMore) {
      const resp = await ebayAPI('GET',
        `${INVENTORY_API}/inventory_item?limit=${limit}&offset=${offset}`
      );

      const items = resp.inventoryItems || [];
      if (items.length < limit) hasMore = false;

      for (const ebayItem of items) {
        const sku = ebayItem.sku;
        // Try to match by SKU first, then by stored eBay item ID
        let local = inv.find(i =>
          i.sku && i.sku === sku
        ) || inv.find(i =>
          i.ebayItemId && i.ebayItemId === sku
        );

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
            // If eBay shows 0 quantity and we have it as active, update
            if (ebayQty === 0 && local.platformStatus?.eBay === 'active') {
              markPlatformStatus(local.id, 'eBay', 'sold');
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

    // Also check recent orders for sold items
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
 */
async function _syncEBayOrders() {
  try {
    // Get orders from last 24 hours (or since last sync)
    const since = _lastSyncTime
      ? new Date(_lastSyncTime).toISOString()
      : new Date(Date.now() - 86400000).toISOString();

    const filter = `creationdate:[${since}..NOW]`;
    const resp = await ebayAPI('GET',
      `${FULFILLMENT_API}/order?filter=${encodeURIComponent(filter)}&limit=50`
    );

    const orders = resp.orders || [];
    for (const order of orders) {
      for (const lineItem of (order.lineItems || [])) {
        const sku = lineItem.sku;
        if (!sku) continue;

        const local = inv.find(i => i.ebayItemId === sku || i.sku === sku);
        if (local && local.platformStatus?.eBay !== 'sold') {
          markPlatformStatus(local.id, 'eBay', 'sold');
          // Auto-delist on other platforms if qty=0
          if ((local.qty || 0) <= 0) {
            autoDlistOnSale(local.id, 'eBay');
          }
          // Log sale price
          const price = parseFloat(lineItem.total?.value || '0');
          if (price > 0) {
            logSalePrice(local.id, price, 'eBay');
          }
          markDirty('inv', local.id);
        }
      }
    }
  } catch (e) {
    // Non-critical — orders sync is best-effort
    console.warn('eBay orders sync error:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUSH: Create/update listing on eBay from local inventory item
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build eBay inventory item payload from a local FlipTrack item.
 */
function _buildInventoryPayload(item) {
  const condition = (item.condition || 'good').toLowerCase();
  const condInfo = CONDITION_MAP[condition] || CONDITION_MAP['good'];

  const payload = {
    availability: {
      shipToLocationAvailability: {
        quantity: item.qty || 1,
      },
    },
    condition: condInfo.name.toUpperCase().replace(/\s+/g, '_'),
    conditionDescription: item.notes || undefined,
    product: {
      title: (item.name || 'Item').slice(0, 80),
      description: _buildDescription(item),
      aspects: _buildAspects(item),
      imageUrls: (item.images || []).filter(url =>
        url && url.startsWith('http')
      ).slice(0, 12),
    },
  };

  // Add UPC if available
  if (item.upc) {
    payload.product.upc = [item.upc];
  }

  // Add ISBN for books
  if (item.isbn) {
    payload.product.isbn = [item.isbn];
  }

  return payload;
}

function _buildDescription(item) {
  const parts = [];
  if (item.condition) parts.push(`Condition: ${item.condition}`);
  if (item.category) parts.push(`Category: ${item.category}`);
  if (item.subcategory) parts.push(`Subcategory: ${item.subcategory}`);
  if (item.notes) parts.push(item.notes);
  parts.push('Ships fast! Check my other listings for bundle deals.');
  return parts.join('\n');
}

function _buildAspects(item) {
  const aspects = {};
  if (item.category) aspects['Category'] = [item.category];
  if (item.condition) aspects['Condition'] = [item.condition];
  if (item.author) aspects['Author'] = [item.author];
  if (item.isbn) aspects['ISBN'] = [item.isbn];
  return aspects;
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
  const payload = _buildInventoryPayload(item);

  try {
    // PUT creates or updates the inventory item
    await ebayAPI('PUT', `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`, payload);

    // Store eBay reference on local item
    item.ebayItemId = sku;
    if (!item.platforms) item.platforms = [];
    if (!item.platforms.includes('eBay')) item.platforms.push('eBay');
    if (!item.platformStatus) item.platformStatus = {};
    item.platformStatus['eBay'] = 'draft'; // Not yet published — needs an offer

    setListingDate(itemId, 'eBay', new Date().toISOString().split('T')[0]);
    markDirty('inv', itemId);
    save();

    toast(`Pushed "${escHtml(item.name)}" to eBay inventory (SKU: ${sku})`);
    return { success: true, sku };
  } catch (e) {
    toast(`eBay push error: ${e.message}`, true);
    return { success: false, sku };
  }
}

/**
 * Create an offer and publish it to make an eBay listing live.
 * Requires the item to already be in eBay inventory (via pushItemToEBay).
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

  const offerPayload = {
    sku,
    marketplaceId: 'EBAY_US',
    format: 'FIXED_PRICE',
    listingDuration: options.listingDuration || 'GTC',
    pricingSummary: {
      price: {
        value: price.toFixed(2),
        currency: 'USD',
      },
    },
    availableQuantity: item.qty || 1,
  };

  // Add category if provided
  if (options.categoryId) {
    offerPayload.categoryId = options.categoryId;
  }

  try {
    // Create offer
    const offerResp = await ebayAPI('POST', `${INVENTORY_API}/offer`, offerPayload);
    const offerId = offerResp.offerId;

    if (!offerId) {
      // Might have listing policies issue — show helpful message
      const msg = offerResp.errors?.[0]?.message || 'Could not create offer. Check your eBay business policies.';
      throw new Error(msg);
    }

    // Publish offer (makes it live)
    const publishResp = await ebayAPI('POST', `${INVENTORY_API}/offer/${offerId}/publish`);
    const listingId = publishResp.listingId;

    // Update local item
    item.platformStatus['eBay'] = 'active';
    item.ebayListingId = listingId;
    item.url = listingId ? `https://www.ebay.com/itm/${listingId}` : item.url;
    setListingDate(itemId, 'eBay', new Date().toISOString().split('T')[0]);
    markDirty('inv', itemId);
    save();

    toast(`Listed on eBay! Item #${listingId}`);
    return { success: true, listingId };
  } catch (e) {
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
    setListingDate(itemId, 'eBay', new Date().toISOString().split('T')[0]);
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
