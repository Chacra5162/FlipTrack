/**
 * etsy-sync.js — Etsy Listing Sync Module
 * Handles: Pull active listings from Etsy, push new listings to Etsy,
 * deactivate/renew listings, and sync sold receipts.
 *
 * Uses the etsy-auth.js proxy for all API calls.
 * Etsy v3 API reference: https://developers.etsy.com/documentation/
 */

import { inv, save, refresh, markDirty, getInvItem } from '../data/store.js';
import { etsyAPI, isEtsyConnected, getEtsyShopId } from './etsy-auth.js';
import { markPlatformStatus, setListingDate } from './crosslist.js';
import { autoDlistOnSale } from './crosslist.js';
import { logSalePrice } from './price-history.js';
import { toast } from '../utils/dom.js';
import { getMeta, setMeta } from '../data/idb.js';
import { escHtml } from '../utils/format.js';

// ── CONSTANTS ──────────────────────────────────────────────────────────────

// Etsy listing states
const ETSY_STATE_ACTIVE = 'active';
const ETSY_STATE_INACTIVE = 'inactive';
const ETSY_STATE_DRAFT = 'draft';
const ETSY_STATE_EXPIRED = 'expired';
const ETSY_STATE_SOLD_OUT = 'sold_out';

// Etsy condition mapping (who_made, when_made, is_supply)
const CONDITION_DEFAULTS = {
  who_made: 'someone_else',    // resellers typically sell items made by others
  when_made: '2020_2025',
  is_supply: false,
};

// Etsy listing type for physical items
const LISTING_TYPE = 'physical';

// ── STATE ──────────────────────────────────────────────────────────────────
let _lastSyncTime = null;
let _syncing = false;
let _syncInterval = null;

// ── INITIALIZATION ─────────────────────────────────────────────────────────

export async function initEtsySync() {
  _lastSyncTime = await getMeta('etsy_last_sync');
}

/**
 * Start periodic Etsy sync (every 5 minutes).
 */
export function startEtsySyncInterval() {
  if (_syncInterval) clearInterval(_syncInterval);
  _syncInterval = setInterval(() => {
    if (isEtsyConnected() && !_syncing) {
      pullEtsyListings().catch(e => console.warn('Etsy sync error:', e.message));
    }
  }, 300000); // 5 minutes
}

export function stopEtsySyncInterval() {
  if (_syncInterval) { clearInterval(_syncInterval); _syncInterval = null; }
}

// ═══════════════════════════════════════════════════════════════════════════
// PULL: Fetch active listings from Etsy → update local inventory status
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pull all active Etsy listings and sync status to local inventory.
 * Matches by SKU (primary) or Etsy listing ID (secondary).
 * @returns {{ matched: number, unmatched: number, updated: number }}
 */
