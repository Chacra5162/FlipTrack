/**
 * constants.js - Application configuration and constants
 * Contains Supabase credentials, platform definitions, and utility constants.
 */

// ── SUPABASE CONFIGURATION ─────────────────────────────────────────────────
export const SB_URL = 'https://gqructzvlkafclooybnc.supabase.co';
export const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcnVjdHp2bGthZmNsb295Ym5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzODIyNTAsImV4cCI6MjA4Njk1ODI1MH0.-H5p1Oq-ImveB636xgWI-Rrc23wzj7-_Vps6xeHrHtA';

// ── SUPABASE TABLES ────────────────────────────────────────────────────────
export const TABLES = {
  INVENTORY: 'ft_inventory',
  SALES: 'ft_sales',
  EXPENSES: 'ft_expenses',
  SUPPLIES: 'ft_supplies',
};

// ── STORAGE BUCKETS ────────────────────────────────────────────────────────
export const STORAGE_BUCKETS = {
  IMAGES: 'item-images',
};

export const IMG_BUCKET = 'item-images';

// ── PLATFORMS (for sales tracking) ────────────────────────────────────────
export const PLATFORMS = [
  'eBay','Amazon','Etsy','Facebook Marketplace',
  'Depop','Poshmark','Mercari','Grailed','StockX','GOAT','Vinted','Tradesy','The RealReal','Vestiaire Collective',
  'Reverb','Discogs',
  'Craigslist','OfferUp','Nextdoor',
  'Whatnot','TikTok Shop','Instagram',
  'Shopify','Walmart Marketplace','Newegg','Bonanza','Ruby Lane','Chairish','1stDibs',
  'Swappa','Decluttr',
  'Unlisted','Other'
];

// ── PLATFORM STYLING ──────────────────────────────────────────────────────
export const PLATFORM_CLASSES = {
  'eBay':'plt-ebay','Amazon':'plt-amazon','Etsy':'plt-etsy','Facebook Marketplace':'plt-fb',
  'Depop':'plt-depop','Poshmark':'plt-poshmark','Mercari':'plt-mercari','Grailed':'plt-grailed',
  'StockX':'plt-stockx','GOAT':'plt-goat','Vinted':'plt-vinted','Tradesy':'plt-tradesy',
  'The RealReal':'plt-realreal','Vestiaire Collective':'plt-vestiaire',
  'Reverb':'plt-reverb','Discogs':'plt-discogs',
  'Craigslist':'plt-craigslist','OfferUp':'plt-offerup','Nextdoor':'plt-nextdoor',
  'Whatnot':'plt-whatnot','TikTok Shop':'plt-tiktok','Instagram':'plt-instagram',
  'Shopify':'plt-shopify','Walmart Marketplace':'plt-walmart','Newegg':'plt-newegg',
  'Bonanza':'plt-bonanza','Ruby Lane':'plt-bonanza','Chairish':'plt-chairish',
  '1stDibs':'plt-1stdibs','Swappa':'plt-swappa','Decluttr':'plt-decluttr',
};

export function getPlatformClass(platform) {
  return PLATFORM_CLASSES[platform] || 'plt-other';
}

// ── CATEGORY DEFINITIONS ──────────────────────────────────────────────────
export const CLOTHING_TYPES = [
  'Shirts', 'T-Shirts', 'Pants', 'Jeans', 'Shorts', 'Jackets', 'Hoodies', 'Sweaters',
  'Dresses', 'Skirts', 'Socks', 'Underwear', 'Activewear', 'Swimwear', 'Outerwear',
  'Suits', 'Loungewear'
];

export const CATEGORY_TREE = {
  Clothing: {
    subcats: {
      'Men':                 CLOTHING_TYPES,
      'Women':               CLOTHING_TYPES,
      'Children':            CLOTHING_TYPES,
      'Footwear':            ['Men', 'Women', 'Children'],
      "Men's Accessories":   [],
      "Women's Accessories": [],
    }
  },
  Books: {
    subcats: {
      'Fiction':             ['Literary', 'Sci-Fi', 'Fantasy', 'Mystery', 'Thriller', 'Romance', 'Horror', 'Historical'],
      'Non-Fiction':         ['Biography', 'History', 'Science', 'Self-Help', 'Business', 'Travel', 'Cooking', 'Health'],
      'Textbooks':           ['Math', 'Science', 'Engineering', 'Medicine', 'Law', 'Business', 'Humanities', 'Computer Science'],
      'Children':            ['Picture Books', 'Middle Grade', 'Young Adult', 'Board Books', 'Activity Books'],
      'Rare & Collectible':  ['First Editions', 'Signed Copies', 'Antiquarian', 'Limited Editions'],
      'Comics & Graphic Novels': [],
      'Art & Photography':   [],
      'Reference':           [],
    }
  }
};

