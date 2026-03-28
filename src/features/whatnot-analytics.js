/**
 * whatnot-analytics.js — Whatnot Show Analytics & Smart Builder
 * Pure calculation functions for show performance metrics,
 * aggregate analytics, and smart show item suggestions.
 */

import { inv, sales, getInvItem } from '../data/store.js';
import { getPlatforms } from './platforms.js';
import { PLATFORM_FEES } from '../config/platforms.js';
import { fmt } from '../utils/format.js';
import {
  getShows, getEndedShows, getItemShowHistory, getItemShowsWithoutSale, getTotalGiveawayCost
} from './whatnot-show.js';

// ── PER-SHOW METRICS ────────────────────────────────────────────────────

/**
 * Calculate sell-through rate for a show.
 * @returns {number} 0-1 ratio
 */
export function calcShowSellThrough(show) {
  if (!show?.items?.length) return 0;
  return (show.soldCount || 0) / show.items.length;
}

/**
 * Revenue for a show (sum of sold item prices).
 */
export function calcShowRevenue(show) {
  return show?.totalRevenue || 0;
}

/**
 * Show profit = revenue - COGS - Whatnot fees - expenses.
 * Whatnot: 8% commission on sale price + 2.9% + $0.30 processing on order total.
 * For show-level estimates we approximate using total revenue (no per-item shipping).
 */
export function calcShowProfit(show) {
  if (!show) return 0;
  const revenue = show.totalRevenue || 0;
  const soldCount = show.soldItems ? Object.keys(show.soldItems).length : 0;
  // Commission: 8% on sale price, Processing: 2.9% + $0.30 per transaction
  const fees = (revenue * 0.08) + (revenue * 0.029) + (soldCount * 0.30);
  const expenses = show.showExpenses || 0;

  // Sum COGS from sold items
  let cogs = 0;
  if (show.soldItems) {
    for (const itemId of Object.keys(show.soldItems)) {
      const item = getInvItem(itemId);
      if (item) cogs += item.cost || 0;
    }
  }

  return revenue - cogs - fees - expenses;
}

/**
 * Revenue per hour of streaming.
 */
export function calcShowRevenuePerHour(show) {
  if (!show?.startedAt || !show?.endedAt) return 0;
  const hours = (show.endedAt - show.startedAt) / 3600000;
  if (hours <= 0) return 0;
  return (show.totalRevenue || 0) / hours;
}

/**
 * Average sold item price.
 */
export function calcShowAvgItemPrice(show) {
  if (!show?.soldCount) return 0;
  return (show.totalRevenue || 0) / show.soldCount;
}

/**
 * Duration in hours.
 */
export function calcShowDuration(show) {
  if (!show?.startedAt || !show?.endedAt) return 0;
  return Math.max(0, (show.endedAt - show.startedAt) / 3600000);
}

/**
 * Full metrics for a single show.
 */
export function getShowMetrics(show) {
  return {
    sellThrough: calcShowSellThrough(show),
    revenue: calcShowRevenue(show),
    profit: calcShowProfit(show),
    revenuePerHour: calcShowRevenuePerHour(show),
    avgItemPrice: calcShowAvgItemPrice(show),
    duration: calcShowDuration(show),
    itemCount: show?.items?.length || 0,
    soldCount: show?.soldCount || 0,
    viewerPeak: show?.viewerPeak || 0,
  };
}

// ── AGGREGATE ANALYTICS ─────────────────────────────────────────────────

/**
 * Best day of week for shows (highest avg sell-through).
 * @returns {{ day: number, dayName: string, avgSellThrough: number, showCount: number }[]}
 */
export function calcBestShowDay() {
  const ended = getEndedShows();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byDay = Array.from({ length: 7 }, () => ({ total: 0, count: 0 }));

  for (const show of ended) {
    if (!show.date) continue;
    const d = new Date(show.date + 'T12:00:00').getDay();
    byDay[d].total += calcShowSellThrough(show);
    byDay[d].count++;
  }

  return byDay.map((d, i) => ({
    day: i,
    dayName: days[i],
    avgSellThrough: d.count ? d.total / d.count : 0,
    showCount: d.count,
  })).sort((a, b) => b.avgSellThrough - a.avgSellThrough);
}

/**
 * Best time slot for shows.
 * Groups by hour buckets: morning (6-12), afternoon (12-17), evening (17-21), night (21+).
 */
