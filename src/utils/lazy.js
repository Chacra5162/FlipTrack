/**
 * lazy.js - Lazy module loader with caching
 * Uses Vite dynamic imports to code-split heavy feature modules.
 * Each module is loaded once on first use, then cached.
 *
 * Usage:
 *   const { openScanner } = await lazyScanner();
 */

const _cache = {};

function lazy(key, loader) {
  return async () => {
    if (!_cache[key]) {
      _cache[key] = await loader();
    }
    return _cache[key];
  };
}

// ── LAZY MODULE LOADERS ─────────────────────────────────────────────────────

/** Scanner module (~220 lines, accesses camera) */
export const lazyScanner = lazy('scanner', () => import('../features/scanner.js'));

/** Batch scan module (~235 lines, accesses camera) */
export const lazyBatchScan = lazy('batch-scan', () => import('../features/batch-scan.js'));

/** Price research module (~255 lines, network-heavy) */
export const lazyPriceResearch = lazy('price-research', () => import('../features/price-research.js'));

/** AI identify module (~237 lines, network + camera) */
export const lazyIdentify = lazy('identify', () => import('../features/identify.js'));

/** Image handling module (~522 lines, canvas + crop) */
export const lazyImages = lazy('images', () => import('../features/images.js'));

/** Barcode rendering module (~254 lines) */
export const lazyBarcodes = lazy('barcodes', () => import('../features/barcodes.js'));

/** CSV export/import module (~186 lines) */
export const lazyCSV = lazy('csv', () => import('../features/csv.js'));
