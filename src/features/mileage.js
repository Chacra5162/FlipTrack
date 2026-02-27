/**
 * mileage.js - Mileage deduction tracking and calculation
 * Stores mileage log entries in IndexedDB meta store
 * Supports IRS standard mileage rate deductions
 */

import { uid, ds, fmt, escHtml } from '../utils/format.js';
import { getMeta, setMeta } from '../data/idb.js';
import { toast } from '../utils/dom.js';

// ── IRS MILEAGE RATES ─────────────────────────────────────────────────────
export const IRS_RATES = {
  2024: 0.67,
  2025: 0.70,
  2026: 0.70,
};

// ── STATE ─────────────────────────────────────────────────────────────────
let _mileageLog = [];

/**
 * Initialize mileage log from IDB
 */
export async function initMileageLog() {
  try {
    const log = await getMeta('mileage_log');
    _mileageLog = log || [];
  } catch (e) {
    console.warn('Failed to load mileage log:', e.message);
    _mileageLog = [];
  }
}

/**
 * Get current mileage log entries
 */
export function getMileageLog() {
  return [..._mileageLog];
}

/**
 * Add a new mileage entry
 * @param {Object} entry - { date, miles, purpose, startLocation, endLocation, linkedHaulId }
 */
export async function addMileageEntry(entry) {
  if (!entry.date || !entry.miles || !entry.purpose) {
    toast('Please fill in date, miles, and purpose', true);
    return false;
  }

  const miles = Number(entry.miles) || 0;
  if (miles <= 0) {
    toast('Miles must be greater than 0', true);
    return false;
  }

  const newEntry = {
    id: uid(),
    date: entry.date,
    miles: miles,
    purpose: entry.purpose.trim(),
    startLocation: (entry.startLocation || '').trim(),
    endLocation: (entry.endLocation || '').trim(),
    linkedHaulId: entry.linkedHaulId || null,
  };

  _mileageLog.push(newEntry);
  _mileageLog.sort((a, b) => new Date(b.date) - new Date(a.date));

  try {
    await setMeta('mileage_log', _mileageLog);
    return true;
  } catch (e) {
    console.error('Failed to save mileage entry:', e.message);
    toast('Failed to save mileage entry', true);
    _mileageLog.pop();
    return false;
  }
}

/**
 * Delete a mileage entry by id
 */
export async function deleteMileageEntry(id) {
  const idx = _mileageLog.findIndex(e => e.id === id);
  if (idx === -1) return false;

  _mileageLog.splice(idx, 1);

  try {
    await setMeta('mileage_log', _mileageLog);
    return true;
  } catch (e) {
    console.error('Failed to delete mileage entry:', e.message);
    toast('Failed to delete mileage entry', true);
    return false;
  }
}

/**
 * Calculate total mileage deduction for a given year
 * @param {number} year - Tax year
 * @returns {number} Total deduction amount
 */
export function getMileageDeduction(year) {
  const rate = IRS_RATES[year] || 0.70;
  const totalMiles = _mileageLog
    .filter(e => new Date(e.date).getFullYear() === year)
    .reduce((sum, e) => sum + (e.miles || 0), 0);
  return totalMiles * rate;
}

/**
 * Get mileage summary for a given year
 * @param {number} year - Tax year
 * @returns {Object} { totalMiles, totalDeduction, entries }
 */
export function getMileageSummary(year) {
  const rate = IRS_RATES[year] || 0.70;
  const yearEntries = _mileageLog.filter(e => new Date(e.date).getFullYear() === year);
  const totalMiles = yearEntries.reduce((sum, e) => sum + (e.miles || 0), 0);
  const totalDeduction = totalMiles * rate;

  return {
    totalMiles,
    totalDeduction,
    rate,
    entries: yearEntries,
  };
}

/**
 * Render mileage section HTML for embedding in tax center
 */
