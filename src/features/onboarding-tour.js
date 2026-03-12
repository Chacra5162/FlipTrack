/**
 * onboarding-tour.js — Comprehensive guided tour for FlipTrack
 * Multi-section walkthrough covering every major feature.
 * Steps with hidden targets are automatically skipped.
 * Steps with viewRequirement auto-navigate to the correct view.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   TOUR STEP DEFINITIONS — grouped by section
   ═══════════════════════════════════════════════════════════════════════════ */

const TOUR_STEPS = [

  /* ── SECTION 1: DASHBOARD ────────────────────────────────────────────── */
  {
    section: 'Dashboard',
    target: '.stats-grid',
    title: 'Your Command Center',
    desc: 'Six live KPI cards show inventory value, revenue, profit, ROI, low-stock alerts, and average days to sell. They update in real-time as you work.',
    position: 'bottom',
    viewRequirement: 'dashboard',
  },
  {
    section: 'Dashboard',
    target: '#profitHeatmap',
    fallbackTarget: '.kpi-goals-wrap, #kpiGoalsSection',
    title: 'Goals & Profit Calendar',
    desc: 'Set monthly revenue, profit, and listing goals. The heatmap shows daily profit — green days are profit, red are losses. Spot trends at a glance.',
    position: 'top',
    viewRequirement: 'dashboard',
  },
  {
    section: 'Dashboard',
    target: '#platBreakdown',
    fallbackTarget: '#recentInv',
    title: 'Platform Breakdown & Activity',
    desc: 'See revenue split by platform, recent inventory additions, and latest sales — all from the dashboard without switching views.',
    position: 'top',
    viewRequirement: 'dashboard',
  },

  /* ── SECTION 2: ADDING INVENTORY ─────────────────────────────────────── */
  {
    section: 'Adding Inventory',
    target: '#headerAddBtn',
    mobileTarget: '.bnav-fab',
    title: 'Add Items',
    desc: 'Open the Add Item form. Enter name, category, cost, price, condition, platform, photos, dimensions, and notes. Everything you need in one modal.',
    position: 'bottom-left',
    mobilePosition: 'top',
    viewRequirement: 'dashboard',
  },
  {
    section: 'Adding Inventory',
    target: '#headerIdBtn',
    title: 'AI-Powered Identification',
    desc: 'Snap a photo and FlipTrack\'s AI identifies the item, suggests pricing, and finds comparable listings across platforms. Works with clothing, electronics, books, and more.',
    position: 'bottom-left',
    desktopOnly: true,
    viewRequirement: 'dashboard',
  },
  {
    section: 'Adding Inventory',
    target: '#headerBatchBtn',
    title: 'Batch Barcode Scanner',
    desc: 'Scan multiple barcodes in rapid succession. Each scan queues an item with auto-filled details. Add them all to inventory at once — perfect for thrift hauls.',
    position: 'bottom-left',
    desktopOnly: true,
    viewRequirement: 'dashboard',
  },

  /* ── SECTION 3: INVENTORY MANAGEMENT ─────────────────────────────────── */
  {
    section: 'Inventory',
    target: '#invTable',
    fallbackTarget: '#invBody, .inv-table-wrap',
    title: 'Inventory Table',
    desc: 'Your full inventory with photos, details, prices, and status. Click any row to open the item drawer for full editing. Sort by any column header.',
    position: 'top',
    viewRequirement: 'inventory',
  },
  {
    section: 'Inventory',
    target: '#filterToggleBtn',
    fallbackTarget: '#filterPanel',
    title: 'Smart Filters',
    desc: 'Filter by platform, category, subcategory, condition, smoke/damage status, and days listed. Stack multiple filters to find exactly what you need.',
    position: 'bottom',
    viewRequirement: 'inventory',
  },
  {
    section: 'Inventory',
    target: '.inv-bulk-bar',
    fallbackTarget: '#invTable thead',
    title: 'Bulk Actions',
    desc: 'Select multiple items with checkboxes, then bulk-delete, bulk-mark-as-sold, or bulk-edit. Toggle All selects every item on the current page.',
    position: 'bottom',
    viewRequirement: 'inventory',
  },

  /* ── SECTION 4: SALES & RECORDING ────────────────────────────────────── */
  {
    section: 'Sales',
    target: '#view-sales',
    fallbackTarget: '#salesBody',
    title: 'Sales Log',
    desc: 'Every sale recorded with platform, date, quantity, price, fees, shipping cost, and net profit. Filter by date range or platform to analyze performance.',
    position: 'top',
    viewRequirement: 'sales',
  },
  {
    section: 'Sales',
    target: '#salesTotalLbl',
    fallbackTarget: '#salesFilterBar',
    title: 'Sales Totals & Filters',
    desc: 'See running totals for revenue, fees, and profit. Filter by platform or date range to drill into specific time periods or marketplaces.',
    position: 'bottom',
    viewRequirement: 'sales',
  },

  /* ── SECTION 5: FINANCIAL TRACKING ───────────────────────────────────── */
  {
    section: 'Finances',
    target: '#view-expenses',
    fallbackTarget: '#expBody',
    title: 'Expense Tracker',
    desc: 'Log every business expense — shipping supplies, packaging, subscriptions, postage, and more. Categorized for easy tax-time reporting.',
    position: 'top',
    viewRequirement: 'expenses',
  },
  {
    section: 'Finances',
    target: '#view-supplies',
    fallbackTarget: '#supBody',
    title: 'Supplies Manager',
    desc: 'Track packing materials — boxes, mailers, tape, labels. Set low-stock alerts so you never run out mid-shipment.',
    position: 'top',
    viewRequirement: 'supplies',
  },
  {
    section: 'Finances',
    target: '#view-tax',
    fallbackTarget: '#taxContent',
    title: 'Tax Center',
    desc: 'Quarterly estimated tax breakdown with Schedule C line items mapped automatically. Mileage deduction tracking and one-click tax report exports.',
    position: 'top',
    viewRequirement: 'tax',
  },

  /* ── SECTION 6: ANALYTICS & REPORTS ──────────────────────────────────── */
  {
    section: 'Analytics',
    target: '#view-profit',
    fallbackTarget: '#profitDashContent',
    title: 'Profit Dashboard',
    desc: 'Deep profit analytics — KPI cards, per-item profit table, platform and category profitability comparisons, and time-series trends. Filter by date range, platform, or category.',
    position: 'top',
    viewRequirement: 'profit',
  },
  {
    section: 'Analytics',
    target: '#view-insights',
    fallbackTarget: '#insightsContent',
    title: 'Insights Dashboard',
    desc: 'Sell-through rates, inventory turn rate, cash flow projections, seasonal trends, and platform performance — all the analytics a reseller needs.',
    position: 'top',
    viewRequirement: 'insights',
  },
  {
    section: 'Analytics',
    target: '#view-breakdown',
    fallbackTarget: '#breakdownContent',
    title: 'Value Breakdown',
    desc: 'See your inventory value broken down by category and subcategory. Click into any category to drill down. Identify where your capital is tied up.',
    position: 'top',
    viewRequirement: 'breakdown',
  },
  {
    section: 'Analytics',
    target: '#view-reports',
    fallbackTarget: '#reportsContent',
    title: 'Reports & Exports',
    desc: 'Generate P&L reports and tax summaries as PDFs. One-click CSV exports formatted for eBay, Poshmark, Mercari, Depop, and more.',
    position: 'top',
    viewRequirement: 'reports',
  },

  /* ── SECTION 7: ADVANCED ANALYTICS ───────────────────────────────────── */
  {
    section: 'Advanced Analytics',
    target: '#view-invhealth',
    fallbackTarget: '#invHealthContent',
    title: 'Inventory Health',
    desc: 'Aging breakdown, sell-through analysis, ROI rankings, and category comparisons. Spot stale stock early and understand where your money is working hardest.',
    position: 'top',
    viewRequirement: 'invhealth',
  },
  {
    section: 'Advanced Analytics',
    target: '#view-sourcinganalytics',
    fallbackTarget: '#sourcingAnalyticsContent',
    title: 'Sourcing Analytics',
    desc: 'Deep dive into sourcing performance — ROI by source, best categories per location, and spend vs. return trends. Find your most profitable sourcing spots.',
    position: 'top',
    viewRequirement: 'sourcinganalytics',
  },
  {
    section: 'Advanced Analytics',
    target: '#view-platformroi',
    fallbackTarget: '#platformROIContent',
    title: 'Platform ROI',
    desc: 'Side-by-side comparison of every selling platform. See margins, fees, average days to sell, and revenue share so you know where to focus your listings.',
    position: 'top',
    viewRequirement: 'platformroi',
  },
  {
    section: 'Advanced Analytics',
    target: '#view-periodcompare',
    fallbackTarget: '#periodCompareContent',
    title: 'Period Compare',
    desc: 'Compare any two time periods — this month vs. last, this quarter vs. last year. Revenue, profit, items sold, and trends shown side by side with change indicators.',
    position: 'top',
    viewRequirement: 'periodcompare',
  },
  {
    section: 'Advanced Analytics',
    target: '#view-returns',
    fallbackTarget: '#returnsContent',
    title: 'Returns Tracker',
    desc: 'Log returns with reason codes, track refund costs, and identify problem items or categories with high return rates. Includes restocking workflow.',
    position: 'top',
    viewRequirement: 'returns',
  },
  {
    section: 'Advanced Analytics',
    target: '#view-listingscore',
    fallbackTarget: '#listingScoreContent',
    title: 'Listing Scores',
    desc: 'Every listing gets a completeness score based on photos, description, pricing, dimensions, and more. See what to improve to maximize your sell-through rate.',
    position: 'top',
    viewRequirement: 'listingscore',
  },
  {
    section: 'Advanced Analytics',
    target: '#view-marginalerts',
    fallbackTarget: '#marginAlertsContent',
    title: 'Margin Alerts',
    desc: 'Real-time notifications when items fall below profit thresholds, have negative margins, or sit too long without selling. Configurable alert thresholds.',
    position: 'top',
    viewRequirement: 'marginalerts',
  },

  /* ── SECTION 8: CROSSLISTING & PLATFORMS ─────────────────────────────── */
  {
    section: 'Crosslisting',
    target: '#view-crosslist',
    fallbackTarget: '#crosslistContent',
    title: 'Crosslist Manager',
    desc: 'Track which items are listed on which platforms. See expiring and expired listings at a glance. One-click relist with deep links to each marketplace.',
    position: 'top',
    viewRequirement: 'crosslist',
  },

  /* ── SECTION 9: SHIPPING & SOURCING ──────────────────────────────────── */
  {
    section: 'Operations',
    target: '#view-shipping',
    fallbackTarget: '#shippingContent',
    title: 'Shipping Queue',
    desc: 'See all unshipped orders in one place. Log carrier, tracking number, and actual shipping cost. Print packing slips and track ship times.',
    position: 'top',
    viewRequirement: 'shipping',
  },
  {
    section: 'Operations',
    target: '#view-sourcing',
    fallbackTarget: '#sourcingContent',
    title: 'Sourcing & Hauls',
    desc: 'Log sourcing trips with location, total spent, and linked items. Track ROI per trip and find your best sourcing spots over time.',
    position: 'top',
    viewRequirement: 'sourcing',
  },

  /* ── SECTION 10: CUSTOMERS ───────────────────────────────────────────── */
  {
    section: 'Customers',
    target: '#view-buyers',
    fallbackTarget: '#buyersContent',
    title: 'Buyer CRM',
    desc: 'Track your buyers — platform handles, purchase history, total spent, and notes. Build repeat-customer relationships and spot your best buyers.',
    position: 'top',
    viewRequirement: 'buyers',
  },

  /* ── SECTION 11: SETTINGS & TOOLS ────────────────────────────────────── */
  {
    section: 'Settings & Tools',
    target: '#themeBtn',
    title: 'Theme Toggle',
    desc: 'Switch between dark and light themes. Your preference is saved automatically.',
    position: 'bottom-left',
    viewRequirement: 'dashboard',
  },
  {
    section: 'Settings & Tools',
    target: '#fsSizeBtn',
    title: 'Font & Accessibility',
    desc: 'Adjust font size (Small, Default, Large, XL) and switch to OpenDyslexic for improved readability. Your choices persist across sessions.',
    position: 'bottom-left',
    viewRequirement: 'dashboard',
  },
  {
    section: 'Settings & Tools',
    target: '#notifBellBtn',
    fallbackTarget: '#notifBadge',
    title: 'Notifications',
    desc: 'Get alerts for low stock, listing expirations, price changes, and goals reached. Enable push notifications to stay updated even when the tab is closed.',
    position: 'bottom-left',
    viewRequirement: 'dashboard',
  },
  {
    section: 'Settings & Tools',
    target: '#syncDotBtn',
    fallbackTarget: '#syncDot',
    title: 'Sync & Account',
    desc: 'Your data syncs to the cloud automatically. The colored dot shows sync status — green is synced, yellow is pending. Tap to open the account menu.',
    position: 'bottom-left',
    viewRequirement: 'dashboard',
  },
  {
    section: 'Settings & Tools',
    target: '#csvExportSection',
    fallbackTarget: '#headerAddBtn',
    title: 'CSV Import & Export',
    desc: 'Import inventory from CSV files and export formatted spreadsheets for any platform. Full inventory, sales, and tax exports available in Reports.',
    position: 'top',
    viewRequirement: 'dashboard',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   TOUR ENGINE
   ═══════════════════════════════════════════════════════════════════════════ */

let _currentStep = -1;
let _overlayEl = null;
let _activeSteps = [];
let _returnView = null; // remember where user started

function isElementVisible(el) {
  if (!el) return false;
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function isMobile() {
  return window.innerWidth <= 820;
}

/** Navigate to a view if needed — uses global switchView */
function ensureView(viewName) {
  if (!viewName) return;
  const currentView = document.querySelector('.view[style*="display: block"], .view[style*="display:block"]');
  const currentId = currentView?.id?.replace('view-', '') || 'dashboard';
  if (currentId !== viewName && typeof window.switchView === 'function') {
    window.switchView(viewName);
  }
}

function resolveTarget(step) {
  if (isMobile() && step.mobileTarget) {
    const el = document.querySelector(step.mobileTarget);
    if (isElementVisible(el)) return { el, position: step.mobilePosition || step.position };
  }
  const el = document.querySelector(step.target);
  if (isElementVisible(el)) return { el, position: step.position };
  if (step.fallbackTarget) {
    const selectors = step.fallbackTarget.split(',').map(s => s.trim());
    for (const sel of selectors) {
      const fb = document.querySelector(sel);
      if (isElementVisible(fb)) return { el: fb, position: step.position };
    }
  }
  return null;
}

function buildActiveSteps() {
  _activeSteps = [];
  for (const step of TOUR_STEPS) {
    if (step.desktopOnly && isMobile()) continue;

    // Temporarily switch to the required view to check visibility
    if (step.viewRequirement) ensureView(step.viewRequirement);

    // Small delay not possible synchronously — we trust that switchView is synchronous
    const resolved = resolveTarget(step);
    if (resolved) {
      _activeSteps.push({ ...step, _resolved: resolved });
    }
  }
  // Return to first step's view
  if (_activeSteps.length > 0 && _activeSteps[0].viewRequirement) {
    ensureView(_activeSteps[0].viewRequirement);
  }
}

/** Get unique section names from active steps */
function getSections() {
  const seen = new Set();
  const sections = [];
  for (const step of _activeSteps) {
    if (step.section && !seen.has(step.section)) {
      seen.add(step.section);
      sections.push(step.section);
    }
  }
  return sections;
}

function createOverlay() {
  if (_overlayEl) return;
  const div = document.createElement('div');
  div.id = 'tourOverlay';
  div.innerHTML = `
    <div class="tour-backdrop" id="tourBackdrop"></div>
    <div class="tour-spotlight" id="tourSpotlight"></div>
    <div class="tour-tooltip" id="tourTooltip">
      <div class="tour-tooltip-arrow" id="tourArrow"></div>
      <div class="tour-section-badge" id="tourSection"></div>
      <div class="tour-step-badge" id="tourBadge"></div>
      <div class="tour-title" id="tourTitle"></div>
      <div class="tour-desc" id="tourDesc"></div>
      <div class="tour-actions">
        <button class="tour-skip" id="tourSkip">Skip Tour</button>
        <div style="flex:1"></div>
        <button class="tour-prev" id="tourPrev">← Back</button>
        <button class="tour-next" id="tourNext">Next →</button>
      </div>
      <div class="tour-progress" id="tourProgress">
        <div class="tour-progress-fill" id="tourProgressFill"></div>
      </div>
    </div>
  `;
  document.body.appendChild(div);
  _overlayEl = div;

  document.getElementById('tourSkip').addEventListener('click', endTour);
  document.getElementById('tourPrev').addEventListener('click', () => goToStep(_currentStep - 1));
  document.getElementById('tourNext').addEventListener('click', () => {
    if (_currentStep >= _activeSteps.length - 1) endTour();
    else goToStep(_currentStep + 1);
  });
  document.getElementById('tourBackdrop').addEventListener('click', endTour);

  // Keyboard navigation
  _overlayEl._keyHandler = (e) => {
    if (!_overlayEl.classList.contains('on')) return;
    if (e.key === 'Escape') endTour();
    else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      if (_currentStep >= _activeSteps.length - 1) endTour();
      else goToStep(_currentStep + 1);
    } else if (e.key === 'ArrowLeft') goToStep(_currentStep - 1);
  };
  document.addEventListener('keydown', _overlayEl._keyHandler);
}

/** Clamp a rect so spotlight doesn't exceed viewport */
function clampRect(rect) {
  const vw = window.innerWidth, vh = window.innerHeight;
  // If the element is taller/wider than 60% of viewport, treat as a "full view" target
  // and show a smaller highlight region (top portion only)
  let top = rect.top, left = rect.left, width = rect.width, height = rect.height;
  if (height > vh * 0.6) { height = Math.min(120, vh * 0.2); }
  if (width > vw * 0.9) { left = 16; width = vw - 32; }
  return { top, left, width, height, bottom: top + height, right: left + width };
}

function goToStep(idx) {
  if (idx < 0 || idx >= _activeSteps.length) return;
  _currentStep = idx;
  const step = _activeSteps[idx];

  // Navigate to the required view
  if (step.viewRequirement) ensureView(step.viewRequirement);

  // Allow DOM to settle after view switch
  setTimeout(() => {
    const resolved = resolveTarget(step) || step._resolved;
    const targetEl = resolved?.el;
    const position = resolved?.position || step.position;

    const spotlight = document.getElementById('tourSpotlight');
    const tooltip = document.getElementById('tourTooltip');
    const vw = window.innerWidth, vh = window.innerHeight;
    const margin = 12; // min distance from viewport edges
    const ttW = Math.min(340, vw - margin * 2);

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      setTimeout(() => {
        const rawRect = targetEl.getBoundingClientRect();
        const rect = clampRect(rawRect);
        const pad = 8;

        spotlight.style.cssText = `
          position: fixed;
          top: ${Math.max(0, rect.top - pad)}px;
          left: ${Math.max(0, rect.left - pad)}px;
          width: ${Math.min(rect.width + pad * 2, vw)}px;
          height: ${Math.min(rect.height + pad * 2, vh * 0.5)}px;
          display: block;
        `;

        // Position tooltip — try preferred position, then flip if it overflows
        let ttTop, ttLeft;

        // Horizontal: center on target, clamped to viewport
        if (position === 'bottom-left') {
          ttLeft = Math.max(margin, rect.right - ttW);
        } else {
          ttLeft = rect.left + rect.width / 2 - ttW / 2;
        }
        ttLeft = Math.max(margin, Math.min(ttLeft, vw - ttW - margin));

        // Vertical: place below or above target
        const spaceBelow = vh - rect.bottom - 16;
        const spaceAbove = rect.top - 16;
        const estimatedHeight = 220; // rough tooltip height

        if (position === 'bottom' || position === 'bottom-left') {
          // Prefer below
          if (spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove) {
            ttTop = rect.bottom + 16;
          } else {
            // Flip to above
            ttTop = rect.top - estimatedHeight - 16;
          }
        } else {
          // Prefer above (position === 'top')
          if (spaceAbove >= estimatedHeight || spaceAbove >= spaceBelow) {
            ttTop = rect.top - estimatedHeight - 16;
          } else {
            // Flip to below
            ttTop = rect.bottom + 16;
          }
        }

        // Final vertical clamp — never go off-screen
        ttTop = Math.max(margin, Math.min(ttTop, vh - estimatedHeight - margin));

        tooltip.style.cssText = `position:fixed;top:${ttTop}px;left:${ttLeft}px;display:block;width:${ttW}px;max-height:${vh - margin * 2}px;overflow-y:auto;`;
      }, 300);
    } else {
      spotlight.style.display = 'none';
      tooltip.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);display:block;width:${ttW}px;max-height:${vh - margin * 2}px;overflow-y:auto;`;
    }

    // Section badge
    document.getElementById('tourSection').textContent = step.section || '';
    document.getElementById('tourSection').style.display = step.section ? '' : 'none';

    document.getElementById('tourTitle').textContent = step.title;
    document.getElementById('tourDesc').textContent = step.desc;
    document.getElementById('tourBadge').textContent = `Step ${idx + 1} of ${_activeSteps.length}`;
    document.getElementById('tourPrev').style.display = idx === 0 ? 'none' : '';
    document.getElementById('tourNext').textContent = idx >= _activeSteps.length - 1 ? 'Done ✓' : 'Next →';

    // Progress bar
    const pct = ((idx + 1) / _activeSteps.length) * 100;
    document.getElementById('tourProgressFill').style.width = `${pct}%`;
  }, 80);
}

export function startTour() {
  // Remember current view so we can return
  const currentView = document.querySelector('.view[style*="display: block"], .view[style*="display:block"]');
  _returnView = currentView?.id?.replace('view-', '') || 'dashboard';

  buildActiveSteps();
  if (_activeSteps.length === 0) return;
  createOverlay();
  _overlayEl.style.display = '';
  _overlayEl.classList.add('on');
  goToStep(0);
  localStorage.setItem('ft_toured', '1');
}

export function endTour() {
  if (_overlayEl) {
    // Remove keydown listener to prevent memory leak
    if (_overlayEl._keyHandler) {
      document.removeEventListener('keydown', _overlayEl._keyHandler);
    }
    _overlayEl.classList.remove('on');
    _overlayEl.style.display = 'none';
    const spotlight = document.getElementById('tourSpotlight');
    const tooltip = document.getElementById('tourTooltip');
    if (spotlight) spotlight.style.display = 'none';
    if (tooltip) tooltip.style.display = 'none';
  }
  _currentStep = -1;
  localStorage.setItem('ft_toured', '1');

  // Return to the view the user was on
  if (_returnView && typeof window.switchView === 'function') {
    window.switchView(_returnView);
  }
}

/** Auto-start tour if user hasn't seen it */
export function maybeStartTour() {
  if (!localStorage.getItem('ft_toured') && !localStorage.getItem('ft_welcomed')) {
    setTimeout(() => startTour(), 1500);
  }
}
