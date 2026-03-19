/**
 * FlipTrack — main.js
 * Entry point: imports all modules, CSS, and exposes functions to window
 * for inline HTML event handlers (onclick, onchange, oninput).
 */

// ── CSS (Vite handles bundling) ───────────────────────────────────────────────
import './styles/index.css'; // gating.css is imported via index.css

// ── Config ────────────────────────────────────────────────────────────────────
import { SB_URL, SB_KEY, IMG_BUCKET } from './config/constants.js';
import { PLATFORMS, PLATFORM_GROUPS, platCls, PLATFORM_FEES, calcPlatformFee } from './config/platforms.js';
import { CLOTHING_TYPES, CAT_TREE, SUBCATS, SUBSUBCATS } from './config/categories.js';

// ── Utilities ─────────────────────────────────────────────────────────────────
import { fmt, pct, uid, ds, escHtml, escAttr, debounce } from './utils/format.js';
import { toast, trapFocus, releaseFocus, appPrompt } from './utils/dom.js';
import { _sfx } from './utils/sfx.js';
import { initKeyboardShortcuts } from './utils/keyboard.js';

// ── Data Layer ────────────────────────────────────────────────────────────────
import {
  inv, sales, expenses, supplies,
  save, refresh, initStore,
  rebuildInvIndex, getInvItem,
  sel, platFilt, catFilt, activeDrawId,
  _invPage, _invPageSize,
  _salePage, _salePageSize,
  _cacheDirty, _insightsCache, _breakdownCache, _chipsBuiltForData,
  _trash, saveTrash, pushUndo, showUndoToast, performUndo,
  softDeleteItem, restoreItem, calc, sc, mkc, margCls,
  markDirty, markDeleted,
  _debouncedRenderInv,
  normalizeAllCategories
} from './data/store.js';
import {
  initAuth, authSubmit, authForgotPassword, authSignOut,
  switchAuthTab, showAuthModal, hideAuthModal,
  openAccountMenu, closeAccountMenu
} from './data/auth.js';
import {
  pushToCloud, pushDeleteToCloud, pullFromCloud,
  syncNow, autoSync, setSyncStatus,
  startRealtime, stopRealtime,
  startPoll, stopPoll, mobileSyncNow,
  initOfflineQueue
} from './data/sync.js';
import {
  uploadImageToStorage, deleteImageFromStorage, migrateImagesToStorage
} from './data/storage.js';

// ── Views ─────────────────────────────────────────────────────────────────────
import {
  updateStats, updatePlatBreakdown, updateSalesLog,
  renderDash, renderDeathPile, renderPriceAlerts, quickReprice
} from './views/dashboard.js';
import {
  renderInv, buildChips, _updateChipActiveStates,
  setPlatFilt, setCatFilt, setSubcatFilt, setSubsubcatFilt,
  setSort, sortItems, startPriceEdit, adjStock,
  dStart, dOver, dDrop,
  toggleSel, toggleAll, clearSel, syncBulk,
  bulkDel, bulkSold,
  toggleBulkMenu, openBulkPrice, closeBulkPrice, previewBulkPrice, applyBulkPrice,
  openBulkCategory, closeBulkCategory, applyBulkCategory,
  openBulkPlatform, closeBulkPlatform, applyBulkPlatform,
  bulkExportCSV,
  toggleFilterPanel, openFilterPanel, updateFiltersBadge,
  setStockFilt, clearStockFilter,
  setSmokeFilt, setConditionFilt, daysListed
} from './views/inventory.js';
import {
  openSoldModal, closeSold, sPriceType, onSoldItemPick,
  updateSalePriceHint, updateFeeEstimate,
  recSale, renderSalesView,
  toggleBundleMode, filterBundleItems, toggleBundleItem, _updateBundlePriceHint,
  setSalesSearch, setSalesDateFrom, setSalesDateTo, clearSalesFilters
} from './views/sales.js';
import { renderInsights } from './views/insights.js';
import {
  renderProfitDashboard,
  setProfitDateRange, setProfitSearch, setProfitPlatFilter,
  setProfitCatFilter, setProfitSort
} from './views/profit-dashboard.js';
import {
  setDefaultExpDate, addExpense, delExpense, renderExpenses,
  setExpSearch, setExpDateFrom, setExpDateTo, clearExpFilters
} from './views/expenses.js';
import {
  renderReports, showPLReport, renderPLStatement,
  setReportMode, shiftPeriod, goToAddExpense,
  delSale, delItem, undoSaleDeletion
} from './views/reports.js';
import {
  renderBreakdown, toggleBdSubs, filterToCat, filterToSubcat
} from './views/breakdown.js';
import {
  saveSupplies, syncSupplies, pullSupplies,
  addSupply, updateSupplyQty, setSupplyQty, delSupply,
  renderSupplies, checkSupplyAlerts
} from './views/supplies.js';

// ── Modals ────────────────────────────────────────────────────────────────────
import {
  openDrawer, closeDrawer, drawerTab, saveDrawer, delCurrent,
  populateSubcatSelect, populateSubtypeSelect, saveCustomType,
  syncDrawerSubcat, syncDrawerSubtype,
  syncAddSubcat, syncAddSubtype,
  renderListingStatus, toggleListingStatus, getListingStatusFromDrawer,
  setCondTag, loadCondTag
} from './modals/drawer.js';
import {
  dupCurrent, dupItem, addFormTab,
  openAddModal, closeAdd,
  toggleBulkFields, prevProfit, prefillFromLast,
  addItem, updateSmokeSlider, updateCoverSlider
} from './modals/add-item.js';
import {
  isBookCat, toggleBookFields, swapConditionTags,
  updateRankDisplay, lookupISBN, scanISBN, calcFBA,
  getBookFields, loadBookFields, clearBookFields
} from './modals/book-mode.js';
import {
  openTrashModal, closeTrashModal, emptyTrash
} from './modals/trash.js';
import {
  openMaterialsModal, confirmMaterials, skipMaterials
} from './modals/materials.js';

// ── Features (eagerly loaded — lightweight) ─────────────────────────────────
import {
  getPlatforms, buildPlatPicker, togglePlatChip,
  getSelectedPlats, initPlatPickers, renderPlatTags
} from './features/platforms.js';
import {
  bnav, toggleBnavMore, closeBnavMore, updateBnavVisibility
} from './features/bnav.js';
import { updateOnlineStatus } from './features/offline.js';
import {
  initListingDates, checkExpiredListings, autoDlistOnSale,
  getCrosslistStats, getExpiredListings, getExpiringListings,
  markPlatformStatus, relistItem, setListingDate,
  enableAutoRelist, disableAutoRelist, isAutoRelistEnabled, runAutoRelist,
  bulkPriceAdjust, bulkRelistPlatform
} from './features/crosslist.js';
import { generateListingLink, copyListingText } from './features/deep-links.js';
import { initTemplates } from './features/listing-templates.js';
import {
  renderCrosslistDashboard, clSwitchTab, clToggleAllSingle, clSetSearch, clSetPlatFilter, clSetStatusFilter,
  clRelistItem, clDelistItem, clCycleStatus, clOpenLink, clCopyListing,
  clBulkRelistExpired, clAddTemplate, clDeleteTemplate, clSaveTemplate,
  clToggleAutoRelist, clRunAutoRelist, clBulkPrice,
  clEBayConnect, clEBayDisconnect, clEBaySync, clEBayResyncOrders, clPushToEBay, clPublishOnEBay, clEndEBayListing,
  clEtsyConnect, clEtsyDisconnect, clEtsySync, clPushToEtsy, clDeactivateEtsyListing, clRenewEtsyListing,
  clEtsySubTab, clEtsyLoadStats, clEtsyLoadReviews, clEtsyLoadShipments,
  clEtsyPushTracking, clEtsySyncQty, clEtsyPushPhotos, clEtsyPushQty,
  clEtsyPushPrice, clEtsyTagSelect, clEtsyRemoveTag, clEtsyAddTag,
  clEtsySuggestTags, clEtsySaveTags, clEtsySyncExpenses,
  wnToggleShow, wnNewShow, wnDeleteShow, wnStartShow, wnEndShow,
  wnMarkSold, wnMoveItem, wnRemoveItem, wnOpenItemPicker, wnCloseItemPicker,
  wnPickItem, wnCopyPrep,
  wnSwitchTab, wnEditItemNote, wnCloneShow, wnSetViewerPeak, wnSetExpenses,
  wnPrintRunSheet, wnExportShowCSV,
  wnBuilderToggle, wnBuilderSelectAll, wnBuilderClearSelection, wnBuilderCreateShow,
  wnCalcUpdate
} from './views/crosslist-dashboard.js';
import { initEBayAuth, handleEBayCallback, isEBayConnected } from './features/ebay-auth.js';
import { initEBaySync, startEBaySyncInterval, resyncEBayOrders } from './features/ebay-sync.js';
import { initEtsyAuth, handleEtsyCallback, isEtsyConnected } from './features/etsy-auth.js';
import { initEtsySync, startEtsySyncInterval, syncEtsyExpenses } from './features/etsy-sync.js';
import { initWhatnotShows, getTodayShows } from './features/whatnot-show.js';
import {
  setDimUnit, updateDimWeight, suggestPackaging,
  loadDimsToForm, getDimsFromForm, clearDimForm
} from './features/dimensions.js';

