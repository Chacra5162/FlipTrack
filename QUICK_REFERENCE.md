# FlipTrack Data Layer - Quick Reference

## Module Imports

```javascript
// Central store
import { inv, sales, expenses, supplies, save, refresh } from './src/data/store.js';

// Authentication
import { initAuth, authSubmit, authSignOut, getAccountId } from './src/data/auth.js';

// Cloud sync
import { syncNow, autoSync, startRealtime, setSyncStatus } from './src/data/sync.js';

// Image storage
import { uploadImageToStorage, deleteImageFromStorage } from './src/data/storage.js';

// Configuration
import { PLATFORMS, PLATFORM_FEES, CATEGORY_TREE, uid, fmt } from './src/config/constants.js';
```

## Initialization

```javascript
// 1. Initialize authentication (runs on page load)
await initAuth();

// 2. Set up sync listeners
import { setupSyncEventListeners } from './src/data/sync.js';
import { setupAuthEventListeners } from './src/data/auth.js';
setupSyncEventListeners();
setupAuthEventListeners();

// 3. Import and implement refresh callbacks
import { refresh } from './src/data/store.js';
// Add your rendering functions to be called by refresh():
// updateStats(); updatePlatBreakdown(); updateSalesLog(); renderDash(); renderInv();
```

## Common Operations

### Working with Inventory

```javascript
import { inv, save, refresh } from './src/data/store.js';

// Add item
inv.push({ id: uid(), name: 'Item', qty: 1, category: 'Clothing', sku: '123' });
save();  // Auto-syncs to cloud

// Find item
const item = inv.find(i => i.id === itemId);

// Fast lookup (O(1))
import { getInvItem } from './src/data/store.js';
const item = getInvItem(itemId);

// Update item
item.qty -= 1;
save();

// Delete item (soft delete with undo)
import { softDeleteItem } from './src/data/store.js';
softDeleteItem(itemId);

// Restore from trash
import { restoreItem } from './src/data/store.js';
restoreItem(trashIndex);
```

### Recording Sales

```javascript
import { sales, inv, save } from './src/data/store.js';
import { uid } from './src/config/constants.js';

// Record a sale
const sale = {
  id: uid(),
  itemId: selectedItemId,
  qty: 1,
  price: 45.00,
  platform: 'eBay',
  soldAt: new Date().toISOString()
};
sales.push(sale);

// Decrease inventory
const item = inv.find(i => i.id === selectedItemId);
if (item) item.qty -= 1;

save();  // Auto-syncs

// Undo sale
import { performUndo } from './src/data/store.js';
performUndo();
```

### Cloud Synchronization

```javascript
import { syncNow, autoSync, setSyncStatus } from './src/data/sync.js';

// Manual full sync (also triggers eBay sync if connected)
await syncNow();  // pull → push → eBay sync

// Auto-sync (debounced 2s after save)
// Called automatically by save()

// Set sync status
setSyncStatus('connected');   // Show "Synced" indicator
setSyncStatus('syncing');     // Show "Syncing..." indicator
setSyncStatus('error', 'Connection failed');  // Show error
```

### Authentication

```javascript
import { getAccountId, authSignOut } from './src/data/auth.js';

// Get current user ID
const userId = getAccountId();

// Sign out
await authSignOut();  // Clears local data and shows auth modal
```

### Working with Images

```javascript
import { uploadImageToStorage, deleteImageFromStorage } from './src/data/storage.js';

// Upload base64 image
const dataUrl = canvas.toDataURL('image/jpeg');
const publicUrl = await uploadImageToStorage(dataUrl, itemId, 0);
// publicUrl → store in item.images[]

// Delete image
await deleteImageFromStorage(item.images[0]);
item.images.splice(0, 1);
save();
```

### Filtering & Pagination

```javascript
import { platFilt, catFilt, _invPage, _invPageSize } from './src/data/store.js';

// Filter by platform
platFilt.add('eBay');
platFilt.add('Amazon');

// Filter by category
catFilt.add('Clothing');
catFilt.add('Books');

// Pagination
_invPage = 0;      // Reset to first page
_invPageSize = 50; // Items per page
```

## API Summary

### store.js

| Function | Purpose | Returns |
|----------|---------|---------|
| `save()` | Persist to localStorage, trigger sync | void |
| `refresh()` | Invalidate cache, trigger renders | void |
| `rebuildInvIndex()` | Build O(1) lookup table | void |
| `getInvItem(id)` | Fast item lookup | Item \| null |
| `normCat(input)` | Normalize category name | string |
| `softDeleteItem(id)` | Soft delete to trash | void |
| `restoreItem(idx)` | Restore from trash | void |
| `pushUndo(action, data)` | Record undo entry | void |
| `performUndo()` | Execute undo | void |

### auth.js

