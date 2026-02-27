/**
 * ship-labels.js — Shipping Label Integration
 * Generates shipping labels via Pirate Ship / USPS APIs,
 * or provides direct links to label generation services.
 * Includes rate comparison and label cost tracking.
 */

import { sales, markDirty, save } from '../data/store.js';
import { fmt, escHtml } from '../utils/format.js';
import { getMeta, setMeta } from '../data/idb.js';

// ── CARRIER RATES (approximations — actual rates vary by zone) ─────────
const USPS_RATES = {
  'First Class': [
    { maxOz: 4,  price: 4.63 },
    { maxOz: 8,  price: 5.13 },
    { maxOz: 12, price: 5.63 },
    { maxOz: 15.99, price: 6.13 },
  ],
  'Priority Mail': [
    { maxOz: 16, price: 8.70 },
    { maxOz: 32, price: 10.20 },
    { maxOz: 48, price: 12.45 },
    { maxOz: 80, price: 14.80 },
    { maxOz: 160, price: 19.30 },
    { maxOz: 1120, price: 28.50 },
  ],
  'Priority Mail Flat Rate': [
    { name: 'Small Flat Rate Box', price: 10.20, maxOz: 1120 },
    { name: 'Medium Flat Rate Box', price: 16.45, maxOz: 1120 },
    { name: 'Large Flat Rate Box', price: 22.95, maxOz: 1120 },
    { name: 'Padded Flat Rate Envelope', price: 9.85, maxOz: 1120 },
  ],
  'Media Mail': [
    { maxOz: 16, price: 4.13 },
    { maxOz: 32, price: 4.78 },
    { maxOz: 48, price: 5.43 },
    { maxOz: 80, price: 6.73 },
    { maxOz: 160, price: 9.33 },
    { maxOz: 1120, price: 14.53 },
  ],
  'Ground Advantage': [
    { maxOz: 16, price: 5.50 },
    { maxOz: 32, price: 7.00 },
    { maxOz: 48, price: 9.50 },
    { maxOz: 80, price: 12.00 },
    { maxOz: 160, price: 15.50 },
    { maxOz: 1120, price: 20.00 },
  ],
};

const UPS_RATES = {
  'UPS Ground': [
    { maxOz: 16, price: 10.50 },
    { maxOz: 48, price: 14.00 },
    { maxOz: 160, price: 22.00 },
    { maxOz: 1120, price: 35.00 },
  ],
};

// ── SETTINGS ─────────────────────────────────────────────────────────────
let _sellerZip = '';
let _defaultPackage = 'poly_mailer';
let _preferredCarrier = 'USPS';

export async function initShipLabels() {
  const saved = await getMeta('ship_label_settings');
  if (saved) {
    _sellerZip = saved.sellerZip || '';
    _defaultPackage = saved.defaultPackage || 'poly_mailer';
    _preferredCarrier = saved.preferredCarrier || 'USPS';
  }
}

export async function saveShipLabelSettings(settings) {
  _sellerZip = settings.sellerZip || _sellerZip;
  _defaultPackage = settings.defaultPackage || _defaultPackage;
  _preferredCarrier = settings.preferredCarrier || _preferredCarrier;
  await setMeta('ship_label_settings', { sellerZip: _sellerZip, defaultPackage: _defaultPackage, preferredCarrier: _preferredCarrier });
}

// ── RATE ESTIMATION ──────────────────────────────────────────────────────

/**
 * Estimate shipping rates for an item.
 * @param {Object} params
 * @param {number} params.weightOz - Weight in ounces
 * @param {number} [params.length] - Length in inches
 * @param {number} [params.width] - Width in inches
 * @param {number} [params.height] - Height in inches
 * @param {boolean} [params.isMedia] - If true, include Media Mail
 * @returns {Array<{ carrier, service, price, estimatedDays }>}
 */
export function estimateRates(params) {
  const { weightOz, length, width, height, isMedia } = params;
  const rates = [];

  // USPS rates
  for (const [service, tiers] of Object.entries(USPS_RATES)) {
    if (service === 'Media Mail' && !isMedia) continue;

    for (const tier of tiers) {
      if (weightOz <= tier.maxOz) {
        rates.push({
          carrier: 'USPS',
          service: tier.name || service,
          price: tier.price,
          estimatedDays: service.includes('Priority') ? '1-3' : service === 'Media Mail' ? '2-8' : '2-5',
        });
        break;
      }
    }
  }

  // UPS rates
  for (const [service, tiers] of Object.entries(UPS_RATES)) {
    for (const tier of tiers) {
      if (weightOz <= tier.maxOz) {
        rates.push({
          carrier: 'UPS',
          service,
          price: tier.price,
          estimatedDays: '1-5',
        });
        break;
      }
    }
  }

  // Pirate Ship discount note (typically 10-20% off retail)
  rates.forEach(r => {
    r.pirateShipPrice = Math.round(r.price * 0.85 * 100) / 100;
  });

  return rates.sort((a, b) => a.price - b.price);
}