// ── Phase 2: Shipping & Fulfillment ──────────────────────────────────────────
import {
  renderShippingView, initShippingModals,
  shipSetSearch, shipSetPlatFilter, shipSetStatusFilter,
  shipSetDateFrom, shipSetDateTo, shipClearFilters,
  shipToggleSel, shipToggleAll, shipClearSel,
  shipMarkShipped, shipConfirmShipped, shipCancelMark,
  shipBatchMark, shipConfirmBatchMark, shipCancelBatchMark,
  shipPrintSlip, shipPrintBatchSlips, shipExportLog,
  shipCheckTracking, shipLogReturn, shipToggleReturnForm
} from './views/shipping.js';
import {
  printPackingSlip, printBatchSlips,
  openPackingSlipSettings, closePackingSlipSettings, savePackingSlipSettings,
  initPackingSlipSettings
} from './features/packing-slip.js';
import { estimateShippingRate, suggestPackage, getCarrierOptions } from './features/shipping-rates.js';

// ── Phase 3: Sourcing & Haul Tracking ────────────────────────────────────────
import {
  renderSourcingView, initHauls, addHaul, deleteHaul, expandHaul,
  linkItemsToHaul, confirmLinkItems, closeItemLinkModal, unlinkItem,
  srcSetSearch, srcSetSort, getHaulById
} from './views/sourcing.js';
import { getHaulROI, getHaulItems, splitCost, getSourceStats, getBestSources } from './features/haul.js';
import { generateHaulReceipt, downloadHaulReceipt, copyHaulReceipt } from './features/haul-receipt.js';

// ── Phase 4: Tax & Bookkeeping ───────────────────────────────────────────────
import {
  renderTaxCenter, taxSetYear, taxSetQuarter, taxToggleScheduleC, taxExportCSV,
  taxToggleYearComparison
} from './views/tax-center.js';
import {
  initMileageLog, mileAddEntry, mileDeleteEntry,
  getMileageSummary, getMileageDeduction
} from './features/mileage.js';

// ── Phase 5: Pricing Intelligence & Repricing ───────────────────────────────
import { logPriceChange, logSalePrice, renderPriceHistoryChart, renderPriceHistoryTable } from './features/price-history.js';
import {
  initRepricingRules, renderRepricingSuggestions, renderRepricingRulesManager,
  rpAddRule, rpDeleteRule, rpToggleRule, rpApplyAll, rpApplySingle, evaluateRules,
  rpAddRuleFromForm
} from './features/repricing-rules.js';

// ── Phase 6: Customer & Offer Management ─────────────────────────────────────
import {
  renderBuyersView, initBuyers, buyerAdd, buyerDelete, buyerExpand,
  buyerSetSearch, buyerSetSort, buyerLinkSale, buyerAddComm
} from './views/buyers.js';
import {
  initOffers, renderOffersPanel, offerAdd, offerAddConfirm,
  offerAccept, offerReject, offerCounter, offerDelete, renderItemOffers
} from './features/offers.js';

// ── Phase 7: Advanced Analytics ──────────────────────────────────────────────
import {
  calcSellThroughRate, calcInventoryTurnRate, calcCashFlowProjection,
  calcSeasonalTrends, calcPlatformComparison, calcVelocityByCategory,
  calcProfitByDayOfWeek, calcBestListingDay, calcRevenueForecasts, calcBreakEvenAnalysis
} from './features/analytics-calc.js';

// ── Phase 8: Pro Reseller Features ──────────────────────────────────────────
import {
  fetchComps, suggestPrice, renderCompsPanel, renderCompsInline,
  getItemComps, clearCompsCache,
  loadDrawerComps, resetDrawerComps,
  triggerAddComps, compsUsePrice
} from './features/comps.js';
import {
  initPhotoSettings, removeBackground, autoCrop, addWatermark, squarePad,
  adjustImage, batchProcess, renderPhotoToolsPanel, getPhotoSettings, savePhotoSettings
} from './features/photo-tools.js';
import { calculateProfit, renderProfitCalc, quickProfitEstimate } from './features/profit-calc.js';
import { getDeathPileItems, getDeathPileStats, renderDeathPileWidget, renderDeathPileView, getUrgencyLevel } from './features/death-pile.js';
import {
  startBatchList, batchTogglePlatform, batchSetTemplate, getBatchState,
  executeBatchList, generateBatchText, copyBatchText, renderBatchListPanel, clearBatchList
} from './features/batch-list.js';
import {
  initAIListing, generateListing, generateAndApply, renderAIListingPanel, copyAIListing, isGenerating,
  copyPlatformListing
} from './features/ai-listing.js';
import { getInventoryValueData, renderInventoryValueDashboard } from './features/inventory-value.js';
import { initDemoTrigger, loadDemoData, clearDemoData } from './features/demo-data.js';
import { animateStatCounters } from './features/animated-counters.js';
import { mountProfitHeatmap } from './features/profit-heatmap.js';
import { exportPlatformCSV, exportSalesCSV, exportTaxCSV, exportShowPrepCSV, exportShowResultsCSV, exportAllShowsCSV, renderCSVExportPanel } from './features/csv-templates.js';
import { toggleNotifications, startStockAlertChecks, getNotifStatus, sendNotification } from './features/push-notifications.js';
import { startTour, endTour, maybeStartTour } from './features/onboarding-tour.js';
import { renderKPIGoals, openKPIGoalEditor, closeKPIGoalEditor, saveKPIGoals } from './features/kpi-goals.js';
import { toggleNotifCenter, closeNotifCenter, markAllRead, clearNotifications, addNotification, initNotificationCenter, getSalesVelocity, checkWhatnotShowReminders, notifyShowEnded, checkDailyDigest } from './features/notification-center.js';
import { recordSync, startSyncIndicator } from './features/sync-indicator.js';
import {
  initTeam, getActiveAccountId, getMyRole, getTeam,
  openTeamPanel, closeTeamPanel, renderTeamPanel,
  createTeam, joinTeam, leaveTeam, deleteTeam,
  generateInvite, updateMemberRole, removeMember
} from './features/teams.js';
import { exportPLReport, exportTaxReport } from './features/pdf-reports.js';

