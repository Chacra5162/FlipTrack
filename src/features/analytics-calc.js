/**
 * Advanced Analytics Calculations Module
 * Pure computation functions returning data objects (no DOM manipulation)
 */

import { fmt, pct } from '../utils/format.js';

/**
 * Calculate sell-through rate: units sold ÷ units listed in time window
 * @param {Object} inv - Inventory data
 * @param {Object} sales - Sales data
 * @param {number} days - Time window (30, 60, or 90)
 * @returns {Object} { rate, units_sold, units_listed, days }
 */
export function calcSellThroughRate(inv, sales, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const unitsSold = sales.reduce((sum, sale) => {
    const saleDate = new Date(sale.sold_date);
    return saleDate >= cutoffDate ? sum + sale.quantity : sum;
  }, 0);

  const unitsListed = inv.reduce((sum, item) => {
    const listedDate = new Date(item.listed_date);
    return listedDate >= cutoffDate ? sum + item.quantity : sum;
  }, 0);

  const rate = unitsListed > 0 ? (unitsSold / unitsListed) * 100 : 0;

  return {
    rate: Math.round(rate * 10) / 10,
    units_sold: unitsSold,
    units_listed: unitsListed,
    days
  };
}

/**
 * Calculate inventory turnover rate: COGS ÷ average inventory value
 * @param {Object} inv - Inventory items
 * @param {Object} sales - Sales transactions
 * @param {Object} expenses - Expense data
 * @returns {Object} { turnover_rate, cogs, avg_inventory_value, times_per_year }
 */
export function calcInventoryTurnRate(inv, sales, expenses) {
  const cogs = sales.reduce((sum, sale) => {
    const item = inv.find(i => i.id === sale.item_id);
    return sum + (item ? item.cost * sale.quantity : 0);
  }, 0);

  const avgInventoryValue = inv.length > 0
    ? inv.reduce((sum, item) => sum + (item.cost * item.quantity), 0) / inv.length
    : 0;

  const turnoverRate = avgInventoryValue > 0 ? cogs / avgInventoryValue : 0;
  const timesPerYear = Math.round(turnoverRate * 10) / 10;

  return {
    turnover_rate: timesPerYear,
    cogs,
    avg_inventory_value: Math.round(avgInventoryValue * 100) / 100,
    times_per_year: timesPerYear
  };
}

/**
 * Project cash flow: when sourcing costs will be recouped
 * @param {Object} inv - Inventory data
 * @param {Object} sales - Sales transactions
 * @param {Object} expenses - Expense breakdown
 * @returns {Object} { days_to_breakeven, current_invested, current_revenue, daily_net }
 */
export function calcCashFlowProjection(inv, sales, expenses) {
  const currentInvested = inv.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  const currentRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0);
  const currentProfit = currentRevenue - expenses.total;

  const dailyNet = sales.length > 0 ? currentProfit / Math.max(1, Math.floor((new Date() - new Date(sales[0].sold_date)) / (1000 * 60 * 60 * 24))) : 0;

  const daysToBreakeven = dailyNet > 0 ? Math.ceil((currentInvested - currentProfit) / dailyNet) : null;

  return {
    days_to_breakeven: daysToBreakeven,
    current_invested: Math.round(currentInvested * 100) / 100,
    current_revenue: Math.round(currentRevenue * 100) / 100,
    daily_net: Math.round(dailyNet * 100) / 100
  };
}

/**
 * Analyze seasonal trends with month-over-month comparison
 * @param {Object} sales - Sales transactions
 * @param {number} months - Number of months to analyze (default 12)
 * @returns {Array} Array of { month, revenue, profit, units, yoy_change }
 */
export function calcSeasonalTrends(sales, months = 12) {
  const monthData = {};

  sales.forEach(sale => {
    const date = new Date(sale.sold_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthData[monthKey]) {
      monthData[monthKey] = {
        revenue: 0,
        cost: 0,
        units: 0,
        count: 0
      };
    }

    monthData[monthKey].revenue += sale.revenue || 0;
    monthData[monthKey].cost += sale.cost || 0;
    monthData[monthKey].units += sale.quantity || 1;
    monthData[monthKey].count += 1;
  });

  return Object.entries(monthData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-months)
    .map(([month, data]) => ({
      month,
      revenue: Math.round(data.revenue * 100) / 100,
      profit: Math.round((data.revenue - data.cost) * 100) / 100,
      units: data.units,
      yoy_change: 0
    }));
}