| Function | Purpose | Returns |
|----------|---------|---------|
| `initAuth()` | Bootstrap auth on load | Promise |
| `authSubmit()` | Handle login/signup form | Promise |
| `authSignOut()` | Sign out and cleanup | Promise |
| `authForgotPassword()` | Reset password flow | Promise |
| `getAccountId()` | Get current user ID | string \| null |
| `getCurrentUser()` | Get user object | User \| null |
| `switchAuthTab(tab)` | Toggle login/signup | void |
| `setAuthMsg(msg, type)` | Show auth message | void |

### sync.js

| Function | Purpose | Returns |
|----------|---------|---------|
| `syncNow()` | Full sync (pull → push) | Promise |
| `autoSync()` | Debounced sync | void |
| `pushToCloud()` | Push local → Supabase | Promise |
| `pullFromCloud()` | Pull Supabase → local | Promise<boolean> |
| `pullSupplies()` | Pull supplies from cloud | Promise |
| `startRealtime()` | Enable WebSocket subscriptions | void |
| `stopRealtime()` | Disable subscriptions | void |
| `pollOnce()` | Single manual poll | Promise |
| `setSyncStatus(state, msg)` | Update sync indicator | void |

### storage.js

| Function | Purpose | Returns |
|----------|---------|---------|
| `uploadImageToStorage(url, id, idx)` | Upload base64 → URL | Promise<string> |
| `deleteImageFromStorage(url)` | Delete by URL | Promise |
| `isStorageUrl(s)` | Check if Storage URL | boolean |
| `migrateImagesToStorage()` | Batch migrate base64 | Promise |

### constants.js

| Export | Purpose | Type |
|--------|---------|------|
| `SB_URL`, `SB_KEY` | Supabase credentials | string |
| `PLATFORMS` | 30+ resale platforms | string[] |
| `PLATFORM_FEES` | Fee schedules | object |
| `CATEGORY_TREE` | Category hierarchy | object |
| `SUBCATS`, `SUBSUBCATS` | Category lookups | object |
| `uid()` | Generate unique ID | () => string |
| `fmt(n)` | Format as currency | (n) => string |
| `pct(n)` | Format as percentage | (n) => string |
| `ds(d)` | Format as date | (d) => string |
| `debounce(fn, ms)` | Debounce function | (fn, ms) => fn |

## Data Structures

### Inventory Item

```javascript
{
  id: string,                    // Unique ID
  name: string,                  // Item name
  sku: string,                   // Stock keeping unit
  category: string,              // e.g., "Clothing"
  subcategory: string,           // e.g., "Men"
  qty: number,                   // Quantity in stock
  cost: number,                  // Purchase cost
  price: number,                 // Listing price
  image: string,                 // Primary image URL/base64
  images: string[],              // Multiple images
  condition: string,             // e.g., "like new"
  location: string,              // Storage location
  notes: string,                 // Notes
  tags: string[],                // Custom tags
  created: string,               // ISO date
  updated: string                // ISO date
}
```

### Sale Record

```javascript
{
  id: string,                    // Unique ID
  itemId: string,                // Reference to inventory item
  qty: number,                   // Quantity sold
  price: number,                 // Sale price per unit (item only, excludes shipping/tax)
  listPrice: number,             // Original list price (for variance tracking)
  platform: string,              // e.g., "eBay"
  fees: number,                  // Platform fees ($)
  addlFeePct: number,            // Additional fee percentage (e.g., 6% store performance)
  addlFeeBasis: number,          // Fee basis for addlFeePct (eBay order total incl. tax+ship)
  ship: number,                  // Net shipping cost (label - buyer shipping, $0 if buyer covers)
  date: string,                  // ISO date
  tracking: string,              // Tracking number
  trackingCarrier: string,       // Carrier code
  ebayOrderId: string,           // eBay order ID (auto-synced sales)
  buyerId: string,               // Buyer CRM link
  buyerAddress: string,          // Ship-to address
  buyerCity: string,
  buyerState: string,
  buyerZip: string,
  shipped: boolean,              // Shipped status (auto-tracked from eBay)
  shippedDate: string            // Ship date
}
```

**Profit Formula:** `profit = (price × qty) - (cost × qty) - fees - addlFee - ship`
where `addlFee = addlFeePct% × (addlFeeBasis || price×qty+ship)`
```

### Expense Record

```javascript
{
  id: string,                    // Unique ID
  category: string,              // e.g., "Supplies"
  amount: number,                // Amount spent
  date: string,                  // ISO date
  description: string,           // Description
  notes: string                  // Additional notes
}
```

### Supply Item

```javascript
{
  id: string,                    // Unique ID
  name: string,                  // Supply name
  category: string,              // e.g., "Boxes"
  qty: number,                   // Current quantity
  alert: number,                 // Reorder threshold
  cost: number,                  // Unit cost
  notes: string,                 // Notes
  added: string                  // ISO date
}
```

## Platform Fee Examples

```javascript
// eBay (~13.6% + $0.40, on item + shipping; feeOnShipping: true)
{ pct: 0.136, flat: 0.40 }
// Note: eBay fees are auto-synced from lineItem.marketplaceFees API.
// Additional surcharges (e.g. 6% below-standard) use addlFeePct on sales.

