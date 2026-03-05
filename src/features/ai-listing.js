/**
 * ai-listing.js — AI-Powered Title & Description Generator
 * Uses the Anthropic proxy Edge Function to generate optimized
 * listing titles and descriptions for marketplace platforms.
 */

import { getInvItem, markDirty, save } from '../data/store.js';
import { toast } from '../utils/dom.js';
import { escHtml, fmt } from '../utils/format.js';
import { getPlatforms } from './platforms.js';

// ── STATE ─────────────────────────────────────────────────────────────────
let _sb = null;
let _generating = false;

/**
 * Initialize with Supabase client for auth headers.
 * @param {Object} supabaseClient
 */
export function initAIListing(supabaseClient) {
  _sb = supabaseClient;
}

/**
 * Generate an optimized listing title and description using AI.
 * Uses _sb.functions.invoke which automatically sends apikey + auth headers.
 */
export async function generateListing(item, opts = {}) {
  if (_generating) throw new Error('Already generating — please wait');
  if (!_sb) throw new Error('Sign in to use AI features');

  _generating = true;

  try {
    const platform = opts.platform || getPlatforms(item)[0] || 'eBay';
    const tone = opts.tone || 'professional';

    const prompt = _buildPrompt(item, platform, tone, opts.includeKeywords !== false);

    const { data, error } = await _sb.functions.invoke('anthropic-proxy', {
      body: {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      },
    });

    if (error) throw new Error(error.message || 'AI request failed');
    if (data?.error) throw new Error(data.error);

    const text = data?.content?.[0]?.text || '';
    if (!text) throw new Error('Empty AI response');

    return _parseResponse(text);
  } finally {
    _generating = false;
  }
}

/**
 * Build the prompt for the AI.
 */
function _buildPrompt(item, platform, tone, includeKeywords) {
  const details = [];
  if (item.name) details.push(`Item: ${item.name}`);
  if (item.category) details.push(`Category: ${item.category}`);
  if (item.subcategory) details.push(`Subcategory: ${item.subcategory}`);
  if (item.condition) details.push(`Condition: ${item.condition}`);
  // Notes are private — never feed to AI or include in public listings
  if (item.upc) details.push(`UPC: ${item.upc}`);
  if (item.isbn) details.push(`ISBN: ${item.isbn}`);
  if (item.author) details.push(`Author: ${item.author}`);
  if (item.price) details.push(`Price: $${item.price}`);
  if (item.dimL && item.dimW && item.dimH) {
    details.push(`Dimensions: ${item.dimL} × ${item.dimW} × ${item.dimH} ${item.dimUnit || 'in'}`);
  }
  if (item.weight) details.push(`Weight: ${item.weight} ${item.dimUnit === 'cm' ? 'kg' : 'lb'}`);

  // Add brand/color/size/material to details for richer descriptions
  if (item.brand && item.brand !== 'Unbranded') details.push(`Brand: ${item.brand}`);
  if (item.color) details.push(`Color: ${item.color}`);
  if (item.size) details.push(`Size: ${item.size}`);
  if (item.material) details.push(`Material: ${item.material}`);
  if (item.style) details.push(`Style: ${item.style}`);
  if (item.model) details.push(`Model: ${item.model}`);

  const platformRules = {
    'eBay': 'eBay: max 80 char title, include brand/model/key specs. Description should be detailed HTML-safe text. Focus on product features and specifications.',
    'Poshmark': `Poshmark: max 80 char title with brand name first.
DESCRIPTION MUST include these sections in this order:
1. Opening hook — 1-2 sentences about the item (e.g. "Gorgeous [brand] [item]!")
2. Details — bullet style with brand, size, color, material, measurements if known
3. Condition — honest, specific (NWT, NWOT, EUC, GUC, etc.)
4. Style tip — suggest how to wear/style it
5. Closing — "Bundle for a discount!" or similar Poshmark-style CTA
TONE: Friendly, enthusiastic, like a boutique owner. Use phrases like "So cute!", "Gorgeous!", "Perfect for..."
DO NOT use hashtags. Poshmark uses style tags separately.`,
    'Mercari': `Mercari: max 80 char title, brand + key detail + size.
DESCRIPTION should be:
1. Short and honest — Mercari buyers value transparency
2. Start with what the item is in 1 sentence
3. List key details: brand, size, color, material, condition
4. Mention any flaws honestly — builds trust and prevents returns
5. End with "Ships fast! Message me with any questions."
TONE: Casual, direct, trustworthy. No hype — just honest details.
Keep it under 150 words. Mercari shoppers skim quickly.`,
    'Depop': 'Depop: trendy, hashtag-friendly. Use Gen-Z friendly language. Include style/aesthetic references. Add 5+ hashtags at the end.',
    'Etsy': 'Etsy: include relevant search terms. Description should tell a story about the item. Emphasize uniqueness.',
    'Facebook Marketplace': 'Facebook Marketplace: casual, local-friendly. Mention pickup/shipping availability.',
    'Amazon': 'Amazon: bullet-point style features. Focus on product specifications and condition details.',
  };

  return `You are an expert reseller listing copywriter. Generate an optimized marketplace listing.

ITEM DETAILS:
${details.join('\n')}

PLATFORM: ${platform}
${platformRules[platform] || ''}

TONE: ${tone}

REQUIREMENTS:
- Generate a compelling title (under 80 characters)
- Generate a detailed description (150-300 words)
${includeKeywords ? '- Include 5-8 relevant search keywords' : ''}
- Include condition details and any flaws
- End with a call to action

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
TITLE: [your title here]
DESCRIPTION:
[your description here]
${includeKeywords ? 'KEYWORDS: [comma-separated keywords]' : ''}
SEO_TIPS: [2-3 tips for better listing visibility]`;
}

