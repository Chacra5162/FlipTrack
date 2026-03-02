/**
 * repricing-rules.js
 * Dynamic pricing rules engine for intelligent repricing suggestions
 * Supports automatic repricing based on time-listed, sales velocity, and market conditions
 */

import { inv, sales, save, refresh, markDirty, pushUndo } from '../data/store.js';
import { fmt, pct, uid, escHtml } from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { getMeta, setMeta } from '../data/idb.js';
import { logPriceChange } from './price-history.js';

// ── DEFAULT RULES ────────────────────────────────────────────────────────────
const DEFAULT_RULES = [
  {
    id: 'rule_30day_drop',
    name: '10% drop after 30 days',
    active: true,
    condition: { daysListed: 30, noSalesDays: 0, priceAbove: 0, priceBelow: 9999 },
    action: { type: 'percent_drop', value: 10 },
    platforms: [],
    categories: []
  },
  {
    id: 'rule_60day_drop',
    name: '20% drop after 60 days',
    active: true,
    condition: { daysListed: 60, noSalesDays: 0, priceAbove: 0, priceBelow: 9999 },
    action: { type: 'percent_drop', value: 20 },
    platforms: [],
    categories: []
  },
  {
    id: 'rule_quick_sale',
    name: '5% raise if sold within 3 days',
    active: true,
    condition: { daysListed: 0, noSalesDays: 0, priceAbove: 0, priceBelow: 9999 },
    action: { type: 'percent_raise', value: 5 },
    platforms: [],
    categories: []
  }
];

let _rules = [];
let _rulesReady = false;

/**
 * Initialize repricing rules from IDB
 * Load defaults if not found
 */
export async function initRepricingRules() {
  try {
    const stored = await getMeta('repricing_rules');
    _rules = stored || DEFAULT_RULES.map(r => ({ ...r }));
    _rulesReady = true;
  } catch (e) {
    console.warn('Failed to load repricing rules:', e.message);
    _rules = DEFAULT_RULES.map(r => ({ ...r }));
    _rulesReady = true;
  }
}

/**
 * Get all repricing rules
 * @returns {Array} Rules array
 */
export function getRepricingRules() {
  return _rules;
}

/**
 * Add a new repricing rule
 * @param {Object} rule - Rule object
 * @returns {string} The new rule ID
 */
export function addRepricingRule(rule) {
  const id = rule.id || 'rule_' + uid();
  const newRule = {
    id,
    name: rule.name || 'New Rule',
    active: rule.active !== false,
    condition: rule.condition || { daysListed: 30, noSalesDays: 0, priceAbove: 0, priceBelow: 9999 },
    action: rule.action || { type: 'percent_drop', value: 10 },
    platforms: rule.platforms || [],
    categories: rule.categories || []
  };

  _rules.push(newRule);
  _persistRules();
  return id;
}

/**
 * Update an existing rule
 * @param {string} ruleId - The rule ID
 * @param {Object} updates - Partial rule updates
 */
export function updateRepricingRule(ruleId, updates) {
  const rule = _rules.find(r => r.id === ruleId);
  if (!rule) return;

  Object.assign(rule, updates);
  _persistRules();
}

/**
 * Delete a rule
 * @param {string} ruleId - The rule ID to delete
 */
export function deleteRepricingRule(ruleId) {
  const idx = _rules.findIndex(r => r.id === ruleId);
  if (idx !== -1) {
    _rules.splice(idx, 1);
    _persistRules();
  }
}

/**
 * Persist rules to IDB
 */
function _persistRules() {
  setMeta('repricing_rules', _rules).catch(e => console.warn('Failed to persist rules:', e));
}

/**
 * Evaluate all rules against inventory
 * Returns suggestions for repricing
 * @returns {Array} Suggestions array: { item, rule, currentPrice, suggestedPrice, reason }
 */
