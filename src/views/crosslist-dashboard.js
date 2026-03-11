/**
 * crosslist-dashboard.js — Crosslisting Dashboard View
 * Shows listing status matrix, expiring/expired listings, and bulk crosslist tools.
 */

import { inv, save, refresh, markDirty } from '../data/store.js';
import { fmt, escHtml, ds, uid, localDate} from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { getPlatforms } from '../features/platforms.js';
import { PLATFORMS } from '../config/platforms.js';
import { renderPagination } from '../utils/pagination.js';
import {
  getCrosslistStats, getExpiredListings, getExpiringListings,
  getListingHealth, markPlatformStatus, relistItem, setListingDate,
  STATUS_LABELS, STATUS_COLORS, LISTING_STATUSES,
  PLATFORM_EXPIRY_RULES, getDaysUntilExpiry, checkExpiredListings,
  enableAutoRelist, disableAutoRelist, isAutoRelistEnabled, runAutoRelist, getAutoRelistCandidates, bulkRelistPlatform, bulkPriceAdjust
} from '../features/crosslist.js';
import { generateListingLink, copyListingText, generateListingText } from '../features/deep-links.js';
import { getTemplatesForCategory, addTemplate, deleteTemplate } from '../features/listing-templates.js';
import { isEBayConnected, isEBayStatusVerified, getEBayUsername, connectEBay, disconnectEBay, checkEBayStatus } from '../features/ebay-auth.js';
import { pullEBayListings, pushItemToEBay, publishEBayListing, endEBayListing, isEBaySyncing, getLastEBaySyncTime } from '../features/ebay-sync.js';
import { isEtsyConnected, getEtsyShopName, connectEtsy, disconnectEtsy } from '../features/etsy-auth.js';
import {
  pullEtsyListings, pushItemToEtsy, deactivateEtsyListing, renewEtsyListing, isEtsySyncing, getLastEtsySyncTime,
  pushEtsyQuantity, syncAllEtsyQuantities, pushEtsyPhotos,
  fetchEtsyShopStats, fetchEtsyListingStats, getEtsyAnalyticsSummary,
  fetchEtsyReviews, getEtsyReviewSummary,
  fetchEtsyReceiptsPending, pushEtsyTracking, getEtsyCarriers,
  pushEtsyPrice, pushEtsyPriceBulk,
  fetchEtsyListingTags, suggestEtsyTags, pushEtsyTags,
  calcEtsyFees, syncEtsyExpenses
} from '../features/etsy-sync.js';
import {
  getUpcomingShows, getPastShows, getShow, createShow, updateShow, deleteShow,
  addItemToShow, addItemsToShow, removeItemFromShow, moveShowItem,
  startShow, endShow, markShowItemSold, copyShowPrepList, getLiveShow,
  getEndedShows, setItemNote, getItemNote, cloneShow, setShowViewerPeak,
  setShowExpenses, getShowSoldItems, getShowUnsoldItems, getItemShowHistory,
  getItemShowsWithoutSale, getShowRunSheet, getTodayShows
} from '../features/whatnot-show.js';
import {
  getShowMetrics, calcBestShowDay, calcBestShowTime, calcCategoryPerformance,
  calcShowTrends, calcTopPerformingItems, calcWorstPerformingItems, calcOverallStats,
  suggestShowItems, suggestShowSize, suggestCategoryMix
} from '../features/whatnot-analytics.js';
import { copyPlatformListing } from '../features/ai-listing.js';

// ── STATE ─────────────────────────────────────────────────────────────────

let _clPage = 0;
const _clPageSize = 25;
let _clSearch = '';
let _clPlatFilter = 'all';
let _etsyTab = 'none'; // 'none' | 'stats' | 'reviews' | 'shipments' | 'tags'
let _etsyStatsCache = null;
let _etsyReviewsCache = null;
let _etsyPendingCache = null;
let _etsyTagEditItem = null;
let _clStatusFilter = 'all';
let _wnExpandedShow = null; // which show is expanded in the Whatnot panel
let _wnShowItemPicker = false; // whether item picker is open
let _wnTab = 'shows'; // 'shows' | 'analytics' | 'builder' | 'calculator'
let _wnCalcPrice = '';
let _wnCalcShipping = '';
let _wnCalcCost = '';
let _wnCalcTax = '';
let _wnBuilderSelected = new Set(); // selected item IDs in smart builder
let _clTab = 'overview'; // 'overview', 'matrix', 'templates'

// ── RENDER ────────────────────────────────────────────────────────────────

export function renderCrosslistDashboard() {
  const container = document.getElementById('crosslistContent');
  if (!container) return;

  // Check for newly expired listings
  checkExpiredListings();

  const inStock = inv.filter(i => (i.qty || 0) > 0);
  const stats = getCrosslistStats(inStock);
  const expiring = getExpiringListings(inStock, 7);
  const expired = getExpiredListings(inStock);

  let html = '';

  // ── CONNECTION PANELS ──
  html += _renderEBayPanel();
  html += _renderEtsyPanel();
  html += _renderWhatnotPanel();

  // ── STATS STRIP ──
  html += `<div class="cl-stats-strip">
    <div class="cl-stat"><div class="cl-stat-val" style="color:var(--good)">${stats.totalActive}</div><div class="cl-stat-lbl">Active</div></div>
    <div class="cl-stat"><div class="cl-stat-val" style="color:var(--warn)">${stats.totalExpiringSoon}</div><div class="cl-stat-lbl">Expiring Soon</div></div>
    <div class="cl-stat"><div class="cl-stat-val" style="color:var(--danger)">${stats.totalExpired}</div><div class="cl-stat-lbl">Expired</div></div>
    <div class="cl-stat"><div class="cl-stat-val" style="color:var(--accent2)">${stats.totalSoldElsewhere}</div><div class="cl-stat-lbl">Sold Elsewhere</div></div>
    <div class="cl-stat"><div class="cl-stat-val" style="color:var(--muted)">${stats.itemsNotListed}</div><div class="cl-stat-lbl">Not Listed</div></div>
    <div class="cl-stat"><div class="cl-stat-val" style="color:var(--accent3)">${stats.itemsSinglePlatform}</div><div class="cl-stat-lbl">Single Platform</div></div>
  </div>`;

  // ── TAB SWITCHER ──
  html += `<div class="cl-tabs">
    <button class="cl-tab ${_clTab === 'overview' ? 'active' : ''}" onclick="clSwitchTab('overview')">Overview</button>
    <button class="cl-tab ${_clTab === 'matrix' ? 'active' : ''}" onclick="clSwitchTab('matrix')">Listing Matrix</button>
    <button class="cl-tab ${_clTab === 'templates' ? 'active' : ''}" onclick="clSwitchTab('templates')">Templates</button>
  </div>`;

  if (_clTab === 'overview') {
    html += renderOverviewTab(inStock, expiring, expired, stats);
  } else if (_clTab === 'matrix') {
    html += renderMatrixTab(inStock);
  } else if (_clTab === 'templates') {
    html += renderTemplatesTab();
  }

  container.innerHTML = html;

  // Render pagination for matrix
  if (_clTab === 'matrix') {
    const pgEl = document.getElementById('clPagination');
    const filtered = getFilteredItems(inStock);
    if (pgEl) {
      renderPagination(pgEl, {
        page: _clPage,
        totalItems: filtered.length,
        pageSize: _clPageSize,
        onPage: (p) => { _clPage = p; renderCrosslistDashboard(); },
      });
    }
  }
}

// ── OVERVIEW TAB ──────────────────────────────────────────────────────────

