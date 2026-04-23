// ── FOCUS TRAP ──
let _focusTrapEl = null, _focusTrigger = null;

export function trapFocus(containerSel) {
  // Remove any existing trap listener to prevent accumulation
  document.removeEventListener('keydown', _handleTrapKey);
  _focusTrigger = document.activeElement;
  _focusTrapEl = document.querySelector(containerSel);
  if (!_focusTrapEl) return;
  const focusables = _focusTrapEl.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');
  if (focusables.length) focusables[0].focus();
  document.addEventListener('keydown', _handleTrapKey);
}

export function releaseFocus() {
  document.removeEventListener('keydown', _handleTrapKey);
  if (_focusTrigger && _focusTrigger.focus) _focusTrigger.focus();
  _focusTrapEl = null; _focusTrigger = null;
}

function _handleTrapKey(e) {
  if (!_focusTrapEl) return;
  if (e.key === 'Escape') {
    releaseFocus();
    // Use window-exposed functions to avoid circular imports
    if (typeof window.closeDrawer === 'function') window.closeDrawer();
    if (typeof window.closeAdd === 'function') window.closeAdd();
    return;
  }
  if (e.key !== 'Tab') return;
  const focusables = _focusTrapEl.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;
  const first = focusables[0], last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

// Toast queue. Without it, rapid toasts (e.g. save → autoSync → eBay update)
// overwrite each other and the user only sees the last one — earlier errors
// or status updates vanish silently. Behavior:
//   • Errors interrupt and replace the current toast immediately
//   • Same-text toasts within 1s collapse (no point showing "Synced ✓" 3 times)
//   • Info toasts queue and play sequentially
const _toastQueue = [];
let _toastShowing = false;
let _toastHideTimer = null;
let _lastToastText = '';
let _lastToastTs = 0;

function _renderToast(msg, err, dur) {
  const t = document.getElementById('toast');
  if (!t) return;
  if (!t.getAttribute('role')) {
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
  }
  t.textContent = msg;
  t.className = 'toast' + (err ? ' err' : '');
  t.classList.add('on');
  _toastShowing = true;
  _lastToastText = msg;
  _lastToastTs = Date.now();
  clearTimeout(_toastHideTimer);
  _toastHideTimer = setTimeout(() => {
    t.classList.remove('on');
    _toastShowing = false;
    // Drain queue
    if (_toastQueue.length) {
      const next = _toastQueue.shift();
      _renderToast(next.msg, next.err, next.dur);
    }
  }, dur || 4000);
}

export function toast(msg, err, dur) {
  if (!msg) return;
  // Dedupe identical text within 1s — common when multiple sync paths each
  // toast the same status.
  if (msg === _lastToastText && Date.now() - _lastToastTs < 1000) return;
  if (err) {
    // Errors jump the line so the user always sees them.
    _toastQueue.length = 0;
    _renderToast(msg, true, dur);
    return;
  }
  if (_toastShowing) {
    _toastQueue.push({ msg, err: false, dur });
    return;
  }
  _renderToast(msg, false, dur);
}

/**
 * Translate raw API/network/runtime error messages into user-actionable text.
 * Use at the catch-site before toasting: toast(humanizeError(e), true).
 * Returns the original message verbatim if no rule matches.
 */
export function humanizeError(err) {
  const raw = (err?.message || err || '').toString();
  const m = raw.toLowerCase();
  // Auth / session
  if (m.includes('session expired') || m.includes('please log in')) return 'Your session expired — sign in again to continue.';
  if (m.includes('not connected')) return raw; // already user-friendly
  // Network
  if (m.includes('failed to fetch') || m.includes('network error') || m.includes('check your internet')) return 'Network error — check your internet connection and try again.';
  if (m.includes('timed out') || m.includes('timeout')) return 'Request timed out — the server is slow. Try again in a minute.';
  // eBay-specific surface mappings
  if (m.includes('a system error has occurred')) return 'eBay is having trouble right now — try again in a minute.';
  if (m.includes('25713') || m.includes('this offer is not available')) return "eBay can't find the listing for this item. Open the item and use Publish to eBay to recreate it.";
  if (m.includes('not allowed') || m.includes('insufficient permissions')) return "Your eBay account doesn't have permission for this action — reconnect your account in Settings.";
  // HTTP status code patterns
  if (/\b401\b/.test(m) || m.includes('unauthorized')) return 'Your session expired — sign in again.';
  if (/\b403\b/.test(m) || m.includes('forbidden')) return 'Permission denied — check your account permissions.';
  if (/\b5\d\d\b/.test(m) || m.includes('internal server error')) return 'Server error — try again in a moment.';
  if (/\b4\d\d\b/.test(m)) return 'The request was rejected — check the item details (price, qty, category, etc.).';
  // Default: return raw for now (still surfaced)
  return raw;
}

// ── IN-APP CONFIRM MODAL (replaces window.confirm for PWA compatibility) ──

/**
 * Show an in-app confirmation dialog. Returns a Promise<boolean>.
 * Works in iOS PWA standalone mode where window.confirm() is broken.
 * @param {Object} opts
 * @param {string} opts.title - Dialog title
 * @param {string} opts.message - Dialog body text
 * @param {boolean} [opts.danger] - Use danger styling for confirm button
 * @param {string} [opts.confirmText] - Confirm button label (default 'Confirm')
 * @param {string} [opts.cancelText] - Cancel button label (default 'Cancel')
 * @returns {Promise<boolean>}
 */
export function appConfirm({ title = 'Confirm', message, danger = false, confirmText = 'Confirm', cancelText = 'Cancel' } = {}) {
  return new Promise(resolve => {
    const ov = document.getElementById('confirmOv');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMsg');
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');
    if (!ov || !okBtn || !cancelBtn) { resolve(true); return; } // fallback if DOM missing

    titleEl.textContent = title;
    msgEl.textContent = message;
    okBtn.textContent = confirmText;
    okBtn.className = danger ? 'btn btn-danger' : 'btn btn-primary';
    cancelBtn.textContent = cancelText;

    const cleanup = (result) => {
      ov.classList.remove('on');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };
    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);
    const onKey = (e) => { if (e.key === 'Escape') cleanup(false); };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    document.addEventListener('keydown', onKey);
    ov.classList.add('on');
    okBtn.focus();
  });
}

