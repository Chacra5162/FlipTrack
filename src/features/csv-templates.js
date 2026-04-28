import { localDate } from '../utils/format.js';
import { inv, sales, expenses, getInvItem } from '../data/store.js';
import { getPlatforms } from './platforms.js';
import { PLATFORM_FEES } from '../config/platforms.js';
import { toast } from '../utils/dom.js';
import { getShow, getEndedShows, getItemNote } from '../features/whatnot-show.js';
import { getShowMetrics } from '../features/whatnot-analytics.js';

const TEMPLATES = {
  ebay: {
    name: 'eBay File Exchange',
    ext: 'csv',
    columns: ['Action', 'Title', 'Subtitle', 'Category', 'ConditionID', 'Price', 'Quantity', 'Description', 'PicURL', 'ShippingType', 'ShippingService-1:Option', 'ShippingService-1:Cost', 'Format', 'Duration'],
    mapper: (item) => ({
      'Action': 'Add',
      'Title': (item.name || '').slice(0, 80),
      'Subtitle': '',
      'Category': item.category || '',
      'ConditionID': conditionToEBay(item.condition),
      'Price': (item.price || 0).toFixed(2),
      'Quantity': item.qty || 1,
      'Description': item.notes || item.name || '',
      'PicURL': '',
      'ShippingType': 'Flat',
      'ShippingService-1:Option': 'USPSPriority',
      'ShippingService-1:Cost': (item.ship || 5.99).toFixed(2),
      'Format': 'FixedPrice',
      'Duration': 'GTC',
    }),
  },

  poshmark: {
    name: 'Poshmark',
    ext: 'csv',
    columns: ['Title', 'Description', 'Department', 'Category', 'Subcategory', 'Brand', 'Size', 'Color', 'Condition', 'Original Price', 'Listing Price', 'Quantity'],
    mapper: (item) => ({
      'Title': (item.name || '').slice(0, 80),
      'Description': item.notes || item.name || '',
      'Department': '',
      'Category': item.category || '',
      'Subcategory': item.subcategory || '',
      'Brand': '',
      'Size': '',
      'Color': '',
      'Condition': item.condition || 'Pre-Owned',
      'Original Price': ((item.price || 0) * 1.3).toFixed(2),
      'Listing Price': (item.price || 0).toFixed(2),
      'Quantity': item.qty || 1,
    }),
  },

  mercari: {
    name: 'Mercari',
    ext: 'csv',
    columns: ['Title', 'Description', 'Category', 'Condition', 'Price', 'Shipping Paid By', 'Shipping Weight'],
    mapper: (item) => ({
      'Title': (item.name || '').slice(0, 80),
      'Description': item.notes || item.name || '',
      'Category': item.category || '',
      'Condition': item.condition || 'Good',
      'Price': (item.price || 0).toFixed(2),
      'Shipping Paid By': 'Seller',
      'Shipping Weight': item.weight ? item.weight + ' oz' : '',
    }),
  },

  depop: {
    name: 'Depop',
    ext: 'csv',
    columns: ['Title', 'Description', 'Category', 'Condition', 'Price', 'Quantity', 'Shipping Cost'],
    mapper: (item) => ({
      'Title': (item.name || '').slice(0, 80),
      'Description': item.notes || item.name || '',
      'Category': item.category || '',
      'Condition': item.condition || 'Used',
      'Price': (item.price || 0).toFixed(2),
      'Quantity': item.qty || 1,
      'Shipping Cost': (item.ship || 0).toFixed(2),
    }),
  },

  whatnot: {
    name: 'Whatnot',
    ext: 'csv',
    columns: ['Category', 'Sub Category', 'Title', 'Description', 'Quantity', 'Type', 'Price', 'Shipping Profile', 'Offerable', 'Hazmat', 'Condition', 'Cost Per Item', 'SKU', 'Image URL 1', 'Image URL 2', 'Image URL 3', 'Image URL 4', 'Image URL 5', 'Image URL 6', 'Image URL 7', 'Image URL 8'],
    mapper: (item) => {
      const imgs = (item.images && Array.isArray(item.images)) ? item.images : (item.image ? [item.image] : []);
      // Only include https URLs (skip base64)
      const urls = imgs.filter(u => typeof u === 'string' && u.startsWith('http')).slice(0, 8);
      // Build description from available fields
      const descParts = [];
      if (item.notes) descParts.push(item.notes);
      if (item.brand && item.brand !== 'Unbranded') descParts.push('Brand: ' + item.brand);
      if (item.size) descParts.push('Size: ' + item.size);
      if (item.color) descParts.push('Color: ' + item.color);
      if (item.material) descParts.push('Material: ' + item.material);
      if (item.conditionDesc) descParts.push(item.conditionDesc);
      const desc = descParts.join('. ') || item.name || '';

      return {
        'Category': item.category || '',
        'Sub Category': item.subcategory || '',
        'Title': (item.name || '').slice(0, 80),
        'Description': desc,
        'Quantity': item.qty || 1,
        'Type': 'Buy It Now',
        'Price': Math.ceil(item.price || 0),
        'Shipping Profile': weightToWhatnotShipping(item),
        'Offerable': 'TRUE',
        'Hazmat': 'FALSE',
        'Condition': item.condition || '',
        'Cost Per Item': (item.cost || 0).toFixed(2),
        'SKU': item.sku || '',
        'Image URL 1': urls[0] || '',
        'Image URL 2': urls[1] || '',
        'Image URL 3': urls[2] || '',
        'Image URL 4': urls[3] || '',
        'Image URL 5': urls[4] || '',
        'Image URL 6': urls[5] || '',
        'Image URL 7': urls[6] || '',
        'Image URL 8': urls[7] || '',
      };
    },
  },

  generic: {
    name: 'FlipTrack Full Export',
    ext: 'csv',
    columns: ['SKU', 'Name', 'Category', 'Subcategory', 'Platforms', 'Condition', 'Cost', 'Price', 'Fees', 'Shipping', 'Quantity', 'Date Added', 'Notes', 'UPC'],
    mapper: (item) => ({
      'SKU': item.sku || '',
      'Name': item.name || '',
      'Category': item.category || '',
      'Subcategory': item.subcategory || '',
      'Platforms': getPlatforms(item).join('; '),
      'Condition': item.condition || '',
      'Cost': (item.cost || 0).toFixed(2),
      'Price': (item.price || 0).toFixed(2),
      'Fees': (item.fees || 0).toFixed(2),
      'Shipping': (item.ship || 0).toFixed(2),
      'Quantity': item.qty || 0,
      'Date Added': item.added || '',
      'Notes': item.notes || '',
      'UPC': item.upc || '',
    }),
  },

  sales_report: {
    name: 'Sales Report',
    ext: 'csv',
    columns: ['Date', 'Item Name', 'SKU', 'Platform', 'Sale Price', 'Quantity', 'Fees', 'Shipping', 'Item Cost', 'Profit'],
    mapper: null, // handled specially
  },

  tax_export: {
    name: 'Tax Summary',
    ext: 'csv',
    columns: ['Category', 'Description', 'Date', 'Amount', 'Type'],
    mapper: null,
  },
};