// ── Phase 9: Analytics & Intelligence ────────────────────────────────────────
import { renderInventoryHealth } from './features/inventory-health.js';
import { renderSourcingAnalytics } from './features/sourcing-analytics.js';
import { renderPlatformROI } from './features/platform-roi.js';
import { renderPeriodCompare } from './features/period-compare.js';
import { renderReturns, openReturnModal, closeReturnModal, submitReturn } from './features/returns.js';
import { renderListingScores, scoreItem } from './features/listing-score.js';
import { computeFlipScore } from './features/flip-score.js';
import { computeSourceScore } from './features/source-score.js';
import { scanArbitrageOpportunities } from './features/arbitrage-alerts.js';
import { openGalleryBuilder, closeGalleryBuilder, setGalleryLayout, downloadCollage, copyCollage, generateCollage } from './features/social-gallery.js';
import { computeSeasonalData, renderSeasonalCalendar } from './features/seasonal-calendar.js';
import { donateItem, getDonations, getDonationTotal, renderDonationLog } from './features/donations.js';
import { openVoiceAdd, closeVoiceAdd, voiceRemoveItem, voiceAddAll, voiceAddNext, voiceQueueCount } from './features/voice-add.js';
import { toggleCommunityOptIn, contributeSales, queryCommunityPricing, isCommunityOptedIn } from './features/community-pricing.js';
import { renderMarginAlerts, updateMarginThreshold, initMarginAlerts } from './features/margin-alerts.js';
import {
  initShipLabels, estimateRates, getCheapestRate, renderRateComparison,
  getPirateShipLink, getPayPalShipLink, getEBayShipLink,
  recordLabelCost, getShippingCostSummary, saveShipLabelSettings
} from './features/ship-labels.js';

// ── Backup/Restore ────────────────────────────────────────────────────────────
import { downloadBackup, restoreBackup } from './features/backup.js';

// ── Sales Velocity Chart ──────────────────────────────────────────────────────
import { renderSalesVelocity } from './features/sales-velocity.js';

// ── Features (heavy modules — loaded on first use via lazy.js wrappers) ──────
import {
  lazyScanner, lazyBatchScan, lazyPriceResearch,
  lazyIdentify, lazyImages, lazyBarcodes, lazyCSV
} from './utils/lazy.js';

// NOTE: getItemImages is needed eagerly by inventory.js (imported directly there).
// These lazy wrappers are only for window-exposed onclick handlers.

// Lazy wrapper factory: creates an async function that loads the module then calls the export
const _lw = (loader, fn) => async (...args) => { const m = await loader(); return m[fn](...args); };

// Scanner
const openScanner = _lw(lazyScanner, 'openScanner');
const closeScanner = _lw(lazyScanner, 'closeScanner');
const switchCamera = _lw(lazyScanner, 'switchCamera');

// Price Research
const openPriceResearch = _lw(lazyPriceResearch, 'openPriceResearch');
const closePriceResearch = _lw(lazyPriceResearch, 'closePriceResearch');
const prSwitchTab = _lw(lazyPriceResearch, 'prSwitchTab');
const openPriceScanner = _lw(lazyPriceResearch, 'openPriceScanner');
const lookupPrices = _lw(lazyPriceResearch, 'lookupPrices');
const lookupByKeyword = _lw(lazyPriceResearch, 'lookupByKeyword');

// Images & Crop
const imgSlotChange = _lw(lazyImages, 'imgSlotChange');
const imgSlotRemove = _lw(lazyImages, 'imgSlotRemove');
const refreshImgSlots = _lw(lazyImages, 'refreshImgSlots');
const renderAddFormImages = _lw(lazyImages, 'renderAddFormImages');
const renderDrawerImg = _lw(lazyImages, 'renderDrawerImg');
const imgDragOver = _lw(lazyImages, 'imgDragOver');
const imgDragLeave = _lw(lazyImages, 'imgDragLeave');
const imgDrop = _lw(lazyImages, 'imgDrop');
const openLightbox = _lw(lazyImages, 'openLightbox');
const openLightboxUrl = _lw(lazyImages, 'openLightboxUrl');
const closeLightbox = _lw(lazyImages, 'closeLightbox');
const lightboxPrev = _lw(lazyImages, 'lightboxPrev');
const lightboxNext = _lw(lazyImages, 'lightboxNext');
const openCropModal = _lw(lazyImages, 'openCropModal');
const cropDraw = _lw(lazyImages, 'cropDraw');
const cropConfirm = _lw(lazyImages, 'cropConfirm');
const cropCancel = _lw(lazyImages, 'cropCancel');
const cropReset = _lw(lazyImages, 'cropReset');
const cropSetAspect = _lw(lazyImages, 'cropSetAspect');
const cropWhiteBg = _lw(lazyImages, 'cropWhiteBg');
const cropRemoveBg = _lw(lazyImages, 'cropRemoveBg');
const cropAutoEnhance = _lw(lazyImages, 'cropAutoEnhance');
const cropRotate = _lw(lazyImages, 'cropRotate');

// AI Identify
const openIdentify = _lw(lazyIdentify, 'openIdentify');
const closeIdentify = _lw(lazyIdentify, 'closeIdentify');
const idHandleCapture = _lw(lazyIdentify, 'idHandleCapture');
const idRetake = _lw(lazyIdentify, 'idRetake');
const idAnalyze = _lw(lazyIdentify, 'idAnalyze');
const idAddToInventory = _lw(lazyIdentify, 'idAddToInventory');
const idSearchPrices = _lw(lazyIdentify, 'idSearchPrices');
const quickList = _lw(lazyIdentify, 'quickList');
const idUpdateSourceScore = _lw(lazyIdentify, 'idUpdateSourceScore');

// Batch Scan
const openBatchScan = _lw(lazyBatchScan, 'openBatchScan');
const closeBatchScan = _lw(lazyBatchScan, 'closeBatchScan');
const batchAddScanned = _lw(lazyBatchScan, 'batchAddScanned');
const batchManualAdd = _lw(lazyBatchScan, 'batchManualAdd');
const batchRemoveItem = _lw(lazyBatchScan, 'batchRemoveItem');
const batchAddAll = _lw(lazyBatchScan, 'batchAddAll');

// CSV
const exportCSV = _lw(lazyCSV, 'exportCSV');
const exportAll = _lw(lazyCSV, 'exportAll');
const importCSV = _lw(lazyCSV, 'importCSV');
const importExpenseCSV = _lw(lazyCSV, 'importExpenseCSV');
const closeCsvMapper = _lw(lazyCSV, 'closeCsvMapper');
const applyCsvMapping = _lw(lazyCSV, 'applyCsvMapping');

// Barcodes
const printStickers = _lw(lazyBarcodes, 'printStickers');


// ══════════════════════════════════════════════════════════════════════════════
// EXPOSE TO WINDOW — needed for inline HTML event handlers (onclick etc.)
// ══════════════════════════════════════════════════════════════════════════════

// Expose activeDrawId as a live getter (ES module let binding changes)
Object.defineProperty(window, 'activeDrawId', { get() { return activeDrawId; }, configurable: true });

// Theme & font size
Object.assign(window, {
  toggleTheme, applyFontSize, setFsPreset, toggleFsPopover, setFont
});

// Navigation
Object.assign(window, {
  switchView, goToBreakdown, goToReports, goToStockAlert, clearStockFilt,
  bnav, toggleBnavMore, closeBnavMore
});

// Reports view
Object.assign(window, {
  renderReports, showPLReport, renderPLStatement,
  setReportMode, shiftPeriod, goToAddExpense
});

// Breakdown view
Object.assign(window, {
  renderBreakdown, toggleBdSubs, filterToCat, filterToSubcat
});

// Profit Dashboard
Object.assign(window, {
  renderProfitDashboard,
  setProfitDateRange, setProfitSearch, setProfitPlatFilter,
  setProfitCatFilter, setProfitSort
});

// Auth
Object.assign(window, {
  switchAuthTab, authSubmit, authForgotPassword, authSignOut,
  openAccountMenu, closeAccountMenu, syncNow, mobileSyncNow, resyncEBayOrders
});

// Teams
Object.assign(window, {
  openTeamPanel, closeTeamPanel,
  teamCreate: () => { const el = document.getElementById('teamNameInput'); createTeam(el ? el.value : ''); },
  teamJoin: () => { const el = document.getElementById('teamCodeInput'); joinTeam(el ? el.value : ''); },
  teamLeave: leaveTeam,
  teamDelete: deleteTeam,
  teamGenInvite: async () => {
    const sel = document.getElementById('teamInviteRole');
    const role = sel ? sel.value : 'editor';
    const invite = await generateInvite(role);
    if (invite) {
      const el = document.getElementById('teamInviteResult');
      if (el) el.innerHTML = `<div style="padding:8px;background:var(--surface);border:1px solid var(--accent);font-family:'DM Mono',monospace;font-size:14px;text-align:center;letter-spacing:3px;font-weight:700;color:var(--accent)">${escHtml(invite.code)}</div><div style="font-size:10px;color:var(--muted);text-align:center;margin-top:4px">Share this code · Expires in 7 days</div>`;
    }
  },
  teamUpdateRole: updateMemberRole,
  teamRemoveMember: removeMember
});

