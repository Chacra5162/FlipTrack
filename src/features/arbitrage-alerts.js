/**
 * arbitrage-alerts.js — Marketplace Arbitrage Alerts
 * Flags items where price is significantly below or above market comps.
 * Degrades gracefully offline using local sales data.
 */

import { inv, getSalesForItem } from '../data/store.js';
import { suggestPrice } from './comps.js';
import { fmt } from '../utils/format.js';

/**
 * Scan inventory for arbitrage opportunities.
 * Items priced >20% below comps (underpriced) or >30% above (overpriced).
 * @returns {Promise<Array<{ item: Object, currentPrice: number, compMedian: number, priceDiff: number, percentDiff: number, suggestedAction: string }>>}
 */
export async function scanArbitrageOpportunities() {
  const opportunities = [];
  const candidates = inv.filter(i => i.price > 0 && i.qty > 0 && i.name);

  // Batch comp lookups (cached 30 min, so fast for repeat calls)
  const results = await Promise.allSettled(
    candidates.map(item =>
      suggestPrice(item.name, item.condition).then(comp => ({ item, comp }))
    )
  );

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const { item, comp } = result.value;
    if (!comp || !comp.median || comp.count < 3) continue;

    const priceDiff = item.price - comp.median;
    const percentDiff = (priceDiff / comp.median) * 100;

    if (percentDiff < -20) {
      // Underpriced — selling too low
      opportunities.push({
        item,
        currentPrice: item.price,
        compMedian: comp.median,
        priceDiff: Math.abs(priceDiff),
        percentDiff: Math.abs(percentDiff),
        compCount: comp.count,
        confidence: comp.confidence,
        suggestedAction: `Raise to ${fmt(comp.suggested)} (${Math.abs(Math.round(percentDiff))}% below market)`,
        type: 'underpriced',
      });
    } else if (percentDiff > 30) {
      // Overpriced — may not sell
      opportunities.push({
        item,
        currentPrice: item.price,
        compMedian: comp.median,
        priceDiff,
        percentDiff,
        compCount: comp.count,
        confidence: comp.confidence,
        suggestedAction: `Lower to ${fmt(comp.suggested)} (${Math.round(percentDiff)}% above market)`,
        type: 'overpriced',
      });
    }
  }

  // Sort: biggest underpriced opportunities first
  opportunities.sort((a, b) => {
    if (a.type === 'underpriced' && b.type !== 'underpriced') return -1;
    if (a.type !== 'underpriced' && b.type === 'underpriced') return 1;
    return b.percentDiff - a.percentDiff;
  });

  return opportunities;
}