/**
 * Parse the AI response into structured data.
 */
function _parseResponse(text) {
  const titleMatch = text.match(/TITLE:\s*(.+?)(?:\n|$)/);
  const descMatch = text.match(/DESCRIPTION:\s*([\s\S]*?)(?=KEYWORDS:|SEO_TIPS:|$)/);
  const kwMatch = text.match(/KEYWORDS:\s*(.+?)(?:\n|$)/);
  const tipsMatch = text.match(/SEO_TIPS:\s*([\s\S]*?)$/);

  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    description: descMatch ? descMatch[1].trim() : '',
    keywords: kwMatch ? kwMatch[1].split(',').map(k => k.trim()).filter(Boolean) : [],
    seoTips: tipsMatch ? tipsMatch[1].split('\n').map(t => t.replace(/^[-•*]\s*/, '').trim()).filter(Boolean) : [],
  };
}

/**
 * Generate and apply AI listing to an item.
 * @param {string} itemId
 * @param {Object} [opts] - Same as generateListing opts
 * @returns {Promise<Object>} Generated listing data
 */
export async function generateAndApply(itemId, opts = {}) {
  const item = getInvItem(itemId);
  if (!item) throw new Error('Item not found');

  toast('Generating AI listing…');
  const result = await generateListing(item, opts);

  if (result.title || result.description) {
    // Store AI-generated content on the item (don't overwrite name unless empty)
    if (!item.aiListing) item.aiListing = {};
    item.aiListing.title = result.title;
    item.aiListing.description = result.description;
    item.aiListing.keywords = result.keywords;
    item.aiListing.generatedAt = new Date().toISOString();
    item.aiListing.platform = opts.platform || '';

    markDirty('inv', itemId);
    save();

    toast('AI listing generated ✓');
  }

  return result;
}

/**
 * Render the AI listing panel for the drawer.
 * @param {Object} item
 * @returns {string} HTML
 */
