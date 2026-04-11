/**
 * autocomplete.js — Dynamic datalist autocomplete for free-entry fields
 * Collects unique values from inventory items + persisted custom entries,
 * merges with static defaults, and repopulates <datalist> elements.
 */

import { inv, markDirty } from '../data/store.js';
import { getMeta, setMeta } from '../data/idb.js';

// ── STATIC DEFAULTS ──────────────────────────────────────────────────────────
const DEFAULT_SOURCES = [
  'Goodwill', 'Salvation Army', 'Thrift Store', 'Garage Sale', 'Estate Sale',
  'Flea Market', 'Facebook Marketplace', 'OfferUp', 'Craigslist', 'Wholesale',
  'Liquidation', 'Retail Arbitrage', 'Online Arbitrage', 'Dumpster Dive',
  'Storage Unit', 'Auction', 'Personal Collection', 'Other',
];

const DEFAULT_BRANDS = [
  'Unbranded', 'Nike', 'Adidas', "Levi's", 'Under Armour', 'Champion',
  'Carhartt', 'The North Face', 'Patagonia', 'Ralph Lauren', 'Tommy Hilfiger',
  'Calvin Klein', 'Coach', 'Michael Kors', 'Gucci', 'Louis Vuitton',
  'Apple', 'Samsung', 'Sony', 'Dell',
];

// ── SOURCE NORMALIZATION ────────────────────────────────────────────────────
// Resolve near-duplicates: "Marshall's" → "Marshalls", "good will" → "Goodwill"
// Strips punctuation/apostrophes and compares; merges if ≤2 char difference.

