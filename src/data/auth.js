/**
 * auth.js - Authentication and account management
 * Handles Supabase authentication, session management, and user account UI.
 */

import { createClient } from '@supabase/supabase-js';
import { SB_URL, SB_KEY } from '../config/constants.js';
import { inv, sales, expenses, save, refresh } from './store.js';
import { syncNow, autoSync, pullSupplies, startRealtime, stopRealtime, setSyncStatus, stopPoll } from './sync.js';

// ── SUPABASE CLIENT & AUTH STATE ───────────────────────────────────────────
let _sb = null;
let _currentUser = null;
let _syncDebounce = null;
let _authTab = 'login'; // 'login' | 'signup'
let _sessionStarting = false;

// Token refresh mutex — prevents concurrent refresh attempts from racing
let _refreshPromise = null;

export async function safeRefreshSession() {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    try {
      const { data, error } = await _sb.auth.refreshSession();
      if (error) throw error;
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
  if (!_sb) {
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
      // Clear any stale session before fresh login attempt
      try { await _sb.auth.signOut({ scope: 'local' }); } catch (_) { /* ignore */ }
      const { error } = await _sb.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      // Success — onAuthStateChange will fire SIGNED_IN and call _startSession
    } else {
      const { error } = await _sb.auth.signUp({ email, password: pass });
      if (error) throw error;
      setAuthMsg('Account created! Check your email to confirm, then sign in.', 'ok');
      switchAuthTab('login');
      return;
    }
  } catch(e) {
    setAuthMsg(e.message || 'Sign in failed — please try again.', 'err');
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

  const { error } = await _sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
  if (error) setAuthMsg(error.message, 'err');
  else setAuthMsg('Password reset email sent — check your inbox.', 'ok');
}

export async function authSignOut() {
  closeAccountMenu();
  stopPoll();
  clearTimeout(_syncDebounce);
  _currentUser = null;
  await _sb.auth.signOut();

  inv.length = 0;
  sales.length = 0;
  expenses.length = 0;

  localStorage.removeItem('ft3_inv');
  localStorage.removeItem('ft3_sal');
  localStorage.removeItem('ft3_exp');

  refresh();
  setSyncStatus('disconnected');
  showAuthModal();
}

// ── MODAL MANAGEMENT ───────────────────────────────────────────────────────
export function showAuthModal() {
  const ov = document.getElementById('authOv');
  if (ov) {
    ov.style.display = 'flex';
    const emailEl = document.getElementById('authEmail');
    const passEl = document.getElementById('authPass');
    if (emailEl) emailEl.value = '';
    if (passEl) passEl.value = '';
    setAuthMsg('', '');
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
  hideAuthModal();

  const lbl = document.getElementById('syncDotLbl');
  if (lbl) lbl.textContent = user.email.split('@')[0];

  setSyncStatus('syncing');
  try {
    // 10 second timeout on pull to prevent infinite hang
    await Promise.race([
      syncNow(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timed out')), 10000))
    ]);

    // Pull supplies from cloud (separate table)
    pullSupplies().catch(e => console.warn('FlipTrack: supplies pull error:', e.message));

    // Silently migrate any existing base64 images to Supabase Storage
    // This would be handled by a separate migration module
  } catch(e) {
    setSyncStatus('error', e.message);
    // Would call toast('Sync error: ' + e.message.slice(0, 60), true);
  } finally {
    _sessionStarting = false;
  }
}

// ── BOOTSTRAP AUTH ON LOAD ─────────────────────────────────────────────────
export async function initAuth() {
  _sb = createClient(SB_URL, SB_KEY);

  // Only handle explicit user-triggered events — NOT INITIAL_SESSION (handled via getSession below)
  _sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      _currentUser = null;
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
export function setupAuthEventListeners() {
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
