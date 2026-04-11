/** whatnot-import.js — Whatnot CSV Import & Payout Reconciliation */

import { inv, sales, save, refresh, getInvItem, markDirty, getSalesForItem } from '../data/store.js';
import { uid, localDate } from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { calcPlatformFee } from '../config/platforms.js';
import { markPlatformStatus } from './crosslist.js';
import { getShow, getEndedShows } from './whatnot-show.js';
import { autoSync } from '../data/sync.js';

/** Sanitize imported text — strip formula injection prefixes */
const _sanitize = v => { const s = String(v || '').trim(); return /^[=+\-@]/.test(s) ? "'" + s : s; };

/** Validate file type before reading */
function _validateFile(file, maxMB = 10) {
  if (!file) return false;
  if (file.size > maxMB * 1024 * 1024) { toast(`CSV too large (max ${maxMB}MB)`, true); return false; }
  if (!file.name.match(/\.(csv|tsv|txt)$/i) && !file.type.includes('text')) { toast('Please upload a CSV file', true); return false; }
  return true;
}

// ── CSV PARSING ─────────────────────────────────────────────────────────────
function _parseRow(line, sep = ',') {
  const cells = [];
  let cell = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cell += '"'; i++; }
      else inQ = !inQ;
    } else if (c === sep && !inQ) {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += c;
    }
  }
  cells.push(cell.trim());
  return cells;
}

/** Parse numeric value, stripping currency symbols */
const _parseNum = (v, fallback = 0) => {
  const n = parseFloat(String(v || '').replace(/[$,]/g, ''));
  return isNaN(n) ? fallback : Math.round(n * 100) / 100;
};

/** Normalize a string for fuzzy matching: lowercase, strip non-alphanumeric */
const _norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Parse CSV text into header array + row arrays */
function _parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, '');  // strip BOM
  const sep = clean.indexOf('\t') !== -1 && clean.indexOf(',') === -1 ? '\t' : ',';
  const lines = clean.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return null;
  const headers = _parseRow(lines[0], sep).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    rows.push(_parseRow(lines[i], sep));
  }
  return { headers, rows, sep };
}

function _findCol(headers, ...aliases) {
  for (const alias of aliases) {
    const idx = headers.findIndex(h => h.includes(alias));
    if (idx !== -1) return idx;
  }
  return -1;
}

// ── ITEM MATCHING ───────────────────────────────────────────────────────────
function _buildMatchMaps() {
  const bySku = new Map();
  const byName = new Map();
  for (const item of inv) {
    if (item.qty !== undefined && item.qty <= 0 && !item.isParent) continue; // skip sold-out unless parent
    if (item.sku) bySku.set(_norm(item.sku), item);
    const normName = _norm(item.name);
    if (normName && !byName.has(normName)) byName.set(normName, item);
  }
  return { bySku, byName };
}

function _matchItem(productName, sku, maps) {
  if (sku) {
    const match = maps.bySku.get(_norm(sku));
    if (match) return match;
  }
  // 2. Exact normalized name match
  const normName = _norm(productName);
  if (normName) {
    const match = maps.byName.get(normName);
    if (match) return match;
  }
  // 3. Fuzzy: find inventory item whose name is contained in the product name (or vice versa)
  if (normName && normName.length > 5) {
    for (const item of inv) {
      const itemNorm = _norm(item.name);
      if (!itemNorm || itemNorm.length < 4) continue;
      if (normName.includes(itemNorm) || itemNorm.includes(normName)) return item;
    }
  }
  return null;
}

function _isDuplicateSale(itemId, date, price) {
  const existing = getSalesForItem(itemId);
  if (!existing) return false;
  return existing.some(s =>
    s.platform === 'Whatnot' &&
    s.date === date &&
    Math.abs((s.price || 0) - price) < 0.01
  );
}


// ── IMPORT: ORDER HISTORY CSV ────────────────────────────────────────────────