// Flat SUBCATS for backwards-compat
export const SUBCATS = Object.fromEntries(
  Object.entries(CATEGORY_TREE).map(([cat, def]) => [cat, Object.keys(def.subcats)])
);

// Sub-subcategories (third level)
export const SUBSUBCATS = Object.fromEntries(
  Object.entries(CATEGORY_TREE).flatMap(([, def]) =>
    Object.entries(def.subcats).filter(([,v])=>v.length).map(([sub,vals])=>[sub,vals])
  )
);

// ── PLATFORM FEES ─────────────────────────────────────────────────────────
export const PLATFORM_FEES = {
  'eBay':           { pct: 0.127, fixed: 0.30 },
  'Amazon':         { pct: 0.15 },
  'Etsy':           { pct: 0.065, fixed: 0.20 },
  'Facebook Marketplace': { pct: 0 },
  'Depop':          { pct: 0.10 },
  'Poshmark':       { pct: 0.20 },
  'Mercari':        { pct: 0.10 },
  'Grailed':        { pct: 0.08 },
  'StockX':         { pct: 0.09, fixed: 2.75 },
  'GOAT':           { pct: 0.09, fixed: 2.75 },
  'Vinted':         { pct: 0.05 },
  'Tradesy':        { pct: 0.10 },
  'The RealReal':   { pct: 0.20 },
  'Vestiaire Collective': { pct: 0.10 },
  'Reverb':         { pct: 0.08, fixed: 0.45 },
  'Discogs':        { pct: 0.065, fixed: 0.30 },
  'Craigslist':     { pct: 0 },
  'OfferUp':        { pct: 0 },
  'Nextdoor':       { pct: 0 },
  'Whatnot':        { pct: 0.08 },
  'TikTok Shop':    { pct: 0.05 },
  'Instagram':      { pct: 0 },
  'Shopify':        { pct: 0.029, fixed: 0.30 },
  'Walmart Marketplace': { pct: 0.06 },
  'Newegg':         { pct: 0.03 },
  'Bonanza':        { pct: 0.05 },
  'Ruby Lane':      { pct: 0.05 },
  'Chairish':       { pct: 0.15 },
  '1stDibs':        { pct: 0.15 },
  'Swappa':         { pct: 0.02, fixed: 1.50 },
  'Decluttr':       { pct: 0.08 },
  'Unlisted':       { pct: 0 },
  'Other':          { pct: 0 },
};

export function getPlatformFee(platform) {
  return PLATFORM_FEES[platform] || { pct: 0 };
}

// ── UTILITY FUNCTIONS ──────────────────────────────────────────────────────

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
export const fmt = n => '$' + Number(n||0).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
export const pct = n => (n*100).toFixed(1)+'%';
export const ds = d => new Date(d).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
export const escHtml = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
export const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

// Stock status calculation
export const sc = (qty, alert, bulk) => !bulk ? (qty===0?'low':'ok') : qty===0?'low':qty<=(alert||2)?'warn':'ok';

// ── PAGINATION ─────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 50;
export const TRASH_MAX_ITEMS = 30;
export const TRASH_MAX_AGE_DAYS = 7;
export const UNDO_STACK_MAX = 20;

// ── SYNC SETTINGS ──────────────────────────────────────────────────────────
export const SYNC_DEBOUNCE_MS = 2000;
export const POLL_INTERVAL_MS = 60000;
export const REALTIME_DEBOUNCE_MS = 500;
export const SYNC_TIMEOUT_MS = 10000;

// ── LOCAL STORAGE KEYS ─────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  INVENTORY: 'ft3_inv',
  SALES: 'ft3_sal',
  EXPENSES: 'ft3_exp',
  SUPPLIES: 'ft_supplies',
  TRASH: 'ft_trash',
  THEME: 'ft_theme',
  FONT_SIZE: 'ft_fs',
  FONT_FAMILY: 'ft_font',
};
