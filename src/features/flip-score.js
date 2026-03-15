/**
 * flip-score.js — Unified Flip Score (0-100)
 * Combines margin, freshness, listing quality, and demand signal
 * into a single sortable metric for every inventory item.
 */

import { calc, getSalesForItem } from '../data/store.js';
import { scoreItem } from '../features/listing-score.js';
import { daysSince } from '../utils/format.js';

/**
 * Compute a 0-100 Flip Score for an inventory item.
 * @param {Object} item - Inventory item object
 * @returns {{ score: number, grade: string, breakdown: { margin: number, freshness: number, listing: number, demand: number } }}
 */
export function computeFlipScore(item) {
  if (!item) return { score: 0, grade: 'F', breakdown: { margin: 0, freshness: 0, listing: 0, demand: 0 } };

  // ── Margin (0-30 pts) ─────────────────────────────────────────────
  const { m } = calc(item);
  let margin = 0;
  if (m >= 0.6) margin = 30;
  else if (m >= 0.45) margin = 25;
  else if (m >= 0.3) margin = 20;
  else if (m >= 0.15) margin = 12;
  else if (m > 0) margin = 5;

  // ── Freshness (0-25 pts) — newer items score higher ───────────────
  const daysOld = daysSince(item.added);
  let freshness = 0;
  if (daysOld <= 3) freshness = 25;
  else if (daysOld <= 7) freshness = 22;
  else if (daysOld <= 14) freshness = 18;
  else if (daysOld <= 30) freshness = 13;
  else if (daysOld <= 60) freshness = 7;
  else if (daysOld <= 90) freshness = 3;

  // ── Listing Quality (0-25 pts) — from listing-score.js ────────────
  const ls = scoreItem(item);
  const listing = Math.round(ls.total / 4); // scale 0-100 → 0-25

  // ── Demand Signal (0-20 pts) — based on sales history ─────────────
  const itemSales = getSalesForItem(item.id);
  let demand = 0;
  if (itemSales.length >= 5) demand = 20;
  else if (itemSales.length >= 3) demand = 15;
  else if (itemSales.length >= 1) demand = 10;
  // Bonus for recent sale (within 14 days)
  if (itemSales.length) {
    const lastSale = Math.max(...itemSales.map(s => new Date(s.date).getTime()));
    const daysSinceSale = Math.floor((Date.now() - lastSale) / 86400000);
    if (daysSinceSale <= 14 && demand < 20) demand = Math.min(20, demand + 5);
  }

  const score = margin + freshness + listing + demand;
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F';

  return { score, grade, breakdown: { margin, freshness, listing, demand } };
}
