# FlipTrack Features - ES Modules

This directory contains extracted ES modules from the monolithic HTML file, organized by feature domain.

## Module Overview

### barcodes.js
Barcode generation and sticker printing functionality.

**Exports:**
- `makeBarcodeValue(item)` - Generate barcode value from item SKU or ID
- `renderBarcode(svgEl, value)` - Render CODE128 barcode to SVG element
- `renderDrawerBarcode(item)` - Render barcode in item drawer
- `printStickers(selectedOnly, ids)` - Print inventory stickers with barcodes

**Dependencies:** JsBarcode (external library)

---

### csv.js
CSV import and export functionality for inventory, sales, and expenses.

**Exports:**
- `exportCSV()` - Export full inventory to CSV
- `exportSalesCSV()` - Export sales history to CSV
- `exportExpensesCSV()` - Export expenses to CSV
- `exportAll()` - Export all three CSV files
- `importCSV(file)` - Import inventory from CSV file with field mapping

**Features:**
- Flexible header mapping with alias detection
- Auto-SKU generation for imported items
- Platform parsing from semicolon/comma/pipe-separated values
- Support for book-specific fields (ISBN, author, publisher, etc.)

---

### scanner.js
UPC/Barcode scanner with native and Quagga2 fallback support.

**Exports:**
- `openScanner(targetInputId)` - Open barcode scanner overlay
- `closeScanner()` - Close scanner and clean up resources
- `switchCamera(deviceId)` - Switch between available cameras
- `_loadScript(src)` - Dynamically load external scripts
- `_ensureQuagga()` - Load Quagga2 library with fallback URLs
- `_runNativeDetector(video)` - Use native BarcodeDetector API
- `_runQuagga()` - Use Quagga2 for broad browser support
- `_stopQuagga()` - Clean up Quagga2 instance
- `_populateCamList()` - Enumerate available cameras
- `_stopStream()` - Stop camera stream and cancel RAF
- `_setResult(text, isError)` - Update scanner status display
- `_onScanSuccess(value)` - Handle successful barcode scan

**Formats Supported:**
- UPC-A, UPC-E, EAN-8, EAN-13
- CODE128, CODE39
- QR Code, Data Matrix, ITF, Aztec, PDF417

---

### price-research.js
Price research and comparison using UPCitemdb API.

**Exports:**
- `openPriceResearch(prefillUpc)` - Open price research overlay
- `closePriceResearch()` - Close price research overlay
- `prSwitchTab(mode)` - Switch between UPC and keyword search tabs
- `openPriceScanner()` - Open scanner for UPC input
- `lookupPrices()` - Look up prices by UPC barcode
- `lookupByKeyword()` - Search prices by product keyword
- `renderPriceResults(upc, product)` - Display UPC lookup results
- `renderKeywordResults(query, items)` - Display keyword search results

**Search Platforms:**
- eBay (Sold & Active)
- Amazon
- Poshmark
- Mercari
- Google

---

### images.js
Image handling with crop engine and lightbox viewer.

**Exports:**
- `getItemImages(item)` - Get images array from item
- `imgSlotChange(event, pfx, idx)` - Handle image upload to slot
- `imgSlotRemove(event, pfx, idx)` - Remove image from slot
- `refreshImgSlots(pfx, images)` - Update slot UI states
- `renderAddFormImages()` - Render images for add form
- `renderDrawerImg(itemId)` - Render images for drawer
- `readImgFile(file, ctx)` - Read file and open crop modal
- `imgDragOver(e)` - Handle drag over event
- `imgDragLeave()` - Handle drag leave event
- `imgDrop(e, pfx)` - Handle file drop
- `openLightbox(itemId)` - Open lightbox for item
- `openLightboxUrl(url)` - Open lightbox with specific image
- `closeLightbox()` - Close lightbox
- `openCropModal(dataUrl, mimeType, ctx)` - Open image crop interface
- `cropDraw()` - Render crop canvas with handles and grid
- `cropHitTest(mx, my)` - Test if click hit crop handles
- `cropStartDrag(mx, my)` - Begin crop drag operation
- `cropMoveDrag(mx, my)` - Update crop during drag
- `cropEndDrag()` - End crop operation
- `cropReset()` - Reset crop to full image
- `cropSetAspect(aw, ah)` - Apply aspect ratio constraint
- `cropCancel()` - Cancel crop without saving
- `cropConfirm()` - Crop, compress, and save image
- `compressImage(dataUrl, mimeType, callback)` - Compress image to target size
- `clamp(v, lo, hi)` - Clamp value to range

