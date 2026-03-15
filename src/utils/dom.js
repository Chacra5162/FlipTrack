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

export function toast(msg, err, dur) {
  const t = document.getElementById('toast');
  if (!t) return;
  // Ensure ARIA attributes for screen readers
  if (!t.getAttribute('role')) {
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
  }
  t.textContent = msg;
  t.className = 'toast' + (err ? ' err' : '');
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), dur || 4000);
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
