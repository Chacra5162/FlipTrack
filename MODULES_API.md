# Extracted ES Modules API Reference

## Module: `src/views/inventory.js`

### Filter Functions
```javascript
export function buildChips(forceRebuild)
```
Builds the filter chip UI for platforms, categories, subcategories, and sub-subcategories. Rebuilds full HTML if inventory data changed, otherwise updates active states only.

```javascript
export function _updateChipActiveStates()
```
Lightweight update that only toggles active classes on existing filter chips without rebuilding HTML.

```javascript
export function setPlatFilt(p, el)
```
Toggle a platform filter on/off. "all" clears the filter.

```javascript
export function setCatFilt(c, el)
```
Toggle a category filter on/off. Resets sub-filters when category changes. "all" clears the filter.

```javascript
export function setSubcatFilt(s, el)
```
Set the subcategory filter. Resets sub-subcategory filter. "all" clears the filter.

```javascript
export function setSubsubcatFilt(s, el)
```
Set the sub-subcategory filter. "all" clears the filter.

### Sort Functions
```javascript
export function setSort(v)
```
Set the sort dropdown value and re-render. Supported values: 'added-desc', 'added-asc', 'name-asc', 'margin-desc', 'qty-asc', 'price-desc', 'cost', 'platform'.

```javascript
export function sortItems(items)
```
Sort an array of items based on the current sort selection. Returns a new sorted array.

### Rendering
```javascript
export function renderInv()
```
Main inventory table renderer. Applies filters, sorts items, handles pagination, and renders the complete inventory table with all interactive elements.

### Item Operations
```javascript
export function startPriceEdit(span, id)
```
Convert a price display span to an editable input field. Commits on blur or Enter key.

```javascript
export function adjStock(id, d)
```
Adjust stock quantity for an item by delta `d`. Shows toast warnings for low/out of stock. Calls save() and refresh().

### Drag & Drop
```javascript
export function dStart(e, id)
```
Drag start handler. Sets the drag source index.

```javascript
export function dOver(e)
```
Drag over handler. Provides visual feedback with drag-over class.

```javascript
export function dDrop(e, id)
```
Drop handler. Reorders items in the inventory array. Calls save() and renderInv().

### Selection
```javascript
export function toggleSel(id, cb)
```
Toggle selection state for a single item. Updates selection checkbox and row class. Syncs bulk bar.

```javascript
export function toggleAll(cb)
```
Toggle selection for all items on current page. Updates all checkboxes and row classes.

```javascript
export function clearSel()
```
Clear all selections and re-render.

```javascript
export function syncBulk()
```
Update the bulk operations bar visibility and item count based on selection state.

### Bulk Operations
```javascript
export async function bulkDel()
```
Delete all selected items with confirmation. Updates store, pushes to cloud, shows toast with undo info.

```javascript
export function bulkSold()
```
Record sales for all selected items at their list price. Creates sale records, decrements qty, clears selection.

---

## Module: `src/views/sales.js`

### Modal Management
```javascript
export function openSoldModal(id)
```
Open the "Record Sale" modal for an item. Populates item info, platforms dropdown, and form fields. Sets initial price type to 'each'.

```javascript
export function closeSold()
```
Close the sold modal and clear active item ID.

### Price Entry
```javascript
export function sPriceType(type)
```
Toggle between 'each' (per-unit price) and 'total' (total sale price) mode. Updates button styles and price hint.

```javascript
export function updateSalePriceHint()
```
Update the price hint text based on current price type, qty, and price value. Shows per-unit calculations or total breakdown.

### Fee Estimation
```javascript
export function updateFeeEstimate()
```
Calculate and display the platform fee estimate based on selected platform, sale price, AND shipping cost. For eBay, fees are calculated on (price + shipping) via the `feeOnShipping` flag. Does NOT run when editing existing sales to avoid overwriting API-sourced fees.

```javascript
export function updateAddlFeePreview()
```
Update tooltip on the Addl Fee % field showing the dollar amount. Uses `addlFeeBasis` (eBay order total) when available.