function renderOverviewTab(inStock, expiring, expired, stats) {
  let html = '';

  // ── EXPIRING SOON ──
  if (expiring.length) {
    html += `<div class="cl-section">
      <h3 class="cl-section-title" style="color:var(--warn)">⏰ Expiring Soon (${expiring.length})</h3>
      <div class="cl-cards">`;
    for (const { item, platform, daysLeft, expiryDate } of expiring.slice(0, 10)) {
      html += `<div class="cl-card cl-card-warn">
        <div class="cl-card-header">
          <span class="cl-card-name" onclick="openDrawer('${item.id}')">${escHtml(item.name)}</span>
          <span class="cl-card-days">${daysLeft}d left</span>
        </div>
        <div class="cl-card-plat">${escHtml(platform)}</div>
        <div class="cl-card-actions">
          <button class="btn-sm btn-accent" onclick="clRelistItem('${item.id}','${escHtml(platform)}')">Relist</button>
          <button class="btn-sm btn-muted" onclick="clOpenLink('${escHtml(platform)}','${item.id}')">Open →</button>
        </div>
      </div>`;
    }
    html += `</div></div>`;
  }

  // ── EXPIRED ──
  if (expired.length) {
    html += `<div class="cl-section">
      <h3 class="cl-section-title" style="color:var(--danger)">🚫 Expired Listings (${expired.length})</h3>
      <button class="btn-sm btn-accent" style="margin-bottom:8px" onclick="clBulkRelistExpired()">Relist All Expired</button>
      <div class="cl-cards">`;
    for (const { item, platform, expiryDate } of expired.slice(0, 12)) {
      const ago = Math.ceil((Date.now() - new Date(expiryDate).getTime()) / 86400000);
      html += `<div class="cl-card cl-card-danger">
        <div class="cl-card-header">
          <span class="cl-card-name" onclick="openDrawer('${item.id}')">${escHtml(item.name)}</span>
          <span class="cl-card-days">${ago}d ago</span>
        </div>
        <div class="cl-card-plat">${escHtml(platform)}</div>
        <div class="cl-card-actions">
          <button class="btn-sm btn-accent" onclick="clRelistItem('${item.id}','${escHtml(platform)}')">Relist</button>
          <button class="btn-sm btn-danger" onclick="clDelistItem('${item.id}','${escHtml(platform)}')">Delist</button>
        </div>
      </div>`;
    }
    html += `</div></div>`;
  }

  // ── AUTO-RELIST CONTROLS ──
  html += `<div style="padding:12px;background:var(--surface);border-bottom:1px solid var(--border)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:12px;font-weight:600;color:var(--text)">Auto-Relist</div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
        <input type="checkbox" ${isAutoRelistEnabled() ? 'checked' : ''} onchange="clToggleAutoRelist(this.checked)" style="cursor:pointer">
        <span style="font-size:11px;color:var(--muted)">${isAutoRelistEnabled() ? 'Enabled' : 'Disabled'}</span>
      </label>
    </div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Automatically relist expired listings on renewable platforms (eBay, Etsy, Facebook, etc.)</div>
    <button onclick="clRunAutoRelist()" class="btn-secondary" style="width:100%;height:32px;font-size:11px">Run Auto-Relist Now (${getAutoRelistCandidates().length} candidates)</button>
  </div>`;

  // ── BULK PRICING ──
  html += `<div style="padding:12px;background:var(--surface);border-bottom:1px solid var(--border)">
    <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:8px">Bulk Price Adjustment</div>
    <div class="form-grid" style="gap:6px">
      <select id="clBulkCat" class="fgrp" style="grid-column:1/-1">
        <option value="">All Categories</option>
        ${[...new Set(inv.filter(i=>i.category).map(i=>i.category))].sort().map(c => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('')}
      </select>
      <select id="clBulkPlat" class="fgrp" style="grid-column:1/-1">
        <option value="">All Platforms</option>
        ${Object.keys(PLATFORM_EXPIRY_RULES).slice(0,15).map(p => `<option value="${escHtml(p)}">${escHtml(p)}</option>`).join('')}
      </select>
      <select id="clBulkType" class="fgrp">
        <option value="percent">% Change</option>
        <option value="fixed">$ Change</option>
      </select>
      <input id="clBulkVal" type="number" placeholder="-10" step="1" class="fgrp">
      <input id="clBulkMinDays" type="number" placeholder="Min days listed" class="fgrp" style="grid-column:1/-1">
      <button onclick="clBulkPrice()" class="btn-primary" style="grid-column:1/-1;height:32px;font-size:11px">Apply Bulk Pricing</button>
    </div>
  </div>`;

  // ── NOT LISTED ──
  if (stats.itemsNotListed > 0) {
    const notListed = inStock.filter(i => getPlatforms(i).length === 0).slice(0, 8);
    html += `<div class="cl-section">
      <h3 class="cl-section-title" style="color:var(--muted)">📦 Not Listed Anywhere (${stats.itemsNotListed})</h3>
      <div class="cl-cards">`;
    for (const item of notListed) {
      html += `<div class="cl-card">
        <div class="cl-card-header">
          <span class="cl-card-name" onclick="openDrawer('${item.id}')">${escHtml(item.name)}</span>
          <span class="cl-card-days">${fmt(item.price || 0)}</span>
        </div>
        <div class="cl-card-plat" style="color:var(--muted)">No platforms assigned</div>
        <div class="cl-card-actions">
          <button class="btn-sm btn-accent" onclick="openDrawer('${item.id}')">Edit & List</button>
        </div>
      </div>`;
    }
    html += `</div></div>`;
  }

  // ── SINGLE PLATFORM ──
  if (stats.itemsSinglePlatform > 0) {
    const single = inStock.filter(i => getPlatforms(i).length === 1).slice(0, 6);
    html += `<div class="cl-section">
      <h3 class="cl-section-title" style="color:var(--accent3)">☝ Single Platform (${stats.itemsSinglePlatform})</h3>
      <p style="color:var(--muted);font-size:12px;margin-bottom:8px">These items could reach more buyers if crosslisted</p>
      <div class="cl-cards">`;
    for (const item of single) {
      const p = getPlatforms(item)[0];
      html += `<div class="cl-card">
        <div class="cl-card-header">
          <span class="cl-card-name" onclick="openDrawer('${item.id}')">${escHtml(item.name)}</span>
          <span class="cl-card-days">${escHtml(p)}</span>
        </div>
        <div class="cl-card-actions">
          <button class="btn-sm btn-accent" onclick="openDrawer('${item.id}')">Add Platforms</button>
        </div>
      </div>`;
    }
    html += `</div></div>`;
  }

  // ── QUICK CROSSLIST TIPS ──
  if (!expiring.length && !expired.length && stats.itemsNotListed === 0) {
    html += `<div class="cl-section" style="text-align:center;padding:32px">
      <div style="font-size:24px;margin-bottom:8px">✨</div>
      <div style="color:var(--good);font-weight:600;font-size:14px;margin-bottom:4px">All Listings Healthy</div>
      <div style="color:var(--muted);font-size:12px">No expired or expiring listings. Check the Matrix tab for a full status overview.</div>
    </div>`;
  }

  return html;
}

// ── MATRIX TAB ────────────────────────────────────────────────────────────

function getFilteredItems(inStock) {
  let items = inStock;
  if (_clSearch) {
    const q = _clSearch.toLowerCase();
    items = items.filter(i => i.name.toLowerCase().includes(q) || (i.sku||'').toLowerCase().includes(q));
  }
  if (_clPlatFilter !== 'all') {
    items = items.filter(i => getPlatforms(i).includes(_clPlatFilter));
  }
  if (_clStatusFilter !== 'all') {
    items = items.filter(i => {
      const ps = i.platformStatus || {};
      return Object.values(ps).includes(_clStatusFilter);
    });
  }
  return items;
}

function renderMatrixTab(inStock) {
  // Determine which platforms are in use
  const platSet = new Set();
  for (const item of inStock) {
    for (const p of getPlatforms(item)) platSet.add(p);
  }
  const activePlats = [...platSet].sort();

  let html = '';

  // ── FILTERS ──
  html += `<div class="cl-filters">
    <input type="text" placeholder="Search items..." value="${escHtml(_clSearch)}"
           oninput="clSetSearch(this.value)"
           class="cl-filter-input">
    <select onchange="clSetPlatFilter(this.value)" class="cl-filter-select">
      <option value="all" ${_clPlatFilter === 'all' ? 'selected' : ''}>All Platforms</option>
      ${activePlats.map(p => `<option value="${escHtml(p)}" ${_clPlatFilter === p ? 'selected' : ''}>${escHtml(p)}</option>`).join('')}
    </select>
    <select onchange="clSetStatusFilter(this.value)" class="cl-filter-select">
      <option value="all" ${_clStatusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
      ${LISTING_STATUSES.map(s => `<option value="${s}" ${_clStatusFilter === s ? 'selected' : ''}>${STATUS_LABELS[s]}</option>`).join('')}
    </select>
  </div>`;

  const filtered = getFilteredItems(inStock);
  const totalPages = Math.ceil(filtered.length / _clPageSize);
  if (_clPage >= totalPages) _clPage = Math.max(0, totalPages - 1);
  const page = filtered.slice(_clPage * _clPageSize, (_clPage + 1) * _clPageSize);

  if (!page.length) {
    html += `<div style="text-align:center;padding:24px;color:var(--muted)">No items match filters</div>`;
    return html;
  }

  // ── RESPONSIVE CARD LIST (works on both mobile and desktop) ──
  html += `<div class="cl-matrix-list">`;
  for (const item of page) {
    const plats = getPlatforms(item);
    const ps = item.platformStatus || {};
    const dates = item.platformListingDates || {};
    const health = getListingHealth(item);

    html += `<div class="cl-matrix-item">
      <div class="cl-matrix-header" onclick="openDrawer('${item.id}')">
        <span class="cl-matrix-name">${escHtml(item.name)}</span>
        <span class="cl-matrix-meta">${fmt(item.price || 0)} · Qty: ${item.qty || 0}</span>
      </div>
      <div class="cl-matrix-platforms">`;

    for (const p of plats) {
      // For eBay: derive real status from whether item was actually pushed/published
      let st = ps[p] || 'active';
      if (p === 'eBay') {
        if (!item.ebayItemId) st = 'unlisted';          // tagged but never pushed
        else if (!item.ebayListingId) st = 'draft';      // pushed to inventory but not published
        // else keep whatever platformStatus says (active, sold, etc.)
      }
      const daysLeft = getDaysUntilExpiry(p, dates[p]);
      const expiryLabel = daysLeft !== null
        ? (daysLeft < 0 ? `<span style="color:var(--danger)">${Math.abs(daysLeft)}d expired</span>`
          : daysLeft <= 7 ? `<span style="color:var(--warn)">${daysLeft}d left</span>`
          : `<span style="color:var(--muted)">${daysLeft}d</span>`)
        : '';

      // Show "List on eBay" button if platform is eBay but item hasn't actually been pushed
      const needsEbayPush = p === 'eBay' && !item.ebayItemId && isEBayConnected();
      // Show "Publish" button if pushed to inventory but not yet live
      const needsEbayPublish = p === 'eBay' && item.ebayItemId && !item.ebayListingId && isEBayConnected();
      const ebayStatusLabel = needsEbayPush ? 'Not on eBay yet'
        : needsEbayPublish ? 'Draft — not published'
        : (STATUS_LABELS[st] || st);
      // Platforms without direct API get an "AI Copy" button for smart crosslisting
      const noApiPlats = ['Poshmark','Mercari','Depop','Grailed','Facebook Marketplace','StockX','GOAT','Vinted'];
      const isNoApi = noApiPlats.includes(p);
      const hasCached = item.crosslistCache?.[p];

      html += `<div class="cl-plat-row">
          <div class="cl-plat-info">
            <span class="cl-plat-dot" style="background:${needsEbayPush || needsEbayPublish ? 'var(--warn)' : (STATUS_COLORS[st] || 'var(--muted)')}"></span>
            <span class="cl-plat-name">${escHtml(p)}</span>
            <span class="cl-plat-status">${escHtml(ebayStatusLabel)}</span>
            ${expiryLabel}
          </div>
          <div class="cl-plat-actions">
            ${needsEbayPush ? `<button class="btn-xs btn-accent" onclick="clPushToEBay('${item.id}')">List on eBay</button>` : ''}
            ${needsEbayPublish ? `<button class="btn-xs btn-accent" onclick="clPublishOnEBay('${item.id}')">Publish</button>` : ''}
            ${isNoApi ? `<button class="btn-xs btn-accent" onclick="clAICopy('${item.id}','${escHtml(p)}')" title="Generate AI listing optimized for ${escHtml(p)} and copy to clipboard">✨ ${hasCached ? 'Copy' : 'AI Copy'}</button>` : ''}
            <button class="btn-xs" onclick="clCycleStatus('${item.id}','${escHtml(p)}')" title="Change status">⟳</button>
            <button class="btn-xs" onclick="clCopyListing('${item.id}')" title="Copy listing text">📋</button>
            <button class="btn-xs" onclick="clOpenLink('${escHtml(p)}','${item.id}')" title="Open platform">↗</button>
            ${st === 'expired' ? `<button class="btn-xs btn-accent" onclick="clRelistItem('${item.id}','${escHtml(p)}')">Relist</button>` : ''}
          </div>
        </div>`;
    }

    // Show "List on eBay" button if eBay connected but item not yet pushed to eBay
    if (isEBayConnected() && !item.ebayItemId && !plats.includes('eBay')) {
      html += `<div class="cl-plat-row" style="border-top:1px dashed var(--border)">
        <div class="cl-plat-info" style="color:var(--accent)">
          <span class="cl-plat-name">eBay</span>
          <span class="cl-plat-status" style="color:var(--muted)">Not listed</span>
        </div>
        <div class="cl-plat-actions">
          <button class="btn-xs btn-accent" onclick="clPushToEBay('${item.id}')">List on eBay</button>
        </div>
      </div>`;
    }

    // Show "List on Etsy" button if Etsy connected but item not on Etsy
    if (isEtsyConnected() && !plats.includes('Etsy')) {
      html += `<div class="cl-plat-row" style="border-top:1px dashed var(--border)">
        <div class="cl-plat-info" style="color:#f56400">
          <span class="cl-plat-name">Etsy</span>
          <span class="cl-plat-status" style="color:var(--muted)">Not listed</span>
        </div>
        <div class="cl-plat-actions">
          <button class="btn-xs btn-etsy" onclick="clPushToEtsy('${item.id}')">List on Etsy</button>
        </div>
      </div>`;
    }

    if (!plats.length && !isEBayConnected() && !isEtsyConnected()) {
      html += `<div class="cl-plat-row" style="color:var(--muted);font-style:italic">No platforms — <span onclick="openDrawer('${item.id}')" style="color:var(--accent);cursor:pointer">add some</span></div>`;
    }

    html += `</div></div>`;
  }
  html += `</div>`;
  html += `<div id="clPagination"></div>`;

  return html;
}

