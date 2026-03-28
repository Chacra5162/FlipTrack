/**
 * whatnot-dashboard.js — Whatnot Shows Panel for Crosslist Dashboard
 * Extracted from crosslist-dashboard.js for bundle size optimization.
 */

import { inv, sales, getInvItem } from '../data/store.js';
import { fmt, escHtml, escAttr, ds, localDate } from '../utils/format.js';
import { toast, appConfirm, appPrompt } from '../utils/dom.js';
import {
  getUpcomingShows, getPastShows, getShow, createShow, deleteShow,
  addItemToShow, addItemsToShow, removeItemFromShow, moveShowItem,
  startShow, endShow, markShowItemSold, copyShowPrepList, getLiveShow,
  getEndedShows, setItemNote, getItemNote, cloneShow, setShowViewerPeak,
  setShowExpenses, getItemShowHistory,
  getShowRunSheet,
  addLot, removeLot, getShowLots,
  setShowRevenueGoal, getShowGoalProgress,
  addGiveaway, getShowGiveaways, getTotalGiveawayCost,
  setItemBinLocation, getLiveShowStats,
  getGlobalShippingQueue, markItemShipped,
  getShowRecapText
} from '../features/whatnot-show.js';
import {
  getShowMetrics, calcBestShowDay, calcBestShowTime, calcCategoryPerformance,
  calcShowTrends, calcTopPerformingItems, calcWorstPerformingItems, calcOverallStats,
  suggestShowItems, suggestShowSize, suggestCategoryMix,
  compareShows, calcCategoryRotation, suggestShowBids, calcGoalStats,
  calcInventoryActions
} from '../features/whatnot-analytics.js';

// ── STATE ─────────────────────────────────────────────────────────────────
let _wnExpandedShow = null;
let _wnShowItemPicker = false;
let _wnTab = 'shows';
let _wnCalcPrice = '';
let _wnCalcShipping = '';
let _wnCalcCost = '';
let _wnCalcTax = '';
let _wnBuilderSelected = new Set();
let _wnCompareA = '';
let _wnCompareB = '';
let _wnLotPickerShow = null;
let _wnLotPickerItems = new Set();
let _wnShipQueueShowId = null;
let _wnPickerSearch = '';
let _wnPickerLimit = 50;
let _wnShowItemsExpanded = new Set();

let _rerender = () => {};

/** Set the rerender callback (called by crosslist-dashboard after import) */
export function setWnRerender(fn) { _rerender = fn; }

// ── WHATNOT SHOWS PANEL ─────────────────────────────────────────────────────

