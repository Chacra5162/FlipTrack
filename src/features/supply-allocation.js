/**
 * supply-allocation.js — Auto-allocate supply costs to inventory items
 * Distributes bulk supply costs (boxes, poly mailers, labels, tape, etc.)
 * across individual items as part of COGS for more accurate profit tracking.
 *
 * Allocation methods:
 *  - per-item: Fixed cost per item (e.g. $0.50/mailer)
 *  - per-shipment: Cost per sale/shipment
 *  - even-split: Total cost ÷ number of items in stock
 *  - by-weight: Proportional to item weight class (light/medium/heavy)
 *  - by-category: Different rates per category
 */

import { inv, sales, supplies, save, markDirty, getInvItem } from '../data/store.js';
import { fmt, escHtml, escAttr, uid } from '../utils/format.js';
import { toast } from '../utils/dom.js';

const STORAGE_KEY = 'ft_supply_alloc_rules';
const ALLOC_LOG_KEY = 'ft_supply_alloc_log';

// ── ALLOCATION METHODS ──────────────────────────────────────────────────────

const ALLOC_METHODS = {
  'per-item':     'Per Item (fixed cost each)',
  'per-shipment': 'Per Shipment (on sale)',
  'even-split':   'Even Split (across all stock)',
  'by-weight':    'By Weight Class',
  'by-category':  'By Category Rate',
};

const WEIGHT_CLASSES = {
  light:  { label: 'Light (<1 lb)', multiplier: 0.5 },
  medium: { label: 'Medium (1-5 lb)', multiplier: 1.0 },
  heavy:  { label: 'Heavy (5+ lb)', multiplier: 2.0 },
};

// ── RULE PERSISTENCE ────────────────────────────────────────────────────────

function getRules() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveRules(rules) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

function getAllocLog() {
  try { return JSON.parse(localStorage.getItem(ALLOC_LOG_KEY) || '[]'); }
  catch { return []; }
}

function saveAllocLog(log) {
  // Keep last 500 entries
  localStorage.setItem(ALLOC_LOG_KEY, JSON.stringify(log.slice(-500)));
}

// ── RULE MANAGEMENT ─────────────────────────────────────────────────────────

export function addAllocRule(supplyId, method, rate, options = {}) {
  const sup = supplies.find(s => s.id === supplyId);
  if (!sup) { toast('Supply not found', true); return; }

  const rules = getRules();
  const rule = {
    id: uid(),
    supplyId,
    supplyName: sup.name,
    method,
    rate: parseFloat(rate) || 0,
    categoryRates: options.categoryRates || {},
    weightRates: options.weightRates || {},
    enabled: true,
    created: new Date().toISOString(),
  };
  rules.push(rule);
  saveRules(rules);
  toast(`Allocation rule added for ${sup.name} ✓`);
  return rule;
}

export function removeAllocRule(ruleId) {
  const rules = getRules().filter(r => r.id !== ruleId);
  saveRules(rules);
  toast('Rule removed ✓');
}

export function toggleAllocRule(ruleId) {
  const rules = getRules();
  const rule = rules.find(r => r.id === ruleId);
  if (rule) {
    rule.enabled = !rule.enabled;
    saveRules(rules);
  }
}

// ── COST CALCULATION ────────────────────────────────────────────────────────

/** Calculate the allocated supply cost for a single inventory item */
export function getAllocatedCost(itemId) {
  const item = getInvItem(itemId);
  if (!item) return 0;

  const rules = getRules().filter(r => r.enabled);
  let total = 0;

  for (const rule of rules) {
    switch (rule.method) {
      case 'per-item':
        total += rule.rate;
        break;

      case 'per-shipment':
        // Applied when item sells — count sales for this item
        break;

      case 'even-split': {
        const inStock = inv.filter(i => (i.qty || 0) > 0 && !i._del && !i.isParent);
        if (inStock.length > 0) {
          const sup = supplies.find(s => s.id === rule.supplyId);
          const totalCost = sup ? (sup.cost || 0) * (sup.qty || 0) : 0;
          total += totalCost / inStock.length;
        }
        break;
      }

      case 'by-weight': {
        const wc = item.weightClass || 'medium';
        const mult = WEIGHT_CLASSES[wc]?.multiplier || 1.0;
        total += rule.rate * mult;
        break;
      }

      case 'by-category': {
        const cat = item.category || 'Other';
        const catRate = rule.categoryRates[cat];
        total += catRate !== undefined ? catRate : rule.rate;
        break;
      }
    }
  }

  return Math.round(total * 100) / 100;
}