export function calcBestShowTime() {
  const ended = getEndedShows();
  const slots = {
    morning:   { label: 'Morning (6am-12pm)', total: 0, count: 0, rev: 0 },
    afternoon: { label: 'Afternoon (12-5pm)', total: 0, count: 0, rev: 0 },
    evening:   { label: 'Evening (5-9pm)',    total: 0, count: 0, rev: 0 },
    night:     { label: 'Night (9pm+)',       total: 0, count: 0, rev: 0 },
  };

  for (const show of ended) {
    if (!show.time) continue;
    const hr = parseInt(show.time.split(':')[0]) || 0;
    const slot = hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : hr < 21 ? 'evening' : 'night';
    slots[slot].total += calcShowSellThrough(show);
    slots[slot].rev += show.totalRevenue || 0;
    slots[slot].count++;
  }

  return Object.entries(slots).map(([key, s]) => ({
    slot: key,
    label: s.label,
    avgSellThrough: s.count ? s.total / s.count : 0,
    avgRevenue: s.count ? s.rev / s.count : 0,
    showCount: s.count,
  })).sort((a, b) => b.avgSellThrough - a.avgSellThrough);
}

/**
 * Category performance across all ended shows.
 * @returns {{ category, shown, sold, sellThrough, totalRevenue }[]}
 */
export function calcCategoryPerformance() {
  const ended = getEndedShows();
  const cats = {};

  for (const show of ended) {
    for (const itemId of show.items) {
      const item = getInvItem(itemId);
      if (!item) continue;
      const cat = item.category || 'Uncategorized';
      if (!cats[cat]) cats[cat] = { shown: 0, sold: 0, revenue: 0 };
      cats[cat].shown++;
      if (show.soldItems?.[itemId]) {
        cats[cat].sold++;
        cats[cat].revenue += show.soldItems[itemId].price || 0;
      }
    }
  }

  return Object.entries(cats).map(([category, d]) => ({
    category,
    shown: d.shown,
    sold: d.sold,
    sellThrough: d.shown ? d.sold / d.shown : 0,
    totalRevenue: d.revenue,
  })).sort((a, b) => b.sellThrough - a.sellThrough);
}

/**
 * Sell-through & revenue trend over last N shows.
 * @param {number} n - Number of recent shows
 * @returns {{ name, date, sellThrough, revenue, profit }[]}
 */
export function calcShowTrends(n = 10) {
  const ended = getEndedShows(n).reverse(); // oldest first for chart
  return ended.map(show => ({
    name: show.name,
    date: show.date,
    sellThrough: calcShowSellThrough(show),
    revenue: show.totalRevenue || 0,
    profit: calcShowProfit(show),
    soldCount: show.soldCount || 0,
    itemCount: show.items?.length || 0,
  }));
}

/**
 * Items with highest sell rate across shows.
 */
export function calcTopPerformingItems(limit = 10) {
  const ended = getEndedShows();
  const itemStats = {};

  for (const show of ended) {
    for (const itemId of show.items) {
      if (!itemStats[itemId]) itemStats[itemId] = { shown: 0, sold: 0, revenue: 0 };
      itemStats[itemId].shown++;
      if (show.soldItems?.[itemId]) {
        itemStats[itemId].sold++;
        itemStats[itemId].revenue += show.soldItems[itemId].price || 0;
      }
    }
  }

  return Object.entries(itemStats)
    .filter(([, d]) => d.shown >= 1)
    .map(([itemId, d]) => ({
      item: getInvItem(itemId),
      itemId,
      shown: d.shown,
      sold: d.sold,
      sellRate: d.shown ? d.sold / d.shown : 0,
      totalRevenue: d.revenue,
    }))
    .filter(d => d.item)
    .sort((a, b) => b.sellRate - a.sellRate || b.sold - a.sold)
    .slice(0, limit);
}

/**
 * Items shown N+ times without selling.
 */
export function calcWorstPerformingItems(minShows = 2, limit = 10) {
  const ended = getEndedShows();
  const itemStats = {};

  for (const show of ended) {
    for (const itemId of show.items) {
      if (!itemStats[itemId]) itemStats[itemId] = { shown: 0, sold: 0 };
      itemStats[itemId].shown++;
      if (show.soldItems?.[itemId]) itemStats[itemId].sold++;
    }
  }

  return Object.entries(itemStats)
    .filter(([, d]) => d.shown >= minShows && d.sold === 0)
    .map(([itemId, d]) => ({
      item: getInvItem(itemId),
      itemId,
      shown: d.shown,
    }))
    .filter(d => d.item && (d.item.qty || 0) > 0) // still in stock
    .sort((a, b) => b.shown - a.shown)
    .slice(0, limit);
}

/**
 * Overall Whatnot summary stats.
 */
