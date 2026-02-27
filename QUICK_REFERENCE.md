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

// Manual full sync
await syncNow();  // pull → push

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
  price: number,                 // Sale price
  platform: string,              // e.g., "eBay"
  fees: number,                  // Platform fees
  shipping: number,              // Shipping cost
  profit: number,                // Net profit
  soldAt: string,                // ISO date
  soldTo: string,                // Optional buyer name
  notes: string                  // Optional notes
}
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

## Platform Examples

```javascript
// eBay
{ pct: 0.127, fixed: 0.30 }      // 12.7% + $0.30

// Amazon
{ pct: 0.15 }                     // 15%

// Etsy
{ pct: 0.065, fixed: 0.20 }      // 6.5% + $0.20

// Facebook Marketplace
{ pct: 0 }                        // No fees

// Depop, Mercari
{ pct: 0.10 }                     // 10%

// Poshmark
{ pct: 0.20 }                     // 20%

// StockX, GOAT
{ pct: 0.09, fixed: 2.75 }       // 9% + $2.75
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

**Last Updated:** February 27, 2026
**Extraction Source:** index.html (465 KB)
**Total Modules:** 5
**Total Lines:** ~1,000
