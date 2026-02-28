/**
 * FlipTrack — main.js
 * Entry point: imports all modules, CSS, and exposes functions to window
 * for inline HTML event handlers (onclick, onchange, oninput).
 */

// ── CSS (Vite handles bundling) ───────────────────────────────────────────────
import './styles/index.css';

// ── Config ────────────────────────────────────────────────────────────────────
import { SB_URL, SB_KEY, IMG_BUCKET } from './config/constants.js';
import { PLATFORMS, PLATFORM_GROUPS, platCls, PLATFORM_FEES, calcPlatformFee } from './config/platforms.js';
import { CLOTHING_TYPES, CAT_TREE, SUBCATS, SUBSUBCATS } from './config/categories.js';

// ── Utilities ─────────────────────────────────────────────────────────────────
import { fmt, pct, uid, ds, escHtml, debounce } from './utils/format.js';
import { toast, trapFocus, releaseFocus } from './utils/dom.js';
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
  _debouncedRenderInv
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
  toggleFilterPanel, openFilterPanel, updateFiltersBadge,
  setStockFilt, clearStockFilter
} from './views/inventory.js';
import {
  openSoldModal, closeSold, sPriceType,
  updateSalePriceHint, updateFeeEstimate,
  recSale, renderSalesView,
  setSalesSearch, setSalesDateFrom, setSalesDateTo, clearSalesFilters
} from './views/sales.js';
import { renderInsights } from './views/insights.js';
import {
  setDefaultExpDate, addExpense, delExpense, renderExpenses,
  setExpSearch, setExpDateFrom, setExpDateTo, clearExpFilters
} from './views/expenses.js';
import {
  renderReports, showPLReport, renderPLStatement,
  setReportMode, shiftPeriod, goToAddExpense,
  delSale, delItem
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
  populateSubcatSelect, populateSubtypeSelect,
  syncDrawerSubcat, syncDrawerSubtype,
  syncAddSubcat, syncAddSubtype,
  renderListingStatus, toggleListingStatus, getListingStatusFromDrawer,
  setCondTag, loadCondTag
} from './modals/drawer.js';
import {
  dupCurrent, dupItem, addFormTab,
  openAddModal, closeAdd,
  toggleBulkFields, prevProfit, prefillFromLast,
  addItem
} from './modals/add-item.js';
import {
  isBookCat, toggleBookFields, swapConditionTags,
  updateRankDisplay, lookupISBN, calcFBA,
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
  markPlatformStatus, relistItem, setListingDate
} from './features/crosslist.js';
import { generateListingLink, copyListingText } from './features/deep-links.js';
import { initTemplates } from './features/listing-templates.js';
import {
  renderCrosslistDashboard, clSwitchTab, clSetSearch, clSetPlatFilter, clSetStatusFilter,
  clRelistItem, clDelistItem, clCycleStatus, clOpenLink, clCopyListing,
  clBulkRelistExpired, clAddTemplate, clDeleteTemplate,
  clEBayConnect, clEBayDisconnect, clEBaySync, clPushToEBay, clPublishOnEBay, clEndEBayListing,
  clEtsyConnect, clEtsyDisconnect, clEtsySync, clPushToEtsy, clDeactivateEtsyListing, clRenewEtsyListing
} from './views/crosslist-dashboard.js';
import { initEBayAuth, handleEBayCallback, isEBayConnected } from './features/ebay-auth.js';
import { initEBaySync, startEBaySyncInterval } from './features/ebay-sync.js';
import { initEtsyAuth, handleEtsyCallback, isEtsyConnected } from './features/etsy-auth.js';
import { initEtsySync, startEtsySyncInterval } from './features/etsy-sync.js';
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
  shipPrintSlip, shipPrintBatchSlips, shipExportLog
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
  srcSetSearch, srcSetSort
} from './views/sourcing.js';
import { getHaulROI, getHaulItems, splitCost, getSourceStats, getBestSources } from './features/haul.js';

