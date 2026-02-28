/**
 * ebay-auth.js — eBay OAuth Authorization & Connection Management
 * Handles: Connect/disconnect eBay account, token status, session caching.
 * All sensitive operations (token exchange, refresh, API calls) are proxied
 * through the Supabase Edge Function `ebay-auth`.
 */

import { SB_URL, SB_KEY } from '../config/constants.js';
import { getMeta, setMeta } from '../data/idb.js';
import { toast } from '../utils/dom.js';

// ── CONFIG ─────────────────────────────────────────────────────────────────
const EDGE_FN = `${SB_URL}/functions/v1/ebay-auth`;

// ── STATE ──────────────────────────────────────────────────────────────────
let _connected = false;
let _isSandbox = false;
let _ebayUsername = null;
let _connectedAt = null;
let _authPopup = null;
let _csrfState = null;
let _statusVerified = false; // true once server status check completes

// Reference to Supabase client — set by init
let _sb = null;

// ── INITIALIZATION ─────────────────────────────────────────────────────────

/**
 * Initialize eBay auth on app startup.
 * Checks connection status via Edge Function.
 * @param {Object} supabaseClient - The Supabase client instance
 */
export async function initEBayAuth(supabaseClient) {
  _sb = supabaseClient;
  try {
    // Load cached status from IDB for instant UI
    const cached = await getMeta('ebay_auth');
    if (cached) {
      _connected = cached.connected || false;
      _isSandbox = cached.isSandbox || false;
      _ebayUsername = cached.ebayUsername || null;
      _connectedAt = cached.connectedAt || null;
    }

    // Always verify with server — await it so state is accurate before UI renders.
    // On a new device with no cache, this is the only way to know the real status.
    await checkEBayStatus();
  } catch (e) {
    console.warn('FlipTrack: eBay auth init error:', e.message);
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
  headers['x-ebay-action'] = action;
  const resp = await fetch(EDGE_FN, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...body, isSandbox: _isSandbox }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || `Edge function error: ${resp.status}`);
  return data;
}

// ── CHECK STATUS ───────────────────────────────────────────────────────────

/**
 * Check eBay connection status from server.
 * Updates local state + IDB cache.
 */
export async function checkEBayStatus() {
  try {
    const prevConnected = _connected;
    const data = await callEdgeFn('status');
    _connected = data.connected;
    _ebayUsername = data.ebay_username || null;
    _connectedAt = data.connected_at || null;

    await setMeta('ebay_auth', {
      connected: _connected,
      isSandbox: _isSandbox,
      ebayUsername: _ebayUsername,
      connectedAt: _connectedAt,
    });

    _statusVerified = true;

    // If connection state changed, refresh UI
    if (prevConnected !== _connected && typeof window.renderCrosslistDashboard === 'function') {
      window.renderCrosslistDashboard();
    }

    return data;
  } catch (e) {
    console.warn('eBay status check failed:', e.message);
    _statusVerified = true; // mark verified even on error so UI doesn't loop
    // Re-render UI to clear "Checking…" state
    if (typeof window.renderCrosslistDashboard === 'function') {
      window.renderCrosslistDashboard();
    }
    return { connected: _connected, error: e.message };
  }
}

// ── CONNECT (OAuth Flow) ───────────────────────────────────────────────────

/**
 * Start eBay OAuth authorization flow.
 * Opens eBay consent page in a popup window.
 */
export async function connectEBay(sandbox = false) {
  _isSandbox = sandbox;

  try {
    const data = await callEdgeFn('authorize');
    _csrfState = data.state;

    // Store state for callback verification
    await setMeta('ebay_csrf_state', _csrfState);

    // Open popup (centered on screen)
    const w = 700, h = 650;
    const left = Math.round((screen.width - w) / 2);
    const top = Math.round((screen.height - h) / 2);
    _authPopup = window.open(
      data.authUrl,
      'ebay-auth',
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!_authPopup) {
      toast('Popup blocked — please allow popups for this site', true);
      return false;
    }

    toast('Opening eBay authorization…');

    // Start polling for popup close (in case user closes without completing)
    _pollPopupClosed();
    return true;
  } catch (e) {
    toast(`eBay connect error: ${e.message}`, true);
    return false;
  }
}

function _pollPopupClosed() {
  const timer = setInterval(() => {
    if (_authPopup && _authPopup.closed) {
      clearInterval(timer);
      _authPopup = null;
      // If we haven't connected by now, user cancelled
      if (!_connected) {
        // Don't toast — might just be a slow redirect
      }
    }
  }, 500);
  // Stop after 5 minutes
  setTimeout(() => clearInterval(timer), 300000);
}

/**
 * Handle OAuth callback from popup window.
 * Called by the callback page (ebay-callback.html) via window.opener.
 * @param {string} code - Authorization code from eBay
 * @param {string} state - CSRF state token to verify
 */
export async function handleEBayCallback(code, state) {
  try {
    // Verify CSRF
    const storedState = await getMeta('ebay_csrf_state');
    if (state && storedState && state !== storedState) {
      throw new Error('State mismatch — possible CSRF attack. Please try again.');
    }

    // Exchange code for tokens via Edge Function
    const data = await callEdgeFn('callback', { code });

    if (data.success) {
      _connected = true;
      _ebayUsername = data.ebay_username || null;

      await setMeta('ebay_auth', {
        connected: true,
        isSandbox: _isSandbox,
        ebayUsername: _ebayUsername,
        connectedAt: new Date().toISOString(),
      });
      await setMeta('ebay_csrf_state', null);

      toast('eBay account connected!');

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
    toast(`eBay auth error: ${e.message}`, true);
  }
}

// ── DISCONNECT ─────────────────────────────────────────────────────────────

/**
 * Disconnect eBay account.
 */
export async function disconnectEBay() {
  try {
    await callEdgeFn('disconnect');
    _connected = false;
    _ebayUsername = null;
    _connectedAt = null;

    await setMeta('ebay_auth', {
      connected: false,
      isSandbox: _isSandbox,
      ebayUsername: null,
      connectedAt: null,
    });

    toast('eBay account disconnected');

    if (typeof window.renderCrosslistDashboard === 'function') {
      window.renderCrosslistDashboard();
    }
  } catch (e) {
    toast(`Disconnect error: ${e.message}`, true);
  }
}

// ── GETTERS ────────────────────────────────────────────────────────────────

export function isEBayConnected() { return _connected; }
export function isEBayStatusVerified() { return _statusVerified; }
export function getEBayUsername() { return _ebayUsername; }
export function getEBayIsSandbox() { return _isSandbox; }
export function getEBayConnectedAt() { return _connectedAt; }

// ── EDGE FUNCTION PROXY (for other modules to use) ─────────────────────────

/**
 * Make an authenticated eBay API call through the Edge Function proxy.
 * Auto-handles token refresh.
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} path - eBay API path (e.g., '/sell/inventory/v1/inventory_item')
 * @param {Object} [body] - Request body for POST/PUT
 * @returns {Promise<Object>} eBay API response data
 */
export async function ebayAPI(method, path, body = null) {
  if (!_connected) throw new Error('eBay not connected');
  return callEdgeFn('api', { method, path, body });
}