export function importWhatnotOrderCSV(file) {
  if (!_validateFile(file)) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = _parseCSV(e.target.result);
      if (!parsed) { toast('CSV appears empty', true); return; }
      const { headers, rows } = parsed;

      // Detect columns
      const nameIdx   = _findCol(headers, 'productname', 'product', 'itemname', 'item', 'title', 'name');
      const priceIdx  = _findCol(headers, 'paidout', 'payout', 'itemprice', 'saleprice', 'price', 'amount', 'total');
      const dateIdx   = _findCol(headers, 'processeddate', 'date', 'orderdate', 'solddate');
      const statusIdx = _findCol(headers, 'orderstatus', 'status');
      const buyerIdx  = _findCol(headers, 'buyer', 'buyername', 'customer');
      const skuIdx    = _findCol(headers, 'sku');
      const qtyIdx    = _findCol(headers, 'quantity', 'qty');
      const feeIdx    = _findCol(headers, 'fee', 'fees', 'totalfees', 'marketplacefee');
      const shipIdx   = _findCol(headers, 'shipping', 'shippingcost');
      const orderIdx  = _findCol(headers, 'orderid', 'order');
      const channelIdx = _findCol(headers, 'saleschannel', 'channel');

      if (nameIdx === -1 && priceIdx === -1) {
        toast('Could not detect Product Name or Price columns', true);
        return;
      }

      const maps = _buildMatchMaps();
      let imported = 0, skipped = 0, unmatched = 0;
      const unmatchedItems = [];
      const seenOrderIds = new Set();

      for (const cells of rows) {
        // Skip non-completed orders
        if (statusIdx !== -1) {
          const status = (cells[statusIdx] || '').toLowerCase();
          if (status && !status.includes('complete') && !status.includes('delivered') && !status.includes('shipped')) {
            skipped++;
            continue;
          }
        }

        // Deduplicate by order ID within this import
        if (orderIdx !== -1) {
          const orderId = (cells[orderIdx] || '').trim();
          if (orderId && seenOrderIds.has(orderId)) { skipped++; continue; }
          if (orderId) seenOrderIds.add(orderId);
        }

        const productName = (cells[nameIdx] || '').trim();
        const sku = skuIdx !== -1 ? (cells[skuIdx] || '').trim() : '';
        const rawPrice = _parseNum(cells[priceIdx]);
        if (!productName && rawPrice === 0) continue;

        const qty = qtyIdx !== -1 ? Math.max(1, parseInt(cells[qtyIdx], 10) || 1) : 1;
        const price = qty > 1 ? Math.round((rawPrice / qty) * 100) / 100 : rawPrice;

        // Parse date
        let saleDate = localDate();
        if (dateIdx !== -1) {
          const raw = (cells[dateIdx] || '').trim();
          if (raw) {
            const d = new Date(raw);
            if (!isNaN(d.getTime())) {
              saleDate = d.toISOString().slice(0, 10);
            }
          }
        }

        // Match to inventory
        const item = _matchItem(productName, sku, maps);
        if (!item) {
          unmatched++;
          if (unmatchedItems.length < 20) unmatchedItems.push(productName || '(no name)');
          continue;
        }

        // Duplicate check
        if (_isDuplicateSale(item.id, saleDate, price)) {
          skipped++;
          continue;
        }

        // Calculate fees
        let fees = feeIdx !== -1 ? _parseNum(cells[feeIdx]) : 0;
        if (!fees) fees = calcPlatformFee('Whatnot', price) || 0;
        const ship = shipIdx !== -1 ? _parseNum(cells[shipIdx]) : 0;

        // Create sale record
        const sale = {
          id: uid(),
          itemId: item.id,
          price,
          listPrice: item.price || 0,
          qty,
          platform: 'Whatnot',
          fees,
          ship,
          date: saleDate,
        };

        // Add buyer info
        if (buyerIdx !== -1) {
          const buyerName = _sanitize(cells[buyerIdx]);
          if (buyerName) sale.buyerName = buyerName;
        }

        if (channelIdx !== -1) {
          const channel = _sanitize(cells[channelIdx]);
          if (channel) sale.channel = channel;
        }

        sales.push(sale);
        markDirty('sales', sale.id);

        // Update inventory
        if (item.qty !== undefined) item.qty = Math.max(0, (item.qty || 1) - qty);
        markPlatformStatus(item.id, 'Whatnot', item.qty <= 0 ? 'sold' : 'active');
        markDirty('inv', item.id);

        imported++;
      }

      if (imported > 0) {
        save();
        refresh();
        autoSync();
      }

      // Report results
      let msg = `Imported ${imported} Whatnot sale${imported !== 1 ? 's' : ''}`;
      if (skipped) msg += `, ${skipped} skipped`;
      if (unmatched) msg += `, ${unmatched} unmatched`;
      toast(msg, unmatched > 0 && imported === 0);

      return { imported, skipped, unmatched, unmatchedItems };
    } catch (err) {
      toast('CSV parse error: ' + err.message, true);
    }
  };
  reader.readAsText(file);
}


// ── IMPORT: LIVESTREAM REPORT CSV ────────────────────────────────────────────