export function evaluateRules() {
  const suggestions = [];
  const now = Date.now();

  inv.forEach(item => {
    if (!item.price || item.qty === 0) return;

    _rules.forEach(rule => {
      if (!rule.active) return;

      // Check platform filter
      if (rule.platforms.length > 0) {
        const itemPlats = item.platforms || [];
        if (!rule.platforms.some(p => itemPlats.includes(p))) return;
      }

      // Check category filter
      if (rule.categories.length > 0) {
        if (!rule.categories.includes(item.category)) return;
      }

      const { daysListed, noSalesDays, priceAbove, priceBelow } = rule.condition;
      const { type, value } = rule.action;

      // Check days listed condition
      const createdAt = item.createdAt || item.listedAt || 0;
      const daysOld = (now - createdAt) / (24 * 3600000);
      if (daysOld < daysListed) return;

      // Check price range
      if (item.price < priceAbove || item.price > priceBelow) return;

      // Check no sales days (if specified)
      if (noSalesDays > 0) {
        const lastSale = sales
          .filter(s => s.itemId === item.id)
          .sort((a, b) => (b.soldAt || 0) - (a.soldAt || 0))[0];
        if (!lastSale) return;
        const daysSinceLastSale = (now - (lastSale.soldAt || 0)) / (24 * 3600000);
        if (daysSinceLastSale < noSalesDays) return;
      }

      // Calculate suggested price
      let suggestedPrice = item.price;
      if (type === 'percent_drop') {
        suggestedPrice = item.price * (1 - value / 100);
      } else if (type === 'fixed_drop') {
        suggestedPrice = item.price - value;
      } else if (type === 'percent_raise') {
        suggestedPrice = item.price * (1 + value / 100);
      }

      suggestedPrice = Math.round(suggestedPrice * 100) / 100;

      if (suggestedPrice !== item.price) {
        suggestions.push({
          item,
          rule,
          currentPrice: item.price,
          suggestedPrice,
          reason: _getRuleReason(rule, daysOld)
        });
      }
    });
  });

  return suggestions;
}

/**
 * Get human-readable reason for a suggestion
 */
function _getRuleReason(rule, daysOld) {
  const { type, value } = rule.action;
  const action = type === 'percent_drop' ? `Drop ${value}%` : type === 'fixed_drop' ? `Drop $${value}` : `Raise ${value}%`;
  return `${action} — ${rule.name}`;
}

/**
 * Apply repricing suggestions to items
 * @param {Array} suggestions - Suggestions from evaluateRules()
 */
export function applyRepricing(suggestions) {
  if (!suggestions.length) {
    toast('No repricing suggestions to apply', true);
    return;
  }

  const undoData = suggestions.map(s => ({
    itemId: s.item.id,
    oldPrice: s.item.price,
    newPrice: s.suggestedPrice,
    rule: s.rule.name
  }));

  pushUndo('repricing', undoData);

  suggestions.forEach(suggestion => {
    const item = suggestion.item;
    logPriceChange(item.id, suggestion.suggestedPrice, 'repricing');
    item.price = suggestion.suggestedPrice;
    markDirty('inv', item.id);
  });

  save();
  refresh();
  toast(`Applied ${suggestions.length} price adjustment${suggestions.length > 1 ? 's' : ''}`);
}

/**
 * Render repricing suggestions as HTML
 * @returns {string} HTML string
 */
export function renderRepricingSuggestions() {
  const suggestions = evaluateRules();

  if (!suggestions.length) {
    return `
      <div class="panel" style="text-align:center;padding:30px">
        <div style="font-size:14px;color:var(--muted);margin-bottom:10px">No repricing suggestions</div>
        <div style="font-size:12px;color:var(--muted)">All items are optimally priced</div>
      </div>
    `;
  }

  const rows = suggestions.map((s, idx) => `
    <div style="display:grid;grid-template-columns:1fr 100px 100px 120px;gap:12px;align-items:center;padding:10px;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-weight:500;color:var(--text)">${escHtml(s.item.name)}</div>
        <div style="font-size:11px;color:var(--muted)">${escHtml(s.reason)}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:12px;color:var(--warn)">${fmt(s.currentPrice)}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:12px;color:var(--good);font-weight:500">${fmt(s.suggestedPrice)}</div>
        <div style="font-size:10px;color:var(--muted)">${pct((s.suggestedPrice - s.currentPrice) / s.currentPrice)}</div>
      </div>
      <button class="btn-primary" style="font-size:11px;padding:6px 10px" onclick="rpApplySingle('${s.item.id}', ${s.suggestedPrice})">Apply</button>
    </div>
  `).join('');

  return `
    <div class="panel">
      <div style="padding:10px;background:var(--surface2);border-bottom:2px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-weight:500">${suggestions.length} Price Suggestion${suggestions.length > 1 ? 's' : ''}</div>
          <div style="font-size:11px;color:var(--muted)">Review and apply individual adjustments</div>
        </div>
        <button class="btn-primary" onclick="rpApplyAll()">Apply All</button>
      </div>
      <div>
        ${rows}
      </div>
    </div>
  `;
}

/**
 * Render repricing rules manager UI
 * @returns {string} HTML string
 */