/**
 * Show an in-app prompt dialog. Returns a Promise<string|null>.
 * Works in iOS PWA standalone mode where window.prompt() is broken.
 * @param {Object} opts
 * @param {string} opts.title - Dialog title
 * @param {string} [opts.message] - Optional hint text
 * @param {string} [opts.defaultValue] - Pre-filled input value
 * @param {string} [opts.placeholder] - Input placeholder
 * @param {string} [opts.confirmText] - Confirm button label (default 'OK')
 * @returns {Promise<string|null>} User input or null if cancelled
 */
export function appPrompt({ title = 'Input', message = '', defaultValue = '', placeholder = '', confirmText = 'OK' } = {}) {
  return new Promise(resolve => {
    const ov = document.getElementById('promptOv');
    const titleEl = document.getElementById('promptTitle');
    const msgEl = document.getElementById('promptMsg');
    const inp = document.getElementById('promptInput');
    const okBtn = document.getElementById('promptOk');
    const cancelBtn = document.getElementById('promptCancel');
    if (!ov || !inp || !okBtn || !cancelBtn) { resolve(window.prompt(message || title, defaultValue)); return; }

    titleEl.textContent = title;
    msgEl.textContent = message;
    msgEl.style.display = message ? '' : 'none';
    inp.value = defaultValue;
    inp.placeholder = placeholder;
    okBtn.textContent = confirmText;

    const cleanup = (result) => {
      ov.classList.remove('on');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      inp.removeEventListener('keydown', onKey);
      resolve(result);
    };
    const onOk = () => cleanup(inp.value);
    const onCancel = () => cleanup(null);
    const onKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); onOk(); } if (e.key === 'Escape') onCancel(); };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    inp.addEventListener('keydown', onKey);
    ov.classList.add('on');
    setTimeout(() => { inp.focus(); inp.select(); }, 50);
  });
}
