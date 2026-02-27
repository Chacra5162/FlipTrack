/**
 * ai-listing.js — AI-Powered Title & Description Generator
 * Uses the Anthropic proxy Edge Function to generate optimized
 * listing titles and descriptions for marketplace platforms.
 */

import { SB_URL } from '../config/constants.js';
import { getInvItem, markDirty, save } from '../data/store.js';
import { toast } from '../utils/dom.js';
import { escHtml, fmt } from '../utils/format.js';
import { getPlatforms } from './platforms.js';

// ── CONFIG ────────────────────────────────────────────────────────────────
const PROXY_URL = `${SB_URL}/functions/v1/anthropic-proxy`;

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
 * Get auth headers for the proxy call.
 */
async function _getHeaders() {
  if (!_sb) throw new Error('Not authenticated');
  const { data: { session } } = await _sb.auth.getSession();
  if (!session) throw new Error('Session expired — please log in');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

/**
 * Generate an optimized listing title and description using AI.
 * @param {Object} item - Inventory item
 * @param {Object} [opts]
 * @param {string} [opts.platform] - Target platform for optimization
 * @param {string} [opts.tone='professional'] - Tone: professional, casual, urgent, luxury
 * @param {boolean} [opts.includeKeywords=true] - Include SEO keywords
 * @returns {Promise<{ title: string, description: string, keywords: string[], seoTips: string[] }>}
 */
export async function generateListing(item, opts = {}) {
  if (_generating) throw new Error('Already generating — please wait');
  if (!_sb) throw new Error('Sign in to use AI features');

  _generating = true;

  try {
    const platform = opts.platform || getPlatforms(item)[0] || 'eBay';
    const tone = opts.tone || 'professional';

    const prompt = _buildPrompt(item, platform, tone, opts.includeKeywords !== false);

    const headers = await _getHeaders();
    const resp = await fetch(PROXY_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `AI request failed: ${resp.status}`);
    }

    const data = await resp.json();
    const text = data.content?.[0]?.text || '';

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
  if (item.notes) details.push(`Notes: ${item.notes}`);
  if (item.upc) details.push(`UPC: ${item.upc}`);
  if (item.isbn) details.push(`ISBN: ${item.isbn}`);
  if (item.author) details.push(`Author: ${item.author}`);
  if (item.price) details.push(`Price: $${item.price}`);
  if (item.dimL && item.dimW && item.dimH) {
    details.push(`Dimensions: ${item.dimL} × ${item.dimW} × ${item.dimH} ${item.dimUnit || 'in'}`);
  }
  if (item.weight) details.push(`Weight: ${item.weight} ${item.dimUnit === 'cm' ? 'kg' : 'lb'}`);

  const platformRules = {
    'eBay': 'eBay: max 80 char title, include brand/model/key specs. Description should be detailed with condition notes.',
    'Poshmark': 'Poshmark: max 80 char title. Description should mention fit, fabric, measurements. Casual friendly tone.',
    'Mercari': 'Mercari: short catchy title. Description should be concise and honest about condition.',
    'Depop': 'Depop: trendy, hashtag-friendly. Use Gen-Z friendly language. Include style/aesthetic references.',
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

// ── GETTERS ──────────────────────────────────────────────────────────────
export function isGenerating() { return _generating; }