// Inventory view
Object.assign(window, {
  renderInv, buildChips,
  setPlatFilt, setCatFilt, setSubcatFilt, setSubsubcatFilt,
  setSort, startPriceEdit, adjStock,
  dStart, dOver, dDrop,
  toggleSel, toggleAll, clearSel, clearStockFilt,
  bulkDel, bulkSold,
  toggleBulkMenu, openBulkPrice, closeBulkPrice, previewBulkPrice, applyBulkPrice,
  openBulkCategory, closeBulkCategory, applyBulkCategory,
  openBulkPlatform, closeBulkPlatform, applyBulkPlatform,
  bulkExportCSV,
  toggleFilterPanel,
  _debouncedRenderInv,
  setSmokeFilt, setConditionFilt, daysListed
});
// Wire up the debounced inventory search (placeholder in store.js starts as no-op)
window._debouncedRenderInv = debounce(renderInv, 200);

// Drawer & editing
Object.assign(window, {
  openDrawer, closeDrawer, drawerTab, saveDrawer, delCurrent, delItem,
  syncDrawerSubcat, syncDrawerSubtype, syncAddSubcat, syncAddSubtype,
  setCondTag, toggleBulkFields, toggleListingStatus, togglePlatChip,
  _saveCustomType: saveCustomType
});

// Add item
Object.assign(window, {
  openAddModal, closeAdd, addItem,
  dupCurrent, dupItem, addFormTab,
  prevProfit, prefillFromLast, updateSmokeSlider, updateCoverSlider
});

// Sold / Sales
Object.assign(window, {
  openSoldModal, closeSold, sPriceType, onSoldItemPick,
  updateSalePriceHint, updateFeeEstimate,
  recSale, renderSalesView, delSale, undoSaleDeletion,
  toggleBundleMode, filterBundleItems, toggleBundleItem, _updateBundlePriceHint,
  setSalesSearch, setSalesDateFrom, setSalesDateTo, clearSalesFilters
});

// Expenses
Object.assign(window, { addExpense, delExpense, renderExpenses, setDefaultExpDate, setExpSearch, setExpDateFrom, setExpDateTo, clearExpFilters });

// Supplies
Object.assign(window, {
  addSupply, updateSupplyQty, setSupplyQty, delSupply, renderSupplies
});

// Modals
Object.assign(window, {
  openTrashModal, closeTrashModal, emptyTrash, restoreItem,
  openMaterialsModal, confirmMaterials, skipMaterials,
  performUndo
});

// Features: Scanner, Price Research, Identify
Object.assign(window, {
  openScanner, closeScanner, switchCamera,
  openPriceResearch, closePriceResearch, prSwitchTab,
  openPriceScanner, lookupPrices, lookupByKeyword,
  openIdentify, closeIdentify, idHandleCapture, idRetake, idAnalyze,
  idAddToInventory, idSearchPrices,
  quickList, idUpdateSourceScore
});

// Features: Images & Crop
Object.assign(window, {
  imgSlotChange, imgSlotRemove, refreshImgSlots,
  imgDragOver, imgDragLeave, imgDrop,
  openLightbox, openLightboxUrl, closeLightbox, lightboxPrev, lightboxNext,
  openCropModal, cropDraw, cropConfirm, cropCancel, cropReset, cropSetAspect,
  cropWhiteBg, cropRemoveBg, cropAutoEnhance, cropRotate,
  renderAddFormImages, renderDrawerImg
});

// Features: Batch Scan, Barcodes, CSV
Object.assign(window, {
  openBatchScan, closeBatchScan,
  batchAddScanned, batchManualAdd, batchRemoveItem, batchAddAll,
  printStickers, exportAll, exportCSV, importCSV, importExpenseCSV, closeCsvMapper, applyCsvMapping,
  downloadBackup, restoreBackup
});

// Features: Book mode, Dimensions
Object.assign(window, {
  lookupISBN, scanISBN, calcFBA, updateRankDisplay, toggleBookFields,
  setDimUnit, updateDimWeight, suggestPackaging,
  quickReprice
});

// Data layer helpers (for modules using inline handlers)
Object.assign(window, { markDirty, markDeleted });

// Crosslisting
Object.assign(window, {
  renderCrosslistDashboard, clSwitchTab, clToggleAllSingle, clSetSearch, clSetPlatFilter, clSetStatusFilter,
  clRelistItem, clDelistItem, clCycleStatus, clOpenLink, clCopyListing,
  clBulkRelistExpired, clAddTemplate, clDeleteTemplate, clSaveTemplate,
  markPlatformStatus, relistItem, copyListingText,
  clRelistFromDrawer,
  clToggleAutoRelist, clRunAutoRelist, clBulkPrice,
  enableAutoRelist, disableAutoRelist, isAutoRelistEnabled, runAutoRelist,
  bulkPriceAdjust, bulkRelistPlatform
});

// eBay Integration
Object.assign(window, {
  clEBayConnect, clEBayDisconnect, clEBaySync, clEBayResyncOrders,
  clPushToEBay, clPublishOnEBay, clEndEBayListing,
  handleEBayCallback,
});

// Etsy Integration
Object.assign(window, {
  clEtsyConnect, clEtsyDisconnect, clEtsySync,
  clPushToEtsy, clDeactivateEtsyListing, clRenewEtsyListing,
  handleEtsyCallback,
  // Etsy Phase 2: Stats, Reviews, Shipments, Tags, Qty, Photos, Price, Expenses
  clEtsySubTab, clEtsyLoadStats, clEtsyLoadReviews, clEtsyLoadShipments,
  clEtsyPushTracking, clEtsySyncQty, clEtsyPushPhotos, clEtsyPushQty,
  clEtsyPushPrice, clEtsyTagSelect, clEtsyRemoveTag, clEtsyAddTag,
  clEtsySuggestTags, clEtsySaveTags, clEtsySyncExpenses,
});

// Whatnot Integration
Object.assign(window, {
  wnToggleShow, wnNewShow, wnDeleteShow, wnStartShow, wnEndShow,
  wnMarkSold, wnMoveItem, wnRemoveItem, wnOpenItemPicker, wnCloseItemPicker,
  wnPickItem, wnCopyPrep,
  wnSwitchTab, wnEditItemNote, wnCloneShow, wnSetViewerPeak, wnSetExpenses,
  wnPrintRunSheet, wnExportShowCSV,
  wnBuilderToggle, wnBuilderSelectAll, wnBuilderClearSelection, wnBuilderCreateShow,
  wnCalcUpdate,
  exportShowPrepCSV, exportShowResultsCSV, exportAllShowsCSV,
  notifyShowEnded
});

// Phase 2: Shipping
Object.assign(window, {
  renderShippingView, shipSetSearch, shipSetPlatFilter, shipSetStatusFilter,
  shipSetDateFrom, shipSetDateTo, shipClearFilters,
  shipToggleSel, shipToggleAll, shipClearSel,
  shipMarkShipped, shipConfirmShipped, shipCancelMark,
  shipBatchMark, shipConfirmBatchMark, shipCancelBatchMark,
  shipPrintSlip, shipPrintBatchSlips, shipExportLog,
  shipCheckTracking, shipLogReturn, shipToggleReturnForm,
  printPackingSlip, openPackingSlipSettings, closePackingSlipSettings, savePackingSlipSettings,
  estimateShippingRate, suggestPackage, getCarrierOptions
});

// Phase 3: Sourcing
Object.assign(window, {
  renderSourcingView, addHaul, deleteHaul, expandHaul,
  linkItemsToHaul, confirmLinkItems, closeItemLinkModal, unlinkItem,
  srcSetSearch, srcSetSort,
  shareHaulReceipt: (id) => {
    const haul = getHaulById(id);
    if (!haul) { toast('Haul not found', true); return; }
    downloadHaulReceipt(haul);
  },
  copyHaulReceiptById: (id) => {
    const haul = getHaulById(id);
    if (!haul) { toast('Haul not found', true); return; }
    copyHaulReceipt(haul);
  },
});

