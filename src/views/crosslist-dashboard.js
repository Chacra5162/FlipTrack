/**
 * crosslist-dashboard.js — Crosslisting Dashboard View
 * Shows listing status matrix, expiring/expired listings, and bulk crosslist tools.
 */

import { inv, sales, save, refresh, markDirty, getInvItem, getSalesForItem } from '../data/store.js';
import { fmt, escHtml, escAttr, ds, uid, localDate} from '../utils/format.js';
import { toast, appConfirm, appPrompt } from '../utils/dom.js';
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
import { pullEBayListings, pushItemToEBay, publishEBayListing, endEBayListing, isEBaySyncing, getLastEBaySyncTime, resyncEBayOrders } from '../features/ebay-sync.js';
import { isEtsyConnected, getEtsyShopName, connectEtsy, disconnectEtsy } from '../features/etsy-auth.js';
import {
  pullEtsyListings, pushItemToEtsy, deactivateEtsyListing, renewEtsyListing, isEtsySyncing, getLastEtsySyncTime,
  pushEtsyQuantity, syncAllEtsyQuantities, pushEtsyPhotos,
  fetchEtsyShopStats, fetchEtsyListingStats, getEtsyAnalyticsSummary,
  fetchEtsyReviews, getEtsyReviewSummary,
  fetchEtsyReceiptsPending, pushEtsyTracking, getEtsyCarriers,
  pushEtsyPrice, pushEtsyPriceBulk,
  fetchEtsyListingTags, suggestEtsyTags, pushEtsyTags,
  calcEtsyFees, syncEtsyExpenses,
  getEtsyTaxonomies, getEtsyShippingProfiles
} from '../features/etsy-sync.js';
import { copyPlatformListing } from '../features/ai-listing.js';
import { renderWhatnotPanel, setWnRerender } from './whatnot-dashboard.js';

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
let _clTab = 'overview'; // 'overview', 'matrix', 'templates'
let _clShowAllSingle = false;

// ── RENDER ────────────────────────────────────────────────────────────────

/** Active inventory: in stock AND not fully sold */
function _activeInv() {
  return inv.filter(i => {
    // Sold out with sales recorded — not active
    if ((i.qty || 0) <= 0 && getSalesForItem(i.id).length > 0) return false;
    // Zero qty with no sales — keep (could be out of stock, not sold)
    if ((i.qty || 0) <= 0) return false;
    // All platforms marked sold — not active
    const plats = getPlatforms(i);
    if (plats.length > 0) {
      const ps = i.platformStatus || {};
      if (plats.every(p => ps[p] === 'sold' || ps[p] === 'sold-elsewhere')) return false;
    }
    return true;
  });
}

