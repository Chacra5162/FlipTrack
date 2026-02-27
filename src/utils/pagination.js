/**
 * pagination.js - Reusable pagination component
 * Renders pagination controls into a container element.
 * Used by inventory, sales, and expenses views.
 *
 * Usage:
 *   renderPagination(containerEl, {
 *     page: 0,           // current page (0-indexed)
 *     totalItems: 120,   // total item count
 *     pageSize: 50,      // items per page
 *     onPage: (p) => {}, // callback when page changes
 *     pageSizes: [50, 100, 250],  // optional size selector options
 *     onPageSize: (s) => {},      // optional callback for page size change
 *   });
 */

/**
 * Render pagination controls into a container element.
 * @param {HTMLElement} container  - DOM element to render into
 * @param {Object}      opts      - Pagination options
 */
export function renderPagination(container, opts) {
  if (!container) return;

  const { page, totalItems, pageSize, onPage, pageSizes, onPageSize } = opts;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // No pagination needed
  if (totalItems <= pageSize) {
    container.innerHTML = '';
    return;
  }

  // Clamp current page
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const start = safePage * pageSize + 1;
  const end = Math.min((safePage + 1) * pageSize, totalItems);

  // Build wrapper
  const wrap = document.createElement('div');
  wrap.className = 'ft-pagination';
  wrap.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 0;font-size:12px;color:var(--muted)';

  // Helper to create a pagination button
  const mkBtn = (label, targetPage, disabled) => {
    const btn = document.createElement('button');
    btn.className = 'btn-secondary pg-btn';
    btn.style.cssText = 'padding:5px 12px;font-size:11px;font-family:"DM Mono",monospace';
    btn.textContent = label;
    btn.disabled = disabled;
    if (disabled) btn.style.opacity = '0.3';
    if (!disabled) btn.addEventListener('click', () => onPage(targetPage));
    return btn;
  };

  // First / Prev
  wrap.appendChild(mkBtn('«', 0, safePage === 0));
  wrap.appendChild(mkBtn('‹ Prev', safePage - 1, safePage === 0));

  // Page info
  const info = document.createElement('span');
  info.style.cssText = "font-family:'Syne',sans-serif;font-weight:600;padding:0 4px";
  info.textContent = `${start}–${end} of ${totalItems}`;
  wrap.appendChild(info);

  // Next / Last
  wrap.appendChild(mkBtn('Next ›', safePage + 1, safePage >= totalPages - 1));
  wrap.appendChild(mkBtn('»', totalPages - 1, safePage >= totalPages - 1));

  // Optional page size selector
  if (pageSizes && pageSizes.length > 1 && onPageSize) {
    const sel = document.createElement('select');
    sel.style.cssText = "background:var(--surface);border:1px solid var(--border);color:var(--muted);padding:4px 8px;font-family:'DM Mono',monospace;font-size:11px;margin-left:8px";
    pageSizes.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = `${s}/page`;
      if (s === pageSize) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => onPageSize(parseInt(sel.value)));
    wrap.appendChild(sel);
  }

  container.innerHTML = '';
  container.appendChild(wrap);
}
