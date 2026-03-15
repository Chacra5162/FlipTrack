/**
 * source-score.js — BUY / PASS / MAYBE Sourcing Verdict
 * When scanning an item at a store, shows instant buy verdict with estimated profit.
 * Depends on comps auto-pricing (suggestPrice from comps.js).
 */

import { sales, getInvItem } from '../data/store.js';
import { fmt } from '../utils/format.js';

/**
 * Compute a sourcing verdict for an item being evaluated for purchase.
 * @param {{ compData: Object, aiResult: Object, userCost: number }} params
 * @returns {{ verdict: string, score: number, estimatedProfit: number, daysToSell: number|null, reasons: string[] }}
 */
export function computeSourceScore({ compData, aiResult, userCost }) {
  const reasons = [];
  let score = 0;

  // Determine sell price from comp data or AI estimate
  const sellPrice = compData?.suggested || compData?.median || aiResult?.estimatedMid || 0;
  if (!sellPrice || !userCost) {
    return { verdict: 'PASS', score: 0, estimatedProfit: 0, daysToSell: null, reasons: ['Missing price or cost data'] };
  }

  // Estimated profit (rough — assumes ~13% marketplace fees)
  const feeRate = 0.13;
  const estFees = sellPrice * feeRate;
  const estimatedProfit = sellPrice - userCost - estFees;
  const margin = sellPrice > 0 ? (sellPrice - userCost) / sellPrice : 0;

  // ── Margin scoring ────────────────────────────────────────────────
  if (margin >= 0.5) { score += 40; reasons.push(`${Math.round(margin * 100)}% margin — excellent`); }
  else if (margin >= 0.4) { score += 30; reasons.push(`${Math.round(margin * 100)}% margin — strong`); }
  else if (margin >= 0.25) { score += 20; reasons.push(`${Math.round(margin * 100)}% margin — decent`); }
  else if (margin >= 0.15) { score += 10; reasons.push(`${Math.round(margin * 100)}% margin — thin`); }
  else { reasons.push(`${Math.round(margin * 100)}% margin — too low`); }

  // ── Comp confidence scoring ───────────────────────────────────────
  const confidence = compData?.confidence || 'low';
  if (confidence === 'high') { score += 25; reasons.push('High comp confidence'); }
  else if (confidence === 'medium') { score += 15; reasons.push('Medium comp confidence'); }
  else { score += 5; reasons.push('Low comp confidence — research further'); }

  // ── Profit amount scoring ─────────────────────────────────────────
  if (estimatedProfit >= 30) { score += 20; }
  else if (estimatedProfit >= 15) { score += 12; }
  else if (estimatedProfit >= 5) { score += 5; }

  // ── Days to sell estimate from user's own sales history ───────────
  const category = aiResult?.category || '';
  let daysToSell = null;
  if (category) {
    const catSales = [];
    for (const sale of sales) {
      const item = getInvItem(sale.itemId);
      if (!item || (item.category || '').toLowerCase() !== category.toLowerCase()) continue;
      if (item.added && sale.date) {
        const d = Math.max(1, Math.floor((new Date(sale.date).getTime() - new Date(item.added).getTime()) / 86400000));
        catSales.push(d);
      }
    }
    if (catSales.length >= 3) {
      catSales.sort((a, b) => a - b);
      daysToSell = catSales[Math.floor(catSales.length / 2)]; // median
      if (daysToSell <= 14) { score += 15; reasons.push(`Sells fast (~${daysToSell}d avg in ${category})`); }
      else if (daysToSell <= 30) { score += 8; reasons.push(`Moderate sell time (~${daysToSell}d in ${category})`); }
      else { reasons.push(`Slow category (~${daysToSell}d avg)`); }
    }
  }

  // ── Final verdict ─────────────────────────────────────────────────
  let verdict;
  if (margin >= 0.4 && confidence !== 'low') verdict = 'BUY';
  else if (margin >= 0.15 || (margin >= 0.1 && confidence === 'high')) verdict = 'MAYBE';
  else verdict = 'PASS';

  // Override: if profit < $3, always PASS
  if (estimatedProfit < 3) { verdict = 'PASS'; reasons.push('Estimated profit under $3'); }

  return { verdict, score: Math.min(100, score), estimatedProfit, daysToSell, reasons };
}
