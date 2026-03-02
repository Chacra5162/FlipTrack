/**
 * Offer Tracking Module
 * Manages incoming and outgoing offers for inventory items.
 * Tracks offer status (pending, accepted, rejected, countered, expired).
 * Renders offer dashboard and item-level offer history.
 */

import { inv, getInvItem } from '../data/store.js';
import { fmt, ds, uid, escHtml } from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { getMeta, setMeta } from '../data/idb.js';

// ── STATE ─────────────────────────────────────────────────────────────────────
let _offers = [];

// Offer schema: { id, itemId, platform, amount, buyerHandle, buyerId, date, status, counterAmount, notes, createdAt }

// ── INIT ──────────────────────────────────────────────────────────────────────

export async function initOffers() {
  const data = await getMeta('offers');
  _offers = data ? JSON.parse(data) : [];
}

// ── SAVE ──────────────────────────────────────────────────────────────────────

function _saveOffers() {
  setMeta('offers', JSON.stringify(_offers)).catch(() => {});
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export function getOffers() {
  return _offers;
}

export function addOffer(offer) {
  const newOffer = {
    id: offer.id || uid(),
    itemId: offer.itemId,
    platform: offer.platform || '',
    amount: offer.amount || 0,
    buyerHandle: offer.buyerHandle || '',
    buyerId: offer.buyerId || null,
    date: offer.date || Date.now(),
    status: offer.status || 'pending',
    counterAmount: offer.counterAmount || null,
    notes: offer.notes || '',
    createdAt: Date.now(),
  };
  _offers.push(newOffer);
  _saveOffers();
  return newOffer;
}

export function updateOffer(id, updates) {
  const offer = _offers.find(o => o.id === id);
  if (!offer) return null;
  Object.assign(offer, updates);
  _saveOffers();
  return offer;
}

export function deleteOffer(id) {
  const idx = _offers.findIndex(o => o.id === id);
  if (idx === -1) return false;
  _offers.splice(idx, 1);
  _saveOffers();
  return true;
}

// ── QUERIES ───────────────────────────────────────────────────────────────────

export function getPendingOffersCount() {
  return _offers.filter(o => o.status === 'pending').length;
}

export function getItemOffers(itemId) {
  return _offers.filter(o => o.itemId === itemId).sort((a, b) => (b.date || 0) - (a.date || 0));
}

// ── RENDER OFFER HISTORY (for drawer modal) ────────────────────────────────────

export function renderItemOffers(itemId) {
  const offers = getItemOffers(itemId);
  if (offers.length === 0) {
    return '<div style="font-size:11px;color:var(--muted)">No offers yet</div>';
  }

  return `
    <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:8px">Offer History</div>
    <div class="inv-table">
      ${offers.map(o => `
        <div style="display:grid;grid-template-columns:1fr;gap:8px;padding:8px;background:var(--surface2);border-radius:2px;margin-bottom:6px;border-left:3px solid ${
          o.status === 'accepted' ? 'var(--good)' :
          o.status === 'rejected' ? 'var(--danger)' :
          o.status === 'countered' ? 'var(--accent)' :
          o.status === 'expired' ? 'var(--muted)' :
          'var(--accent2)'
        }">
          <div style="display:flex;justify-content:space-between;align-items:baseline">
            <div style="font-weight:600">${fmt(o.amount)}</div>
            <div style="font-size:10px;color:var(--muted)">${ds(o.date || Date.now())}</div>
          </div>
          <div style="font-size:10px;color:var(--muted)">
            ${escHtml(o.platform)} · ${escHtml(o.buyerHandle || 'Unknown')}
            ${o.status !== 'pending' ? ` · <strong>${escHtml(o.status.toUpperCase())}</strong>` : ''}
          </div>
          ${o.counterAmount ? `<div style="font-size:10px;color:var(--accent)">Counter: ${fmt(o.counterAmount)}</div>` : ''}
          ${o.notes ? `<div style="font-size:10px;color:var(--muted);font-style:italic">${escHtml(o.notes)}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

// ── RENDER OFFERS DASHBOARD PANEL ─────────────────────────────────────────────

export function renderOffersPanel() {
  const pending = _offers.filter(o => o.status === 'pending').sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, 20);

  const pendingCount = getPendingOffersCount();
  const acceptedCount = _offers.filter(o => o.status === 'accepted').length;
  const rejectedCount = _offers.filter(o => o.status === 'rejected').length;

  return `
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Offers</div>
        <div style="font-size:14px;font-weight:700;color:var(--accent2)">${pendingCount}</div>
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px;background:var(--surface2);border-bottom:1px solid var(--border);font-size:11px">
        <div style="text-align:center">
          <div style="color:var(--muted);font-weight:600;text-transform:uppercase;font-size:9px">Pending</div>
          <div style="font-size:18px;font-weight:700;color:var(--accent2);margin-top:2px">${pendingCount}</div>
        </div>
        <div style="text-align:center">
          <div style="color:var(--muted);font-weight:600;text-transform:uppercase;font-size:9px">Accepted</div>
          <div style="font-size:18px;font-weight:700;color:var(--good);margin-top:2px">${acceptedCount}</div>
        </div>
        <div style="text-align:center">
          <div style="color:var(--muted);font-weight:600;text-transform:uppercase;font-size:9px">Rejected</div>
          <div style="font-size:18px;font-weight:700;color:var(--danger);margin-top:2px">${rejectedCount}</div>
        </div>
      </div>

      <!-- Pending Offers List -->
      <div style="padding:12px">
        ${
          pending.length === 0
            ? '<div class="empty-state">No pending offers</div>'
            : pending.map(o => {
              const item = getInvItem(o.itemId);
              return `
                <div style="border:1px solid var(--border);border-radius:4px;padding:10px;margin-bottom:8px;background:var(--surface2)">
                  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
                    <div style="font-weight:600;color:var(--text);font-size:12px">${item ? escHtml(item.name) : 'Unknown Item'}</div>
                    <div style="font-size:14px;font-weight:700;color:var(--good)">${fmt(o.amount)}</div>
                  </div>
                  <div style="font-size:10px;color:var(--muted);margin-bottom:6px">
                    ${escHtml(o.platform)} · ${escHtml(o.buyerHandle || 'Unknown')} · ${ds(o.date || Date.now())}
                  </div>
                  ${o.notes ? `<div style="font-size:10px;color:var(--muted);margin-bottom:6px;font-style:italic">${escHtml(o.notes)}</div>` : ''}
                  <div style="display:flex;gap:6px">
                    <button onclick="offerAccept('${o.id}')" class="btn-primary" style="flex:1;height:28px;font-size:10px">Accept</button>
                    <button onclick="offerCounter('${o.id}')" class="btn-secondary" style="flex:1;height:28px;font-size:10px">Counter</button>
                    <button onclick="offerReject('${o.id}')" class="btn-danger" style="flex:1;height:28px;font-size:10px">Reject</button>
                  </div>
                </div>
              `;
            }).join('')
        }
      </div>
    </div>
  `;
}

// ── UI ACTIONS (exposed to window) ────────────────────────────────────────────

export function offerAdd(itemId) {
  const item = getInvItem(itemId);
  if (!item) { toast('Item not found', true); return; }

  const html = `
    <div style="padding:12px">
      <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:8px">Record Offer</div>
      <div class="form-grid">
        <input id="offer_platform" placeholder="Platform (eBay, Poshmark...)" class="fgrp" style="grid-column:1/-1">
        <input id="offer_amount" type="number" placeholder="Offer Amount" step="0.01" class="fgrp" style="grid-column:1/-1">
        <input id="offer_buyer" placeholder="Buyer Handle" class="fgrp" style="grid-column:1/-1">
        <textarea id="offer_notes" placeholder="Notes (optional)" class="fgrp" style="grid-column:1/-1;height:60px;resize:none"></textarea>
        <button onclick="offerAddConfirm('${itemId}')" class="btn-primary" style="grid-column:1/-1;height:36px">Add Offer</button>
        <button onclick="this.closest('.panel').remove()" class="btn-secondary" style="grid-column:1/-1;height:36px">Cancel</button>
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.className = 'panel';
  div.innerHTML = `
    <div class="panel-header"><div class="panel-title">New Offer · ${escHtml(item.name)}</div></div>
    ${html}
  `;
  document.body.appendChild(div);
}

export function offerAddConfirm(itemId) {
  const platformEl = document.getElementById('offer_platform');
  const amountEl = document.getElementById('offer_amount');
  const buyerEl = document.getElementById('offer_buyer');
  const notesEl = document.getElementById('offer_notes');

  const platform = (platformEl.value || '').trim();
  const amount = parseFloat(amountEl.value) || 0;
  const buyer = (buyerEl.value || '').trim();

  if (!platform) { toast('Platform required', true); return; }
  if (!amount) { toast('Amount required', true); return; }
  if (!buyer) { toast('Buyer handle required', true); return; }

  addOffer({
    itemId,
    platform,
    amount,
    buyerHandle: buyer,
    notes: (notesEl.value || '').trim(),
  });

  toast('Offer recorded');
  document.querySelector('.panel-header').closest('.panel').remove();
}

export function offerAccept(id) {
  const offer = _offers.find(o => o.id === id);
  if (!offer) { toast('Offer not found', true); return; }

  updateOffer(id, { status: 'accepted' });
  toast(`Offer accepted: ${fmt(offer.amount)}`);
}

export function offerReject(id) {
  const offer = _offers.find(o => o.id === id);
  if (!offer) { toast('Offer not found', true); return; }

  updateOffer(id, { status: 'rejected' });
  toast(`Offer rejected`);
}

export function offerCounter(id) {
  const offer = _offers.find(o => o.id === id);
  if (!offer) { toast('Offer not found', true); return; }

  const counterStr = prompt(`Counter offer for ${escHtml(offer.buyerHandle)} (current: ${fmt(offer.amount)}):`, fmt(offer.amount));
  if (!counterStr) return;

  const counterAmount = parseFloat(counterStr);
  if (isNaN(counterAmount)) { toast('Invalid amount', true); return; }

  updateOffer(id, { status: 'countered', counterAmount });
  toast(`Counter offer sent: ${fmt(counterAmount)}`);
}

export function offerDelete(id) {
  if (!confirm('Delete offer?')) return;
  deleteOffer(id);
  toast('Offer deleted');
}
