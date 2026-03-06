/**
 * tiers.js — Subscription tier definitions and feature access maps
 * Single source of truth for what each tier unlocks.
 */

export const TIERS = { FREE: 'free', PRO: 'pro', UNLIMITED: 'unlimited' };

const TIER_ORDER = { free: 0, pro: 1, unlimited: 2 };

/** Compare two tiers. Returns true if userTier >= requiredTier */
export function canAccess(userTier, requiredTier) {
  return (TIER_ORDER[userTier] || 0) >= (TIER_ORDER[requiredTier] || 0);
}

/** Get numeric level for a tier */
export function tierLevel(tier) {
  return TIER_ORDER[tier] || 0;
}

// ── VIEW → MINIMUM TIER ──────────────────────────────────────────────────────
export const VIEW_TIER_MAP = {
  // Free
  dashboard:  'free',
  inventory:  'free',
  sales:      'free',
  expenses:   'free',
  supplies:   'free',
  // Pro
  insights:   'pro',
  profit:     'pro',
  breakdown:  'pro',
  reports:    'pro',
  crosslist:  'pro',
  shipping:   'pro',
  buyers:     'pro',
  sourcing:   'pro',
  // Unlimited
  tax:        'unlimited',
};

// ── TOOL BUTTON ID → MINIMUM TIER ───────────────────────────────────────────
export const TOOL_TIER_MAP = {
  headerIdBtn:    'pro',       // AI Identify
  headerBatchBtn: 'unlimited', // Batch Scan
};

// ── MARKETING COPY FOR UPGRADE MODAL ─────────────────────────────────────────
export const TIER_DISPLAY = {
  free: {
    name: 'Free',
    price: '$0/mo',
    features: [
      'Up to 50 inventory items',
      'Sales logging',
      'Expense tracking',
      'Basic dashboard & stats',
      'CSV export',
    ],
  },
  pro: {
    name: 'Pro',
    price: '$12/mo',
    badge: 'Most Popular',
    features: [
      'Unlimited inventory',
      'Advanced analytics & reports',
      'Crosslisting tools & templates',
      'AI Identify & Price Research',
      'Sourcing, Shipping & Buyer CRM',
    ],
  },
  unlimited: {
    name: 'Unlimited',
    price: '$25/mo',
    features: [
      'Everything in Pro',
      'eBay & Etsy API integrations',
      'Whatnot show planning',
      'Batch Scan & Batch List',
      'Tax Center & repricing rules',
      'Photo tools & PDF reports',
    ],
  },
};

// ── FRIENDLY FEATURE NAMES (for upgrade prompt messages) ─────────────────────
export const VIEW_LABELS = {
  insights:  'Insights',
  profit:    'Profit Dashboard',
  breakdown: 'Value Breakdown',
  reports:   'Reports',
  crosslist: 'Crosslisting',
  shipping:  'Shipping',
  buyers:    'Buyers & CRM',
  sourcing:  'Sourcing & Hauls',
  tax:       'Tax Center',
};