// ── Phase 4: Tax & Bookkeeping ───────────────────────────────────────────────
import {
  renderTaxCenter, taxSetYear, taxSetQuarter, taxToggleScheduleC, taxExportCSV
} from './views/tax-center.js';
import {
  initMileageLog, mileAddEntry, mileDeleteEntry,
  getMileageSummary, getMileageDeduction
} from './features/mileage.js';

// ── Phase 5: Pricing Intelligence & Repricing ───────────────────────────────
import { logPriceChange, logSalePrice, renderPriceHistoryChart, renderPriceHistoryTable } from './features/price-history.js';
import {
  initRepricingRules, renderRepricingSuggestions, renderRepricingRulesManager,
  rpAddRule, rpDeleteRule, rpToggleRule, rpApplyAll, rpApplySingle, evaluateRules
} from './features/repricing-rules.js';

// ── Phase 6: Customer & Offer Management ─────────────────────────────────────
import {
  renderBuyersView, initBuyers, buyerAdd, buyerDelete, buyerExpand,
  buyerSetSearch, buyerSetSort, buyerLinkSale
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
import { fetchComps, suggestPrice, renderCompsPanel, getItemComps, clearCompsCache } from './features/comps.js';
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
  initAIListing, generateListing, generateAndApply, renderAIListingPanel, copyAIListing, isGenerating
} from './features/ai-listing.js';
import { getInventoryValueData, renderInventoryValueDashboard } from './features/inventory-value.js';
import {
  initShipLabels, estimateRates, getCheapestRate, renderRateComparison,
  getPirateShipLink, getPayPalShipLink, getEBayShipLink,
  recordLabelCost, getShippingCostSummary, saveShipLabelSettings
} from './features/ship-labels.js';

// ── Features (lazy-loaded — heavy modules loaded on first use) ──────────────
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
const openCropModal = _lw(lazyImages, 'openCropModal');
const cropDraw = _lw(lazyImages, 'cropDraw');
const cropConfirm = _lw(lazyImages, 'cropConfirm');
const cropCancel = _lw(lazyImages, 'cropCancel');
const cropReset = _lw(lazyImages, 'cropReset');
const cropSetAspect = _lw(lazyImages, 'cropSetAspect');

// AI Identify
const openIdentify = _lw(lazyIdentify, 'openIdentify');
const closeIdentify = _lw(lazyIdentify, 'closeIdentify');
const idHandleCapture = _lw(lazyIdentify, 'idHandleCapture');
const idRetake = _lw(lazyIdentify, 'idRetake');
const idAnalyze = _lw(lazyIdentify, 'idAnalyze');
const idAddToInventory = _lw(lazyIdentify, 'idAddToInventory');
const idSearchPrices = _lw(lazyIdentify, 'idSearchPrices');

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

// Auth
Object.assign(window, {
  switchAuthTab, authSubmit, authForgotPassword, authSignOut,
  openAccountMenu, closeAccountMenu, syncNow, mobileSyncNow
});

// Inventory view
Object.assign(window, {
  renderInv, buildChips,
  setPlatFilt, setCatFilt, setSubcatFilt, setSubsubcatFilt,
  setSort, startPriceEdit, adjStock,
  dStart, dOver, dDrop,
  toggleSel, toggleAll, clearSel, clearStockFilt,
  bulkDel, bulkSold,
  toggleFilterPanel,
  _debouncedRenderInv
});

// Drawer & editing
Object.assign(window, {
  openDrawer, closeDrawer, drawerTab, saveDrawer, delCurrent, delItem,
  syncDrawerSubcat, syncDrawerSubtype, syncAddSubcat, syncAddSubtype,
  setCondTag, toggleBulkFields
});

// Add item
Object.assign(window, {
  openAddModal, closeAdd, addItem,
  dupCurrent, dupItem, addFormTab,
  prevProfit, prefillFromLast
});