### Sale Recording
```javascript
export function recSale()
```
Record a sale transaction. Validates price and qty, creates sale record (including `addlFeePct` and `addlFeeBasis`), decrements item qty, handles undo, triggers sound effect, and prompts for materials modal.

### Utility: Additional Fee Calculation
```javascript
// In src/utils/format.js
export const addlFee = (sale) => number
```
Computes dollar amount of `addlFeePct` on a sale: `pct% × (addlFeeBasis || price×qty+ship)`. Used in all profit calculations across sales, insights, and dashboard views.

### Rendering
```javascript
export function renderSalesView()
```
Render the complete sales history table with pagination. Shows revenue/profit summary. Maps sales back to items for display. Renders pagination controls.

---

## State Management

### Inventory Module State
- `_chipsBuiltForData` (imported) - Key to detect if inventory data changed
- `_invPage` (imported) - Current pagination page
- `_invPageSize` (imported) - Items per page
- `platFilt` (imported) - Set of active platform filters
- `catFilt` (imported) - Set of active category filters
- `subcatFilt` (imported) - Current subcategory filter ('all' or name)
- `subsubcatFilt` (imported) - Current sub-subcategory filter ('all' or name)
- `stockFilt` (imported) - Stock filter mode ('all' or 'low')
- `dragSrc` (imported) - Index of drag source item
- `sel` (imported) - Set of selected item IDs

### Sales Module State
- `activeSoldId` - ID of item currently being sold (local)
- `_sPriceType` - Price entry mode: 'each' or 'total' (local)
- `_salePage` - Current pagination page (local)
- `_salePageSize` - Items per page: 50 (local constant)

---

## Dependencies to Wire

### Both Modules Need:
- `save()` from store - Persist data changes
- `refresh()` from store - Reload UI after data changes

### Inventory Module Needs:
- `softDeleteItem(id)` - Soft delete helper
- `delItem(id)` - Delete with confirmation
- `openDrawer(id)` - Open item editor modal
- `openLightbox(id)` - Open image lightbox
- `openSoldModal(id)` - Open sold modal (could import from sales.js!)

### Sales Module Needs:
- `pushUndo(action, data)` - Add to undo stack
- `showUndoToast(msg)` - Show undo toast
- `openMaterialsModal(onConfirm)` - Open materials tracking modal
- `_sfx.sale()` - Play sale sound effect
- `openDrawer(id)` - Open item editor
- `delSale(id)` - Delete a sale record

---

## Configuration Data

### Inventory Module Uses:
- `PLATFORMS` - Array of all platform names
- `PLATFORM_GROUPS` - Grouped platforms with labels (for UI)
- `SUBCATS` - Map of category → [subcategories]
- `SUBSUBCATS` - Map of subcategory → [sub-subcategories]

### Sales Module Uses:
- `PLATFORMS` - Array of all platform names
- `PLATFORM_FEES` - Fee data for 23+ platforms

---

## HTML Elements Referenced

### Inventory Module:
- `#platChips` - Platform filter chips container
- `#catChips` - Category filter chips container
- `#catToolbar` - Category filter toolbar
- `#subcatChips` - Subcategory filter chips
- `#subcatToolbar` - Subcategory filter toolbar
- `#subcatLabel` - Subcategory label
- `#subsubcatChips` - Sub-subcategory chips
- `#subsubcatToolbar` - Sub-subcategory toolbar
- `#subsubcatLabel` - Sub-subcategory label
- `#activeFiltersBadge` - Active filters badge
- `#filterToggleBtn` - Filter toggle button
- `#invSearch` - Search input
- `#stockFilterBanner` - Stock filter banner
- `#stockFilterLabel` - Stock filter label
- `#invCnt` - Item count display
- `#invBody` - Inventory table body
- `#invEmpty` - Empty state message
- `#invPagination` - Pagination controls
- `#sortSel` - Sort dropdown
- `#selAll` - Select all checkbox
- `#bulkBar` - Bulk operations bar
- `#bulkCnt` - Bulk count display