// Phase 4: Tax
Object.assign(window, {
  renderTaxCenter, taxSetYear, taxSetQuarter, taxToggleScheduleC, taxExportCSV,
  taxToggleYearComparison,
  mileAddEntry, mileDeleteEntry
});

// Phase 5: Pricing Intelligence
Object.assign(window, {
  renderPriceHistoryChart, renderPriceHistoryTable,
  renderRepricingSuggestions, renderRepricingRulesManager,
  rpAddRule, rpDeleteRule, rpToggleRule, rpApplyAll, rpApplySingle, rpAddRuleFromForm
});

// Phase 6: CRM
Object.assign(window, {
  renderBuyersView, buyerAdd, buyerDelete, buyerExpand,
  buyerSetSearch, buyerSetSort, buyerLinkSale, buyerAddComm,
  renderOffersPanel, offerAdd, offerAddConfirm,
  offerAccept, offerReject, offerCounter, offerDelete, renderItemOffers
});

// Phase 7: Analytics
Object.assign(window, {
  calcSellThroughRate, calcInventoryTurnRate, calcCashFlowProjection,
  calcSeasonalTrends, calcPlatformComparison, calcVelocityByCategory,
  calcProfitByDayOfWeek, calcBestListingDay, calcRevenueForecasts, calcBreakEvenAnalysis
});

// Pre-Demo & Post-Launch Features
Object.assign(window, {
  loadDemoData, clearDemoData,
  exportPlatformCSV, exportSalesCSV, exportTaxCSV,
  toggleNotifications,
  // Stakeholder features
  startTour, endTour,
  openKPIGoalEditor, closeKPIGoalEditor, saveKPIGoals,
  toggleNotifCenter, closeNotifCenter, markAllRead, clearNotifications, addNotification,
  getSalesVelocity,
  exportPLReport, exportTaxReport,
});

// Donations
Object.assign(window, {
  openDonateModal: async (itemId) => {
    const item = getInvItem(itemId);
    if (!item) return;
    const fmv = await appPrompt({ title: 'Fair Market Value', message: `Defaults to list price ${fmt(item.price || 0)}`, defaultValue: String(item.price || 0) });
    if (fmv === null) return;
    const org = await appPrompt({ title: 'Organization Name', defaultValue: 'Charitable Organization' });
    if (org === null) return;
    donateItem(itemId, parseFloat(fmv) || item.price || 0, org || 'Charitable Organization');
  },
  getDonationTotal, renderDonationLog,
});

// Voice Add
Object.assign(window, { openVoiceAdd, closeVoiceAdd, voiceRemoveItem, voiceAddAll, voiceAddNext, voiceQueueCount });

// Community Pricing
Object.assign(window, { toggleCommunityOptIn, isCommunityOptedIn });

// Social Gallery & Seasonal Calendar
Object.assign(window, {
  openGalleryBuilder, closeGalleryBuilder, setGalleryLayout, downloadCollage, copyCollage,
  createGalleryFromSelection: () => {
    const ids = [...sel];
    if (!ids.length) { toast('Select items first', true); return; }
    openGalleryBuilder(ids);
  },
});

// Phase 8: Pro Reseller Features
Object.assign(window, {
  // Comps & Market Research
  fetchComps, suggestPrice, renderCompsPanel, renderCompsInline,
  getItemComps, clearCompsCache,
  loadDrawerComps, resetDrawerComps,
  triggerAddComps, compsUsePrice,
  // Photo Tools
  removeBackground, autoCrop, addWatermark, squarePad, adjustImage,
  renderPhotoToolsPanel, savePhotoSettings,
  // Profit Calculator
  calculateProfit, renderProfitCalc, quickProfitEstimate,
  // Death Pile
  renderDeathPileWidget, renderDeathPileView, getDeathPileStats,
  // Batch Listing
  startBatchList, batchTogglePlatform, executeBatchList, copyBatchText,
  renderBatchListPanel, clearBatchList,
  blTogglePlatform: batchTogglePlatform,
  blExecute: executeBatchList,
  blCopyAll: copyBatchText,
  blClearSelection: clearBatchList,
  // AI Listing
  generateAndApply, renderAIListingPanel, copyAIListing,
  aiGenerate: (itemId) => {
    const platform = document.getElementById('aiPlatform')?.value || '';
    const tone = document.getElementById('aiTone')?.value || 'professional';
    generateAndApply(itemId, { platform, tone }).then(() => {
      const item = getInvItem(itemId);
      if (item) {
        const panel = document.querySelector('.ai-panel');
        if (panel) panel.outerHTML = renderAIListingPanel(item);
      }
    }).catch(e => toast(e.message, true));
  },
  aiRegenerate: (itemId) => window.aiGenerate(itemId),
  aiCopyListing: copyAIListing,
  clAICopy: (itemId, platform) => {
    copyPlatformListing(itemId, platform).catch(e => toast(e.message, true));
  },
  aiGenerateDesc: async (mode) => {
    // Gather item details from the visible form (drawer or add-item)
    const pfx = mode === 'drawer' ? 'd_' : 'f_';
    const gv = id => (document.getElementById(pfx + id)?.value || '').trim();
    const fakeItem = {
      name: gv('name'), category: gv('cat'), subcategory: gv('subcat_txt') || gv('subcat'),
      condition: gv('condition'), notes: gv('notes'), brand: gv('brand'), color: gv('color'),
      size: gv('size'), material: gv('material'), model: gv('model'), style: gv('style'),
      pattern: gv('pattern'), price: parseFloat(gv('price')) || 0,
    };
    if (!fakeItem.name) { toast('Enter an item name first', true); return; }
    const ta = document.getElementById(pfx + 'ebay_desc');
    try {
      toast('Generating AI description…');
      const result = await generateListing(fakeItem, { platform: 'eBay' });
      if (result.description && ta) {
        ta.value = result.description;
        toast('AI description generated ✓');
      }
    } catch (e) { toast('AI generation failed: ' + e.message, true); }
  },
  // Inventory Value
  renderInventoryValueDashboard,
  // Shipping Labels
  estimateRates, getCheapestRate, renderRateComparison,
  recordLabelCost, getShippingCostSummary, saveShipLabelSettings,
  // Photo tool action handlers
  ptRemoveBg: async (itemId) => {
    const item = getInvItem(itemId);
    if (!item?.image) return;
    toast('Removing background…');
    try {
      const result = await removeBackground(item.image);
      document.getElementById('ptPreview').src = result;
      item.image = result;
      markDirty('inv', itemId);
      save();
      toast('Background removed ✓');
    } catch (e) { toast('BG removal failed: ' + e.message, true); }
  },
  ptAutoCrop: async (itemId) => {
    const item = getInvItem(itemId);
    if (!item?.image) return;
    try {
      const result = await autoCrop(item.image);
      document.getElementById('ptPreview').src = result;
      item.image = result;
      markDirty('inv', itemId);
      save();
      toast('Auto-cropped ✓');
    } catch (e) { toast('Crop failed: ' + e.message, true); }
  },
  ptWatermark: async (itemId) => {
    const item = getInvItem(itemId);
    if (!item?.image) return;
    try {
      const result = await addWatermark(item.image);
      document.getElementById('ptPreview').src = result;
      item.image = result;
      markDirty('inv', itemId);
      save();
      toast('Watermark added ✓');
    } catch (e) { toast('Watermark failed: ' + e.message, true); }
  },
  ptSquare: async (itemId) => {
    const item = getInvItem(itemId);
    if (!item?.image) return;
    try {
      const result = await squarePad(item.image);
      document.getElementById('ptPreview').src = result;
      item.image = result;
      markDirty('inv', itemId);
      save();
      toast('Square padded ✓');
    } catch (e) { toast('Square pad failed: ' + e.message, true); }
  },
  ptAdjustPreview: async (itemId) => {
    const item = getInvItem(itemId);
    if (!item?.image) return;
    const brightness = parseInt(document.getElementById('ptBrightness')?.value || '0');
    const contrast = parseInt(document.getElementById('ptContrast')?.value || '0');
    if (brightness || contrast) {
      const result = await adjustImage(item.image, { brightness, contrast });
      document.getElementById('ptPreview').src = result;
    }
  },
});

