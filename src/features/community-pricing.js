/**
 * community-pricing.js — Community Pricing Data
 * Anonymous aggregated sales data across FlipTrack users.
 * Privacy-first: only sold prices (not listed), no individual data exposed.
 */

import { sales, getInvItem } from '../data/store.js';
import { getSupabaseClient } from '../data/auth.js';
import { fmt, escHtml } from '../utils/format.js';
import { toast } from '../utils/dom.js';

const OPT_IN_KEY = 'ft_community_optin';

/**
 * Check if user has opted in to community pricing.
 */
export function isCommunityOptedIn() {
  return localStorage.getItem(OPT_IN_KEY) === '1';
}

/**
 * Toggle community pricing opt-in.
 */
export function toggleCommunityOptIn() {
  const current = isCommunityOptedIn();
  localStorage.setItem(OPT_IN_KEY, current ? '0' : '1');
  toast(current ? 'Community pricing disabled' : 'Community pricing enabled — your sold prices will be shared anonymously');
  return !current;
}

/**
 * Contribute anonymized sales data to the community pool.
 * Should be called in the background after recording a sale.
 */
export async function contributeSales() {
  if (!isCommunityOptedIn()) return;
  const _sb = getSupabaseClient();
  if (!_sb) return;

  // Get recent sales that haven't been contributed yet.
  // On first opt-in, only contributes last 7 days (privacy: avoids bulk-uploading entire history)
  const lastContrib = parseInt(localStorage.getItem('ft_community_last') || '0');
  const cutoff = new Date(lastContrib || Date.now() - 7 * 86400000);

  const newSales = sales.filter(s => {
    if (!s.date || !s.price) return false;
    return new Date(s.date) > cutoff;
  });

  if (!newSales.length) return;

  const batch = newSales.map(s => {
    const item = getInvItem(s.itemId);
    return {
      category: item?.category || 'Unknown',
      subcategory: item?.subcategory || '',
      brand: item?.brand || '',
      condition: item?.condition || 'Unknown',
      sold_price: s.price,
      sold_date: s.date,
    };
  }).filter(b => b.sold_price > 0);

  if (!batch.length) return;

  try {
    await _sb.functions.invoke('community-pricing', {
      body: { action: 'contribute', sales: batch }
    });
    localStorage.setItem('ft_community_last', String(Date.now()));
  } catch (e) {
    console.warn('FlipTrack: community pricing contribution failed:', e.message);
  }
}

/**
 * Query community pricing data for a category/brand/condition.
 * @param {string} category
 * @param {string} [brand]
 * @param {string} [condition]
 * @returns {Promise<{ median: number, count: number, p25: number, p75: number, message: string }>}
 */
export async function queryCommunityPricing(category, brand, condition) {
  const _sb = getSupabaseClient();
  if (!_sb) return { median: 0, count: 0, p25: 0, p75: 0, message: 'Not signed in' };

  try {
    const { data, error } = await _sb.functions.invoke('community-pricing', {
      body: { action: 'query', category, brand: brand || '', condition: condition || '' }
    });

    if (error) throw new Error(error.message);
    return data || { median: 0, count: 0, p25: 0, p75: 0, message: 'No data' };
  } catch (e) {
    return { median: 0, count: 0, p25: 0, p75: 0, message: e.message || 'Query failed' };
  }
}

/**
 * Render community pricing section for comps panel.
 * @param {string} category
 * @param {string} [brand]
 * @param {string} [condition]
 * @returns {Promise<string>} HTML
 */
export async function renderCommunityPricing(category, brand, condition) {
  if (!isCommunityOptedIn()) {
    return `<div style="padding:12px;text-align:center;font-size:11px;color:var(--muted)">
      <div style="margin-bottom:6px">📊 Community Pricing</div>
      <div>See what other flippers sell similar items for.</div>
      <button class="btn-secondary" style="margin-top:8px;font-size:10px;padding:4px 10px" onclick="toggleCommunityOptIn()">Opt In (Anonymous)</button>
    </div>`;
  }

  const data = await queryCommunityPricing(category, brand, condition);

  if (!data.count) {
    return `<div style="padding:12px;text-align:center;font-size:11px;color:var(--muted)">
      📊 No community data for this category yet
    </div>`;
  }

  return `<div style="padding:12px;border-top:1px solid var(--border)">
    <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">📊 Community Data · ${data.count} sales</div>
    <div style="display:flex;gap:16px;font-family:'DM Mono',monospace">
      <div><div style="font-size:10px;color:var(--muted)">25th</div><div style="font-size:14px;color:var(--text)">${fmt(data.p25)}</div></div>
      <div><div style="font-size:10px;color:var(--muted)">Median</div><div style="font-size:14px;font-weight:700;color:var(--accent)">${fmt(data.median)}</div></div>
      <div><div style="font-size:10px;color:var(--muted)">75th</div><div style="font-size:14px;color:var(--text)">${fmt(data.p75)}</div></div>
    </div>
  </div>`;
}
