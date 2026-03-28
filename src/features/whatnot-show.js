/**
 * whatnot-show.js — Whatnot Show Prep & Management
 * Organizes inventory items into "shows" for Whatnot live selling.
 * Persists show data in IndexedDB via getMeta/setMeta.
 */

import { getMeta, setMeta } from '../data/idb.js';
import { getInvItem, inv, sales, save, refresh, markDirty } from '../data/store.js';
import { toast } from '../utils/dom.js';
import { uid, fmt, escHtml, ds, localDate, daysSince } from '../utils/format.js';
import { markPlatformStatus, setListingDate } from './crosslist.js';

// ── IN-MEMORY STORE ─────────────────────────────────────────────────────────
const IDB_KEY = 'whatnot_shows';
let _shows = [];

/**
 * Show data shape:
 * {
 *   id: string,
 *   name: string,
 *   date: string,          // ISO date 'YYYY-MM-DD'
 *   time: string,          // 'HH:MM' or ''
 *   items: string[],       // array of item IDs, in presentation order
 *   status: 'prep'|'live'|'ended'|'template',
 *   notes: string,
 *   createdAt: number,     // Date.now()
 *   startedAt: number|null,
 *   endedAt: number|null,
 *   soldCount: number,
 *   totalRevenue: number,
 *   itemNotes: Object,     // { [itemId]: "talking points..." }
 *   soldItems: Object,     // { [itemId]: { price, soldAt } }
 *   recurring: Object|null,// { pattern: 'weekly'|'biweekly', dayOfWeek: 0-6, time: 'HH:MM' }
 *   templateOf: string|null,// source show ID if cloned
 *   viewerPeak: number|null,// manual peak viewer count
 *   showExpenses: number,  // props/setup costs for this show
 *   revenueGoal: number,   // target revenue for this show
 *   lots: Object[],        // [{ id, name, itemIds, startingBid }]
 *   giveaways: Object[],   // [{ itemId, reason, cost, givenAt }]
 * }
 */

// ── INIT ─────────────────────────────────────────────────────────────────────

export async function initWhatnotShows() {
  try {
    const saved = await getMeta(IDB_KEY);
    if (Array.isArray(saved)) _shows = saved;
  } catch (e) {
    console.warn('FlipTrack: Whatnot shows init error:', e.message);
  }
}

async function _save() {
  try { await setMeta(IDB_KEY, _shows); }
  catch (e) { console.warn('FlipTrack: Whatnot shows save error:', e.message); }
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export function getShows() {
  return _shows;
}

export function getUpcomingShows() {
  return _shows.filter(s => s.status === 'prep' || s.status === 'live')
    .sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      return (a.date || '').localeCompare(b.date || '') || (a.time || '').localeCompare(b.time || '');
    });
}

export function getPastShows() {
  return _shows.filter(s => s.status === 'ended')
    .sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0));
}

export function getShow(id) {
  return _shows.find(s => s.id === id) || null;
}

export async function createShow(name, date, time, notes, opts = {}) {
  const show = {
    id: uid(),
    name: (name || '').trim() || 'Untitled Show',
    date: date || localDate(),
    time: time || '',
    items: opts.items ? [...opts.items] : [],
    status: opts.status || 'prep',
    notes: (notes || '').trim(),
    createdAt: Date.now(),
    startedAt: null,
    endedAt: null,
    soldCount: 0,
    totalRevenue: 0,
    itemNotes: opts.itemNotes ? { ...opts.itemNotes } : {},
    soldItems: {},
    recurring: opts.recurring || null,
    templateOf: opts.templateOf || null,
    viewerPeak: null,
    showExpenses: 0,
    revenueGoal: opts.revenueGoal || 0,
    lots: opts.lots ? [...opts.lots] : [],
    giveaways: [],
  };
  _shows.push(show);
  await _save();
  if (show.status !== 'template') toast(`Show "${show.name}" created`);
  return show;
}

