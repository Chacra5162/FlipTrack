/**
 * crosslist.js — Core crosslisting logic
 * Manages platform listing lifecycle: expiry rules, auto-delist on sale,
 * expired/expiring listing detection, and listing health scoring.
 */

import { inv, save, refresh, markDirty } from '../data/store.js';
import { toast } from '../utils/dom.js';
import { getPlatforms } from './platforms.js';

// ── PLATFORM EXPIRY RULES ──────────────────────────────────────────────────
// Days until a listing naturally expires on each platform (0 = never/GTC)
export const PLATFORM_EXPIRY_RULES = {
  'eBay':                  { days: 30,  label: '30-day or GTC', renewable: true },
  'Amazon':                { days: 0,   label: 'Until sold/removed', renewable: false },
  'Etsy':                  { days: 120, label: '4-month listing', renewable: true },
  'Facebook Marketplace':  { days: 7,   label: '7-day listing', renewable: true },
  'Depop':                 { days: 0,   label: 'Until sold/removed', renewable: false },
  'Poshmark':              { days: 0,   label: 'Active until sold (share to refresh)', renewable: false },
  'Mercari':               { days: 0,   label: 'Until sold/removed', renewable: false },
  'Grailed':               { days: 0,   label: 'Until sold/removed', renewable: false },
  'StockX':                { days: 30,  label: '30-day ask', renewable: true },
  'GOAT':                  { days: 30,  label: '30-day listing', renewable: true },
  'Vinted':                { days: 0,   label: 'Until sold/removed', renewable: false },
  'Tradesy':               { days: 0,   label: 'Until sold/removed', renewable: false },
  'The RealReal':          { days: 0,   label: 'Consignment period', renewable: false },
  'Vestiaire Collective':  { days: 0,   label: 'Until sold/removed', renewable: false },
  'Reverb':                { days: 0,   label: 'Until sold/removed', renewable: false },
  'Discogs':               { days: 0,   label: 'Until sold/removed', renewable: false },
  'Craigslist':            { days: 45,  label: '45-day listing', renewable: true },
  'OfferUp':               { days: 0,   label: 'Until sold/removed', renewable: false },
  'Nextdoor':              { days: 30,  label: '30-day listing', renewable: true },
  'Whatnot':               { days: 0,   label: 'Live auction', renewable: false },
  'TikTok Shop':           { days: 0,   label: 'Until sold/removed', renewable: false },
  'Instagram':             { days: 0,   label: 'Until sold/removed', renewable: false },
  'Shopify':               { days: 0,   label: 'Until sold/removed', renewable: false },
  'Walmart Marketplace':   { days: 0,   label: 'Until sold/removed', renewable: false },
  'Newegg':                { days: 0,   label: 'Until sold/removed', renewable: false },
  'Bonanza':               { days: 0,   label: 'Until sold/removed', renewable: false },
  'Ruby Lane':             { days: 0,   label: 'Until sold/removed', renewable: false },
  'Chairish':              { days: 0,   label: 'Until sold/removed', renewable: false },
  '1stDibs':               { days: 0,   label: 'Until sold/removed', renewable: false },
  'Swappa':                { days: 30,  label: '30-day listing', renewable: true },
  'Decluttr':              { days: 0,   label: 'Until sold/removed', renewable: false },
};

// Valid platform statuses
export const LISTING_STATUSES = ['active', 'sold', 'sold-elsewhere', 'delisted', 'expired', 'draft'];

export const STATUS_LABELS = {
  'active': 'Active',
  'sold': 'Sold',
  'sold-elsewhere': 'Sold Elsewhere',
  'delisted': 'Delisted',
  'expired': 'Expired',
  'draft': 'Draft'
};

export const STATUS_COLORS = {
  'active':         'var(--good)',
  'sold':           'var(--accent)',
  'sold-elsewhere': 'var(--accent2)',
  'delisted':       'var(--muted)',
  'expired':        'var(--danger)',
  'draft':          'var(--warn)'
};

// ── EXPIRY CALCULATION ─────────────────────────────────────────────────────

/**
 * Calculate when a listing will expire based on platform rules.
 * @param {string} platform - Platform name
 * @param {string|Date} listedDate - When the item was listed
 * @returns {string|null} ISO date string of expiry, or null if no expiry
 */
