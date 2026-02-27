/**
 * listing-templates.js — Listing title/description templates
 * Stores reusable templates for generating listing text across platforms.
 */

import { getMeta, setMeta } from '../data/idb.js';
import { toast } from '../utils/dom.js';
import { uid } from '../utils/format.js';

// ── IN-MEMORY TEMPLATE STORE ───────────────────────────────────────────────

let _templates = [];

/**
 * Load templates from IDB meta store.
 */
export async function initTemplates() {
  try {
    const saved = await getMeta('listing_templates');
    if (Array.isArray(saved)) _templates = saved;
    else _templates = [...DEFAULT_TEMPLATES];
  } catch {
    _templates = [...DEFAULT_TEMPLATES];
  }
}

/**
 * Save templates to IDB.
 */
async function _saveTemplates() {
  try {
    await setMeta('listing_templates', _templates);
  } catch (e) {
    console.warn('FlipTrack: template save failed:', e.message);
  }
}

/**
 * Get all templates.
 */
export function getTemplates() {
  return _templates;
}

/**
 * Get templates filtered by category.
 */
export function getTemplatesForCategory(category) {
  if (!category) return _templates;
  return _templates.filter(t =>
    !t.category || t.category === 'All' || t.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get a template by ID.
 */
export function getTemplate(id) {
  return _templates.find(t => t.id === id) || null;
}

/**
 * Add a new template.
 */
export function addTemplate(template) {
  const t = {
    id: uid(),
    name: template.name || 'Untitled Template',
    category: template.category || 'All',
    titleFormula: template.titleFormula || '{name}',
    descriptionTemplate: template.descriptionTemplate || '',
    platforms: template.platforms || [],
    tags: template.tags || [],
    createdAt: Date.now(),
    isDefault: false
  };
  _templates.push(t);
  _saveTemplates();
  return t;
}

/**
 * Update an existing template.
 */
export function updateTemplate(id, changes) {
  const t = _templates.find(x => x.id === id);
  if (!t) return null;
  Object.assign(t, changes, { id }); // prevent id overwrite
  _saveTemplates();
  return t;
}

/**
 * Delete a template.
 */
export function deleteTemplate(id) {
  const idx = _templates.findIndex(t => t.id === id);
  if (idx === -1) return false;
  _templates.splice(idx, 1);
  _saveTemplates();
  return true;
}

// ── DEFAULT TEMPLATES ──────────────────────────────────────────────────────

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-clothing',
    name: 'Clothing — Standard',
    category: 'Clothing',
    titleFormula: '{name} - {condition} - {subcategory}',
    descriptionTemplate: `{name}

Condition: {condition}
Category: {category} > {subcategory}
{notes}

Ships fast! Bundle and save. Check out my other listings!`,
    platforms: [],
    tags: ['clothing', 'apparel'],
    isDefault: true
  },
  {
    id: 'tpl-books',
    name: 'Books — Standard',
    category: 'Books',
    titleFormula: '{name} by {author} - {condition}',
    descriptionTemplate: `{name}
Author: {author}
ISBN: {isbn}
Condition: {condition}

{notes}

Ships in 1-2 business days. Check my store for more titles!`,
    platforms: [],
    tags: ['books', 'reading'],
    isDefault: true
  },
  {
    id: 'tpl-electronics',
    name: 'Electronics — Standard',
    category: 'Electronics',
    titleFormula: '{name} - {condition} - Tested & Working',
    descriptionTemplate: `{name}

Condition: {condition}
UPC: {upc}

{notes}

Tested and verified working. Ships securely padded.
Dimensions: {dimensions}
Weight: {weight}`,
    platforms: [],
    tags: ['electronics', 'tech'],
    isDefault: true
  },
  {
    id: 'tpl-general',
    name: 'General — All Categories',
    category: 'All',
    titleFormula: '{name} - {condition}',
    descriptionTemplate: `{name}

Condition: {condition}
{notes}

Fast shipping! Bundle discounts available.`,
    platforms: [],
    tags: ['general'],
    isDefault: true
  },
  {
    id: 'tpl-ebay-seo',
    name: 'eBay SEO Optimized',
    category: 'All',
    titleFormula: '{name} {condition} {category} {subcategory} Ships Free',
    descriptionTemplate: `{name}

▸ Condition: {condition}
▸ Category: {category}
▸ UPC: {upc}

{notes}

★ FAST & FREE SHIPPING ★
★ 30-DAY RETURNS ★
★ CHECK MY OTHER LISTINGS ★`,
    platforms: ['eBay'],
    tags: ['ebay', 'seo'],
    isDefault: true
  },
  {
    id: 'tpl-posh',
    name: 'Poshmark Style',
    category: 'Clothing',
    titleFormula: '{name} {subcategory} {condition}',
    descriptionTemplate: `{name}

{condition} condition
{notes}

❤ Bundle for discount!
❤ Offers welcome!
❤ Ships next business day!`,
    platforms: ['Poshmark'],
    tags: ['poshmark', 'fashion'],
    isDefault: true
  }
];