export function importLivestreamCSV(file, showId) {
  if (!_validateFile(file)) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = _parseCSV(e.target.result);
      if (!parsed) { toast('CSV appears empty', true); return; }
      const { headers, rows } = parsed;

      const nameIdx   = _findCol(headers, 'productname', 'product', 'itemname', 'item', 'title', 'name');
      const priceIdx  = _findCol(headers, 'saleprice', 'price', 'soldprice', 'amount', 'paidout', 'payout');
      const statusIdx = _findCol(headers, 'status', 'salestatus', 'soldstatus');
      const feeIdx    = _findCol(headers, 'fee', 'fees', 'totalfees', 'whatnotfee');
      const skuIdx    = _findCol(headers, 'sku');
      const qtyIdx    = _findCol(headers, 'quantity', 'qty');

      if (nameIdx === -1) {
        toast('Could not detect a Product Name column', true);
        return;
      }

      const show = showId ? getShow(showId) : null;
      const maps = _buildMatchMaps();
      let reconciled = 0, newSales = 0, skipped = 0;

      for (const cells of rows) {
        const productName = (cells[nameIdx] || '').trim();
        if (!productName) continue;

        // Determine if this item sold
        let isSold = true;
        if (statusIdx !== -1) {
          const status = (cells[statusIdx] || '').toLowerCase();
          if (status.includes('unsold') || status.includes('not sold') || status.includes('cancelled')) {
            continue; // skip unsold entries
          }
        }

        const rawPrice = priceIdx !== -1 ? _parseNum(cells[priceIdx]) : 0;
        if (rawPrice <= 0) continue; // no sale price means unsold

        const sku = skuIdx !== -1 ? (cells[skuIdx] || '').trim() : '';
        const qty = qtyIdx !== -1 ? Math.max(1, parseInt(cells[qtyIdx], 10) || 1) : 1;
        const price = qty > 1 ? Math.round((rawPrice / qty) * 100) / 100 : rawPrice;

        // Match to inventory
        const item = _matchItem(productName, sku, maps);
        if (!item) { skipped++; continue; }

        // If reconciling with a show, try to match item to show items
        if (show && show.items.includes(item.id)) {
          // Already marked sold in show?
          if (show.soldItems?.[item.id]) {
            reconciled++;
            continue;
          }
        }

        // Check for duplicate sale
        const saleDate = show?.date || localDate();
        if (_isDuplicateSale(item.id, saleDate, price)) {
          skipped++;
          continue;
        }

        // Calculate fees
        let fees = feeIdx !== -1 ? _parseNum(cells[feeIdx]) : 0;
        if (!fees) fees = calcPlatformFee('Whatnot', price) || 0;

        // Create sale record
        const sale = {
          id: uid(),
          itemId: item.id,
          price,
          listPrice: item.price || 0,
          qty,
          platform: 'Whatnot',
          fees,
          ship: 0,
          date: saleDate,
        };
        sales.push(sale);
        markDirty('sales', sale.id);

        // Update inventory
        if (item.qty !== undefined) item.qty = Math.max(0, (item.qty || 1) - qty);
        markPlatformStatus(item.id, 'Whatnot', item.qty <= 0 ? 'sold' : 'active');
        markDirty('inv', item.id);

        newSales++;
      }

      if (newSales > 0) {
        save();
        refresh();
        autoSync();
      }

      let msg = `Livestream import: ${newSales} new sale${newSales !== 1 ? 's' : ''}`;
      if (reconciled) msg += `, ${reconciled} already recorded`;
      if (skipped) msg += `, ${skipped} skipped`;
      toast(msg, newSales === 0 && skipped > 0);
    } catch (err) {
      toast('CSV parse error: ' + err.message, true);
    }
  };
  reader.readAsText(file);
}


// ── SHOW → SALE BRIDGE ──────────────────────────────────────────────────────

export function createSaleFromShow(showId, itemId, salePrice) {
  const show = getShow(showId);
  const item = getInvItem(itemId);
  if (!show || !item) return null;

  const price = salePrice || item.price || 0;
  const date = show.date || localDate();

  // Skip if duplicate
  if (_isDuplicateSale(itemId, date, price)) return null;

  const fees = calcPlatformFee('Whatnot', price) || 0;

  const sale = {
    id: uid(),
    itemId,
    price,
    listPrice: item.price || 0,
    qty: 1,
    platform: 'Whatnot',
    fees,
    ship: 0,
    date,
    showId,
  };

  sales.push(sale);
  markDirty('sales', sale.id);
  save();

  return sale.id;
}


// ── BULK SHOW RECONCILIATION ─────────────────────────────────────────────────