### Sales Module:
- `#salesBody` - Sales table body
- `#salesEmpty` - Empty state message
- `#salesPagination` - Pagination controls
- `#salesTotalLbl` - Revenue/profit summary
- `#soldOv` - Sold modal overlay
- `#soldInfo` - Sale info display
- `#s_price` - Sale price input
- `#s_qty` - Sale quantity input
- `#s_fees` - Sale fees input
- `#s_ship` - Sale shipping input
- `#s_date` - Sale date input
- `#s_platform` - Platform dropdown
- `#s_price_each` - "Per unit" button
- `#s_price_total` - "Total" button
- `#s_price_hint` - Price hint text
- `#s_fee_hint` - Fee estimate hint

---

## New Feature Modules (Sprint 1-4)

### Sale Editing (`src/views/sales.js`)
```javascript
export function openEditSaleModal(saleId)  // Pre-populate sold modal for editing
```
Opens the sold modal with an existing sale's data. `recSale()` auto-detects edit mode via `_editingSaleId` and updates in-place with proper qty delta adjustment.

### Mobile Card View (`src/views/inventory.js`)
```javascript
export function toggleInvViewMode()  // Toggle table ↔ card view
```
Switches between table and card layouts. Card view uses `_renderCardView(pageItems)` internally. View mode persisted to `localStorage` key `ft_inv_view_mode`.

### Multi-Variant Inventory (`src/data/store.js`)
```javascript
export function getVariants(parentId)        // Get child items for a parent
export function getParentItem(childId)       // Get parent for a child variant
export function isParent(item)               // Check if item has variants
export function isVariant(item)              // Check if item is a child variant
export function getVariantAggQty(parentId)   // Sum qty across all children
```

### Variant Builder (`src/modals/add-item.js`)
```javascript
export function toggleVariantMode()      // Toggle variant builder in add-item form
export function addVariantLabel()        // Add custom variant label
export function removeVariantLabel(idx)  // Remove variant label by index
export function presetVariantSizes()     // Pre-fill S/M/L/XL labels
```

### Goal-Aware Alerts (`src/features/kpi-goals.js`)
```javascript
export function getGoalGap()             // Returns { gap, revGoal, actual, stats } or null
export function renderGoalGapWidget()    // Returns HTML string for gap-closing widget
```

### VAPID Push (`src/features/push-notifications.js`)
```javascript
export async function subscribeToPush()      // Subscribe to VAPID Web Push
export async function unsubscribeFromPush()  // Unsubscribe
export async function togglePush()           // Toggle push on/off
export async function restorePushSubscription()  // Restore on page load
export async function sendPushViaEdge(title, body, data)  // Send via Edge Function
```

### AI Sourcing Mode (`src/features/sourcing-mode.js`)
```javascript
export function openSourcingMode()   // Open full-screen sourcing overlay
export function closeSourcingMode()  // Close overlay
export function srcCapture()         // Capture photo and run analysis
export function srcRetake()          // Retake photo
export function srcUpdateCost()      // Recalculate ROI with new cost
export function srcAddToInventory()  // Quick-add analyzed item
```

### Poshmark Sync (`src/features/poshmark-sync.js`)
```javascript
export function openPoshmarkSync()     // Open reconciliation modal
export function closePoshmarkSync()    // Close modal
export function poshMarkSold(itemId)   // Mark item as sold on Poshmark + record sale
```

### Drawer Variants Tab (`src/modals/drawer.js`)
```javascript
export function updateDrawerVariantsTab(item)  // Show/hide tab based on isParent
export function renderDrawerVariants()         // Render variant children list
```

