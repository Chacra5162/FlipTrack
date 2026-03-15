/**
 * donations.js — Donation Tracker with Tax Deduction
 * "Donate" action on death pile items records FMV as tax deduction
 * and feeds into Tax Center Schedule C.
 */

import { inv, expenses, save, refresh, markDirty, getInvItem } from '../data/store.js';
import { fmt, uid, localDate, escHtml, escAttr } from '../utils/format.js';
import { toast, appConfirm } from '../utils/dom.js';

/**
 * Donate an inventory item — records as expense with donation category.
 * @param {string} itemId - Item to donate
 * @param {number} fmv - Fair Market Value (defaults to item price)
 * @param {string} org - Organization name
 */
export async function donateItem(itemId, fmv, org) {
  const item = getInvItem(itemId);
  if (!item) { toast('Item not found', true); return; }

  const donationFmv = fmv || item.price || 0;
  const orgName = org || 'Charitable Organization';

  if (!await appConfirm({
    title: 'Donate Item',
    message: `Donate "${item.name}" with FMV ${fmt(donationFmv)} to ${orgName}?`
  })) return;

  // Record as expense with donation category
  const expId = uid();
  expenses.push({
    id: expId,
    name: `Donation: ${item.name}`,
    amount: donationFmv,
    category: 'donation',
    date: localDate(),
    notes: `Donated to ${orgName}`,
    metadata: {
      itemId,
      itemName: item.name,
      fmv: donationFmv,
      org: orgName,
      costBasis: item.cost || 0,
    }
  });
  markDirty('expenses', expId);

  // Soft-remove from inventory (set qty to 0)
  item.qty = 0;
  markDirty('inv', itemId);

  save();
  refresh();

  let msg = `Donated "${item.name}" — ${fmt(donationFmv)} deduction recorded`;
  if (donationFmv >= 250) {
    msg += ' (IRS requires written acknowledgment for donations $250+)';
  }
  toast(msg);
}

/**
 * Get all donations for a given year.
 * @param {number} year
 * @returns {Array} Donation expense records
 */
export function getDonations(year) {
  return expenses.filter(e =>
    e.category === 'donation' &&
    (e.date || '').startsWith(String(year))
  );
}

/**
 * Get total donation value for a year.
 * @param {number} year
 * @returns {number} Total FMV of donations
 */
export function getDonationTotal(year) {
  return getDonations(year).reduce((sum, e) => sum + (e.amount || 0), 0);
}

/**
 * Render donation log HTML.
 * @param {number} [year] - Defaults to current year
 * @returns {string} HTML
 */
export function renderDonationLog(year) {
  const yr = year || new Date().getFullYear();
  const donations = getDonations(yr);
  const total = donations.reduce((sum, e) => sum + (e.amount || 0), 0);

  if (!donations.length) {
    return `<div style="text-align:center;padding:16px;color:var(--muted);font-size:12px">No donations recorded for ${yr}</div>`;
  }

  const rows = donations.map(d => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px">
      <div>
        <div style="font-weight:500">${escHtml(d.name)}</div>
        <div style="font-size:10px;color:var(--muted)">${d.date} · ${escHtml(d.notes || '')}</div>
      </div>
      <div style="font-family:'DM Mono',monospace;color:var(--good);font-weight:600">${fmt(d.amount)}</div>
    </div>
  `).join('');

  return `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:12px;color:var(--muted)">${donations.length} donation${donations.length !== 1 ? 's' : ''}</span>
        <span style="font-family:'DM Mono',monospace;font-weight:700;color:var(--good)">${fmt(total)} total</span>
      </div>
      ${rows}
      ${total >= 250 ? '<div style="font-size:10px;color:var(--warn);margin-top:8px">⚠ IRS requires written acknowledgment for individual donations $250+</div>' : ''}
    </div>`;
}