// Phase 9: Analytics & Intelligence
Object.assign(window, {
  renderInventoryHealth,
  renderSourcingAnalytics,
  renderPlatformROI,
  renderPeriodCompare,
  renderReturns, openReturnModal, closeReturnModal, submitReturn,
  renderListingScores, scoreItem,
  renderMarginAlerts, updateMarginThreshold, initMarginAlerts,
});

// Relist from within the drawer modal
function clRelistFromDrawer(itemId, platform) {
  relistItem(itemId, platform);
  save(); refresh();
  toast(`Relisted on ${platform} ✓`);
  // Re-render the drawer's listing status if still open
  const item = getInvItem(itemId);
  if (item) renderListingStatus(item);
}


// ══════════════════════════════════════════════════════════════════════════════
// VIEW SWITCHING
// ══════════════════════════════════════════════════════════════════════════════

function switchView(name, el) {
  // Subscription gating — block access to locked views
  if (window.isViewGated && window.isViewGated(name)) {
    window.showUpgradePrompt(name);
    return;
  }

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name)?.classList.add('active');

  // Remember current view so page refresh restores it
  try { localStorage.setItem('ft_view', name); } catch (_) {}
  try { history.replaceState(null, '', '#' + name); } catch (_) {}

  // On mobile, hide stats-grid for non-dashboard views to free screen space
  const sg = document.querySelector('.stats-grid');
  if (sg) sg.classList.toggle('not-dash', name !== 'dashboard');

  // Update grouped nav: clear all active menu items, set new one, update group highlights
  document.querySelectorAll('.nav-menu-item').forEach(mi => { mi.classList.remove('active'); mi.removeAttribute('aria-current'); });
  const activeItem = document.querySelector(`.nav-menu-item[data-view="${name}"]`);
  if (activeItem) { activeItem.classList.add('active'); activeItem.setAttribute('aria-current', 'page'); }

  // Mark parent group as having an active child
  document.querySelectorAll('.nav-group').forEach(g => g.classList.remove('has-active'));
  if (activeItem) {
    const parentGroup = activeItem.closest('.nav-group');
    if (parentGroup) parentGroup.classList.add('has-active');
  }

  // Legacy .nav-tab support (mobile bottom nav)
  document.querySelectorAll('.nav-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); t.setAttribute('tabindex', '-1'); });
  if (el && el.classList.contains('nav-tab')) { el.classList.add('active'); el.setAttribute('aria-selected', 'true'); el.setAttribute('tabindex', '0'); }

  if (name === 'inventory') renderInv();
  else if (name === 'sales') renderSalesView();
  else if (name === 'expenses') renderExpenses();
  else if (name === 'supplies') { renderSupplies(); checkSupplyAlerts(); }
  else if (name === 'insights') renderInsights();
  else if (name === 'reports') renderReports();
  else if (name === 'breakdown') renderBreakdown();
  else if (name === 'dashboard') renderDash();
  else if (name === 'profit') renderProfitDashboard();
  else if (name === 'crosslist') renderCrosslistDashboard();
  else if (name === 'shipping') renderShippingView();
  else if (name === 'sourcing') renderSourcingView();
  else if (name === 'tax') renderTaxCenter();
  else if (name === 'buyers') renderBuyersView();
  else if (name === 'invvalue') {
    const el2 = document.getElementById('invValueContent');
    if (el2) el2.innerHTML = renderInventoryValueDashboard();
  }
  else if (name === 'invhealth') renderInventoryHealth();
  else if (name === 'sourcinganalytics') renderSourcingAnalytics();
  else if (name === 'platformroi') renderPlatformROI();
  else if (name === 'periodcompare') renderPeriodCompare();
  else if (name === 'returns') renderReturns();
  else if (name === 'listingscore') renderListingScores();
  else if (name === 'marginalerts') renderMarginAlerts();

  // Update page title for screen readers
  document.title = `FlipTrack — ${name.charAt(0).toUpperCase() + name.slice(1)}`;
}
window.switchView = switchView;

// Re-render whichever view is currently active (called after sync to refresh stale views)
// Bypasses gating since this is a re-render, not a new navigation
window.renderCurrentView = function() {
  const hash = location.hash.replace('#', '');
  const current = (hash && document.getElementById('view-' + hash)) ? hash
    : localStorage.getItem('ft_view') || 'dashboard';
  const origGate = window.isViewGated;
  window.isViewGated = undefined;
  try { switchView(current, null); } finally { window.isViewGated = origGate; }
};

// ── Grouped nav dropdown logic ──────────────────────────────────────────────
function toggleNavGroup(groupName) {
  const group = document.querySelector(`.nav-group[data-group="${groupName}"]`);
  if (!group) return;
  const wasOpen = group.classList.contains('open');
  // Close all groups first
  closeAllNavGroups();
  if (!wasOpen) {
    group.classList.add('open');
    const btn = group.querySelector('.nav-group-btn');
    if (btn) btn.setAttribute('aria-expanded', 'true');

    // On mobile, .header-right has overflow:auto which clips the absolute menu.
    // Reposition as fixed so it escapes the overflow container.
    const menu = group.querySelector('.nav-group-menu');
    if (menu && window.innerWidth <= 768) {
      const rect = btn.getBoundingClientRect();
      menu.style.position = 'fixed';
      menu.style.top = (rect.bottom + 4) + 'px';
      menu.style.right = (window.innerWidth - rect.right) + 'px';
      menu.style.left = 'auto';
    }

    // Close on outside tap/click — use pointerdown for reliable iOS PWA support
    const close = (e) => {
      if (!group.contains(e.target)) {
        group.classList.remove('open');
        if (btn) btn.setAttribute('aria-expanded', 'false');
        // Reset fixed positioning
        if (menu) { menu.style.position = ''; menu.style.top = ''; menu.style.right = ''; }
        document.removeEventListener('pointerdown', close);
      }
    };
    // Use rAF to skip the current event cycle (setTimeout(0) races on iOS PWA)
    requestAnimationFrame(() => {
      document.addEventListener('pointerdown', close);
    });
  }
}
function closeAllNavGroups() {
  document.querySelectorAll('.nav-group').forEach(g => {
    g.classList.remove('open');
    const btn = g.querySelector('.nav-group-btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    // Reset any fixed positioning applied for mobile
    const menu = g.querySelector('.nav-group-menu');
    if (menu) { menu.style.position = ''; menu.style.top = ''; menu.style.right = ''; }
  });
}
function navTo(viewName, btnEl) {
  closeAllNavGroups();
  switchView(viewName, null);
}
Object.assign(window, { toggleNavGroup, closeAllNavGroups, navTo });

function goToBreakdown() {
  switchView('breakdown', null);
  bnav('bn-more-breakdown');
}

function goToReports() {
  switchView('reports', null);
  bnav('bn-more-reports');
}

function goToStockAlert() {
  setStockFilt('low');
  switchView('inventory', null);
  bnav('bn-inventory');
}

function clearStockFilt() {
  clearStockFilter();
}


// ══════════════════════════════════════════════════════════════════════════════
// THEME + FONT SIZE (kept in main since they're small and global)
// ══════════════════════════════════════════════════════════════════════════════

function toggleTheme() {
  const root = document.documentElement;
  const isLight = root.getAttribute('data-theme') !== 'light';
  root.setAttribute('data-theme', isLight ? 'light' : 'dark');
  localStorage.setItem('ft_theme', isLight ? 'light' : 'dark');
  updateThemeLabels();
}

function updateThemeLabels() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = isLight ? '🌙' : '☀';
}

