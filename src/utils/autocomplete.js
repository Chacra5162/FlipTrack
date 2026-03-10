/**
 * autocomplete.js — Dynamic datalist autocomplete for free-entry fields
 * Collects unique values from inventory items + persisted custom entries,
 * merges with static defaults, and repopulates <datalist> elements.
 */

import { inv } from '../data/store.js';
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

  // Merge: defaults + inventory values + persisted custom entries (deduplicated)
  const srcMap = new Map();
  for (const v of [...DEFAULT_SOURCES, ...fromInv.sources, ...custom.sources]) {
    if (v) srcMap.set(v.toLowerCase(), v);
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