/** Calculate per-shipment allocation cost (applied at sale time) */
export function getShipmentAllocCost() {
  const rules = getRules().filter(r => r.enabled && r.method === 'per-shipment');
  return rules.reduce((sum, r) => sum + (r.rate || 0), 0);
}

/** Run bulk allocation across all in-stock items and stamp allocatedSupplyCost */
export function runBulkAllocation() {
  const rules = getRules().filter(r => r.enabled);
  if (!rules.length) { toast('No active allocation rules', true); return; }

  let count = 0;
  const log = getAllocLog();
  const batchId = uid();
  const now = new Date().toISOString();

  for (const item of inv) {
    if (item._del || item.isParent || (item.qty || 0) <= 0) continue;

    const cost = getAllocatedCost(item.id);
    if (cost > 0) {
      item.allocatedSupplyCost = cost;
      markDirty('inv', item.id);
      count++;

      log.push({
        batchId,
        itemId: item.id,
        itemName: item.name,
        amount: cost,
        date: now,
      });
    }
  }

  if (count > 0) {
    save();
    saveAllocLog(log);
    toast(`Allocated supply costs to ${count} items ✓`);
  } else {
    toast('No items to allocate', true);
  }
  return count;
}

/** Get total allocated costs across all items for reporting */
export function getAllocationSummary() {
  const rules = getRules();
  const activeRules = rules.filter(r => r.enabled);
  const inStock = inv.filter(i => (i.qty || 0) > 0 && !i._del && !i.isParent);

  let totalAllocated = 0;
  for (const item of inStock) {
    totalAllocated += item.allocatedSupplyCost || 0;
  }

  // Per-shipment costs from recent sales (this month)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const shipCost = getShipmentAllocCost();
  let monthShipAlloc = 0;
  if (shipCost > 0) {
    const monthSales = sales.filter(s => new Date(s.date) >= monthStart);
    monthShipAlloc = monthSales.length * shipCost;
  }

  return {
    ruleCount: rules.length,
    activeRuleCount: activeRules.length,
    itemsWithAlloc: inStock.filter(i => (i.allocatedSupplyCost || 0) > 0).length,
    totalAllocated,
    monthShipAlloc,
    totalItems: inStock.length,
  };
}

// ── ENHANCED PROFIT CALCULATION ─────────────────────────────────────────────

/** Get true COGS including supply allocation */
export function getTrueCOGS(itemId) {
  const item = getInvItem(itemId);
  if (!item) return 0;
  const baseCost = item.cost || 0;
  const allocCost = item.allocatedSupplyCost || 0;
  return baseCost + allocCost;
}

/** Get true profit per unit including supply costs */
export function getTrueProfit(itemId) {
  const item = getInvItem(itemId);
  if (!item) return 0;
  const price = item.price || 0;
  const trueCogs = getTrueCOGS(itemId);
  const fees = item.fees || 0;
  const ship = item.ship || 0;
  return price - trueCogs - fees - ship;
}

// ── UI RENDERING ────────────────────────────────────────────────────────────