function applyFontSize(val, doSave = true) {
  const v = parseInt(val) || 100;
  const scale = v / 100;                       // 0.8 | 1.0 | 1.15 | 1.3
  document.documentElement.style.setProperty('--fs', v);
  // Zoom content areas only — header, nav, modals chrome stay at 1×
  document.querySelectorAll('.view, .drawer-bd, .modal-bd').forEach(el => {
    el.style.zoom = scale;
  });
  document.getElementById('fsSlider').value = v;
  document.querySelectorAll('.fs-preset').forEach(b => {
    b.classList.toggle('active', parseInt(b.textContent === 'Small' ? 80 : b.textContent === 'Default' ? 100 : b.textContent === 'Large' ? 115 : 130) === v);
  });
  if (doSave) localStorage.setItem('ft_fs', v);
}

function setFsPreset(val) { applyFontSize(val); }

function toggleFsPopover() {
  document.getElementById('fsPopover')?.classList.toggle('on');
}

function setFont(font, doSave = true) {
  if (font === 'dyslexic') {
    document.body.classList.add('font-dyslexic');
    document.getElementById('fopt-dyslexic')?.classList.add('active');
    document.getElementById('fopt-default')?.classList.remove('active');
    const hint = document.getElementById('fopt-hint');
    if (hint) hint.style.display = '';
  } else {
    document.body.classList.remove('font-dyslexic');
    document.getElementById('fopt-default')?.classList.add('active');
    document.getElementById('fopt-dyslexic')?.classList.remove('active');
    const hint = document.getElementById('fopt-hint');
    if (hint) hint.style.display = 'none';
  }
  if (doSave) localStorage.setItem('ft_font', font);
}


// ══════════════════════════════════════════════════════════════════════════════
// GLOBAL SEARCH
// ══════════════════════════════════════════════════════════════════════════════

let _gsOpen = false;

function toggleGlobalSearch() {
  _gsOpen ? closeGlobalSearch() : openGlobalSearch();
}

function openGlobalSearch() {
  _gsOpen = true;
  document.getElementById('globalSearchPanel')?.classList.add('on');
  document.getElementById('gsBackdrop')?.classList.add('on');
  const inp = document.getElementById('globalSearchInput');
  if (inp) { inp.value = ''; inp.focus(); }
  document.getElementById('globalSearchResults').innerHTML = '';
}

function closeGlobalSearch() {
  _gsOpen = false;
  document.getElementById('globalSearchPanel')?.classList.remove('on');
  document.getElementById('gsBackdrop')?.classList.remove('on');
}

function _globalSearch(q) {
  const el = document.getElementById('globalSearchResults');
  if (!el) return;
  if (!q || q.length < 2) { el.innerHTML = ''; return; }
  const ql = q.toLowerCase();
  const results = [];

  // Search inventory
  const invMatches = inv.filter(i =>
    i.name?.toLowerCase().includes(ql) ||
    (i.sku||'').toLowerCase().includes(ql) ||
    (i.upc||'').toLowerCase().includes(ql) ||
    (i.category||'').toLowerCase().includes(ql)
  ).slice(0, 5);
  if (invMatches.length) {
    results.push('<div class="gs-group-label">Inventory</div>');
    for (const i of invMatches) {
      const { m } = calc(i);
      results.push(`<div class="gs-item" onclick="closeGlobalSearch();navTo('inventory');setTimeout(()=>{openDrawer('${escAttr(i.id)}')},80)">
        <span class="gs-item-icon">📦</span>
        <div class="gs-item-info"><div class="gs-item-title">${escHtml(i.name)}</div><div class="gs-item-sub">${escHtml(i.sku||'')} · ${escHtml(i.category||'Uncategorized')}</div></div>
        <span class="gs-item-badge" style="background:rgba(87,200,255,0.1);color:var(--accent)">${fmt(i.price)}</span>
      </div>`);
    }
  }

  // Search sales
  const saleMatches = sales.filter(s => {
    const it = getInvItem(s.itemId);
    return it?.name?.toLowerCase().includes(ql) || (s.platform||'').toLowerCase().includes(ql);
  }).slice(0, 5);
  if (saleMatches.length) {
    results.push('<div class="gs-group-label">Sales</div>');
    for (const s of saleMatches) {
      const it = getInvItem(s.itemId);
      results.push(`<div class="gs-item" onclick="closeGlobalSearch();navTo('sales')">
        <span class="gs-item-icon">💸</span>
        <div class="gs-item-info"><div class="gs-item-title">${escHtml(it?.name||'Deleted Item')}</div><div class="gs-item-sub">${escHtml(s.platform||'')} · ${escHtml(s.date||'')}</div></div>
        <span class="gs-item-badge" style="background:rgba(0,200,136,0.1);color:var(--good)">${fmt(s.price)}</span>
      </div>`);
    }
  }

  // Search expenses
  const expMatches = expenses.filter(ex =>
    (ex.description||'').toLowerCase().includes(ql) ||
    (ex.category||'').toLowerCase().includes(ql)
  ).slice(0, 3);
  if (expMatches.length) {
    results.push('<div class="gs-group-label">Expenses</div>');
    for (const ex of expMatches) {
      results.push(`<div class="gs-item" onclick="closeGlobalSearch();navTo('expenses')">
        <span class="gs-item-icon">🧾</span>
        <div class="gs-item-info"><div class="gs-item-title">${escHtml(ex.description||'Expense')}</div><div class="gs-item-sub">${escHtml(ex.category||'')} · ${escHtml(ex.date||'')}</div></div>
        <span class="gs-item-badge" style="background:rgba(255,107,107,0.1);color:var(--bad)">-${fmt(ex.amount)}</span>
      </div>`);
    }
  }

  if (!results.length) {
    el.innerHTML = '<div class="gs-no-results">No results for "' + escHtml(q) + '"</div>';
  } else {
    el.innerHTML = results.join('');
  }
}

const globalSearchDebounced = debounce((q) => _globalSearch(q), 200);

// Ctrl+K / Cmd+K shortcut for global search
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    toggleGlobalSearch();
  }
  if (e.key === 'Escape' && _gsOpen) {
    closeGlobalSearch();
  }
});

Object.assign(window, { toggleGlobalSearch, openGlobalSearch, closeGlobalSearch, globalSearchDebounced });


// ══════════════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════════════

// Restore saved preferences (try/catch for private browsing where localStorage may throw)
try {
  const savedTheme = localStorage.getItem('ft_theme');
  if (savedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  updateThemeLabels();

  // Clear legacy zoom if it was set by older code
  document.documentElement.style.zoom = '';
  const savedFs = localStorage.getItem('ft_fs');
  if (savedFs) applyFontSize(savedFs, false);

  const savedFont = localStorage.getItem('ft_font');
  if (savedFont) setFont(savedFont, false);
} catch (_) { /* localStorage may not be available in private browsing */ }

// Set current date
document.getElementById('currentDate').textContent =
  new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });

// Init expense date
setDefaultExpDate();

// ── SPLASH SCREEN HELPER ──
function _killSplash() {
  const s = document.getElementById('splash');
  if (!s) return;
  s.style.opacity = '0';
  s.style.pointerEvents = 'none';
  setTimeout(() => s.remove(), 600);
}
// Safety net: dismiss splash after 3 seconds no matter what
setTimeout(_killSplash, 3000);