export function renderWhatnotPanel() {
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
      <button class="wn-tab${_wnTab === 'live' ? ' active' : ''}" onclick="wnSwitchTab('live')"${liveShow ? '' : ' disabled title="Go live first"'}>Live${liveShow ? ' 🔴' : ''}</button>
      <button class="wn-tab${_wnTab === 'analytics' ? ' active' : ''}" onclick="wnSwitchTab('analytics')">Analytics</button>
      <button class="wn-tab${_wnTab === 'builder' ? ' active' : ''}" onclick="wnSwitchTab('builder')">Smart Builder</button>
      <button class="wn-tab${_wnTab === 'pricing' ? ' active' : ''}" onclick="wnSwitchTab('pricing')">Pricing</button>
      <button class="wn-tab${_wnTab === 'shipping' ? ' active' : ''}" onclick="wnSwitchTab('shipping')">Shipping</button>
      <button class="wn-tab${_wnTab === 'calculator' ? ' active' : ''}" onclick="wnSwitchTab('calculator')">Calculator</button>
    </div>`;

  if (_wnTab === 'shows') html += _renderWnShowsTab();
  else if (_wnTab === 'live') html += _renderWnLiveDashTab();
  else if (_wnTab === 'analytics') html += _renderWnAnalyticsTab();
  else if (_wnTab === 'builder') html += _renderWnBuilderTab();
  else if (_wnTab === 'pricing') html += _renderWnPricingTab();
  else if (_wnTab === 'shipping') html += _renderWnShippingTab();
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
        <div class="wn-show-header" onclick="wnToggleShow('${escAttr(show.id)}')">
          <div class="wn-show-info">
            <span class="wn-show-name">${escHtml(show.name)}</span>
            ${show.recurring ? '<span class="wn-recurring-badge">↻</span>' : ''}
            <span class="wn-show-date">${escHtml(dateLabel)}${timeLabel ? ' @ ' + escHtml(timeLabel) : ''}</span>
            <span class="wn-show-count">${show.items.length} item${show.items.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="wn-show-actions" onclick="event.stopPropagation()">
            ${isLive
              ? `<button class="btn-xs btn-danger" onclick="wnEndShow('${escAttr(show.id)}')">End Show</button>`
              : `<button class="btn-xs btn-accent" onclick="wnStartShow('${escAttr(show.id)}')"${show.items.length === 0 ? ' disabled title="Add items first"' : ''}>Go Live</button>`
            }
            <button class="btn-xs" onclick="wnCopyPrep('${escAttr(show.id)}')" title="Copy prep list">📋</button>
            <button class="btn-xs" onclick="wnPrintRunSheet('${escAttr(show.id)}')" title="Print run sheet">🖨</button>
            ${!isLive ? `<button class="btn-xs btn-muted" onclick="wnDeleteShow('${escAttr(show.id)}')" title="Delete show">✕</button>` : ''}
          </div>
        </div>`;

      // Goal progress bar
      const goalProg = getShowGoalProgress(show.id);
      if (goalProg) {
        const pctW = Math.min(100, goalProg.progress * 100).toFixed(0);
        html += `<div class="wn-goal-bar">
          <div class="wn-goal-fill${goalProg.hit ? ' wn-goal-hit' : ''}" style="width:${pctW}%"></div>
          <span class="wn-goal-text">${fmt(goalProg.revenue)} / ${fmt(goalProg.goal)} goal${goalProg.hit ? ' — HIT!' : ''}</span>
        </div>`;
      }

      if (expanded) {
        html += `<div class="wn-show-items">`;
        // Viewer count, expenses, and goal for live/prep shows
        if (isLive || show.status === 'prep') {
          html += `<div class="wn-live-controls">`;
          if (isLive) html += `<label class="wn-viewer-input">Viewers: <input type="number" min="0" value="${show.viewerPeak || ''}" placeholder="Peak" onchange="wnSetViewerPeak('${show.id}',this.value)" style="width:60px"></label>`;
          html += `<label class="wn-viewer-input">Goal: $<input type="number" min="0" step="1" value="${show.revenueGoal || ''}" placeholder="Revenue goal" onchange="wnSetGoal('${show.id}',this.value)" style="width:80px"></label>`;
          html += `</div>`;
        }
        if (show.items.length === 0) {
          html += `<div class="wn-show-empty">No items yet — add items to start your show prep</div>`;
        }
        const showItemLimit = _wnShowItemsExpanded.has(show.id) ? show.items.length : 25;
        const visibleItems = show.items.slice(0, showItemLimit);
        visibleItems.forEach((itemId, i) => {
          const item = getInvItem(itemId);
          if (!item) return;
          const imgUrl = (item.images && item.images[0]) || '';
          const note = getItemNote(show.id, itemId);
          const isSold = show.soldItems?.[itemId];
          html += `<div class="wn-show-item${isSold ? ' wn-item-sold' : ''}">
            <span class="wn-item-num">${i + 1}</span>
            ${imgUrl ? `<img class="wn-item-thumb" src="${escHtml(imgUrl)}" alt="">` : `<span class="wn-item-thumb wn-item-nophoto">📦</span>`}
            <div class="wn-item-info">
              <span class="wn-item-name">${escHtml(item.name || 'Untitled')}${isSold ? ' <span class="wn-sold-tag">SOLD</span>' : ''}</span>
              <span class="wn-item-detail">${escHtml(item.condition || '')} ${item.price ? fmt(item.price) : ''}${item.binLocation ? ` · 📍${escHtml(item.binLocation)}` : ''}</span>
              ${note ? `<span class="wn-item-note-preview" title="${escHtml(note)}">💬 ${escHtml(note.slice(0, 40))}${note.length > 40 ? '…' : ''}</span>` : ''}
            </div>
            <div class="wn-item-actions">
              ${isLive && !isSold ? `<button class="btn-xs btn-accent" onclick="wnMarkSold('${escAttr(show.id)}','${escAttr(itemId)}')">Sold</button>` : ''}
              ${isLive && !isSold ? `<button class="btn-xs btn-warn" onclick="wnGiveaway('${escAttr(show.id)}','${escAttr(itemId)}')" title="Mark as giveaway">🎁</button>` : ''}
              <button class="btn-xs" onclick="wnEditItemNote('${escAttr(show.id)}','${escAttr(itemId)}')" title="Talking points">💬</button>
              <button class="btn-xs" onclick="wnEditBinLoc('${escAttr(itemId)}')" title="Bin/shelf location">📍</button>
              <button class="btn-xs" onclick="wnMoveItem('${escAttr(show.id)}','${escAttr(itemId)}','up')" title="Move up"${i === 0 ? ' disabled' : ''}>▲</button>
              <button class="btn-xs" onclick="wnMoveItem('${escAttr(show.id)}','${escAttr(itemId)}','down')" title="Move down"${i === show.items.length - 1 ? ' disabled' : ''}>▼</button>
              <button class="btn-xs btn-muted" onclick="wnRemoveItem('${escAttr(show.id)}','${escAttr(itemId)}')" title="Remove">✕</button>
            </div>
          </div>`;
        });
        if (show.items.length > 25 && !_wnShowItemsExpanded.has(show.id)) {
          const remaining = show.items.length - 25;
          html += `<div style="text-align:center;padding:6px">
            <button class="btn-sm" onclick="wnShowAllItems('${escAttr(show.id)}')">Show all ${show.items.length} items (${remaining} more)</button>
          </div>`;
        }
        // Lots section
        const lots = getShowLots(show.id);
        if (lots.length > 0 || !isLive) {
          html += `<div class="wn-lots-section">
            <div class="wn-section-title" style="margin-top:8px">Lots (${lots.length})</div>`;
          for (const lot of lots) {
            html += `<div class="wn-lot-card">
              <strong>${escHtml(lot.name)}</strong>
              <span>${lot.items.length} items · Start: ${fmt(lot.startingBid)} · Value: ${fmt(lot.totalValue)}</span>
              <button class="btn-xs btn-muted" onclick="wnRemoveLot('${escAttr(show.id)}','${escAttr(lot.id)}')" title="Remove lot">✕</button>
            </div>`;
          }
          if (!isLive) html += `<button class="btn-xs" onclick="wnCreateLot('${escAttr(show.id)}')">+ Create Lot</button>`;
          html += `</div>`;
        }

        // Giveaways
        const giveaways = getShowGiveaways(show.id);
        if (giveaways.length > 0) {
          html += `<div class="wn-giveaway-section">
            <div class="wn-section-title">Giveaways (${giveaways.length}) · ${fmt(getTotalGiveawayCost(show.id))} cost</div>`;
          for (const g of giveaways) {
            html += `<div class="wn-giveaway-row">🎁 ${escHtml(g.item.name || '')} — ${escHtml(g.reason)} (${fmt(g.cost)})</div>`;
          }
          html += `</div>`;
        }

        html += `<div class="wn-show-add-row">
          <button class="btn-sm btn-accent" onclick="wnOpenItemPicker('${escAttr(show.id)}')">+ Add Items</button>
          <label class="wn-expense-input">Expenses: $<input type="number" min="0" step="0.01" value="${show.showExpenses || ''}" placeholder="0" onchange="wnSetExpenses('${escAttr(show.id)}',this.value)" style="width:60px"></label>
        </div>`;

        if (_wnShowItemPicker) {
          const allAvailable = inv.filter(x =>
            (x.qty || 0) > 0 && !show.items.includes(x.id)
          );
          const filtered = _wnPickerSearch
            ? allAvailable.filter(x => (x.name || '').toLowerCase().includes(_wnPickerSearch.toLowerCase()))
            : allAvailable;
          const visible = filtered.slice(0, _wnPickerLimit);
          const remaining = filtered.length - visible.length;
          html += `<div class="wn-item-picker">
            <div class="wn-picker-header">
              <strong>Select items to add (${filtered.length})</strong>
              <button class="btn-xs btn-muted" onclick="wnCloseItemPicker()">Done</button>
            </div>
            <input type="text" placeholder="Search items..." value="${escAttr(_wnPickerSearch)}" oninput="wnPickerSearch(this.value)" style="width:100%;padding:6px 8px;margin-bottom:6px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--fg);font-family:inherit;font-size:13px">
            <div class="wn-picker-list">`;
          if (filtered.length === 0) {
            html += `<div class="wn-picker-empty">${_wnPickerSearch ? 'No items match your search' : 'All in-stock items are already in this show'}</div>`;
          }
          for (const item of visible) {
            const showHist = getItemShowHistory(item.id);
            const histLabel = showHist.length ? ` (${showHist.filter(h => h.wasSold).length}/${showHist.length} shows sold)` : '';
            html += `<div class="wn-picker-item" onclick="wnPickItem('${escAttr(show.id)}','${escAttr(item.id)}')"
              <span class="wn-picker-name">${escHtml(item.name || 'Untitled')}${histLabel}</span>
              <span class="wn-picker-price">${item.price ? fmt(item.price) : ''}</span>
            </div>`;
          }
          if (remaining > 0) {
            html += `<div style="text-align:center;padding:8px">
              <button class="btn-sm" onclick="wnPickerShowMore()">Show more (${remaining} remaining)</button>
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
          <button class="btn-xs" onclick="wnCopyRecap('${escAttr(s.id)}')" title="Copy show recap for sharing">📣</button>
          <button class="btn-xs" onclick="wnCloneShow('${escAttr(s.id)}')" title="Clone as new show">↻ Clone</button>
          <button class="btn-xs" onclick="wnExportShowCSV('${escAttr(s.id)}')" title="Export results CSV">📊</button>
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

  // Goal Stats
  const goalStats = calcGoalStats();
  if (goalStats) {
    html += `<div class="wn-section-title">Revenue Goal Tracking</div>
    <div class="wn-stats-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="wn-stat"><div class="wn-stat-val">${goalStats.goalsHit}/${goalStats.showsWithGoals}</div><div class="wn-stat-label">Goals Hit</div></div>
      <div class="wn-stat"><div class="wn-stat-val">${(goalStats.hitRate * 100).toFixed(0)}%</div><div class="wn-stat-label">Hit Rate</div></div>
      <div class="wn-stat"><div class="wn-stat-val">${(goalStats.overPerformPct * 100).toFixed(0)}%</div><div class="wn-stat-label">${goalStats.overPerformPct >= 0 ? 'Over' : 'Under'} Goal</div></div>
    </div>`;
  }

  // Category Rotation Planner
  const rotation = calcCategoryRotation().slice(0, 8);
  if (rotation.length > 0) {
    html += `<div class="wn-section-title">Category Rotation Planner</div>
    <div class="wn-rotation-list">`;
    for (const r of rotation) {
      const urgency = r.daysSinceShown > 21 ? 'wn-rot-overdue' : r.daysSinceShown > 14 ? 'wn-rot-due' : '';
      html += `<div class="wn-rotation-row ${urgency}">
        <span class="wn-rot-cat">${escHtml(r.category)}</span>
        <span class="wn-rot-info">${r.inStockCount} in stock · ${r.lastShownDate === 'Never' ? 'Never shown' : r.daysSinceShown + 'd ago'} · ${(r.avgSellThrough * 100).toFixed(0)}% ST</span>
        ${r.suggestion ? `<span class="wn-rot-sug">${escHtml(r.suggestion)}</span>` : ''}
      </div>`;
    }
    html += `</div>`;
  }

  // Prescriptive Inventory Actions
  const invActions = calcInventoryActions(8);
  if (invActions.length > 0) {
    html += `<div class="wn-section-title">Smart Actions — What to Do Next</div>
    <div class="wn-actions-list">`;
    const icons = { 'whatnot-auction': '🔨', 'bundle-or-drop': '📦', 'relist-whatnot': '📺', 'crosslist': '🔗', 'donate': '🎗', 'reprice': '💰', 'add-to-show': '⭐' };
    for (const a of invActions) {
      const icon = icons[a.actionType] || '💡';
      html += `<div class="wn-action-row">
        <span class="wn-action-icon">${icon}</span>
        <div class="wn-action-info">
          <span class="wn-action-item">${escHtml(a.item.name?.slice(0, 30) || '')}</span>
          <span class="wn-action-text">${escHtml(a.action)}</span>
        </div>
      </div>`;
    }
    html += `</div>`;
  }

  // Show-to-Show Comparison
  const allEnded = getEndedShows();
  if (allEnded.length >= 2) {
    html += `<div class="wn-section-title">Compare Shows</div>
    <div class="wn-compare-selects">
      <select onchange="wnSetCompareA(this.value)">
        <option value="">Select Show A</option>
        ${allEnded.map(s => `<option value="${escAttr(s.id)}"${s.id === _wnCompareA ? ' selected' : ''}>${escHtml(s.name.slice(0, 25))} (${s.date || ''})</option>`).join('')}
      </select>
      <span>vs</span>
      <select onchange="wnSetCompareB(this.value)">
        <option value="">Select Show B</option>
        ${allEnded.map(s => `<option value="${escAttr(s.id)}"${s.id === _wnCompareB ? ' selected' : ''}>${escHtml(s.name.slice(0, 25))} (${s.date || ''})</option>`).join('')}
      </select>
    </div>`;
    if (_wnCompareA && _wnCompareB && _wnCompareA !== _wnCompareB) {
      const cmp = compareShows(_wnCompareA, _wnCompareB);
      if (cmp) {
        html += `<div class="wn-compare-table"><table>
          <thead><tr><th>Metric</th><th>${escHtml(cmp.showA.name.slice(0, 15))}</th><th>${escHtml(cmp.showB.name.slice(0, 15))}</th><th>Diff</th></tr></thead><tbody>`;
        for (const f of cmp.fields) {
          const fmtVal = v => f.money ? fmt(v) : f.pct ? `${(v * 100).toFixed(0)}%` : f.hrs ? `${v.toFixed(1)}h` : v;
          const diff = f.a - f.b;
          const diffStr = f.money ? fmt(Math.abs(diff)) : f.pct ? `${(Math.abs(diff) * 100).toFixed(0)}%` : f.hrs ? `${Math.abs(diff).toFixed(1)}h` : Math.abs(diff);
          const color = diff > 0 ? 'var(--good)' : diff < 0 ? 'var(--danger)' : 'var(--muted)';
          html += `<tr><td>${f.label}</td><td>${fmtVal(f.a)}</td><td>${fmtVal(f.b)}</td><td style="color:${color}">${diff > 0 ? '+' : diff < 0 ? '-' : ''}${diffStr}</td></tr>`;
        }
        html += `</tbody></table></div>`;
      }
    }
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
      html += `<div class="wn-builder-item${isSelected ? ' selected' : ''}" onclick="wnBuilderToggle('${escAttr(s.item.id)}')"
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

// ── Live Show Dashboard Tab ──────────────────────────────────────────────

function _renderWnLiveDashTab() {
  const stats = getLiveShowStats();
  if (!stats) {
    return `<div style="text-align:center;padding:30px;color:var(--muted)">No show is currently live. Start a show from the Shows tab.</div>`;
  }

  let html = `<div class="wn-live-dash">`;

  // Header with timer
  html += `<div class="wn-live-header">
    <div class="wn-live-title">🔴 ${escHtml(stats.showName)} — LIVE</div>
    <div class="wn-live-timer">${escHtml(stats.elapsedFormatted)}</div>
  </div>`;

  // Goal progress bar
  if (stats.goalProgress) {
    const pctW = Math.min(100, stats.goalProgress.progress * 100).toFixed(0);
    html += `<div class="wn-goal-bar wn-goal-bar-lg">
      <div class="wn-goal-fill${stats.goalProgress.hit ? ' wn-goal-hit' : ''}" style="width:${pctW}%"></div>
      <span class="wn-goal-text">${fmt(stats.goalProgress.revenue)} / ${fmt(stats.goalProgress.goal)}${stats.goalProgress.hit ? ' — GOAL HIT!' : ` — ${fmt(stats.goalProgress.remaining)} to go`}</span>
    </div>`;
  }

  // Stats grid
  html += `<div class="wn-live-stats">
    <div class="wn-live-stat wn-live-stat-big"><div class="wn-stat-val">${fmt(stats.revenue)}</div><div class="wn-stat-label">Revenue</div></div>
    <div class="wn-live-stat"><div class="wn-stat-val">${stats.soldCount}/${stats.totalItems}</div><div class="wn-stat-label">Items Sold</div></div>
    <div class="wn-live-stat"><div class="wn-stat-val">${(stats.sellThrough * 100).toFixed(0)}%</div><div class="wn-stat-label">Sell-Through</div></div>
    <div class="wn-live-stat"><div class="wn-stat-val">${fmt(stats.revenuePerHour)}/hr</div><div class="wn-stat-label">Rev/Hour</div></div>
    <div class="wn-live-stat"><div class="wn-stat-val">${stats.remaining}</div><div class="wn-stat-label">Remaining</div></div>
    <div class="wn-live-stat"><div class="wn-stat-val">${fmt(stats.remainingValue)}</div><div class="wn-stat-label">Remaining Value</div></div>
  </div>`;

  // Quick actions
  html += `<div class="wn-live-actions">
    <label class="wn-viewer-input">Peak Viewers: <input type="number" min="0" value="${stats.viewerPeak || ''}" placeholder="0" onchange="wnSetViewerPeak('${stats.showId}',this.value)" style="width:60px"></label>
    <button class="btn-sm btn-danger" onclick="wnEndShow('${escAttr(stats.showId)}')">End Show</button>
  </div>`;

  // Remaining items queue
  if (stats.remainingItems.length > 0) {
    html += `<div class="wn-section-title">Up Next (${stats.remaining} items)</div>
    <div class="wn-live-queue">`;
    for (const item of stats.remainingItems) {
      const loc = item.binLocation ? `📍${escHtml(item.binLocation)}` : '';
      html += `<div class="wn-live-queue-item">
        <span class="wn-queue-name">${escHtml(item.name || 'Untitled')}</span>
        <span class="wn-queue-detail">${item.price ? fmt(item.price) : ''} ${loc}</span>
        <div class="wn-queue-actions">
          <button class="btn-xs btn-accent" onclick="wnMarkSold('${escAttr(stats.showId)}','${escAttr(item.id)}')">Sold</button>
          <button class="btn-xs btn-warn" onclick="wnGiveaway('${escAttr(stats.showId)}','${escAttr(item.id)}')" title="Giveaway">🎁</button>
        </div>
      </div>`;
    }
    html += `</div>`;
  }

  // Giveaway summary
  if (stats.giveawayCount > 0) {
    html += `<div class="wn-section-title">Giveaways: ${stats.giveawayCount} items (${fmt(stats.giveawayCost)} cost)</div>`;
  }

  html += `</div>`;
  return html;
}

// ── Pricing Tab ─────────────────────────────────────────────────────────

function _renderWnPricingTab() {
  const liveShow = getLiveShow();
  const upcoming = getUpcomingShows().filter(s => s.status === 'prep');
  const targetShow = liveShow || upcoming[0];

  let html = `<div class="wn-pricing">`;

  if (!targetShow) {
    html += `<div style="text-align:center;padding:30px;color:var(--muted)">Create a show first to get pricing recommendations.</div></div>`;
    return html;
  }

  html += `<div class="wn-section-title">Starting Bid Recommendations — ${escHtml(targetShow.name)}</div>
  <p style="color:var(--muted);font-size:12px;margin:0 0 12px">Based on show history, comp data, and list prices. Bids start low to drive auction energy.</p>`;

  const bids = suggestShowBids(targetShow.id);
  if (bids.length === 0) {
    html += `<div style="color:var(--muted);padding:16px">No items in this show yet.</div>`;
  } else {
    html += `<div class="wn-pricing-list">`;
    for (const b of bids) {
      html += `<div class="wn-pricing-row">
        <div class="wn-pricing-item">
          <span class="wn-pricing-name">${escHtml(b.item.name || 'Untitled')}</span>
          <span class="wn-pricing-detail">List: ${fmt(b.item.price || 0)}${b.compPrice ? ` · Comp: ${fmt(b.compPrice)}` : ''}${b.costFloor ? ` · Cost: ${fmt(b.costFloor)}` : ''}</span>
        </div>
        <div class="wn-pricing-bid">
          <span class="wn-pricing-suggested">${fmt(b.suggestedBid)}</span>
          <span class="wn-pricing-range">${fmt(b.minBid)}–${fmt(b.maxBid)}</span>
        </div>
        <div class="wn-pricing-reason">${escHtml(b.reasoning)}</div>
      </div>`;
    }
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// ── Shipping Queue Tab ──────────────────────────────────────────────────

function _renderWnShippingTab() {
  const queue = getGlobalShippingQueue();

  let html = `<div class="wn-shipping">`;
  html += `<div class="wn-section-title">Shipping Queue (${queue.length} unshipped)</div>`;

  if (queue.length > 0) {
    html += `<div style="margin-bottom:10px"><button class="btn-sm btn-accent" onclick="wnBulkMarkShipped()">Mark All Shipped (${queue.length})</button></div>`;
  }

  if (queue.length === 0) {
    html += `<div style="text-align:center;padding:30px;color:var(--muted)">All items shipped! Nothing in the queue.</div>`;
  } else {
    html += `<div class="wn-ship-list">`;
    for (const q of queue) {
      const soldDate = q.soldAt ? new Date(q.soldAt).toLocaleDateString() : '';
      html += `<div class="wn-ship-row">
        <div class="wn-ship-info">
          <span class="wn-ship-name">${escHtml(q.item.name || 'Untitled')}</span>
          <span class="wn-ship-detail">${escHtml(q.showName)} · ${soldDate} · ${fmt(q.price)}${q.binLocation ? ` · 📍${escHtml(q.binLocation)}` : ''}</span>
        </div>
        <button class="btn-xs btn-accent" onclick="wnMarkShipped('${escAttr(q.itemId)}')">Mark Shipped</button>
      </div>`;
    }
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// ── Whatnot Show Handlers (exposed to window) ────────────────────────────

export function wnCalcUpdate(field, value) {
  if (field === 'price') _wnCalcPrice = value;
  else if (field === 'shipping') _wnCalcShipping = value;
  else if (field === 'cost') _wnCalcCost = value;
  else if (field === 'tax') _wnCalcTax = value;
  _rerender();
}

export function wnSwitchTab(tab) {
  _wnTab = tab;
  _rerender();
}

export function wnToggleShow(showId) {
  _wnExpandedShow = _wnExpandedShow === showId ? null : showId;
  _wnShowItemPicker = false;
  _rerender();
}

export async function wnNewShow() {
  const name = await appPrompt({ title: 'New Show', message: 'Show name:', placeholder: 'My Whatnot Show' });
  if (!name) return;
  const date = await appPrompt({ title: 'Show Date', message: 'Date (YYYY-MM-DD):', defaultValue: localDate() });
  if (!date) return;
  const time = await appPrompt({ title: 'Show Time', message: 'Time (HH:MM, optional):', defaultValue: '19:00' }) || '';
  const show = await createShow(name, date, time);
  _wnTab = 'shows';
  _wnExpandedShow = show.id;
  _rerender();
}

export async function wnDeleteShow(showId) {
  const show = getShow(showId);
  if (!show) return;
  if (!await appConfirm({ title: 'Delete Show', message: `Delete show "${show.name}"?`, danger: true })) return;
  await deleteShow(showId);
  if (_wnExpandedShow === showId) _wnExpandedShow = null;
  _rerender();
}

export async function wnStartShow(showId) {
  const show = getShow(showId);
  if (!show) return;
  if (!await appConfirm({ title: 'Go Live', message: `Go live with "${show.name}" (${show.items.length} items)?` })) return;
  await startShow(showId);
  _wnExpandedShow = showId;
  _rerender();
}

export async function wnEndShow(showId) {
  if (!await appConfirm({ title: 'End Show', message: 'End this live show?', danger: true })) return;
  await endShow(showId);
  _rerender();
}

export async function wnMarkSold(showId, itemId) {
  const item = getInvItem(itemId);
  const price = item?.price || 0;
  await markShowItemSold(showId, itemId, price);
  refresh();
  _rerender();
}

export async function wnMoveItem(showId, itemId, direction) {
  await moveShowItem(showId, itemId, direction);
  _rerender();
}

export async function wnRemoveItem(showId, itemId) {
  await removeItemFromShow(showId, itemId);
  _rerender();
}

export function wnOpenItemPicker(showId) {
  _wnExpandedShow = showId;
  _wnShowItemPicker = true;
  _wnPickerSearch = '';
  _wnPickerLimit = 50;
  _rerender();
}

export function wnCloseItemPicker() {
  _wnShowItemPicker = false;
  _wnPickerSearch = '';
  _wnPickerLimit = 50;
  _rerender();
}

export function wnPickerSearch(val) {
  _wnPickerSearch = val;
  _wnPickerLimit = 50;
  _rerender();
}

export function wnPickerShowMore() {
  _wnPickerLimit += 50;
  _rerender();
}

export function wnShowAllItems(showId) {
  _wnShowItemsExpanded.add(showId);
  _rerender();
}

export async function wnPickItem(showId, itemId) {
  await addItemToShow(showId, itemId);
  _rerender();
}

export async function wnCopyPrep(showId) {
  await copyShowPrepList(showId);
}

export async function wnEditItemNote(showId, itemId) {
  const existing = getItemNote(showId, itemId);
  const note = await appPrompt({ title: 'Item Notes', message: 'Talking points for this item:', defaultValue: existing || '' });
  if (note === null) return; // cancelled
  await setItemNote(showId, itemId, note);
  _rerender();
}

export async function wnCloneShow(showId) {
  const date = await appPrompt({ title: 'Clone Show', message: 'Date for cloned show (YYYY-MM-DD):', defaultValue: localDate() });
  if (!date) return;
  const newShow = await cloneShow(showId, date);
  if (newShow) {
    _wnTab = 'shows';
    _wnExpandedShow = newShow.id;
    _rerender();
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
  _rerender();
}

export function wnBuilderSelectAll() {
  const suggestions = suggestShowItems(30);
  const size = suggestShowSize();
  _wnBuilderSelected.clear();
  suggestions.slice(0, size.recommended).forEach(s => _wnBuilderSelected.add(s.item.id));
  _rerender();
}

export function wnBuilderClearSelection() {
  _wnBuilderSelected.clear();
  _rerender();
}

export async function wnBuilderCreateShow() {
  if (_wnBuilderSelected.size === 0) { toast('No items selected', true); return; }
  const name = await appPrompt({ title: 'Smart Show', message: 'Show name:', defaultValue: `Smart Show - ${new Date().toLocaleDateString()}` });
  if (!name) return;
  const date = await appPrompt({ title: 'Show Date', message: 'Date (YYYY-MM-DD):', defaultValue: localDate() });
  if (!date) return;
  const time = await appPrompt({ title: 'Show Time', message: 'Time (HH:MM):', defaultValue: '19:00' }) || '';
  const show = await createShow(name, date, time, '', { items: [..._wnBuilderSelected] });
  _wnBuilderSelected.clear();
  _wnTab = 'shows';
  _wnExpandedShow = show.id;
  _rerender();
  toast(`Show created with ${show.items.length} items`);
}

// ── NEW WHATNOT HANDLERS ─────────────────────────────────────────────────

export async function wnSetGoal(showId, val) {
  await setShowRevenueGoal(showId, val);
  _rerender();
}

export async function wnGiveaway(showId, itemId) {
  const item = getInvItem(itemId);
  if (!item) return;
  const reason = await appPrompt({ title: 'Giveaway', message: `Mark "${item.name}" as a giveaway?`, placeholder: 'Reason (e.g., engagement, contest)' });
  if (reason === null) return;
  await addGiveaway(showId, itemId, reason || 'Giveaway');
  refresh();
  _rerender();
}

export async function wnEditBinLoc(itemId) {
  const item = getInvItem(itemId);
  if (!item) return;
  const loc = await appPrompt({ title: 'Bin/Shelf Location', message: `Where is "${item.name}" stored?`, defaultValue: item.binLocation || '', placeholder: 'e.g., Shelf A-3, Bin 12' });
  if (loc === null) return;
  await setItemBinLocation(itemId, loc);
  _rerender();
}

export async function wnCreateLot(showId) {
  const name = await appPrompt({ title: 'Create Lot', message: 'Lot name:', placeholder: 'e.g., Mystery Lot #1' });
  if (!name) return;
  const bid = await appPrompt({ title: 'Starting Bid', message: 'Starting bid ($):', defaultValue: '5' });
  if (bid === null) return;
  // For now create lot from all show items — user can edit after
  const show = getShow(showId);
  if (!show) return;
  // Let user pick items via a simple comma-separated index approach
  const idxStr = await appPrompt({ title: 'Lot Items', message: `Enter item numbers to include (1-${show.items.length}), comma-separated:`, placeholder: '1,2,3' });
  if (!idxStr) return;
  const indices = idxStr.split(',').map(s => parseInt(s.trim()) - 1).filter(i => i >= 0 && i < show.items.length);
  const itemIds = indices.map(i => show.items[i]);
  if (itemIds.length === 0) { toast('No valid items selected', true); return; }
  await addLot(showId, name, itemIds, parseFloat(bid) || 5);
  _rerender();
}

export async function wnRemoveLot(showId, lotId) {
  if (!await appConfirm({ title: 'Remove Lot', message: 'Delete this lot?', danger: true })) return;
  await removeLot(showId, lotId);
  _rerender();
}

export async function wnCopyRecap(showId) {
  const text = getShowRecapText(showId);
  if (!text) { toast('No recap available', true); return; }
  try {
    await navigator.clipboard.writeText(text);
    toast('Show recap copied — paste to share!');
  } catch { toast('Copy failed', true); }
}

export function wnSetCompareA(val) {
  _wnCompareA = val;
  _rerender();
}

export function wnSetCompareB(val) {
  _wnCompareB = val;
  _rerender();
}

export async function wnMarkShipped(itemId) {
  await markItemShipped(itemId);
  _rerender();
}

export async function wnBulkMarkShipped() {
  const queue = getGlobalShippingQueue();
  if (queue.length === 0) return;
  if (!await appConfirm({ title: 'Mark All Shipped', message: `Mark ${queue.length} items as shipped?` })) return;
  for (const q of queue) {
    await markItemShipped(q.itemId);
  }
  toast(`${queue.length} items marked as shipped`);
  _rerender();
}