export async function updateShow(showId, changes) {
  const show = _shows.find(s => s.id === showId);
  if (!show) return null;
  const fields = ['name', 'date', 'time', 'notes', 'recurring', 'viewerPeak', 'showExpenses', 'revenueGoal'];
  for (const f of fields) {
    if (changes[f] !== undefined) show[f] = changes[f];
  }
  await _save();
  return show;
}

export async function deleteShow(showId) {
  const idx = _shows.findIndex(s => s.id === showId);
  if (idx === -1) return false;
  const name = _shows[idx].name;
  _shows.splice(idx, 1);
  await _save();
  toast(`Show "${name}" deleted`);
  return true;
}

// ── ITEM MANAGEMENT ──────────────────────────────────────────────────────────

export async function addItemToShow(showId, itemId) {
  const show = _shows.find(s => s.id === showId);
  if (!show) return false;
  if (show.items.includes(itemId)) return false; // already added
  show.items.push(itemId);
  await _save();
  return true;
}

export async function addItemsToShow(showId, itemIds) {
  const show = _shows.find(s => s.id === showId);
  if (!show) return 0;
  let added = 0;
  for (const id of itemIds) {
    if (!show.items.includes(id)) {
      show.items.push(id);
      added++;
    }
  }
  if (added) await _save();
  return added;
}

export async function removeItemFromShow(showId, itemId) {
  const show = _shows.find(s => s.id === showId);
  if (!show) return false;
  const idx = show.items.indexOf(itemId);
  if (idx === -1) return false;
  show.items.splice(idx, 1);
  await _save();
  return true;
}

export async function reorderShowItems(showId, orderedIds) {
  const show = _shows.find(s => s.id === showId);
  if (!show) return false;
  show.items = orderedIds.filter(id => show.items.includes(id));
  await _save();
  return true;
}

export async function moveShowItem(showId, itemId, direction) {
  const show = _shows.find(s => s.id === showId);
  if (!show) return false;
  const idx = show.items.indexOf(itemId);
  if (idx === -1) return false;
  const newIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= show.items.length) return false;
  [show.items[idx], show.items[newIdx]] = [show.items[newIdx], show.items[idx]];
  await _save();
  return true;
}

// ── SHOW LIFECYCLE ───────────────────────────────────────────────────────────

export async function startShow(showId) {
  const show = _shows.find(s => s.id === showId);
  if (!show || show.status === 'live') return false;
  show.status = 'live';
  show.startedAt = Date.now();
  // Mark all show items as 'active' on Whatnot
  const today = localDate();
  for (const itemId of show.items) {
    const item = getInvItem(itemId);
    if (item && (item.qty || 0) > 0) {
      markPlatformStatus(itemId, 'Whatnot', 'active');
      setListingDate(itemId, 'Whatnot', today);
    }
  }
  save();
  await _save();
  toast(`Show "${show.name}" is LIVE!`);
  return true;
}

export async function endShow(showId) {
  const show = _shows.find(s => s.id === showId);
  if (!show || show.status !== 'live') return false;
  show.status = 'ended';
  show.endedAt = Date.now();
  // Mark unsold items as 'delisted' on Whatnot
  for (const itemId of show.items) {
    const item = getInvItem(itemId);
    if (item && item.platformStatus?.Whatnot === 'active') {
      markPlatformStatus(itemId, 'Whatnot', 'delisted');
    }
  }
  save();
  await _save();
  toast(`Show "${show.name}" ended — ${show.soldCount} sold, ${fmt(show.totalRevenue)} revenue`);
  return true;
}

export async function markShowItemSold(showId, itemId, salePrice) {
  const show = _shows.find(s => s.id === showId);
  if (!show) return false;
  const item = getInvItem(itemId);
  if (!item) return false;

  // Mark as sold on Whatnot
  markPlatformStatus(itemId, 'Whatnot', 'sold');

  // Auto-delist on other platforms
  if (item.qty !== undefined) item.qty = Math.max(0, (item.qty || 1) - 1);
  markDirty('inv', itemId);
  save();

  const price = salePrice || item.price || 0;
  show.soldCount = (show.soldCount || 0) + 1;
  show.totalRevenue = (show.totalRevenue || 0) + price;
  if (!show.soldItems) show.soldItems = {};
  show.soldItems[itemId] = { price, soldAt: Date.now() };
  await _save();
  return true;
}