/** Convert FlipTrack weight fields to Whatnot shipping profile string */
function weightToWhatnotShipping(item) {
  const maj = parseFloat(item.weightMaj) || 0;
  const min = parseFloat(item.weightMin) || 0;
  const unit = (item.dimUnit || 'in').toLowerCase();

  let oz;
  if (unit === 'cm') {
    const grams = maj * 1000 + min;
    if (grams <= 0) return '';
    if (grams < 20) return '0 to <20 grams';
    if (grams < 100) return '20 to <100 grams';
    if (grams < 250) return '100 to <250 grams';
    if (grams < 500) return '250 to <500 grams';
    if (grams < 750) return '500 to <750 grams';
    if (grams < 1000) return '750 grams to <1 KGs';
    if (grams < 2000) return '1 KGs to <2 KGs';
    if (grams < 3000) return '2 KGs to <3 KGs';
    if (grams < 5000) return '3 KGs to <5 KGs';
    if (grams < 7000) return '5 KGs to <7 KGs';
    return '7 to <10 KGs';
  }

  oz = maj * 16 + min;
  if (oz <= 0) oz = parseFloat(item.weight) || 0;
  if (oz <= 0) return '';
  if (oz <= 1) return '0-1 oz';
  if (oz <= 3) return '1-3 oz';
  if (oz <= 7) return '4-7 oz';
  if (oz <= 11) return '8-11 oz';
  if (oz <= 15) return '12-15 oz';
  if (oz <= 16) return '1 lb';
  if (oz <= 32) return '1-2 lbs';
  if (oz <= 48) return '2-3 lbs';
  if (oz <= 64) return '3-4 lbs';
  if (oz <= 96) return '4-6 lbs';
  return '10-14 lbs';
}

function conditionToEBay(cond) {
  const map = {
    'New with Tags': 1000, 'New': 1000, 'Deadstock': 1000,
    'New without Tags': 1500, 'Open Box': 1500,
    'Like New': 2000, 'Refurbished': 2500,
    'Pre-Owned': 3000, 'Good': 3000,
    'Fair': 5000, 'Poor': 7000,
  };
  return map[cond] || 3000;
}

