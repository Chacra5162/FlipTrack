/**
 * ebay-listing.js — eBay Listing Push/Publish Module
 * Handles: Creating inventory items, publishing offers, updating listings,
 * ending listings, relisting, and all related helper functions.
 *
 * Split from ebay-sync.js for bundle size management.
 */

import { inv, save, markDirty, getInvItem } from '../data/store.js';
import { ebayAPI, isEBayConnected } from './ebay-auth.js';
import { markPlatformStatus, setListingDate } from './crosslist.js';
import { logItemEvent } from './price-history.js';
import { toast } from '../utils/dom.js';
import { escHtml, localDate, uid } from '../utils/format.js';
import { generateListing } from './ai-listing.js';

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const INVENTORY_API = '/sell/inventory/v1';
const ACCOUNT_API = '/sell/account/v1';

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

// ── STATE ──────────────────────────────────────────────────────────────────
let _policiesCache = null;
let _locationKeyCache = null;
let _aspectsCache = {};

/** Validate GTIN (UPC-12 / EAN-13) check digit */
function _validGTIN(code) {
  const digits = code.split('').map(Number);
  const check = digits.pop();
  const sum = digits.reduce((s, d, i) => s + d * ((digits.length - i) % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

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

  // Add UPC if available and valid (12 or 13 digits with valid check digit)
  if (item.upc) {
    const upcClean = item.upc.replace(/[^0-9]/g, '');
    if ((upcClean.length === 12 || upcClean.length === 13) && _validGTIN(upcClean)) {
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
// Classify an error as "transient" (eBay/edge wobble) vs "permanent" (bad
// payload, auth, etc). eBay explicitly recommends retrying errorId 25001
// "A system error has occurred." with backoff — and edge-function timeouts
// ("Request timed out — try again") are the same story.
function _isTransientEBayError(e) {
  const m = (e?.message || '').toLowerCase();
  if (m.includes('500') || m.includes('502') || m.includes('503') || m.includes('504')) return true;
  if (m.includes('a system error has occurred')) return true;
  if (m.includes('internal server error')) return true;
  if (m.includes('try again')) return true;
  if (m.includes('timed out') || m.includes('timeout')) return true;
  return false;
}

const _sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Wrap any ebayAPI call in retry-with-backoff for transient failures.
 * Up to 3 attempts: 1s, 2s, 4s. Permanent errors throw on first try.
 */
async function _ebayApiWithRetry(method, path, body = null) {
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await ebayAPI(method, path, body);
    } catch (e) {
      lastErr = e;
      if (!_isTransientEBayError(e) || attempt === 2) throw e;
      const waitMs = 1000 * Math.pow(2, attempt);
      console.warn(`[eBay] Transient ${method} ${path} failure (${e.message}) — retrying in ${waitMs}ms`);
      await _sleep(waitMs);
    }
  }
  throw lastErr || new Error('eBay API call failed');
}

async function _putInventoryWithRetry(sku, payload, item) {
  const path = `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`;
  const isTransient = _isTransientEBayError;
  const sleep = _sleep;

  // Up to 3 attempts for transient failures: 1s, 2s, 4s.
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await ebayAPI('PUT', path, payload);
      return;
    } catch (e) {
      lastErr = e;
      const missing = _parseMissingAspects(e.message || '');
      if (missing.length > 0) {
        // Same missing-aspects auto-patch flow as before — handled once,
        // then we loop for another shot at the PUT.
        console.log('[eBay] Missing aspects detected:', missing.join(', '), '— auto-filling and retrying');
        if (!payload.product) payload.product = {};
        if (!payload.product.aspects) payload.product.aspects = {};
        for (const name of missing) {
          if (payload.product.aspects[name]) continue;
          const defaultFn = _ASPECT_DEFAULTS[name.toLowerCase()];
          payload.product.aspects[name] = [defaultFn ? String(defaultFn(item)) : 'N/A'];
        }
        continue; // retry immediately, don't wait
      }
      if (!isTransient(e) || attempt === 2) throw e;
      const waitMs = 1000 * Math.pow(2, attempt);
      console.warn(`[eBay] Transient PUT failure (${e.message}) — retrying in ${waitMs}ms`);
      await sleep(waitMs);
    }
  }
  throw lastErr || new Error('eBay inventory update failed');
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
  // eBay SKUs must be alphanumeric only, max 50 chars
  const rawSku = item.ebayItemId || item.sku || `FT${itemId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`;
  const sku = rawSku.replace(/[^a-zA-Z0-9]/g, '').slice(0, 50) || `FT${itemId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`;

  // Generate AI description if user left it blank
  await _ensureDescription(item);
  const payload = _buildInventoryPayload(item);

  // Auto-detect category, validate condition, and fill required aspects
  try {
    let catId = await _suggestCategory(item.name || 'item');
    if (!catId && item.category) catId = await _suggestCategory(`${item.name || ''} ${item.category}`.trim());
    if (!catId && item.category) catId = await _suggestCategory(item.category);
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
    // IMPORTANT: Do NOT overwrite item.sku — it's the user-facing identifier and
    // should keep its original formatting (dashes, etc). Only ebayItemId gets stripped.
    item.ebayItemId = sku;
    // Backfill item.sku only if the user never set one, using the stripped value
    if (!item.sku) item.sku = sku;
    if (!item.platforms) item.platforms = [];
    if (!item.platforms.includes('eBay')) item.platforms.push('eBay');
    // Remove "Unlisted" tag now that item is on a real platform
    const uIdx = item.platforms.indexOf('Unlisted');
    if (uIdx !== -1) item.platforms.splice(uIdx, 1);
    if (!item.platformStatus) item.platformStatus = {};
    item.platformStatus['eBay'] = 'draft'; // Not yet published — needs an offer

    markDirty('inv', itemId);
    save();

    logItemEvent(itemId, 'ebay-push', `Pushed to eBay inventory (SKU: ${sku})`);
    toast(`Pushed "${escHtml(item.name)}" to eBay inventory (SKU: ${sku})`);
    return { success: true, sku };
  } catch (e) {
    toast(`eBay push error: ${e.message}`, true);
    logItemEvent(itemId, 'ebay-error', `eBay push failed: ${e.message}`);
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
    let catId = await _suggestCategory(item.name || 'item');
    if (!catId && item.category) catId = await _suggestCategory(`${item.name || ''} ${item.category}`.trim());
    if (!catId && item.category) catId = await _suggestCategory(item.category);
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

  // 2. Find the existing offer, update price + qty, and re-publish.
  // If there is no offer (eBay 404 / errorId 25713 "This Offer is not
  // available.", or an empty offers array), we can't "update" price/qty
  // against something that doesn't exist — fall through and publish a
  // fresh offer so the user's change actually reaches eBay.
  try {
    let existing = null;
    try {
      existing = await ebayAPI('GET', `${INVENTORY_API}/offer?sku=${encodeURIComponent(sku)}`);
    } catch (getErr) {
      const m = (getErr.message || '').toLowerCase();
      const offerMissing = m.includes('not available') || m.includes('25713') || m.includes('404');
      if (!offerMissing) throw getErr;
      console.warn('[eBay] No offer exists for', sku, '— auto-publishing to create one');
      existing = null;
    }
    if (existing?.offers?.length > 0) {
      const offer = existing.offers[0];
      const offerId = offer.offerId;
      const currentPrice = item.price || 0;

      // eBay PUT /offer requires a FULL offer body — merge updated fields into existing
      if (currentPrice > 0) {
        // Strip read-only fields eBay returns but rejects on update
        const { sku: _s, marketplaceId: _m, offerId: _oid, status: _st, listing: _l, ...offerBase } = offer;
        const isAuctionOffer = (offer.format === 'AUCTION' || item.ebayListingFormat === 'AUCTION');
        const offerUpdate = {
          ...offerBase,
          pricingSummary: isAuctionOffer
            ? {
                auctionStartPrice: {
                  value: (item.ebayAuctionStart || currentPrice).toFixed(2),
                  currency: 'USD',
                },
                ...(item.ebayAuctionReserve > 0 ? {
                  auctionReservePrice: {
                    value: item.ebayAuctionReserve.toFixed(2),
                    currency: 'USD',
                  },
                } : {}),
                ...(currentPrice > 0 ? {
                  price: {
                    value: currentPrice.toFixed(2),
                    currency: 'USD',
                  },
                } : {}),
              }
            : {
                price: {
                  value: currentPrice.toFixed(2),
                  currency: 'USD',
                },
              },
          ...(isAuctionOffer ? {} : { availableQuantity: item.qty || 1 }),
        };

        console.log('[eBay] Updating offer price to $' + currentPrice.toFixed(2));
        await _ebayApiWithRetry('PUT', `${INVENTORY_API}/offer/${offerId}`, offerUpdate);
      }

      console.log('[eBay] Re-publishing offer to push changes live:', offerId);
      const pubResp = await _ebayApiWithRetry('POST', `${INVENTORY_API}/offer/${offerId}/publish`);
      console.log('[eBay] Listing updated live, listingId:', pubResp.listingId);
    } else {
      // No offer exists for this inventory item. Create one (and publish) so
      // the price/qty update actually reaches eBay. publishEBayListing handles
      // policies, images, and all the offer setup — it's the same flow the
      // user would get by clicking "Publish to eBay" manually.
      console.log('[eBay] No offer found — auto-publishing a fresh offer');
      const pubResp = await publishEBayListing(itemId);
      if (!pubResp?.listingId) {
        throw new Error('Failed to create offer for update — try publishing manually');
      }
      console.log('[eBay] Auto-published new listing:', pubResp.listingId);
    }
  } catch (pubErr) {
    console.warn('[eBay] Offer update/re-publish failed:', pubErr.message);
    logItemEvent(itemId, 'ebay-update', `eBay offer update failed: ${pubErr.message}`);
    throw new Error(`eBay listing update failed: ${pubErr.message}`);
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
    // Fetch the existing offer for this SKU. If none exists (empty array or
    // eBay 404 "This Offer is not available.") we can't push to it — the
    // caller should go through publishEBayListing instead.
    let existing = null;
    try {
      existing = await ebayAPI('GET', `${INVENTORY_API}/offer?sku=${encodeURIComponent(sku)}`);
    } catch (getErr) {
      const m = (getErr.message || '').toLowerCase();
      const offerMissing = m.includes('not available') || m.includes('25713') || m.includes('404');
      if (!offerMissing) throw getErr;
    }
    if (!existing?.offers?.length) {
      console.log('[eBay] No offer found for SKU', sku, '— skipping price push');
      return { success: false, error: 'No offer exists — publish listing first' };
    }

    const offer = existing.offers[0];
    const offerId = offer.offerId;
    const ebayPrice = parseFloat(offer.pricingSummary?.price?.value || '0');
    const ebayQty = parseInt(offer.availableQuantity, 10) || 0;
    const localQty = item.qty || 1;

    // Only skip if BOTH price AND qty already match. This function is used
    // both for price pushes and for the inline stock stepper's qty sync
    // (_debouncedEbayQtySync). If we bail on price-match alone, qty edits
    // never reach eBay.
    if (Math.abs(ebayPrice - item.price) < 0.01 && ebayQty === localQty) {
      console.log('[eBay] Price & qty already in sync ($' + item.price.toFixed(2) + ', qty ' + localQty + ')');
      return { success: true };
    }

    // Build FULL offer body — eBay PUT /offer requires complete payload
    // Strip read-only fields that eBay returns but rejects on update
    const { sku: _s, marketplaceId: _m, offerId: _oid, status: _st, listing: _l, ...offerBase } = offer;

    const isAuction = (offer.format === 'AUCTION' || item.ebayListingFormat === 'AUCTION');
    const pricingSummary = { ...(offerBase.pricingSummary || {}) };
    if (isAuction) {
      pricingSummary.buyItNowPrice = { value: item.price.toFixed(2), currency: 'USD' };
    } else {
      pricingSummary.price = { value: item.price.toFixed(2), currency: 'USD' };
    }

    const offerUpdate = {
      ...offerBase,
      pricingSummary,
      availableQuantity: item.qty || 1,
    };

    console.warn('[eBay] Pushing price update: $' + ebayPrice.toFixed(2) + ' → $' + item.price.toFixed(2));
    await _ebayApiWithRetry('PUT', `${INVENTORY_API}/offer/${offerId}`, offerUpdate);

    // Re-publish to make it live
    await _ebayApiWithRetry('POST', `${INVENTORY_API}/offer/${offerId}/publish`);
    console.log('[eBay] Price synced to eBay ✓');

    return { success: true };
  } catch (e) {
    console.warn('[eBay] Price push failed:', e.message);
    return { success: false, error: e.message };
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
export async function publishEBayListing(itemId, options = {}, _isRetry = false) {
  if (!isEBayConnected()) throw new Error('eBay not connected');

  const item = getInvItem(itemId);
  if (!item) throw new Error('Item not found');
  if (!item.ebayItemId) throw new Error('Item not in eBay inventory. Push it first.');

  const sku = item.ebayItemId;
  const price = item.price || 0;
  const isAuction = item.ebayListingFormat === 'AUCTION';
  const auctionStart = item.ebayAuctionStart || 0;
  if (!isAuction && price <= 0) throw new Error('Item needs a price before listing');
  if (isAuction && auctionStart <= 0 && price <= 0) throw new Error('Auction needs a starting price before listing');

  // Auto-detect category first — we need it for condition validation
  let categoryId = options.categoryId || null;
  if (!categoryId) {
    // Try name first, then name + category, then category alone
    const name = item.name || '';
    const cat = item.category || '';
    categoryId = await _suggestCategory(name || 'item');
    if (!categoryId && cat) {
      categoryId = await _suggestCategory(`${name} ${cat}`.trim());
    }
    if (!categoryId && cat) {
      categoryId = await _suggestCategory(cat);
    }
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
    format: isAuction ? 'AUCTION' : 'FIXED_PRICE',
    listingDuration: isAuction
      ? (item.ebayAuctionDuration || options.listingDuration || 'DAYS_7')
      : (options.listingDuration || 'GTC'),
    categoryId,
    merchantLocationKey,
    listingPolicies,
    pricingSummary: isAuction
      ? {
          auctionStartPrice: {
            value: (item.ebayAuctionStart || price).toFixed(2),
            currency: 'USD',
          },
          ...(item.ebayAuctionReserve > 0 ? {
            auctionReservePrice: {
              value: item.ebayAuctionReserve.toFixed(2),
              currency: 'USD',
            },
          } : {}),
          // Buy It Now price — required when payment policy has immediate payment enabled
          ...((item.ebayBuyItNowPrice || price) > 0 ? {
            price: {
              value: (item.ebayBuyItNowPrice || price).toFixed(2),
              currency: 'USD',
            },
          } : {}),
        }
      : {
          price: {
            value: price.toFixed(2),
            currency: 'USD',
          },
        },
    ...(isAuction ? {} : { availableQuantity: item.qty || 1 }),
  };

  // Best Offer terms (fixed-price only)
  if (!isAuction && item.ebayBestOffer) {
    offerPayload.listingPolicies = {
      ...offerPayload.listingPolicies,
      bestOfferTerms: {
        bestOfferEnabled: true,
        ...(item.ebayAutoAccept > 0 ? { autoAcceptPrice: { value: item.ebayAutoAccept.toFixed(2), currency: 'USD' } } : {}),
        ...(item.ebayAutoDecline > 0 ? { autoDeclinePrice: { value: item.ebayAutoDecline.toFixed(2), currency: 'USD' } } : {}),
      },
    };
  }

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
    // eBay's publish response shape varies — sometimes listingId is nested,
    // sometimes missing entirely (especially for auction or update paths).
    // Fall back to re-fetching the offer to recover the listing ID.
    let listingId = publishResp?.listingId
      || publishResp?.listings?.[0]?.listingId
      || null;

    if (!listingId) {
      try {
        const offerBack = await ebayAPI('GET', `${INVENTORY_API}/offer/${offerId}`);
        listingId = offerBack?.listing?.listingId || offerBack?.listingId || null;
      } catch (fetchErr) {
        console.warn('[eBay] Publish returned no listingId and offer re-fetch failed:', fetchErr.message);
      }
    }

    if (!listingId) {
      console.error('[eBay] Publish succeeded but no listingId resolved. Response:', JSON.stringify(publishResp));
      toast('Listed on eBay, but FlipTrack could not capture the listing ID. Run a sync to reconcile.', true);
      // Still mark as active so it isn't orphaned — sync will backfill the ID
      item.platformStatus['eBay'] = 'active';
      setListingDate(itemId, 'eBay', localDate());
      markDirty('inv', itemId);
      save();
      logItemEvent(itemId, 'listed', 'Published on eBay (no listing ID captured — will reconcile on next sync)');
      return { success: true, listingId: null, warning: 'no-listing-id' };
    }

    // Update local item with the listing ID
    item.platformStatus['eBay'] = 'active';
    item.ebayListingId = listingId;
    item.url = `https://www.ebay.com/itm/${listingId}`;
    setListingDate(itemId, 'eBay', localDate());
    markDirty('inv', itemId);
    save();

    logItemEvent(itemId, 'listed', `Published on eBay — Listing #${listingId}`);
    toast(`Listed on eBay! Item #${listingId}`);
    return { success: true, listingId };
  } catch (e) {
    console.error('[eBay] PUBLISH ERROR DETAIL:', e.message);

    // If eBay rejected a product identifier (UPC/EAN/ISBN), strip it and retry once
    if (/UPC|EAN|ISBN|GTIN/i.test(e.message) && !_isRetry) {
      console.log('[eBay] Stripping rejected product identifiers and retrying');
      try {
        const inv = await ebayAPI('GET', `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`);
        if (inv.product) {
          delete inv.product.upc;
          delete inv.product.ean;
          delete inv.product.isbn;
        }
        await ebayAPI('PUT', `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`, inv);
        // Clear local UPC so it doesn't get re-sent
        delete item.upc;
        markDirty('inv', itemId);
        save();
        toast('Stripped invalid UPC, retrying…');
        return await publishEBayListing(itemId, options, true);
      } catch (stripErr) {
        console.warn('[eBay] UPC strip retry failed:', stripErr.message);
      }
    }

    // Auto-reset: clear stale eBay refs and retry as a completely fresh listing
    if (item.ebayItemId && !_isRetry) {
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
          const pubResult = await publishEBayListing(itemId, {}, true);
          return pubResult;
        }
      } catch (retryErr) {
        toast(`eBay listing error: ${retryErr.message}`, true);
        return { success: false };
      }
    }
    toast(`eBay listing error: ${e.message}`, true);
    logItemEvent(itemId, 'ebay-error', `eBay publish failed: ${e.message}`);
    return { success: false };
  }
}

/**
 * End (delist) a live eBay listing directly by its listingId. Used by the
 * reconcile "dump phantom" flow — the listing is live on eBay but either
 * already marked sold locally or not imported at all. Falls back to
 * updating the local item's status if one is known.
 * @param {string} listingId - eBay listing (legacy item) ID
 * @param {string|null} [localItemId] - Optional local item to update post-end
 */
export async function endEBayListingByLid(listingId, localItemId = null) {
  if (!isEBayConnected()) throw new Error('eBay not connected');
  if (!listingId) throw new Error('Listing ID required');
  try {
    await ebayAPI('POST', '/ws/api.dll', {
      _tradingCall: 'EndItem',
      ItemID: String(listingId),
      EndingReason: 'NotAvailable',
    });
    console.warn('[eBay] Trading API EndItem succeeded for', listingId);
    if (localItemId) {
      const item = getInvItem(localItemId);
      if (item) {
        delete item.ebayListingId;
        markPlatformStatus(localItemId, 'eBay', 'delisted');
        logItemEvent(localItemId, 'delisted', `eBay listing #${listingId} ended via reconcile`);
        markDirty('inv', localItemId);
        save();
      }
    }
    return { success: true };
  } catch (e) {
    console.warn('[eBay] EndItem failed for', listingId, e.message);
    return { success: false, error: e.message };
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

  const sku = item.ebayItemId;

  try {
    // 1. Try Trading API EndItem if we have a listing ID (required for auctions)
    if (item.ebayListingId) {
      try {
        await ebayAPI('POST', '/ws/api.dll', {
          _tradingCall: 'EndItem',
          ItemID: item.ebayListingId,
          EndingReason: 'NotAvailable',
        });
        console.warn('[eBay] Trading API EndItem succeeded for', item.ebayListingId);
      } catch (tradingErr) {
        console.warn('[eBay] Trading API EndItem failed:', tradingErr.message, '— falling back to Inventory API');
      }
    }

    // 2. Delete all offers for this SKU (so republish creates fresh)
    try {
      const existing = await ebayAPI('GET', `${INVENTORY_API}/offer?sku=${encodeURIComponent(sku)}`);
      for (const o of (existing?.offers || [])) {
        try { await ebayAPI('DELETE', `${INVENTORY_API}/offer/${o.offerId}`); } catch (_) {}
      }
    } catch (_) {}

    // 3. Set quantity to 0 (belt-and-suspenders for fixed-price listings)
    try {
      await ebayAPI('PUT', `${INVENTORY_API}/inventory_item/${encodeURIComponent(sku)}`, {
        availability: {
          shipToLocationAvailability: { quantity: 0 },
        },
      });
    } catch (_) {}

    // Clear the old listing ID so publishEBayListing creates everything fresh
    delete item.ebayListingId;

    markPlatformStatus(itemId, 'eBay', 'delisted');
    logItemEvent(itemId, 'delisted', 'eBay listing ended');
    markDirty('inv', itemId);
    save();

    toast('eBay listing ended');
    return { success: true };
  } catch (e) {
    toast(`eBay end listing error: ${e.message}`, true);
    logItemEvent(itemId, 'ebay-error', `eBay end listing failed: ${e.message}`);
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
    logItemEvent(itemId, 'ebay-error', `eBay relist failed: ${e.message}`);
    return { success: false };
  }
}
