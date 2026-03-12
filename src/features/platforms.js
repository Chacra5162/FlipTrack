// ── PLATFORMS ───────────────────────────────────────────────────────────────
import { PLATFORM_GROUPS, platCls } from '../config/platforms.js';
import { escHtml, escAttr } from '../utils/format.js';

export function getPlatforms(item) {
  if (Array.isArray(item.platforms) && item.platforms.length) return item.platforms;
  if (item.platform) return [item.platform];
  return [];
}

/**
 * Enforce mutual exclusivity: "Unlisted" cannot coexist with real platforms.
 * If "Unlisted" is present alongside others, the most-recently-added side wins.
 * Call this on any platforms array before saving.
 * @param {string[]} plats - mutable platforms array
 * @param {string} [justAdded] - the platform tag that was just toggled on (if any)
 * @returns {string[]} cleaned array (same ref)
 */
export function sanitizePlatforms(plats, justAdded) {
  if (!Array.isArray(plats)) return plats;
  const hasUnlisted = plats.includes('Unlisted');
  const hasReal = plats.some(p => p !== 'Unlisted' && p !== 'Other');
  if (!hasUnlisted || !hasReal) return plats;

  if (justAdded === 'Unlisted') {
    // User just picked Unlisted → remove all real platforms
    plats.length = 0;
    plats.push('Unlisted');
  } else {
    // User added a real platform → remove Unlisted
    const idx = plats.indexOf('Unlisted');
    if (idx !== -1) plats.splice(idx, 1);
  }
  return plats;
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
      html += `<span class="plat-pick-chip ${active}" data-plat="${escAttr(p)}" onclick="togglePlatChip(this,'${escAttr(pickerId)}')">${escHtml(p)}</span>`;
    });
    html += `</div>`;
  });
  el.innerHTML = html;
}

export function togglePlatChip(el, pickerId) {
  const wasActive = el.classList.contains('active');
  el.classList.toggle('active');

  // Enforce Unlisted / real-platform mutual exclusivity in the picker UI
  if (!wasActive) {
    // Chip was just activated
    const picker = document.getElementById(pickerId);
    if (!picker) return;
    const plat = el.dataset.plat;
    if (plat === 'Unlisted') {
      // Deselect all other chips
      picker.querySelectorAll('.plat-pick-chip.active').forEach(c => {
        if (c.dataset.plat !== 'Unlisted') c.classList.remove('active');
      });
    } else {
      // Deselect Unlisted chip
      const unChip = picker.querySelector('.plat-pick-chip[data-plat="Unlisted"]');
      if (unChip) unChip.classList.remove('active');
    }
  }
}

export function getSelectedPlats(pickerId) {
  const el = document.getElementById(pickerId);
  if (!el) return [];
  const plats = [...el.querySelectorAll('.plat-pick-chip.active')].map(c => c.dataset.plat);
  return sanitizePlatforms(plats);
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
