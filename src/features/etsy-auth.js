/**
 * etsy-auth.js — Etsy OAuth Authorization & Connection Management
 * Handles: Connect/disconnect Etsy shop, token status, session caching.
 * All sensitive operations (PKCE token exchange, refresh, API calls) are proxied
 * through the Supabase Edge Function `etsy-auth`.
 */

import { SB_URL, SB_KEY } from '../config/constants.js';
import { getMeta, setMeta } from '../data/idb.js';
import { toast } from '../utils/dom.js';

// ── CONFIG ─────────────────────────────────────────────────────────────────
const EDGE_FN = `${SB_URL}/functions/v1/etsy-auth`;

// ── STATE ──────────────────────────────────────────────────────────────────
let _connected = false;
let _shopName = null;
let _shopId = null;
let _connectedAt = null;
let _authPopup = null;
let _csrfState = null;

// Reference to Supabase client — set by init
let _sb = null;

// ── INITIALIZATION ─────────────────────────────────────────────────────────

/**
 * Initialize Etsy auth on app startup.
 * Checks connection status via Edge Function.
 * @param {Object} supabaseClient - The Supabase client instance
 */
export async function initEtsyAuth(supabaseClient) {
  _sb = supabaseClient;
  try {
    // Load cached status from IDB
    const cached = await getMeta('etsy_auth');
    if (cached) {
      _connected = cached.connected || false;
      _shopName = cached.shopName || null;
      _shopId = cached.shopId || null;
      _connectedAt = cached.connectedAt || null;
    }

    // Verify with server
    await checkEtsyStatus();
  } catch (e) {
    console.warn('FlipTrack: Etsy auth init error:', e.message);
    // Retry after delay in case auth session wasn't ready (common on mobile)
    setTimeout(async () => {
      try { await checkEtsyStatus(); } catch (_) {}
    }, 3000);
  }
}

// ── HELPER: Get auth headers for Edge Function calls ───────────────────────

async function getAuthHeaders() {
  if (!_sb) throw new Error('Not authenticated');
  const { data: { session } } = await _sb.auth.getSession();
  if (!session) throw new Error('Session expired — please log in again');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': SB_KEY,
  };
}

async function callEdgeFn(action, body = {}) {
  const headers = await getAuthHeaders();
  headers['x-etsy-action'] = action;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 15000);
  let resp;
  try {
    resp = await fetch(EDGE_FN, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: ac.signal,
    });
  } catch (networkErr) {
    clearTimeout(timer);
    if (networkErr.name === 'AbortError') throw new Error('Request timed out — try again');
    throw new Error('Network error — check your internet connection');
  }
  clearTimeout(timer);
  // Handle non-JSON responses (e.g., HTML error pages, 502 gateway errors)
  const contentType = resp.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await resp.json();
  } else {
    const text = await resp.text();
    if (!resp.ok) throw new Error(`Server error (${resp.status}): ${text.slice(0, 100)}`);
    try { data = JSON.parse(text); } catch { throw new Error(`Unexpected response (${resp.status})`); }
  }
  if (!resp.ok) throw new Error(data.error || `Edge function error: ${resp.status}`);
  return data;
}

// ── CHECK STATUS ───────────────────────────────────────────────────────────

/**
 * Check Etsy connection status from server.
 * Updates local state + IDB cache.
 */
export async function checkEtsyStatus() {
  // Wait for auth session to be available (mobile may restore async)
  if (_sb) {
    let session = null;
    for (let i = 0; i < 30; i++) {
      try {
        const resp = await _sb.auth.getSession();
        session = resp?.data?.session;
      } catch (_) {}
      if (session) break;
      await new Promise(r => setTimeout(r, 200));
    }
    if (!session) {
      console.warn('Etsy status check: no auth session after waiting');
      return { connected: _connected, error: 'No session' };
    }
  }

  try {
    const data = await callEdgeFn('status');
    _connected = data.connected;
    _shopName = data.shop_name || null;
    _shopId = data.shop_id || null;
    _connectedAt = data.connected_at || null;

    await setMeta('etsy_auth', {
      connected: _connected,
      shopName: _shopName,
      shopId: _shopId,
      connectedAt: _connectedAt,
    });

    // Always re-render to reflect server state
    if (typeof window.renderCrosslistDashboard === 'function') {
      window.renderCrosslistDashboard();
    }

    return data;
  } catch (e) {
    console.warn('Etsy status check failed:', e.message);
    return { connected: _connected };
  }
}

