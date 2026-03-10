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
import { addNotification } from './notification-center.js';
import { sfx } from '../utils/sfx.js';

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
          // Decrement quantity by sold amount
          const soldQty = parseInt(txn.quantity, 10) || 1;
          local.qty = Math.max(0, (local.qty || 1) - soldQty);

          markPlatformStatus(local.id, 'Etsy', 'sold');
          // Auto-delist on other platforms if fully sold out
          if (local.qty <= 0) {
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

          // 🎉 Notify user of the sale
          const label = local.name || local.sku || 'Item';
          const priceStr = price > 0 ? ` for $${price.toFixed(2)}` : '';
          toast(`🎉 Etsy Sale! ${label}${priceStr}`);
          addNotification('sale', 'Etsy Sale', `${label} sold${priceStr}`, local.id);
          try { sfx.sale(); } catch (_) {}
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
  // Notes are private — never include in public listings
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
    // Remove "Unlisted" tag now that item is on a real platform
    const uIdx = item.platforms.indexOf('Unlisted');
    if (uIdx !== -1) item.platforms.splice(uIdx, 1);
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

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 1: Inventory Quantity Sync (bi-directional)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Push local item quantity to Etsy.
 */
export async function pushEtsyQuantity(itemId) {
  if (!isEtsyConnected()) throw new Error('Etsy not connected');
  const item = getInvItem(itemId);
  if (!item || !item.etsyListingId) throw new Error('Item not on Etsy');
  try {
    await updateEtsyListing(itemId, { quantity: Math.max(0, item.qty || 0) });
    toast(`Qty synced to Etsy: ${item.qty || 0}`);
    return { success: true };
  } catch (e) {
    toast(`Qty sync error: ${e.message}`, true);
    return { success: false };
  }
}

/**
 * Pull quantities from Etsy and update local items where they differ.
 */
export async function pullEtsyQuantities() {
  if (!isEtsyConnected()) throw new Error('Etsy not connected');
  const shopId = getEtsyShopId();
  if (!shopId) throw new Error('No shop ID');
  let pulled = 0;
  let offset = 0;
  const limit = 100;
  let hasMore = true;
  while (hasMore) {
    const resp = await etsyAPI('GET',
      `/application/shops/${shopId}/listings?state=${ETSY_STATE_ACTIVE}&limit=${limit}&offset=${offset}`
    );
    const results = resp.results || [];
    if (results.length < limit) hasMore = false;
    for (const el of results) {
      const lid = String(el.listing_id);
      const sku = (el.skus && el.skus[0]) || null;
      let local = sku ? inv.find(i => i.sku && i.sku === sku) : null;
      if (!local) local = inv.find(i => i.etsyListingId && i.etsyListingId === lid);
      if (local && el.quantity !== undefined) {
        const etsyQty = el.quantity || 0;
        if (etsyQty !== (local.qty || 0)) {
          local.qty = etsyQty;
          markDirty('inv', local.id);
          pulled++;
        }
      }
    }
    offset += limit;
  }
  if (pulled > 0) { save(); refresh(); }
  return { pulled };
}

/**
 * Bi-directional quantity sync: pull first, then push local-only changes.
 */
export async function syncAllEtsyQuantities() {
  const pullResult = await pullEtsyQuantities();
  // Push local quantities for items that have Etsy listings
  const etsyItems = inv.filter(i => i.etsyListingId && (i.qty || 0) > 0);
  let pushed = 0;
  for (const item of etsyItems) {
    try {
      await updateEtsyListing(item.id, { quantity: item.qty || 0 });
      pushed++;
    } catch (_) { /* skip failures */ }
  }
  return { pulled: pullResult.pulled, pushed };
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 2: Photo Sync (push photos to Etsy)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Push item photos to an Etsy listing.
 * Sends image URLs to edge function which downloads + uploads to Etsy as multipart.
 */
export async function pushEtsyPhotos(itemId) {
  if (!isEtsyConnected()) throw new Error('Etsy not connected');
  const shopId = getEtsyShopId();
  const item = getInvItem(itemId);
  if (!item || !item.etsyListingId) throw new Error('Item not on Etsy');

  const images = item.images || (item.image ? [item.image] : []);
  if (!images.length) throw new Error('No photos to upload');

  let uploaded = 0;
  for (const imgUrl of images) {
    try {
      await etsyAPI('POST', `/application/shops/${shopId}/listings/${item.etsyListingId}/images`, {
        image_url: imgUrl
      });
      uploaded++;
    } catch (e) {
      console.warn('Etsy photo upload error:', e.message);
    }
  }
  if (uploaded > 0) toast(`${uploaded} photo${uploaded > 1 ? 's' : ''} pushed to Etsy`);
  else toast('No photos could be uploaded', true);
  return { uploaded };
}

/**
 * Delete a specific photo from an Etsy listing.
 */
export async function deleteEtsyPhoto(itemId, imageId) {
  if (!isEtsyConnected()) throw new Error('Etsy not connected');
  const shopId = getEtsyShopId();
  const item = getInvItem(itemId);
  if (!item || !item.etsyListingId) throw new Error('Item not on Etsy');
  await etsyAPI('DELETE', `/application/shops/${shopId}/listings/${item.etsyListingId}/images/${imageId}`);
  toast('Photo removed from Etsy');
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 3: Shop Stats & Analytics
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch shop-level statistics from Etsy.
 */
export async function fetchEtsyShopStats() {
  if (!isEtsyConnected()) throw new Error('Etsy not connected');
  const shopId = getEtsyShopId();
  if (!shopId) throw new Error('No shop ID');
  try {
    const resp = await etsyAPI('GET', `/application/shops/${shopId}`);
    return {
      numFavorers: resp.num_favorers || 0,
      totalSold: resp.transaction_sold_count || 0,
      activeListings: resp.listing_active_count || 0,
      digitalListings: resp.digital_listing_count || 0,
      reviewCount: resp.review_count || 0,
      reviewAvg: resp.review_average || 0,
      shopCreated: resp.create_date || null,
      shopName: resp.shop_name || '',
      currencyCode: resp.currency_code || 'USD',
    };
  } catch (e) {
    console.warn('Etsy shop stats error:', e.message);
    return null;
  }
}

/**
 * Fetch listing-level stats (views, favorites) for all active listings.
 */
export async function fetchEtsyListingStats() {
  if (!isEtsyConnected()) throw new Error('Etsy not connected');
  const shopId = getEtsyShopId();
  if (!shopId) throw new Error('No shop ID');

  const listings = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;
  while (hasMore) {
    const resp = await etsyAPI('GET',
      `/application/shops/${shopId}/listings?state=${ETSY_STATE_ACTIVE}&limit=${limit}&offset=${offset}&includes=Images`
    );
    const results = resp.results || [];
    if (results.length < limit) hasMore = false;
    for (const el of results) {
      listings.push({
        listingId: el.listing_id,
        title: el.title,
        views: el.views || 0,
        numFavorers: el.num_favorers || 0,
        quantity: el.quantity || 0,
        price: el.price ? el.price.amount / el.price.divisor : 0,
        created: el.created_timestamp,
        image: el.images?.[0]?.url_75x75 || '',
      });
    }
    offset += limit;
  }
  return listings;
}

/**
 * Build an analytics summary from local receipt/sale data.
 */
export function getEtsyAnalyticsSummary() {
  const etsySales = (typeof window !== 'undefined' && window.sales || [])
    .filter(s => (s.platform || '').toLowerCase() === 'etsy');
  const totalRevenue = etsySales.reduce((sum, s) => sum + (s.price || 0), 0);
  const avgPrice = etsySales.length ? totalRevenue / etsySales.length : 0;

  // Best sellers: count by item name
  const nameCounts = {};
  etsySales.forEach(s => {
    const n = s.name || 'Unknown';
    nameCounts[n] = (nameCounts[n] || 0) + 1;
  });
  const topItems = Object.entries(nameCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Monthly revenue
  const monthly = {};
  etsySales.forEach(s => {
    const d = new Date(s.date || s.soldDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthly[key] = (monthly[key] || 0) + (s.price || 0);
  });

  return {
    totalRevenue,
    avgPrice,
    totalSales: etsySales.length,
    topItems,
    monthlyRevenue: monthly
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 4: Review / Feedback Tracking
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch shop reviews from Etsy.
 */
export async function fetchEtsyReviews() {
  if (!isEtsyConnected()) throw new Error('Etsy not connected');
  const shopId = getEtsyShopId();
  if (!shopId) throw new Error('No shop ID');
  try {
    const resp = await etsyAPI('GET', `/application/shops/${shopId}/reviews?limit=25`);
    const reviews = (resp.results || []).map(r => ({
      id: r.review_id,
      rating: r.rating || 0,
      message: r.review || '',
      createdAt: r.created_timestamp ? new Date(r.created_timestamp * 1000).toISOString() : null,
      buyerName: r.buyer_user_id ? `Buyer #${r.buyer_user_id}` : 'Anonymous',
      listingId: r.listing_id || null,
      transactionId: r.transaction_id || null,
    }));
    // Store last check time
    await setMeta('etsyLastReviewCheck', Date.now());
    return reviews;
  } catch (e) {
    console.warn('Etsy reviews error:', e.message);
    return [];
  }
}

/**
 * Compute review summary stats.
 */
export function getEtsyReviewSummary(reviews) {
  if (!reviews || !reviews.length) return { avg: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let total = 0;
  reviews.forEach(r => {
    const rating = Math.min(5, Math.max(1, Math.round(r.rating)));
    dist[rating]++;
    total += r.rating;
  });
  return {
    avg: total / reviews.length,
    count: reviews.length,
    distribution: dist,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 5: Shipping Label / Tracking Sync
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Push tracking info to an Etsy receipt.
 */
export async function pushEtsyTracking(receiptId, trackingCode, carrier) {
  if (!isEtsyConnected()) throw new Error('Etsy not connected');
  const shopId = getEtsyShopId();
  if (!shopId) throw new Error('No shop ID');
  try {
    await etsyAPI('POST', `/application/shops/${shopId}/receipts/${receiptId}/tracking`, {
      tracking_code: trackingCode,
      carrier_name: carrier,
    });
    toast('Tracking info sent to Etsy');
    return { success: true };
  } catch (e) {
    toast(`Tracking error: ${e.message}`, true);
    return { success: false };
  }
}

/**
 * Fetch pending (unshipped) Etsy receipts.
 */
export async function fetchEtsyReceiptsPending() {
  if (!isEtsyConnected()) throw new Error('Etsy not connected');
  const shopId = getEtsyShopId();
  if (!shopId) throw new Error('No shop ID');
  try {
    const resp = await etsyAPI('GET',
      `/application/shops/${shopId}/receipts?was_shipped=false&limit=50`
    );
    return (resp.results || []).map(r => ({
      receiptId: r.receipt_id,
      buyerName: r.name || 'Unknown',
      buyerEmail: r.buyer_email || '',
      totalPrice: r.grandtotal?.amount ? r.grandtotal.amount / r.grandtotal.divisor : 0,
      createdAt: r.create_timestamp ? new Date(r.create_timestamp * 1000).toISOString() : null,
      items: (r.transactions || []).map(t => ({
        title: t.title || '',
        quantity: t.quantity || 1,
        price: t.price?.amount ? t.price.amount / t.price.divisor : 0,
        listingId: t.listing_id,
      })),
      shippingAddress: r.formatted_address || '',
    }));
  } catch (e) {
    console.warn('Etsy pending receipts error:', e.message);
    return [];
  }
}

/**
 * Standard Etsy-supported carriers.
 */
export function getEtsyCarriers() {
  return [
    'usps', 'ups', 'fedex', 'dhl', 'other',
    'canada-post', 'royal-mail', 'australia-post',
    'ups-mi', 'fedex-smartpost',
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 6: Price Sync (push price changes to Etsy)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Push local price to Etsy listing.
 */
export async function pushEtsyPrice(itemId) {
  if (!isEtsyConnected()) return { success: false };
  const item = getInvItem(itemId);
  if (!item || !item.etsyListingId || !item.price) return { success: false };
  try {
    await updateEtsyListing(itemId, { price: item.price });
    return { success: true };
  } catch (e) {
    console.warn('Etsy price sync error:', e.message);
    return { success: false };
  }
}

/**
 * Batch price push for multiple items.
 */
export async function pushEtsyPriceBulk(itemIds) {
  let pushed = 0;
  for (const id of itemIds) {
    const r = await pushEtsyPrice(id);
    if (r.success) pushed++;
  }
  if (pushed > 0) toast(`${pushed} price${pushed > 1 ? 's' : ''} synced to Etsy`);
  return { pushed };
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 7: Tag Optimization
// ═══════════════════════════════════════════════════════════════════════════

// Common stop words to exclude from tag suggestions
const TAG_STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'are', 'was', 'has',
  'have', 'been', 'not', 'but', 'all', 'can', 'had', 'her', 'his', 'its',
  'new', 'our', 'one', 'two', 'you', 'very', 'will', 'size', 'item',
]);

/**
 * Get current tags for an Etsy-linked item from local data.
 */
export function fetchEtsyListingTags(itemId) {
  const item = getInvItem(itemId);
  if (!item) return [];
  return item.tags || [];
}

/**
 * Suggest optimized tags for a listing based on title, category, condition.
 */
export function suggestEtsyTags(itemId) {
  const item = getInvItem(itemId);
  if (!item) return [];

  const suggestions = new Set();

  // Extract words from title
  if (item.name) {
    item.name.split(/[\s\-_,]+/)
      .filter(w => w.length > 2 && !TAG_STOP_WORDS.has(w.toLowerCase()))
      .forEach(w => suggestions.add(w.toLowerCase().slice(0, 20)));
  }

  // Add category-based tags
  if (item.category) suggestions.add(item.category.toLowerCase().slice(0, 20));
  if (item.subcategory) suggestions.add(item.subcategory.toLowerCase().slice(0, 20));
  if (item.subtype) suggestions.add(item.subtype.toLowerCase().slice(0, 20));

  // Add condition as a tag
  if (item.condition) {
    const cond = item.condition.toLowerCase();
    if (cond.includes('vintage')) suggestions.add('vintage');
    if (cond.includes('new')) suggestions.add('new');
    if (cond.includes('nwt')) { suggestions.add('nwt'); suggestions.add('new with tags'); }
  }

  // Add common reseller tags based on category
  const cat = (item.category || '').toLowerCase();
  if (cat.includes('clothing') || cat.includes('shirt') || cat.includes('dress')) {
    suggestions.add('fashion');
  }
  if (cat.includes('shoe')) {
    suggestions.add('footwear');
  }
  if (cat.includes('toy') || cat.includes('game')) {
    suggestions.add('collectible');
  }

  // Remove existing tags from suggestions
  const existing = new Set((item.tags || []).map(t => t.toLowerCase()));
  return Array.from(suggestions)
    .filter(t => !existing.has(t) && t.length >= 2)
    .slice(0, 13);
}

/**
 * Push tags to Etsy listing.
 */
export async function pushEtsyTags(itemId, tags) {
  if (!isEtsyConnected()) throw new Error('Etsy not connected');
  const item = getInvItem(itemId);
  if (!item || !item.etsyListingId) throw new Error('Item not on Etsy');
  const validTags = tags.slice(0, 13).map(t => t.slice(0, 20));
  // Update local
  item.tags = validTags;
  markDirty('inv', item.id);
  save();
  // Push to Etsy
  await updateEtsyListing(itemId, { tags: validTags });
  toast(`${validTags.length} tags saved to Etsy`);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 8: Receipt-Based Auto-Expense Tracking
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate Etsy fees for a receipt transaction.
 * @param {number} salePrice - The item sale price
 * @param {number} [shippingCost=0] - Shipping charged to buyer
 * @returns {Object} Fee breakdown
 */
export function calcEtsyFees(salePrice, shippingCost = 0) {
  const listingFee = 0.20;                          // $0.20 per listing
  const transactionFee = salePrice * 0.065;          // 6.5% of sale price
  const processingFee = (salePrice + shippingCost) * 0.03 + 0.25; // 3% + $0.25
  const shippingTransactionFee = shippingCost * 0.065; // 6.5% of shipping too
  const totalFees = listingFee + transactionFee + processingFee + shippingTransactionFee;
  return {
    listingFee,
    transactionFee: +transactionFee.toFixed(2),
    processingFee: +processingFee.toFixed(2),
    shippingTransactionFee: +shippingTransactionFee.toFixed(2),
    totalFees: +totalFees.toFixed(2),
  };
}

/**
 * Sync Etsy expenses from recent receipts.
 * Calculates and stores fee breakdowns for new receipts since last sync.
 */
export async function syncEtsyExpenses() {
  if (!isEtsyConnected()) return { synced: 0 };
  const shopId = getEtsyShopId();
  if (!shopId) return { synced: 0 };

  const lastSync = await getMeta('etsyLastExpenseSync') || 0;
  const since = lastSync
    ? Math.floor(lastSync / 1000)
    : Math.floor((Date.now() - 7 * 86400000) / 1000); // Last 7 days default

  try {
    const resp = await etsyAPI('GET',
      `/application/shops/${shopId}/receipts?min_created=${since}&limit=50`
    );
    const receipts = resp.results || [];
    let synced = 0;

    for (const receipt of receipts) {
      const transactions = receipt.transactions || [];
      for (const txn of transactions) {
        const price = txn.price?.amount ? txn.price.amount / txn.price.divisor : 0;
        const shipping = txn.shipping_cost?.amount ? txn.shipping_cost.amount / txn.shipping_cost.divisor : 0;
        if (price > 0) {
          const fees = calcEtsyFees(price, shipping);
          // Store fee data on the local item if matched
          const listingId = String(txn.listing_id);
          const local = inv.find(i => i.etsyListingId === listingId);
          if (local) {
            if (!local.etsyFees) local.etsyFees = {};
            local.etsyFees[receipt.receipt_id] = {
              ...fees,
              salePrice: price,
              shippingCost: shipping,
              date: receipt.create_timestamp ? new Date(receipt.create_timestamp * 1000).toISOString() : new Date().toISOString(),
            };
            markDirty('inv', local.id);
            synced++;
          }
        }
      }
    }

    await setMeta('etsyLastExpenseSync', Date.now());
    if (synced > 0) save();
    return { synced };
  } catch (e) {
    console.warn('Etsy expense sync error:', e.message);
    return { synced: 0 };
  }
}
