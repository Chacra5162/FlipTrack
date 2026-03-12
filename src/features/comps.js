/**
 * comps.js — Market Research & Comparables
 * Fetches eBay sold/listed prices via the comps-lookup edge function (app-level token),
 * with fallback to local sales data. Renders comps panels for drawer, add-item, and
 * standalone lookup. Maintains an in-memory cache with TTL.
 */

import { inv, sales, getInvItem } from '../data/store.js';
import { getSupabaseClient } from '../data/auth.js';
import { fmt, escHtml, escAttr, ds } from '../utils/format.js';
import { toast } from '../utils/dom.js';

// ── CACHE ─────────────────────────────────────────────────────────────────
const CACHE_TTL = 1800000; // 30 minutes
let _compsCache = {}; // key → { results, ts }

// ── EDGE FUNCTION COMPS LOOKUP ────────────────────────────────────────────

/**
 * Search eBay sold items for comparable prices via the comps-lookup edge function.
 * Uses app-level eBay credentials — works for ALL users, no OAuth required.
 * Falls back to local sales data if the edge function is unavailable.
 * @param {string} keyword - Search term
 * @param {Object} [opts]
 * @param {string} [opts.condition] - Filter by condition
 * @param {number} [opts.limit=25]
 * @returns {Promise<{ comps: Array, source: string, avgPrice: number, medianPrice: number, lowPrice: number, highPrice: number, count: number }>}
 */
export async function fetchComps(keyword, opts = {}) {
  if (!keyword || keyword.trim().length < 2) return _emptyResult();

  const cacheKey = `${keyword.toLowerCase().trim()}|${opts.condition || ''}`;

  // Check cache
  if (_compsCache[cacheKey] && Date.now() - _compsCache[cacheKey].ts < CACHE_TTL) {
    return _compsCache[cacheKey].results;
  }

  // Try edge function (app-level eBay Browse API)
  try {
    const result = await _fetchFromEdge(keyword.trim(), opts);
    if (result.count > 0) {
      _compsCache[cacheKey] = { results: result, ts: Date.now() };
      return result;
    }
  } catch (e) {
    console.warn('FlipTrack: comps-lookup edge error:', e.message);
  }

  // Fallback: local comps from our own sales data
  const result = _localComps(keyword, opts);
  _compsCache[cacheKey] = { results: result, ts: Date.now() };
  return result;
}

async function _fetchFromEdge(keyword, opts) {
  const _sb = getSupabaseClient();
  if (!_sb) throw new Error('Not authenticated');

  const { data, error } = await _sb.functions.invoke('comps-lookup', {
    body: {
      keyword,
      condition: opts.condition || undefined,
      limit: opts.limit || 25,
    }
  });

  if (error) throw new Error(error.message || 'Edge function error');
  if (data?.error) throw new Error(data.error);

  // Normalize edge function response
  const comps = (data.comps || []).map(c => ({
    title: c.title || '',
    price: c.price || 0,
    currency: c.currency || 'USD',
    condition: c.condition || 'Unknown',
    imageUrl: c.imageUrl || '',
    itemUrl: c.itemUrl || '',
    sold: c.soldType || 'Buy It Now',
    date: c.soldDate || null,
    shippingCost: c.shippingCost || 0,
  }));

  return {
    comps,
    source: 'eBay',
    avgPrice: data.avgPrice || 0,
    medianPrice: data.medianPrice || 0,
    lowPrice: data.lowPrice || 0,
    highPrice: data.highPrice || 0,
    count: data.count || 0,
  };
}

/**
 * Local comps — use our own sales history to find comparables.
 */