export function renderRepricingRulesManager() {
  const rules = getRepricingRules();

  const ruleRows = rules.map(rule => `
    <div style="display:grid;grid-template-columns:1fr 120px 120px;gap:12px;align-items:center;padding:12px;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-weight:500;color:var(--text)">${escHtml(rule.name)}</div>
        <div style="font-size:11px;color:var(--muted)">
          ${rule.condition.daysListed > 0 ? `After ${rule.condition.daysListed} days` : 'Always'} •
          ${rule.action.type === 'percent_drop' ? `${rule.action.value}% drop` : rule.action.type === 'percent_raise' ? `${rule.action.value}% raise` : `$${rule.action.value} drop`}
        </div>
      </div>
      <div style="text-align:center">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" ${rule.active ? 'checked' : ''} onchange="rpToggleRule('${rule.id}')" style="cursor:pointer">
          <span style="font-size:12px">${rule.active ? 'Active' : 'Inactive'}</span>
        </label>
      </div>
      <div style="text-align:right">
        <button class="btn-danger" style="font-size:11px;padding:5px 10px" onclick="rpDeleteRule('${rule.id}')">Delete</button>
      </div>
    </div>
  `).join('');

  return `
    <div class="panel">
      <div style="padding:10px;background:var(--surface2);border-bottom:2px solid var(--border)">
        <div style="font-weight:500;margin-bottom:4px">Repricing Rules</div>
        <div style="font-size:11px;color:var(--muted)">${rules.length} rule${rules.length !== 1 ? 's' : ''} configured</div>
      </div>
      <div>
        ${ruleRows}
      </div>
      <div style="padding:10px;background:var(--surface2);border-top:1px solid var(--border)">
        <div style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:8px">Add New Rule</div>
        <div class="form-grid" style="gap:6px">
          <input id="rp_rule_name" placeholder="Rule name" class="fgrp" style="grid-column:1/-1">
          <input id="rp_rule_days" type="number" placeholder="Days listed" class="fgrp" value="30">
          <select id="rp_rule_action" class="fgrp">
            <option value="percent_drop">% Drop</option>
            <option value="fixed_drop">$ Drop</option>
            <option value="percent_raise">% Raise</option>
          </select>
          <input id="rp_rule_value" type="number" placeholder="Value" step="1" class="fgrp" value="10">
          <button onclick="rpAddRuleFromForm()" class="btn-primary" style="grid-column:1/-1;height:32px;font-size:11px">+ Add Rule</button>
        </div>
      </div>
    </div>
  `;
}

// ── WINDOW-EXPOSED HANDLERS (called from inline onclick) ────────────────────

export function rpAddRule(ruleData) {
  addRepricingRule(ruleData);
  toast('Rule added');
  refresh();
}

export function rpDeleteRule(ruleId) {
  if (!confirm('Delete this repricing rule?')) return;
  deleteRepricingRule(ruleId);
  toast('Rule deleted');
  refresh();
}

export function rpToggleRule(ruleId) {
  const rule = _rules.find(r => r.id === ruleId);
  if (rule) {
    rule.active = !rule.active;
    _persistRules();
    refresh();
  }
}

export function rpApplyAll() {
  const suggestions = evaluateRules();
  if (!suggestions.length) {
    toast('No suggestions to apply', true);
    return;
  }
  if (!confirm(`Apply ${suggestions.length} price adjustment${suggestions.length > 1 ? 's' : ''}?`)) return;
  applyRepricing(suggestions);
}

export function rpApplySingle(itemId, suggestedPrice) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return;

  pushUndo('price_change', { itemId, oldPrice: item.price });

  logPriceChange(itemId, suggestedPrice, 'repricing');
  item.price = suggestedPrice;
  markDirty('inv', itemId);

  save();
  refresh();
  toast('Price updated');
}

export function rpAddRuleFromForm() {
  const name = (document.getElementById('rp_rule_name')?.value || '').trim();
  const daysListed = parseInt(document.getElementById('rp_rule_days')?.value) || 30;
  const actionType = document.getElementById('rp_rule_action')?.value || 'percent_drop';
  const actionValue = parseFloat(document.getElementById('rp_rule_value')?.value) || 10;

  if (!name) { toast('Rule name required', true); return; }

  addRepricingRule({
    name,
    condition: { daysListed, noSalesDays: 0, priceAbove: 0, priceBelow: 9999 },
    action: { type: actionType, value: actionValue },
  });

  // Clear form
  const nameEl = document.getElementById('rp_rule_name');
  if (nameEl) nameEl.value = '';

  toast('Rule added');
  refresh();
}