// ── SHOW PREP LIST ───────────────────────────────────────────────────────────

/**
 * Generate a plain-text show prep list for clipboard or reference.
 */
export function getShowPrepText(showId) {
  const show = _shows.find(s => s.id === showId);
  if (!show) return '';
  const lines = [`--- ${show.name} ---`, `Date: ${show.date}${show.time ? ' @ ' + show.time : ''}`, ''];
  show.items.forEach((itemId, i) => {
    const item = getInvItem(itemId);
    if (!item) return;
    lines.push(`${i + 1}. ${item.name || 'Untitled'}`);
    if (item.condition) lines.push(`   Condition: ${item.condition}`);
    if (item.price) lines.push(`   Price: ${fmt(item.price)}`);
    if (item.binLocation) lines.push(`   Location: ${item.binLocation}`);
    const talkingPts = show.itemNotes?.[itemId];
    if (talkingPts) lines.push(`   Talking Points: ${talkingPts}`);
    if (item.notes) lines.push(`   Notes: ${item.notes}`);
    lines.push('');
  });
  lines.push(`Total items: ${show.items.length}`);
  return lines.join('\n');
}

/**
 * Copy show prep list to clipboard.
 */
export async function copyShowPrepList(showId) {
  const text = getShowPrepText(showId);
  if (!text) { toast('No show found', true); return; }
  try {
    await navigator.clipboard.writeText(text);
    toast('Show prep list copied to clipboard');
  } catch {
    toast('Copy failed', true);
  }
}

// ── ITEM NOTES (talking points) ──────────────────────────────────────────

export async function setItemNote(showId, itemId, note) {
  const show = _shows.find(s => s.id === showId);
  if (!show) return false;
  if (!show.itemNotes) show.itemNotes = {};
  show.itemNotes[itemId] = (note || '').trim();
  if (!show.itemNotes[itemId]) delete show.itemNotes[itemId];
  await _save();
  return true;
}

export function getItemNote(showId, itemId) {
  const show = _shows.find(s => s.id === showId);
  return show?.itemNotes?.[itemId] || '';
}

// ── CLONING & TEMPLATES ─────────────────────────────────────────────────

export async function cloneShow(showId, newDate, newTime) {
  const src = _shows.find(s => s.id === showId);
  if (!src) { toast('Show not found', true); return null; }
  return createShow(
    src.name,
    newDate || localDate(),
    newTime || src.time,
    src.notes,
    { items: src.items, itemNotes: src.itemNotes, templateOf: showId }
  );
}

export function getShowTemplates() {
  return _shows.filter(s => s.status === 'template');
}

export async function createFromRecurring(templateShow, date) {
  if (!templateShow?.recurring) return null;
  return createShow(
    templateShow.name,
    date || localDate(),
    templateShow.time,
    templateShow.notes,
    { items: templateShow.items, itemNotes: templateShow.itemNotes, templateOf: templateShow.id }
  );
}

// ── VIEWER & EXPENSES ───────────────────────────────────────────────────

export async function setShowViewerPeak(showId, count) {
  const show = _shows.find(s => s.id === showId);
  if (!show) return false;
  show.viewerPeak = Math.max(0, parseInt(count) || 0);
  await _save();
  return true;
}

export async function setShowExpenses(showId, amount) {
  const show = _shows.find(s => s.id === showId);
  if (!show) return false;
  show.showExpenses = Math.max(0, parseFloat(amount) || 0);
  await _save();
  return true;
}

// ── SOLD ITEMS DETAIL ───────────────────────────────────────────────────

