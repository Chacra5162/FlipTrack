// Keyboard shortcuts handler
// Import these functions from your UI/app modules
// openAddModal, switchView, exportAll, openBatchScan, closeBatchScan, closeScanner, closeDrawer, closeAdd, closeSold, closeTrashModal, closeIdentify

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
}