// Amazon
{ pct: 0.15 }                     // 15%

// Etsy
{ pct: 0.065, flat: 0.20 }       // 6.5% + $0.20 + 3% processing

// Poshmark
{ pct: 0.20 }                     // 20% (or $2.95 if under $15)
```

## File Locations

```
/sessions/magical-gallant-lovelace/mnt/New folder/

├── index.html                          (Original 465 KB)
├── EXTRACTION_SUMMARY.md               (Full documentation)
│
└── fliptrack/
    ├── QUICK_REFERENCE.md              (This file)
    └── src/
        ├── config/
        │   └── constants.js            (8.3 KB)
        └── data/
            ├── store.js                (7.5 KB)
            ├── auth.js                 (8.5 KB)
            ├── sync.js                 (11 KB)
            ├── storage.js              (3.8 KB)
            ├── README.md               (Module docs)
            └── DIRECTORY_STRUCTURE.txt (This structure)
```

## Troubleshooting

### Data not syncing
```javascript
// Check auth
import { getAccountId } from './src/data/auth.js';
console.log(getAccountId());  // Should be user ID

// Manually sync
import { syncNow } from './src/data/sync.js';
await syncNow();
```

### Cache not updating
```javascript
// Force cache refresh
import { refresh } from './src/data/store.js';
refresh();  // Marks dirty and triggers renders
```

### localStorage quota exceeded
```javascript
// Automatically handled by save()
// Images are stripped to make room
// Check browser storage: DevTools > Application > Storage > Local Storage
```

### Lost undo history
```javascript
import { _undoStack } from './src/data/store.js';
console.log(_undoStack);  // Max 20 items, sorted by timestamp
```

---

**Last Updated:** March 21, 2026
**Total Modules:** 50+
**Total Lines:** ~15,000+

---

## New Features (Sprint 1-4, March 2026)

### Sale Editing
```javascript
import { openEditSaleModal } from './src/views/sales.js';
openEditSaleModal(saleId);  // Opens sold modal pre-filled for editing
// recSale() auto-detects edit mode and updates in-place
```

### Multi-Variant Inventory
```javascript
import { getVariants, isParent, isVariant, getVariantAggQty } from './src/data/store.js';

// Check if item has variants
if (isParent(item)) {
  const children = getVariants(item.id);   // Array of child items
  const totalQty = getVariantAggQty(item.id);  // Sum of all child qty
}

// Data model: parent has isParent=true, qty=0; children have parentId
// No migration needed — existing items have no parentId
```

### VAPID Push Notifications
```javascript
import { subscribeToPush, togglePush, getNotifStatus } from './src/features/push-notifications.js';

await subscribeToPush();  // Request permission + subscribe + save to Supabase
await togglePush();       // Toggle on/off
getNotifStatus();         // { supported, permission, enabled, pushSubscribed }
```

### Goal Gap Widget
```javascript
import { getGoalGap, renderGoalGapWidget } from './src/features/kpi-goals.js';

const gap = getGoalGap();  // { gap: 500, revGoal: 2000, actual: 1500, stats }
const html = renderGoalGapWidget();  // Returns HTML or '' if no gap
```

### AI Sourcing Mode
```javascript
import { openSourcingMode, closeSourcingMode } from './src/features/sourcing-mode.js';

openSourcingMode();   // Full-screen camera → AI → comps → BUY/PASS verdict
closeSourcingMode();
```

### Poshmark Sync
```javascript
import { openPoshmarkSync, poshMarkSold } from './src/features/poshmark-sync.js';

openPoshmarkSync();         // Modal listing Poshmark items
poshMarkSold(itemId);       // Mark sold + record sale with 20% fee
```

### Whatnot CSV Import & Reconciliation
```javascript
import {
  importWhatnotOrderCSV, importLivestreamCSV,
  createSaleFromShow, reconcileShowSales,
  reconcilePayout, getShowPayoutBreakdown, getWhatnotSalesInRange
} from './src/features/whatnot-import.js';

// CSV Import — file from <input type="file">
importWhatnotOrderCSV(file);           // Import Order History CSV (Financials → Ledger → Export)
importLivestreamCSV(file, showId);     // Import Livestream Report CSV, optionally tied to a show

// Show → Sale Bridge
createSaleFromShow(showId, itemId, price);  // Create sale record from show sold item
reconcileShowSales(showId);                 // Bulk: create sale records for all sold show items
// Returns { created: number, alreadyRecorded: number }

// Payout Reconciliation
const report = reconcilePayout(125.50, '2026-04-01', '2026-04-07');
// report = { payoutAmount, expectedPayout, discrepancy, discrepancyPct,
//            status: 'match'|'overpaid'|'underpaid', possibleReasons[], sales[] }
getShowPayoutBreakdown('2026-04-01', '2026-04-07'); // Per-show payout detail
getWhatnotSalesInRange('2026-04-01', '2026-04-07'); // Raw Whatnot sales in range
```