/** Normalize key for comparison: lowercase, strip apostrophes/punctuation, collapse spaces */
function _normKey(s) {
  return s.toLowerCase().replace(/['''`.,\-!]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Match a source name against existing sources. Returns the existing name if
 * it's a close match (same normalized key), otherwise returns the input trimmed.
 * @param {string} raw - User-entered source name
 * @returns {string} Normalized source name
 */
export function normalizeSource(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  const key = _normKey(trimmed);
  if (!key) return trimmed;

  // Check against all existing sources (inventory + defaults)
  const existing = new Set();
  for (const item of inv) {
    if (item.source) existing.add(item.source.trim());
  }
  for (const d of DEFAULT_SOURCES) existing.add(d);

  for (const src of existing) {
    if (_normKey(src) === key) return src; // exact normalized match → use existing
  }
  return trimmed;
}

/**
 * Retroactively normalize all existing inventory sources.
 * Groups by normalized key, picks the most common spelling as canonical,
 * and updates any items that differ. Runs once on startup.
 */
export function retroNormalizeSources() {
  // Build frequency map: normKey → { canonical, count, items }
  const groups = new Map();
  for (const item of inv) {
    const src = (item.source || '').trim();
    if (!src) continue;
    const key = _normKey(src);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, new Map());
    const variants = groups.get(key);
    variants.set(src, (variants.get(src) || 0) + 1);
  }

  let fixed = 0;
  for (const [key, variants] of groups) {
    if (variants.size <= 1) continue; // no duplicates

    // Pick the most-used spelling as canonical (tie-break: defaults, then alphabetical)
    let canonical = '';
    let maxCount = 0;
    for (const [name, count] of variants) {
      const isDefault = DEFAULT_SOURCES.some(d => _normKey(d) === key);
      const defaultName = DEFAULT_SOURCES.find(d => _normKey(d) === key);
      if (defaultName) { canonical = defaultName; break; }
      if (count > maxCount || (count === maxCount && name < canonical)) {
        canonical = name;
        maxCount = count;
      }
    }
    if (!canonical) continue;

    // Update all items with variant spellings to the canonical name
    for (const item of inv) {
      const src = (item.source || '').trim();
      if (src && _normKey(src) === key && src !== canonical) {
        console.warn(`[FlipTrack] Source fix: "${src}" → "${canonical}" (item: ${item.name})`);
        item.source = canonical;
        markDirty('inv', item.id);
        fixed++;
      }
    }
  }
  if (fixed > 0) {
    console.warn(`[FlipTrack] Normalized ${fixed} item source(s) to resolve duplicates`);
    // Caller should save() after this
  }
  return fixed;
}

// ── PERSIST CUSTOM ENTRIES ───────────────────────────────────────────────────

const IDB_KEY = 'autocomplete_custom';

/** Load persisted custom entries from IDB */
async function loadCustomEntries() {
  try {
    const data = await getMeta(IDB_KEY);
    return data || { sources: [], brands: [] };
  } catch (e) { console.warn('FlipTrack: autocomplete IDB load failed:', e.message); return { sources: [], brands: [] }; }
}

/** Save new custom entries to IDB (only values not in defaults or already saved) */
async function persistCustomEntries(sources, brands) {
  try {
    const existing = await loadCustomEntries();
    const srcSet = new Set([...DEFAULT_SOURCES.map(s => s.toLowerCase()), ...existing.sources.map(s => s.toLowerCase())]);
    const brdSet = new Set([...DEFAULT_BRANDS.map(s => s.toLowerCase()), ...existing.brands.map(s => s.toLowerCase())]);

    let changed = false;
    for (const s of sources) {
      if (s && !srcSet.has(s.toLowerCase())) {
        existing.sources.push(s);
        srcSet.add(s.toLowerCase());
        changed = true;
      }
    }
    for (const b of brands) {
      if (b && !brdSet.has(b.toLowerCase())) {
        existing.brands.push(b);
        brdSet.add(b.toLowerCase());
        changed = true;
      }
    }
    if (changed) await setMeta(IDB_KEY, existing);
  } catch (e) {
    console.warn('FlipTrack: autocomplete persist error:', e.message);
  }
}

// ── COLLECT UNIQUE VALUES ────────────────────────────────────────────────────

function collectFromInventory() {
  const sources = new Set();
  const brands = new Set();
  for (const item of inv) {
    if (item.source) sources.add(item.source.trim());
    if (item.brand) brands.add(item.brand.trim());
  }
  return { sources: [...sources], brands: [...brands] };
}

// ── REFRESH DATALISTS ────────────────────────────────────────────────────────

function populateDatalist(id, values) {
  const dl = document.getElementById(id);
  if (!dl) return;
  // Sort alphabetically, case-insensitive
  const sorted = [...values].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  dl.innerHTML = sorted.map(v => `<option value="${v.replace(/"/g, '&quot;')}">`).join('');
}

/**
 * Refresh sourceList and brandList datalists with merged values.
 * Call this when opening the add-item modal or the edit drawer.
 */
export async function refreshAutocompleteLists() {
  const fromInv = collectFromInventory();
  const custom = await loadCustomEntries();

  // Merge: defaults + inventory values + persisted custom entries
  // Deduplicate by normalized key (strips apostrophes/punctuation)
  const srcMap = new Map();
  for (const v of [...DEFAULT_SOURCES, ...fromInv.sources, ...custom.sources]) {
    if (v) srcMap.set(_normKey(v), v);
  }
  const brdMap = new Map();
  for (const v of [...DEFAULT_BRANDS, ...fromInv.brands, ...custom.brands]) {
    if (v) brdMap.set(v.toLowerCase(), v);
  }

  populateDatalist('sourceList', [...srcMap.values()]);
  populateDatalist('brandList', [...brdMap.values()]);
}

/**
 * Save a source and/or brand value as custom entries for future autocomplete.
 * Call after adding/saving an item.
 * @param {string} [source] - Source value to persist
 * @param {string} [brand] - Brand value to persist
 */
export async function saveAutocompleteEntry(source, brand) {
  const sources = source ? [source.trim()] : [];
  const brands = brand ? [brand.trim()] : [];
  if (sources.length || brands.length) {
    await persistCustomEntries(sources, brands);
  }
}