// Sold / Sales
Object.assign(window, {
  openSoldModal, closeSold, sPriceType,
  updateSalePriceHint, updateFeeEstimate,
  recSale, renderSalesView, delSale,
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
  openTrashModal, closeTrashModal, emptyTrash,
  openMaterialsModal, confirmMaterials, skipMaterials,
  performUndo
});

// Features: Scanner, Price Research, Identify
Object.assign(window, {
  openScanner, closeScanner, switchCamera,
  openPriceResearch, closePriceResearch, prSwitchTab,
  openPriceScanner, lookupPrices, lookupByKeyword,
  openIdentify, closeIdentify, idHandleCapture, idRetake, idAnalyze,
  idAddToInventory, idSearchPrices
});

// Features: Images & Crop
Object.assign(window, {
  imgSlotChange, imgSlotRemove, refreshImgSlots,
  imgDragOver, imgDragLeave, imgDrop,
  openLightbox, openLightboxUrl, closeLightbox,
  openCropModal, cropDraw, cropConfirm, cropCancel, cropReset, cropSetAspect,
  renderAddFormImages, renderDrawerImg
});

// Features: Batch Scan, Barcodes, CSV
Object.assign(window, {
  openBatchScan, closeBatchScan,
  batchAddScanned, batchManualAdd, batchRemoveItem, batchAddAll,
  printStickers, exportAll, exportCSV, importCSV
});

// Features: Book mode, Dimensions
Object.assign(window, {
  lookupISBN, calcFBA, updateRankDisplay, toggleBookFields,
  setDimUnit, updateDimWeight, suggestPackaging,
  quickReprice
});

// Data layer helpers (for modules using inline handlers)
Object.assign(window, { markDirty, markDeleted });

// Crosslisting
Object.assign(window, {
  renderCrosslistDashboard, clSwitchTab, clSetSearch, clSetPlatFilter, clSetStatusFilter,
  clRelistItem, clDelistItem, clCycleStatus, clOpenLink, clCopyListing,
  clBulkRelistExpired, clAddTemplate, clDeleteTemplate,
  markPlatformStatus, relistItem, copyListingText,
  clRelistFromDrawer
});

// eBay Integration
Object.assign(window, {
  clEBayConnect, clEBayDisconnect, clEBaySync,
  clPushToEBay, clPublishOnEBay, clEndEBayListing,
  handleEBayCallback,
});

// Etsy Integration
Object.assign(window, {
  clEtsyConnect, clEtsyDisconnect, clEtsySync,
  clPushToEtsy, clDeactivateEtsyListing, clRenewEtsyListing,
  handleEtsyCallback,
});

// Phase 2: Shipping
Object.assign(window, {
  renderShippingView, shipSetSearch, shipSetPlatFilter, shipSetStatusFilter,
  shipSetDateFrom, shipSetDateTo, shipClearFilters,
  shipToggleSel, shipToggleAll, shipClearSel,
  shipMarkShipped, shipConfirmShipped, shipCancelMark,
  shipBatchMark, shipConfirmBatchMark, shipCancelBatchMark,
  shipPrintSlip, shipPrintBatchSlips, shipExportLog,
  printPackingSlip, openPackingSlipSettings, closePackingSlipSettings, savePackingSlipSettings,
  estimateShippingRate, suggestPackage, getCarrierOptions
});

// Phase 3: Sourcing
Object.assign(window, {
  renderSourcingView, addHaul, deleteHaul, expandHaul,
  linkItemsToHaul, confirmLinkItems, closeItemLinkModal, unlinkItem,
  srcSetSearch, srcSetSort
});

// Phase 4: Tax
Object.assign(window, {
  renderTaxCenter, taxSetYear, taxSetQuarter, taxToggleScheduleC, taxExportCSV,
  mileAddEntry, mileDeleteEntry
});

// Phase 5: Pricing Intelligence
Object.assign(window, {
  renderPriceHistoryChart, renderPriceHistoryTable,
  renderRepricingSuggestions, renderRepricingRulesManager,
  rpAddRule, rpDeleteRule, rpToggleRule, rpApplyAll, rpApplySingle
});

