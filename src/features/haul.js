/**
 * haul.js - Haul calculation logic
 * Pure functions for haul analytics, ROI calculations, and sourcing insights.
 * No DOM manipulation.
 */

import { fmt, pct } from '../utils/format.js';

/**
 * Calculate ROI for a haul based on linked inventory items and sales
 * @param {Object} haul - Haul object with id, totalSpent, itemIds[]
 * @param {Array} inv - Inventory array
 * @param {Array} sales - Sales array
 * @returns {Object} { totalRevenue, totalCost, profit, roi, margin }
 */
export function getHaulROI(haul, inv, sales) {
  if (!haul || !haul.itemIds || !haul.itemIds.length) {
    return { totalRevenue: 0, totalCost: 0, profit: 0, roi: 0, margin: 0 };
  }

  let totalRevenue = 0;
  let totalCost = haul.totalSpent || 0;

  haul.itemIds.forEach(itemId => {
    const item = inv.find(i => i.id === itemId);
    if (!item) return;

    // Find sales for this item
    const itemSales = sales.filter(s => s.itemId === itemId);
    const saleAmount = itemSales.reduce((sum, s) => sum + (s.amount || 0), 0);
    totalRevenue += saleAmount;
  });

  const profit = totalRevenue - totalCost;
  const roi = totalCost ? profit / totalCost : 0;
  const margin = totalRevenue ? profit / totalRevenue : 0;

  return { totalRevenue, totalCost, profit, roi, margin };
}

/**
 * Get inventory items linked to a haul
 * @param {Object} haul - Haul object
 * @param {Array} inv - Inventory array
 * @returns {Array} Array of inventory items
 */
export function getHaulItems(haul, inv) {
  if (!haul || !haul.itemIds) return [];
  return haul.itemIds
    .map(itemId => inv.find(i => i.id === itemId))
    .filter(Boolean);
}

/**
 * Split haul total cost across linked items (equal split)
 * @param {Object} haul - Haul object
 * @param {Array} inv - Inventory array
 * @returns {Object} Map of itemId -> cost allocation
 */
export function splitCost(haul, inv) {
  const items = getHaulItems(haul, inv);
  if (!items.length) return {};

  const costPerItem = (haul.totalSpent || 0) / items.length;
  const result = {};
  items.forEach(item => {
    result[item.id] = costPerItem;
  });
  return result;
}

/**
 * Get aggregated stats grouped by source location
 * @param {Array} hauls - Hauls array
 * @param {Array} inv - Inventory array
 * @param {Array} sales - Sales array
 * @returns {Object} Map of location -> { count, totalSpent, totalRevenue, roi, items }
 */
export function getSourceStats(hauls, inv, sales) {
  const stats = {};

  hauls.forEach(haul => {
    const location = haul.location || 'Unknown';
    if (!stats[location]) {
      stats[location] = {
        location,
        count: 0,
        totalSpent: 0,
        totalRevenue: 0,
        itemCount: 0,
        roi: 0,
        margin: 0
      };
    }

    const haulROI = getHaulROI(haul, inv, sales);
    stats[location].count += 1;
    stats[location].totalSpent += haul.totalSpent || 0;
    stats[location].totalRevenue += haulROI.totalRevenue;
    stats[location].itemCount += haul.itemIds ? haul.itemIds.length : 0;
  });

  // Calculate ROI for each location
  Object.values(stats).forEach(stat => {
    if (stat.totalSpent) {
      stat.roi = (stat.totalRevenue - stat.totalSpent) / stat.totalSpent;
      stat.margin = stat.totalRevenue ? (stat.totalRevenue - stat.totalSpent) / stat.totalRevenue : 0;
    }
  });

  return stats;
}

/**
 * Get top performing sources by ROI
 * @param {Array} hauls - Hauls array
 * @param {Array} inv - Inventory array
 * @param {Array} sales - Sales array
 * @param {number} limit - Max results to return (default 5)
 * @returns {Array} Sorted array of source stats
 */
export function getBestSources(hauls, inv, sales, limit = 5) {
  const stats = getSourceStats(hauls, inv, sales);
  return Object.values(stats)
    .filter(s => s.count > 0)
    .sort((a, b) => b.roi - a.roi)
    .slice(0, limit);
}

/**
 * Get summary stats for all hauls
 * @param {Array} hauls - Hauls array
 * @returns {Object} { totalHauls, totalInvested, avgPerHaul, totalItems, avgItemsPerHaul }
 */
export function getHaulSummary(hauls) {
  const totalHauls = hauls.length;
  const totalInvested = hauls.reduce((sum, h) => sum + (h.totalSpent || 0), 0);
  const totalItems = hauls.reduce((sum, h) => sum + (h.itemIds ? h.itemIds.length : 0), 0);

  return {
    totalHauls,
    totalInvested,
    avgPerHaul: totalHauls ? totalInvested / totalHauls : 0,
    totalItems,
    avgItemsPerHaul: totalHauls ? totalItems / totalHauls : 0
  };
}