export function getShowSoldItems(showId) {
  const show = _shows.find(s => s.id === showId);
  if (!show?.soldItems) return [];
  return Object.entries(show.soldItems).map(([itemId, data]) => {
    const item = getInvItem(itemId);
    return { itemId, item, price: data.price, soldAt: data.soldAt };
  }).filter(d => d.item);
}

export function getShowUnsoldItems(showId) {
  const show = _shows.find(s => s.id === showId);
  if (!show) return [];
  const soldIds = new Set(Object.keys(show.soldItems || {}));
  return show.items.filter(id => !soldIds.has(id)).map(id => getInvItem(id)).filter(Boolean);
}

// ── ITEM SHOW HISTORY ───────────────────────────────────────────────────

/**
 * Get every show an item has appeared in, with sold/unsold status.
 * @returns {Array<{ show, wasSold, salePrice }>}
 */
export function getItemShowHistory(itemId) {
  return _shows
    .filter(s => s.status === 'ended' && s.items.includes(itemId))
    .map(show => ({
      show,
      wasSold: !!(show.soldItems?.[itemId]),
      salePrice: show.soldItems?.[itemId]?.price || 0,
    }))
    .sort((a, b) => (b.show.endedAt || 0) - (a.show.endedAt || 0));
}

/**
 * Count how many ended shows an item was in without selling.
 */
export function getItemShowsWithoutSale(itemId) {
  return _shows.filter(s =>
    s.status === 'ended' && s.items.includes(itemId) && !s.soldItems?.[itemId]
  ).length;
}

// ── RUN SHEET (print-friendly) ──────────────────────────────────────────

export function getShowRunSheet(showId) {
  const show = _shows.find(s => s.id === showId);
  if (!show) return '';
  const lines = [];
  lines.push(`<div class="wn-run-sheet">`);
  lines.push(`<h2>${escHtml(show.name)}</h2>`);
  lines.push(`<p>${show.date}${show.time ? ' @ ' + show.time : ''} &middot; ${show.items.length} items</p>`);
  lines.push(`<table><thead><tr><th>#</th><th>Item</th><th>Condition</th><th>Price</th><th>Location</th><th>Talking Points</th></tr></thead><tbody>`);
  show.items.forEach((itemId, i) => {
    const item = getInvItem(itemId);
    if (!item) return;
    const note = show.itemNotes?.[itemId] || '';
    const loc = item.binLocation || '';
    lines.push(`<tr><td>${i + 1}</td><td>${escHtml(item.name || '')}</td><td>${escHtml(item.condition || '')}</td><td>${fmt(item.price || 0)}</td><td>${escHtml(loc)}</td><td>${escHtml(note)}</td></tr>`);
  });
  // Include lots if any
  if (show.lots?.length) {
    lines.push(`</tbody></table><h3>Lots</h3><table><thead><tr><th>#</th><th>Lot</th><th>Items</th><th>Starting Bid</th></tr></thead><tbody>`);
    show.lots.forEach((lot, i) => {
      const itemNames = lot.itemIds.map(id => getInvItem(id)?.name || 'Unknown').join(', ');
      lines.push(`<tr><td>${i + 1}</td><td>${escHtml(lot.name || '')}</td><td>${escHtml(itemNames)}</td><td>${fmt(lot.startingBid || 0)}</td></tr>`);
    });
  }
  lines.push(`</tbody></table></div>`);
  return lines.join('\n');
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Get the active (live) show, if any.
 */
export function getLiveShow() {
  return _shows.find(s => s.status === 'live') || null;
}

/**
 * Check if an item is in any upcoming/live show.
 */
export function getItemShows(itemId) {
  return _shows.filter(s =>
    (s.status === 'prep' || s.status === 'live') && s.items.includes(itemId)
  );
}

/**
 * Get all ended shows (optionally limited to last N).
 */
export function getEndedShows(limit) {
  const ended = _shows.filter(s => s.status === 'ended')
    .sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0));
  return limit ? ended.slice(0, limit) : ended;
}

