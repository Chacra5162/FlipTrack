// ── FOCUS TRAP ──
let _focusTrapEl = null, _focusTrigger = null;

export function trapFocus(containerSel) {
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
  if (e.key === 'Escape') { releaseFocus(); closeDrawer(); closeAdd(); return; }
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
  setTimeout(() => t.classList.remove('on'), dur || 2300);
}
