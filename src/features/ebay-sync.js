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

    const filter = `creationdate:{${since}..}`;
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

  // Add UPC if available
  if (item.upc) {
    payload.product.upc = [item.upc];
  }

  // Add ISBN for books
  if (item.isbn) {
    payload.product.isbn = [item.isbn];
  }

  // Add MPN if available
  if (item.mpn) {
    payload.product.mpn = item.mpn;
  }

  return payload;
}

function _buildDescription(item) {
  // If user wrote a custom eBay description, use it as-is
  if (item.ebayDesc) return item.ebayDesc;

  // Auto-generate a professional HTML listing description
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const title = esc(item.name || 'Item');
  const brandLine = (item.brand && item.brand !== 'Unbranded') ? esc(item.brand) + ' ' : '';

  // Build specification rows
  const specs = [];
  const addSpec = (label, val) => { if (val) specs.push({ label, val: esc(val) }); };
  addSpec('Brand', item.brand && item.brand !== 'Unbranded' ? item.brand : null);
  addSpec('Model', item.model);
  addSpec('MPN', item.mpn);
  addSpec('UPC', item.upc);
  addSpec('Color', item.color);
  addSpec('Size', item.size);
  addSpec('Material', item.material);
  addSpec('Style', item.style);
  addSpec('Pattern', item.pattern);
  addSpec('Condition', item.condition);
  addSpec('Category', item.subcategory);
  // Book-specific
  addSpec('Author', item.author);
  addSpec('Publisher', item.publisher);
  addSpec('Edition', item.edition);
  addSpec('Year Published', item.pubYear);
  addSpec('Cover Type', item.coverType);
  addSpec('ISBN', item.isbn);

  // Build specs table HTML
  let specsHtml = '';
  if (specs.length > 0) {
    const rows = specs.map((s, i) =>
      `<tr style="background:${i % 2 === 0 ? '#f8f9fa' : '#ffffff'}"><td style="padding:8px 12px;border-bottom:1px solid #e9ecef;color:#555;font-weight:600;width:140px">${s.label}</td><td style="padding:8px 12px;border-bottom:1px solid #e9ecef;color:#222">${s.val}</td></tr>`
    ).join('');
    specsHtml = `
    <div style="margin:20px 0">
      <div style="background:#2d2d2d;color:#fff;padding:10px 15px;font-size:15px;font-weight:600;border-radius:6px 6px 0 0">Item Specifications</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e9ecef;border-top:none;border-radius:0 0 6px 6px;overflow:hidden">${rows}</table>
    </div>`;
  }

  // Condition detail section
  let conditionHtml = '';
  if (item.notes) {
    conditionHtml = `
    <div style="margin:20px 0;padding:15px;background:#fff3cd;border-left:4px solid #ffc107;border-radius:4px">
      <div style="font-weight:600;color:#856404;margin-bottom:6px">Condition Notes</div>
      <div style="color:#664d03;line-height:1.5">${esc(item.notes)}</div>
    </div>`;
  }

  return `
<div style="max-width:800px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;line-height:1.6">
  <div style="text-align:center;padding:20px 0;border-bottom:2px solid #2d2d2d;margin-bottom:20px">
    <h1 style="margin:0 0 6px;font-size:22px;color:#111">${brandLine}${title}</h1>
    ${item.condition ? `<div style="display:inline-block;padding:4px 14px;background:#28a745;color:#fff;border-radius:20px;font-size:13px;font-weight:600">${esc(item.condition)}</div>` : ''}
  </div>
  ${specsHtml}
  ${conditionHtml}
  <div style="margin:24px 0;padding:18px;background:#f0f7ff;border-radius:8px;text-align:center">
    <div style="font-size:15px;font-weight:600;color:#0056b3;margin-bottom:4px">Fast Shipping &amp; Great Service</div>
    <div style="color:#555;font-size:13px">Ships within 1 business day. Check out my other listings for bundle deals!</div>
  </div>
  <div style="text-align:center;padding:12px 0;color:#999;font-size:11px;border-top:1px solid #eee">Listed with FlipTrack</div>
</div>`;
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
  if (item.mpn) aspects['MPN'] = [item.mpn];
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

  // Re-push inventory item to ensure latest aspects (Brand etc.) are on eBay
  try {
    // First try full payload rebuild
    const invPayload = _buildInventoryPayload(item);
    console.log('[eBay] Re-pushing inventory item with latest aspects…');
    await ebayAPI('PUT', `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`, invPayload);
    console.log('[eBay] Inventory re-push succeeded');
  } catch (invErr) {
    console.warn('[eBay] Full re-push failed:', invErr.message, '— trying aspect-only patch');
    // If full payload fails (e.g. no valid image URLs), fetch existing item from eBay
    // and just update the aspects (Brand etc.) on it
    try {
      const existing = await ebayAPI('GET', `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`);
      const aspects = _buildAspects(item);
      if (!existing.product) existing.product = {};
      existing.product.aspects = { ...(existing.product.aspects || {}), ...aspects };
      console.log('[eBay] Patching aspects on existing inventory item:', JSON.stringify(aspects));
      await ebayAPI('PUT', `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`, existing);
      console.log('[eBay] Aspect patch succeeded');
    } catch (patchErr) {
      console.warn('[eBay] Aspect patch also failed:', patchErr.message);
    }
  }

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

    // Publish offer (makes it live)
    console.log('[eBay] Publishing offer:', offerId);
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
    console.error('[eBay] PUBLISH ERROR DETAIL:', e.message);
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