/**
 * Get shows scheduled for a specific date.
 */
export function getShowsByDate(date) {
  return _shows.filter(s => s.date === date && s.status !== 'template');
}

/**
 * Get today's upcoming shows.
 */
export function getTodayShows() {
  const today = localDate();
  return _shows.filter(s =>
    s.date === today && (s.status === 'prep' || s.status === 'live')
  );
}

// ── LOT BUNDLING ────────────────────────────────────────────────────────

export async function addLot(showId, name, itemIds, startingBid) {
  const show = _shows.find(s => s.id === showId);
  if (!show) return null;
  if (!show.lots) show.lots = [];
  const lot = {
    id: uid(),
    name: (name || '').trim() || `Lot ${show.lots.length + 1}`,
    itemIds: itemIds.filter(id => show.items.includes(id)),
    startingBid: Math.max(0, parseFloat(startingBid) || 0),
  };
  show.lots.push(lot);
  await _save();
  toast(`Lot "${lot.name}" created with ${lot.itemIds.length} items`);
  return lot;
}

export async function removeLot(showId, lotId) {
  const show = _shows.find(s => s.id === showId);
  if (!show?.lots) return false;
  const idx = show.lots.findIndex(l => l.id === lotId);
  if (idx === -1) return false;
  show.lots.splice(idx, 1);
  await _save();
  return true;
}

export async function updateLot(showId, lotId, changes) {
  const show = _shows.find(s => s.id === showId);
  if (!show?.lots) return null;
  const lot = show.lots.find(l => l.id === lotId);
  if (!lot) return null;
  if (changes.name !== undefined) lot.name = changes.name;
  if (changes.startingBid !== undefined) lot.startingBid = Math.max(0, parseFloat(changes.startingBid) || 0);
  if (changes.itemIds !== undefined) lot.itemIds = changes.itemIds.filter(id => show.items.includes(id));
  await _save();
  return lot;
}

export function getShowLots(showId) {
  const show = _shows.find(s => s.id === showId);
  return (show?.lots || []).map(lot => ({
    ...lot,
    items: lot.itemIds.map(id => getInvItem(id)).filter(Boolean),
    totalValue: lot.itemIds.reduce((sum, id) => sum + (getInvItem(id)?.price || 0), 0),
    totalCost: lot.itemIds.reduce((sum, id) => sum + (getInvItem(id)?.cost || 0), 0),
  }));
}

// ── REVENUE GOALS ───────────────────────────────────────────────────────

export async function setShowRevenueGoal(showId, goal) {
  const show = _shows.find(s => s.id === showId);
  if (!show) return false;
  show.revenueGoal = Math.max(0, parseFloat(goal) || 0);
  await _save();
  return true;
}

export function getShowGoalProgress(showId) {
  const show = _shows.find(s => s.id === showId);
  if (!show || !show.revenueGoal) return null;
  const revenue = show.totalRevenue || 0;
  const goal = show.revenueGoal;
  return {
    goal,
    revenue,
    remaining: Math.max(0, goal - revenue),
    progress: Math.min(1, revenue / goal),
    hit: revenue >= goal,
  };
}

// ── GIVEAWAY & LOSS LEADER TRACKER ──────────────────────────────────────

export async function addGiveaway(showId, itemId, reason) {
  const show = _shows.find(s => s.id === showId);
  if (!show) return false;
  const item = getInvItem(itemId);
  if (!item) return false;
  if (!show.giveaways) show.giveaways = [];
  show.giveaways.push({
    itemId,
    reason: (reason || '').trim() || 'Giveaway',
    cost: item.cost || 0,
    givenAt: Date.now(),
  });
  // Decrement qty and mark as given away on Whatnot
  if (item.qty !== undefined) item.qty = Math.max(0, (item.qty || 1) - 1);
  markPlatformStatus(itemId, 'Whatnot', 'sold');
  markDirty('inv', itemId);
  save();
  await _save();
  toast(`"${item.name}" marked as giveaway`);
  return true;
}