export function renderSupplyAllocation() {
  const rules = getRules();
  const summary = getAllocationSummary();

  const supplyOptions = supplies.map(s =>
    `<option value="${escAttr(s.id)}">${escHtml(s.name)} (${fmt(s.cost || 0)}/ea)</option>`
  ).join('');

  const methodOptions = Object.entries(ALLOC_METHODS).map(([k, v]) =>
    `<option value="${k}">${v}</option>`
  ).join('');

  return `<div class="supply-alloc-wrap">
    <div class="sa-header">
      <div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--text)">Supply Cost Allocation</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">Auto-distribute supply costs into per-item COGS</div>
      </div>
      <button class="btn-primary" onclick="saRunAllocation()" style="font-size:11px;padding:6px 14px">Run Allocation</button>
    </div>

    <div class="sa-summary">
      <div class="sa-stat">
        <div class="sa-stat-val">${summary.activeRuleCount}</div>
        <div class="sa-stat-label">Active Rules</div>
      </div>
      <div class="sa-stat">
        <div class="sa-stat-val">${summary.itemsWithAlloc}</div>
        <div class="sa-stat-label">Items Allocated</div>
      </div>
      <div class="sa-stat">
        <div class="sa-stat-val">${fmt(summary.totalAllocated)}</div>
        <div class="sa-stat-label">Total Allocated</div>
      </div>
      <div class="sa-stat">
        <div class="sa-stat-val">${fmt(summary.monthShipAlloc)}</div>
        <div class="sa-stat-label">Ship Alloc (mo)</div>
      </div>
    </div>

    <div class="sa-add-form">
      <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:8px">Add Allocation Rule</div>
      <div class="sa-form-row">
        <select id="saSupply" style="flex:2">${supplyOptions}</select>
        <select id="saMethod" style="flex:2" onchange="saMethodChanged()">${methodOptions}</select>
        <input type="number" id="saRate" placeholder="Rate ($)" step="0.01" min="0" style="flex:1;width:80px">
        <button class="btn-primary" onclick="saAddRule()" style="font-size:11px;padding:6px 12px">Add</button>
      </div>
      <div id="saMethodHint" style="font-size:10px;color:var(--muted);margin-top:4px">
        Fixed cost allocated to each item in stock
      </div>
    </div>

    ${rules.length ? `<div class="sa-rules">
      <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:8px">Active Rules</div>
      ${rules.map(r => {
        const methodLabel = ALLOC_METHODS[r.method] || r.method;
        return `<div class="sa-rule ${r.enabled ? '' : 'sa-rule-disabled'}">
          <div style="flex:1">
            <div style="font-size:12px;color:var(--text);font-weight:600">${escHtml(r.supplyName)}</div>
            <div style="font-size:10px;color:var(--muted)">${methodLabel} · ${fmt(r.rate)}</div>
          </div>
          <button onclick="saToggleRule('${escAttr(r.id)}')" class="btn-secondary" style="font-size:10px;padding:3px 8px">
            ${r.enabled ? 'Disable' : 'Enable'}
          </button>
          <button onclick="saRemoveRule('${escAttr(r.id)}')" class="btn-danger" style="font-size:10px;padding:3px 8px">✕</button>
        </div>`;
      }).join('')}
    </div>` : ''}
  </div>`;
}

export function saMethodChanged() {
  const method = document.getElementById('saMethod')?.value;
  const hint = document.getElementById('saMethodHint');
  if (!hint) return;
  const hints = {
    'per-item': 'Fixed cost allocated to each item in stock',
    'per-shipment': 'Cost added per sale/shipment at time of sale',
    'even-split': 'Total supply cost ÷ number of items in stock',
    'by-weight': 'Rate × weight class multiplier (light 0.5×, medium 1×, heavy 2×)',
    'by-category': 'Default rate, override per category in rule settings',
  };
  hint.textContent = hints[method] || '';
}

export function saAddRule() {
  const supplyId = document.getElementById('saSupply')?.value;
  const method = document.getElementById('saMethod')?.value;
  const rate = document.getElementById('saRate')?.value;
  if (!supplyId) { toast('Select a supply', true); return; }
  if (!rate && method !== 'even-split') { toast('Enter a rate', true); return; }
  addAllocRule(supplyId, method, rate);
  // Re-render
  const el = document.getElementById('supplyAllocSection');
  if (el) el.innerHTML = renderSupplyAllocation();
}

export function saRemoveRule(ruleId) {
  removeAllocRule(ruleId);
  const el = document.getElementById('supplyAllocSection');
  if (el) el.innerHTML = renderSupplyAllocation();
}

export function saToggleRule(ruleId) {
  toggleAllocRule(ruleId);
  const el = document.getElementById('supplyAllocSection');
  if (el) el.innerHTML = renderSupplyAllocation();
}

export function saRunAllocation() {
  const count = runBulkAllocation();
  const el = document.getElementById('supplyAllocSection');
  if (el) el.innerHTML = renderSupplyAllocation();
}