// ── ASYNC BOOT: Load data from IndexedDB, then render ──
(async function boot() {
  try {
    // Load data from IndexedDB (migrates from localStorage on first run)
    await initStore();
  } catch (e) {
    console.warn('FlipTrack: Store init error:', e.message);
  }

  try {

  // Normalize category names to prevent duplicates (e.g., "Men's Clothing" vs "Men's clothing")
  try { const n = normalizeAllCategories(); if (n > 0) { save(); console.log(`FlipTrack: Normalized ${n} category names`); } } catch(e) {}

  // Build initial state — restore last viewed page on refresh
  try {
    rebuildInvIndex(); refresh();
    const hash = location.hash.replace('#', '');
    const savedView = (hash && document.getElementById('view-' + hash)) ? hash
      : localStorage.getItem('ft_view');
    if (savedView && savedView !== 'dashboard' && document.getElementById('view-' + savedView)) {
      // Temporarily bypass subscription gating during boot — tier hasn't loaded yet.
      // After auth init the correct tier is applied and nav locks enforced.
      const origGate = window.isViewGated;
      window.isViewGated = undefined;
      try { switchView(savedView); } finally { window.isViewGated = origGate; }
    } else {
      renderDash();
    }
  } catch(e) { console.warn('FlipTrack: render error:', e.message); }

  // Dismiss splash screen (always — even if boot partially fails)
  _killSplash();

  // First-run onboarding
  try {
    if (!localStorage.getItem('ft_welcomed')) {
      const wOv = document.getElementById('welcomeOv');
      if (wOv) wOv.style.display = '';
    }
  } catch (_) {}
  window.dismissWelcome = function () {
    try { localStorage.setItem('ft_welcomed', '1'); } catch (_) {}
    const wOv = document.getElementById('welcomeOv');
    if (wOv) { wOv.style.opacity = '0'; setTimeout(() => wOv.remove(), 300); }
  };

  // Bottom nav visibility (listener already registered at module eval in bnav.js)
  updateBnavVisibility();

  // Online/offline (listeners already registered at module eval in offline.js)
  if (!navigator.onLine) updateOnlineStatus();

  // Platform pickers
  initPlatPickers();

  // Boot auth (connects Supabase, starts realtime) — MUST await to prevent race conditions
  try { await initAuth(); } catch (e) { console.warn('FlipTrack: auth init error:', e.message); }
  try { const { setupAuthEventListeners } = await import('./data/auth.js'); setupAuthEventListeners(); } catch (_) {}

  // Handle post-checkout redirect — re-fetch tier and show success toast
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('upgrade') === 'success') {
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
    // Re-load tier after a short delay (Stripe webhook may still be processing)
    setTimeout(async () => {
      try {
        const { loadUserTier, applyNavLocks, getUserTier } = await import('./utils/gate.js');
        await loadUserTier();
        applyNavLocks();
        const tier = getUserTier();
        const names = { pro: 'Pro', unlimited: 'Unlimited' };
        toast(`Welcome to FlipTrack ${names[tier] || tier}! All features are now unlocked.`);
        // Initialize Pro features that were deferred for Free tier
        if (tier !== 'free') {
          try {
            await Promise.all([
              initHauls(), initMileageLog(), initRepricingRules(),
              initBuyers(), initOffers(), initPackingSlipSettings(),
              initWhatnotShows(), initPhotoSettings(), initShipLabels(),
            ]);
            initShippingModals();
          } catch (_e) { /* already logged */ }
        }
      } catch (e) { console.warn('Post-checkout tier refresh:', e.message); }
    }, 2000);
  } else if (urlParams.get('upgrade') === 'cancelled') {
    window.history.replaceState({}, '', window.location.pathname);
  }

  // Set up offline mutation queue auto-replay
  try { initOfflineQueue(); } catch (e) { console.warn('FlipTrack: offline queue init error:', e.message); toast('Offline mode unavailable — edits require internet', true); }

  // Initialize crosslisting
  try { await initTemplates(); } catch (e) { console.warn('FlipTrack: templates init error:', e.message); }
  try { initListingDates(); checkExpiredListings(); } catch (e) { console.warn('FlipTrack: listing dates error:', e.message); }

  // Initialize feature modules (Pro/Unlimited features deferred for Free tier)
  const _tier = window.getUserTier?.() || 'free';
  try {
    // Core features — always init
    const coreInits = [initEBaySync(), initEtsySync()];
    // Pro+ features — only init for paid tiers
    if (_tier !== 'free') {
      coreInits.push(
        initHauls(),
        initMileageLog(),
        initRepricingRules(),
        initBuyers(),
        initOffers(),
        initPackingSlipSettings(),
        initWhatnotShows(),
        initPhotoSettings(),
        initShipLabels(),
      );
    }
    await Promise.all(coreInits);
  } catch (e) { console.warn('FlipTrack: feature module init error:', e.message); }
  if (_tier !== 'free') {
    try { initShippingModals(); } catch (e) { console.warn('FlipTrack: shipping modals error:', e.message); }
    // Re-render dashboard after Pro features init so offer aging alert shows
    if (typeof window.renderCurrentView === 'function') window.renderCurrentView();
  }

  // Demo data trigger removed — was causing unwanted prompts

  // Margin alerts threshold init (reads from localStorage — works on all tiers)
  initMarginAlerts();

  // Stock alert notifications (if enabled)
  startStockAlertChecks();

  // Initialize notification center, sync indicator, and onboarding tour
  initNotificationCenter();
  checkWhatnotShowReminders(getTodayShows);
  startSyncIndicator();
  maybeStartTour();

  // Initialize eBay OAuth + AI Listing (non-blocking)
  const _sbClient = (await import('./data/auth.js')).getSupabaseClient();
  if (_sbClient) {
    initEBayAuth(_sbClient).then(async () => {
      if (isEBayConnected()) startEBaySyncInterval();
      // Handle eBay OAuth redirect callback (mobile flow)
      const urlParams = new URLSearchParams(window.location.search);
      const ebayCode = urlParams.get('ebay_code');
      if (ebayCode) {
        const ebayState = urlParams.get('ebay_state');
        // Clean URL params
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('ebay_code');
        cleanUrl.searchParams.delete('ebay_state');
        history.replaceState(null, '', cleanUrl.toString());
        // Process callback
        await handleEBayCallback(ebayCode, ebayState);
        if (isEBayConnected()) startEBaySyncInterval();
      }
    }).catch(e => { console.warn('eBay init:', e.message); if (typeof toast === 'function') toast('eBay connection failed — reconnect in Settings', true); });
    initEtsyAuth(_sbClient).then(async () => {
      const { getEtsyShopId } = await import('./features/etsy-auth.js');
      if (isEtsyConnected() && getEtsyShopId()) {
        startEtsySyncInterval();
        syncEtsyExpenses().catch(e => { console.warn('Etsy expense sync:', e.message); toast('Etsy expense sync failed — try again later', true); });
      } else if (isEtsyConnected() && !getEtsyShopId()) {
        console.warn('Etsy connected but no shop ID cached — sync deferred until status verified.');
      }
      // Handle Etsy OAuth redirect callback (mobile flow)
      const etsyParams = new URLSearchParams(window.location.search);
      const etsyCode = etsyParams.get('etsy_code');
      if (etsyCode) {
        const etsyState = etsyParams.get('etsy_state');
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('etsy_code');
        cleanUrl.searchParams.delete('etsy_state');
        history.replaceState(null, '', cleanUrl.toString());
        await handleEtsyCallback(etsyCode, etsyState);
        if (isEtsyConnected() && getEtsyShopId()) startEtsySyncInterval();
      }
    }).catch(e => { console.warn('Etsy init:', e.message); if (typeof toast === 'function') toast('Etsy connection failed — reconnect in Settings', true); });
    initAIListing(_sbClient);
  }

  } catch (bootErr) {
    console.warn('FlipTrack: boot error:', bootErr.message || bootErr);
  }
})();

// PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .catch(err => console.warn('SW registration failed:', err));
  });
}

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────
(function () {
  let lastErr = 0;
  function showError(msg) {
    // Throttle to avoid toast spam
    if (Date.now() - lastErr < 3000) return;
    lastErr = Date.now();
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast err on';
    setTimeout(() => t.classList.remove('on'), 4000);
  }
  window.addEventListener('error', (e) => {
    console.error('FlipTrack global error:', e.error || e.message);
    showError('Something went wrong — your data is safe.');
  });
  window.addEventListener('unhandledrejection', (e) => {
    const msg = String(e.reason?.message || e.reason || '');
    // Auth failures — tell the user so edits aren't silently lost
    const authFail = /401|not authenticated|session expired/i;
    if (authFail.test(msg)) {
      e.preventDefault();
      console.warn('FlipTrack (auth):', msg);
      toast('Session expired — please sign in again to save changes', true);
      return;
    }
    // Truly harmless: SW registration, network offline
    const harmless = /sw.*regist|service.worker|networkerror|failed to fetch|load failed/i;
    if (harmless.test(msg)) {
      e.preventDefault();
      console.warn('FlipTrack (suppressed):', msg);
      return;
    }
    console.error('FlipTrack unhandled rejection:', e.reason);
    showError('A background task failed — retrying automatically.');
  });
})();