export function renderCrosslistDashboard() {
  const container = document.getElementById('crosslistContent');
  if (!container) return;

  // Wire up Whatnot rerender callback
  setWnRerender(renderCrosslistDashboard);

  // Check for newly expired listings
  checkExpiredListings();

  const inStock = _activeInv();
  const stats = getCrosslistStats(inStock);
  const expiring = getExpiringListings(inStock, 7);
  const expired = getExpiredListings(inStock);

  let html = '';

  // ── CONNECTION PANELS ──
  html += _renderEBayPanel();
  html += _renderEtsyPanel();
  html += renderWhatnotPanel();

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
          <span class="cl-card-name" onclick="openDrawer('${escAttr(item.id)}')">${escHtml(item.name)}</span>
          <span class="cl-card-days">${daysLeft}d left</span>
        </div>
        <div class="cl-card-plat">${escHtml(platform)}</div>
        <div class="cl-card-actions">
          <button class="btn-sm btn-accent" onclick="clRelistItem('${escAttr(item.id)}','${escAttr(platform)}')">Relist</button>
          <button class="btn-sm btn-muted" onclick="clOpenLink('${escAttr(platform)}','${escAttr(item.id)}')">Open →</button>
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
          <span class="cl-card-name" onclick="openDrawer('${escAttr(item.id)}')">${escHtml(item.name)}</span>
          <span class="cl-card-days">${ago}d ago</span>
        </div>
        <div class="cl-card-plat">${escHtml(platform)}</div>
        <div class="cl-card-actions">
          <button class="btn-sm btn-accent" onclick="clRelistItem('${escAttr(item.id)}','${escAttr(platform)}')">Relist</button>
          <button class="btn-sm btn-danger" onclick="clDelistItem('${escAttr(item.id)}','${escAttr(platform)}')">Delist</button>
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
          <span class="cl-card-name" onclick="openDrawer('${escAttr(item.id)}')">${escHtml(item.name)}</span>
          <span class="cl-card-days">${fmt(item.price || 0)}</span>
        </div>
        <div class="cl-card-plat" style="color:var(--muted)">No platforms assigned</div>
        <div class="cl-card-actions">
          <button class="btn-sm btn-accent" onclick="openDrawer('${escAttr(item.id)}')">Edit & List</button>
        </div>
      </div>`;
    }
    html += `</div></div>`;
  }

  // ── SINGLE PLATFORM ──
  if (stats.itemsSinglePlatform > 0) {
    const allSingle = inStock.filter(i => getPlatforms(i).length === 1);
    const showAll = _clShowAllSingle;
    const single = showAll ? allSingle : allSingle.slice(0, 6);
    html += `<div class="cl-section">
      <h3 class="cl-section-title" style="color:var(--accent3)">☝ Single Platform (${stats.itemsSinglePlatform})</h3>
      <p style="color:var(--muted);font-size:12px;margin-bottom:8px">These items could reach more buyers if crosslisted</p>
      <div class="cl-cards">`;
    for (const item of single) {
      const p = getPlatforms(item)[0];
      html += `<div class="cl-card">
        <div class="cl-card-header">
          <span class="cl-card-name" onclick="openDrawer('${escAttr(item.id)}')">${escHtml(item.name)}</span>
          <span class="cl-card-days">${escHtml(p)}</span>
        </div>
        <div class="cl-card-actions">
          <button class="btn-sm btn-accent" onclick="openDrawer('${escAttr(item.id)}')">Add Platforms</button>
        </div>
      </div>`;
    }
    html += `</div>`;
    if (allSingle.length > 6) {
      html += `<button class="btn-secondary" onclick="clToggleAllSingle()" style="margin-top:8px;width:100%;font-size:11px">${showAll ? 'Show Less' : `Show All ${allSingle.length} Items`}</button>`;
    }
    html += `</div>`;
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
      <div class="cl-matrix-header" onclick="openDrawer('${escAttr(item.id)}')">
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
      const ebayFormatTag = (p === 'eBay' && item.ebayListingFormat)
        ? (item.ebayListingFormat === 'AUCTION' ? ' · Auction' : ' · Fixed Price')
        : '';
      const ebayStatusLabel = needsEbayPush ? 'Not on eBay yet'
        : needsEbayPublish ? 'Draft — not published'
        : (STATUS_LABELS[st] || st) + ebayFormatTag;
      // AI Copy for platforms without direct API, or API platforms when not connected
      const noApiPlats = ['Poshmark','Mercari','Depop','Grailed','Facebook Marketplace','StockX','GOAT','Vinted'];
      const showAICopy = noApiPlats.includes(p) || (p === 'eBay' && !isEBayConnected());
      const hasCached = item.crosslistCache?.[p];

      html += `<div class="cl-plat-row">
          <div class="cl-plat-info">
            <span class="cl-plat-dot" style="background:${needsEbayPush || needsEbayPublish ? 'var(--warn)' : (STATUS_COLORS[st] || 'var(--muted)')}"></span>
            <span class="cl-plat-name">${escHtml(p)}</span>
            <span class="cl-plat-status">${escHtml(ebayStatusLabel)}</span>
            ${expiryLabel}
          </div>
          <div class="cl-plat-actions">
            ${needsEbayPush ? `<button class="btn-xs btn-accent" onclick="clPushToEBay('${escAttr(item.id)}')">List on eBay</button>` : ''}
            ${needsEbayPublish ? `<button class="btn-xs btn-accent" onclick="clPublishOnEBay('${escAttr(item.id)}')">Publish</button>` : ''}
            ${showAICopy ? `<button class="btn-xs btn-accent" onclick="clAICopy('${escAttr(item.id)}','${escAttr(p)}')" title="Generate AI listing optimized for ${escHtml(p)} and copy to clipboard">✨ ${hasCached ? 'Copy' : 'AI Copy'}</button>` : ''}
            <button class="btn-xs" onclick="clCycleStatus('${escAttr(item.id)}','${escAttr(p)}')" title="Change status">⟳</button>
            <button class="btn-xs" onclick="clCopyListing('${escAttr(item.id)}')" title="Copy listing text">📋</button>
            <button class="btn-xs" onclick="clOpenLink('${escAttr(p)}','${escAttr(item.id)}')" title="Open platform">↗</button>
            ${st === 'expired' ? `<button class="btn-xs btn-accent" onclick="clRelistItem('${escAttr(item.id)}','${escAttr(p)}')">Relist</button>` : ''}
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
          <button class="btn-xs btn-accent" onclick="clPushToEBay('${escAttr(item.id)}')">List on eBay</button>
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
          <button class="btn-xs btn-etsy" onclick="clPushToEtsy('${escAttr(item.id)}')">List on Etsy</button>
        </div>
      </div>`;
    }

    if (!plats.length && !isEBayConnected() && !isEtsyConnected()) {
      html += `<div class="cl-plat-row" style="color:var(--muted);font-style:italic">No platforms — <span onclick="openDrawer('${escAttr(item.id)}')" style="color:var(--accent);cursor:pointer">add some</span></div>`;
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
          ${t.isDefault ? '<span class="cl-template-badge">Default</span>' : `<button class="btn-xs btn-danger" onclick="clDeleteTemplate('${escAttr(t.id)}')">✕</button>`}
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

export function clToggleAllSingle() { _clShowAllSingle = !_clShowAllSingle; renderCrosslistDashboard(); }
export function clSwitchTab(tab) { _clTab = tab; _clPage = 0; renderCrosslistDashboard(); }
let _clSearchTimer = null;
export function clSetSearch(v) { _clSearch = v || ''; _clPage = 0; clearTimeout(_clSearchTimer); _clSearchTimer = setTimeout(renderCrosslistDashboard, 200); }
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
  const item = getInvItem(itemId);
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
  const item = getInvItem(itemId);
  if (!item) return;
  const url = generateListingLink(platform, item);
  window.open(url, '_blank');
}

export function clCopyListing(itemId) {
  const item = getInvItem(itemId);
  if (!item) return;
  copyListingText(item);
}

export async function clBulkRelistExpired() {
  const inStock = _activeInv();
  const expired = getExpiredListings(inStock);
  if (!expired.length) { toast('No expired listings to relist'); return; }
  if (!await appConfirm({ title: 'Relist Expired', message: `Relist ${expired.length} expired listing(s)?` })) return;
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

export async function clDeleteTemplate(id) {
  if (!await appConfirm({ title: 'Delete Template', message: 'Delete this template?', danger: true })) return;
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
    const item = getInvItem(_etsyTagEditItem);
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
            ${suggestions.slice(0, 13 - currentTags.length).map(t => `<span class="etsy-tag-suggest" onclick="clEtsyAddTag('${escAttr(_etsyTagEditItem)}','${escAttr(t)}')">${escHtml(t)} +</span>`).join('')}
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

export async function clEtsyDisconnect() {
  if (!await appConfirm({ title: 'Disconnect Etsy', message: 'Disconnect your Etsy shop? You can reconnect anytime.', danger: true })) return;
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

// Cached Etsy settings so user doesn't re-select every time
let _etsyTaxCache = null;
let _etsyShipCache = null;
let _lastEtsyTaxId = null;
let _lastEtsyShipId = null;

export async function clPushToEtsy(itemId) {
  const ov = document.getElementById('etsyListOv');
  if (!ov) {
    // Fallback: push without settings (creates draft)
    const result = await pushItemToEtsy(itemId);
    if (result.success) renderCrosslistDashboard();
    return;
  }

  // Load taxonomies and shipping profiles (cached after first load)
  const taxSel = document.getElementById('etsyTaxonomySelect');
  const shipSel = document.getElementById('etsyShipProfileSelect');

  if (!_etsyTaxCache) {
    taxSel.innerHTML = '<option value="">Loading categories...</option>';
    try {
      _etsyTaxCache = await getEtsyTaxonomies();
      taxSel.innerHTML = '<option value="">-- Select category --</option>' +
        _etsyTaxCache.map(t => `<option value="${t.id}">${escHtml(t.name)}</option>`).join('');
    } catch { taxSel.innerHTML = '<option value="">Failed to load</option>'; }
  }
  if (_lastEtsyTaxId) taxSel.value = _lastEtsyTaxId;

  if (!_etsyShipCache) {
    shipSel.innerHTML = '<option value="">Loading profiles...</option>';
    try {
      _etsyShipCache = await getEtsyShippingProfiles();
      shipSel.innerHTML = '<option value="">-- Select profile --</option>' +
        _etsyShipCache.map(p => `<option value="${p.shipping_profile_id}">${escHtml(p.title)}</option>`).join('');
    } catch { shipSel.innerHTML = '<option value="">Failed to load</option>'; }
  }
  if (_lastEtsyShipId) shipSel.value = _lastEtsyShipId;

  // Show modal and wait for user action
  ov.classList.add('on');

  return new Promise(resolve => {
    const okBtn = document.getElementById('etsyListOk');
    const cancelBtn = document.getElementById('etsyListCancel');
    const cleanup = () => { ov.classList.remove('on'); okBtn.removeEventListener('click', onOk); cancelBtn.removeEventListener('click', onCancel); };

    const onOk = async () => {
      const taxonomyId = parseInt(taxSel.value, 10) || null;
      const shippingProfileId = parseInt(shipSel.value, 10) || null;
      // Remember selections for next push
      _lastEtsyTaxId = taxSel.value;
      _lastEtsyShipId = shipSel.value;
      cleanup();

      const result = await pushItemToEtsy(itemId, { taxonomyId, shippingProfileId });
      if (result.success) renderCrosslistDashboard();
      resolve(result);
    };

    const onCancel = () => { cleanup(); resolve({ success: false }); };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
  });
}

export async function clDeactivateEtsyListing(itemId) {
  if (!await appConfirm({ title: 'Deactivate Listing', message: 'Deactivate this Etsy listing?', danger: true })) return;
  const result = await deactivateEtsyListing(itemId);
  if (result.success) {
    refresh();
    renderCrosslistDashboard();
  }
}

export async function clRenewEtsyListing(itemId) {
  if (!await appConfirm({ title: 'Renew Listing', message: 'Renew this Etsy listing? ($0.20 fee applies)' })) return;
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
  const item = getInvItem(itemId);
  if (!item || !item.tags) return;
  item.tags.splice(tagIndex, 1);
  markDirty('inv', itemId);
  save();
  renderCrosslistDashboard();
}

export function clEtsyAddTag(itemId, tag) {
  const item = getInvItem(itemId);
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
    const item = getInvItem(itemId);
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
  if (count === 0) toast('No expired or expiring listings to relist');
  renderCrosslistDashboard();
}

export async function clBulkPrice() {
  const category = document.getElementById('clBulkCat')?.value || '';
  const platform = document.getElementById('clBulkPlat')?.value || '';
  const adjustType = document.getElementById('clBulkType')?.value || 'percent';
  const adjustValue = parseFloat(document.getElementById('clBulkVal')?.value) || 0;
  const minDaysListed = parseInt(document.getElementById('clBulkMinDays')?.value) || 0;

  if (!adjustValue) { toast('Enter a price adjustment value', true); return; }
  const desc = adjustType === 'percent' ? `${adjustValue > 0 ? '+' : ''}${adjustValue}%` : `${adjustValue > 0 ? '+' : ''}$${adjustValue}`;
  if (!await appConfirm({ title: 'Bulk Price Adjust', message: `Apply ${desc} to matching items?` })) return;

  bulkPriceAdjust({ category, platform, adjustType, adjustValue, minDaysListed });
  renderCrosslistDashboard();
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
        <button class="btn-sm btn-muted" onclick="clEBayResyncOrders()" title="Re-check eBay orders from the last 7 days for missed sales">Resync Orders</button>
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

export async function clEBayDisconnect() {
  if (!await appConfirm({ title: 'Disconnect eBay', message: 'Disconnect your eBay account? You can reconnect anytime.', danger: true })) return;
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

export async function clEBayResyncOrders() {
  await resyncEBayOrders(7);
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
  if (!await appConfirm({ title: 'End Listing', message: 'End this eBay listing?', danger: true })) return;
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