export function getShowGiveaways(showId) {
  const show = _shows.find(s => s.id === showId);
  if (!show?.giveaways) return [];
  return show.giveaways.map(g => ({
    ...g,
    item: getInvItem(g.itemId),
  })).filter(g => g.item);
}

export function getTotalGiveawayCost(showId) {
  const show = _shows.find(s => s.id === showId);
  if (!show?.giveaways) return 0;
  return show.giveaways.reduce((sum, g) => sum + (g.cost || 0), 0);
}

// ── BIN/SHELF LOCATION ─────────────────────────────────────────────────

export async function setItemBinLocation(itemId, location) {
  const item = getInvItem(itemId);
  if (!item) return false;
  item.binLocation = (location || '').trim();
  if (!item.binLocation) delete item.binLocation;
  markDirty('inv', itemId);
  save();
  return true;
}

// ── LIVE SHOW DASHBOARD HELPERS ────────────────────────────────────────

/**
 * Get real-time live show stats for the dashboard overlay.
 */
export function getLiveShowStats() {
  const show = _shows.find(s => s.status === 'live');
  if (!show) return null;
  const elapsed = show.startedAt ? (Date.now() - show.startedAt) : 0;
  const elapsedMin = Math.floor(elapsed / 60000);
  const elapsedHrs = elapsed / 3600000;
  const soldCount = show.soldCount || 0;
  const totalItems = show.items.length;
  const revenue = show.totalRevenue || 0;
  const soldIds = new Set(Object.keys(show.soldItems || {}));
  const remaining = show.items.filter(id => !soldIds.has(id));
  const remainingValue = remaining.reduce((s, id) => s + (getInvItem(id)?.price || 0), 0);
  const goalProgress = show.revenueGoal ? getShowGoalProgress(show.id) : null;

  return {
    showId: show.id,
    showName: show.name,
    elapsed,
    elapsedMin,
    elapsedFormatted: `${Math.floor(elapsedMin / 60)}h ${elapsedMin % 60}m`,
    soldCount,
    totalItems,
    remaining: remaining.length,
    remainingItems: remaining.map(id => getInvItem(id)).filter(Boolean),
    sellThrough: totalItems ? soldCount / totalItems : 0,
    revenue,
    revenuePerHour: elapsedHrs > 0 ? revenue / elapsedHrs : 0,
    remainingValue,
    viewerPeak: show.viewerPeak || 0,
    goalProgress,
    giveawayCount: (show.giveaways || []).length,
    giveawayCost: getTotalGiveawayCost(show.id),
  };
}

// ── SHIPPING QUEUE ─────────────────────────────────────────────────────

/**
 * Get sold items from a show that need shipping.
 */
export function getShowShippingQueue(showId) {
  const show = _shows.find(s => s.id === showId);
  if (!show?.soldItems) return [];
  return Object.entries(show.soldItems).map(([itemId, data]) => {
    const item = getInvItem(itemId);
    if (!item) return null;
    return {
      itemId,
      item,
      price: data.price,
      soldAt: data.soldAt,
      shipped: item.shippedAt || false,
      binLocation: item.binLocation || '',
    };
  }).filter(Boolean).sort((a, b) => (a.shipped ? 1 : 0) - (b.shipped ? 1 : 0));
}

/**
 * Get all unshipped items from all ended shows (global shipping queue).
 */
export function getGlobalShippingQueue() {
  const ended = _shows.filter(s => s.status === 'ended');
  const queue = [];
  for (const show of ended) {
    if (!show.soldItems) continue;
    for (const [itemId, data] of Object.entries(show.soldItems)) {
      const item = getInvItem(itemId);
      if (!item || item.shippedAt) continue;
      queue.push({
        itemId,
        item,
        showName: show.name,
        showDate: show.date,
        price: data.price,
        soldAt: data.soldAt,
        binLocation: item.binLocation || '',
      });
    }
  }
  return queue.sort((a, b) => (a.soldAt || 0) - (b.soldAt || 0));
}