function _localComps(keyword, opts) {
  const kw = keyword.toLowerCase();
  const matches = [];

  for (const sale of sales) {
    const item = getInvItem(sale.itemId);
    if (!item) continue;
    const name = (item.name || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    const brand = (item.brand || '').toLowerCase();
    if (!name.includes(kw) && !cat.includes(kw) && !brand.includes(kw)) continue;
    if (opts.condition && (item.condition || '').toLowerCase() !== opts.condition.toLowerCase()) continue;

    matches.push({
      title: item.name || 'Item',
      price: sale.price || 0,
      condition: item.condition || 'Unknown',
      imageUrl: item.image || '',
      itemUrl: '',
      sold: 'FlipTrack Sale',
      date: sale.date,
      shippingCost: 0,
    });
  }

  return _buildResult(matches, 'Your Sales');
}

function _buildResult(comps, source) {
  if (!comps.length) return _emptyResult();

  const prices = comps.map(c => c.price).sort((a, b) => a - b);
  const sum = prices.reduce((a, b) => a + b, 0);
  const avgPrice = Math.round(sum / prices.length * 100) / 100;
  const medianPrice = prices.length % 2 === 0
    ? Math.round((prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2 * 100) / 100
    : prices[Math.floor(prices.length / 2)];

  return {
    comps,
    source,
    avgPrice,
    medianPrice,
    lowPrice: prices[0],
    highPrice: prices[prices.length - 1],
    count: comps.length,
  };
}

function _emptyResult() {
  return { comps: [], source: 'None', avgPrice: 0, medianPrice: 0, lowPrice: 0, highPrice: 0, count: 0 };
}

/**
 * Suggest a competitive price for an item based on comps.
 * @param {string} keyword
 * @param {string} [condition]
 * @returns {Promise<{ suggested: number, range: string, confidence: string, median: number, count: number }>}
 */
export async function suggestPrice(keyword, condition) {
  const result = await fetchComps(keyword, { condition });
  if (!result.count) return { suggested: 0, range: 'N/A', confidence: 'low', median: 0, count: 0 };

  // Price slightly below median for competitive advantage
  const suggested = Math.round(result.medianPrice * 0.95 * 100) / 100;
  const range = `${fmt(result.lowPrice)} – ${fmt(result.highPrice)}`;
  const confidence = result.count >= 15 ? 'high' : result.count >= 7 ? 'medium' : 'low';

  return { suggested, range, confidence, median: result.medianPrice, count: result.count };
}

// ── RENDER FUNCTIONS ──────────────────────────────────────────────────────

/**
 * Render comps stats bar HTML.
 */
function _renderStats(result) {
  return `
    <div class="comps-stats">
      <div class="comps-stat">
        <span class="comps-stat-val">${fmt(result.lowPrice)}</span>
        <span class="comps-stat-lbl">Low</span>
      </div>
      <div class="comps-stat comps-stat-primary">
        <span class="comps-stat-val">${fmt(result.medianPrice)}</span>
        <span class="comps-stat-lbl">Median</span>
      </div>
      <div class="comps-stat">
        <span class="comps-stat-val">${fmt(result.highPrice)}</span>
        <span class="comps-stat-lbl">High</span>
      </div>
      <div class="comps-stat">
        <span class="comps-stat-val">${fmt(result.avgPrice)}</span>
        <span class="comps-stat-lbl">Avg</span>
      </div>
      <div class="comps-stat">
        <span class="comps-stat-val">${result.count}</span>
        <span class="comps-stat-lbl">Comps</span>
      </div>
    </div>`;
}

/**
 * Render a single comp item row.
 */
function _renderCompItem(c) {
  const thumb = c.imageUrl
    ? `<img src="${escAttr(c.imageUrl)}" class="comps-thumb" alt="${escAttr(c.title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      + '<div class="comps-thumb comps-thumb-empty" style="display:none">📦</div>'
    : '<div class="comps-thumb comps-thumb-empty">📦</div>';

  const link = c.itemUrl
    ? ` onclick="window.open('${escAttr(c.itemUrl)}','_blank');" style="cursor:pointer"`
    : '';

  const shipping = c.shippingCost > 0 ? ` +${fmt(c.shippingCost)} ship` : '';

  return `
    <div class="comps-item"${link}>
      ${thumb}
      <div class="comps-item-info">
        <div class="comps-item-title">${escHtml(c.title.length > 65 ? c.title.slice(0, 62) + '…' : c.title)}</div>
        <div class="comps-item-meta">${escHtml(c.condition)} · ${escHtml(c.sold)}${c.date ? ` · ${ds(c.date)}` : ''}${shipping}</div>
      </div>
      <div class="comps-item-price">${fmt(c.price)}</div>
    </div>`;
}

/**
 * Render mini price distribution bar (visual histogram).
 */
function _renderPriceBar(result) {
  if (result.count < 3) return '';

  const prices = result.comps.map(c => c.price).sort((a, b) => a - b);
  const lo = prices[0];
  const hi = prices[prices.length - 1];
  const range = hi - lo;
  if (range === 0) return '';

  // Build 8 buckets
  const BUCKETS = 8;
  const buckets = new Array(BUCKETS).fill(0);
  const bucketWidth = range / BUCKETS;
  for (const p of prices) {
    const idx = Math.min(Math.floor((p - lo) / bucketWidth), BUCKETS - 1);
    buckets[idx]++;
  }
  const maxBucket = Math.max(...buckets);

  const bars = buckets.map((count, i) => {
    const h = maxBucket > 0 ? Math.max(4, Math.round((count / maxBucket) * 32)) : 4;
    const bucketLo = lo + i * bucketWidth;
    const bucketHi = lo + (i + 1) * bucketWidth;
    const label = `${fmt(bucketLo)} – ${fmt(bucketHi)}: ${count} item${count !== 1 ? 's' : ''}`;
    return `<div class="comps-bar" style="height:${h}px" title="${escAttr(label)}"></div>`;
  }).join('');

  return `
    <div class="comps-distribution">
      <div class="comps-dist-label">Price Distribution</div>
      <div class="comps-dist-bars">${bars}</div>
      <div class="comps-dist-range">
        <span>${fmt(lo)}</span>
        <span>${fmt(hi)}</span>
      </div>
    </div>`;
}

/**
 * Render full comps panel HTML for the drawer tab.
 * @param {Object} result - From fetchComps()
 * @param {Object} [opts] - Render options
 * @param {boolean} [opts.showSuggest] - Show suggested price section
 * @param {number} [opts.currentPrice] - Current item price for comparison
 * @returns {string} HTML
 */
export function renderCompsPanel(result, opts = {}) {
  if (!result || !result.count) {
    return `<div class="comps-empty">
      <div class="comps-empty-icon">🔍</div>
      <div>No comparable sales found</div>
      <div class="comps-empty-sub">Try a different search term or broaden your query</div>
    </div>`;
  }

  const statsHtml = _renderStats(result);
  const distHtml = _renderPriceBar(result);

  // Price suggestion
  let suggestHtml = '';
  if (opts.showSuggest && result.medianPrice > 0) {
    const suggested = Math.round(result.medianPrice * 0.95 * 100) / 100;
    const confidence = result.count >= 15 ? 'high' : result.count >= 7 ? 'medium' : 'low';
    const confLabel = confidence === 'high' ? '● High' : confidence === 'medium' ? '● Medium' : '● Low';
    const confCls = `comps-conf-${confidence}`;

    let comparison = '';
    if (opts.currentPrice && opts.currentPrice > 0) {
      const diff = opts.currentPrice - result.medianPrice;
      const pctDiff = Math.round((diff / result.medianPrice) * 100);
      if (Math.abs(pctDiff) >= 3) {
        comparison = diff > 0
          ? `<span class="comps-price-high">Your price is ${pctDiff}% above median</span>`
          : `<span class="comps-price-low">Your price is ${Math.abs(pctDiff)}% below median</span>`;
      } else {
        comparison = `<span class="comps-price-ok">Your price is in line with market</span>`;
      }
    }

    suggestHtml = `
      <div class="comps-suggest">
        <div class="comps-suggest-hdr">
          <span>💡 Suggested Price</span>
          <span class="${confCls}">${confLabel} confidence</span>
        </div>
        <div class="comps-suggest-price">${fmt(suggested)}</div>
        <div class="comps-suggest-note">5% below median for competitive pricing</div>
        ${comparison}
      </div>`;
  }

  // Comp items list
  const listHtml = result.comps.slice(0, 10).map(c => _renderCompItem(c)).join('');

  // External search links
  const q = encodeURIComponent(result.keyword || '');
  const searchLinksHtml = q ? `
    <div class="comps-search-links">
      <a class="comps-search-link" href="https://www.ebay.com/sch/i.html?_nkw=${q}&LH_Sold=1&LH_Complete=1" target="_blank" rel="noopener">eBay Sold</a>
      <a class="comps-search-link" href="https://www.ebay.com/sch/i.html?_nkw=${q}" target="_blank" rel="noopener">eBay Active</a>
      <a class="comps-search-link" href="https://www.mercari.com/search/?keyword=${q}" target="_blank" rel="noopener">Mercari</a>
      <a class="comps-search-link" href="https://poshmark.com/search?query=${q}" target="_blank" rel="noopener">Poshmark</a>
    </div>` : '';

  return `
    <div class="comps-panel">
      <div class="comps-source">${escHtml(result.source)} · ${result.count} comparable${result.count !== 1 ? 's' : ''}</div>
      ${statsHtml}
      ${distHtml}
      ${suggestHtml}
      <div class="comps-list-hdr">Recent Listings</div>
      <div class="comps-list">${listHtml}</div>
      ${searchLinksHtml}
    </div>`;
}

/**
 * Render compact comps inline (for add-item form).
 */
export function renderCompsInline(result) {
  if (!result || !result.count) return '';

  const suggested = Math.round(result.medianPrice * 0.95 * 100) / 100;
  const confidence = result.count >= 15 ? 'high' : result.count >= 7 ? 'medium' : 'low';

  return `
    <div class="comps-inline">
      <div class="comps-inline-hdr">
        <span>📊 Market Comps</span>
        <span class="comps-inline-count">${result.count} found</span>
      </div>
      <div class="comps-inline-stats">
        <span class="comps-inline-lo">${fmt(result.lowPrice)}</span>
        <span class="comps-inline-sep">–</span>
        <span class="comps-inline-mid">${fmt(result.medianPrice)}</span>
        <span class="comps-inline-sep">–</span>
        <span class="comps-inline-hi">${fmt(result.highPrice)}</span>
      </div>
      <button type="button" class="comps-use-btn" onclick="compsUsePrice(${suggested})">
        Use ${fmt(suggested)} <span class="comps-conf-${confidence}">● ${confidence}</span>
      </button>
    </div>`;
}

/**
 * Quick comps lookup for an inventory item — uses item name as keyword.
 * @param {string} itemId
 * @returns {Promise<Object>} comps result
 */
export async function getItemComps(itemId) {
  const item = getInvItem(itemId);
  if (!item || !item.name) return _emptyResult();
  const result = await fetchComps(item.name, { condition: item.condition });
  // Attach keyword for search links
  result.keyword = item.name;
  return result;
}

// ── DRAWER COMPS TAB ──────────────────────────────────────────────────────

let _drawerCompsLoaded = false;

/**
 * Load comps for the currently open drawer item.
 * Called when user clicks the "Comps" tab in the drawer.
 */
export async function loadDrawerComps() {
  const el = document.getElementById('dtab-comps-body');
  if (!el) return;

  // Get current drawer item
  const drawerId = window.activeDrawId || null;
  if (!drawerId) {
    el.innerHTML = '<div class="comps-empty">No item selected</div>';
    return;
  }

  const item = getInvItem(drawerId);
  if (!item || !item.name) {
    el.innerHTML = '<div class="comps-empty">Item needs a name to search comps</div>';
    return;
  }

  // Loading state
  el.innerHTML = `
    <div class="comps-loading">
      <div class="comps-loading-spinner"></div>
      <div>Searching eBay for comps…</div>
    </div>`;

  try {
    const result = await getItemComps(drawerId);
    result.keyword = item.name;
    el.innerHTML = renderCompsPanel(result, {
      showSuggest: true,
      currentPrice: item.price || 0,
    });
    _drawerCompsLoaded = true;
  } catch (e) {
    el.innerHTML = `<div class="comps-empty">⚠ ${escHtml(e.message || 'Failed to load comps')}</div>`;
  }
}

/**
 * Reset drawer comps state when drawer closes.
 */
export function resetDrawerComps() {
  _drawerCompsLoaded = false;
  const el = document.getElementById('dtab-comps-body');
  if (el) el.innerHTML = '';
}

// ── ADD-ITEM COMPS SUGGESTION ────────────────────────────────────────────

let _addCompsDebounce = null;

/**
 * Trigger comps lookup for the add-item form (debounced).
 * Called when user finishes typing an item name.
 */
export function triggerAddComps() {
  clearTimeout(_addCompsDebounce);
  _addCompsDebounce = setTimeout(async () => {
    const nameEl = document.getElementById('f_name');
    const condEl = document.getElementById('f_condition');
    const compsEl = document.getElementById('addCompsSlot');
    if (!nameEl || !compsEl) return;

    const name = nameEl.value.trim();
    if (name.length < 3) {
      compsEl.innerHTML = '';
      return;
    }

    compsEl.innerHTML = '<div class="comps-inline comps-inline-loading">📊 Searching comps…</div>';

    try {
      const condition = condEl ? condEl.value : '';
      const result = await fetchComps(name, { condition });
      result.keyword = name;
      compsEl.innerHTML = renderCompsInline(result);
    } catch (e) {
      compsEl.innerHTML = '';
    }
  }, 800);
}

/**
 * Apply suggested price to the add-item form price field.
 */
export function compsUsePrice(price) {
  const el = document.getElementById('f_price');
  if (el) {
    el.value = price;
    if (window.prevProfit) window.prevProfit();
    toast('Price set from comps ✓');
  }
}

// ── CLEAR CACHE ─────────────────────────────────────────────────────────
export function clearCompsCache() {
  _compsCache = {};
}
