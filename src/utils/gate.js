/**
 * gate.js — Subscription gating utility
 * Centralized feature access control with hybrid gating:
 * locked features appear in nav with lock icon, show upgrade prompt on click.
 */

import { getSupabaseClient, getCurrentUser } from '../data/auth.js';
import { SB_URL, SB_KEY } from '../config/constants.js';
import {
  canAccess, VIEW_TIER_MAP, TOOL_TIER_MAP,
  TIER_DISPLAY, VIEW_LABELS
} from '../config/tiers.js';
import { escAttr } from '../utils/format.js';

// ── Cached tier (module-scoped, not exposed on window) ──────────────────────
let _userTier = 'free';
// Freeze to prevent console override via window._userTier
Object.defineProperty(window, '_userTier', { get: () => _userTier, set: () => {}, configurable: false });

/** Load user's tier from Supabase `profiles` table */
export async function loadUserTier() {
  const user = getCurrentUser();
  if (!user) { _userTier = 'free'; return; }

  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    if (!error && data?.subscription_tier) {
      _userTier = data.subscription_tier;
    } else {
      _userTier = 'free';
    }
  } catch (e) {
    console.warn('FlipTrack: tier load error:', e.message);
    _userTier = 'free';
  }
}

/** Get current user's cached tier */
export function getUserTier() { return _userTier; }

/** Check if a view is gated for the current user */
export function isViewGated(viewName) {
  const required = VIEW_TIER_MAP[viewName] || 'free';
  return !canAccess(_userTier, required);
}

/** Get the minimum tier required for a view */
export function getViewTier(viewName) {
  return VIEW_TIER_MAP[viewName] || 'free';
}

// ── Upgrade Prompt ───────────────────────────────────────────────────────────

/** Show the upgrade prompt for a specific feature */
export function showUpgradePrompt(viewName) {
  const ov = document.getElementById('upgradeOv');
  if (!ov) return;

  const required = VIEW_TIER_MAP[viewName] || 'pro';
  const label = VIEW_LABELS[viewName] || viewName;
  const tierInfo = TIER_DISPLAY[required];

  // Update dynamic text
  const msgEl = document.getElementById('upgradeFeatName');
  if (msgEl) msgEl.textContent = label + ' requires ' + (tierInfo?.name || 'Pro');

  const noteEl = document.getElementById('upgradeTierNote');
  if (noteEl) noteEl.textContent = 'Your plan: ' + (TIER_DISPLAY[_userTier]?.name || 'Free') + '  →  ' + (tierInfo?.name || 'Pro');

  // Highlight the required tier card
  ov.querySelectorAll('.tier-card').forEach(c => c.classList.remove('highlighted'));
  const card = ov.querySelector(`.tier-card[data-tier="${required}"]`);
  if (card) card.classList.add('highlighted');

  // Update tier card buttons based on current plan
  const tierOrder = { free: 0, pro: 1, unlimited: 2 };
  const userLevel = tierOrder[_userTier] || 0;
  ov.querySelectorAll('.tier-card').forEach(c => {
    const t = c.getAttribute('data-tier');
    const level = tierOrder[t] || 0;
    const actionDiv = c.querySelector('.tier-card-action');
    if (!actionDiv) return;
    if (t === _userTier) {
      actionDiv.innerHTML = '<button class="btn-ghost" disabled>Current Plan</button>';
    } else if (level > userLevel) {
      const label = t === 'pro' ? 'Upgrade to Pro' : 'Upgrade to Unlimited';
      actionDiv.innerHTML = `<button class="btn-primary" onclick="startCheckout('${escAttr(t)}')">${label}</button>`;
    } else {
      actionDiv.innerHTML = '<button class="btn-ghost" disabled>Included</button>';
    }
  });

  // Show "Manage Plan" if user has a paid subscription
  const manageBtn = document.getElementById('managePlanBtn');
  if (manageBtn) manageBtn.style.display = userLevel > 0 ? '' : 'none';

  ov.classList.add('on');
}

/** Close upgrade prompt */
export function closeUpgradePrompt() {
  const ov = document.getElementById('upgradeOv');
  if (ov) ov.classList.remove('on');
}

// ── Stripe Checkout Integration ─────────────────────────────────────────────

/** Redirect user to Stripe Checkout for a given tier */
export async function startCheckout(tier) {
  const user = getCurrentUser();
  if (!user) { alert('Please sign in first.'); return; }

  const btn = document.querySelector('#upgradeOv .btn-primary');
  const origText = btn?.textContent;
  if (btn) { btn.textContent = 'Redirecting…'; btn.disabled = true; }

  try {
    const sb = getSupabaseClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.access_token) throw new Error('No active session');

    const res = await fetch(
      `${SB_URL}/functions/v1/create-checkout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SB_KEY,
        },
        body: JSON.stringify({ tier }),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.msg || `Server error ${res.status}`);
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (e) {
    console.error('Checkout error:', e);
    alert('Could not start checkout: ' + e.message);
    if (btn) { btn.textContent = origText; btn.disabled = false; }
  }
}

/** Open Stripe Billing Portal for managing subscription */
export async function openBillingPortal() {
  const user = getCurrentUser();
  if (!user) return;

  try {
    const sb = getSupabaseClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.access_token) throw new Error('No active session');

    const res = await fetch(
      `${SB_URL}/functions/v1/billing-portal`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SB_KEY,
        },
        body: JSON.stringify({}),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.msg || `Server error ${res.status}`);
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No portal URL returned');
    }
  } catch (e) {
    console.error('Billing portal error:', e);
    alert('Could not open billing portal: ' + e.message);
  }
}

// ── Nav Lock Icons ───────────────────────────────────────────────────────────

/** Apply lock icons to nav items and tool buttons based on user tier */
export function applyNavLocks() {
  // Lock nav menu items
  document.querySelectorAll('.nav-menu-item[data-view]').forEach(item => {
    const view = item.getAttribute('data-view');
    const required = VIEW_TIER_MAP[view];
    if (required && !canAccess(_userTier, required)) {
      item.classList.add('locked');
    } else {
      item.classList.remove('locked');
    }
  });

  // Update account menu plan label
  const planLabel = document.getElementById('acctPlanLabel');
  const planBtn = document.getElementById('acctPlanBtn');
  if (planLabel && planBtn) {
    const display = TIER_DISPLAY[_userTier];
    if (_userTier === 'free') {
      planLabel.textContent = 'Free Plan — Upgrade';
      planBtn.onclick = () => { window.closeAccountMenu?.(); showUpgradePrompt('dashboard'); };
    } else {
      planLabel.textContent = (display?.name || 'Pro') + ' Plan — Manage';
      planBtn.onclick = () => { window.closeAccountMenu?.(); openBillingPortal(); };
    }
  }

  // Lock tool buttons
  for (const [btnId, required] of Object.entries(TOOL_TIER_MAP)) {
    const btn = document.getElementById(btnId);
    if (!btn) continue;
    if (!canAccess(_userTier, required)) {
      btn.classList.add('locked');
      btn.style.opacity = '0.5';
    } else {
      btn.classList.remove('locked');
      btn.style.opacity = '';
    }
  }
}

// ── Expose to window for inline handlers & sync access from switchView ───────
Object.assign(window, { closeUpgradePrompt, applyNavLocks, startCheckout, openBillingPortal, showUpgradePrompt });
window.__gateUtils = { isViewGated, showUpgradePrompt, getUserTier };
