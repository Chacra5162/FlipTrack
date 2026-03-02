/**
 * comps.js — Market Research & Comparables
 * Pull eBay sold prices via the ebay-auth proxy, display comps in drawer/add-item,
 * and maintain a local comps cache for quick lookups.
 */

import { inv, sales, getInvItem } from '../data/store.js';
import { ebayAPI, isEBayConnected } from './ebay-auth.js';
import { fmt, escHtml, ds } from '../utils/format.js';
import { toast } from '../utils/dom.js';
// IDB available for future persistent cache
// import { getMeta, setMeta } from '../data/idb.js';

// ── CACHE ─────────────────────────────────────────────────────────────────
const CACHE_TTL = 3600000; // 1 hour
let _compsCache = {}; // keyword → { results, ts }

// ── eBay BROWSE API ───────────────────────────────────────────────────────
const BROWSE_API = '/buy/browse/v1';

/**
 * Search eBay sold items for comparable prices.
 * Uses the Browse API item_summary/search endpoint.
 * Falls back to a simulated local comps calculation if eBay isn't connected.
 * @param {string} keyword - Search term
 * @param {Object} [opts]
 * @param {string} [opts.condition] - Filter by condition
 * @param {number} [opts.limit=20]
 * @returns {Promise<{ comps: Array, source: string, avgPrice: number, medianPrice: number, lowPrice: number, highPrice: number }>}
 */
export async function fetchComps(keyword, opts = {}) {
  if (!keyword || keyword.trim().length < 2) return _emptyResult();

  const cacheKey = `${keyword.toLowerCase()}|${opts.condition || ''}`;

  // Check cache
  if (_compsCache[cacheKey] && Date.now() - _compsCache[cacheKey].ts < CACHE_TTL) {
    return _compsCache[cacheKey].results;
  }

  // Try eBay API if connected
  if (isEBayConnected()) {
    try {
      const result = await _fetchFromEBay(keyword, opts);
      _compsCache[cacheKey] = { results: result, ts: Date.now() };
      return result;
    } catch (e) {
      console.warn('eBay comps error:', e.message);
      // Fall through to local comps
    }
  }

  // Fallback: local comps from our own sales data
  const result = _localComps(keyword, opts);
  _compsCache[cacheKey] = { results: result, ts: Date.now() };
  return result;
}

async function _fetchFromEBay(keyword, opts) {
  const limit = opts.limit || 20;
  const params = new URLSearchParams({
    q: keyword,
    limit: String(limit),
    sort: '-price',
    filter: 'buyingOptions:{FIXED_PRICE|AUCTION},conditions:{NEW|USED|VERY_GOOD|GOOD|ACCEPTABLE}',
  });

  const resp = await ebayAPI('GET', `${BROWSE_API}/item_summary/search?${params}`);
  const items = resp.itemSummaries || [];

  const comps = items.map(item => ({
    title: item.title || '',
    price: parseFloat(item.price?.value || '0'),
    currency: item.price?.currency || 'USD',
    condition: item.condition || 'Unknown',
    imageUrl: item.image?.imageUrl || '',
    itemUrl: item.itemWebUrl || '',
    sold: item.buyingOptions?.includes('FIXED_PRICE') ? 'Buy It Now' : 'Auction',
    date: item.itemEndDate || null,
  })).filter(c => c.price > 0);

  return _buildResult(comps, 'eBay');
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
    if (!name.includes(kw) && !cat.includes(kw)) continue;
    if (opts.condition && (item.condition || '').toLowerCase() !== opts.condition.toLowerCase()) continue;

    matches.push({
      title: item.name || 'Item',
      price: sale.price || 0,
      condition: item.condition || 'Unknown',
      imageUrl: item.image || '',
      itemUrl: '',
      sold: 'FlipTrack Sale',
      date: sale.date,
    });
  }

  return _buildResult(matches, 'Local Sales');
}

function _buildResult(comps, source) {
  if (!comps.length) return _emptyResult();

  const prices = comps.map(c => c.price).sort((a, b) => a - b);
  const sum = prices.reduce((a, b) => a + b, 0);
  const avgPrice = sum / prices.length;
  const medianPrice = prices.length % 2 === 0
    ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
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
 * @returns {Promise<{ suggested: number, range: string, confidence: string }>}
 */
export async function suggestPrice(keyword, condition) {
  const result = await fetchComps(keyword, { condition });
  if (!result.count) return { suggested: 0, range: 'N/A', confidence: 'low' };

  // Price slightly below median for competitive advantage
  const suggested = Math.round(result.medianPrice * 0.95 * 100) / 100;
  const range = `${fmt(result.lowPrice)} – ${fmt(result.highPrice)}`;
  const confidence = result.count >= 10 ? 'high' : result.count >= 5 ? 'medium' : 'low';

  return { suggested, range, confidence };
}

/**
 * Render comps panel HTML for the drawer or add-item modal.
 * @param {Object} result - From fetchComps()
 * @returns {string} HTML
 */
export function renderCompsPanel(result) {
  if (!result || !result.count) {
    return `<div class="comps-empty">No comparable sales found. Try a different search term.</div>`;
  }

  const statsHtml = `
    <div class="comps-stats">
      <div class="comps-stat"><span class="comps-stat-val">${fmt(result.avgPrice)}</span><span class="comps-stat-lbl">Avg</span></div>
      <div class="comps-stat"><span class="comps-stat-val">${fmt(result.medianPrice)}</span><span class="comps-stat-lbl">Median</span></div>
      <div class="comps-stat"><span class="comps-stat-val">${fmt(result.lowPrice)}</span><span class="comps-stat-lbl">Low</span></div>
      <div class="comps-stat"><span class="comps-stat-val">${fmt(result.highPrice)}</span><span class="comps-stat-lbl">High</span></div>
      <div class="comps-stat"><span class="comps-stat-val">${result.count}</span><span class="comps-stat-lbl">Comps</span></div>
    </div>
  `;

  const listHtml = result.comps.slice(0, 8).map(c => `
    <div class="comps-item">
      ${c.imageUrl ? `<img src="${escHtml(c.imageUrl)}" class="comps-thumb" alt="" loading="lazy">` : '<div class="comps-thumb comps-thumb-empty">📦</div>'}
      <div class="comps-item-info">
        <div class="comps-item-title">${escHtml(c.title.slice(0, 60))}</div>
        <div class="comps-item-meta">${escHtml(c.condition)} · ${c.sold}${c.date ? ` · ${ds(c.date)}` : ''}</div>
      </div>
      <div class="comps-item-price">${fmt(c.price)}</div>
    </div>
  `).join('');

  return `
    <div class="comps-panel">
      <div class="comps-source">Source: ${escHtml(result.source)}</div>
      ${statsHtml}
      <div class="comps-list">${listHtml}</div>
    </div>
  `;
}

/**
 * Quick comps lookup for an inventory item — uses item name as keyword.
 * @param {string} itemId
 * @returns {Promise<Object>} comps result
 */
export async function getItemComps(itemId) {
  const item = getInvItem(itemId);
  if (!item || !item.name) return _emptyResult();
  return fetchComps(item.name, { condition: item.condition });
}

// ── CLEAR CACHE ─────────────────────────────────────────────────────────
export function clearCompsCache() {
  _compsCache = {};
}
