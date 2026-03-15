/**
 * auth.js - Authentication and account management
 * Handles Supabase authentication, session management, and user account UI.
 */

import { createClient } from '@supabase/supabase-js';
import { SB_URL, SB_KEY } from '../config/constants.js';
import { inv, sales, expenses, supplies, save, refresh, clearStoreTimers, setSyncInProgress } from './store.js';
import { syncNow, autoSync, pullSupplies, startRealtime, stopRealtime, setSyncStatus, stopPoll, clearSyncTimers } from './sync.js';
import { deleteMeta, clearStore } from './idb.js';
import { setOfflineUser } from '../features/offline.js';
import { stopEBaySyncInterval } from '../features/ebay-sync.js';
import { stopEtsySyncInterval } from '../features/etsy-sync.js';
import { initTeam, getTeam, getMyRole } from '../features/teams.js';
import { clearReportTimers } from '../views/reports.js';
import { stopStockAlertChecks } from '../features/push-notifications.js';
import { disableAutoRelist } from '../features/crosslist.js';

// ── SUPABASE CLIENT & AUTH STATE ───────────────────────────────────────────
let _sb = null;
let _currentUser = null;
let _syncDebounce = null;
let _authTab = 'login'; // 'login' | 'signup'
let _sessionStarting = false;
let _authReady = false; // true once initAuth() has created _sb

// Token refresh mutex — prevents concurrent refresh attempts from racing
let _refreshPromise = null;

