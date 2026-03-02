/**
 * sourcing.js - Haul Logger & Sourcing Analytics View
 * Log hauls, track inventory sourcing, link items to hauls, and analyze sourcing performance.
 */

import { inv, sales, save, refresh, markDirty } from '../data/store.js';
import { getMeta, setMeta } from '../data/idb.js';
import { fmt, ds, uid, escHtml, pct } from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { renderPagination } from '../utils/pagination.js';
import { getHaulROI, getHaulItems, splitCost, getSourceStats, getBestSources, getHaulSummary } from '../features/haul.js';

// ── STATE ──────────────────────────────────────────────────────────────────────
let _hauls = [];
let _srcSearch = '';
let _srcSort = 'date-desc';
let _expandedHaulId = null;
let _srcPage = 0;
let _srcPageSize = 25;

// ── INITIALIZATION ─────────────────────────────────────────────────────────────

/**
 * Initialize hauls from IDB meta store, or load from localStorage as fallback
 */
export async function initHauls() {
  try {
    _hauls = await getMeta('hauls');
    if (!_hauls) _hauls = [];
  } catch (e) {
    console.warn('FlipTrack: Hauls IDB load failed, using localStorage:', e.message);
    _hauls = JSON.parse(localStorage.getItem('ft_hauls') || '[]');
  }
}

/**
 * Persist hauls to IDB and localStorage
 */
async function saveHauls() {
  await setMeta('hauls', _hauls);
  localStorage.setItem('ft_hauls', JSON.stringify(_hauls));
}

// ── MAIN RENDER ────────────────────────────────────────────────────────────────

/**
 * Render the sourcing view: form, haul list, and stats
 */