export function renderAIListingPanel(item) {
  const ai = item.aiListing || {};
  const hasListing = ai.title || ai.description;

  let html = `<div class="ai-panel">`;

  if (hasListing) {
    html += `
      <div class="ai-existing">
        <div class="ai-label">AI-Generated Title:</div>
        <div class="ai-title">${escHtml(ai.title)}</div>
        <div class="ai-label" style="margin-top:8px">AI-Generated Description:</div>
        <div class="ai-desc">${escHtml(ai.description).replace(/\n/g, '<br>')}</div>
        ${ai.keywords?.length ? `<div class="ai-keywords">${ai.keywords.map(k => `<span class="ai-kw">${escHtml(k)}</span>`).join('')}</div>` : ''}
        <div class="ai-meta">Generated ${ai.generatedAt ? new Date(ai.generatedAt).toLocaleDateString() : ''} ${ai.platform ? `for ${ai.platform}` : ''}</div>
      </div>
      <div class="ai-actions">
        <button class="btn-sm" onclick="aiCopyListing('${item.id}')">📋 Copy</button>
        <button class="btn-sm" onclick="aiRegenerate('${item.id}')">🔄 Regenerate</button>
      </div>
    `;
  }

  // Generate buttons
  html += `
    <div class="ai-generate">
      <div class="ai-gen-row">
        <select id="aiPlatform" class="ai-select">
          <option value="">Any Platform</option>
          <option value="eBay">eBay</option>
          <option value="Poshmark">Poshmark</option>
          <option value="Mercari">Mercari</option>
          <option value="Depop">Depop</option>
          <option value="Etsy">Etsy</option>
          <option value="Facebook Marketplace">Facebook</option>
          <option value="Amazon">Amazon</option>
        </select>
        <select id="aiTone" class="ai-select">
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="urgent">Urgent/Sale</option>
          <option value="luxury">Luxury</option>
        </select>
      </div>
      <button class="btn-primary ai-gen-btn" onclick="aiGenerate('${item.id}')" ${_generating ? 'disabled' : ''}>
        ✨ ${hasListing ? 'Regenerate' : 'Generate'} AI Listing
      </button>
      <div class="ai-cost-note">~$0.002 per generation (Claude Haiku)</div>
    </div>
  `;

  html += `</div>`;
  return html;
}

/**
 * Copy AI-generated listing text to clipboard.
 */
export async function copyAIListing(itemId) {
  const item = getInvItem(itemId);
  if (!item?.aiListing) return;

  const text = `${item.aiListing.title}\n\n${item.aiListing.description}`;
  try {
    await navigator.clipboard.writeText(text);
    toast('AI listing copied to clipboard ✓');
  } catch (e) {
    toast('Copy failed', true);
  }
}

/**
 * Generate an AI listing for a specific platform and cache it on the item.
 * If already cached for that platform, returns the cached version.
 * @param {string} itemId
 * @param {string} platform - e.g. 'Poshmark', 'Mercari'
 * @param {boolean} [force=false] - regenerate even if cached
 * @returns {Promise<{ title: string, description: string, keywords: string[] }>}
 */
export async function generateForPlatform(itemId, platform, force = false) {
  const item = getInvItem(itemId);
  if (!item) throw new Error('Item not found');

  // Check cache
  if (!item.crosslistCache) item.crosslistCache = {};
  const cached = item.crosslistCache[platform];
  if (cached && !force) return cached;

  toast(`Generating ${platform} listing…`);
  const result = await generateListing(item, { platform });

  // Cache on item
  item.crosslistCache[platform] = {
    title: result.title,
    description: result.description,
    keywords: result.keywords,
    generatedAt: new Date().toISOString(),
  };
  markDirty('inv', itemId);
  save();

  toast(`${platform} listing ready ✓`);
  return item.crosslistCache[platform];
}

/**
 * Copy a platform-specific listing to clipboard.
 * Generates via AI if not cached yet.
 * @param {string} itemId
 * @param {string} platform
 */
export async function copyPlatformListing(itemId, platform) {
  try {
    const listing = await generateForPlatform(itemId, platform);
    const text = `${listing.title}\n\n${listing.description}`;
    await navigator.clipboard.writeText(text);
    toast(`${platform} listing copied ✓`);
  } catch (e) {
    toast(`Failed: ${e.message}`, true);
  }
}

// ── GETTERS ──────────────────────────────────────────────────────────────
export function isGenerating() { return _generating; }
