# FlipTrack Data Layer Modules

This directory contains the extracted data layer from the monolithic HTML file, organized into modular ES6 modules.

## Files

### store.js
**Central data store** - Manages all inventory, sales, and expense data with caching and indexing.

**Exported items:**
- `inv`, `sales`, `expenses`, `supplies` - Data arrays (loaded from localStorage)
- `rebuildInvIndex()`, `getInvItem(id)` - O(1) lookup index for inventory
- `save()` - Persist all data to localStorage (calls `autoSync()` on success)
- `refresh()` - Mark cache as dirty and trigger UI updates
- `normCat(input)` - Normalize category strings
- `_cacheDirty`, `_insightsCache`, `_breakdownCache`, `_chipsBuiltForData` - Cache flags
- `activeDrawId`, `activeSoldId`, `platFilt`, `catFilt`, `subcatFilt`, `subsubcatFilt`, `stockFilt`, `sel`, `dragSrc` - UI state
- `_invPage`, `_invPageSize`, `_salePage`, `_salePageSize` - Pagination state
- `_undoStack` - Undo history
- Trash system: `_trash`, `saveTrash()`, `softDeleteItem(id)`, `restoreItem(idx)`, `openTrashModal()`, `closeTrashModal()`, `emptyTrash()`
- Undo system: `pushUndo(action, data)`, `showUndoToast(msg)`, `performUndo()`
- `saveSupplies()`, `saveLocalSupplies()` - Supplies persistence

### auth.js
**Authentication and account management** - Handles Supabase authentication, session management, and user account UI.

**Exported items:**
- `getAccountId()`, `getCurrentUser()` - Get current authenticated user
- `switchAuthTab(tab)`, `setAuthMsg(msg, type)` - Auth UI tab switching
- `authSubmit()` - Handle login/signup form submission
- `authForgotPassword()` - Reset password flow
- `authSignOut()` - Sign out and clear local data
- `showAuthModal()`, `hideAuthModal()` - Modal visibility
- `openAccountMenu()`, `closeAccountMenu()` - Account menu UI
- `initAuth()` - Bootstrap authentication on page load
- `setupAuthEventListeners()` - Setup account menu event handlers
- `getSupabaseClient()` - Get the Supabase client instance for internal use

### sync.js
**Cloud synchronization and real-time updates** - Handles pushing/pulling data to/from Supabase and managing real-time subscriptions.

**Exported items:**
- `setSyncStatus(state, msg)` - Update sync status indicator
- `pushToCloud()` - Push local data to Supabase
- `pushDeleteToCloud(table, ids)` - Delete records from Supabase
- `pullFromCloud()` - Pull remote data from Supabase
- `pullSupplies()` - Pull supplies from cloud
- `syncNow()` - Full sync: pull → push
- `autoSync()` - Debounced auto-sync (2s delay after save)
- `mobileSyncNow()` - Sync action for mobile UI
- `startRealtime()`, `stopRealtime()` - Real-time subscription management
- `startPoll()`, `stopPoll()` - Legacy compatibility wrappers
- `pollOnce()` - Single poll for changes
- `setupSyncEventListeners()` - Setup page visibility change handler

### storage.js
**Supabase Storage management** - Handles uploading, deleting, and migrating images to/from cloud storage.

**Exported items:**
- `uploadImageToStorage(dataUrl, itemId, slotIdx)` - Convert base64 → blob → upload → return public URL
- `deleteImageFromStorage(url)` - Delete image from Storage given public URL
- `isStorageUrl(s)` - Check if a string is a Storage URL (not base64)
- `migrateImagesToStorage()` - Migrate all base64 images to Storage after first pull

## Related Files

### config/constants.js
**Configuration and constants** - Contains Supabase credentials, platform definitions, and utility functions.

**Exported items:**
- `SB_URL`, `SB_KEY` - Supabase configuration
- `TABLES` - Table names
- `STORAGE_BUCKETS` - Storage bucket names
- `PLATFORMS` - Array of supported platforms
- `PLATFORM_CLASSES`, `getPlatformClass(platform)` - Platform styling
- `CLOTHING_TYPES`, `CATEGORY_TREE`, `SUBCATS`, `SUBSUBCATS` - Category definitions
- `PLATFORM_FEES`, `getPlatformFee(platform)` - Fee schedules
- Utility functions: `uid()`, `fmt()`, `pct()`, `ds()`, `escHtml()`, `debounce()`, `sc()`
- Pagination, sync, and storage key constants

## Architecture Notes

### Module Dependencies

```
store.js
├── (imports autoSync from sync.js - lazy to avoid circular deps)
└── (no other imports)

auth.js
├── (imports from config/constants.js)
├── (imports from store.js)
└── (imports from sync.js - circular deps handled by lazy calls)

sync.js
├── (imports from config/constants.js)
├── (imports from store.js)
├── (imports from auth.js - circular deps handled by lazy calls)
└── (imports from storage.js)

storage.js
├── (imports from store.js)
└── (imports from auth.js - lazy calls)

config/constants.js
└── (no imports - pure data/utilities)
```

### Circular Dependency Handling

- `store.js` imports `autoSync` from `sync.js` lazily in the `save()` function
- `auth.js` imports sync functions lazily in `_startSession()`
- This allows bidirectional calls without runtime circular dependency issues

### Key Changes from Original HTML

1. **ES Module Syntax**: All functions exported as named exports
2. **Removed UI Calls**: Functions like `toast()`, `renderInv()`, `_sfx.create()` are noted as comments where they would be called
3. **Data Mutations**: Using `.length = 0` and `.push(...)` instead of reassignment to maintain reference integrity
4. **Supabase Client**: Managed by `auth.js`, accessed by other modules via `getSupabaseClient()`
5. **State Variables**: Exported directly for direct mutation (required for reactive updates)

## Usage Example

```javascript
import { inv, sales, save, refresh } from './store.js';
import { authSubmit, initAuth } from './auth.js';
import { syncNow, setSyncStatus } from './sync.js';

// Initialize auth on page load
await initAuth();

// Add an item
inv.push({ id: '123', name: 'Item', qty: 1 });
save();  // Saves to localStorage and triggers autoSync

// Manual full sync
await syncNow();

// Check sync status
setSyncStatus('connected');
```

## Migration Notes

When integrating these modules into the main application:

1. **Wrap UI Calls**: Create a UI layer module that calls rendering functions
2. **Toast System**: Implement global toast system and inject into data modules
3. **SFX System**: Move sound effects to a separate audio module
4. **Exports**: Review all exported functions for full API coverage
5. **Error Handling**: Add try-catch wrappers around async operations in UI
6. **Testing**: Add unit tests for each data operation

## Original Source

Extracted from `/sessions/magical-gallant-lovelace/mnt/New folder/index.html` (465KB monolithic file)

Lines referenced:
- Data arrays: ~4186-4189
- Index/cache: ~4197-4207
- State vars: ~4190-4196
- Auth: ~4260-4721
- Sync: ~4369-4659
- Storage: ~4435-4496
- Trash/Undo: ~4735-4833
- Save: ~4836-4865
- Supplies: ~8343-8369
- Refresh: ~8099
