// Keyboard shortcuts handler
// Import these functions from your UI/app modules
// openAddModal, switchView, exportAll, openBatchScan, closeBatchScan, closeScanner, closeDrawer, closeAdd, closeSold, closeTrashModal, closeIdentify

const IS_MAC = navigator.platform?.includes('Mac') || navigator.userAgent?.includes('Mac');
const MOD = IS_MAC ? '⌘' : 'Ctrl+';

/** Map of shortcut keys to their display labels */
export const SHORTCUT_MAP = {
  'add-item':    { key: 'N', label: `${MOD}N` },
  'search':      { key: 'F', label: `${MOD}F` },
  'export':      { key: 'E', label: `${MOD}E` },
  'batch-scan':  { key: 'B', label: `${MOD}B` },
  'close':       { key: 'Escape', label: 'Esc' },
};

export function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    // Don't fire in inputs/textareas
    const tag = (e.target.tagName || '').toLowerCase();
    const inInput = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;

    // Esc — close any open overlay/drawer/modal
    if (e.key === 'Escape') {
      if (document.getElementById('batchOv')?.classList.contains('on')) { closeBatchScan(); return; }
      if (document.getElementById('scannerOv')?.classList.contains('on')) { closeScanner(); return; }
      if (document.getElementById('drawer')?.classList.contains('on')) { closeDrawer(); return; }
      // Add modal excluded — only closes via Cancel or item creation
      if (document.getElementById('soldOv')?.classList.contains('on')) { closeSold(); return; }
      if (document.getElementById('trashOv')?.classList.contains('on')) { closeTrashModal(); return; }
      if (document.getElementById('idOv')?.classList.contains('on')) { closeIdentify(); return; }
    }

    // Ctrl/Cmd combos — skip if user is typing in an input (except Ctrl+F search)
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'n' || e.key === 'N') { if (!inInput) { e.preventDefault(); openAddModal(); } return; }
      if (e.key === 'f' || e.key === 'F') {
        if (!inInput) {
          e.preventDefault();
          switchView('inventory', null);
          setTimeout(() => document.getElementById('invSearch')?.focus(), 100);
        }
        return;
      }
      if (e.key === 'e' || e.key === 'E') { if (!inInput) { e.preventDefault(); exportAll(); } return; }
      if (e.key === 'b' || e.key === 'B') { if (!inInput) { e.preventDefault(); openBatchScan(); } return; }
    }
  });

  // Inject keyboard hints into buttons after DOM is ready
  _injectShortcutHints();
}

/**
 * Inject keyboard shortcut hints as badges into relevant buttons.
 * Matches buttons by their onclick handler text or known IDs.
 */
function _injectShortcutHints() {
  const hints = [
    { selector: '[onclick*="openAddModal"]', shortcut: SHORTCUT_MAP['add-item'].label },
    { selector: '#invSearch', shortcut: SHORTCUT_MAP['search'].label, attr: true },
    { selector: '[onclick*="exportAll"]', shortcut: SHORTCUT_MAP['export'].label },
    { selector: '[onclick*="openBatchScan"]', shortcut: SHORTCUT_MAP['batch-scan'].label },
  ];

  for (const { selector, shortcut, attr } of hints) {
    const els = document.querySelectorAll(selector);
    for (const el of els) {
      if (el.querySelector('.kbd-hint')) continue; // already added
      if (attr) {
        // For inputs, add as placeholder suffix
        if (el.placeholder && !el.placeholder.includes(shortcut)) {
          el.placeholder += ` (${shortcut})`;
        }
      } else {
        // For buttons, append a small kbd badge
        const badge = document.createElement('span');
        badge.className = 'kbd-hint';
        badge.textContent = shortcut;
        el.appendChild(badge);
      }
    }
  }
}