// ── TEMPLATES TAB ─────────────────────────────────────────────────────────

function renderTemplatesTab() {
  const templates = getTemplatesForCategory(null);
  let html = `<div class="cl-section">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h3 class="cl-section-title" style="margin:0">Listing Templates</h3>
      <button class="btn-sm btn-accent" onclick="clAddTemplate()">+ New Template</button>
    </div>
    <p style="color:var(--muted);font-size:12px;margin-bottom:12px">Templates auto-fill title & description when listing. Use placeholders: {name}, {condition}, {category}, {price}, {notes}, {upc}, {author}, {isbn}</p>`;

  if (!templates.length) {
    html += `<div style="text-align:center;padding:24px;color:var(--muted)">No templates yet. Click "+ New Template" to create one.</div>`;
  } else {
    html += `<div class="cl-template-grid">`;
    for (const t of templates) {
      html += `<div class="cl-template-card">
        <div class="cl-template-header">
          <span class="cl-template-name">${escHtml(t.name)}</span>
          ${t.isDefault ? '<span class="cl-template-badge">Default</span>' : `<button class="btn-xs btn-danger" onclick="clDeleteTemplate('${t.id}')">✕</button>`}
        </div>
        <div class="cl-template-category">${escHtml(t.category || 'All Categories')}</div>
        <div class="cl-template-preview">
          <div style="font-weight:600;font-size:11px;color:var(--accent);margin-bottom:2px">Title:</div>
          <div style="font-size:11px;color:var(--text)">${escHtml(t.titleFormula)}</div>
          <div style="font-weight:600;font-size:11px;color:var(--accent);margin-top:6px;margin-bottom:2px">Description:</div>
          <div style="font-size:10px;color:var(--muted);white-space:pre-line;max-height:60px;overflow:hidden">${escHtml((t.descriptionTemplate || '').slice(0, 150))}</div>
        </div>
      </div>`;
    }
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// ── ACTIONS ───────────────────────────────────────────────────────────────

export function clSwitchTab(tab) { _clTab = tab; _clPage = 0; renderCrosslistDashboard(); }
export function clSetSearch(v) { _clSearch = v || ''; _clPage = 0; renderCrosslistDashboard(); }
export function clSetPlatFilter(v) { _clPlatFilter = v || 'all'; _clPage = 0; renderCrosslistDashboard(); }
export function clSetStatusFilter(v) { _clStatusFilter = v || 'all'; _clPage = 0; renderCrosslistDashboard(); }

export function clRelistItem(itemId, platform) {
  relistItem(itemId, platform);
  save(); refresh();
  toast(`Relisted on ${platform} ✓`);
  renderCrosslistDashboard();
}

export function clDelistItem(itemId, platform) {
  markPlatformStatus(itemId, platform, 'delisted');
  save(); refresh();
  toast(`Delisted from ${platform}`);
  renderCrosslistDashboard();
}

export function clCycleStatus(itemId, platform) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return;
  const ps = item.platformStatus || {};
  const current = ps[platform] || 'active';
  const cycle = ['active', 'sold', 'delisted', 'expired', 'draft'];
  const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];
  markPlatformStatus(itemId, platform, next);
  if (next === 'active') {
    setListingDate(itemId, platform, localDate());
  }
  save(); refresh();
  renderCrosslistDashboard();
}

export function clOpenLink(platform, itemId) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return;
  const url = generateListingLink(platform, item);
  window.open(url, '_blank');
}

export function clCopyListing(itemId) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return;
  copyListingText(item);
}

export function clBulkRelistExpired() {
  const inStock = inv.filter(i => (i.qty || 0) > 0);
  const expired = getExpiredListings(inStock);
  if (!expired.length) { toast('No expired listings to relist'); return; }
  if (!confirm(`Relist ${expired.length} expired listing(s)?`)) return;
  for (const { item, platform } of expired) {
    relistItem(item.id, platform);
  }
  save(); refresh();
  toast(`${expired.length} listing(s) relisted ✓`);
  renderCrosslistDashboard();
}