export function renderSourcingView() {
  const container = document.getElementById('sourcingContent');
  if (!container) return;

  // Filter and sort hauls
  const filtered = _hauls
    .filter(h => !_srcSearch ||
      (h.location || '').toLowerCase().includes(_srcSearch) ||
      (h.notes || '').toLowerCase().includes(_srcSearch)
    )
    .sort((a, b) => {
      if (_srcSort === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (_srcSort === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (_srcSort === 'spent-high') return (b.totalSpent || 0) - (a.totalSpent || 0);
      if (_srcSort === 'spent-low') return (a.totalSpent || 0) - (b.totalSpent || 0);
      if (_srcSort === 'roi-high') {
        const roiA = getHaulROI(a, inv, sales).roi;
        const roiB = getHaulROI(b, inv, sales).roi;
        return roiB - roiA;
      }
      if (_srcSort === 'location') return (a.location || '').localeCompare(b.location || '');
      return new Date(b.date) - new Date(a.date);
    });

  const summary = getHaulSummary(_hauls);
  const bestSources = getBestSources(_hauls, inv, sales, 3);

  // Build HTML
  container.innerHTML = `
    <div class="sourcing-container" style="display:flex;flex-direction:column;gap:16px;padding:12px">

      <!-- STATS STRIP -->
      <div class="stats-strip" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px">
        <div class="stat-card">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;font-family:'Syne',sans-serif;font-weight:700">Total Hauls</div>
          <div style="font-size:20px;font-weight:700;font-family:'Syne',sans-serif;color:var(--accent)">${summary.totalHauls}</div>
        </div>
        <div class="stat-card">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;font-family:'Syne',sans-serif;font-weight:700">Total Invested</div>
          <div style="font-size:18px;font-weight:700;font-family:'Syne',sans-serif;color:var(--accent2)">${fmt(summary.totalInvested)}</div>
        </div>
        <div class="stat-card">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;font-family:'Syne',sans-serif;font-weight:700">Avg Per Haul</div>
          <div style="font-size:18px;font-weight:700;font-family:'Syne',sans-serif;color:var(--accent3)">${fmt(summary.avgPerHaul)}</div>
        </div>
        <div class="stat-card">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;font-family:'Syne',sans-serif;font-weight:700">Avg Items/Haul</div>
          <div style="font-size:20px;font-weight:700;font-family:'Syne',sans-serif;color:var(--good)">${summary.avgItemsPerHaul.toFixed(1)}</div>
        </div>
      </div>

      <!-- TOP SOURCES LEADERBOARD -->
      ${bestSources.length ? `
        <div class="panel">
          <div class="panel-header">
            <h3 class="panel-title">Top Sourcing Locations</h3>
          </div>
          <div style="padding:12px">
            ${bestSources.map((src, idx) => {
              const medal = ['🥇', '🥈', '🥉'][idx] || '•';
              const roiColor = src.roi >= 0.3 ? 'var(--good)' : src.roi >= 0.1 ? 'var(--accent)' : 'var(--warn)';
              return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;font-family:'DM Mono',monospace">
                <div>
                  <span style="margin-right:8px">${medal}</span>
                  <strong>${escHtml(src.location)}</strong>
                  <span style="color:var(--muted);font-size:11px"> (${src.count} haul${src.count !== 1 ? 's' : ''})</span>
                </div>
                <div style="text-align:right">
                  <div style="color:${roiColor};font-weight:700">${pct(src.roi)}</div>
                  <div style="color:var(--muted);font-size:11px">${fmt(src.totalSpent)} invested</div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- LOG NEW HAUL FORM -->
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">Log New Haul</h3>
        </div>
        <div style="padding:12px;display:grid;gap:10px">
          <div class="form-grid">
            <div class="fgrp">
              <label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">Date</label>
              <input type="date" id="haul_date" value="${new Date().toISOString().split('T')[0]}"
                     style="padding:8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:13px">
            </div>
            <div class="fgrp">
              <label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">Location</label>
              <input type="text" id="haul_loc" placeholder="e.g. Goodwill, Estate Sale, Thrift"
                     style="padding:8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:13px">
            </div>
            <div class="fgrp">
              <label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">Total Spent</label>
              <input type="number" id="haul_spent" placeholder="0.00" step="0.01" min="0"
                     style="padding:8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:13px">
            </div>
            <div class="fgrp">
              <label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">Mileage (mi)</label>
              <input type="number" id="haul_mileage" placeholder="0" step="0.1" min="0"
                     style="padding:8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:13px">
            </div>
          </div>
          <div class="fgrp">
            <label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">Notes</label>
            <textarea id="haul_notes" placeholder="Add notes..." rows="2"
                      style="padding:8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:13px;resize:vertical"></textarea>
          </div>
          <input id="haul_receipt" type="file" accept="image/*" capture="environment" class="fgrp" style="grid-column:1/-1;padding:8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:13px">
          <div style="font-size:10px;color:var(--muted);grid-column:1/-1">Snap or upload receipt photo</div>
          <button class="btn-primary" onclick="addHaul()" style="padding:10px;font-weight:700;font-family:'Syne',sans-serif;grid-column:1/-1">Log Haul</button>
        </div>
      </div>

      <!-- SEARCH & SORT -->
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:0 0 8px 0">
        <input type="text" placeholder="Search location, notes..." value="${escHtml(_srcSearch)}"
               oninput="srcSetSearch(this.value)"
               style="flex:1;min-width:150px;padding:6px 10px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:12px;font-family:'DM Mono',monospace">
        <select onchange="srcSetSort(this.value)" style="padding:6px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:11px;font-family:'DM Mono',monospace">
          <option value="date-desc" ${_srcSort === 'date-desc' ? 'selected' : ''}>Recent first</option>
          <option value="date-asc" ${_srcSort === 'date-asc' ? 'selected' : ''}>Oldest first</option>
          <option value="spent-high" ${_srcSort === 'spent-high' ? 'selected' : ''}>Spent (high)</option>
          <option value="spent-low" ${_srcSort === 'spent-low' ? 'selected' : ''}>Spent (low)</option>
          <option value="roi-high" ${_srcSort === 'roi-high' ? 'selected' : ''}>ROI (high)</option>
          <option value="location" ${_srcSort === 'location' ? 'selected' : ''}>Location A-Z</option>
        </select>
      </div>

      <!-- HAUL LIST -->
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">Haul History (${filtered.length})</h3>
        </div>
        <div style="padding:12px">
          ${filtered.length ? `
            <div style="display:flex;flex-direction:column;gap:8px">
              ${filtered.slice(_srcPage * _srcPageSize, (_srcPage + 1) * _srcPageSize).map(haul => {
                const haulROI = getHaulROI(haul, inv, sales);
                const haulItems = getHaulItems(haul, inv);
                const isExpanded = _expandedHaulId === haul.id;
                const roiColor = haulROI.roi >= 0.3 ? 'var(--good)' : haulROI.roi >= 0.1 ? 'var(--accent)' : haulROI.roi < 0 ? 'var(--danger)' : 'var(--muted)';

                return `<div class="haul-card" style="border:1px solid var(--border);border-radius:6px;padding:10px;background:rgba(var(--surface-rgb),0.5);cursor:pointer" onclick="expandHaul('${haul.id}')">
                  <div style="display:grid;grid-template-columns:1fr auto;gap:8px;font-size:12px;font-family:'DM Mono',monospace">
                    <div>
                      <div style="font-weight:700;color:var(--text)">${escHtml(haul.location)}</div>
                      <div style="color:var(--muted);font-size:11px">${ds(haul.date)} · ${haulItems.length} item${haulItems.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div style="text-align:right;display:flex;align-items:center;gap:8px">
                      ${haul.receiptImage ? `<img src="${haul.receiptImage}" style="width:40px;height:40px;object-fit:cover;border-radius:2px;cursor:pointer" onclick="event.stopPropagation();window.open(this.src)" alt="Receipt">` : ''}
                      <div>
                        <div style="font-weight:700;color:var(--accent2)">${fmt(haul.totalSpent)}</div>
                        <div style="color:${roiColor};font-size:11px;font-weight:700">${pct(haulROI.roi)}</div>
                      </div>
                    </div>
                  </div>
                  ${isExpanded ? `
                    <div style="border-top:1px solid var(--border);margin-top:10px;padding-top:10px">
                      <div style="font-size:11px;color:var(--muted);margin-bottom:8px">
                        <strong>Linked Items (${haulItems.length}):</strong>
                      </div>
                      ${haulItems.length ? `
                        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">
                          ${haulItems.map(item => {
                            const itemCost = splitCost(haul, inv)[item.id] || 0;
                            const itemSales = sales.filter(s => s.itemId === item.id);
                            const itemRevenue = itemSales.reduce((sum, s) => sum + (s.amount || 0), 0);
                            return `<div style="padding:6px;background:var(--surface);border-radius:4px;font-size:11px;display:flex;justify-content:space-between">
                              <span>${escHtml(item.name || 'Untitled')}</span>
                              <span style="color:var(--muted)">${fmt(itemCost)} cost · ${fmt(itemRevenue)} revenue</span>
                            </div>`;
                          }).join('')}
                        </div>
                      ` : '<div style="color:var(--muted);font-size:11px;padding:8px">No items linked yet</div>'}
                      <button class="btn-secondary" onclick="linkItemsToHaul('${haul.id}')" style="padding:6px 10px;margin-right:6px;font-size:11px;font-family:'Syne',sans-serif">Link Items</button>
                      <button class="btn-danger" onclick="deleteHaul('${haul.id}')" style="padding:6px 10px;font-size:11px;font-family:'Syne',sans-serif">Delete</button>
                    </div>
                  ` : ''}
                </div>`;
              }).join('')}
            </div>
            <div id="srcPagination" style="margin-top:12px"></div>
          ` : `<div class="empty-state" style="text-align:center;padding:24px;color:var(--muted)">
            <div style="font-size:14px;font-family:'Syne',sans-serif;margin-bottom:8px">No hauls yet</div>
            <div style="font-size:12px">Log your first haul to get started!</div>
          </div>`}
        </div>
      </div>

      <!-- HAUL ANALYTICS -->
      ${_hauls.length > 0 ? (() => {
        const totalTrips = filtered.length;
        const totalHaulSpent = filtered.reduce((s, h) => s + (h.totalSpent || 0), 0);
        const avgPerTrip = totalTrips > 0 ? totalHaulSpent / totalTrips : 0;
        const totalMileage = filtered.reduce((s, h) => s + (h.mileage || 0), 0);

        const sourceROI = {};
        for (const haul of _hauls) {
          const loc = haul.location || 'Unknown';
          if (!sourceROI[loc]) sourceROI[loc] = { spent: 0, revenue: 0, trips: 0 };
          sourceROI[loc].spent += haul.totalSpent || 0;
          sourceROI[loc].trips++;
          for (const itemId of (haul.itemIds || [])) {
            const itemSales = sales.filter(s => s.itemId === itemId);
            sourceROI[loc].revenue += itemSales.reduce((t, s) => t + (s.price || 0), 0);
          }
        }
        const topSources = Object.entries(sourceROI)
          .map(([loc, d]) => ({ loc, ...d, roi: d.spent > 0 ? (d.revenue - d.spent) / d.spent : 0 }))
          .filter(s => s.trips >= 1)
          .sort((a, b) => b.roi - a.roi)
          .slice(0, 5);

        return `
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">Haul Performance Analytics</h3>
            </div>
            <div style="padding:12px;display:grid;gap:12px">
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px">
                <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
                  <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Total Trips</div>
                  <div style="font-size:18px;font-weight:700;color:var(--accent);font-family:'Syne',sans-serif">${totalTrips}</div>
                </div>
                <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
                  <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Total Invested</div>
                  <div style="font-size:18px;font-weight:700;color:var(--accent2);font-family:'Syne',sans-serif">${fmt(totalHaulSpent)}</div>
                </div>
                <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
                  <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Avg Per Trip</div>
                  <div style="font-size:18px;font-weight:700;color:var(--accent3);font-family:'Syne',sans-serif">${fmt(avgPerTrip)}</div>
                </div>
                <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
                  <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Total Mileage</div>
                  <div style="font-size:18px;font-weight:700;color:var(--good);font-family:'Syne',sans-serif">${totalMileage.toFixed(1)} mi</div>
                </div>
              </div>
              ${topSources.length ? `
                <div style="border-top:1px solid var(--border);padding-top:12px">
                  <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px">Best Sources by ROI</div>
                  <div style="display:flex;flex-direction:column;gap:6px">
                    ${topSources.map((src, idx) => {
                      const roiColor = src.roi >= 0.3 ? 'var(--good)' : src.roi >= 0.1 ? 'var(--accent)' : 'var(--warn)';
                      return `
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:rgba(var(--surface-rgb),0.5);border-radius:3px;font-size:11px;font-family:'DM Mono',monospace">
                          <div>
                            <span style="margin-right:6px">${['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][idx]}</span>
                            <strong>${escHtml(src.loc)}</strong>
                            <span style="color:var(--muted);font-size:10px"> (${src.trips} trip${src.trips !== 1 ? 's' : ''})</span>
                          </div>
                          <div style="text-align:right">
                            <div style="color:${roiColor};font-weight:700">${pct(src.roi)}</div>
                            <div style="color:var(--muted);font-size:10px">${fmt(src.spent)} invested</div>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      })() : ''}
    </div>
  `;

  // Render pagination
  if (filtered.length > _srcPageSize) {
    renderPagination(document.getElementById('srcPagination'), {
      page: _srcPage,
      totalItems: filtered.length,
      pageSize: _srcPageSize,
      onPage: (p) => { _srcPage = p; renderSourcingView(); },
      pageSizes: [25, 50, 100],
      onPageSize: (s) => { _srcPageSize = s; _srcPage = 0; renderSourcingView(); }
    });
  }
}

// ── HAUL ACTIONS ───────────────────────────────────────────────────────────────

/**
 * Add a new haul from form inputs
 */
export async function addHaul() {
  const date = document.getElementById('haul_date')?.value;
  const location = document.getElementById('haul_loc')?.value?.trim();
  const spentStr = document.getElementById('haul_spent')?.value?.trim();
  const mileageStr = document.getElementById('haul_mileage')?.value?.trim();
  const notes = document.getElementById('haul_notes')?.value?.trim();

  if (!date) { toast('Please enter a date', true); return; }
  if (!location) { toast('Please enter a location', true); return; }
  if (!spentStr || isNaN(parseFloat(spentStr))) { toast('Please enter a valid amount spent', true); return; }

  const totalSpent = parseFloat(spentStr);
  const mileage = mileageStr ? parseFloat(mileageStr) : 0;

  // Handle receipt image
  const receiptFile = document.getElementById('haul_receipt')?.files?.[0];
  let receiptData = null;
  if (receiptFile) {
    receiptData = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(receiptFile);
    });
  }

  const newHaul = {
    id: uid(),
    date,
    location,
    totalSpent,
    itemIds: [],
    notes: notes || '',
    mileage: mileage || 0,
    receiptImage: receiptData
  };

  _hauls.push(newHaul);
  await saveHauls();
  toast('Haul logged ✓');

  // Clear form
  const locEl = document.getElementById('haul_loc');
  const spentEl = document.getElementById('haul_spent');
  const mileEl = document.getElementById('haul_mileage');
  const notesEl = document.getElementById('haul_notes');
  const receiptEl = document.getElementById('haul_receipt');
  if (locEl) locEl.value = '';
  if (spentEl) spentEl.value = '';
  if (mileEl) mileEl.value = '';
  if (notesEl) notesEl.value = '';
  if (receiptEl) receiptEl.value = '';

  renderSourcingView();
}

/**
 * Delete a haul by ID
 */
export async function deleteHaul(id) {
  if (!confirm('Delete this haul?')) return;
  const idx = _hauls.findIndex(h => h.id === id);
  if (idx >= 0) {
    _hauls.splice(idx, 1);
    await saveHauls();
    toast('Haul deleted');
    renderSourcingView();
  }
}

/**
 * Toggle haul expansion (show/hide linked items)
 */
export function expandHaul(id) {
  _expandedHaulId = _expandedHaulId === id ? null : id;
  renderSourcingView();
}

/**
 * Link inventory items to a haul (modal workflow)
 */
export async function linkItemsToHaul(haulId) {
  const haul = _hauls.find(h => h.id === haulId);
  if (!haul) return;

  // Create a modal to select items
  const modal = document.createElement('div');
  modal.style.cssText = `
    position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);
    display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background:var(--surface);border:1px solid var(--border);border-radius:8px;
    padding:20px;max-width:600px;width:100%;max-height:80vh;overflow-y:auto;
    font-family:'DM Mono',monospace;font-size:12px
  `;

  const unlinkedItems = inv.filter(item => !haul.itemIds.includes(item.id));

  content.innerHTML = `
    <div style="margin-bottom:16px">
      <h3 style="font-family:'Syne',sans-serif;font-size:16px;margin:0 0 12px 0">Link Items to Haul</h3>
      <div style="color:var(--muted);font-size:11px;margin-bottom:12px">Select items to assign to this haul</div>

      ${unlinkedItems.length ? `
        <div style="display:flex;flex-direction:column;gap:6px;max-height:300px;overflow-y:auto">
          ${unlinkedItems.map(item => `
            <label style="display:flex;align-items:center;padding:8px;background:rgba(255,255,255,0.05);border-radius:4px;cursor:pointer">
              <input type="checkbox" value="${item.id}" style="margin-right:8px">
              <span style="flex:1">${escHtml(item.name || 'Untitled')}</span>
              <span style="color:var(--muted);font-size:10px">${fmt(item.cost || 0)}</span>
            </label>
          `).join('')}
        </div>
      ` : `<div style="color:var(--muted);padding:12px;text-align:center">All items already linked to hauls</div>`}
    </div>

    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn-primary" onclick="confirmLinkItems('${haulId}')" style="flex:1;padding:10px;font-family:'Syne',sans-serif">Link Selected</button>
      <button class="btn-secondary" onclick="closeItemLinkModal()" style="flex:1;padding:10px;font-family:'Syne',sans-serif">Cancel</button>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  window._itemLinkModal = modal;
}

/**
 * Confirm linking selected items to haul
 */
export async function confirmLinkItems(haulId) {
  const modal = window._itemLinkModal;
  if (!modal) return;

  const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
  const selectedIds = Array.from(checkboxes).map(cb => cb.value);

  const haul = _hauls.find(h => h.id === haulId);
  if (haul) {
    haul.itemIds.push(...selectedIds);
    await saveHauls();
    toast(`Linked ${selectedIds.length} item${selectedIds.length !== 1 ? 's' : ''}`);
  }

  closeItemLinkModal();
  renderSourcingView();
}

/**
 * Close item link modal
 */
export function closeItemLinkModal() {
  const modal = window._itemLinkModal;
  if (modal) {
    modal.remove();
    window._itemLinkModal = null;
  }
}

/**
 * Unlink a single item from a haul
 */
export async function unlinkItem(haulId, itemId) {
  const haul = _hauls.find(h => h.id === haulId);
  if (haul) {
    const idx = haul.itemIds.indexOf(itemId);
    if (idx >= 0) {
      haul.itemIds.splice(idx, 1);
      await saveHauls();
      renderSourcingView();
    }
  }
}

// ── SEARCH & FILTER ────────────────────────────────────────────────────────────

/**
 * Set search term for haul location/notes
 */
export function srcSetSearch(val) {
  _srcSearch = (val || '').toLowerCase();
  _srcPage = 0;
  renderSourcingView();
}

/**
 * Set sort order for haul list
 */
export function srcSetSort(val) {
  _srcSort = val || 'date-desc';
  _srcPage = 0;
  renderSourcingView();
}