// Phase 6: CRM
Object.assign(window, {
  renderBuyersView, buyerAdd, buyerDelete, buyerExpand,
  buyerSetSearch, buyerSetSort, buyerLinkSale,
  renderOffersPanel, offerAdd, offerAddConfirm,
  offerAccept, offerReject, offerCounter, offerDelete, renderItemOffers
});

// Phase 7: Analytics
Object.assign(window, {
  calcSellThroughRate, calcInventoryTurnRate, calcCashFlowProjection,
  calcSeasonalTrends, calcPlatformComparison, calcVelocityByCategory,
  calcProfitByDayOfWeek, calcBestListingDay, calcRevenueForecasts, calcBreakEvenAnalysis
});

// Phase 8: Pro Reseller Features
Object.assign(window, {
  // Comps & Market Research
  fetchComps, suggestPrice, renderCompsPanel, getItemComps, clearCompsCache,
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
      const item = inv.find(i => i.id === itemId);
      if (item) {
        const panel = document.querySelector('.ai-panel');
        if (panel) panel.outerHTML = renderAIListingPanel(item);
      }
    }).catch(e => toast(e.message, true));
  },
  aiRegenerate: (itemId) => window.aiGenerate(itemId),
  aiCopyListing: copyAIListing,
  // Inventory Value
  renderInventoryValueDashboard,
  // Shipping Labels
  estimateRates, getCheapestRate, renderRateComparison,
  recordLabelCost, getShippingCostSummary, saveShipLabelSettings,
  // Photo tool action handlers
  ptRemoveBg: async (itemId) => {
    const item = inv.find(i => i.id === itemId);
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
    const item = inv.find(i => i.id === itemId);
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
    const item = inv.find(i => i.id === itemId);
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
    const item = inv.find(i => i.id === itemId);
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
    const item = inv.find(i => i.id === itemId);
    if (!item?.image) return;
    const brightness = parseInt(document.getElementById('ptBrightness')?.value || '0');
    const contrast = parseInt(document.getElementById('ptContrast')?.value || '0');
    if (brightness || contrast) {
      const result = await adjustImage(item.image, { brightness, contrast });
      document.getElementById('ptPreview').src = result;
    }
  },
});

// Relist from within the drawer modal
function clRelistFromDrawer(itemId, platform) {
  relistItem(itemId, platform);
  save(); refresh();
  toast(`Relisted on ${platform} ✓`);
  // Re-render the drawer's listing status if still open
  const item = inv.find(i => i.id === itemId);
  if (item) renderListingStatus(item);
}


// ══════════════════════════════════════════════════════════════════════════════
// VIEW SWITCHING
// ══════════════════════════════════════════════════════════════════════════════

function switchView(name, el) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); t.setAttribute('tabindex', '-1'); });
  document.getElementById('view-' + name)?.classList.add('active');
  if (el) { el.classList.add('active'); el.setAttribute('aria-selected', 'true'); el.setAttribute('tabindex', '0'); }

  if (name === 'inventory') renderInv();
  else if (name === 'sales') renderSalesView();
  else if (name === 'expenses') renderExpenses();
  else if (name === 'supplies') { renderSupplies(); checkSupplyAlerts(); }
  else if (name === 'insights') renderInsights();
  else if (name === 'reports') renderReports();
  else if (name === 'breakdown') renderBreakdown();
  else if (name === 'dashboard') renderDash();
  else if (name === 'crosslist') renderCrosslistDashboard();
  else if (name === 'shipping') renderShippingView();
  else if (name === 'sourcing') renderSourcingView();
  else if (name === 'tax') renderTaxCenter();
  else if (name === 'buyers') renderBuyersView();
  else if (name === 'invvalue') {
    const el2 = document.getElementById('invValueContent');
    if (el2) el2.innerHTML = renderInventoryValueDashboard();
  }
}
window.switchView = switchView;