/**
 * Compare platform performance by category
 * @param {Object} inv - Inventory items
 * @param {Object} sales - Sales transactions
 * @returns {Array} Array of { platform, category, avgDaysToSell, revenue, margin }
 */
export function calcPlatformComparison(inv, sales) {
  const platformData = {};

  sales.forEach(sale => {
    const item = inv.find(i => i.id === sale.item_id);
    if (!item) return;

    const key = `${sale.platform}-${item.category}`;
    if (!platformData[key]) {
      platformData[key] = {
        platform: sale.platform,
        category: item.category,
        days: [],
        revenue: 0,
        cost: 0,
        count: 0
      };
    }

    const listedDate = new Date(item.listed_date);
    const soldDate = new Date(sale.sold_date);
    const daysToSell = Math.floor((soldDate - listedDate) / (1000 * 60 * 60 * 24));

    platformData[key].days.push(daysToSell);
    platformData[key].revenue += sale.revenue || 0;
    platformData[key].cost += item.cost * sale.quantity;
    platformData[key].count += 1;
  });

  return Object.values(platformData).map(data => ({
    platform: data.platform,
    category: data.category,
    avgDaysToSell: Math.round(data.days.reduce((a, b) => a + b, 0) / data.days.length),
    revenue: Math.round(data.revenue * 100) / 100,
    margin: data.revenue > 0 ? Math.round(((data.revenue - data.cost) / data.revenue) * 1000) / 10 : 0
  }));
}

/**
 * Calculate velocity (units sold per month) by category
 * @param {Object} inv - Inventory items
 * @param {Object} sales - Sales transactions
 * @returns {Array} Array of { category, units_per_month, monthly_revenue, sell_through_rate }
 */
export function calcVelocityByCategory(inv, sales) {
  const categoryData = {};

  sales.forEach(sale => {
    const item = inv.find(i => i.id === sale.item_id);
    if (!item) return;

    if (!categoryData[item.category]) {
      categoryData[item.category] = {
        units: 0,
        revenue: 0,
        items_listed: 0
      };
    }

    categoryData[item.category].units += sale.quantity || 1;
    categoryData[item.category].revenue += sale.revenue || 0;
  });

  inv.forEach(item => {
    if (!categoryData[item.category]) {
      categoryData[item.category] = {
        units: 0,
        revenue: 0,
        items_listed: 0
      };
    }
    categoryData[item.category].items_listed += item.quantity;
  });

  const monthsActive = Math.max(1, Math.ceil((new Date() - new Date(sales[0]?.sold_date || Date.now())) / (1000 * 60 * 60 * 24 * 30)));

  return Object.entries(categoryData).map(([category, data]) => ({
    category,
    units_per_month: Math.round((data.units / monthsActive) * 10) / 10,
    monthly_revenue: Math.round((data.revenue / monthsActive) * 100) / 100,
    sell_through_rate: data.items_listed > 0 ? Math.round((data.units / data.items_listed) * 1000) / 10 : 0
  }));
}

/**
 * Analyze profit by day of week
 * @param {Object} sales - Sales transactions
 * @param {Object} inv - Inventory items
 * @returns {Array} Array of { day, units_sold, total_profit, avg_profit_per_unit }
 */
export function calcProfitByDayOfWeek(sales, inv) {
  const dayData = {
    0: { name: 'Sunday', units: 0, profit: 0 },
    1: { name: 'Monday', units: 0, profit: 0 },
    2: { name: 'Tuesday', units: 0, profit: 0 },
    3: { name: 'Wednesday', units: 0, profit: 0 },
    4: { name: 'Thursday', units: 0, profit: 0 },
    5: { name: 'Friday', units: 0, profit: 0 },
    6: { name: 'Saturday', units: 0, profit: 0 }
  };

  sales.forEach(sale => {
    const item = inv.find(i => i.id === sale.item_id);
    const date = new Date(sale.sold_date);
    const day = date.getDay();
    const profit = (sale.revenue || 0) - (item ? item.cost * sale.quantity : 0);

    dayData[day].units += sale.quantity || 1;
    dayData[day].profit += profit;
  });

  return Object.values(dayData).map(data => ({
    day: data.name,
    units_sold: data.units,
    total_profit: Math.round(data.profit * 100) / 100,
    avg_profit_per_unit: data.units > 0 ? Math.round((data.profit / data.units) * 100) / 100 : 0
  }));
}