// ── CONNECT (OAuth Flow with PKCE) ─────────────────────────────────────────

/**
 * Start Etsy OAuth authorization flow.
 * Opens Etsy consent page in a popup window.
 */
function _isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 820;
}

export async function connectEtsy() {
  try {
    const data = await callEdgeFn('authorize');
    _csrfState = data.state;

    // Store state for callback verification
    await setMeta('etsy_csrf_state', _csrfState);

    // On mobile, use full-page redirect instead of popup (popups are blocked)
    if (_isMobile()) {
      toast('Redirecting to Etsy…');
      window.location.href = data.authUrl;
      return true;
    }

    // Desktop: open popup (centered on screen)
    const w = 700, h = 700;
    const left = Math.round((screen.width - w) / 2);
    const top = Math.round((screen.height - h) / 2);
    _authPopup = window.open(
      data.authUrl,
      'etsy-auth',
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!_authPopup) {
      // Popup blocked even on desktop — fall back to redirect
      toast('Redirecting to Etsy…');
      window.location.href = data.authUrl;
      return true;
    }

    toast('Opening Etsy authorization…');

    // Start polling for popup close
    _pollPopupClosed();
    return true;
  } catch (e) {
    toast(`Etsy connect error: ${e.message}`, true);
    return false;
  }
}

function _pollPopupClosed() {
  const timer = setInterval(() => {
    if (_authPopup && _authPopup.closed) {
      clearInterval(timer);
      _authPopup = null;
    }
  }, 500);
  setTimeout(() => clearInterval(timer), 300000);
}

/**
 * Handle OAuth callback from popup window.
 * Called by the callback page (etsy-callback.html) via window.opener.
 * @param {string} code - Authorization code from Etsy
 * @param {string} state - CSRF state token to verify
 */
export async function handleEtsyCallback(code, state) {
  try {
    // Verify CSRF
    const storedState = await getMeta('etsy_csrf_state');
    if (!state || !storedState || state !== storedState) {
      throw new Error('State mismatch — possible CSRF attack. Please try again.');
    }

    // Exchange code for tokens via Edge Function
    const data = await callEdgeFn('callback', { code });

    if (data.success) {
      _connected = true;
      _shopName = data.shop_name || null;
      _shopId = data.shop_id || null;

      await setMeta('etsy_auth', {
        connected: true,
        shopName: _shopName,
        shopId: _shopId,
        connectedAt: new Date().toISOString(),
      });
      await setMeta('etsy_csrf_state', null);

      toast(`Etsy shop "${_shopName || 'connected'}" linked!`);

      // Close popup if still open
      if (_authPopup && !_authPopup.closed) {
        _authPopup.close();
      }
      _authPopup = null;

      // Trigger UI update
      if (typeof window.renderCrosslistDashboard === 'function') {
        window.renderCrosslistDashboard();
      }
    }
  } catch (e) {
    toast(`Etsy auth error: ${e.message}`, true);
  }
}

// ── DISCONNECT ─────────────────────────────────────────────────────────────

/**
 * Disconnect Etsy shop.
 */
export async function disconnectEtsy() {
  try {
    await callEdgeFn('disconnect');
    _connected = false;
    _shopName = null;
    _shopId = null;
    _connectedAt = null;

    await setMeta('etsy_auth', {
      connected: false,
      shopName: null,
      shopId: null,
      connectedAt: null,
    });

    toast('Etsy shop disconnected');

    if (typeof window.renderCrosslistDashboard === 'function') {
      window.renderCrosslistDashboard();
    }
  } catch (e) {
    toast(`Disconnect error: ${e.message}`, true);
  }
}

// ── GETTERS ────────────────────────────────────────────────────────────────

export function isEtsyConnected() { return _connected; }
export function getEtsyShopName() { return _shopName; }
export function getEtsyShopId() { return _shopId; }
export function getEtsyConnectedAt() { return _connectedAt; }

// ── EDGE FUNCTION PROXY (for other modules to use) ─────────────────────────

/**
 * Make an authenticated Etsy API call through the Edge Function proxy.
 * Auto-handles token refresh.
 * @param {string} method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param {string} path - Etsy API path (e.g., '/application/shops/{shop_id}/listings')
 * @param {Object} [body] - Request body for POST/PUT/PATCH
 * @returns {Promise<Object>} Etsy API response data
 */
export async function etsyAPI(method, path, body = null) {
  if (!_connected) throw new Error('Etsy not connected');
  return callEdgeFn('api', { method, path, body });
}
