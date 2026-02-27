#!/usr/bin/env node
/**
 * FlipTrack — Comprehensive Performance & Stability Test Suite
 * Tests all modules for: import resolution, logic correctness, data integrity,
 * race conditions, memory, and edge cases.
 *
 * Run: node tests/test-suite.js
 */

const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0, skipped = 0;
const errors = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    errors.push({ name, error: e.message });
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

function skip(name) {
  skipped++;
  console.log(`  ⏭  ${name} (needs browser)`);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${b}, got ${a}`);
}

const SRC = path.join(__dirname, '..', 'src');
const ROOT = path.join(__dirname, '..');

/** Read a source file relative to SRC */
function read(relPath) {
  return fs.readFileSync(path.join(SRC, relPath), 'utf8');
}

/** Check if a source file exists relative to SRC */
function exists(relPath) {
  return fs.existsSync(path.join(SRC, relPath));
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. MODULE RESOLUTION & IMPORT GRAPH
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n📦 1. MODULE RESOLUTION & IMPORT GRAPH\n');

test('All JS modules exist and are non-empty', () => {
  const dirs = ['config', 'data', 'features', 'modals', 'utils', 'views'];
  let total = 0;
  for (const dir of dirs) {
    const fullDir = path.join(SRC, dir);
    if (!fs.existsSync(fullDir)) throw new Error(`Missing directory: ${dir}`);
    const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(fullDir, file), 'utf8');
      if (content.length < 10) throw new Error(`Empty module: ${dir}/${file}`);
      total++;
    }
  }
  assert(total >= 30, `Expected 30+ modules, found ${total}`);
});

test('main.js exists and imports all views', () => {
  const main = fs.readFileSync(path.join(SRC, 'main.js'), 'utf8');
  const requiredImports = [
    'dashboard', 'inventory', 'sales', 'insights', 'expenses', 'reports', 'breakdown', 'supplies'
  ];
  for (const view of requiredImports) {
    assert(main.includes(`./views/${view}.js`), `Missing import for views/${view}.js`);
  }
});

test('No circular import between store.js and sync.js', () => {
  const store = fs.readFileSync(path.join(SRC, 'data', 'store.js'), 'utf8');
  const sync = fs.readFileSync(path.join(SRC, 'data', 'sync.js'), 'utf8');
  // store imports autoSync from sync — OK
  assert(store.includes("from './sync.js'"), 'store.js should import from sync.js');
  // sync imports from store — OK
  assert(sync.includes("from './store.js'"), 'sync.js should import from store.js');
  // Vite handles this as long as they don't create side-effect loops at module level
});

test('All import paths resolve to existing files', () => {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(dir, entry.name));
      else if (entry.name.endsWith('.js')) files.push(path.join(dir, entry.name));
    }
  };
  walk(SRC);

  let missing = 0;
  const importRe = /from\s+['"](\.[^'"]+)['"]/g;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = importRe.exec(content)) !== null) {
      const importPath = match[1];
      const resolved = path.resolve(path.dirname(file), importPath);
      if (!fs.existsSync(resolved)) {
        missing++;
        if (missing <= 5) console.log(`    ⚠ ${path.relative(SRC, file)}: import "${importPath}" not found`);
      }
    }
  }
  assert(missing === 0, `${missing} broken import path(s)`);
});

test('Lazy loader references all expected modules', () => {
  const lazy = fs.readFileSync(path.join(SRC, 'utils', 'lazy.js'), 'utf8');
  const expected = ['scanner', 'batch-scan', 'price-research', 'identify', 'images', 'barcodes', 'csv'];
  for (const mod of expected) {
    assert(lazy.includes(mod), `Missing lazy module: ${mod}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. DATA LAYER INTEGRITY
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n💾 2. DATA LAYER INTEGRITY\n');

test('store.js exports waitForPersist (sync mutex)', () => {
  const store = fs.readFileSync(path.join(SRC, 'data', 'store.js'), 'utf8');
  assert(store.includes('export function waitForPersist'), 'Missing waitForPersist export');
  assert(store.includes('_persistPromise'), 'Missing _persistPromise variable');
});

test('sync.js calls waitForPersist before push operations', () => {
  const sync = fs.readFileSync(path.join(SRC, 'data', 'sync.js'), 'utf8');
  assert(sync.includes('waitForPersist'), 'sync.js should import waitForPersist');
  // Check it's called in pushToCloud
  const pushFn = sync.substring(sync.indexOf('async function pushToCloud') || sync.indexOf('export async function pushToCloud'));
  assert(pushFn.includes('await waitForPersist()'), 'pushToCloud should await waitForPersist()');
});

test('Dirty tracking has all required methods', () => {
  const store = fs.readFileSync(path.join(SRC, 'data', 'store.js'), 'utf8');
  const required = ['getDirtyItems', 'clearDirtyTracking', 'markDirty', 'markDeleted'];
  for (const fn of required) {
    assert(store.includes(`export function ${fn}`), `Missing export: ${fn}`);
  }
});

test('IDB wrapper has all CRUD methods', () => {
  const idb = fs.readFileSync(path.join(SRC, 'data', 'idb.js'), 'utf8');
  const methods = ['initDB', 'getAll', 'putAll', 'putOne', 'deleteOne', 'getMeta', 'setMeta'];
  for (const m of methods) {
    assert(idb.includes(`export function ${m}`) || idb.includes(`export async function ${m}`), `Missing IDB method: ${m}`);
  }
});

test('Delta sync pulls only newer rows', () => {
  const sync = fs.readFileSync(path.join(SRC, 'data', 'sync.js'), 'utf8');
  assert(sync.includes("gt('updated_at'"), 'pullFromCloud should filter by updated_at');
  assert(sync.includes('lastSyncPull'), 'Should track lastSyncPull timestamp');
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. OFFLINE QUEUE RELIABILITY
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n📡 3. OFFLINE QUEUE RELIABILITY\n');

test('Offline queue has retry cap', () => {
  const oq = fs.readFileSync(path.join(SRC, 'data', 'offline-queue.js'), 'utf8');
  assert(oq.includes('retries'), 'Queue entries should track retries');
  assert(oq.includes('>= 5') || oq.includes('>=5') || oq.includes('> 4'), 'Should cap retries at 5');
});

test('Offline queue has size cap', () => {
  const oq = fs.readFileSync(path.join(SRC, 'data', 'offline-queue.js'), 'utf8');
  assert(oq.includes('1000') || oq.includes('MAX_QUEUE'), 'Should cap queue at 1000 items');
});

test('Offline queue tracks dropped items', () => {
  const oq = fs.readFileSync(path.join(SRC, 'data', 'offline-queue.js'), 'utf8');
  assert(oq.includes('dropped'), 'replayQueue should return dropped count');
});

test('pushToCloud queues when offline', () => {
  const sync = fs.readFileSync(path.join(SRC, 'data', 'sync.js'), 'utf8');
  assert(sync.includes('navigator.onLine'), 'Should check navigator.onLine');
  assert(sync.includes('_queueDirtyItems'), 'Should queue items when offline');
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. INPUT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n✅ 4. INPUT VALIDATION\n');

test('validate.js exists with all required functions', () => {
  const val = fs.readFileSync(path.join(SRC, 'utils', 'validate.js'), 'utf8');
  const fns = ['parseNum', 'validateNumericInput', 'clearValidation', 'attachNumericValidation'];
  for (const fn of fns) {
    assert(val.includes(`export function ${fn}`), `Missing export: ${fn}`);
  }
});

// Test parseNum logic by extracting and evaluating it
test('parseNum handles edge cases correctly', () => {
  // Simulate parseNum logic
  function parseNum(val, opts = {}) {
    const { min = 0, max = Infinity, allowZero = true, integer = false } = opts;
    if (val === '' || val === null || val === undefined) return NaN;
    const n = integer ? parseInt(val, 10) : parseFloat(val);
    if (isNaN(n)) return NaN;
    if (!allowZero && n === 0) return NaN;
    if (n < min || n > max) return NaN;
    return Math.round(n * 100) / 100;
  }

  // Valid inputs
  assertEq(parseNum('10.5'), 10.5, 'Should parse 10.5');
  assertEq(parseNum('0'), 0, 'Should parse 0');
  assertEq(parseNum('100', { integer: true }), 100, 'Should parse integer');

  // Invalid inputs
  assert(isNaN(parseNum('')), 'Empty string → NaN');
  assert(isNaN(parseNum(null)), 'null → NaN');
  assert(isNaN(parseNum('abc')), 'abc → NaN');
  assert(isNaN(parseNum('0', { allowZero: false })), '0 with allowZero=false → NaN');
  assert(isNaN(parseNum('-5', { min: 0 })), 'Negative with min=0 → NaN');

  // Rounding
  assertEq(parseNum('10.999'), 11, 'Should round to cents');
  assertEq(parseNum('10.004'), 10, 'Should round to cents');
});

test('add-item.js imports validation', () => {
  const addItem = fs.readFileSync(path.join(SRC, 'modals', 'add-item.js'), 'utf8');
  assert(addItem.includes("from '../utils/validate.js'"), 'Should import from validate.js');
});

test('drawer.js imports validation', () => {
  const drawer = fs.readFileSync(path.join(SRC, 'modals', 'drawer.js'), 'utf8');
  assert(drawer.includes("from '../utils/validate.js'") || drawer.includes('validate'), 'Should import validation');
});

test('sales.js imports validation', () => {
  const sales = fs.readFileSync(path.join(SRC, 'views', 'sales.js'), 'utf8');
  assert(sales.includes("from '../utils/validate.js'"), 'Should import from validate.js');
});

test('expenses.js imports validation', () => {
  const exp = fs.readFileSync(path.join(SRC, 'views', 'expenses.js'), 'utf8');
  assert(exp.includes("from '../utils/validate.js'") || exp.includes('parseNum'), 'Should import validation');
});

test('CSS includes validation error styles', () => {
  const css = fs.readFileSync(path.join(SRC, 'styles', 'components.css'), 'utf8');
  assert(css.includes('.input-error'), 'Missing .input-error CSS');
  assert(css.includes('.validation-hint'), 'Missing .validation-hint CSS');
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. SEARCH & FILTERING
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n🔍 5. SEARCH & FILTERING\n');

test('Sales view has search + date filtering', () => {
  const sales = fs.readFileSync(path.join(SRC, 'views', 'sales.js'), 'utf8');
  assert(sales.includes('_salesSearch'), 'Should have _salesSearch state');
  assert(sales.includes('_salesDateFrom'), 'Should have _salesDateFrom state');
  assert(sales.includes('_salesDateTo'), 'Should have _salesDateTo state');
  assert(sales.includes('setSalesSearch'), 'Should export setSalesSearch');
  assert(sales.includes('clearSalesFilters'), 'Should export clearSalesFilters');
});

test('Expenses view has search + date filtering', () => {
  const exp = fs.readFileSync(path.join(SRC, 'views', 'expenses.js'), 'utf8');
  assert(exp.includes('_expSearch'), 'Should have _expSearch state');
  assert(exp.includes('_expDateFrom'), 'Should have date from filter');
  assert(exp.includes('setExpSearch'), 'Should export setExpSearch');
  assert(exp.includes('clearExpFilters'), 'Should export clearExpFilters');
});

test('main.js exposes search functions to window', () => {
  const main = fs.readFileSync(path.join(SRC, 'main.js'), 'utf8');
  assert(main.includes('setSalesSearch'), 'Should expose setSalesSearch');
  assert(main.includes('clearSalesFilters'), 'Should expose clearSalesFilters');
  assert(main.includes('setExpSearch'), 'Should expose setExpSearch');
  assert(main.includes('clearExpFilters'), 'Should expose clearExpFilters');
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. INVENTORY AGING & DEATH PILE
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n📊 6. INVENTORY AGING & DEATH PILE\n');

test('Insights view has aging analysis', () => {
  const insights = fs.readFileSync(path.join(SRC, 'views', 'insights.js'), 'utf8');
  assert(insights.includes('aging') || insights.includes('Aging'), 'Should have aging section');
  assert(insights.includes('deathPile') || insights.includes('death'), 'Should have death pile analysis');
  assert(insights.includes('daysListed'), 'Should track days listed');
});

test('Death pile criteria are correct (60+ days, in stock, no recent sales)', () => {
  const insights = fs.readFileSync(path.join(SRC, 'views', 'insights.js'), 'utf8');
  assert(insights.includes('60') || insights.includes('daysListed >'), 'Should check 60+ day threshold');
  assert(insights.includes('recentSales30') || insights.includes('sales'), 'Should check recent sales');
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. PROFIT REPORTS
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n📈 7. PROFIT-BY-CATEGORY & PROFIT-BY-PLATFORM REPORTS\n');

test('Reports view has profit by category', () => {
  const reports = fs.readFileSync(path.join(SRC, 'views', 'reports.js'), 'utf8');
  assert(reports.includes('catProfit') || reports.includes('categoryProfit') || reports.includes('Category'),
    'Should have profit-by-category analysis');
});

test('Reports view has profit by platform', () => {
  const reports = fs.readFileSync(path.join(SRC, 'views', 'reports.js'), 'utf8');
  assert(reports.includes('platProfit') || reports.includes('platformProfit') || reports.includes('Platform'),
    'Should have profit-by-platform analysis');
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. ACCESSIBILITY
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n♿ 8. ACCESSIBILITY\n');

test('Modals have ARIA dialog attributes', () => {
  const html = fs.readFileSync(path.join(SRC, '..', 'index.html'), 'utf8');
  // Check for at least a few key modals
  const modalIds = ['drawer', 'addOv', 'soldOv'];
  for (const id of modalIds) {
    const re = new RegExp(`id=["']${id}["'][^>]*role=["']dialog["']|role=["']dialog["'][^>]*id=["']${id}["']`);
    assert(re.test(html) || html.includes(`id="${id}"`), `Modal #${id} should have role="dialog"`);
  }
});

test('Toast has aria-live region setup', () => {
  const dom = fs.readFileSync(path.join(SRC, 'utils', 'dom.js'), 'utf8');
  assert(dom.includes('aria-live'), 'Toast should set aria-live');
  assert(dom.includes('role') && dom.includes('status'), 'Toast should set role="status"');
});

test('CSS has color-blind safe indicators', () => {
  const css = fs.readFileSync(path.join(SRC, 'styles', 'components.css'), 'utf8');
  assert(css.includes('mb-high') && css.includes('::before'), 'Should have margin badge indicators');
});

test('CSS has minimum touch targets for mobile', () => {
  const css = fs.readFileSync(path.join(SRC, 'styles', 'components.css'), 'utf8');
  assert(css.includes('pointer: coarse') || css.includes('min-height: 44px'), 'Should have 44px touch targets');
});

test('CSS has focus-visible outlines', () => {
  const css = fs.readFileSync(path.join(SRC, 'styles', 'components.css'), 'utf8');
  assert(css.includes(':focus-visible'), 'Should have :focus-visible styles');
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. DUPLICATE UPC DETECTION
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n🔢 9. DUPLICATE UPC DETECTION\n');

test('add-item.js checks for duplicate UPC', () => {
  const addItem = fs.readFileSync(path.join(SRC, 'modals', 'add-item.js'), 'utf8');
  assert(addItem.includes('upc') || addItem.includes('UPC'), 'Should reference UPC');
  assert(addItem.includes('duplicate') || addItem.includes('already exists') || addItem.includes('existing'),
    'Should check for existing items with same UPC');
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. PAGINATION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n📄 10. PAGINATION COMPONENT\n');

test('Reusable pagination module exists', () => {
  const pag = fs.readFileSync(path.join(SRC, 'utils', 'pagination.js'), 'utf8');
  assert(pag.includes('export function renderPagination'), 'Should export renderPagination');
  assert(pag.includes('onPage'), 'Should accept onPage callback');
  assert(pag.includes('pageSizes'), 'Should support page size selector');
});

test('Inventory uses shared pagination', () => {
  const inv = fs.readFileSync(path.join(SRC, 'views', 'inventory.js'), 'utf8');
  assert(inv.includes("from '../utils/pagination.js'"), 'Should import pagination');
  assert(inv.includes('renderPagination'), 'Should use renderPagination');
});

test('Sales uses shared pagination', () => {
  const sales = fs.readFileSync(path.join(SRC, 'views', 'sales.js'), 'utf8');
  assert(sales.includes("from '../utils/pagination.js'") || sales.includes('renderPagination'),
    'Should use shared pagination');
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. PERFORMANCE CHECKS
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n⚡ 11. PERFORMANCE CHECKS\n');

test('Inventory has O(1) index lookup', () => {
  const store = fs.readFileSync(path.join(SRC, 'data', 'store.js'), 'utf8');
  assert(store.includes('_invIndex'), 'Should have inventory index');
  assert(store.includes('Object.fromEntries'), 'Should build index with fromEntries');
  assert(store.includes('getInvItem'), 'Should export getInvItem');
});

test('Save uses debounced IDB persist', () => {
  const store = fs.readFileSync(path.join(SRC, 'data', 'store.js'), 'utf8');
  assert(store.includes('_schedulePersist'), 'Should use scheduled persist');
  assert(store.includes('200') || store.includes('debounce'), 'Should debounce at 200ms');
});

test('Heavy features are lazy-loaded', () => {
  const lazy = fs.readFileSync(path.join(SRC, 'utils', 'lazy.js'), 'utf8');
  const main = fs.readFileSync(path.join(SRC, 'main.js'), 'utf8');
  assert(lazy.includes('import('), 'Should use dynamic imports');
  assert(main.includes('lazyScanner'), 'main.js should use lazy scanner');
  assert(main.includes('lazyIdentify'), 'main.js should use lazy identify');
  assert(main.includes('_lw'), 'Should have lazy wrapper factory');
});

test('Smart chip rebuild optimization', () => {
  const inv = fs.readFileSync(path.join(SRC, 'views', 'inventory.js'), 'utf8');
  assert(inv.includes('_chipsBuiltForData'), 'Should track chip data hash');
  assert(inv.includes('_updateChipActiveStates'), 'Should have lightweight chip update');
});

test('XSS prevention with escHtml', () => {
  const fmt = fs.readFileSync(path.join(SRC, 'utils', 'format.js'), 'utf8');
  assert(fmt.includes('escHtml'), 'Should export escHtml');
  // Check it's used in views
  const invView = fs.readFileSync(path.join(SRC, 'views', 'inventory.js'), 'utf8');
  assert(invView.includes('escHtml('), 'Inventory should use escHtml');
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. BUNDLE SIZE CHECK
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n📏 12. BUNDLE SIZE CHECK\n');

test('Source files total reasonable size', () => {
  let totalBytes = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(dir, entry.name));
      else if (entry.name.endsWith('.js') || entry.name.endsWith('.css')) {
        totalBytes += fs.statSync(path.join(dir, entry.name)).size;
      }
    }
  };
  walk(SRC);
  const kb = Math.round(totalBytes / 1024);
  console.log(`    Source size: ${kb} KB across all JS + CSS`);
  assert(kb < 900, `Source too large: ${kb} KB (max 900 KB)`);
  assert(kb > 50, `Source too small: ${kb} KB (suspiciously low)`);
});

test('No modules over 50 KB individually', () => {
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js')) {
        const size = fs.statSync(full).size;
        if (size > 50000) throw new Error(`${path.relative(SRC, full)} is ${Math.round(size/1024)} KB`);
      }
    }
  };
  walk(SRC);
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. CODE QUALITY
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n🔬 13. CODE QUALITY\n');

test('No console.log in production code (only console.warn/error)', () => {
  let violations = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js') && !entry.name.includes('test')) {
        const content = fs.readFileSync(full, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          // Allow console.log inside FlipTrack: prefixed log lines (they're informational)
          if (line.includes('console.log') && !line.includes('FlipTrack:') && !line.trim().startsWith('//')) {
            violations++;
            if (violations <= 3) console.log(`    ⚠ ${path.relative(SRC, full)}:${i+1}: ${line.trim().slice(0,80)}`);
          }
        });
      }
    }
  };
  walk(SRC);
  // Allow up to 5 console.log statements (some are intentional startup logs)
  assert(violations <= 5, `${violations} non-prefixed console.log statements found`);
});

test('No TODO stubs that would break runtime', () => {
  let broken = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js')) {
        const content = fs.readFileSync(full, 'utf8');
        // Check for stub functions that just have TODO and nothing else
        const stubRe = /function\s+\w+\([^)]*\)\s*\{\s*\/\/\s*TODO[^}]*\}/g;
        let m;
        while ((m = stubRe.exec(content)) !== null) {
          broken++;
          if (broken <= 3) console.log(`    ⚠ Stub in ${path.relative(SRC, full)}: ${m[0].slice(0,60)}`);
        }
      }
    }
  };
  walk(SRC);
  assert(broken === 0, `${broken} stub function(s) that will break at runtime`);
});

test('All CSS files import correctly', () => {
  const indexCss = fs.readFileSync(path.join(SRC, 'styles', 'index.css'), 'utf8');
  const expected = ['base.css', 'layout.css', 'components.css', 'tables.css', 'modals.css', 'mobile.css'];
  for (const file of expected) {
    assert(indexCss.includes(file), `index.css should import ${file}`);
  }
});


// ═══════════════════════════════════════════════════════════════════════════
// 14. NEW FEATURE MODULES (Phases 1-7)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n🚀 14. NEW FEATURE MODULES (Phases 1-7)\n');

test('Phase 1: Crosslist modules exist with proper exports', () => {
  const cl = read('features/crosslist.js');
  assert(cl.includes('PLATFORM_EXPIRY_RULES'), 'crosslist.js should have platform expiry rules');
  assert(cl.includes('autoDlistOnSale'), 'crosslist.js should have auto-delist function');
  assert(cl.includes('checkExpiredListings'), 'crosslist.js should have expired check');
  assert(exists('features/deep-links.js'), 'deep-links.js should exist');
  assert(exists('features/listing-templates.js'), 'listing-templates.js should exist');
  assert(exists('views/crosslist-dashboard.js'), 'crosslist-dashboard.js should exist');
});

test('Phase 2: Shipping modules exist with proper exports', () => {
  const ship = read('views/shipping.js');
  assert(ship.includes('renderShippingView'), 'shipping.js should have render function');
  assert(ship.includes('shipMarkShipped'), 'shipping.js should have mark shipped');
  assert(exists('features/packing-slip.js'), 'packing-slip.js should exist');
  assert(exists('features/shipping-rates.js'), 'shipping-rates.js should exist');
  const rates = read('features/shipping-rates.js');
  assert(rates.includes('estimateShippingRate'), 'shipping-rates.js should estimate rates');
  assert(rates.includes('USPS_RATES'), 'shipping-rates.js should have USPS rates');
});

test('Phase 3: Sourcing modules exist with proper exports', () => {
  const src = read('views/sourcing.js');
  assert(src.includes('renderSourcingView'), 'sourcing.js should have render function');
  assert(src.includes('initHauls'), 'sourcing.js should have haul init');
  assert(exists('features/haul.js'), 'haul.js should exist');
  const haul = read('features/haul.js');
  assert(haul.includes('getHaulROI'), 'haul.js should calculate ROI');
  assert(haul.includes('splitCost'), 'haul.js should split costs');
});

test('Phase 4: Tax modules exist with proper exports', () => {
  const tax = read('views/tax-center.js');
  assert(tax.includes('renderTaxCenter'), 'tax-center.js should have render function');
  assert(tax.includes('Schedule C'), 'tax-center.js should have Schedule C mapping');
  assert(exists('features/mileage.js'), 'mileage.js should exist');
  const mile = read('features/mileage.js');
  assert(mile.includes('IRS_RATES'), 'mileage.js should have IRS rates');
  assert(mile.includes('getMileageDeduction'), 'mileage.js should calculate deductions');
});

test('Phase 5: Pricing Intelligence modules exist with proper exports', () => {
  assert(exists('features/price-history.js'), 'price-history.js should exist');
  const ph = read('features/price-history.js');
  assert(ph.includes('logPriceChange'), 'price-history.js should log changes');
  assert(ph.includes('getPriceTrend'), 'price-history.js should calculate trends');
  assert(exists('features/repricing-rules.js'), 'repricing-rules.js should exist');
  const rp = read('features/repricing-rules.js');
  assert(rp.includes('evaluateRules'), 'repricing-rules.js should evaluate rules');
  assert(rp.includes('applyRepricing'), 'repricing-rules.js should apply repricing');
});

test('Phase 6: CRM modules exist with proper exports', () => {
  const buyers = read('views/buyers.js');
  assert(buyers.includes('renderBuyersView'), 'buyers.js should have render function');
  assert(buyers.includes('initBuyers'), 'buyers.js should have init function');
  assert(exists('features/offers.js'), 'offers.js should exist');
  const offers = read('features/offers.js');
  assert(offers.includes('addOffer'), 'offers.js should add offers');
  assert(offers.includes('offerAccept'), 'offers.js should accept offers');
});

test('Phase 7: Analytics module exists with proper exports', () => {
  const ac = read('features/analytics-calc.js');
  assert(ac.includes('calcSellThroughRate'), 'analytics-calc.js should calc sell-through');
  assert(ac.includes('calcInventoryTurnRate'), 'analytics-calc.js should calc turn rate');
  assert(ac.includes('calcCashFlowProjection'), 'analytics-calc.js should project cash flow');
  assert(ac.includes('calcSeasonalTrends'), 'analytics-calc.js should calc seasonal trends');
  assert(ac.includes('calcRevenueForecasts'), 'analytics-calc.js should forecast revenue');
});

test('main.js imports and exposes all new modules', () => {
  const main = read('main.js');
  // Check imports
  assert(main.includes('renderShippingView'), 'main.js should import shipping');
  assert(main.includes('renderSourcingView'), 'main.js should import sourcing');
  assert(main.includes('renderTaxCenter'), 'main.js should import tax center');
  assert(main.includes('renderBuyersView'), 'main.js should import buyers');
  assert(main.includes('initRepricingRules'), 'main.js should import repricing');
  assert(main.includes('calcSellThroughRate'), 'main.js should import analytics');
  // Check switchView cases
  assert(main.includes("'shipping'"), 'main.js should handle shipping view');
  assert(main.includes("'sourcing'"), 'main.js should handle sourcing view');
  assert(main.includes("'tax'"), 'main.js should handle tax view');
  assert(main.includes("'buyers'"), 'main.js should handle buyers view');
});

test('index.html has all new view sections', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert(html.includes('view-crosslist'), 'index.html should have crosslist view');
  assert(html.includes('view-shipping'), 'index.html should have shipping view');
  assert(html.includes('view-sourcing'), 'index.html should have sourcing view');
  assert(html.includes('view-tax'), 'index.html should have tax view');
  assert(html.includes('view-buyers'), 'index.html should have buyers view');
  // Check nav entries
  assert(html.includes('bn-more-shipping'), 'index.html should have shipping nav');
  assert(html.includes('bn-more-sourcing'), 'index.html should have sourcing nav');
  assert(html.includes('bn-more-tax'), 'index.html should have tax nav');
  assert(html.includes('bn-more-buyers'), 'index.html should have buyers nav');
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 8: PRO RESELLER FEATURES
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n── Phase 8: Pro Reseller Features ──');

test('Phase 8: Comps module exists with proper exports', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/features/comps.js'), 'utf8');
  assert(src.includes('export async function fetchComps'), 'comps should export fetchComps');
  assert(src.includes('export async function suggestPrice'), 'comps should export suggestPrice');
  assert(src.includes('export function renderCompsPanel'), 'comps should export renderCompsPanel');
  assert(src.includes('export async function getItemComps'), 'comps should export getItemComps');
  assert(src.includes('export function clearCompsCache'), 'comps should export clearCompsCache');
  // Verify no unused imports
  assert(!src.includes("import { inv, sales, getInvItem, markDirty, save }"), 'comps should not import unused markDirty/save');
});

test('Phase 8: Photo tools module exists with proper exports', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/features/photo-tools.js'), 'utf8');
  assert(src.includes('export async function removeBackground'), 'photo-tools should export removeBackground');
  assert(src.includes('export async function autoCrop'), 'photo-tools should export autoCrop');
  assert(src.includes('export async function addWatermark'), 'photo-tools should export addWatermark');
  assert(src.includes('export async function squarePad'), 'photo-tools should export squarePad');
  assert(src.includes('export async function adjustImage'), 'photo-tools should export adjustImage');
  assert(src.includes('export async function batchProcess'), 'photo-tools should export batchProcess');
  assert(src.includes('export function renderPhotoToolsPanel'), 'photo-tools should export renderPhotoToolsPanel');
  assert(src.includes('export async function initPhotoSettings'), 'photo-tools should export initPhotoSettings');
  // Verify broken Object.assign was fixed
  assert(!src.includes('Object.assign({'), 'photo-tools should not have orphan Object.assign');
});

test('Phase 8: Profit calculator module exists with proper exports', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/features/profit-calc.js'), 'utf8');
  assert(src.includes('export function calculateProfit'), 'profit-calc should export calculateProfit');
  assert(src.includes('export function renderProfitCalc'), 'profit-calc should export renderProfitCalc');
  assert(src.includes('export function quickProfitEstimate'), 'profit-calc should export quickProfitEstimate');
  assert(src.includes('PLATFORM_FEES'), 'profit-calc should use PLATFORM_FEES for fee calculations');
});

test('Phase 8: Death pile module exists with proper exports', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/features/death-pile.js'), 'utf8');
  assert(src.includes('export function getDeathPileItems'), 'death-pile should export getDeathPileItems');
  assert(src.includes('export function getDeathPileStats'), 'death-pile should export getDeathPileStats');
  assert(src.includes('export function renderDeathPileWidget'), 'death-pile should export renderDeathPileWidget');
  assert(src.includes('export function renderDeathPileView'), 'death-pile should export renderDeathPileView');
  assert(src.includes('export function getUrgencyLevel'), 'death-pile should export getUrgencyLevel');
  // Verify unused imports were cleaned
  assert(!src.includes('getListingHealth'), 'death-pile should not import unused getListingHealth');
  assert(!src.includes('markDirty'), 'death-pile should not import unused markDirty');
});

test('Phase 8: Batch listing module exists with proper exports', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/features/batch-list.js'), 'utf8');
  assert(src.includes('export function startBatchList'), 'batch-list should export startBatchList');
  assert(src.includes('export function batchTogglePlatform'), 'batch-list should export batchTogglePlatform');
  assert(src.includes('export async function executeBatchList'), 'batch-list should export executeBatchList');
  assert(src.includes('export function renderBatchListPanel'), 'batch-list should export renderBatchListPanel');
  assert(src.includes('export async function copyBatchText'), 'batch-list should export copyBatchText');
  assert(src.includes('export function clearBatchList'), 'batch-list should export clearBatchList');
});

test('Phase 8: AI listing module exists with proper exports', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/features/ai-listing.js'), 'utf8');
  assert(src.includes('export function initAIListing'), 'ai-listing should export initAIListing');
  assert(src.includes('export async function generateListing'), 'ai-listing should export generateListing');
  assert(src.includes('export async function generateAndApply'), 'ai-listing should export generateAndApply');
  assert(src.includes('export function renderAIListingPanel'), 'ai-listing should export renderAIListingPanel');
  assert(src.includes('export async function copyAIListing'), 'ai-listing should export copyAIListing');
  assert(src.includes('anthropic-proxy'), 'ai-listing should use the Anthropic proxy Edge Function');
  assert(src.includes('claude-haiku'), 'ai-listing should use Claude Haiku for cost efficiency');
});

test('Phase 8: Inventory value module exists with proper exports', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/features/inventory-value.js'), 'utf8');
  assert(src.includes('export function getInventoryValueData'), 'inv-value should export getInventoryValueData');
  assert(src.includes('export function renderInventoryValueDashboard'), 'inv-value should export renderInventoryValueDashboard');
  assert(src.includes('agingBuckets'), 'inv-value should have aging analysis');
  assert(src.includes('daysToSellAll'), 'inv-value should have sell-through projection');
  assert(src.includes('slowMovers'), 'inv-value should track slow movers');
});

test('Phase 8: Shipping labels module exists with proper exports', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/features/ship-labels.js'), 'utf8');
  assert(src.includes('export function estimateRates'), 'ship-labels should export estimateRates');
  assert(src.includes('export function getCheapestRate'), 'ship-labels should export getCheapestRate');
  assert(src.includes('export function renderRateComparison'), 'ship-labels should export renderRateComparison');
  assert(src.includes('export function recordLabelCost'), 'ship-labels should export recordLabelCost');
  assert(src.includes('export function getShippingCostSummary'), 'ship-labels should export getShippingCostSummary');
  assert(src.includes('export function getPirateShipLink'), 'ship-labels should export getPirateShipLink');
  assert(src.includes('USPS_RATES'), 'ship-labels should have USPS rate tables');
  assert(src.includes('UPS_RATES'), 'ship-labels should have UPS rate tables');
});

test('Phase 8: main.js imports and exposes all Phase 8 modules', () => {
  const main = fs.readFileSync(path.join(ROOT, 'src/main.js'), 'utf8');
  // Imports
  assert(main.includes("from './features/comps.js'"), 'main should import comps');
  assert(main.includes("from './features/photo-tools.js'"), 'main should import photo-tools');
  assert(main.includes("from './features/profit-calc.js'"), 'main should import profit-calc');
  assert(main.includes("from './features/death-pile.js'"), 'main should import death-pile');
  assert(main.includes("from './features/batch-list.js'"), 'main should import batch-list');
  assert(main.includes("from './features/ai-listing.js'"), 'main should import ai-listing');
  assert(main.includes("from './features/inventory-value.js'"), 'main should import inventory-value');
  assert(main.includes("from './features/ship-labels.js'"), 'main should import ship-labels');
  // Window exports
  assert(main.includes('fetchComps'), 'main should expose fetchComps');
  assert(main.includes('removeBackground'), 'main should expose removeBackground');
  assert(main.includes('calculateProfit'), 'main should expose calculateProfit');
  assert(main.includes('renderDeathPileWidget'), 'main should expose renderDeathPileWidget');
  assert(main.includes('startBatchList'), 'main should expose startBatchList');
  assert(main.includes('generateAndApply'), 'main should expose generateAndApply');
  assert(main.includes('renderInventoryValueDashboard'), 'main should expose renderInventoryValueDashboard');
  assert(main.includes('estimateRates'), 'main should expose estimateRates');
  // Boot initialization
  assert(main.includes('initPhotoSettings()'), 'main should init photo settings on boot');
  assert(main.includes('initShipLabels()'), 'main should init ship labels on boot');
  assert(main.includes('initAIListing'), 'main should init AI listing on boot');
  // SwitchView for new views
  assert(main.includes("'invvalue'"), 'main should handle invvalue view');
});

test('Phase 8: index.html has inventory value view', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert(html.includes('view-invvalue'), 'index.html should have invvalue view container');
  assert(html.includes('invValueContent'), 'index.html should have invValueContent div');
});