export function clAddTemplate() {
  // Create a modal form for template creation
  const modalId = 'clTemplateModal-' + Date.now();
  const html = `<div id="${modalId}" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:var(--z-modal)" onclick="if(event.target.id==='${modalId}') document.getElementById('${modalId}').remove()">
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:20px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto" onclick="event.stopPropagation()">
      <h3 style="margin:0 0 16px 0;font-size:16px;color:var(--text)">New Listing Template</h3>
      <div class="form-grid" style="gap:12px">
        <input id="clTplName" type="text" placeholder="Template name (e.g., 'Vintage Clothing')" class="fgrp" style="grid-column:1/-1">
        <select id="clTplCat" class="fgrp" style="grid-column:1/-1">
          <option value="">All Categories</option>
          ${[...new Set(inv.filter(i=>i.category).map(i=>i.category))].sort().map(c => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('')}
        </select>
        <textarea id="clTplTitle" placeholder="Title formula (use {name}, {condition}, {category}, etc.)" class="fgrp" style="grid-column:1/-1;min-height:60px;font-family:monospace;font-size:12px">{name} - {condition}</textarea>
        <textarea id="clTplDesc" placeholder="Description template" class="fgrp" style="grid-column:1/-1;min-height:120px;font-family:monospace;font-size:12px">{name}
Condition: {condition}
Category: {category}
{notes}</textarea>
        <div style="grid-column:1/-1;display:flex;gap:8px">
          <button class="btn-secondary" style="flex:1;height:32px" onclick="document.getElementById('${modalId}').remove()">Cancel</button>
          <button class="btn-primary" style="flex:1;height:32px" onclick="clSaveTemplate('${modalId}')">Create Template</button>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('clTplName').focus();
}

export async function clSaveTemplate(modalId) {
  const name = document.getElementById('clTplName')?.value?.trim();
  const category = document.getElementById('clTplCat')?.value?.trim() || '';
  const titleFormula = document.getElementById('clTplTitle')?.value?.trim();
  const descTemplate = document.getElementById('clTplDesc')?.value?.trim() || '';

  if (!name) { toast('Enter a template name', true); return; }
  if (!titleFormula) { toast('Enter a title formula', true); return; }

  document.getElementById(modalId)?.remove();

  addTemplate({ name, category, titleFormula, descriptionTemplate: descTemplate });
  toast('Template created ✓');
  renderCrosslistDashboard();
}

export function clDeleteTemplate(id) {
  if (!confirm('Delete this template?')) return;
  deleteTemplate(id);
  toast('Template deleted');
  renderCrosslistDashboard();
}

// ── Etsy INTEGRATION PANEL ────────────────────────────────────────────────

function _renderEtsyPanel() {
  const connected = isEtsyConnected();
  const shopName = getEtsyShopName();
  const syncing = isEtsySyncing();
  const lastSync = getLastEtsySyncTime();
  const lastSyncLabel = lastSync
    ? new Date(lastSync).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Never';

  if (connected) {
    let html = `<div class="etsy-panel etsy-connected">
      <div class="etsy-panel-left">
        <div class="etsy-panel-status">
          <span class="etsy-dot etsy-dot-on"></span>
          <strong>Etsy Connected</strong>
          ${shopName ? `<span class="etsy-shop">(${escHtml(shopName)})</span>` : ''}
        </div>
        <div class="etsy-panel-meta">Last sync: ${escHtml(lastSyncLabel)}</div>
      </div>
      <div class="etsy-panel-actions">
        <button class="btn-sm btn-etsy" onclick="clEtsySync()" ${syncing ? 'disabled' : ''}>
          ${syncing ? '⟳ Syncing…' : '⟳ Sync Now'}
        </button>
        <button class="btn-sm btn-muted" onclick="clEtsyDisconnect()">Disconnect</button>
      </div>
    </div>`;

    // Sub-tabs for Etsy features
    html += `<div class="etsy-subtabs">
      <button class="etsy-subtab ${_etsyTab === 'stats' ? 'active' : ''}" onclick="clEtsySubTab('stats')">Stats</button>
      <button class="etsy-subtab ${_etsyTab === 'reviews' ? 'active' : ''}" onclick="clEtsySubTab('reviews')">Reviews</button>
      <button class="etsy-subtab ${_etsyTab === 'shipments' ? 'active' : ''}" onclick="clEtsySubTab('shipments')">Shipments</button>
      <button class="etsy-subtab ${_etsyTab === 'tags' ? 'active' : ''}" onclick="clEtsySubTab('tags')">Tags</button>
    </div>`;

    // Render active sub-tab content
    if (_etsyTab === 'stats') html += _renderEtsyStats();
    else if (_etsyTab === 'reviews') html += _renderEtsyReviews();
    else if (_etsyTab === 'shipments') html += _renderEtsyShipments();
    else if (_etsyTab === 'tags') html += _renderEtsyTags();

    return html;
  }

  return `<div class="etsy-panel">
    <div class="etsy-panel-left">
      <div class="etsy-panel-status">
        <span class="etsy-dot"></span>
        <strong>Etsy</strong>
        <span class="etsy-shop" style="color:var(--muted)">Not connected</span>
      </div>
      <div class="etsy-panel-meta">Connect your shop to sync listings, track sales, and manage inventory</div>
    </div>
    <div class="etsy-panel-actions">
      <button class="btn-sm btn-etsy" onclick="clEtsyConnect()">Connect Etsy Shop</button>
    </div>
  </div>`;
}

function _renderEtsyStats() {
  if (!_etsyStatsCache) {
    return `<div class="etsy-stats-panel"><div style="text-align:center;padding:20px;color:var(--muted)">
      <button class="btn-sm btn-etsy" onclick="clEtsyLoadStats()">Load Shop Stats</button>
    </div></div>`;
  }
  const s = _etsyStatsCache;
  const summary = getEtsyAnalyticsSummary();
  return `<div class="etsy-stats-panel">
    <div class="etsy-stats-grid">
      <div class="etsy-stat"><div class="etsy-stat-val">${s.numFavorers}</div><div class="etsy-stat-lbl">Favorites</div></div>
      <div class="etsy-stat"><div class="etsy-stat-val">${s.totalSold}</div><div class="etsy-stat-lbl">Total Sold</div></div>
      <div class="etsy-stat"><div class="etsy-stat-val">${s.activeListings}</div><div class="etsy-stat-lbl">Active</div></div>
      <div class="etsy-stat"><div class="etsy-stat-val">${s.reviewCount}</div><div class="etsy-stat-lbl">Reviews</div></div>
      <div class="etsy-stat"><div class="etsy-stat-val">${s.reviewAvg ? s.reviewAvg.toFixed(1) + '★' : '—'}</div><div class="etsy-stat-lbl">Rating</div></div>
      <div class="etsy-stat"><div class="etsy-stat-val">${fmt(summary.totalRevenue)}</div><div class="etsy-stat-lbl">Revenue</div></div>
    </div>
    ${summary.topItems.length ? `<div style="margin-top:12px">
      <strong style="font-size:12px;color:var(--muted)">Top Sellers</strong>
      ${summary.topItems.map(t => `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;border-bottom:1px solid var(--border)">
        <span>${escHtml(t.name)}</span><span style="color:var(--accent)">${t.count} sold</span>
      </div>`).join('')}
    </div>` : ''}
    <div style="margin-top:8px;text-align:right">
      <button class="btn-sm btn-muted" onclick="clEtsyLoadStats()">Refresh</button>
      <button class="btn-sm btn-muted" onclick="clEtsySyncQty()">Sync All Quantities</button>
      <button class="btn-sm btn-muted" onclick="clEtsySyncExpenses()">Sync Expenses</button>
    </div>
  </div>`;
}

function _renderEtsyReviews() {
  if (!_etsyReviewsCache) {
    return `<div class="etsy-stats-panel"><div style="text-align:center;padding:20px;color:var(--muted)">
      <button class="btn-sm btn-etsy" onclick="clEtsyLoadReviews()">Load Reviews</button>
    </div></div>`;
  }
  const summary = getEtsyReviewSummary(_etsyReviewsCache);
  const stars = '★'.repeat(Math.round(summary.avg)) + '☆'.repeat(5 - Math.round(summary.avg));
  return `<div class="etsy-stats-panel">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <span style="font-size:24px;font-weight:700">${summary.avg.toFixed(1)}</span>
      <span style="font-size:18px;color:var(--warn)">${stars}</span>
      <span style="color:var(--muted);font-size:13px">(${summary.count} reviews)</span>
    </div>
    <div class="etsy-rating-bars">
      ${[5,4,3,2,1].map(n => {
        const pctVal = summary.count ? Math.round(summary.distribution[n] / summary.count * 100) : 0;
        return `<div class="etsy-rating-row">
          <span>${n}★</span>
          <div class="etsy-rating-bar"><div class="etsy-rating-fill" style="width:${pctVal}%"></div></div>
          <span>${summary.distribution[n]}</span>
        </div>`;
      }).join('')}
    </div>
    <div style="margin-top:12px">
      ${_etsyReviewsCache.slice(0, 10).map(r => `<div class="etsy-review-card">
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--warn)">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
          <span style="font-size:11px;color:var(--muted)">${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
        </div>
        ${r.message ? `<div style="font-size:13px;margin-top:4px">${escHtml(r.message.slice(0, 200))}${r.message.length > 200 ? '…' : ''}</div>` : '<div style="font-size:12px;color:var(--muted);margin-top:4px">No comment</div>'}
      </div>`).join('')}
    </div>
    <div style="margin-top:8px;text-align:right">
      <button class="btn-sm btn-muted" onclick="clEtsyLoadReviews()">Refresh</button>
    </div>
  </div>`;
}

function _renderEtsyShipments() {
  if (!_etsyPendingCache) {
    return `<div class="etsy-stats-panel"><div style="text-align:center;padding:20px;color:var(--muted)">
      <button class="btn-sm btn-etsy" onclick="clEtsyLoadShipments()">Load Pending Shipments</button>
    </div></div>`;
  }
  if (!_etsyPendingCache.length) {
    return `<div class="etsy-stats-panel"><div style="text-align:center;padding:20px;color:var(--muted)">No pending shipments</div></div>`;
  }
  const carriers = getEtsyCarriers();
  return `<div class="etsy-stats-panel">
    <strong style="font-size:13px">${_etsyPendingCache.length} Pending Shipment${_etsyPendingCache.length > 1 ? 's' : ''}</strong>
    ${_etsyPendingCache.map(r => `<div class="etsy-pending-ship">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <strong style="font-size:13px">${escHtml(r.buyerName)}</strong>
        <span style="font-size:12px;color:var(--muted)">${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:6px">
        ${r.items.map(i => `${escHtml(i.title)} ×${i.quantity}`).join(', ')}
        — ${fmt(r.totalPrice)}
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <input type="text" class="etsy-tracking-input" id="etsyTrack_${r.receiptId}" placeholder="Tracking #" style="flex:1">
        <select id="etsyCarrier_${r.receiptId}" class="etsy-tracking-input" style="width:100px">
          ${carriers.map(c => `<option value="${c}">${c.toUpperCase()}</option>`).join('')}
        </select>
        <button class="btn-sm btn-etsy" onclick="clEtsyPushTracking('${r.receiptId}')">Ship</button>
      </div>
    </div>`).join('')}
    <div style="margin-top:8px;text-align:right">
      <button class="btn-sm btn-muted" onclick="clEtsyLoadShipments()">Refresh</button>
    </div>
  </div>`;
}

function _renderEtsyTags() {
  const etsyItems = inv.filter(i => i.etsyListingId);
  if (!etsyItems.length) {
    return `<div class="etsy-stats-panel"><div style="text-align:center;padding:20px;color:var(--muted)">No Etsy-linked items</div></div>`;
  }

  let html = `<div class="etsy-stats-panel">
    <strong style="font-size:13px">Tag Optimizer</strong>
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px">Select an item to edit its Etsy tags (max 13 per listing)</div>
    <select id="etsyTagItemPick" onchange="clEtsyTagSelect(this.value)" style="width:100%;padding:6px;border-radius:6px;border:1px solid var(--border);background:var(--bg);color:var(--text);margin-bottom:10px">
      <option value="">— Select item —</option>
      ${etsyItems.map(i => `<option value="${i.id}" ${_etsyTagEditItem === i.id ? 'selected' : ''}>${escHtml(i.name || 'Untitled')} (${(i.tags || []).length}/13 tags)</option>`).join('')}
    </select>`;

  if (_etsyTagEditItem) {
    const item = inv.find(i => i.id === _etsyTagEditItem);
    if (item) {
      const currentTags = item.tags || [];
      const suggestions = suggestEtsyTags(item.id);
      html += `<div style="margin-bottom:8px">
        <strong style="font-size:12px">Current Tags (${currentTags.length}/13)</strong>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
          ${currentTags.map((t, i) => `<span class="etsy-tag-chip" onclick="clEtsyRemoveTag('${_etsyTagEditItem}',${i})">${escHtml(t)} ×</span>`).join('')}
          ${!currentTags.length ? '<span style="font-size:12px;color:var(--muted)">No tags</span>' : ''}
        </div>
      </div>`;
      if (suggestions.length && currentTags.length < 13) {
        html += `<div style="margin-bottom:8px">
          <strong style="font-size:12px">Suggestions</strong>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
            ${suggestions.slice(0, 13 - currentTags.length).map(t => `<span class="etsy-tag-suggest" onclick="clEtsyAddTag('${_etsyTagEditItem}','${escHtml(t)}')">${escHtml(t)} +</span>`).join('')}
          </div>
        </div>`;
      }
      html += `<div style="display:flex;gap:6px;margin-top:8px">
        <button class="btn-sm btn-etsy" onclick="clEtsySaveTags('${_etsyTagEditItem}')">Save to Etsy</button>
        <button class="btn-sm btn-muted" onclick="clEtsySuggestTags('${_etsyTagEditItem}')">Suggest More</button>
      </div>`;
    }
  }

  html += `</div>`;
  return html;
}

// ── Etsy ACTION HANDLERS ─────────────────────────────────────────────────

export function clEtsyConnect() {
  connectEtsy();
}

export function clEtsyDisconnect() {
  if (!confirm('Disconnect your Etsy shop? You can reconnect anytime.')) return;
  disconnectEtsy();
}

export async function clEtsySync() {
  toast('Syncing Etsy listings…');
  renderCrosslistDashboard(); // Show syncing state
  try {
    const result = await pullEtsyListings();
    toast(`Etsy sync complete — ${result.matched} matched, ${result.updated} updated`);
  } catch (e) {
    toast(`Etsy sync error: ${e.message}`, true);
  }
  renderCrosslistDashboard();
}

export async function clPushToEtsy(itemId) {
  const result = await pushItemToEtsy(itemId);
  if (result.success) {
    renderCrosslistDashboard();
  }
}

export async function clDeactivateEtsyListing(itemId) {
  if (!confirm('Deactivate this Etsy listing?')) return;
  const result = await deactivateEtsyListing(itemId);
  if (result.success) {
    refresh();
    renderCrosslistDashboard();
  }
}

export async function clRenewEtsyListing(itemId) {
  if (!confirm('Renew this Etsy listing? ($0.20 fee applies)')) return;
  const result = await renewEtsyListing(itemId);
  if (result.success) {
    refresh();
    renderCrosslistDashboard();
  }
}

// ── Etsy SUB-TAB & FEATURE HANDLERS ──────────────────────────────────────

export function clEtsySubTab(tab) {
  _etsyTab = _etsyTab === tab ? 'none' : tab;
  renderCrosslistDashboard();
}

export async function clEtsyLoadStats() {
  toast('Loading Etsy stats…');
  try {
    _etsyStatsCache = await fetchEtsyShopStats();
    renderCrosslistDashboard();
  } catch (e) { toast(`Stats error: ${e.message}`, true); }
}

export async function clEtsyLoadReviews() {
  toast('Loading Etsy reviews…');
  try {
    _etsyReviewsCache = await fetchEtsyReviews();
    renderCrosslistDashboard();
  } catch (e) { toast(`Reviews error: ${e.message}`, true); }
}

export async function clEtsyLoadShipments() {
  toast('Loading pending shipments…');
  try {
    _etsyPendingCache = await fetchEtsyReceiptsPending();
    renderCrosslistDashboard();
  } catch (e) { toast(`Shipments error: ${e.message}`, true); }
}

export async function clEtsyPushTracking(receiptId) {
  const trackEl = document.getElementById(`etsyTrack_${receiptId}`);
  const carrierEl = document.getElementById(`etsyCarrier_${receiptId}`);
  const tracking = trackEl?.value?.trim();
  const carrier = carrierEl?.value || 'usps';
  if (!tracking) { toast('Enter a tracking number', true); return; }
  const result = await pushEtsyTracking(receiptId, tracking, carrier);
  if (result.success) {
    // Refresh pending list
    _etsyPendingCache = await fetchEtsyReceiptsPending();
    renderCrosslistDashboard();
  }
}

export async function clEtsySyncQty() {
  toast('Syncing quantities…');
  try {
    const r = await syncAllEtsyQuantities();
    toast(`Qty sync: ${r.pulled} pulled, ${r.pushed} pushed`);
    renderCrosslistDashboard();
  } catch (e) { toast(`Qty sync error: ${e.message}`, true); }
}

export async function clEtsyPushPhotos(itemId) {
  toast('Uploading photos…');
  try {
    await pushEtsyPhotos(itemId);
  } catch (e) { toast(`Photo error: ${e.message}`, true); }
}

export async function clEtsyPushQty(itemId) {
  await pushEtsyQuantity(itemId);
}

export async function clEtsyPushPrice(itemId) {
  toast('Pushing price to Etsy…');
  try {
    const r = await pushEtsyPrice(itemId);
    if (r.success) toast('Price synced to Etsy');
    else toast('Price sync failed', true);
  } catch (e) { toast(`Price sync error: ${e.message}`, true); }
}

export function clEtsyTagSelect(itemId) {
  _etsyTagEditItem = itemId || null;
  renderCrosslistDashboard();
}

export function clEtsyRemoveTag(itemId, tagIndex) {
  const item = inv.find(i => i.id === itemId);
  if (!item || !item.tags) return;
  item.tags.splice(tagIndex, 1);
  markDirty('inv', itemId);
  save();
  renderCrosslistDashboard();
}

export function clEtsyAddTag(itemId, tag) {
  const item = inv.find(i => i.id === itemId);
  if (!item) return;
  if (!item.tags) item.tags = [];
  if (item.tags.length >= 13) { toast('Max 13 tags', true); return; }
  if (item.tags.includes(tag)) return;
  item.tags.push(tag.slice(0, 20));
  markDirty('inv', itemId);
  save();
  renderCrosslistDashboard();
}

export async function clEtsySuggestTags(itemId) {
  const suggestions = suggestEtsyTags(itemId);
  if (!suggestions.length) toast('No more suggestions');
  renderCrosslistDashboard();
}

export async function clEtsySaveTags(itemId) {
  toast('Saving tags to Etsy…');
  try {
    const item = inv.find(i => i.id === itemId);
    if (!item) return;
    await pushEtsyTags(itemId, item.tags || []);
  } catch (e) { toast(`Tag save error: ${e.message}`, true); }
}

export async function clEtsySyncExpenses() {
  toast('Syncing Etsy expenses…');
  try {
    const r = await syncEtsyExpenses();
    toast(`${r.synced} expense${r.synced !== 1 ? 's' : ''} synced`);
  } catch (e) { toast(`Expense sync error: ${e.message}`, true); }
}

// ── AUTO-RELIST HANDLERS ──────────────────────────────────────────────────

export function clToggleAutoRelist(enabled) {
  if (enabled) enableAutoRelist();
  else disableAutoRelist();
  renderCrosslistDashboard();
}

export function clRunAutoRelist() {
  const count = runAutoRelist();
  if (count === 0) toast('No expired renewable listings to relist');
  renderCrosslistDashboard();
}

export function clBulkPrice() {
  const category = document.getElementById('clBulkCat')?.value || '';
  const platform = document.getElementById('clBulkPlat')?.value || '';
  const adjustType = document.getElementById('clBulkType')?.value || 'percent';
  const adjustValue = parseFloat(document.getElementById('clBulkVal')?.value) || 0;
  const minDaysListed = parseInt(document.getElementById('clBulkMinDays')?.value) || 0;

  if (!adjustValue) { toast('Enter a price adjustment value', true); return; }
  const desc = adjustType === 'percent' ? `${adjustValue > 0 ? '+' : ''}${adjustValue}%` : `${adjustValue > 0 ? '+' : ''}$${adjustValue}`;
  if (!confirm(`Apply ${desc} to matching items?`)) return;

  bulkPriceAdjust({ category, platform, adjustType, adjustValue, minDaysListed });
  renderCrosslistDashboard();
}

// ── WHATNOT SHOWS PANEL ─────────────────────────────────────────────────────

function _renderWhatnotPanel() {
  const liveShow = getLiveShow();
  const upcoming = getUpcomingShows();
  const showCount = upcoming.length;

  let html = `<div class="wn-panel">
    <div class="wn-panel-header">
      <div class="wn-panel-left">
        <div class="wn-panel-status">
          <span class="wn-dot${liveShow ? ' wn-dot-live' : ''}"></span>
          <strong>Whatnot Shows</strong>
          ${liveShow ? `<span class="wn-live-badge">LIVE</span>` : `<span style="color:var(--muted)">${showCount} upcoming</span>`}
        </div>
        <div class="wn-panel-meta">${liveShow ? `"${escHtml(liveShow.name)}" is live — ${liveShow.soldCount || 0} sold` : 'Organize items into shows for live selling'}</div>
      </div>
      <div class="wn-panel-actions">
        <button class="btn-sm btn-accent" onclick="wnNewShow()">+ New Show</button>
      </div>
    </div>
    <div class="wn-tabs">
      <button class="wn-tab${_wnTab === 'shows' ? ' active' : ''}" onclick="wnSwitchTab('shows')">Shows</button>
      <button class="wn-tab${_wnTab === 'analytics' ? ' active' : ''}" onclick="wnSwitchTab('analytics')">Analytics</button>
      <button class="wn-tab${_wnTab === 'builder' ? ' active' : ''}" onclick="wnSwitchTab('builder')">Smart Builder</button>
      <button class="wn-tab${_wnTab === 'calculator' ? ' active' : ''}" onclick="wnSwitchTab('calculator')">Sale Calculator</button>
    </div>`;

  if (_wnTab === 'shows') html += _renderWnShowsTab();
  else if (_wnTab === 'analytics') html += _renderWnAnalyticsTab();
  else if (_wnTab === 'builder') html += _renderWnBuilderTab();
  else if (_wnTab === 'calculator') html += _renderWnCalculatorTab();

  html += `</div>`;
  return html;
}

// ── Shows Tab ──────────────────────────────────────────────────────────

function _renderWnShowsTab() {
  const upcoming = getUpcomingShows();
  const past = getPastShows();
  let html = '';

  if (upcoming.length > 0) {
    html += `<div class="wn-shows-list">`;
    for (const show of upcoming) {
      const expanded = _wnExpandedShow === show.id;
      const isLive = show.status === 'live';
      const dateLabel = show.date ? ds(show.date + 'T12:00:00') : 'No date';
      const timeLabel = show.time || '';

      html += `<div class="wn-show-card${isLive ? ' wn-show-live' : ''}${expanded ? ' wn-show-expanded' : ''}">
        <div class="wn-show-header" onclick="wnToggleShow('${show.id}')">
          <div class="wn-show-info">
            <span class="wn-show-name">${escHtml(show.name)}</span>
            ${show.recurring ? '<span class="wn-recurring-badge">↻</span>' : ''}
            <span class="wn-show-date">${escHtml(dateLabel)}${timeLabel ? ' @ ' + escHtml(timeLabel) : ''}</span>
            <span class="wn-show-count">${show.items.length} item${show.items.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="wn-show-actions" onclick="event.stopPropagation()">
            ${isLive
              ? `<button class="btn-xs btn-danger" onclick="wnEndShow('${show.id}')">End Show</button>`
              : `<button class="btn-xs btn-accent" onclick="wnStartShow('${show.id}')"${show.items.length === 0 ? ' disabled title="Add items first"' : ''}>Go Live</button>`
            }
            <button class="btn-xs" onclick="wnCopyPrep('${show.id}')" title="Copy prep list">📋</button>
            <button class="btn-xs" onclick="wnPrintRunSheet('${show.id}')" title="Print run sheet">🖨</button>
            ${!isLive ? `<button class="btn-xs btn-muted" onclick="wnDeleteShow('${show.id}')" title="Delete show">✕</button>` : ''}
          </div>
        </div>`;

      if (expanded) {
        html += `<div class="wn-show-items">`;
        // Viewer count & expenses for live shows
        if (isLive) {
          html += `<div class="wn-live-controls">
            <label class="wn-viewer-input">Viewers: <input type="number" min="0" value="${show.viewerPeak || ''}" placeholder="Peak" onchange="wnSetViewerPeak('${show.id}',this.value)" style="width:60px"></label>
          </div>`;
        }
        if (show.items.length === 0) {
          html += `<div class="wn-show-empty">No items yet — add items to start your show prep</div>`;
        }
        show.items.forEach((itemId, i) => {
          const item = inv.find(x => x.id === itemId);
          if (!item) return;
          const imgUrl = (item.images && item.images[0]) || '';
          const note = getItemNote(show.id, itemId);
          const isSold = show.soldItems?.[itemId];
          html += `<div class="wn-show-item${isSold ? ' wn-item-sold' : ''}">
            <span class="wn-item-num">${i + 1}</span>
            ${imgUrl ? `<img class="wn-item-thumb" src="${escHtml(imgUrl)}" alt="">` : `<span class="wn-item-thumb wn-item-nophoto">📦</span>`}
            <div class="wn-item-info">
              <span class="wn-item-name">${escHtml(item.name || 'Untitled')}${isSold ? ' <span class="wn-sold-tag">SOLD</span>' : ''}</span>
              <span class="wn-item-detail">${escHtml(item.condition || '')} ${item.price ? fmt(item.price) : ''}</span>
              ${note ? `<span class="wn-item-note-preview" title="${escHtml(note)}">💬 ${escHtml(note.slice(0, 40))}${note.length > 40 ? '…' : ''}</span>` : ''}
            </div>
            <div class="wn-item-actions">
              ${isLive && !isSold ? `<button class="btn-xs btn-accent" onclick="wnMarkSold('${show.id}','${itemId}')">Sold</button>` : ''}
              <button class="btn-xs" onclick="wnEditItemNote('${show.id}','${itemId}')" title="Talking points">💬</button>
              <button class="btn-xs" onclick="wnMoveItem('${show.id}','${itemId}','up')" title="Move up"${i === 0 ? ' disabled' : ''}>▲</button>
              <button class="btn-xs" onclick="wnMoveItem('${show.id}','${itemId}','down')" title="Move down"${i === show.items.length - 1 ? ' disabled' : ''}>▼</button>
              <button class="btn-xs btn-muted" onclick="wnRemoveItem('${show.id}','${itemId}')" title="Remove">✕</button>
            </div>
          </div>`;
        });
        html += `<div class="wn-show-add-row">
          <button class="btn-sm btn-accent" onclick="wnOpenItemPicker('${show.id}')">+ Add Items</button>
          <label class="wn-expense-input">Expenses: $<input type="number" min="0" step="0.01" value="${show.showExpenses || ''}" placeholder="0" onchange="wnSetExpenses('${show.id}',this.value)" style="width:60px"></label>
        </div>`;

        if (_wnShowItemPicker) {
          const available = inv.filter(x =>
            (x.qty || 0) > 0 && !show.items.includes(x.id)
          ).slice(0, 50);
          html += `<div class="wn-item-picker">
            <div class="wn-picker-header">
              <strong>Select items to add</strong>
              <button class="btn-xs btn-muted" onclick="wnCloseItemPicker()">Done</button>
            </div>
            <div class="wn-picker-list">`;
          if (available.length === 0) {
            html += `<div class="wn-picker-empty">All in-stock items are already in this show</div>`;
          }
          for (const item of available) {
            const showHist = getItemShowHistory(item.id);
            const histLabel = showHist.length ? ` (${showHist.filter(h => h.wasSold).length}/${showHist.length} shows sold)` : '';
            html += `<div class="wn-picker-item" onclick="wnPickItem('${show.id}','${item.id}')">
              <span class="wn-picker-name">${escHtml(item.name || 'Untitled')}${histLabel}</span>
              <span class="wn-picker-price">${item.price ? fmt(item.price) : ''}</span>
            </div>`;
          }
          html += `</div></div>`;
        }
        html += `</div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;
  }

  // Past shows
  if (past.length > 0) {
    html += `<div class="wn-past-shows">
      <div class="wn-past-label">Past Shows</div>`;
    for (const s of past.slice(0, 5)) {
      const m = getShowMetrics(s);
      html += `<div class="wn-past-card">
        <div class="wn-past-info">
          <strong>${escHtml(s.name.slice(0, 25))}</strong>
          <span>${s.date ? ds(s.date + 'T12:00:00') : ''}</span>
        </div>
        <div class="wn-past-stats">
          <span>${s.soldCount || 0}/${s.items?.length || 0} sold</span>
          <span>${fmt(s.totalRevenue || 0)}</span>
          <span style="color:${m.profit >= 0 ? 'var(--good)' : 'var(--danger)'}">${fmt(m.profit)}</span>
        </div>
        <div class="wn-past-actions">
          <button class="btn-xs" onclick="wnCloneShow('${s.id}')" title="Clone as new show">↻ Clone</button>
          <button class="btn-xs" onclick="wnExportShowCSV('${s.id}')" title="Export results CSV">📊</button>
        </div>
      </div>`;
    }
    html += `</div>`;
  }

  return html;
}