**Crop Features:**
- Freehand and aspect-ratio constrained crop modes
- Rule-of-thirds grid overlay
- Corner and edge drag handles
- Touch and mouse support
- Automatic image compression (target 200KB)

---

### identify.js
AI-powered item identification using Supabase Edge Functions.

**Exports:**
- `openIdentify()` - Open AI identify overlay
- `closeIdentify()` - Close identify overlay
- `idHandleCapture(event)` - Handle camera/gallery image upload
- `idRetake()` - Reset to capture state
- `idAnalyze()` - Send image to AI for analysis
- `idCompressForAI(base64Data, mediaType)` - Compress for transmission
- `idRenderResults(r)` - Display identification results
- `idAddToInventory()` - Pre-fill inventory form from results
- `idSearchPrices()` - Switch to price research with AI data

**AI Results Include:**
- Item name and brand
- Category/subcategory detection
- Condition assessment
- Estimated value range (Low, Typical, Best Case)
- Confidence level
- Search terms for marketplace lookup

---

### platforms.js
Multi-platform support for inventory items.

**Exports:**
- `getPlatforms(item)` - Get platforms array from item
- `buildPlatPicker(pickerId, selected)` - Build platform selector UI
- `togglePlatChip(el, pickerId)` - Toggle platform selection
- `getSelectedPlats(pickerId)` - Get selected platforms from picker
- `initPlatPickers()` - Initialize platform pickers at startup
- `renderPlatTags(item)` - Render compact platform tag display

**Features:**
- Grouped platform display
- Multi-select chip interface
- Platform status indicators (active/sold/delisted)
- Overflow badge for 3+ platforms

---

### batch-scan.js
Bulk barcode scanning and rapid item addition mode.

**Exports:**
- `openBatchScan()` - Open batch scan overlay with camera
- `closeBatchScan()` - Close batch scan and clean up
- `batchAddScanned(upc)` - Add scanned UPC to batch list
- `batchManualAdd()` - Manually add item to batch
- `batchRemoveItem(id)` - Remove item from batch
- `renderBatchList()` - Update batch list UI
- `batchAddAll()` - Commit all items to inventory
- `_runBatchDetector(video)` - Continuous barcode detection loop
- `_runBatchQuagga(video)` - Quagga2-based detection loop

**Features:**
- Continuous scanning mode (native + Quagga fallback)
- Duplicate prevention with scanned codes Set
- Batch source attribution
- Auto-SKU generation for new items
- Pre-population from existing inventory

---

## Global Dependencies

These modules rely on global variables and functions that should be imported/injected:

### State Variables
- `inv` - Inventory array
- `sales` - Sales history array
- `expenses` - Expenses array
- `sel` - Selected items Set
- `activeDrawId` - Current drawer item ID

### Utility Functions
- `save()` - Save to storage
- `refresh()` - Refresh UI
- `toast(msg, isError)` - Show toast notification
- `uid()` - Generate unique ID
- `calc(item)` - Calculate item metrics
- `pct(margin)` - Format percentage
- `fmt(value)` - Format currency
- `escHtml(str)` - Escape HTML entities
- `platCls(platform)` - Get platform CSS class
- `switchView(view, tab)` - Switch main view
- `openAddModal()` - Open inventory add modal
- `syncAddSubcat()` - Sync subcategory selection
- `prevProfit()` - Preview profit calculation

### Global Objects
- `PLATFORM_GROUPS` - Platform configuration
- `_sfx` - Sound effects object
- `_sb` - Supabase client
- `_currentUser` - Current authenticated user
- `HANDLE_R` - Crop handle radius

### External Libraries
- `JsBarcode` - Barcode rendering
- `Quagga` - Barcode detection (dynamic load)
- `BarcodeDetector` - Native barcode API (optional)

---

## Usage Example

```javascript
// Import individual modules
import { openScanner, closeScanner } from './features/scanner.js';
import { openPriceResearch } from './features/price-research.js';
import { exportCSV, importCSV } from './features/csv.js';

// Use in your Vite application
document.getElementById('scanBtn').onclick = () => openScanner('upcInput');
document.getElementById('exportBtn').onclick = () => exportCSV();
```

---

## Notes

- All modules use standard ES6 export syntax
- No module-level initialization code (except optional init calls)
- Function bodies preserve exact original logic
- Global state dependencies are kept as-is for backwards compatibility
- Event listeners and DOM references expected to exist in HTML