/**
 * Get the cheapest shipping option.
 */
export function getCheapestRate(weightOz, isMedia = false) {
  const rates = estimateRates({ weightOz, isMedia });
  return rates[0] || null;
}

// ── DEEP LINKS TO LABEL SERVICES ──────────────────────────────────────────

/**
 * Generate a link to Pirate Ship for label creation.
 * @param {Object} shipDetails
 * @returns {string} URL
 */
export function getPirateShipLink(shipDetails = {}) {
  return 'https://app.pirateship.com/ship';
}

/**
 * Generate a link to PayPal shipping (also offers discounted rates).
 */
export function getPayPalShipLink() {
  return 'https://www.paypal.com/shiplabel/create';
}

/**
 * Generate a link to eBay shipping labels (for eBay sales).
 * @param {string} [orderId]
 */
export function getEBayShipLink(orderId) {
  if (orderId) return `https://www.ebay.com/sh/ord/details?orderid=${orderId}`;
  return 'https://www.ebay.com/sh/ord';
}

// ── LABEL COST TRACKING ─────────────────────────────────────────────────

/**
 * Record a shipping label cost for a sale.
 * @param {string} saleId
 * @param {Object} labelInfo
 * @param {number} labelInfo.cost - Label cost
 * @param {string} labelInfo.carrier - Carrier name
 * @param {string} labelInfo.service - Service type
 * @param {string} [labelInfo.tracking] - Tracking number
 */
export function recordLabelCost(saleId, labelInfo) {
  const sale = sales.find(s => s.id === saleId);
  if (!sale) return;

  sale.labelCost = labelInfo.cost;
  sale.labelCarrier = labelInfo.carrier;
  sale.labelService = labelInfo.service;
  if (labelInfo.tracking) sale.trackingNumber = labelInfo.tracking;

  // Update actual ship cost
  sale.actualShipCost = labelInfo.cost;
  markDirty('sales', saleId);
  save();
}

/**
 * Get shipping cost summary for a time period.
 * @param {number} [days=30]
 * @returns {Object}
 */
export function getShippingCostSummary(days = 30) {
  const cutoff = Date.now() - days * 86400000;
  const recentSales = sales.filter(s => new Date(s.date).getTime() >= cutoff && s.labelCost);

  const totalCost = recentSales.reduce((sum, s) => sum + (s.labelCost || 0), 0);
  const totalCharged = recentSales.reduce((sum, s) => sum + (s.ship || 0), 0);
  const profit = totalCharged - totalCost;

  const byCarrier = {};
  for (const s of recentSales) {
    const carrier = s.labelCarrier || 'Unknown';
    if (!byCarrier[carrier]) byCarrier[carrier] = { count: 0, cost: 0 };
    byCarrier[carrier].count++;
    byCarrier[carrier].cost += s.labelCost || 0;
  }

  return {
    totalLabels: recentSales.length,
    totalCost,
    totalCharged,
    shippingProfit: profit,
    avgCost: recentSales.length > 0 ? totalCost / recentSales.length : 0,
    byCarrier,
  };
}

/**
 * Render shipping rates comparison panel.
 * @param {Object} params - { weightOz, isMedia, length, width, height }
 * @returns {string} HTML
 */
export function renderRateComparison(params) {
  const rates = estimateRates(params);

  if (!rates.length) {
    return '<div class="sl-empty">Enter weight to see rate estimates</div>';
  }

  let html = `<div class="sl-rates">
    <div class="sl-rates-header">Estimated Shipping Rates (${params.weightOz}oz)</div>
  `;

  for (const rate of rates) {
    const cheapest = rate === rates[0];
    html += `
      <div class="sl-rate-row ${cheapest ? 'sl-cheapest' : ''}">
        <span class="sl-carrier">${escHtml(rate.carrier)}</span>
        <span class="sl-service">${escHtml(rate.service)}</span>
        <span class="sl-price">${fmt(rate.price)}</span>
        <span class="sl-pirate" title="Pirate Ship price">${fmt(rate.pirateShipPrice)}</span>
        <span class="sl-days">${rate.estimatedDays}d</span>
        ${cheapest ? '<span class="sl-badge">Cheapest</span>' : ''}
      </div>
    `;
  }

  html += `
    <div class="sl-links">
      <a href="${getPirateShipLink()}" target="_blank" class="sl-link">🏴‍☠️ Buy on Pirate Ship (Cheapest)</a>
      <a href="${getPayPalShipLink()}" target="_blank" class="sl-link">💳 PayPal Shipping</a>
      <a href="${getEBayShipLink()}" target="_blank" class="sl-link">🛒 eBay Labels</a>
    </div>
  </div>`;

  return html;
}

// ── GETTERS ──────────────────────────────────────────────────────────────
export function getSellerZip() { return _sellerZip; }
export function getDefaultPackage() { return _defaultPackage; }
export function getPreferredCarrier() { return _preferredCarrier; }