### eBay Sale Sync — Financial Breakdown (`src/features/ebay-sync.js`)
- **Price**: Derived from `pricingSummary.priceSubtotal` or `total - deliveryCost - tax` (matches eBay's displayed "Subtotal")
- **Fees**: From `lineItem.marketplaceFees` sum (includes FVF, per-order, store performance fees)
- **Ship**: $0 (buyer shipping covers label); user adjusts manually when label > buyer payment
- **addlFeeBasis**: Stored as order total (eBay's "Fees based on" amount) for addlFeePct calc
- **Tracking**: Fetched from shipping fulfillment API on initial sync + backfilled on 48h lookback
- **Push notifications**: `sendNotification()` now called for sales, offers, and auction completions
- **API capability flags**: `_tradingApiBlocked`, `_offerApiBlocked` persisted in IDB to skip unsupported APIs

### Source Normalization (`src/utils/autocomplete.js`)
```javascript
export function normalizeSource(raw)          // Match against existing sources, merge near-duplicates
export function retroNormalizeSources()       // Fix all existing items on startup
```
Strips all non-alphanumeric characters for comparison. "Marshall's" → "Marshalls". Runs on boot.

### Buyer Tiers (`src/views/buyers.js`)
Two separate tier systems:
- **Loyalty** (purchase count): New (0), Regular (3+), VIP (7+), Elite (15+)
- **Spending** (total spent): Shopper ($0), Regular ($100+), Big Spender ($500+), Store Sponsor ($1000+)

### Margin Alerts (`src/features/margin-alerts.js`)
- Auction items (`ebayListingFormat === 'AUCTION'`) are fully excluded from margin alerts

### Auction Stats in Drawer (`src/modals/drawer.js`)
- Auction items show Current Bid / Start Bid / Reserve instead of Profit/Margin/ROI
- Current bid updated from Browse API `currentBidPrice` on each sync cycle

### Whatnot Show Management (`src/features/whatnot-show.js`)
- Show lifecycle: `createShow()` → `startShow()` (live) → `endShow()` (ended) → `cloneShow()` (template)
- Item management: `addItemToShow()`, `removeItemFromShow()`, `reorderShowItems()`
- Sold tracking: `markShowItemSold(showId, itemId, price)` — marks platform status + decrements qty
- Lots: `addLot()`, `removeLot()` for auction bundling
- Goals: `setShowRevenueGoal()`, `getShowGoalProgress()`
- Shipping: `getGlobalShippingQueue()`, `markItemShipped()`
- Persistence: IndexedDB via `getMeta('whatnot_shows')` / `setMeta()`

### Whatnot Analytics (`src/features/whatnot-analytics.js`)
- Per-show: `getShowMetrics(show)` — sellThrough, revenue, profit, revenuePerHour, duration
- Aggregate: `calcBestShowDay()`, `calcBestShowTime()`, `calcCategoryPerformance()`, `calcOverallStats()`
- Smart Builder: `suggestShowItems(count)` — scores items by margin, history, category, staleness
- Pricing: `suggestShowBids(showId)`, `suggestStartingBid(itemId)` — data-driven auction bids
- Actions: `calcInventoryActions()` — prescriptive suggestions (auction, bundle, crosslist, donate)
- Whatnot fee: 8% commission + 2.9% processing + $0.30 per transaction

### Whatnot CSV Import & Reconciliation (`src/features/whatnot-import.js`)
- `importWhatnotOrderCSV(file)` — Import Order History CSV, auto-match to inventory, create sales
- `importLivestreamCSV(file, showId)` — Import Livestream Report CSV, optionally tied to a show
- `createSaleFromShow(showId, itemId, price)` — Bridge: create sale record from show sold item
- `reconcileShowSales(showId)` — Bulk create sale records for all sold items missing from Sales
- `reconcilePayout(amount, startDate, endDate)` — Compare payout vs recorded sales, show discrepancy
- `getShowPayoutBreakdown(startDate, endDate)` — Per-show revenue/fees/payout detail
- Matching: SKU (exact) → name (normalized) → name (fuzzy substring)
- Deduplication: checks existing sales by itemId + date + price to prevent duplicates