// ── Analytics Tab ──────────────────────────────────────────────────────

function _renderWnAnalyticsTab() {
  const stats = calcOverallStats();
  if (!stats) {
    return `<div class="wn-analytics-empty">
      <p style="color:var(--muted);text-align:center;padding:30px">No completed shows yet. Analytics will appear after your first show ends.</p>
    </div>`;
  }

  let html = `<div class="wn-analytics">`;

  // Overall stats
  html += `<div class="wn-stats-grid">
    <div class="wn-stat"><div class="wn-stat-val">${stats.showCount}</div><div class="wn-stat-label">Shows</div></div>
    <div class="wn-stat"><div class="wn-stat-val">${(stats.avgSellThrough * 100).toFixed(0)}%</div><div class="wn-stat-label">Avg Sell-Through</div></div>
    <div class="wn-stat"><div class="wn-stat-val">${fmt(stats.totalRevenue)}</div><div class="wn-stat-label">Total Revenue</div></div>
    <div class="wn-stat"><div class="wn-stat-val">${fmt(stats.totalProfit)}</div><div class="wn-stat-label">Total Profit</div></div>
    <div class="wn-stat"><div class="wn-stat-val">${fmt(stats.revenuePerHour)}/hr</div><div class="wn-stat-label">Rev/Hour</div></div>
    <div class="wn-stat"><div class="wn-stat-val">${stats.totalSold}</div><div class="wn-stat-label">Items Sold</div></div>
  </div>`;

  // Best day/time
  const bestDay = calcBestShowDay().find(d => d.showCount > 0);
  const bestTime = calcBestShowTime().find(t => t.showCount > 0);
  if (bestDay || bestTime) {
    html += `<div class="wn-best-badges">`;
    if (bestDay) html += `<span class="wn-badge">Best Day: <strong>${bestDay.dayName}</strong> (${(bestDay.avgSellThrough * 100).toFixed(0)}% sell-through)</span>`;
    if (bestTime) html += `<span class="wn-badge">Best Time: <strong>${bestTime.label}</strong> (${(bestTime.avgSellThrough * 100).toFixed(0)}% sell-through)</span>`;
    html += `</div>`;
  }

  // Performance trend (sparkline via inline SVG)
  const trends = calcShowTrends(10);
  if (trends.length >= 2) {
    const maxST = Math.max(...trends.map(t => t.sellThrough), 0.01);
    const w = 300, h = 60, pad = 4;
    const pts = trends.map((t, i) => {
      const x = pad + (i / (trends.length - 1)) * (w - pad * 2);
      const y = h - pad - (t.sellThrough / maxST) * (h - pad * 2);
      return `${x},${y}`;
    }).join(' ');
    html += `<div class="wn-trend-section">
      <div class="wn-section-title">Sell-Through Trend (last ${trends.length} shows)</div>
      <svg class="wn-sparkline" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
        <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2"/>
        ${trends.map((t, i) => {
          const x = pad + (i / (trends.length - 1)) * (w - pad * 2);
          const y = h - pad - (t.sellThrough / maxST) * (h - pad * 2);
          return `<circle cx="${x}" cy="${y}" r="3" fill="var(--accent)"><title>${t.name}: ${(t.sellThrough * 100).toFixed(0)}%</title></circle>`;
        }).join('')}
      </svg>
    </div>`;
  }

  // Category performance
  const catPerf = calcCategoryPerformance().slice(0, 6);
  if (catPerf.length > 0) {
    const maxShown = Math.max(...catPerf.map(c => c.shown), 1);
    html += `<div class="wn-section-title">Category Performance</div>
    <div class="wn-cat-bars">`;
    for (const c of catPerf) {
      const pct = (c.sellThrough * 100).toFixed(0);
      const barW = Math.max(4, (c.shown / maxShown) * 100);
      html += `<div class="wn-cat-row">
        <span class="wn-cat-name">${escHtml(c.category)}</span>
        <div class="wn-cat-bar-wrap"><div class="wn-cat-bar" style="width:${barW}%"></div></div>
        <span class="wn-cat-pct">${pct}% (${c.sold}/${c.shown})</span>
      </div>`;
    }
    html += `</div>`;
  }

  // Performance table
  const recent = getEndedShows(10);
  if (recent.length > 0) {
    html += `<div class="wn-section-title">Recent Shows</div>
    <div class="wn-perf-table"><table>
      <thead><tr><th>Show</th><th>Date</th><th>Items</th><th>Sold</th><th>ST%</th><th>Revenue</th><th>Profit</th></tr></thead><tbody>`;
    for (const s of recent) {
      const m = getShowMetrics(s);
      html += `<tr>
        <td>${escHtml(s.name.slice(0, 20))}</td>
        <td>${s.date || ''}</td>
        <td>${m.itemCount}</td>
        <td>${m.soldCount}</td>
        <td>${(m.sellThrough * 100).toFixed(0)}%</td>
        <td>${fmt(m.revenue)}</td>
        <td style="color:${m.profit >= 0 ? 'var(--good)' : 'var(--danger)'}">${fmt(m.profit)}</td>
      </tr>`;
    }
    html += `</tbody></table></div>`;
  }

  // Top & worst performers
  const top = calcTopPerformingItems(5);
  const worst = calcWorstPerformingItems(2, 5);

  if (top.length > 0) {
    html += `<div class="wn-section-title">Top Sellers on Whatnot</div><div class="wn-performer-list">`;
    for (const t of top) {
      html += `<div class="wn-performer-row"><span>${escHtml(t.item.name?.slice(0, 30) || '')}</span><span class="wn-performer-stat">${t.sold}/${t.shown} sold · ${fmt(t.totalRevenue)}</span></div>`;
    }
    html += `</div>`;
  }

  if (worst.length > 0) {
    html += `<div class="wn-section-title" style="color:var(--warn)">Struggling Items (shown ${worst[0]?.shown || 2}+ times, 0 sales)</div><div class="wn-performer-list">`;
    for (const w of worst) {
      html += `<div class="wn-performer-row"><span>${escHtml(w.item.name?.slice(0, 30) || '')}</span><span class="wn-performer-stat" style="color:var(--warn)">Shown ${w.shown}× — no sales</span></div>`;
    }
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// ── Smart Builder Tab ──────────────────────────────────────────────────

function _renderWnBuilderTab() {
  const suggestions = suggestShowItems(30);
  const sizeRec = suggestShowSize();
  const catMix = suggestCategoryMix();

  let html = `<div class="wn-builder">`;

  // Size recommendation
  html += `<div class="wn-builder-rec">
    <strong>Recommended show size:</strong> ~${sizeRec.recommended} items
    (${sizeRec.min}-${sizeRec.max} range)
    ${sizeRec.avgSellThrough ? ` · Best sell-through at this size: ${(sizeRec.avgSellThrough * 100).toFixed(0)}%` : ''}
  </div>`;

  // Category mix
  if (catMix.length > 0) {
    html += `<div class="wn-builder-mix"><strong>Suggested mix:</strong> `;
    html += catMix.slice(0, 5).map(c => `${escHtml(c.category)} (${(c.percentage * 100).toFixed(0)}%)`).join(', ');
    html += `</div>`;
  }

  // Action bar
  const selCount = _wnBuilderSelected.size;
  html += `<div class="wn-builder-actions">
    <button class="btn-sm btn-accent" onclick="wnBuilderCreateShow()" ${selCount === 0 ? 'disabled' : ''}>${selCount > 0 ? `Create Show with ${selCount} Items` : 'Select Items Below'}</button>
    <button class="btn-sm" onclick="wnBuilderSelectAll()">Select All (${Math.min(suggestions.length, sizeRec.recommended)})</button>
    <button class="btn-sm btn-muted" onclick="wnBuilderClearSelection()">Clear</button>
  </div>`;

  // Suggestions list
  if (suggestions.length === 0) {
    html += `<div style="text-align:center;padding:20px;color:var(--muted)">No suggestions — add more inventory or complete more shows</div>`;
  } else {
    html += `<div class="wn-builder-list">`;
    for (const s of suggestions) {
      const isSelected = _wnBuilderSelected.has(s.item.id);
      html += `<div class="wn-builder-item${isSelected ? ' selected' : ''}" onclick="wnBuilderToggle('${s.item.id}')">
        <div class="wn-builder-check">${isSelected ? '☑' : '☐'}</div>
        <div class="wn-builder-item-info">
          <span class="wn-builder-item-name">${escHtml(s.item.name || 'Untitled')}</span>
          <span class="wn-builder-item-detail">${escHtml(s.item.condition || '')} · ${s.item.price ? fmt(s.item.price) : '—'} · ${s.item.category || ''}</span>
          <span class="wn-builder-item-reason">${escHtml(s.reason)}</span>
        </div>
        <div class="wn-builder-item-score">${s.score.toFixed(1)}</div>
      </div>`;
    }
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// ── Sale Calculator Tab ───────────────────────────────────────────────

function _renderWnCalculatorTab() {
  const price = parseFloat(_wnCalcPrice) || 0;
  const shipping = parseFloat(_wnCalcShipping) || 0;
  const cost = parseFloat(_wnCalcCost) || 0;
  const tax = parseFloat(_wnCalcTax) || 0;

  // Whatnot fees:
  // Commission: 8% on item sale price only (not shipping/tax)
  // Processing: 2.9% + $0.30 on total order value (price + shipping + tax)
  const commission = price * 0.08;
  const orderTotal = price + shipping + tax;
  const processing = (orderTotal * 0.029) + 0.30;
  const totalFees = commission + processing;
  const payout = price + shipping - totalFees;
  const profit = payout - cost;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  const hasInput = price > 0;

  let html = `<div class="wn-calc">
    <div class="wn-calc-form">
      <div class="wn-calc-row">
        <label>Sale Price</label>
        <div class="wn-calc-input-wrap">
          <span class="wn-calc-dollar">$</span>
          <input type="number" min="0" step="0.01" placeholder="0.00" value="${_wnCalcPrice}"
            oninput="wnCalcUpdate('price',this.value)" class="wn-calc-input">
        </div>
      </div>
      <div class="wn-calc-row">
        <label>Shipping Charged</label>
        <div class="wn-calc-input-wrap">
          <span class="wn-calc-dollar">$</span>
          <input type="number" min="0" step="0.01" placeholder="0.00" value="${_wnCalcShipping}"
            oninput="wnCalcUpdate('shipping',this.value)" class="wn-calc-input">
        </div>
      </div>
      <div class="wn-calc-row">
        <label>Item Cost (COGS)</label>
        <div class="wn-calc-input-wrap">
          <span class="wn-calc-dollar">$</span>
          <input type="number" min="0" step="0.01" placeholder="0.00" value="${_wnCalcCost}"
            oninput="wnCalcUpdate('cost',this.value)" class="wn-calc-input">
        </div>
      </div>
      <div class="wn-calc-row">
        <label>Tax Collected</label>
        <div class="wn-calc-input-wrap">
          <span class="wn-calc-dollar">$</span>
          <input type="number" min="0" step="0.01" placeholder="0.00" value="${_wnCalcTax}"
            oninput="wnCalcUpdate('tax',this.value)" class="wn-calc-input">
        </div>
      </div>
    </div>`;

  if (hasInput) {
    html += `<div class="wn-calc-breakdown">
      <div class="wn-calc-section-label">Fee Breakdown</div>
      <div class="wn-calc-line">
        <span>Commission (8% on $${price.toFixed(2)})</span>
        <span class="wn-calc-neg">-$${commission.toFixed(2)}</span>
      </div>
      <div class="wn-calc-line">
        <span>Processing (2.9% + $0.30 on $${orderTotal.toFixed(2)})</span>
        <span class="wn-calc-neg">-$${processing.toFixed(2)}</span>
      </div>
      <div class="wn-calc-line wn-calc-total-line">
        <span>Total Fees</span>
        <span class="wn-calc-neg">-$${totalFees.toFixed(2)}</span>
      </div>

      <div class="wn-calc-divider"></div>

      <div class="wn-calc-section-label">Your Numbers</div>
      <div class="wn-calc-line">
        <span>Payout (sale + shipping − fees)</span>
        <span>$${payout.toFixed(2)}</span>
      </div>
      ${cost > 0 ? `<div class="wn-calc-line">
        <span>Item Cost</span>
        <span class="wn-calc-neg">-$${cost.toFixed(2)}</span>
      </div>` : ''}
      <div class="wn-calc-line wn-calc-profit-line">
        <span>Profit${cost > 0 ? '' : ' (before COGS)'}</span>
        <span class="${profit >= 0 ? 'wn-calc-pos' : 'wn-calc-neg'}">$${profit.toFixed(2)}</span>
      </div>
      ${cost > 0 ? `<div class="wn-calc-line">
        <span>Margin</span>
        <span class="${margin >= 0 ? 'wn-calc-pos' : 'wn-calc-neg'}">${margin.toFixed(1)}%</span>
      </div>` : ''}
    </div>`;
  } else {
    html += `<div class="wn-calc-placeholder">Enter a sale price to see your fee breakdown and estimated profit.</div>`;
  }

  html += `<div class="wn-calc-note">Commission = 8% of sale price only. Processing = 2.9% + $0.30 on total order (price + shipping + tax).</div>`;
  html += `</div>`;
  return html;
}

// ── Whatnot Show Handlers (exposed to window) ────────────────────────────

export function wnCalcUpdate(field, value) {
  if (field === 'price') _wnCalcPrice = value;
  else if (field === 'shipping') _wnCalcShipping = value;
  else if (field === 'cost') _wnCalcCost = value;
  else if (field === 'tax') _wnCalcTax = value;
  renderCrosslistDashboard();
}

export function wnSwitchTab(tab) {
  _wnTab = tab;
  renderCrosslistDashboard();
}

export function wnToggleShow(showId) {
  _wnExpandedShow = _wnExpandedShow === showId ? null : showId;
  _wnShowItemPicker = false;
  renderCrosslistDashboard();
}

export async function wnNewShow() {
  const name = prompt('Show name:');
  if (!name) return;
  const date = prompt('Date (YYYY-MM-DD):', localDate());
  if (!date) return;
  const time = prompt('Time (HH:MM, optional):', '19:00') || '';
  const show = await createShow(name, date, time);
  _wnTab = 'shows';
  _wnExpandedShow = show.id;
  renderCrosslistDashboard();
}

export async function wnDeleteShow(showId) {
  const show = getShow(showId);
  if (!show) return;
  if (!confirm(`Delete show "${show.name}"?`)) return;
  await deleteShow(showId);
  if (_wnExpandedShow === showId) _wnExpandedShow = null;
  renderCrosslistDashboard();
}

export async function wnStartShow(showId) {
  const show = getShow(showId);
  if (!show) return;
  if (!confirm(`Go live with "${show.name}" (${show.items.length} items)?`)) return;
  await startShow(showId);
  _wnExpandedShow = showId;
  renderCrosslistDashboard();
}

export async function wnEndShow(showId) {
  if (!confirm('End this live show?')) return;
  await endShow(showId);
  renderCrosslistDashboard();
}

export async function wnMarkSold(showId, itemId) {
  const item = inv.find(x => x.id === itemId);
  const price = item?.price || 0;
  await markShowItemSold(showId, itemId, price);
  refresh();
  renderCrosslistDashboard();
}

export async function wnMoveItem(showId, itemId, direction) {
  await moveShowItem(showId, itemId, direction);
  renderCrosslistDashboard();
}

export async function wnRemoveItem(showId, itemId) {
  await removeItemFromShow(showId, itemId);
  renderCrosslistDashboard();
}

export function wnOpenItemPicker(showId) {
  _wnExpandedShow = showId;
  _wnShowItemPicker = true;
  renderCrosslistDashboard();
}

export function wnCloseItemPicker() {
  _wnShowItemPicker = false;
  renderCrosslistDashboard();
}

export async function wnPickItem(showId, itemId) {
  await addItemToShow(showId, itemId);
  renderCrosslistDashboard();
}

export async function wnCopyPrep(showId) {
  await copyShowPrepList(showId);
}

export async function wnEditItemNote(showId, itemId) {
  const existing = getItemNote(showId, itemId);
  const note = prompt('Talking points for this item:', existing);
  if (note === null) return; // cancelled
  await setItemNote(showId, itemId, note);
  renderCrosslistDashboard();
}

export async function wnCloneShow(showId) {
  const date = prompt('Date for cloned show (YYYY-MM-DD):', localDate());
  if (!date) return;
  const newShow = await cloneShow(showId, date);
  if (newShow) {
    _wnTab = 'shows';
    _wnExpandedShow = newShow.id;
    renderCrosslistDashboard();
  }
}

export async function wnSetViewerPeak(showId, val) {
  await setShowViewerPeak(showId, val);
}

export async function wnSetExpenses(showId, val) {
  await setShowExpenses(showId, val);
}

export function wnPrintRunSheet(showId) {
  const html = getShowRunSheet(showId);
  if (!html) return;
  const w = window.open('', '_blank', 'width=800,height=600');
  w.document.write(`<!DOCTYPE html><html><head><title>Show Run Sheet</title>
    <style>body{font-family:system-ui,sans-serif;padding:20px;font-size:14px}
    h2{margin:0 0 4px}p{color:#666;margin:0 0 16px}
    table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
    th{background:#f5f5f5;font-size:12px}td{font-size:13px}
    @media print{body{padding:0}}</style>
  </head><body>${html}</body></html>`);
  w.document.close();
  w.print();
}

export function wnExportShowCSV(showId) {
  // Delegate to csv-templates if wired, else simple fallback
  if (window.exportShowResultsCSV) {
    window.exportShowResultsCSV(showId);
  } else {
    toast('CSV export loading…');
  }
}

// Smart Builder handlers
export function wnBuilderToggle(itemId) {
  if (_wnBuilderSelected.has(itemId)) _wnBuilderSelected.delete(itemId);
  else _wnBuilderSelected.add(itemId);
  renderCrosslistDashboard();
}

export function wnBuilderSelectAll() {
  const suggestions = suggestShowItems(30);
  const size = suggestShowSize();
  _wnBuilderSelected.clear();
  suggestions.slice(0, size.recommended).forEach(s => _wnBuilderSelected.add(s.item.id));
  renderCrosslistDashboard();
}

export function wnBuilderClearSelection() {
  _wnBuilderSelected.clear();
  renderCrosslistDashboard();
}

export async function wnBuilderCreateShow() {
  if (_wnBuilderSelected.size === 0) { toast('No items selected', true); return; }
  const name = prompt('Show name:', `Smart Show - ${new Date().toLocaleDateString()}`);
  if (!name) return;
  const date = prompt('Date (YYYY-MM-DD):', localDate());
  if (!date) return;
  const time = prompt('Time (HH:MM):', '19:00') || '';
  const show = await createShow(name, date, time, '', { items: [..._wnBuilderSelected] });
  _wnBuilderSelected.clear();
  _wnTab = 'shows';
  _wnExpandedShow = show.id;
  renderCrosslistDashboard();
  toast(`Show created with ${show.items.length} items`);
}

// ── eBay INTEGRATION PANEL ───────────────────────────────────────────────

function _renderEBayPanel() {
  const connected = isEBayConnected();
  const username = getEBayUsername();
  const syncing = isEBaySyncing();
  const lastSync = getLastEBaySyncTime();
  const lastSyncLabel = lastSync
    ? new Date(lastSync).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Never';

  // If status hasn't been verified from server yet, show loading and trigger check
  if (!connected && !isEBayStatusVerified()) {
    checkEBayStatus(); // non-blocking — will re-render dashboard when done
    return `<div class="ebay-panel">
      <div class="ebay-panel-left">
        <div class="ebay-panel-status">
          <span class="ebay-dot"></span>
          <strong>eBay</strong>
          <span class="ebay-user" style="color:var(--muted)">Checking connection…</span>
        </div>
        <div class="ebay-panel-meta">Verifying eBay account status</div>
      </div>
    </div>`;
  }

  if (connected) {
    return `<div class="ebay-panel ebay-connected">
      <div class="ebay-panel-left">
        <div class="ebay-panel-status">
          <span class="ebay-dot ebay-dot-on"></span>
          <strong>eBay Connected</strong>
          ${username ? `<span class="ebay-user">(${escHtml(username)})</span>` : ''}
        </div>
        <div class="ebay-panel-meta">Last sync: ${escHtml(lastSyncLabel)}</div>
      </div>
      <div class="ebay-panel-actions">
        <button class="btn-sm btn-accent" onclick="clEBaySync()" ${syncing ? 'disabled' : ''}>
          ${syncing ? '⟳ Syncing…' : '⟳ Sync Now'}
        </button>
        <button class="btn-sm btn-muted" onclick="clEBayDisconnect()">Disconnect</button>
      </div>
    </div>`;
  }

  return `<div class="ebay-panel">
    <div class="ebay-panel-left">
      <div class="ebay-panel-status">
        <span class="ebay-dot"></span>
        <strong>eBay</strong>
        <span class="ebay-user" style="color:var(--muted)">Not connected</span>
      </div>
      <div class="ebay-panel-meta">Connect to list items, sync status, and track sales directly</div>
    </div>
    <div class="ebay-panel-actions">
      <button class="btn-sm btn-accent" onclick="clEBayConnect()">Connect eBay Account</button>
    </div>
  </div>`;
}

// ── eBay ACTION HANDLERS (exposed to window in main.js) ──────────────────

export function clEBayConnect() {
  connectEBay(false); // production mode
}

export function clEBayDisconnect() {
  if (!confirm('Disconnect your eBay account? You can reconnect anytime.')) return;
  disconnectEBay();
}

export async function clEBaySync() {
  toast('Syncing eBay listings…');
  renderCrosslistDashboard(); // Show syncing state
  try {
    const result = await pullEBayListings();
    toast(`eBay sync complete — ${result.matched} matched, ${result.updated} updated`);
  } catch (e) {
    toast(`eBay sync error: ${e.message}`, true);
  }
  renderCrosslistDashboard();
}

export async function clPushToEBay(itemId) {
  toast('Pushing item to eBay…');
  try {
    const pushResult = await pushItemToEBay(itemId);
    if (pushResult.success) {
      // Auto-publish after pushing to inventory
      toast('Publishing eBay listing…');
      try {
        const pubResult = await publishEBayListing(itemId);
        if (pubResult.success) {
          renderCrosslistDashboard();
          return;
        }
      } catch (pubErr) {
        // Publish failed but push succeeded — show draft with Publish button
        toast(`Pushed to eBay inventory (draft). ${pubErr.message}`, true);
      }
      renderCrosslistDashboard();
    }
  } catch (e) {
    toast(`eBay push error: ${e.message}`, true);
  }
}

export async function clPublishOnEBay(itemId) {
  toast('Publishing eBay listing…');
  try {
    const result = await publishEBayListing(itemId);
    if (result.success) {
      refresh();
      renderCrosslistDashboard();
    }
  } catch (e) {
    toast(`eBay publish error: ${e.message}`, true);
  }
}

export async function clEndEBayListing(itemId) {
  if (!confirm('End this eBay listing?')) return;
  try {
    const result = await endEBayListing(itemId);
    if (result.success) {
      refresh();
      renderCrosslistDashboard();
    }
  } catch (e) {
    toast(`eBay end listing error: ${e.message}`, true);
  }
}
