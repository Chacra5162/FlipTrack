/**
 * profit-calc.js — Instant Profit Calculator
 * Shows real-time profit estimates while adding/editing items.
 * Considers platform fees, estimated shipping, and cost basis.
 */

import { PLATFORM_FEES } from '../config/platforms.js';
import { fmt, pct } from '../utils/format.js';

/**
 * Calculate profit breakdown for a potential listing.
 * @param {Object} params
 * @param {number} params.cost - Purchase cost
 * @param {number} params.price - Listing price
 * @param {string[]} [params.platforms] - Platforms to list on
 * @param {number} [params.shipping] - Shipping cost estimate
 * @param {number} [params.tax] - Tax on purchase
 * @returns {Object} Detailed profit breakdown
 */
export function calculateProfit(params) {
  const { cost = 0, price = 0, platforms = [], shipping = 0, tax = 0 } = params;

  const totalCost = cost + tax;

  // Calculate per-platform fee estimates
  const platformBreakdowns = platforms.map(platform => {
    const feeInfo = PLATFORM_FEES[platform] || { pct: 0 };
    const fee = (price * (feeInfo.pct || 0)) + (feeInfo.fixed || 0);
    const netRevenue = price - fee;
    const profit = netRevenue - totalCost - shipping;
    const margin = price > 0 ? profit / price : 0;
    const roi = totalCost > 0 ? profit / totalCost : 0;

    return {
      platform,
      fee: Math.round(fee * 100) / 100,
      feePct: feeInfo.pct || 0,
      netRevenue: Math.round(netRevenue * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      margin,
      roi,
    };
  });

  // Best and worst case
  const profits = platformBreakdowns.map(p => p.profit);
  const bestProfit = profits.length ? Math.max(...profits) : price - totalCost - shipping;
  const worstProfit = profits.length ? Math.min(...profits) : price - totalCost - shipping;
  const avgProfit = profits.length ? profits.reduce((a, b) => a + b, 0) / profits.length : price - totalCost - shipping;

  // Break-even price (what price do we need to just cover costs?)
  const breakEvenPrices = platforms.map(platform => {
    const feeInfo = PLATFORM_FEES[platform] || { pct: 0 };
    // price - (price * feePct + fixed) - cost - ship = 0
    // price * (1 - feePct) = cost + ship + fixed
    const breakEven = (totalCost + shipping + (feeInfo.fixed || 0)) / (1 - (feeInfo.pct || 0));
    return { platform, breakEven: Math.round(breakEven * 100) / 100 };
  });

  return {
    totalCost,
    shipping,
    platforms: platformBreakdowns,
    bestProfit,
    worstProfit,
    avgProfit,
    breakEvenPrices,
    isProfitable: avgProfit > 0,
  };
}

/**
 * Render the profit calculator panel as HTML.
 * Used inline in the add-item form and drawer.
 * @param {Object} params - Same as calculateProfit
 * @returns {string} HTML
 */
export function renderProfitCalc(params) {
  const result = calculateProfit(params);

  if (!params.cost && !params.price) {
    return '<div class="pc-hint">Enter cost and price to see profit estimates</div>';
  }

  const profitColor = result.isProfitable ? 'var(--good)' : 'var(--danger)';
  const profitIcon = result.isProfitable ? '📈' : '📉';

  let html = `<div class="pc-panel">`;

  // Summary
  html += `
    <div class="pc-summary">
      <div class="pc-big" style="color:${profitColor}">${profitIcon} ${fmt(result.avgProfit)}</div>
      <div class="pc-sub">Est. profit${result.platforms.length > 1 ? ' (avg across platforms)' : ''}</div>
    </div>
  `;

  // Per-platform breakdown
  if (result.platforms.length) {
    html += `<div class="pc-platforms">`;
    for (const pb of result.platforms) {
      const cls = pb.profit > 0 ? 'pc-pos' : 'pc-neg';
      html += `
        <div class="pc-plat-row ${cls}">
          <span class="pc-plat-name">${pb.platform}</span>
          <span class="pc-plat-fee">Fee: ${fmt(pb.fee)} (${pct(pb.feePct)})</span>
          <span class="pc-plat-profit" style="color:${pb.profit > 0 ? 'var(--good)' : 'var(--danger)'}">${fmt(pb.profit)}</span>
          <span class="pc-plat-roi">${pb.roi > 0 ? pct(pb.roi) + ' ROI' : ''}</span>
        </div>
      `;
    }
    html += `</div>`;
  }

  // Break-even
  if (result.breakEvenPrices.length) {
    const minBE = Math.min(...result.breakEvenPrices.map(b => b.breakEven));
    html += `<div class="pc-breakeven">Break-even price: ${fmt(minBE)}</div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Quick profit estimate — returns a one-line summary.
 * @param {number} cost
 * @param {number} price
 * @param {string} [platform]
 * @returns {string} e.g. "+$15.00 (42% ROI) after eBay fees"
 */
export function quickProfitEstimate(cost, price, platform) {
  if (!cost || !price) return '';

  const feeInfo = PLATFORM_FEES[platform] || { pct: 0 };
  const fee = (price * (feeInfo.pct || 0)) + (feeInfo.fixed || 0);
  const profit = price - cost - fee;
  const roi = cost > 0 ? profit / cost : 0;

  const sign = profit >= 0 ? '+' : '';
  const platformNote = platform ? ` after ${platform} fees` : '';
  return `${sign}${fmt(profit)} (${pct(roi)} ROI)${platformNote}`;
}