export function determinePlatformExpiry(platform, listedDate) {
  const rule = PLATFORM_EXPIRY_RULES[platform];
  if (!rule || rule.days === 0) return null; // No expiry
  const d = new Date(listedDate);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + rule.days);
  return d.toISOString().split('T')[0];
}

/**
 * Get days remaining until a listing expires.
 * @returns {number|null} Days remaining (negative if expired), null if no expiry
 */
export function getDaysUntilExpiry(platform, listedDate) {
  const expiry = determinePlatformExpiry(platform, listedDate);
  if (!expiry) return null;
  const now = new Date(); now.setHours(0,0,0,0);
  const exp = new Date(expiry); exp.setHours(0,0,0,0);
  return Math.ceil((exp - now) / 86400000);
}

// ── PLATFORM STATUS MANAGEMENT ─────────────────────────────────────────────

/**
 * Single source of truth for changing a platform listing status.
 */
export function markPlatformStatus(itemId, platform, status) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return false;
  if (!item.platformStatus) item.platformStatus = {};
  item.platformStatus[platform] = status;
  markDirty('inv', itemId);
  return true;
}

/**
 * Set listing date for a platform. Auto-calculates expiry.
 */
export function setListingDate(itemId, platform, dateStr) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return;
  if (!item.platformListingDates) item.platformListingDates = {};
  if (!item.platformListingExpiry) item.platformListingExpiry = {};
  item.platformListingDates[platform] = dateStr || new Date().toISOString().split('T')[0];
  const expiry = determinePlatformExpiry(platform, item.platformListingDates[platform]);
  if (expiry) item.platformListingExpiry[platform] = expiry;
  else delete item.platformListingExpiry[platform];
  markDirty('inv', itemId);
}

/**
 * Mark a listing as relisted — resets listing date, recalculates expiry, sets active.
 */
export function relistItem(itemId, platform) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return;
  const today = new Date().toISOString().split('T')[0];
  if (!item.lastRelisted) item.lastRelisted = {};
  item.lastRelisted[platform] = today;
  setListingDate(itemId, platform, today);
  markPlatformStatus(itemId, platform, 'active');
}

// ── AUTO-DELIST ON SALE ────────────────────────────────────────────────────

/**
 * When an item sells on one platform, mark other active platforms as 'sold-elsewhere'.
 * Called from recSale() in sales.js.
 * @returns {string[]} Array of platform names that were marked sold-elsewhere
 */
export function autoDlistOnSale(itemId, soldPlatform) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return [];
  const plats = getPlatforms(item);
  if (!item.platformStatus) item.platformStatus = {};
  // Mark sold platform
  item.platformStatus[soldPlatform] = 'sold';
  // Only auto-delist others if qty is now 0 (fully sold out)
  const marked = [];
  if ((item.qty || 0) <= 0) {
    for (const p of plats) {
      if (p === soldPlatform) continue;
      const st = item.platformStatus[p];
      if (st === 'active' || !st) {
        item.platformStatus[p] = 'sold-elsewhere';
        marked.push(p);
      }
    }
  }
  markDirty('inv', itemId);
  return marked;
}

// ── EXPIRED / EXPIRING LISTING DETECTION ───────────────────────────────────

/**
 * Get all items with expired listings (past their platform expiry date).
 */
export function getExpiredListings(items) {
  const now = new Date(); now.setHours(0,0,0,0);
  const results = [];
  for (const item of items) {
    const plats = getPlatforms(item);
    const ps = item.platformStatus || {};
    const dates = item.platformListingDates || {};
    const expiry = item.platformListingExpiry || {};
    for (const p of plats) {
      if (ps[p] && ps[p] !== 'active') continue; // Skip non-active
      const exp = expiry[p];
      if (exp && new Date(exp) < now) {
        results.push({ item, platform: p, expiryDate: exp, listedDate: dates[p] || null });
      }
    }
  }
  return results;
}

/**
 * Get items with listings expiring within N days.
 */
