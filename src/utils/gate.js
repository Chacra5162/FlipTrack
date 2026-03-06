/**
 * gate.js — Subscription gating utility
 * Centralized feature access control with hybrid gating:
 * locked features appear in nav with lock icon, show upgrade prompt on click.
 */

import { getSupabaseClient, getCurrentUser } from '../data/auth.js';
import {
  canAccess, VIEW_TIER_MAP, TOOL_TIER_MAP,
  TIER_DISPLAY, VIEW_LABELS
} from '../config/tiers.js';

// ── Cached tier ──────────────────────────────────────────────────────────────
let _userTier = 'free';

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

  ov.classList.add('on');
}

/** Close upgrade prompt */
export function closeUpgradePrompt() {
  const ov = document.getElementById('upgradeOv');
  if (ov) ov.classList.remove('on');
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
Object.assign(window, { closeUpgradePrompt, applyNavLocks });
window.__gateUtils = { isViewGated, showUpgradePrompt, getUserTier };
