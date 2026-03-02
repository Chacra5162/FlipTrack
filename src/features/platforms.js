// ── PLATFORMS ───────────────────────────────────────────────────────────────
import { PLATFORM_GROUPS, platCls } from '../config/platforms.js';
import { escHtml } from '../utils/format.js';

export function getPlatforms(item) {
  if (Array.isArray(item.platforms) && item.platforms.length) return item.platforms;
  if (item.platform) return [item.platform];
  return [];
}

export function buildPlatPicker(pickerId, selected = []) {
  const el = document.getElementById(pickerId);
  if (!el) return;
  const selectedSet = new Set(Array.isArray(selected) ? selected : [selected].filter(Boolean));

  let html = '';
  PLATFORM_GROUPS.forEach(group => {
    html += `<div class="plat-picker-group-label">${group.label}</div>
    <div class="plat-picker-chips">`;
    group.items.forEach(p => {
      const active = selectedSet.has(p) ? 'active' : '';
      html += `<span class="plat-pick-chip ${active}" data-plat="${p}" onclick="togglePlatChip(this,'${pickerId}')">${p}</span>`;
    });
    html += `</div>`;
  });
  el.innerHTML = html;
}

export function togglePlatChip(el, pickerId) {
  el.classList.toggle('active');
}

export function getSelectedPlats(pickerId) {
  const el = document.getElementById(pickerId);
  if (!el) return [];
  return [...el.querySelectorAll('.plat-pick-chip.active')].map(c => c.dataset.plat);
}

// Populate platform pickers from central PLATFORMS list at startup
export function initPlatPickers() {
  buildPlatPicker('d_plat_picker', []);
  buildPlatPicker('f_plat_picker', []);
}
initPlatPickers();

// Render compact platform tags for a multi-platform item
export function renderPlatTags(item) {
  const plats = getPlatforms(item);
  if (!plats.length) return '<span class="platform-tag plt-other">—</span>';
  const ps = item.platformStatus || {};
  // Show first 2 tags inline, then +N more badge
  const visible = plats.slice(0, 2);
  const overflow = plats.length - visible.length;
  let html = visible.map(p => {
    const st = ps[p] || 'active';
    const dot = st === 'sold' ? '<span style="color:var(--good);font-size:8px;margin-left:2px" title="Sold">●</span>'
              : st === 'delisted' ? '<span style="color:var(--muted);font-size:8px;margin-left:2px;text-decoration:line-through" title="Delisted">●</span>'
              : '';
    return `<span class="platform-tag ${platCls(p)}">${escHtml(p)}${dot}</span>`;
  }).join(' ');
  if (overflow > 0) html += ` <span class="cross-listed-badge" title="${escHtml(plats.slice(2).join(', '))}">+${overflow}</span>`;
  return html;
}