export function reconcileShowSales(showId) {
  const show = getShow(showId);
  if (!show || !show.soldItems) return { created: 0, alreadyRecorded: 0 };

  let created = 0, alreadyRecorded = 0;
  const entries = Object.entries(show.soldItems);

  for (const [itemId, soldData] of entries) {
    const item = getInvItem(itemId);
    if (!item) continue;

    const price = soldData.price || item.price || 0;
    const date = show.date || localDate();

    if (_isDuplicateSale(itemId, date, price)) {
      alreadyRecorded++;
      continue;
    }

    const fees = calcPlatformFee('Whatnot', price) || 0;

    const sale = {
      id: uid(),
      itemId,
      price,
      listPrice: item.price || 0,
      qty: 1,
      platform: 'Whatnot',
      fees,
      ship: 0,
      date,
      showId,
    };

    sales.push(sale);
    markDirty('sales', sale.id);
    created++;
  }

  if (created > 0) {
    save();
    refresh();
    autoSync();
  }

  return { created, alreadyRecorded };
}


// ── PAYOUT RECONCILIATION ────────────────────────────────────────────────────

export function getWhatnotSalesInRange(startDate, endDate) {
  return sales.filter(s => {
    if (s.platform !== 'Whatnot') return false;
    const d = s.date || '';
    return d >= startDate && d <= endDate;
  });
}

export function reconcilePayout(payoutAmount, startDate, endDate) {
  const wnSales = getWhatnotSalesInRange(startDate, endDate);

  let totalRevenue = 0;
  let totalFees = 0;
  let totalShipping = 0;
  let saleCount = 0;
  const saleDetails = [];

  for (const s of wnSales) {
    const item = getInvItem(s.itemId);
    const revenue = (s.price || 0) * (s.qty || 1);
    const fees = s.fees || 0;
    const ship = s.ship || 0;

    totalRevenue += revenue;
    totalFees += fees;
    totalShipping += ship;
    saleCount++;

    saleDetails.push({
      saleId: s.id,
      itemId: s.itemId,
      itemName: item?.name || 'Deleted Item',
      date: s.date,
      price: s.price,
      qty: s.qty || 1,
      revenue,
      fees,
      ship,
      payout: revenue + ship - fees,
    });
  }

  const expectedPayout = Math.round((totalRevenue + totalShipping - totalFees) * 100) / 100;
  const discrepancy = Math.round((payoutAmount - expectedPayout) * 100) / 100;
  const discrepancyPct = expectedPayout > 0 ? Math.round((discrepancy / expectedPayout) * 10000) / 100 : 0;

  // Classify discrepancy
  let status = 'match';
  if (Math.abs(discrepancy) > 0.50) {
    status = discrepancy > 0 ? 'overpaid' : 'underpaid';
  }

  const possibleReasons = [];
  if (status === 'underpaid') {
    if (Math.abs(discrepancy) < totalFees * 0.30) possibleReasons.push('Fee difference from Whatnot processing');
    possibleReasons.push('Tips or adjustments not captured');
    possibleReasons.push('Refunds or cancellations by Whatnot');
    possibleReasons.push('Missing sales not yet in FlipTrack');
  } else if (status === 'overpaid') {
    possibleReasons.push('Tips from buyers');
    possibleReasons.push('Whatnot promo credits or bonuses');
    possibleReasons.push('Refunded sales still recorded in FlipTrack');
  }

  return {
    payoutAmount,
    startDate,
    endDate,
    saleCount,
    totalRevenue,
    totalFees,
    totalShipping,
    expectedPayout,
    discrepancy,
    discrepancyPct,
    status,
    possibleReasons,
    sales: saleDetails,
  };
}

export function getShowPayoutBreakdown(startDate, endDate) {
  const endedShows = getEndedShows();
  const results = [];

  for (const show of endedShows) {
    if (!show.date || show.date < startDate || show.date > endDate) continue;
    if (!show.soldItems) continue;

    let showRevenue = 0;
    let showFees = 0;
    let showCost = 0;
    let soldCount = 0;

    for (const [itemId, soldData] of Object.entries(show.soldItems)) {
      const item = getInvItem(itemId);
      const price = soldData.price || 0;
      showRevenue += price;
      showFees += calcPlatformFee('Whatnot', price) || 0;
      if (item) showCost += item.cost || 0;
      soldCount++;
    }

    results.push({
      showId: show.id,
      showName: show.name,
      date: show.date,
      soldCount,
      revenue: showRevenue,
      fees: Math.round(showFees * 100) / 100,
      cost: showCost,
      profit: Math.round((showRevenue - showFees - showCost - (show.showExpenses || 0)) * 100) / 100,
      expenses: show.showExpenses || 0,
      expectedPayout: Math.round((showRevenue - showFees) * 100) / 100,
    });
  }

  return results.sort((a, b) => b.date.localeCompare(a.date));
}