export function renderMileageSection() {
  const currentYear = new Date().getFullYear();
  const summary = getMileageSummary(currentYear);

  const entriesHtml = summary.entries
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((e, i) => `
      <tr>
        <td style="padding:8px;font-size:12px;color:var(--text)">${ds(e.date)}</td>
        <td style="padding:8px;font-size:12px;font-family:'DM Mono',monospace;color:var(--accent);text-align:right">${e.miles}</td>
        <td style="padding:8px;font-size:12px;color:var(--text)">${escHtml(e.purpose)}</td>
        <td style="padding:8px;font-size:12px;color:var(--muted)">${e.startLocation ? escHtml(e.startLocation) : '—'}</td>
        <td style="padding:8px;font-size:11px;text-align:center">
          <button onclick="mileDeleteEntry('${e.id}')" style="padding:4px 8px;background:var(--danger);color:white;border:none;border-radius:3px;cursor:pointer;font-size:10px;font-family:Syne,sans-serif">Delete</button>
        </td>
      </tr>
    `)
    .join('');

  return `
    <div style="margin-bottom:24px">
      <div class="panel-title" style="margin-bottom:12px">Mileage Deduction Log</div>

      <!-- Add Entry Form -->
      <div class="panel" style="margin-bottom:16px;padding:12px">
        <div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:8px">ADD ENTRY</div>
        <div class="form-grid" style="grid-template-columns:1fr 1fr 2fr;gap:8px;margin-bottom:8px">
          <div class="fgrp">
            <input type="date" id="mileDate" style="width:100%;padding:6px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:12px;border-radius:4px" />
          </div>
          <div class="fgrp">
            <input type="number" id="mileMiles" placeholder="Miles" step="0.1" min="0" style="width:100%;padding:6px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:12px;border-radius:4px" />
          </div>
          <div class="fgrp">
            <input type="text" id="milePurpose" placeholder="Purpose (e.g., sourcing trip)" style="width:100%;padding:6px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:12px;border-radius:4px" />
          </div>
        </div>
        <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div class="fgrp">
            <input type="text" id="mileStart" placeholder="Start location (optional)" style="width:100%;padding:6px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:12px;border-radius:4px" />
          </div>
          <div class="fgrp">
            <input type="text" id="mileEnd" placeholder="End location (optional)" style="width:100%;padding:6px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:12px;border-radius:4px" />
          </div>
        </div>
        <button onclick="mileAddEntry()" class="btn-primary" style="width:100%;padding:8px;background:var(--accent);color:white;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-family:Syne,sans-serif;font-size:13px">Add Entry</button>
      </div>

      <!-- Log Table -->
      ${summary.entries.length > 0 ? `
        <div style="overflow-x:auto;margin-bottom:16px">
          <table class="inv-table" style="font-size:12px;width:100%">
            <thead>
              <tr style="background:var(--surface);border-bottom:1px solid var(--border)">
                <th style="padding:8px;text-align:left;font-weight:600">Date</th>
                <th style="padding:8px;text-align:right;font-weight:600">Miles</th>
                <th style="padding:8px;text-align:left;font-weight:600">Purpose</th>
                <th style="padding:8px;text-align:left;font-weight:600">From</th>
                <th style="padding:8px;text-align:center;font-weight:600">Action</th>
              </tr>
            </thead>
            <tbody>
              ${entriesHtml}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="empty-state" style="padding:16px;text-align:center;color:var(--muted);font-size:12px">
          No mileage entries yet
        </div>
      `}

      <!-- Summary Stats -->
      <div class="stat-card" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="padding:12px;background:var(--surface);border-radius:6px;border:1px solid var(--border)">
          <div style="font-size:10px;font-weight:600;color:var(--muted);margin-bottom:4px">Total Miles (${currentYear})</div>
          <div style="font-size:18px;font-weight:700;color:var(--accent);font-family:'DM Mono',monospace">${summary.totalMiles.toFixed(1)}</div>
        </div>
        <div style="padding:12px;background:var(--surface);border-radius:6px;border:1px solid var(--border)">
          <div style="font-size:10px;font-weight:600;color:var(--muted);margin-bottom:4px">Deduction @ ${(summary.rate * 100).toFixed(0)}¢/mi</div>
          <div style="font-size:18px;font-weight:700;color:var(--good);font-family:'DM Mono',monospace">${fmt(summary.totalDeduction)}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Window-exposed function: Add mileage entry from form
 */
export async function mileAddEntry() {
  const dateEl = document.getElementById('mileDate');
  const milesEl = document.getElementById('mileMiles');
  const purposeEl = document.getElementById('milePurpose');
  const startEl = document.getElementById('mileStart');
  const endEl = document.getElementById('mileEnd');

  if (!dateEl || !milesEl || !purposeEl) {
    console.warn('Mileage form elements not found');
    return;
  }

  const success = await addMileageEntry({
    date: dateEl.value,
    miles: milesEl.value,
    purpose: purposeEl.value,
    startLocation: startEl?.value || '',
    endLocation: endEl?.value || '',
  });

  if (success) {
    toast('Mileage entry added ✓');
    dateEl.value = '';
    milesEl.value = '';
    purposeEl.value = '';
    startEl.value = '';
    endEl.value = '';

    // Re-render the mileage section if parent component provides callback
    if (window.renderTaxCenter) window.renderTaxCenter();
  }
}

/**
 * Window-exposed function: Delete mileage entry
 */
export async function mileDeleteEntry(id) {
  if (!confirm('Delete this mileage entry?')) return;

  const success = await deleteMileageEntry(id);
  if (success) {
    toast('Entry deleted ✓');
    if (window.renderTaxCenter) window.renderTaxCenter();
  }
}
