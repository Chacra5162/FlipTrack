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

  // conditionDescription not allowed for NEW condition items
  if (!isNew && item.notes) {
    payload.conditionDescription = String(item.notes).slice(0, 1000);
  }

  // Only add aspects if we have meaningful ones (empty object causes 400)
  const aspects = _buildAspects(item);
  if (Object.keys(aspects).length > 0) {
    payload.product.aspects = aspects;
  }

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
  // Note: 'Condition' is NOT a valid eBay aspect — it's set via the condition field
  if (item.brand) aspects['Brand'] = [item.brand];
  if (item.author) aspects['Author'] = [item.author];
  if (item.color) aspects['Color'] = [item.color];
  if (item.size) aspects['Size'] = [item.size];
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
  console.log('[eBay] Inventory payload:', JSON.stringify(payload, null, 2));

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
 * Fetch (or create) the seller's merchant inventory location key.
 * eBay requires this on every offer — it identifies where inventory is stored.
 * @returns {Promise<string|null>} merchantLocationKey
 */
async function _fetchMerchantLocation() {
  if (_locationKeyCache) return _locationKeyCache;
  try {
    const resp = await ebayAPI('GET', `${INVENTORY_API}/location?limit=5`);
    const locations = resp?.locations || [];
    if (locations.length > 0) {
      _locationKeyCache = locations[0].merchantLocationKey;
      return _locationKeyCache;
    }

    // No location exists — create a default one
    const defaultKey = 'default';
    await ebayAPI('PUT', `${INVENTORY_API}/location/${defaultKey}`, {
      location: {
        address: {
          city: 'Not Specified',
          stateOrProvince: 'Not Specified',
          postalCode: '00000',
          country: 'US',
        },
      },
      locationTypes: ['WAREHOUSE'],
      name: 'Default Location',
      merchantLocationStatus: 'ENABLED',
    });
    _locationKeyCache = defaultKey;
    return _locationKeyCache;
  } catch (e) {
    console.warn('[eBay] Could not fetch/create merchant location:', e.message);
    return null;
  }
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

  // Auto-detect category if not provided
  let categoryId = options.categoryId || null;
  if (!categoryId) {
    categoryId = await _suggestCategory(item.name || 'item');
  }
  if (!categoryId) {
    throw new Error('Could not determine eBay category. Please set a category for this item.');
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

  // Merchant location is required for every offer
  const merchantLocationKey = await _fetchMerchantLocation();
  if (!merchantLocationKey) {
    throw new Error('eBay requires an inventory location. Go to eBay Seller Hub → Shipping → Locations and add one.');
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
        console.log('[eBay] Found existing offer:', offerId);
      }
    } catch (_) { /* no existing offers */ }

    // Create offer if none exists
    if (!offerId) {
      console.log('[eBay] Creating offer:', JSON.stringify(offerPayload));
      const offerResp = await ebayAPI('POST', `${INVENTORY_API}/offer`, offerPayload);
      offerId = offerResp.offerId;

      if (!offerId) {
        const ebayMsg = offerResp.errors?.[0]?.longMessage || offerResp.errors?.[0]?.message || '';
        throw new Error(ebayMsg || 'Could not create offer. Set up business policies in eBay Seller Hub first.');
      }
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
