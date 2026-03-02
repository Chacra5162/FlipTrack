/**
 * deep-links.js — Platform listing deep links
 * Generates URLs to create new listings on each platform,
 * and copies listing text to clipboard.
 */

import { escHtml } from '../utils/format.js';
import { getPlatforms } from './platforms.js';
import { toast } from '../utils/dom.js';

// ── PLATFORM DEEP LINK BUILDERS ────────────────────────────────────────────

const enc = encodeURIComponent;

const PLATFORM_LINKS = {
  'eBay': (item) => {
    const title = enc((item.name || '').slice(0, 80));
    return `https://www.ebay.com/sell/create?item_title=${title}`;
  },
  'Poshmark': () => `https://poshmark.com/create-listing`,
  'Mercari': () => `https://www.mercari.com/sell/`,
  'Depop': () => `https://www.depop.com/products/create/`,
  'Etsy': () => `https://www.etsy.com/your/shops/me/tools/listings/create`,
  'Facebook Marketplace': () => `https://www.facebook.com/marketplace/create/item/`,
  'Amazon': () => `https://sellercentral.amazon.com/product-search/search`,
  'Grailed': () => `https://www.grailed.com/sell`,
  'StockX': () => `https://stockx.com/sell`,
  'GOAT': () => `https://www.goat.com/sell`,
  'Vinted': () => `https://www.vinted.com/items/new`,
  'The RealReal': () => `https://www.therealreal.com/consign`,
  'Vestiaire Collective': () => `https://www.vestiairecollective.com/sell/`,
  'Reverb': () => `https://reverb.com/sell`,
  'Discogs': () => `https://www.discogs.com/sell/list`,
  'Craigslist': () => `https://post.craigslist.org/`,
  'OfferUp': () => `https://offerup.com/post`,
  'Nextdoor': () => `https://nextdoor.com/for_sale_and_free/`,
  'Whatnot': () => `https://www.whatnot.com/sell`,
  'TikTok Shop': () => `https://seller-us.tiktok.com/`,
  'Instagram': () => `https://www.instagram.com/`,
  'Shopify': () => `https://admin.shopify.com/`,
  'Walmart Marketplace': () => `https://seller.walmart.com/`,
  'Newegg': () => `https://seller.newegg.com/`,
  'Bonanza': () => `https://www.bonanza.com/booths/items/new`,
  'Ruby Lane': () => `https://www.rubylane.com/`,
  'Chairish': () => `https://www.chairish.com/consign`,
  '1stDibs': () => `https://www.1stdibs.com/dealers/`,
  'Swappa': () => `https://swappa.com/sell`,
  'Decluttr': () => `https://www.decluttr.com/sell-my-stuff`,
};

/**
 * Generate a deep link URL for listing an item on a platform.
 * @param {string} platform
 * @param {Object} item - Inventory item object
 * @returns {string} URL to open
 */
export function generateListingLink(platform, item) {
  // If item already has a URL for this platform, prefer that
  if (item.url && getPlatforms(item).length === 1) return item.url;
  const builder = PLATFORM_LINKS[platform];
  if (builder) return builder(item);
  // Fallback: search for the item name on the platform
  return `https://www.google.com/search?q=${enc(platform + ' sell ' + (item.name || ''))}`;
}

/**
 * Generate listing text from an item (for clipboard copy).
 * Uses template if provided, otherwise builds default description.
 * @param {Object} item
 * @param {Object} [template] - Listing template with titleFormula & descriptionTemplate
 * @returns {{ title: string, description: string }}
 */
export function generateListingText(item, template) {
  const placeholders = {
    '{name}': item.name || '',
    '{condition}': item.condition || 'Good',
    '{category}': item.category || '',
    '{subcategory}': item.subcategory || '',
    '{subtype}': item.subtype || '',
    '{sku}': item.sku || '',
    '{upc}': item.upc || '',
    '{price}': item.price ? `$${item.price.toFixed(2)}` : '',
    '{source}': item.source || '',
    '{notes}': item.notes || '',
    '{dimensions}': (item.dimL && item.dimW && item.dimH) 
      ? `${item.dimL} × ${item.dimW} × ${item.dimH} ${item.dimUnit || 'in'}` : '',
    '{weight}': item.weight ? `${item.weight} ${item.dimUnit === 'cm' ? 'kg' : 'lb'}` : '',
    '{author}': item.author || '',
    '{isbn}': item.isbn || '',
  };

  const expand = (str) => {
    let result = str;
    for (const [key, val] of Object.entries(placeholders)) {
      result = result.replaceAll(key, val);
    }
    // Clean up empty placeholders and double spaces
    return result.replace(/\s{2,}/g, ' ').trim();
  };

  if (template) {
    return {
      title: expand(template.titleFormula || '{name}'),
      description: expand(template.descriptionTemplate || '')
    };
  }

  // Default listing text
  const title = item.name || 'Item';
  const parts = [];
  if (item.condition) parts.push(`Condition: ${item.condition}`);
  if (item.category) parts.push(`Category: ${item.category}`);
  if (item.subcategory) parts.push(`Subcategory: ${item.subcategory}`);
  if (item.upc) parts.push(`UPC: ${item.upc}`);
  if (item.notes) parts.push(`\n${item.notes}`);
  parts.push('\nShips fast! Check my other listings for bundle deals.');

  return { title, description: parts.join('\n') };
}

/**
 * Copy listing text to clipboard for pasting into platform listing form.
 */
export async function copyListingText(item, template) {
  const { title, description } = generateListingText(item, template);
  const text = `${title}\n\n${description}`;
  try {
    await navigator.clipboard.writeText(text);
    toast('Listing text copied to clipboard ✓');
    return true;
  } catch (e) {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('Listing text copied ✓'); } 
    catch { toast('Copy failed — select text manually', true); }
    document.body.removeChild(ta);
    return false;
  }
}