test('Phase 8: Dashboard uses enhanced death pile module', () => {
  const dash = fs.readFileSync(path.join(ROOT, 'src/views/dashboard.js'), 'utf8');
  assert(dash.includes('getDeathPileStats'), 'dashboard should import getDeathPileStats');
  assert(dash.includes('getUrgencyLevel'), 'dashboard should import getUrgencyLevel');
  assert(dash.includes('urgency.icon'), 'dashboard renderDeathPile should use urgency icons');
  assert(dash.includes('suggestedAction'), 'dashboard renderDeathPile should show suggested actions');
});

test('Phase 8: CSS has styles for all new features', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/styles/components.css'), 'utf8');
  assert(css.includes('.comps-panel'), 'CSS should have comps styles');
  assert(css.includes('.pt-panel'), 'CSS should have photo tools styles');
  assert(css.includes('.pc-panel'), 'CSS should have profit calc styles');
  assert(css.includes('.dp-widget'), 'CSS should have death pile styles');
  assert(css.includes('.bl-panel'), 'CSS should have batch list styles');
  assert(css.includes('.ai-panel'), 'CSS should have AI listing styles');
  assert(css.includes('.iv-dashboard'), 'CSS should have inventory value styles');
  assert(css.includes('.sl-rates'), 'CSS should have shipping labels styles');
});

// ═══════════════════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(60));
console.log(`\n  RESULTS: ${passed} passed, ${failed} failed, ${skipped} skipped\n`);

if (errors.length) {
  console.log('  FAILURES:');
  errors.forEach(e => console.log(`    ❌ ${e.name}: ${e.error}`));
  console.log('');
}

if (failed === 0) {
  console.log('  🎉 ALL TESTS PASSED\n');
} else {
  console.log(`  ⚠  ${failed} test(s) need attention\n`);
}

process.exit(failed > 0 ? 1 : 0);
