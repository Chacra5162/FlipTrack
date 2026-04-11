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
    target: '#salesVelocitySection',
    fallbackTarget: '#profitHeatmap',
    title: 'Sales Velocity',
    desc: 'Track your weekly selling pace with a bar chart. Shows items sold per week, a trend arrow comparing recent vs. prior weeks, and a dotted average line. Hover any bar for revenue details.',
    position: 'top',
    viewRequirement: 'dashboard',
  },
  {
    section: 'Dashboard',
    target: '#agingSummarySection',
    fallbackTarget: '#deathPileSection',
    title: 'Inventory Aging',
    desc: 'See how long items have been sitting — broken into 30, 60, and 90+ day buckets. Shows total cost at risk so you know what to reprice or delist before stock goes stale.',
    position: 'top',
    viewRequirement: 'dashboard',
  },
  {
    section: 'Dashboard',
    target: '#sStreak',
    fallbackTarget: '.stats-grid',
    title: 'Selling Streak',
    desc: 'Tracks consecutive days with at least one sale. A motivational nudge to keep the momentum going — your streak resets if a day passes without a sale.',
    position: 'top',
    viewRequirement: 'dashboard',
  },
  {
    section: 'Dashboard',
    target: '#offerAgingAlert',
    fallbackTarget: '#priceAlerts',
    title: 'Offer Aging Alerts',
    desc: 'Flags pending offers older than 24 hours so you never let a buyer go cold. Shows item name, offer amount, and days since the offer was made.',
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
  {
    section: 'Dashboard',
    target: '#goalGapSection',
    fallbackTarget: '#kpiGoalsSection',
    title: 'Close the Gap Widget',
    desc: 'When you have monthly goals set, this widget shows how much revenue you still need and recommends your top 5 items by Flip Score that could close the gap. Each item links to its drawer for quick action.',
    position: 'top',
    viewRequirement: 'dashboard',
  },
  {
    section: 'Dashboard',
    target: '#peerBenchSection',
    fallbackTarget: '#goalGapSection',
    title: 'Peer Benchmarking',
    desc: 'See how your monthly metrics stack up against other resellers. Percentile bars show your ranking for revenue, profit, units sold, ROI, and sell-through. Tier badge shows Power Seller, Full-Time, Part-Time, or Hobbyist classification. Privacy-first — data never leaves your device.',
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
    desc: 'Snap a photo and FlipTrack\'s AI identifies the item, suggests pricing, and finds comparable listings across platforms. Descriptions are now more accurate — AI only uses provided item details and won\'t fabricate specs.',
    position: 'bottom-left',
    desktopOnly: true,
    viewRequirement: 'dashboard',
  },
  {
    section: 'Adding Inventory',
    target: '#headerBatchBtn',
    title: 'Snap to Add',
    desc: 'The Snap button on the Add Item modal opens the camera and runs AI Identify in one tap — photo to pre-filled form in seconds. Great for rapid item entry at hauls.',
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
  {
    section: 'Adding Inventory',
    target: '#variantToggleBtn',
    fallbackTarget: '#headerAddBtn',
    title: 'Multi-Variant Items',
    desc: 'Selling S/M/L/XL of the same shirt? Click "+ Variants" in the Add Item form to create one parent item with multiple size/color children. Preset sizes (S/M/L/XL) or add custom labels. Each variant tracks its own stock and price.',
    position: 'bottom',
    viewRequirement: 'dashboard',
  },
  {
    section: 'Adding Inventory',
    target: '#headerAddBtn',
    fallbackTarget: '#headerBatchBtn',
    title: 'Book Mode & ISBN Lookup',
    desc: 'When you select the "Books" category, Book Mode auto-activates. Scan or enter an ISBN to auto-populate title, author, and publisher. Enter Amazon sales rank, use FBA fee calculator, and apply book-specific condition tags (Like New, Very Good, Good, Acceptable).',
    position: 'bottom-left',
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
  {
    section: 'Inventory',
    target: '.qty-stepper',
    fallbackTarget: '#invBody',
    title: 'eBay Quantity Sync',
    desc: 'Using the stock stepper (+/\u2212) on inventory automatically syncs quantity to eBay. Rapid clicks are debounced (1.5s) so multiple adjustments batch into one API call.',
    position: 'top',
    viewRequirement: 'inventory',
  },
  {
    section: 'Inventory',
    target: '#invViewToggle',
    fallbackTarget: '.inv-toolbar',
    title: 'Card View Toggle',
    desc: 'Switch between table and card view with the grid icon button. Card view shows photo thumbnails, prices, qty badges, and action buttons in a responsive grid — optimized for phones. Your preference is saved.',
    position: 'bottom',
    viewRequirement: 'inventory',
  },
  {
    section: 'Inventory',
    target: '#poshSyncBtn',
    fallbackTarget: '.inv-toolbar',
    title: 'Poshmark Sales Check',
    desc: 'Click the Poshmark button to open a reconciliation modal listing all your Poshmark items. Mark items as sold right from the list — it records the sale with the 20% Poshmark fee automatically.',
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
  {
    section: 'Sales',
    target: '#salesBody',
    fallbackTarget: '#view-sales',
    title: 'Edit Any Sale',
    desc: 'Made a typo? Click the Edit button on any sale row to reopen the sold modal pre-filled with that sale\'s data. Change price, quantity, fees, platform, or date — the item\'s stock adjusts automatically.',
    position: 'top',
    viewRequirement: 'sales',
  },
  {
    section: 'Sales',
    target: '#s_addl_fee_pct',
    fallbackTarget: '#s_fees',
    title: 'Additional Fee %',
    desc: 'Some platforms charge extra fees not captured by the API — like eBay\'s store performance surcharge. Enter the percentage here and it\'s calculated on the correct fee basis (order total for eBay). Shows as an orange badge in the sales table.',
    position: 'top',
  },
  {
    section: 'Sales',
    target: '#salesBody',
    fallbackTarget: '#view-sales',
    title: 'eBay Auto-Sync',
    desc: 'eBay sales are automatically detected and recorded — price, fees, tracking, and buyer info all pulled from the API. Hit the Sync button anytime to check for new orders. Fees include FVF and per-order charges; add store surcharges via the Addl Fee % field.',
    position: 'top',
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
    desc: 'Track packing materials — boxes, mailers, tape, labels. Set low-stock alerts so you never run out mid-shipment. Use Supply Cost Allocation to auto-distribute supply costs across items for true profit tracking.',
    position: 'top',
    viewRequirement: 'supplies',
  },
  {
    section: 'Finances',
    target: '#supplyAllocSection',
    fallbackTarget: '#view-supplies',
    title: 'Supply Cost Auto-Allocation',
    desc: 'Automatically distribute bulk supply costs across inventory items as part of COGS. Five methods: Per-Item, Per-Shipment, Even Split, By Weight Class, and By Category. Set up rules, run allocation, and see true profit per item with supply costs factored into cost calculations.',
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
    desc: 'Deep dive into sourcing performance — ROI by source, best categories per location, and spend vs. return trends. Click any source name in the performance table to drill down and see all items from that source with cost, price, status, and profit.',
    position: 'top',
    viewRequirement: 'sourcinganalytics',
  },
  {
    section: 'Advanced Analytics',
    target: '#view-platformroi',
    fallbackTarget: '#platformROIContent',
    title: 'Platform ROI',
    desc: 'Side-by-side comparison of every selling platform. See margins, fees, average days to sell, return rates, and revenue share so you know where to focus your listings.',
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

  /* ── SECTION 7.5: SMART PRICING & SOURCING ─────────────────────────── */
  {
    section: 'Smart Pricing',
    target: '#headerIdBtn',
    title: 'Comps Auto-Pricing',
    desc: 'When you Identify an item, FlipTrack now auto-fetches comp data from eBay sold listings. The comp-verified price appears as a badge with median, range, and confidence level — no manual research needed.',
    position: 'bottom-left',
    desktopOnly: true,
    viewRequirement: 'dashboard',
  },
  {
    section: 'Smart Pricing',
    target: '#headerIdBtn',
    title: 'Source Score — BUY / PASS / MAYBE',
    desc: 'Enter your cost in the Identify results and get an instant BUY, MAYBE, or PASS verdict. Factors in margin, comp confidence, estimated profit, and days-to-sell from your own category history.',
    position: 'bottom-left',
    desktopOnly: true,
    viewRequirement: 'dashboard',
  },
  {
    section: 'Smart Pricing',
    target: '.flip-score-col',
    fallbackTarget: '#invBody',
    title: 'Flip Score (0-100)',
    desc: 'Every item gets a Flip Score combining margin (30pts), freshness (25pts), listing quality (25pts), and demand signal (20pts). Sort your inventory by Flip Score to find your best and worst performers. Pro tier only.',
    position: 'top',
    viewRequirement: 'inventory',
  },
  {
    section: 'Smart Pricing',
    target: '#repricingContent',
    fallbackTarget: '#view-insights',
    title: 'Smart Reprice with Comps',
    desc: 'Create repricing rules that set prices to the comp median — market-driven pricing instead of blind percentage drops. Works alongside your existing time-based rules.',
    position: 'top',
    viewRequirement: 'insights',
  },
  {
    section: 'Smart Pricing',
    target: '#arbitrageSlot',
    fallbackTarget: '#view-insights',
    title: 'Arbitrage Alerts',
    desc: 'FlipTrack scans your inventory against market comps and flags items priced 20%+ below market (raise your price!) or 30%+ above (consider lowering). Shows in Insights.',
    position: 'top',
    viewRequirement: 'insights',
  },

  /* ── SECTION 7.6: CONTENT & ENGAGEMENT ────────────────────────────── */
  {
    section: 'Content & Engagement',
    target: '#notifBellBtn',
    fallbackTarget: '#notifBadge',
    title: 'Daily Sales Digest',
    desc: 'Every morning, FlipTrack shows yesterday\'s sales count, revenue, profit, and selling streak as an in-app notification and optional browser push. Never miss a day\'s results.',
    position: 'bottom-left',
    viewRequirement: 'dashboard',
  },
  {
    section: 'Content & Engagement',
    target: '#bulkMenu',
    fallbackTarget: '#bulkBar',
    title: 'Social Photo Gallery',
    desc: 'Select items and click "Create Gallery" in the bulk menu to generate branded collages for Instagram/TikTok. Choose 2x2 grid, 3x3 grid, hero, or stories layout with price overlays and FlipTrack branding.',
    position: 'bottom',
    viewRequirement: 'inventory',
  },
  {
    section: 'Content & Engagement',
    target: '#seasonalSection',
    fallbackTarget: '#view-insights',
    title: 'Seasonal Demand Calendar',
    desc: 'A monthly heatmap showing when your categories sell best. "Your Electronics sell 3x faster in November." Helps you stock up on the right items at the right time.',
    position: 'top',
    viewRequirement: 'insights',
  },

  /* ── SECTION 7.7: SOURCING & HAULS ────────────────────────────────── */
  {
    section: 'Operations',
    target: '#view-sourcing',
    fallbackTarget: '#sourcingContent',
    title: 'AI Sourcing Mode',
    desc: 'Open Sourcing Mode from the Sourcing view for instant "buy or pass" decisions at thrift stores. Full-screen camera captures an item, AI identifies it, fetches sold comps, and gives a BUY/MAYBE/PASS verdict with ROI calculation. Add to inventory in one tap with optional auto-queue for crosslisting on selected platforms.',
    position: 'top',
    viewRequirement: 'sourcing',
  },
  {
    section: 'Operations',
    target: '#view-sourcing',
    fallbackTarget: '#sourcingContent',
    title: 'Haul ROI Receipts',
    desc: 'After a sourcing trip, click "Share Receipt" on any haul card to generate a branded 1080x1350 receipt PNG. Shows items, total spent, estimated value, profit, and ROI — perfect for sharing on social media.',
    position: 'top',
    viewRequirement: 'sourcing',
  },
  {
    section: 'Operations',
    target: '#view-sourcing',
    fallbackTarget: '#sourcingContent',
    title: 'Smart Source Matching',
    desc: 'Source names are automatically normalized — "Marshall\'s" and "Marshalls" merge into one entry. This keeps your Sourcing Analytics clean with accurate per-source ROI. Existing duplicates are fixed automatically on page load.',
    position: 'top',
    viewRequirement: 'sourcing',
  },

  /* ── SECTION 7.8: ADVANCED FEATURES ───────────────────────────────── */
  {
    section: 'Advanced Features',
    target: '#ptPreview',
    fallbackTarget: '#view-inventory',
    title: 'Photo Tools Suite',
    desc: 'Open any item drawer and scroll to Photos for the full editing suite: AI background removal, auto-crop, watermarking, square padding, brightness/contrast adjustment, and rotation. Process photos without leaving FlipTrack.',
    position: 'top',
    viewRequirement: 'inventory',
  },
  {
    section: 'Advanced Features',
    target: '#bulkMenu',
    fallbackTarget: '#invTable',
    title: 'Batch Listing Mode',
    desc: 'Select multiple items and use Batch List to generate AI-powered listing text for all of them at once. Choose target platforms, copy all listings to clipboard, or open deep links in sequence to list rapidly.',
    position: 'bottom',
    viewRequirement: 'inventory',
  },
  {
    section: 'Advanced Features',
    target: '#view-tax',
    fallbackTarget: '#taxContent',
    title: 'Donation Tracker',
    desc: 'Items sitting in your death pile at critical/extreme urgency show a Donate button. Record the fair market value and organization — it auto-populates as a Charitable Donations line in your Schedule C.',
    position: 'top',
    viewRequirement: 'tax',
  },
  {
    section: 'Advanced Features',
    target: '#headerBatchBtn',
    fallbackTarget: '#headerAddBtn',
    title: 'Voice-Powered Adding',
    desc: 'Open Voice Add from the Tools menu (or the bottom nav More menu on mobile) to dictate items hands-free. FlipTrack uses the Web Speech API to parse item names, prices, and conditions from natural speech.',
    position: 'bottom-left',
    desktopOnly: true,
    viewRequirement: 'dashboard',
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
  {
    section: 'Crosslisting',
    target: '#ebayListingTabs',
    fallbackTarget: '#crosslistContent',
    title: 'Tabbed eBay Listing',
    desc: 'The Quick tab covers essential fields (Brand, Color, Size, Department, Description, Condition Notes) and the More tab has apparel details, footwear, and other eBay aspects. Use the AI Generate button to auto-write descriptions.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Crosslisting',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Auto-Delist on Sale',
    desc: 'When an item sells and quantity hits 0, FlipTrack automatically ends eBay listings, deactivates Etsy listings, and sends a notification for platforms without API (Depop, Poshmark, Mercari, etc.) so you remember to manually delist.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Crosslisting',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Auction Smart Stats',
    desc: 'Auction items show Current Bid, Start Bid, and Reserve Price instead of profit/margin/ROI in the item drawer — since the final price is unknown until the auction ends. Bids update from eBay on each sync. Auctions are also excluded from margin alerts.',
    position: 'top',
    viewRequirement: 'crosslist',
  },

  {
    section: 'Crosslisting',
    target: '.days-col',
    fallbackTarget: '#invBody',
    title: 'Listing Expiry & Sale Badges',
    desc: 'Inventory rows now show days since last sale and listing expiry countdowns. Expiry badges appear when any platform listing expires within 7 days — amber warning so you can relist in time.',
    position: 'top',
    viewRequirement: 'inventory',
  },
  {
    section: 'Crosslisting',
    target: '.days-col',
    fallbackTarget: '#invBody',
    title: 'Platform Listing Dates',
    desc: 'The "days listed" column now uses the actual marketplace listing date instead of when you added the item to FlipTrack, giving you accurate aging data.',
    position: 'top',
    viewRequirement: 'inventory',
  },

  /* ── SECTION 8.5: WHATNOT LIVE SELLING SUITE ─────────────────────────── */
  {
    section: 'Whatnot',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Whatnot Shows Manager',
    desc: 'Create and manage Whatnot live shows from the Shows tab. Add items, set dates, clone past shows, and track history across all tabs.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Whatnot',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Live Show Dashboard',
    desc: 'Real-time dashboard during live shows: revenue, sell-through, elapsed timer, items remaining, rev/hour. Quick buttons to mark sold or giveaway.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Whatnot',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Lot Bundling',
    desc: 'Group show items into auction lots with names and starting bids. Lots appear on run sheets with item breakdowns and total value calculations. Create lots from the Shows tab when viewing a show.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Whatnot',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Show Revenue Goals',
    desc: 'Set a revenue target for each show with a real-time progress bar during live shows. The Analytics tab tracks your goal hit rate across all shows so you can see improvement over time.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Whatnot',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Giveaway & Loss Leader Tracker',
    desc: 'Track items given away during shows for engagement. Records cost impact on P&L so profit calculations stay accurate. Use the giveaway button during live shows or from the show detail view.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Whatnot',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Post-Show Recap Card',
    desc: 'Auto-generate a shareable text recap after shows: items sold, revenue, sell-through, top seller, giveaways, and goal status. Copy to clipboard for posting on social media.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Whatnot',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Starting Bid Recommendations',
    desc: 'Data-driven bid suggestions in the Pricing tab. Based on show history, comp data, and list prices. Shows suggested bid, min/max range, and reasoning for each item.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Whatnot',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Category Rotation Planner',
    desc: 'Identifies categories that haven\'t been featured recently in shows. Shows days since last show, sell-through rate, and urgency status (overdue, due soon, recent). Ensures balanced show content over time.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Whatnot',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Show-to-Show Comparison',
    desc: 'Select any two past shows for side-by-side comparison: items, sold count, sell-through, revenue, profit, rev/hour, duration, and peak viewers.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Whatnot',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Shipping Queue & Bin Locations',
    desc: 'Global view of all unshipped sold items from Whatnot shows in the Shipping tab. One-click "Mark Shipped" workflow. Per-item bin/shelf location field shown on run sheets, live dashboard, and shipping queue for fast item retrieval during shows.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Whatnot',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Smart Inventory Actions',
    desc: 'Prescriptive suggestions: "$1 auction," "Bundle into lot," "Drop price," "Crosslist," or "Donate." Based on aging, show history, and comps.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Whatnot',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Platform Differential Pricing',
    desc: 'Suggested prices per platform: +25% Poshmark, -5% Mercari, auction bids for Whatnot, +15% Etsy. Accounts for fees and buyer culture.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Whatnot',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Show Countdown Push Reminders',
    desc: 'Push notifications at 60 minutes and 15 minutes before scheduled shows. Uses VAPID push infrastructure for background delivery even when FlipTrack is closed.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Whatnot',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'AI Description Limits',
    desc: 'AI-generated descriptions respect platform character limits: 1,000 for Whatnot/Depop/Mercari, 1,500 for Poshmark, 4,000 for eBay. Whatnot descriptions use live-show-friendly language optimized for auction engagement.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Whatnot',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Import Whatnot Sales CSV',
    desc: 'Import tab: upload Order History or Livestream Report CSV from Whatnot. Auto-matches items by SKU or name, creates sale records with correct fees, and skips duplicates.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Whatnot',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Show-to-Sale Sync',
    desc: 'Marking items sold during a live show now prompts for sale price and auto-creates a sale record. For past shows, use "Sync Sales" to backfill missing records.',
    position: 'top',
    viewRequirement: 'crosslist',
  },
  {
    section: 'Whatnot',
    target: '#crosslistContent',
    fallbackTarget: '#view-crosslist',
    title: 'Payout Reconciliation',
    desc: 'Reconcile tab: enter payout amount and date range to compare against recorded sales. Shows discrepancy, per-show breakdown, and possible reasons.',
    position: 'top',
    viewRequirement: 'crosslist',
  },

  /* ── SECTION 9: SHIPPING & SOURCING ──────────────────────────────────── */
  {
    section: 'Operations',
    target: '#view-shipping',
    fallbackTarget: '#shippingContent',
    title: 'Shipping & Tracking',
    desc: 'See all unshipped orders in one place. Log carrier, tracking number, and shipping cost. Tracking numbers are stored on sale records for quick lookup. Print packing slips and track ship times.',
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
  {
    section: 'Customers',
    target: '#view-buyers',
    fallbackTarget: '#buyersContent',
    title: 'Loyalty & Spending Tiers',
    desc: 'Two badge systems track buyer value. Loyalty tiers (New → Regular → VIP → Elite) are based on purchase count. Spending tiers (Shopper → Regular → Big Spender → Store Sponsor) track total dollars spent. Both badges show on buyer cards.',
    position: 'top',
    viewRequirement: 'buyers',
  },
  {
    section: 'Customers',
    target: '#view-buyers',
    fallbackTarget: '#buyersContent',
    title: 'Offer Management',
    desc: 'Track purchase offers from buyers with accept, reject, or counter actions. View pending offers per item in the drawer, and monitor offer aging on the dashboard — offers older than 24 hours are flagged so no buyer goes cold.',
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
    target: '#pushToggleBtn',
    fallbackTarget: '#notifToggleBtn',
    title: 'Background Push Notifications',
    desc: 'Enable VAPID Web Push to receive low-stock and out-of-stock alerts even when FlipTrack is completely closed. Uses your browser\'s native push system — no tab needed. Toggle on/off from the dashboard.',
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
    desc: 'Import inventory or expenses from CSV files and export formatted spreadsheets for any platform. Expense CSV import auto-detects columns from bank exports. Full inventory, sales, and tax exports in Reports.',
    position: 'top',
    viewRequirement: 'dashboard',
  },
  {
    section: 'Settings & Tools',
    target: '#csvExportSection',
    fallbackTarget: '#headerAddBtn',
    title: 'Backup & Restore',
    desc: 'Download a full JSON backup of all your data — inventory, sales, expenses, and supplies — in one file. Restore from any backup to recover your data instantly. Your safety net beyond cloud sync.',
    position: 'top',
    viewRequirement: 'dashboard',
  },
  {
    section: 'Settings & Tools',
    target: '#syncDotBtn',
    fallbackTarget: '#syncDot',
    title: 'Teams & Collaboration',
    desc: 'Create or join a team to share inventory data with partners or employees. Team owners generate 7-day invite codes. Three roles: Viewer (read-only), Editor (add/edit items and sales), and Admin (full access including member management). Open the account menu to manage your team.',
    position: 'bottom-left',
    viewRequirement: 'dashboard',
  },
  {
    section: 'Settings & Tools',
    target: '#headerAddBtn',
    fallbackTarget: '.app-header',
    title: 'Keyboard Shortcuts',
    desc: 'Speed up your workflow with keyboard shortcuts: N to add item, S to record sale, / to search, D for dashboard, I for inventory, Esc to close modals. Press ? to see the full shortcut reference.',
    position: 'bottom',
    viewRequirement: 'dashboard',
  },
  {
    section: 'Settings & Tools',
    target: '#syncDotBtn',
    fallbackTarget: '#syncDot',
    title: 'Community Pricing',
    desc: 'Opt in to share anonymized pricing data and see how your prices compare to the community average. Toggle on from Settings — your item names and personal data are never shared, only category/price aggregates.',
    position: 'bottom-left',
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

// ── AUTO-PLAY STATE ─────────────────────────────────────────────────────────
let _autoPlayTimer = null;
let _autoPlaySpeed = 6000; // ms per step (default 6 seconds)
let _isAutoPlaying = false;

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
      <div class="tour-autoplay" id="tourAutoplay">
        <button class="tour-auto-btn" id="tourPlayBtn" title="Auto-play tour">▶ Watch</button>
        <div class="tour-speed-wrap" id="tourSpeedWrap" style="display:none">
          <button class="tour-speed-btn tour-speed-active" data-speed="6000">1x</button>
          <button class="tour-speed-btn" data-speed="4000">1.5x</button>
          <button class="tour-speed-btn" data-speed="2500">2.5x</button>
        </div>
      </div>
      <div class="tour-actions">
        <button class="tour-skip" id="tourSkip">Skip Tour</button>
        <div style="flex:1"></div>
        <button class="tour-prev" id="tourPrev">← Back</button>
        <button class="tour-next" id="tourNext">Next →</button>
      </div>
      <div class="tour-progress" id="tourProgress">
        <div class="tour-progress-fill" id="tourProgressFill"></div>
        <div class="tour-progress-timer" id="tourProgressTimer" style="display:none"></div>
      </div>
    </div>
  `;
  document.body.appendChild(div);
  _overlayEl = div;

  document.getElementById('tourSkip').addEventListener('click', endTour);
  document.getElementById('tourPrev').addEventListener('click', () => { stopAutoPlay(); goToStep(_currentStep - 1); });
  document.getElementById('tourNext').addEventListener('click', () => {
    stopAutoPlay();
    if (_currentStep >= _activeSteps.length - 1) endTour();
    else goToStep(_currentStep + 1);
  });
  document.getElementById('tourBackdrop').addEventListener('click', endTour);

  // Auto-play controls
  document.getElementById('tourPlayBtn').addEventListener('click', () => {
    if (_isAutoPlaying) stopAutoPlay();
    else startAutoPlay();
  });
  document.getElementById('tourSpeedWrap').addEventListener('click', (e) => {
    const btn = e.target.closest('.tour-speed-btn');
    if (!btn) return;
    _autoPlaySpeed = parseInt(btn.dataset.speed);
    document.querySelectorAll('.tour-speed-btn').forEach(b => b.classList.remove('tour-speed-active'));
    btn.classList.add('tour-speed-active');
    // Restart timer with new speed if playing
    if (_isAutoPlaying) { clearInterval(_autoPlayTimer); _scheduleNextStep(); }
  });

  // Keyboard navigation
  _overlayEl._keyHandler = (e) => {
    if (!_overlayEl.classList.contains('on')) return;
    if (e.key === 'Escape') endTour();
    else if (e.key === ' ') { e.preventDefault(); if (_isAutoPlaying) stopAutoPlay(); else startAutoPlay(); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      stopAutoPlay();
      if (_currentStep >= _activeSteps.length - 1) endTour();
      else goToStep(_currentStep + 1);
    } else if (e.key === 'ArrowLeft') { stopAutoPlay(); goToStep(_currentStep - 1); }
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

// ── AUTO-PLAY ENGINE ──────────────────────────────────────────────────────

function _scheduleNextStep() {
  _autoPlayTimer = setTimeout(() => {
    if (!_isAutoPlaying) return;
    if (_currentStep >= _activeSteps.length - 1) {
      stopAutoPlay();
      endTour();
    } else {
      goToStep(_currentStep + 1);
      _scheduleNextStep();
    }
  }, _autoPlaySpeed);

  // Animate the progress timer bar
  const timer = document.getElementById('tourProgressTimer');
  if (timer) {
    timer.style.transition = 'none';
    timer.style.width = '0%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        timer.style.transition = `width ${_autoPlaySpeed}ms linear`;
        timer.style.width = '100%';
      });
    });
  }
}

function startAutoPlay() {
  _isAutoPlaying = true;
  const btn = document.getElementById('tourPlayBtn');
  if (btn) { btn.textContent = '⏸ Pause'; btn.classList.add('tour-auto-active'); }
  const speedWrap = document.getElementById('tourSpeedWrap');
  if (speedWrap) speedWrap.style.display = 'flex';
  const timer = document.getElementById('tourProgressTimer');
  if (timer) timer.style.display = 'block';
  _scheduleNextStep();
}

export function stopAutoPlay() {
  _isAutoPlaying = false;
  if (_autoPlayTimer) { clearTimeout(_autoPlayTimer); _autoPlayTimer = null; }
  const btn = document.getElementById('tourPlayBtn');
  if (btn) { btn.textContent = '▶ Watch'; btn.classList.remove('tour-auto-active'); }
  const timer = document.getElementById('tourProgressTimer');
  if (timer) { timer.style.transition = 'none'; timer.style.width = '0%'; }
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
  stopAutoPlay();
  if (_overlayEl) {
    if (_overlayEl._keyHandler) document.removeEventListener('keydown', _overlayEl._keyHandler);
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