export async function safeRefreshSession() {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    try {
      const { data, error } = await _sb.auth.refreshSession();
      if (error) {
        // Refresh token revoked/expired — force sign out
        if (error.message?.includes('token') || error.status === 400 || error.status === 401) {
          console.warn('FlipTrack: refresh token revoked, signing out');
          _currentUser = null;
          try { await _sb.auth.signOut(); } catch (_) {}
          setSyncStatus('disconnected');
          // Brief visible feedback before showing auth modal
          const t = document.getElementById('toast');
          if (t) { t.textContent = 'Session expired — please sign in again'; t.classList.add('on', 'err'); setTimeout(() => t.classList.remove('on', 'err'), 4000); }
          showAuthModal();
        }
        throw error;
      }
      if (data.session) _currentUser = data.session.user;
      return data;
    } finally {
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}

export function getAccountId() {
  return _currentUser ? _currentUser.id : null;
}

export function getCurrentUser() {
  return _currentUser;
}

// ── AUTH UI TABS ───────────────────────────────────────────────────────────
export function switchAuthTab(tab) {
  _authTab = tab;
  const isLogin = tab === 'login';
  const tabLoginEl = document.getElementById('authTabLogin');
  const tabSignupEl = document.getElementById('authTabSignup');
  const submitBtnEl = document.getElementById('authSubmitBtn');
  const forgotWrapEl = document.getElementById('authForgotWrap');

  if (tabLoginEl) tabLoginEl.style.borderBottomColor = isLogin ? 'var(--accent)' : 'transparent';
  if (tabSignupEl) tabSignupEl.style.borderBottomColor = isLogin ? 'transparent' : 'var(--accent)';
  if (tabLoginEl) tabLoginEl.style.color = isLogin ? 'var(--text)' : 'var(--muted)';
  if (tabSignupEl) tabSignupEl.style.color = isLogin ? 'var(--muted)' : 'var(--text)';
  if (submitBtnEl) submitBtnEl.textContent = isLogin ? 'Sign In' : 'Create Account';
  if (forgotWrapEl) forgotWrapEl.style.display = isLogin ? '' : 'none';

  setAuthMsg('', '');
}

export function setAuthMsg(msg, type) {
  const err = document.getElementById('authErr');
  const ok = document.getElementById('authOk');
  if (err) err.style.display = 'none';
  if (ok) ok.style.display = 'none';
  if (!msg) return;
  if (type === 'ok') {
    if (ok) { ok.textContent = msg; ok.style.display = ''; }
  } else {
    if (err) { err.textContent = msg; err.style.display = ''; }
  }
}

// ── AUTH ACTIONS ───────────────────────────────────────────────────────────
export async function authSubmit() {
  const emailEl = document.getElementById('authEmail');
  const passEl = document.getElementById('authPass');
  const btnEl = document.getElementById('authSubmitBtn');

  const email = emailEl ? emailEl.value.trim() : '';
  const pass = passEl ? passEl.value : '';

  if (!email || !pass) {
    setAuthMsg('Please enter your email and password.', 'err');
    return;
  }

  // Guard: Supabase client must be initialized
  if (!_sb || !_authReady) {
    setAuthMsg('App is still loading — please wait a moment and try again.', 'err');
    return;
  }

  if (btnEl) {
    btnEl.textContent = '…';
    btnEl.disabled = true;
  }
  setAuthMsg('', '');

  try {
    if (_authTab === 'login') {
      // Only clear session if a DIFFERENT user is currently authenticated
      // (avoids wiping the stored refresh token on every login attempt)
      if (_currentUser && _currentUser.email !== email) {
        try { await _sb.auth.signOut({ scope: 'local' }); } catch (_) { /* ignore */ }
      }
      const { error } = await _sb.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      // Success — onAuthStateChange will fire SIGNED_IN and call _startSession
    } else {
      const { error } = await _sb.auth.signUp({ email, password: pass });
      if (error) throw error;
      setAuthMsg(`Account created! We sent a confirmation to ${email}. Click the link in that email, then come back to sign in.`, 'ok');
      switchAuthTab('login');
      return;
    }
  } catch(e) {
    const msg = e.message || '';
    const friendly = msg.includes('Invalid login credentials') ? 'Incorrect email or password. Try again or reset your password.'
      : msg.includes('Email not confirmed') ? 'Please confirm your email first. Check your inbox for the confirmation link.'
      : msg.includes('already registered') ? 'An account with this email already exists. Try signing in instead.'
      : msg || 'Sign in failed — please try again.';
    setAuthMsg(friendly, 'err');
  } finally {
    // Always re-enable button (hideAuthModal will cover it on success)
    if (btnEl) {
      btnEl.textContent = _authTab === 'login' ? 'Sign In' : 'Create Account';
      btnEl.disabled = false;
    }
  }
}

export async function authForgotPassword() {
  const emailEl = document.getElementById('authEmail');
  const email = emailEl ? emailEl.value.trim() : '';

  if (!email) {
    setAuthMsg('Enter your email address first.', 'err');
    return;
  }

  if (!_sb || !_authReady) {
    setAuthMsg('App is still loading — please wait.', 'err');
    return;
  }

  const { error } = await _sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
  if (error) setAuthMsg(error.message, 'err');
  else setAuthMsg('Password reset email sent — check your inbox.', 'ok');
}

export async function authSignOut() {
  closeAccountMenu();

  // ── STOP ALL SYNC AND POLLING ──────────────────────────────────────────
  stopPoll();                       // Stop realtime subscriptions & fallback polling
  clearSyncTimers();                // Clear sync debounces and timers
  clearStoreTimers();               // Clear save debounces
  clearTimeout(_syncDebounce);      // Extra safeguard for auth's local debounce

  // ── STOP MARKETPLACE SYNC INTERVALS ────────────────────────────────────
  stopEBaySyncInterval();
  stopEtsySyncInterval();

  // ── STOP LEAKED TIMERS/INTERVALS ────────────────────────────────────────
  clearReportTimers();
  stopStockAlertChecks();
  disableAutoRelist();

  _currentUser = null;
  await _sb.auth.signOut();

  // ── CLEAR ALL LOCAL DATA (after signOut resolves) ─────────────────────
  inv.length = 0;
  sales.length = 0;
  expenses.length = 0;
  supplies.length = 0;

  // ── CLEAR ALL CACHE AND SESSION DATA FROM STORAGE ─────────────────────
  localStorage.removeItem('ft3_inv');
  localStorage.removeItem('ft3_sal');
  localStorage.removeItem('ft3_exp');
  localStorage.removeItem('ft_trash');
  localStorage.removeItem('ft_supplies');
  // Also clear eBay/Etsy tokens and sync metadata if present
  localStorage.removeItem('ebay_token');
  localStorage.removeItem('etsy_token');
  localStorage.removeItem('ebay_sync_cache');
  localStorage.removeItem('etsy_sync_cache');

  // ── CLEAR SYNC METADATA FROM INDEXEDDB ────────────────────────────────
  await deleteMeta('lastSyncPush').catch(e => console.warn('FlipTrack: delete lastSyncPush failed:', e.message));
  await deleteMeta('lastSyncPull').catch(e => console.warn('FlipTrack: delete lastSyncPull failed:', e.message));
  await clearStore('supplies').catch(() => {});

  // ── CLEAR MARKETPLACE AUTH STATE FROM INDEXEDDB ────────────────────────
  await deleteMeta('ebay_csrf_state').catch(() => {});
  await deleteMeta('etsy_csrf_state').catch(() => {});
  await deleteMeta('ebay_auth').catch(() => {});
  await deleteMeta('etsy_auth').catch(() => {});

  refresh();
  setSyncStatus('disconnected');
  showAuthModal();
}

// ── MODAL MANAGEMENT ───────────────────────────────────────────────────────
export function showAuthModal() {
  const hash = window.location.hash;
  const ov = document.getElementById('authOv');
  if (ov) {
    ov.style.display = 'flex';
    const emailEl = document.getElementById('authEmail');
    const passEl = document.getElementById('authPass');
    if (emailEl) emailEl.value = '';
    if (passEl) passEl.value = '';
    setAuthMsg('', '');
    // Auto-switch to the correct tab based on hash
    if (hash === '#signup') {
      switchAuthTab('signup');
    } else {
      switchAuthTab('login');
    }
  }
}

export function hideAuthModal() {
  const ov = document.getElementById('authOv');
  if (ov) ov.style.display = 'none';
}

export function openAccountMenu() {
  const el = document.getElementById('accountMenuEmail');
  if (el && _currentUser) el.textContent = _currentUser.email;
  const ov = document.getElementById('accountMenuOv');
  if (ov) ov.style.display = 'flex';
}

export function closeAccountMenu() {
  const ov = document.getElementById('accountMenuOv');
  if (ov) ov.style.display = 'none';
}

// ── SESSION MANAGEMENT ─────────────────────────────────────────────────────
async function _startSession(user) {
  if (_sessionStarting) return; // prevent double-call from race
  _sessionStarting = true;
  _currentUser = user;
  setOfflineUser(user);
  hideAuthModal();

  const lbl = document.getElementById('syncDotLbl');
  if (lbl) lbl.textContent = user.email.split('@')[0];

  setSyncStatus('syncing');
  try {
    // Load team membership before sync so queries use the correct account_id
    await initTeam();

    // Update team label in account menu
    const teamLbl = document.getElementById('acctTeamLabel');
    if (teamLbl) {
      const team = getTeam();
      teamLbl.textContent = team ? `Team: ${team.name}` : 'Team';
    }

    // 10 second timeout on pull to prevent infinite hang
    try {
      await Promise.race([
        syncNow(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timed out')), 10000))
      ]);
    } catch (e) {
      if (e.message === 'Sync timed out') {
        // Reset sync guard so auto-sync isn't permanently blocked
        setSyncInProgress(false);
        setSyncStatus('error', 'Sync timed out — will retry');
        console.warn('FlipTrack: initial sync timed out, will retry via auto-sync');
      } else throw e;
    }

    // Pull supplies from cloud (separate table)
    pullSupplies().catch(e => console.warn('FlipTrack: supplies pull error:', e.message));

    // Load subscription tier & apply nav locks
    try {
      const { loadUserTier, applyNavLocks } = await import('../utils/gate.js');
      await loadUserTier();
      applyNavLocks();
    } catch (tierErr) {
      console.warn('FlipTrack: tier init error:', tierErr.message);
    }

    // Re-render current view after sync pulls fresh data
    if (typeof window.updateDashStats === 'function') window.updateDashStats();
    if (typeof window.renderCurrentView === 'function') window.renderCurrentView();
  } catch(e) {
    setSyncStatus('error', e.message);
  } finally {
    _sessionStarting = false;
  }
}

// ── BOOTSTRAP AUTH ON LOAD ─────────────────────────────────────────────────
export async function initAuth() {
  _sb = createClient(SB_URL, SB_KEY);
  _authReady = true;

  // Enable Sign In button now that Supabase client is ready
  const authBtn = document.getElementById('authSubmitBtn');
  if (authBtn) { authBtn.disabled = false; authBtn.textContent = _authTab === 'login' ? 'Sign In' : 'Create Account'; }

  // Only handle explicit user-triggered events — NOT INITIAL_SESSION (handled via getSession below)
  _sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      _currentUser = null;
      setOfflineUser(null);
      stopPoll();
      clearTimeout(_syncDebounce);
      setSyncStatus('disconnected');
      showAuthModal();
    } else if (event === 'SIGNED_IN' && session?.user) {
      // New login (not page reload) — only start session if not already active
      if (!_currentUser || _currentUser.id !== session.user.id) {
        _startSession(session.user);
      }
    } else if (session?.user) {
      _currentUser = session.user; // TOKEN_REFRESHED etc — silently update ref
    }
  });

  // Page load — check for existing session once, independently of onAuthStateChange
  try {
    const { data: { session }, error } = await _sb.auth.getSession();
    if (error) {
      // Stale/invalid refresh token — clear local auth state and show login
      console.warn('FlipTrack: session restore failed:', error.message);
      try { await _sb.auth.signOut({ scope: 'local' }); } catch (_) { /* ignore */ }
      showAuthModal();
    } else if (session?.user) {
      await _startSession(session.user);
    } else {
      showAuthModal();
    }
  } catch (e) {
    console.warn('FlipTrack: initAuth error:', e.message);
    showAuthModal();
  }
}

// ── ACCOUNT MENU BACKDROP CLICK HANDLER ────────────────────────────────────
let _authEventsInit = false;
export function setupAuthEventListeners() {
  if (_authEventsInit) return;
  _authEventsInit = true;
  const accountMenuOv = document.getElementById('accountMenuOv');
  if (accountMenuOv) {
    accountMenuOv.addEventListener('click', function(e) {
      if (e.target === this) closeAccountMenu();
    });
  }
}

// Export the internal Supabase client for sync.js and storage.js
export function getSupabaseClient() {
  return _sb;
}