/** Neutralize spreadsheet formula injection — prefix cells starting with =, +, -, @ */
const _sanitizeCell = v => { const s = String(v); return /^[=+\-@]/.test(s) ? "'" + s : s; };

function escCSV(val) {
  const str = _sanitizeCell(String(val ?? ''));
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function downloadCSV(filename, columns, rows) {
  const header = columns.map(escCSV).join(',');
  const body = rows.map(row => columns.map(col => escCSV(row[col] ?? '')).join(',')).join('\r\n');
  const csv = header + '\r\n' + body;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportPlatformCSV(templateKey, filterPlatform) {
  const tpl = TEMPLATES[templateKey];
  if (!tpl) { toast('Unknown template', true); return; }

  let items = [...inv].filter(i => (i.qty || 0) > 0);

  if (filterPlatform) {
    items = items.filter(i => getPlatforms(i).some(p => p.toLowerCase().includes(filterPlatform.toLowerCase())));
  }

  if (!items.length) { toast('No matching items to export', true); return; }

  const rows = items.map(tpl.mapper);
  const filename = `fliptrack-${templateKey}-${localDate()}.${tpl.ext}`;
  downloadCSV(filename, tpl.columns, rows);
  toast(`Exported ${rows.length} items — ${tpl.name} format`);
}

const WHATNOT_CAT_MAP = {
  'clothing':             'Men\'s Fashion',
  'books':                'Books',
  'books & media':        'Books',
  'electronics':          'Electronics',
  'toys & games':         'Toys & Hobbies',
  'toys':                 'Toys & Hobbies',
  'home & garden':        'Home & Garden',
  'home':                 'Home & Garden',
  'office supplies':      'Home & Garden',
  'sports & outdoors':    'Outdoor Gear',
  'sports':               'Outdoor Gear',
  'outdoors':             'Outdoor Gear',
  'outdoor':              'Outdoor Gear',
  'collectibles':         'Collectibles',
  'health & beauty':      'Beauty',
  'health and beauty':    'Beauty',
  'beauty':               'Beauty',
  'crafts & diy':         'Arts & Handmade',
  'crafts':               'Arts & Handmade',
  'art & crafts':         'Arts & Handmade',
  'arts & crafts':        'Arts & Handmade',
  'diy':                  'Arts & Handmade',
  'sneakers':             'Sneakers & Streetwear',
  'footwear':             'Sneakers & Streetwear',
  'jewelry':              'Jewelry',
  'video games':          'Video Games',
  'media':                'Movies',
  'movies':               'Movies',
  'music':                'Music',
  'automotive':           'Car Parts',
  'car parts':            'Car Parts',
  'accessories':          'Bags & Accessories',
  'trading cards':        'Trading Card Games',
  'sports cards':         'Sports Cards',
  'coins':                'Coins & Money',
  'comics':               'Comics & Manga',
  'rocks & crystals':     'Rocks & Crystals',
  'pet supplies':         'Pet Supplies',
  'pets':                 'Pet Supplies',
  'food':                 'Food & Drink',
  'food & drink':         'Food & Drink',
};

const WHATNOT_SUBCAT_MAP = {
  'men':                      { cat: 'Men\'s Fashion',   sub: 'Men\'s Modern' },
  'mens':                     { cat: 'Men\'s Fashion',   sub: 'Men\'s Modern' },
  "men's":                    { cat: 'Men\'s Fashion',   sub: 'Men\'s Modern' },
  'women':                    { cat: 'Women\'s Fashion', sub: 'Women\'s Contemporary' },
  'womens':                   { cat: 'Women\'s Fashion', sub: 'Women\'s Contemporary' },
  'woman':                    { cat: 'Women\'s Fashion', sub: 'Women\'s Contemporary' },
  "women's":                  { cat: 'Women\'s Fashion', sub: 'Women\'s Contemporary' },
  'children':                 { cat: 'and Whatnot',      sub: '' },
  "kids":                     { cat: 'and Whatnot',      sub: '' },
  'footwear':                 { cat: 'Sneakers & Streetwear', sub: 'Other Sneakers' },
  "men's accessories":        { cat: 'Bags & Accessories', sub: 'Other Accessories' },
  "women's accessories":      { cat: 'Bags & Accessories', sub: 'Other Accessories' },
  'fiction':                  { cat: 'Books',            sub: 'Fiction' },
  'non-fiction':              { cat: 'Books',            sub: 'Non-Fiction' },
  'nonfiction':               { cat: 'Books',            sub: 'Non-Fiction' },
  'textbooks':                { cat: 'Books',            sub: 'Other Books' },
  'rare & collectible':       { cat: 'Books',            sub: 'Other Books' },
  'art & photography':        { cat: 'Books',            sub: 'Other Books' },
  'reference':                { cat: 'Books',            sub: 'Other Books' },
  'comics & graphic novels':  { cat: 'Comics & Manga',   sub: '' },
  'graphic novels':           { cat: 'Comics & Manga',   sub: '' },
  "children's books":         { cat: 'Books',            sub: "Children's Books" },
  'phones & tablets':         { cat: 'Electronics',      sub: 'Phones' },
  'phones':                   { cat: 'Electronics',      sub: 'Phones' },
  'tablets':                  { cat: 'Electronics',      sub: 'Phones' },
  'computers':                { cat: 'Electronics',      sub: 'Computers & Laptops' },
  'laptops':                  { cat: 'Electronics',      sub: 'Computers & Laptops' },
  'audio':                    { cat: 'Electronics',      sub: 'Audio' },
  'cameras':                  { cat: 'Electronics',      sub: 'Cameras' },
  'gaming':                   { cat: 'Video Games',      sub: 'Other Video Games' },
  'smart home':               { cat: 'Electronics',      sub: 'Smart Home' },
  'smart home accessories':   { cat: 'Electronics',      sub: 'Smart Home' },
  'tablet accessories':       { cat: 'Electronics',      sub: 'Other Electronics' },
  'storage & organization':   { cat: 'Home & Garden',    sub: 'Other Home & Garden' },
  'action figures':           { cat: 'Toys & Hobbies',   sub: 'Action Figures' },
  'board games':              { cat: 'Toys & Hobbies',   sub: 'Board Games & Puzzles' },
  'building sets':            { cat: 'Toys & Hobbies',   sub: 'Building Sets (LEGO)' },
  'lego':                     { cat: 'Toys & Hobbies',   sub: 'Building Sets (LEGO)' },
  'dolls':                    { cat: 'Toys & Hobbies',   sub: 'Dolls' },
  'puzzles':                  { cat: 'Toys & Hobbies',   sub: 'Board Games & Puzzles' },
  'collectible toys':         { cat: 'Toys & Hobbies',   sub: 'Other Toys' },
  'outdoor toys':             { cat: 'Outdoor Gear',     sub: 'Other Outdoor Gear' },
  'educational/science kits': { cat: 'Toys & Hobbies',   sub: 'Other Toys' },
  'educational/math manipulatives': { cat: 'Toys & Hobbies', sub: 'Other Toys' },
  'mystery toy':              { cat: 'Toys & Hobbies',   sub: 'Other Toys' },
  'inflatable toys':          { cat: 'Toys & Hobbies',   sub: 'Other Toys' },
  'kitchen':                  { sub: 'Kitchen' },
  'decor':                    { sub: 'Decor' },
  'furniture':                { sub: 'Furniture' },
  'bedding':                  { sub: 'Bedding & Bath' },
  'bath':                     { sub: 'Bedding & Bath' },
  'tools':                    { sub: 'Tools & Hardware' },
  'garden':                   { sub: 'Garden' },
  'fitness':                  { cat: 'Outdoor Gear',     sub: 'Fitness' },
  'cycling':                  { cat: 'Outdoor Gear',     sub: 'Other Outdoor Gear' },
  'camping':                  { cat: 'Outdoor Gear',     sub: 'Other Outdoor Gear' },
  'team sports':              { cat: 'Outdoor Gear',     sub: 'Other Outdoor Gear' },
  'water sports':             { cat: 'Outdoor Gear',     sub: 'Other Outdoor Gear' },
  'winter sports':            { cat: 'Outdoor Gear',     sub: 'Other Outdoor Gear' },
  'golf':                     { cat: 'Outdoor Gear',     sub: 'Golf' },
  'golf accessories':         { cat: 'Outdoor Gear',     sub: 'Golf' },
  'yoga equipment':           { cat: 'Outdoor Gear',     sub: 'Other Outdoor Gear' },
  'fitness equipment':        { cat: 'Outdoor Gear',     sub: 'Other Outdoor Gear' },
  'marine electronics':       { cat: 'Outdoor Gear',     sub: 'Other Outdoor Gear' },
  'trading cards':            { cat: 'Trading Card Games', sub: '' },
  'coins & currency':         { cat: 'Coins & Money',    sub: '' },
  'stamps':                   { cat: 'Collectibles',     sub: 'Other Collectibles' },
  'figurines':                { cat: 'Collectibles',     sub: 'Other Collectibles' },
  'memorabilia':              { cat: 'Collectibles',     sub: 'Memorabilia' },
  'vintage':                  { cat: 'Collectibles',     sub: 'Vintage' },
  'antiques':                 { cat: 'Collectibles',     sub: 'Antiques' },
  'skincare':                 { cat: 'Beauty',           sub: 'Skincare' },
  'skin care':                { cat: 'Beauty',           sub: 'Skincare' },
  'makeup':                   { cat: 'Beauty',           sub: 'Makeup & Cosmetics' },
  'cosmetics':                { cat: 'Beauty',           sub: 'Makeup & Cosmetics' },
  'makeup & cosmetics':       { cat: 'Beauty',           sub: 'Makeup & Cosmetics' },
  'hair care':                { cat: 'Beauty',           sub: 'Hair Care' },
  "men's hair care":          { cat: 'Beauty',           sub: 'Hair Care' },
  "women's hair care":        { cat: 'Beauty',           sub: 'Hair Care' },
  'fragrance':                { cat: 'Beauty',           sub: 'Fragrances' },
  'fragrances':               { cat: 'Beauty',           sub: 'Fragrances' },
  'perfume':                  { cat: 'Beauty',           sub: 'Fragrances' },
  'cologne':                  { cat: 'Beauty',           sub: 'Fragrances' },
  'nail care':                { cat: 'Beauty',           sub: 'Nail Care' },
  'body care':                { cat: 'Beauty',           sub: 'Body Care' },
  'personal care':            { cat: 'Beauty',           sub: 'Other Beauty' },
  'sewing':                   { cat: 'Arts & Handmade',  sub: 'Sewing' },
  'art supplies':             { cat: 'Arts & Handmade',  sub: 'Art Supplies' },
  'scrapbooking':             { cat: 'Arts & Handmade',  sub: 'Other Craft Supplies' },
  'knitting & crochet':       { cat: 'Arts & Handmade',  sub: 'Other Craft Supplies' },
  'beading & jewelry':        { cat: 'Arts & Handmade',  sub: 'Beads, Pens & Keychains' },
  'stationery':               { cat: 'Arts & Handmade',  sub: 'Other Craft Supplies' },
  'notebooks & journals':     { cat: 'Arts & Handmade',  sub: 'Other Craft Supplies' },
  'notebook':                 { cat: 'Arts & Handmade',  sub: 'Other Craft Supplies' },
  'journal':                  { cat: 'Arts & Handmade',  sub: 'Other Craft Supplies' },
  'keychains':                { cat: 'Arts & Handmade',  sub: 'Beads, Pens & Keychains' },
  'keychain':                 { cat: 'Arts & Handmade',  sub: 'Beads, Pens & Keychains' },
  'keychains & bag charms':   { cat: 'Arts & Handmade',  sub: 'Beads, Pens & Keychains' },
  'keychain/bag charm':       { cat: 'Arts & Handmade',  sub: 'Beads, Pens & Keychains' },
  'keychain & bag charm':     { cat: 'Arts & Handmade',  sub: 'Beads, Pens & Keychains' },
  'bag charm':                { cat: 'Arts & Handmade',  sub: 'Beads, Pens & Keychains' },
  'nike':                     { cat: 'Sneakers & Streetwear', sub: 'Nike' },
  'adidas':                   { cat: 'Sneakers & Streetwear', sub: 'Adidas' },
  'yeezy':                    { cat: 'Sneakers & Streetwear', sub: 'Adidas' },
  'jordan':                   { cat: 'Sneakers & Streetwear', sub: 'Jordan' },
  'new balance':              { cat: 'Sneakers & Streetwear', sub: 'New Balance' },
  'converse':                 { cat: 'Sneakers & Streetwear', sub: 'Other Sneakers' },
  'vans':                     { cat: 'Sneakers & Streetwear', sub: 'Other Sneakers' },
  'other brands':             { cat: 'Sneakers & Streetwear', sub: 'Other Sneakers' },
  'designer':                 { cat: 'Sneakers & Streetwear', sub: 'Other Sneakers' },
  'necklaces':                { cat: 'Jewelry',          sub: 'Necklaces' },
  'rings':                    { cat: 'Jewelry',          sub: 'Rings' },
  'bracelets':                { cat: 'Jewelry',          sub: 'Bracelets' },
  'earrings':                 { cat: 'Jewelry',          sub: 'Earrings' },
  'watches':                  { cat: 'Jewelry',          sub: 'Watches' },
  'fine jewelry':             { cat: 'Jewelry',          sub: 'Fine Jewelry' },
  'costume jewelry':          { cat: 'Jewelry',          sub: 'Costume Jewelry' },
  'jewelry':                  { cat: 'Jewelry',          sub: '' },
  'playstation':              { cat: 'Video Games',      sub: 'PlayStation' },
  'xbox':                     { cat: 'Video Games',      sub: 'Xbox' },
  'nintendo':                 { cat: 'Video Games',      sub: 'Nintendo' },
  'pc gaming':                { cat: 'Video Games',      sub: 'PC Gaming' },
  'retro':                    { cat: 'Video Games',      sub: 'Retro Gaming' },
  'retro gaming':             { cat: 'Video Games',      sub: 'Retro Gaming' },
  'vinyl records':            { cat: 'Music',            sub: 'Vinyl' },
  'vinyl':                    { cat: 'Music',            sub: 'Vinyl' },
  'cds':                      { cat: 'Music',            sub: 'CDs' },
  'cassettes':                { cat: 'Music',            sub: 'Cassettes' },
  'dvds & blu-ray':           { cat: 'Movies',           sub: 'DVDs' },
  'dvds':                     { cat: 'Movies',           sub: 'DVDs' },
  'dvd':                      { cat: 'Movies',           sub: 'DVDs' },
  'blu-ray':                  { cat: 'Movies',           sub: 'Blu-Rays' },
  'vhs':                      { cat: 'Movies',           sub: 'VHS' },
  'bags':                     { sub: 'Handbags' },
  'handbags':                 { sub: 'Handbags' },
  'luxury leather goods':     { sub: 'Handbags' },
  'wallets':                  { sub: 'Wallets & Card Cases' },
  'sunglasses':               { sub: 'Sunglasses' },
  'belts':                    { sub: 'Belts' },
  'travel accessories':       { sub: 'Other Accessories' },
  'hats':                     { cat: 'Men\'s Fashion',   sub: 'Men\'s Hats & Caps' },
  'hats & caps':              { cat: 'Men\'s Fashion',   sub: 'Men\'s Hats & Caps' },
  "men's hats":               { cat: 'Men\'s Fashion',   sub: 'Men\'s Hats & Caps' },
  "women's hats":             { cat: 'Women\'s Fashion', sub: 'Women\'s Hats & Caps' },
  "men's ties":               { cat: 'Men\'s Fashion',   sub: "Men's Ties & Bow Ties" },
  'ties':                     { cat: 'Men\'s Fashion',   sub: "Men's Ties & Bow Ties" },
  'tie':                      { cat: 'Men\'s Fashion',   sub: "Men's Ties & Bow Ties" },
  'engine parts':             { cat: 'Car Parts',        sub: 'Other Car Parts' },
  'fuel system':              { cat: 'Car Parts',        sub: 'Other Car Parts' },
  'car care products':        { cat: 'Car Parts',        sub: 'Other Car Parts' },
  'barware':                  { cat: 'and Whatnot',      sub: 'Breweriana' },
};

function mapWhatnotCatSub(cat, sub) {
  const catKey = (cat || '').toLowerCase().trim();
  const subKey = (sub || '').toLowerCase().trim();

  let mappedCat = WHATNOT_CAT_MAP[catKey] || 'and Whatnot';
  let mappedSub = '';

  if (catKey === 'clothing' && subKey) {
    if (/women|woman/.test(subKey)) { mappedCat = 'Women\'s Fashion'; mappedSub = 'Women\'s Contemporary'; }
    else if (/\bmen\b|^mens$|^man$/.test(subKey)) { mappedCat = 'Men\'s Fashion'; mappedSub = 'Men\'s Modern'; }
    else if (/footwear|shoe|sneaker|boot|heel|sandal/.test(subKey)) { mappedCat = 'Sneakers & Streetwear'; mappedSub = 'Other Sneakers'; }
  }

  if (catKey === 'media' && subKey) {
    if (/vinyl|record/.test(subKey)) { mappedCat = 'Music'; mappedSub = 'Vinyl'; }
    else if (/cd|compact disc/.test(subKey)) { mappedCat = 'Music'; mappedSub = 'CDs'; }
    else if (/cassette/.test(subKey)) { mappedCat = 'Music'; mappedSub = 'Cassettes'; }
    else if (/dvd|blu.ray/.test(subKey)) { mappedCat = 'Movies'; mappedSub = 'DVDs'; }
    else if (/vhs/.test(subKey)) { mappedCat = 'Movies'; mappedSub = 'VHS'; }
  }

  if (subKey) {
    const override = WHATNOT_SUBCAT_MAP[subKey];
    if (override) {
      if (override.cat) mappedCat = override.cat;
      mappedSub = override.sub ?? mappedSub;
    }
  }

  if (!mappedSub && mappedCat && mappedCat !== 'and Whatnot') {
    const catDefaults = {
      'Men\'s Fashion':      'Men\'s Modern',
      'Women\'s Fashion':    'Women\'s Contemporary',
      'Electronics':         'Other Electronics',
      'Toys & Hobbies':      'Other Toys',
      'Home & Garden':       'Other Home & Garden',
      'Outdoor Gear':        'Other Outdoor Gear',
      'Collectibles':        'Other Collectibles',
      'Beauty':              'Other Beauty',
      'Arts & Handmade':     'Other Craft Supplies',
      'Sneakers & Streetwear': 'Other Sneakers',
      'Bags & Accessories':  'Other Accessories',
      'Video Games':         'Other Video Games',
      'Books':               'Other Books',
      'Movies':              'Other Movies',
      'Music':               'Other Music',
      'Jewelry':             'Other Jewelry',
      'Trading Card Games':  'Other Trading Cards',
      'Car Parts':           'Other Car Parts',
    };
    mappedSub = catDefaults[mappedCat] || '';
  }

  return { cat: mappedCat, sub: mappedSub };
}

/**
 * Export inventory as Whatnot-compatible CSV matching their official template exactly.
 */
export function exportWhatnotCSV() {
  let items = [...inv].filter(i => (i.qty || 0) > 0);
  if (!items.length) { toast('No items to export', true); return; }

  const tpl = TEMPLATES.whatnot;
  const header = tpl.columns.join(',');
  const lines = [header];
  for (const item of items) {
    const mapped = mapWhatnotCatSub(item.category, item.subcategory);
    const row = tpl.mapper({ ...item, category: mapped.cat, subcategory: mapped.sub });
    const vals = tpl.columns.map(col => {
      const v = String(row[col] ?? '');
      if (v.includes(',') || v.includes('"') || v.includes('\n') || v.includes('\r')) {
        return '"' + v.replace(/"/g, '""') + '"';
      }
      return v;
    });
    lines.push(vals.join(','));
  }
  const csv = lines.join('\r\n') + '\r\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Whatnot — CSV Template - Template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast(`Exported ${items.length} items — Whatnot format`);
}

/**
 * Export sales report
 */
export function exportSalesCSV() {
  const tpl = TEMPLATES.sales_report;
  const rows = sales.map(s => {
    const item = getInvItem(s.itemId);
    const cost = item ? (item.cost || 0) * (s.qty || 1) : 0;
    const revenue = (s.price || 0) * (s.qty || 1);
    const profit = revenue - cost - (s.fees || 0) - (s.ship || 0);
    return {
      'Date': s.date || '',
      'Item Name': item ? item.name : 'Unknown',
      'SKU': item ? (item.sku || '') : '',
      'Platform': s.platform || '',
      'Sale Price': revenue.toFixed(2),
      'Quantity': s.qty || 1,
      'Fees': (s.fees || 0).toFixed(2),
      'Shipping': (s.ship || 0).toFixed(2),
      'Item Cost': cost.toFixed(2),
      'Profit': profit.toFixed(2),
    };
  });

  if (!rows.length) { toast('No sales to export', true); return; }
  downloadCSV(`fliptrack-sales-${localDate()}.csv`, tpl.columns, rows);
  toast(`Exported ${rows.length} sales`);
}

/**
 * Export tax summary
 */
export function exportTaxCSV() {
  const tpl = TEMPLATES.tax_export;
  const rows = [];

  // Sales as income
  for (const s of sales) {
    const item = getInvItem(s.itemId);
    rows.push({
      'Category': 'Revenue',
      'Description': item ? item.name : 'Sale',
      'Date': s.date || '',
      'Amount': ((s.price || 0) * (s.qty || 1)).toFixed(2),
      'Type': 'Income',
    });
  }

  // Expenses as deductions
  for (const e of expenses) {
    rows.push({
      'Category': e.category || 'Expense',
      'Description': e.desc || '',
      'Date': e.date || '',
      'Amount': (e.amount || 0).toFixed(2),
      'Type': 'Expense',
    });
  }

  if (!rows.length) { toast('No data to export', true); return; }
  downloadCSV(`fliptrack-tax-${localDate()}.csv`, tpl.columns, rows);
  toast(`Exported ${rows.length} tax records`);
}

/**
 * Export show prep list as CSV.
 */
export function exportShowPrepCSV(showId) {
  const show = getShow(showId);
  if (!show) { toast('Show not found', true); return; }

  const columns = ['#', 'Item Name', 'Category', 'Condition', 'List Price', 'Cost', 'Talking Points', 'Notes'];
  const rows = show.items.map((itemId, i) => {
    const item = getInvItem(itemId);
    if (!item) return null;
    return {
      '#': i + 1,
      'Item Name': item.name || '',
      'Category': item.category || '',
      'Condition': item.condition || '',
      'List Price': (item.price || 0).toFixed(2),
      'Cost': (item.cost || 0).toFixed(2),
      'Talking Points': getItemNote(showId, itemId) || '',
      'Notes': item.notes || '',
    };
  }).filter(Boolean);

  if (!rows.length) { toast('No items in show', true); return; }
  downloadCSV(`whatnot-prep-${show.name.replace(/\s+/g, '-').slice(0, 20)}-${show.date || 'undated'}.csv`, columns, rows);
  toast(`Exported prep list — ${rows.length} items`);
}

/**
 * Export show results as CSV.
 */
export function exportShowResultsCSV(showId) {
  const show = getShow(showId);
  if (!show) { toast('Show not found', true); return; }

  const feeRate = PLATFORM_FEES?.Whatnot || 0.089;
  const columns = ['Item Name', 'Status', 'Sale Price', 'Cost', 'Whatnot Fee', 'Profit', 'Category', 'Condition'];
  const rows = show.items.map(itemId => {
    const item = getInvItem(itemId);
    if (!item) return null;
    const sold = show.soldItems?.[itemId];
    const salePrice = sold ? sold.price : 0;
    const cost = item.cost || 0;
    const fee = salePrice * feeRate;
    const profit = sold ? salePrice - cost - fee : 0;
    return {
      'Item Name': item.name || '',
      'Status': sold ? 'Sold' : 'Unsold',
      'Sale Price': sold ? salePrice.toFixed(2) : '',
      'Cost': cost.toFixed(2),
      'Whatnot Fee': sold ? fee.toFixed(2) : '',
      'Profit': sold ? profit.toFixed(2) : '',
      'Category': item.category || '',
      'Condition': item.condition || '',
    };
  }).filter(Boolean);

  if (!rows.length) { toast('No items in show', true); return; }
  downloadCSV(`whatnot-results-${show.name.replace(/\s+/g, '-').slice(0, 20)}-${show.date || 'undated'}.csv`, columns, rows);
  toast(`Exported show results — ${rows.length} items`);
}

/**
 * Export all shows summary as CSV.
 */
export function exportAllShowsCSV() {
  const ended = getEndedShows();
  if (!ended.length) { toast('No completed shows to export', true); return; }

  const columns = ['Show Name', 'Date', 'Items', 'Sold', 'Sell-Through%', 'Revenue', 'Profit', 'Duration (hrs)'];
  const rows = ended.map(show => {
    const m = getShowMetrics(show);
    return {
      'Show Name': show.name || '',
      'Date': show.date || '',
      'Items': m.itemCount,
      'Sold': m.soldCount,
      'Sell-Through%': (m.sellThrough * 100).toFixed(1),
      'Revenue': m.revenue.toFixed(2),
      'Profit': m.profit.toFixed(2),
      'Duration (hrs)': m.duration.toFixed(1),
    };
  });

  downloadCSV(`whatnot-all-shows-${localDate()}.csv`, columns, rows);
  toast(`Exported ${rows.length} shows`);
}

/**
 * Get list of available templates for UI
 */
export function getCSVTemplates() {
  return Object.entries(TEMPLATES).map(([key, tpl]) => ({
    key,
    name: tpl.name,
  }));
}

/**
 * Render the CSV export panel (for dashboard or reports view)
 */
export function renderCSVExportPanel() {
  const platforms = [
    { key: 'ebay', label: 'eBay File Exchange', icon: '🏷' },
    { key: 'poshmark', label: 'Poshmark', icon: '👗' },
    { key: 'mercari', label: 'Mercari', icon: '📦' },
    { key: 'depop', label: 'Depop', icon: '🛍' },
  ];

  return `<div class="csv-export-panel">
    <div class="csv-export-title">Export for Platform</div>
    <div class="csv-export-grid">
      ${platforms.map(p => `<button class="csv-btn" onclick="exportPlatformCSV('${p.key}')">
        <span>${p.icon}</span> ${p.label}
      </button>`).join('')}
      <button class="csv-btn" onclick="exportWhatnotCSV()">
        <span>🎬</span> Whatnot
      </button>
    </div>
    <div class="csv-export-divider"></div>
    <div class="csv-export-grid">
      <button class="csv-btn csv-btn-secondary" onclick="exportPlatformCSV('generic')">📋 Full Inventory</button>
      <button class="csv-btn csv-btn-secondary" onclick="exportSalesCSV()">💰 Sales Report</button>
      <button class="csv-btn csv-btn-secondary" onclick="exportTaxCSV()">🧾 Tax Summary</button>
      <button class="csv-btn csv-btn-secondary" onclick="exportAllShowsCSV()">🎬 All Whatnot Shows</button>
    </div>
  </div>`;
}