export async function markItemShipped(itemId) {
  const item = getInvItem(itemId);
  if (!item) return false;
  item.shippedAt = Date.now();
  markDirty('inv', itemId);
  save();
  toast(`"${item.name}" marked as shipped`);
  return true;
}

// ── SHOW PUSH REMINDERS ────────────────────────────────────────────────

/**
 * Get shows happening within the next `minutes` minutes.
 */
export function getShowsStartingSoon(minutes = 60) {
  const now = Date.now();
  return _shows.filter(s => {
    if (s.status !== 'prep' || !s.date || !s.time) return false;
    const showTime = new Date(`${s.date}T${s.time}:00`).getTime();
    const diff = showTime - now;
    return diff > 0 && diff <= minutes * 60000;
  }).map(s => ({
    show: s,
    minutesUntil: Math.round((new Date(`${s.date}T${s.time}:00`).getTime() - now) / 60000),
  }));
}

// ── POST-SHOW RECAP ────────────────────────────────────────────────────

/**
 * Generate recap data for sharing after a show ends.
 */
export function getShowRecap(showId) {
  const show = _shows.find(s => s.id === showId);
  if (!show || show.status !== 'ended') return null;
  const duration = show.startedAt && show.endedAt
    ? Math.round((show.endedAt - show.startedAt) / 60000) : 0;
  const durationFormatted = duration > 0 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : 'N/A';
  const sellThrough = show.items.length ? ((show.soldCount || 0) / show.items.length * 100).toFixed(0) : 0;
  const giveaways = (show.giveaways || []).length;
  const giveawayCost = getTotalGiveawayCost(showId);

  // Top sold item by price
  let topItem = null;
  let topPrice = 0;
  if (show.soldItems) {
    for (const [itemId, data] of Object.entries(show.soldItems)) {
      if (data.price > topPrice) {
        topPrice = data.price;
        topItem = getInvItem(itemId);
      }
    }
  }

  return {
    showName: show.name,
    date: show.date,
    duration: durationFormatted,
    totalItems: show.items.length,
    soldCount: show.soldCount || 0,
    sellThrough: `${sellThrough}%`,
    revenue: show.totalRevenue || 0,
    viewerPeak: show.viewerPeak || 0,
    topItemName: topItem?.name || 'N/A',
    topItemPrice: topPrice,
    giveaways,
    giveawayCost,
    goalHit: show.revenueGoal ? (show.totalRevenue || 0) >= show.revenueGoal : null,
    goalTarget: show.revenueGoal || 0,
  };
}

/**
 * Generate a plain-text recap for copying/sharing.
 */
export function getShowRecapText(showId) {
  const r = getShowRecap(showId);
  if (!r) return '';
  const lines = [
    `📊 ${r.showName} — Show Recap`,
    `📅 ${r.date} · ⏱ ${r.duration}`,
    ``,
    `🛍 ${r.soldCount}/${r.totalItems} sold (${r.sellThrough} sell-through)`,
    `💰 ${fmt(r.revenue)} revenue`,
  ];
  if (r.viewerPeak) lines.push(`👁 ${r.viewerPeak} peak viewers`);
  if (r.topItemName !== 'N/A') lines.push(`⭐ Top seller: ${r.topItemName} (${fmt(r.topItemPrice)})`);
  if (r.giveaways) lines.push(`🎁 ${r.giveaways} giveaway${r.giveaways !== 1 ? 's' : ''} (${fmt(r.giveawayCost)} cost)`);
  if (r.goalHit !== null) {
    lines.push(r.goalHit
      ? `🎯 Goal of ${fmt(r.goalTarget)} HIT!`
      : `🎯 Goal: ${fmt(r.revenue)} / ${fmt(r.goalTarget)}`);
  }
  lines.push('', '— via FlipTrack');
  return lines.join('\n');
}