export function getExpiringListings(items, daysWarning = 7) {
  const now = new Date(); now.setHours(0,0,0,0);
  const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() + daysWarning);
  const results = [];
  for (const item of items) {
    const plats = getPlatforms(item);
    const ps = item.platformStatus || {};
    const dates = item.platformListingDates || {};
    const expiry = item.platformListingExpiry || {};
    for (const p of plats) {
      if (ps[p] && ps[p] !== 'active') continue;
      const exp = expiry[p];
      if (exp) {
        const d = new Date(exp);
        if (d >= now && d <= cutoff) {
          const daysLeft = Math.ceil((d - now) / 86400000);
          results.push({ item, platform: p, expiryDate: exp, daysLeft, listedDate: dates[p] || null });
        }
      }
    }
  }
  return results.sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * Batch-check all listings and auto-mark expired ones.
 * Run on app load and periodically.
 */
export function checkExpiredListings() {
  const expired = getExpiredListings(inv);
  let count = 0;
  for (const { item, platform } of expired) {
    if (!item.platformStatus) item.platformStatus = {};
    if (item.platformStatus[platform] !== 'expired') {
      item.platformStatus[platform] = 'expired';
      markDirty('inv', item.id);
      count++;
    }
  }
  if (count > 0) {
    save();
    toast(`${count} listing${count > 1 ? 's' : ''} expired — relist from Crosslist tab`);
  }
  return count;
}

// ── LISTING HEALTH ─────────────────────────────────────────────────────────

/**
 * Get listing health stats for an item.
 */
export function getListingHealth(item) {
  const plats = getPlatforms(item);
  const ps = item.platformStatus || {};
  let active = 0, sold = 0, soldElsewhere = 0, expired = 0, delisted = 0, draft = 0;
  for (const p of plats) {
    const st = ps[p] || 'active';
    if (st === 'active') active++;
    else if (st === 'sold') sold++;
    else if (st === 'sold-elsewhere') soldElsewhere++;
    else if (st === 'expired') expired++;
    else if (st === 'delisted') delisted++;
    else if (st === 'draft') draft++;
  }
  return { totalPlatforms: plats.length, active, sold, soldElsewhere, expired, delisted, draft };
}

/**
 * Get crosslist summary stats across all inventory.
 */
export function getCrosslistStats(items) {
  let totalActive = 0, totalExpired = 0, totalExpiringSoon = 0, totalSoldElsewhere = 0;
  let itemsNotListed = 0, itemsSinglePlatform = 0;
  const expiring = getExpiringListings(items, 7);
  totalExpiringSoon = expiring.length;
  for (const item of items) {
    if ((item.qty || 0) <= 0) continue; // Skip out-of-stock
    const health = getListingHealth(item);
    totalActive += health.active;
    totalExpired += health.expired;
    totalSoldElsewhere += health.soldElsewhere;
    if (health.totalPlatforms === 0) itemsNotListed++;
    else if (health.totalPlatforms === 1) itemsSinglePlatform++;
  }
  return { totalActive, totalExpired, totalExpiringSoon, totalSoldElsewhere, itemsNotListed, itemsSinglePlatform };
}

// ── LISTING DATE INITIALIZATION ────────────────────────────────────────────

/**
 * For items that have platforms but no listing dates, initialize with item.added date.
 * Called once at boot to backfill existing inventory.
 */
export function initListingDates() {
  let patched = 0;
  for (const item of inv) {
    const plats = getPlatforms(item);
    if (!plats.length) continue;
    if (!item.platformListingDates) item.platformListingDates = {};
    if (!item.platformListingExpiry) item.platformListingExpiry = {};
    if (!item.platformStatus) item.platformStatus = {};
    for (const p of plats) {
      if (!item.platformListingDates[p]) {
        // Use item.added or today as fallback
        const fallback = item.added ? new Date(item.added).toISOString().split('T')[0]
                                    : new Date().toISOString().split('T')[0];
        item.platformListingDates[p] = fallback;
        const expiry = determinePlatformExpiry(p, fallback);
        if (expiry) item.platformListingExpiry[p] = expiry;
        patched++;
      }
      // Ensure status exists
      if (!item.platformStatus[p]) item.platformStatus[p] = 'active';
    }
    if (patched > 0) markDirty('inv', item.id);
  }
  if (patched > 0) save();
}