function goToBreakdown() {
  const tab = document.querySelectorAll('.nav-tab')[7];
  switchView('breakdown', tab);
  bnav('bn-more-breakdown');
}

function goToReports() {
  const tab = document.querySelectorAll('.nav-tab')[6];
  switchView('reports', tab);
  bnav('bn-more-reports');
}

function goToStockAlert() {
  setStockFilt('low');
  const tab = document.querySelectorAll('.nav-tab')[1];
  switchView('inventory', tab);
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
  const scale = parseInt(val) / 100;
  document.documentElement.style.setProperty('--fs', val);
  document.documentElement.style.zoom = scale;
  document.getElementById('fsSlider').value = val;
  document.querySelectorAll('.fs-preset').forEach(b => {
    b.classList.toggle('active', parseInt(b.textContent === 'Small' ? 80 : b.textContent === 'Default' ? 100 : b.textContent === 'Large' ? 115 : 130) === parseInt(val));
  });
  if (doSave) localStorage.setItem('ft_fs', val);
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
// INIT
// ══════════════════════════════════════════════════════════════════════════════

// Restore saved preferences
const savedTheme = localStorage.getItem('ft_theme');
if (savedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');
updateThemeLabels();

const savedFs = localStorage.getItem('ft_fs');
if (savedFs) applyFontSize(savedFs, false);

const savedFont = localStorage.getItem('ft_font');
if (savedFont) setFont(savedFont, false);

// Set current date
document.getElementById('currentDate').textContent =
  new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });

// Init expense date
setDefaultExpDate();

// ── ASYNC BOOT: Load data from IndexedDB, then render ──
(async function boot() {
  try {
    // Load data from IndexedDB (migrates from localStorage on first run)
    await initStore();
  } catch (e) {
    console.warn('FlipTrack: Store init error:', e.message);
  }

  // Build initial state
  rebuildInvIndex();
  refresh();

  // Dismiss splash screen
  const splash = document.getElementById('splash');
  if (splash) { splash.classList.add('hide'); setTimeout(() => splash.remove(), 500); }

  // First-run onboarding
  if (!localStorage.getItem('ft_welcomed')) {
    const wOv = document.getElementById('welcomeOv');
    if (wOv) wOv.style.display = '';
  }
  window.dismissWelcome = function () {
    localStorage.setItem('ft_welcomed', '1');
    const wOv = document.getElementById('welcomeOv');
    if (wOv) { wOv.style.opacity = '0'; setTimeout(() => wOv.remove(), 300); }
  };

  // Bottom nav visibility
  updateBnavVisibility();
  window.addEventListener('resize', updateBnavVisibility);

  // Online/offline
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  if (!navigator.onLine) updateOnlineStatus();

  // Platform pickers
  initPlatPickers();

  // Boot auth (connects Supabase, starts realtime)
  initAuth();

  // Set up offline mutation queue auto-replay
  initOfflineQueue();

  // Initialize crosslisting
  await initTemplates();
  initListingDates();
  checkExpiredListings();

  // Initialize new feature modules
  await Promise.all([
    initHauls(),
    initMileageLog(),
    initRepricingRules(),
    initBuyers(),
    initOffers(),
    initPackingSlipSettings(),
    initEBaySync(),
    initEtsySync(),
    initPhotoSettings(),
    initShipLabels(),
  ]);
  initShippingModals();

  // Initialize eBay OAuth + AI Listing (non-blocking)
  const _sbClient = (await import('./data/auth.js')).getSupabaseClient();
  if (_sbClient) {
    initEBayAuth(_sbClient).then(() => {
      if (isEBayConnected()) startEBaySyncInterval();
    }).catch(e => console.warn('eBay init:', e.message));
    initEtsyAuth(_sbClient).then(() => {
      if (isEtsyConnected()) startEtsySyncInterval();
    }).catch(e => console.warn('Etsy init:', e.message));
    initAIListing(_sbClient);
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
    console.error('FlipTrack unhandled rejection:', e.reason);
    showError('A background task failed — retrying automatically.');
  });
})();