export function calcOverallStats() {
  const ended = getEndedShows();
  if (!ended.length) return null;

  let totalRevenue = 0, totalProfit = 0, totalSold = 0, totalItems = 0, totalHours = 0;
  for (const show of ended) {
    totalRevenue += show.totalRevenue || 0;
    totalProfit += calcShowProfit(show);
    totalSold += show.soldCount || 0;
    totalItems += show.items?.length || 0;
    totalHours += calcShowDuration(show);
  }

  return {
    showCount: ended.length,
    totalRevenue,
    totalProfit,
    totalSold,
    totalItems,
    avgSellThrough: totalItems ? totalSold / totalItems : 0,
    avgRevenuePerShow: totalRevenue / ended.length,
    avgProfitPerShow: totalProfit / ended.length,
    totalHours,
    revenuePerHour: totalHours ? totalRevenue / totalHours : 0,
  };
}

// ── SMART BUILDER SUGGESTIONS ───────────────────────────────────────────

/**
 * Suggest items for a new show based on inventory data and show history.
 * @param {number} count - Target number of suggestions
 * @returns {Array<{ item, reason, score }>}
 */
export function suggestShowItems(count = 20) {
  const now = Date.now();
  const msDay = 86400000;
  const ended = getEndedShows();
  const candidates = [];

  // Build category performance lookup
  const catPerf = {};
  for (const cp of calcCategoryPerformance()) {
    catPerf[cp.category] = cp.sellThrough;
  }

  for (const item of inv) {
    if ((item.qty || 0) <= 0) continue; // out of stock

    let score = 0;
    const reasons = [];

    // High margin items
    const margin = (item.price || 0) - (item.cost || 0);
    if (margin > 0) {
      score += Math.min(margin / 50, 3); // up to 3 pts for margin
      if (margin > 20) reasons.push('High margin');
    }

    // Never shown on Whatnot
    const history = getItemShowHistory(item.id);
    if (history.length === 0) {
      score += 2;
      reasons.push('Never shown');
    }

    // Previously sold on Whatnot (proven seller)
    const soldShows = history.filter(h => h.wasSold);
    if (soldShows.length > 0) {
      score += soldShows.length * 1.5;
      reasons.push(`Sold in ${soldShows.length} show${soldShows.length > 1 ? 's' : ''}`);
    }

    // In a hot category
    const catST = catPerf[item.category] || 0;
    if (catST > 0.5) {
      score += 2;
      reasons.push('Hot category');
    }

    // Stale inventory (death pile candidate — give it Whatnot exposure)
    const daysInInv = item.added ? (now - new Date(item.added).getTime()) / msDay : 0;
    if (daysInInv > 30 && !item.platformStatus?.Whatnot) {
      score += 1.5;
      reasons.push('Stale — needs exposure');
    }

    // Expiring on other platforms soon
    const listingDates = item.platformListingDates || {};
    for (const [plat, d] of Object.entries(listingDates)) {
      if (plat === 'Whatnot') continue;
      const daysListed = (now - new Date(d).getTime()) / msDay;
      if (daysListed > 50) {
        score += 1;
        reasons.push(`${plat} listing aging`);
        break;
      }
    }

    // Skip items currently in a prep/live show
    const inUpcoming = getShows().some(s =>
      (s.status === 'prep' || s.status === 'live') && s.items.includes(item.id)
    );
    if (inUpcoming) score -= 5;

    // Shown too many times without selling — penalize
    const unsoldShows = getItemShowsWithoutSale(item.id);
    if (unsoldShows >= 3) {
      score -= 2;
      reasons.push(`Unsold in ${unsoldShows} shows`);
    }

    if (score > 0 && reasons.length > 0) {
      candidates.push({ item, reason: reasons[0], reasons, score });
    }
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

/**
 * Suggest optimal show size based on historical sell-through.
 * @returns {{ recommended: number, min: number, max: number, avgSellThrough: number }}
 */
export function suggestShowSize() {
  const ended = getEndedShows();
  if (ended.length < 2) return { recommended: 15, min: 10, max: 25, avgSellThrough: 0 };

  // Find show size with best sell-through
  const bySize = {};
  for (const show of ended) {
    const size = show.items?.length || 0;
    const bucket = Math.round(size / 5) * 5 || 5; // bucket by 5s
    if (!bySize[bucket]) bySize[bucket] = { total: 0, count: 0 };
    bySize[bucket].total += calcShowSellThrough(show);
    bySize[bucket].count++;
  }

  let bestBucket = 15, bestST = 0;
  for (const [bucket, d] of Object.entries(bySize)) {
    const avg = d.total / d.count;
    if (avg > bestST) { bestST = avg; bestBucket = parseInt(bucket); }
  }

  const avgSize = ended.reduce((s, sh) => s + (sh.items?.length || 0), 0) / ended.length;

  return {
    recommended: bestBucket || Math.round(avgSize),
    min: Math.max(5, bestBucket - 5),
    max: bestBucket + 10,
    avgSellThrough: bestST,
  };
}

/**
 * Suggest category mix based on historical performance.
 * @returns {{ category, percentage, sellThrough }[]}
 */
export function suggestCategoryMix() {
  const perf = calcCategoryPerformance();
  if (!perf.length) return [];

  // Weight by sell-through and volume
  const total = perf.reduce((s, p) => s + p.sellThrough * p.shown, 0);
  if (!total) return perf.slice(0, 5).map(p => ({ ...p, percentage: 1 / perf.length }));

  return perf.slice(0, 8).map(p => ({
    category: p.category,
    percentage: (p.sellThrough * p.shown) / total,
    sellThrough: p.sellThrough,
    shown: p.shown,
    sold: p.sold,
  }));
}

// ── SHOW-TO-SHOW COMPARISON ────────────────────────────────────────────

/**
 * Compare two shows side-by-side.
 * @returns {{ labels: string[], showA: Object, showB: Object, diffs: Object }}
 */
export function compareShows(showIdA, showIdB) {
  const ended = getEndedShows();
  const a = ended.find(s => s.id === showIdA);
  const b = ended.find(s => s.id === showIdB);
  if (!a || !b) return null;

  const ma = getShowMetrics(a);
  const mb = getShowMetrics(b);
  const ga = getTotalGiveawayCost(a.id);
  const gb = getTotalGiveawayCost(b.id);

  const fields = [
    { label: 'Items', a: ma.itemCount, b: mb.itemCount },
    { label: 'Sold', a: ma.soldCount, b: mb.soldCount },
    { label: 'Sell-Through', a: ma.sellThrough, b: mb.sellThrough, pct: true },
    { label: 'Revenue', a: ma.revenue, b: mb.revenue, money: true },
    { label: 'Profit', a: ma.profit, b: mb.profit, money: true },
    { label: 'Rev/Hour', a: ma.revenuePerHour, b: mb.revenuePerHour, money: true },
    { label: 'Duration', a: ma.duration, b: mb.duration, hrs: true },
    { label: 'Peak Viewers', a: a.viewerPeak || 0, b: b.viewerPeak || 0 },
    { label: 'Avg Item Price', a: ma.avgItemPrice, b: mb.avgItemPrice, money: true },
    { label: 'Giveaway Cost', a: ga, b: gb, money: true },
  ];

  return {
    showA: { name: a.name, date: a.date, metrics: ma },
    showB: { name: b.name, date: b.date, metrics: mb },
    fields,
  };
}

// ── CATEGORY ROTATION PLANNER ─────────���────────────────────────────────

/**
 * Identify categories that haven't been featured recently.
 * @returns {{ category, lastShownDate, daysSinceShown, avgSellThrough, suggestion }[]}
 */
export function calcCategoryRotation() {
  const ended = getEndedShows();
  const catPerf = calcCategoryPerformance();
  const catPerfMap = {};
  for (const c of catPerf) catPerfMap[c.category] = c;

  // Find last show date per category
  const catLastShown = {};
  for (const show of ended) {
    for (const itemId of show.items) {
      const item = getInvItem(itemId);
      if (!item) continue;
      const cat = item.category || 'Uncategorized';
      const showDate = show.endedAt || 0;
      if (!catLastShown[cat] || showDate > catLastShown[cat]) {
        catLastShown[cat] = showDate;
      }
    }
  }

  // Also include categories with inventory that have NEVER been shown
  const allCats = new Set();
  for (const item of inv) {
    if ((item.qty || 0) > 0 && item.category) allCats.add(item.category);
  }
  for (const cat of allCats) {
    if (!catLastShown[cat]) catLastShown[cat] = 0;
  }

  const now = Date.now();
  const msDay = 86400000;

  return Object.entries(catLastShown)
    .map(([category, lastTs]) => {
      const daysSince = lastTs ? Math.round((now - lastTs) / msDay) : 999;
      const perf = catPerfMap[category];
      const avgST = perf?.sellThrough || 0;
      const inStockCount = inv.filter(i => (i.qty || 0) > 0 && i.category === category).length;
      let suggestion = '';
      if (daysSince > 21 && avgST > 0.4) suggestion = 'Overdue — strong seller, schedule soon';
      else if (daysSince > 14) suggestion = 'Due for rotation';
      else if (daysSince === 999) suggestion = 'Never shown on Whatnot';
      return {
        category,
        lastShownDate: lastTs ? new Date(lastTs).toISOString().slice(0, 10) : 'Never',
        daysSinceShown: daysSince,
        avgSellThrough: avgST,
        inStockCount,
        suggestion,
      };
    })
    .filter(c => c.inStockCount > 0)
    .sort((a, b) => b.daysSinceShown - a.daysSinceShown);
}

// ── STARTING BID / BIN PRICING RECOMMENDATIONS ────────────────────────

/**
 * Suggest a starting bid for an item based on show history and comp data.
 * Uses the pattern: starting bid ≈ 30-50% of expected sale price.
 * @param {string} itemId
 * @returns {{ suggestedBid, minBid, maxBid, reasoning, compPrice }}
 */
export function suggestStartingBid(itemId) {
  const item = getInvItem(itemId);
  if (!item) return null;

  const price = item.price || 0;
  const cost = item.cost || 0;

  // Check Whatnot show history for this item
  const history = getItemShowHistory(itemId);
  const soldHistory = history.filter(h => h.wasSold);
  const avgSoldPrice = soldHistory.length
    ? soldHistory.reduce((s, h) => s + h.salePrice, 0) / soldHistory.length
    : 0;

  // Check if item has comp/market data
  const compPrice = item.compMedian || item.compAvg || 0;

  // Reference price: best available price signal
  const refPrice = avgSoldPrice || compPrice || price;
  if (!refPrice) return { suggestedBid: 1, minBid: 1, maxBid: 5, reasoning: 'No price data — start at $1' };

  // Starting bid strategy:
  // - New items (never shown): 35% of ref price to drive bidding
  // - Previously sold: 40% of avg sold price
  // - Slow movers (shown 2+ times, never sold): 20% of ref price
  const unsoldShows = getItemShowsWithoutSale(itemId);
  let bidPct, reasoning;

  if (unsoldShows >= 2) {
    bidPct = 0.20;
    reasoning = `Shown ${unsoldShows}× without selling — low start to attract bids`;
  } else if (soldHistory.length > 0) {
    bidPct = 0.40;
    reasoning = `Sold ${soldHistory.length}× before (avg ${fmt(avgSoldPrice)}) — confident pricing`;
  } else if (compPrice) {
    bidPct = 0.35;
    reasoning = `Comp data suggests ${fmt(compPrice)} — starting at 35%`;
  } else {
    bidPct = 0.35;
    reasoning = `Based on list price ${fmt(price)} — starting at 35%`;
  }

  const suggestedBid = Math.max(1, Math.round(refPrice * bidPct));
  const minBid = Math.max(1, Math.round(refPrice * 0.15));
  const maxBid = Math.max(suggestedBid, Math.round(refPrice * 0.60));

  return {
    suggestedBid,
    minBid,
    maxBid,
    reasoning,
    refPrice,
    compPrice,
    costFloor: cost > 0 ? cost : null,
  };
}

/**
 * Suggest starting bids for all items in a show.
 */
export function suggestShowBids(showId) {
  const shows = getEndedShows().concat(
    // Include upcoming shows too
    getShows().filter(s => s.status === 'prep' || s.status === 'live')
  );
  const show = shows.find(s => s.id === showId);
  if (!show) return [];
  return show.items.map(itemId => ({
    itemId,
    item: getInvItem(itemId),
    ...suggestStartingBid(itemId),
  })).filter(r => r.item);
}

// ── GOAL TRACKING ANALYTICS ────────────────────────────────────────────

/**
 * Calculate goal hit rate across all shows with goals set.
 */
export function calcGoalStats() {
  const ended = getEndedShows();
  const withGoals = ended.filter(s => s.revenueGoal > 0);
  if (!withGoals.length) return null;

  const hits = withGoals.filter(s => (s.totalRevenue || 0) >= s.revenueGoal);
  const totalGoal = withGoals.reduce((s, sh) => s + sh.revenueGoal, 0);
  const totalActual = withGoals.reduce((s, sh) => s + (sh.totalRevenue || 0), 0);

  return {
    showsWithGoals: withGoals.length,
    goalsHit: hits.length,
    hitRate: hits.length / withGoals.length,
    avgGoal: totalGoal / withGoals.length,
    avgActual: totalActual / withGoals.length,
    overPerformPct: totalGoal > 0 ? (totalActual - totalGoal) / totalGoal : 0,
  };
}