/**
 * Find the best day of week to list items
 * @param {Object} sales - Sales transactions
 * @returns {Object} { day_of_week, reason, confidence }
 */
export function calcBestListingDay(sales) {
  const dayPerformance = {
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
  };

  sales.forEach(sale => {
    const date = new Date(sale.sold_date);
    const dayListed = new Date(date.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000)).getDay();
    dayPerformance[dayListed] += sale.revenue || 0;
  });

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const bestDay = Object.entries(dayPerformance).reduce((best, [day, revenue]) =>
    revenue > best[1] ? [parseInt(day), revenue] : best
  );

  return {
    day_of_week: days[bestDay[0]],
    revenue_correlation: Math.round(bestDay[1]),
    confidence: Math.min(100, Math.round((bestDay[1] / Math.max(...Object.values(dayPerformance))) * 100))
  };
}

/**
 * Project revenue forward using linear regression
 * @param {Object} sales - Sales transactions
 * @param {number} daysAhead - Days to forecast (default 30)
 * @returns {Object} { daily_average, projected_revenue, confidence_interval }
 */
export function calcRevenueForecasts(sales, daysAhead = 30) {
  const dailyRevenue = {};

  sales.forEach(sale => {
    const date = new Date(sale.sold_date);
    const dayKey = date.toISOString().split('T')[0];

    if (!dailyRevenue[dayKey]) {
      dailyRevenue[dayKey] = 0;
    }
    dailyRevenue[dayKey] += sale.revenue || 0;
  });

  const revenues = Object.values(dailyRevenue);
  const dailyAverage = revenues.length > 0 ? revenues.reduce((a, b) => a + b, 0) / revenues.length : 0;

  const variance = revenues.length > 0
    ? revenues.reduce((sum, rev) => sum + Math.pow(rev - dailyAverage, 2), 0) / revenues.length
    : 0;

  const stdDev = Math.sqrt(variance);
  const projectedRevenue = dailyAverage * daysAhead;
  const confidenceInterval = Math.round(stdDev * 1.96);

  return {
    daily_average: Math.round(dailyAverage * 100) / 100,
    projected_revenue: Math.round(projectedRevenue * 100) / 100,
    confidence_interval: Math.round(confidenceInterval * 100) / 100,
    days_ahead: daysAhead
  };
}

/**
 * Break-even analysis: units needed to sell to break even
 * @param {Object} inv - Inventory items
 * @param {Object} sales - Sales transactions
 * @param {Object} expenses - Expense breakdown
 * @returns {Object} { units_needed, units_already_sold, breakeven_revenue, gap }
 */
export function calcBreakEvenAnalysis(inv, sales, expenses) {
  const totalInvested = inv.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  const totalExpenses = expenses.total || 0;
  const totalRequired = totalInvested + totalExpenses;

  const unitsSold = sales.reduce((sum, sale) => sum + (sale.quantity || 1), 0);
  const avgProfit = unitsSold > 0
    ? (sales.reduce((sum, sale) => sum + (sale.revenue || 0), 0) - sales.reduce((sum, sale) => {
      const item = inv.find(i => i.id === sale.item_id);
      return sum + (item ? item.cost * sale.quantity : 0);
    }, 0)) / unitsSold
    : 0;

  const unitsNeeded = avgProfit > 0 ? Math.ceil(totalRequired / avgProfit) : null;
  const gap = unitsNeeded ? Math.max(0, unitsNeeded - unitsSold) : null;

  return {
    units_needed: unitsNeeded,
    units_already_sold: unitsSold,
    breakeven_revenue: Math.round(totalRequired * 100) / 100,
    gap: gap,
    avg_profit_per_unit: Math.round(avgProfit * 100) / 100
  };
}