export async function pullEtsyListings() {
  if (!isEtsyConnected()) throw new Error('Etsy not connected');
  if (_syncing) throw new Error('Sync already in progress');
  _syncing = true;

  const shopId = getEtsyShopId();
  if (!shopId) { _syncing = false; throw new Error('No shop ID available. Please reconnect Etsy.'); }

  try {
    let matched = 0, unmatched = 0, updated = 0;
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const resp = await etsyAPI('GET',
        `/application/shops/${shopId}/listings?state=${ETSY_STATE_ACTIVE}&limit=${limit}&offset=${offset}&includes=Images`
      );

      const results = resp.results || [];
      if (results.length < limit) hasMore = false;

      for (const etsyListing of results) {
        const listingId = String(etsyListing.listing_id);
        const sku = (etsyListing.skus && etsyListing.skus[0]) || null;

        // Try to match by SKU first, then by stored Etsy listing ID
        let local = null;
        if (sku) {
          local = inv.find(i => i.sku && i.sku === sku);
        }
        if (!local) {
          local = inv.find(i => i.etsyListingId && i.etsyListingId === listingId);
        }

        if (local) {
          matched++;
          let changed = false;

          // Store Etsy listing ID reference
          if (!local.etsyListingId || local.etsyListingId !== listingId) {
            local.etsyListingId = listingId;
            changed = true;
          }

          // Update quantity
          if (etsyListing.quantity !== undefined) {
            const etsyQty = etsyListing.quantity || 0;
            if (etsyQty === 0 && local.platformStatus?.Etsy === 'active') {
              markPlatformStatus(local.id, 'Etsy', 'sold');
              changed = true;
            }
          }

          // Sync product details if local is missing them
          if (!local.name && etsyListing.title) { local.name = etsyListing.title; changed = true; }

          // Sync images if local has none
          if (etsyListing.images?.length && (!local.images || !local.images.length)) {
            local.images = etsyListing.images
              .sort((a, b) => a.rank - b.rank)
              .map(img => img.url_570xN || img.url_fullxfull)
              .filter(Boolean);
            if (local.images.length) local.image = local.images[0];
            changed = true;
          }

          // Sync price if local has none
          if (!local.price && etsyListing.price?.amount) {
            local.price = etsyListing.price.amount / etsyListing.price.divisor;
            changed = true;
          }

          // Sync tags as keywords
          if (etsyListing.tags?.length && !local.tags) {
            local.tags = etsyListing.tags;
            changed = true;
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

    // Also sync recently sold receipts
    await _syncEtsyReceipts(shopId);

    _lastSyncTime = new Date().toISOString();
    await setMeta('etsy_last_sync', _lastSyncTime);

    if (updated > 0) { save(); refresh(); }

    return { matched, unmatched, updated };
  } finally {
    _syncing = false;
  }
}

/**
 * Check recent Etsy receipts (orders) and mark items as sold locally.
 */
async function _syncEtsyReceipts(shopId) {
  try {
    // Get receipts from last 24 hours (or since last sync)
    const since = _lastSyncTime
      ? Math.floor(new Date(_lastSyncTime).getTime() / 1000)
      : Math.floor((Date.now() - 86400000) / 1000);

    const resp = await etsyAPI('GET',
      `/application/shops/${shopId}/receipts?min_created=${since}&limit=50`
    );

    const results = resp.results || [];
    for (const receipt of results) {
      const transactions = receipt.transactions || [];
      for (const txn of transactions) {
        const listingId = String(txn.listing_id);
        const sku = (txn.sku || '');

        const local = inv.find(i =>
          i.etsyListingId === listingId || (sku && i.sku === sku)
        );

        if (local && local.platformStatus?.Etsy !== 'sold') {
          markPlatformStatus(local.id, 'Etsy', 'sold');
          // Auto-delist on other platforms if qty=0
          if ((local.qty || 0) <= 0) {
            autoDlistOnSale(local.id, 'Etsy');
          }
          // Log sale price
          const price = txn.price?.amount
            ? txn.price.amount / txn.price.divisor
            : 0;
          if (price > 0) {
            logSalePrice(local.id, price, 'Etsy');
          }
          markDirty('inv', local.id);
        }
      }
    }
  } catch (e) {
    console.warn('Etsy receipts sync error:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUSH: Create a new listing on Etsy from local inventory item
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build Etsy listing payload from a local FlipTrack item.
 */
function _buildListingPayload(item) {
  const payload = {
    title: (item.name || 'Item').slice(0, 140), // Etsy max 140 chars
    description: _buildDescription(item),
    quantity: item.qty || 1,
    price: item.price || 0,
    who_made: CONDITION_DEFAULTS.who_made,
    when_made: CONDITION_DEFAULTS.when_made,
    is_supply: CONDITION_DEFAULTS.is_supply,
    type: LISTING_TYPE,
    shipping_profile_id: null, // Will need to be set from shop defaults
    taxonomy_id: null, // Category ID — Etsy requires this
  };

  // Add SKU if available
  if (item.sku) {
    payload.sku = item.sku;
  }

  // Add tags (Etsy supports up to 13 tags, max 20 chars each)
  if (item.tags?.length) {
    payload.tags = item.tags.slice(0, 13).map(t => t.slice(0, 20));
  } else {
    // Auto-generate tags from item name and category
    const autoTags = [];
    if (item.name) {
      const words = item.name.split(/\s+/).filter(w => w.length > 2).slice(0, 8);
      autoTags.push(...words.map(w => w.slice(0, 20)));
    }
    if (item.category) autoTags.push(item.category.slice(0, 20));
    if (item.subcategory) autoTags.push(item.subcategory.slice(0, 20));
    payload.tags = autoTags.slice(0, 13);
  }

  // Etsy-specific: Materials (optional)
  if (item.materials?.length) {
    payload.materials = item.materials.slice(0, 13).map(m => m.slice(0, 45));
  }

  return payload;
}

function _buildDescription(item) {
  const parts = [];
  if (item.condition) parts.push(`Condition: ${item.condition}`);
  if (item.category) parts.push(`Category: ${item.category}`);
  if (item.subcategory) parts.push(`Subcategory: ${item.subcategory}`);
  if (item.notes) parts.push(item.notes);
  parts.push('');
  parts.push('Ships fast! Check my shop for bundle deals and more items.');
  return parts.join('\n');
}

/**
 * Create a new listing on Etsy.
 * Note: Etsy requires taxonomy_id and shipping_profile_id which may need
 * to be selected by the user. This creates a draft if those aren't available.
 * @param {string} itemId - Local FlipTrack item ID
 * @param {Object} [options] - Additional listing options
 * @param {number} [options.taxonomyId] - Etsy taxonomy (category) ID
 * @param {number} [options.shippingProfileId] - Shipping profile ID
 * @returns {Promise<{ success: boolean, listingId?: string }>}
 */
export async function pushItemToEtsy(itemId, options = {}) {
  if (!isEtsyConnected()) throw new Error('Etsy not connected');

  const shopId = getEtsyShopId();
  if (!shopId) throw new Error('No shop ID. Please reconnect Etsy.');

  const item = getInvItem(itemId);
  if (!item) throw new Error('Item not found');

  const payload = _buildListingPayload(item);
  const price = item.price || 0;
  if (price <= 0) throw new Error('Item needs a price before listing');

  // Add required fields from options or defaults
  if (options.taxonomyId) payload.taxonomy_id = options.taxonomyId;
  if (options.shippingProfileId) payload.shipping_profile_id = options.shippingProfileId;

  // If missing required fields, create as draft
  const isDraft = !payload.taxonomy_id || !payload.shipping_profile_id;
  if (isDraft) {
    payload.state = ETSY_STATE_DRAFT;
  }

  try {
    const resp = await etsyAPI('POST',
      `/application/shops/${shopId}/listings`,
      payload
    );

    const listingId = String(resp.listing_id);

    // Store Etsy reference on local item
    item.etsyListingId = listingId;
    if (!item.platforms) item.platforms = [];
    if (!item.platforms.includes('Etsy')) item.platforms.push('Etsy');
    if (!item.platformStatus) item.platformStatus = {};
    item.platformStatus['Etsy'] = isDraft ? 'draft' : 'active';

    setListingDate(itemId, 'Etsy', new Date().toISOString().split('T')[0]);
    markDirty('inv', itemId);
    save();

    const statusLabel = isDraft ? 'draft (complete on Etsy)' : 'active';
    toast(`Listed "${escHtml(item.name)}" on Etsy as ${statusLabel}`);
    return { success: true, listingId, isDraft };
  } catch (e) {
    toast(`Etsy listing error: ${e.message}`, true);
    return { success: false };
  }
}

/**
 * Update an existing Etsy listing (price, quantity, title, etc.)
 * @param {string} itemId - Local FlipTrack item ID
 * @param {Object} updates - Fields to update
 */
export async function updateEtsyListing(itemId, updates = {}) {
  if (!isEtsyConnected()) throw new Error('Etsy not connected');

  const shopId = getEtsyShopId();
  const item = getInvItem(itemId);
  if (!item || !item.etsyListingId) throw new Error('Item not on Etsy');

  try {
    await etsyAPI('PATCH',
      `/application/shops/${shopId}/listings/${item.etsyListingId}`,
      updates
    );
    toast('Etsy listing updated');
    return { success: true };
  } catch (e) {
    toast(`Etsy update error: ${e.message}`, true);
    return { success: false };
  }
}

/**
 * Deactivate (end) an active Etsy listing.
 * @param {string} itemId - Local FlipTrack item ID
 */
export async function deactivateEtsyListing(itemId) {
  if (!isEtsyConnected()) throw new Error('Etsy not connected');

  const shopId = getEtsyShopId();
  const item = getInvItem(itemId);
  if (!item || !item.etsyListingId) throw new Error('Item not on Etsy');

  try {
    await etsyAPI('PATCH',
      `/application/shops/${shopId}/listings/${item.etsyListingId}`,
      { state: ETSY_STATE_INACTIVE }
    );

    markPlatformStatus(itemId, 'Etsy', 'delisted');
    markDirty('inv', itemId);
    save();

    toast('Etsy listing deactivated');
    return { success: true };
  } catch (e) {
    toast(`Etsy deactivate error: ${e.message}`, true);
    return { success: false };
  }
}

/**
 * Renew (relist) an expired or inactive Etsy listing.
 * Etsy charges $0.20 per renewal.
 */
export async function renewEtsyListing(itemId) {
  if (!isEtsyConnected()) throw new Error('Etsy not connected');

  const shopId = getEtsyShopId();
  const item = getInvItem(itemId);
  if (!item || !item.etsyListingId) {
    // If no Etsy listing ID, push as new
    return pushItemToEtsy(itemId);
  }

  try {
    // Reactivate by setting state back to active
    await etsyAPI('PATCH',
      `/application/shops/${shopId}/listings/${item.etsyListingId}`,
      { state: ETSY_STATE_ACTIVE, quantity: item.qty || 1 }
    );

    markPlatformStatus(itemId, 'Etsy', 'active');
    setListingDate(itemId, 'Etsy', new Date().toISOString().split('T')[0]);
    markDirty('inv', itemId);
    save();

    toast('Etsy listing renewed ($0.20 fee)');
    return { success: true };
  } catch (e) {
    toast(`Etsy renew error: ${e.message}`, true);
    return { success: false };
  }
}

/**
 * Get available shipping profiles for the shop.
 * Needed for creating new listings.
 */
export async function getEtsyShippingProfiles() {
  if (!isEtsyConnected()) throw new Error('Etsy not connected');
  const shopId = getEtsyShopId();
  if (!shopId) throw new Error('No shop ID');

  try {
    const resp = await etsyAPI('GET',
      `/application/shops/${shopId}/shipping-profiles`
    );
    return resp.results || [];
  } catch (e) {
    console.warn('Etsy shipping profiles error:', e.message);
    return [];
  }
}

/**
 * Get Etsy taxonomy (category) tree for listing.
 * Used to find the right taxonomy_id for a listing.
 */
export async function getEtsyTaxonomies() {
  if (!isEtsyConnected()) throw new Error('Etsy not connected');
  try {
    const resp = await etsyAPI('GET', '/application/seller-taxonomy/nodes');
    return resp.results || [];
  } catch (e) {
    console.warn('Etsy taxonomies error:', e.message);
    return [];
  }
}

// ── GETTERS ────────────────────────────────────────────────────────────────

export function isEtsySyncing() { return _syncing; }
export function getLastEtsySyncTime() { return _lastSyncTime; }
