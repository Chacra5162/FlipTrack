/**
 * Buyers CRM View Module
 * Manages buyer database, tracks repeat customers, and links sales to buyers.
 * Features: Add/edit buyers, search, sort, view purchase history, link sales.
 */

import { sales, save, getInvItem } from '../data/store.js';
import { fmt, ds, uid, escHtml } from '../utils/format.js';
import { toast } from '../utils/dom.js';
import { getMeta, setMeta } from '../data/idb.js';
import { renderPagination } from '../utils/pagination.js';

// ── STATE ─────────────────────────────────────────────────────────────────────
let _buyers = [];
let _buyerSearch = '';
let _buyerSort = 'spent'; // 'spent', 'recent', 'name'
let _buyerPage = 0;
const _buyerPageSize = 50;
let _expandedBuyerId = null;

// Buyer schema: { id, name, handles: { eBay: '', Poshmark: '', ... }, email, phone, notes, createdAt, comms: [] }

// Buyer tiers based on total spending
const BUYER_TIERS = [
  { name: 'New', minSpent: 0, color: 'var(--muted)', icon: '👤' },
  { name: 'Regular', minSpent: 50, color: 'var(--accent)', icon: '⭐' },
  { name: 'VIP', minSpent: 200, color: 'var(--accent2)', icon: '💎' },
  { name: 'Elite', minSpent: 500, color: 'var(--good)', icon: '👑' },
];

function getBuyerTier(buyerId) {
  const spent = sales.filter(s => s.buyerId === buyerId).reduce((t, s) => t + (s.price || 0), 0);
  let tier = BUYER_TIERS[0];
  for (const t of BUYER_TIERS) {
    if (spent >= t.minSpent) tier = t;
  }
  return { ...tier, spent };
}

// ── INIT ──────────────────────────────────────────────────────────────────────

export async function initBuyers() {
  const data = await getMeta('buyers');
  _buyers = data ? JSON.parse(data) : [];
}

// ── GET / SET ─────────────────────────────────────────────────────────────────

function _saveBuyers() {
  setMeta('buyers', JSON.stringify(_buyers)).catch(() => {});
}

function _getBuyer(id) {
  return _buyers.find(b => b.id === id);
}

// ── ADD BUYER ─────────────────────────────────────────────────────────────────

export function buyerAdd() {
  const nameEl = document.getElementById('buyer_name');
  const emailEl = document.getElementById('buyer_email');
  const phoneEl = document.getElementById('buyer_phone');
  const ebayEl = document.getElementById('buyer_ebay');
  const poshEl = document.getElementById('buyer_posh');
  const mercEl = document.getElementById('buyer_merc');
  const notesEl = document.getElementById('buyer_notes');

  const name = (nameEl.value || '').trim();
  if (!name) { toast('Name required', true); return; }

  const buyer = {
    id: uid(),
    name,
    handles: {
      eBay: (ebayEl.value || '').trim(),
      Poshmark: (poshEl.value || '').trim(),
      Mercari: (mercEl.value || '').trim(),
    },
    email: (emailEl.value || '').trim(),
    phone: (phoneEl.value || '').trim(),
    notes: (notesEl.value || '').trim(),
    createdAt: Date.now(),
  };

  _buyers.push(buyer);
  _saveBuyers();
  toast(`${escHtml(name)} added`);

  nameEl.value = '';
  emailEl.value = '';
  phoneEl.value = '';
  ebayEl.value = '';
  poshEl.value = '';
  mercEl.value = '';
  notesEl.value = '';

  renderBuyersView();
}

// ── DELETE BUYER ──────────────────────────────────────────────────────────────

export function buyerDelete(id) {
  const buyer = _getBuyer(id);
  if (!buyer) return;
  if (!confirm(`Delete ${escHtml(buyer.name)}?`)) return;

  const idx = _buyers.indexOf(buyer);
  _buyers.splice(idx, 1);
  _saveBuyers();
  toast(`${escHtml(buyer.name)} deleted`);
  renderBuyersView();
}

// ── EXPAND BUYER (show purchase history) ──────────────────────────────────────

export function buyerExpand(id) {
  _expandedBuyerId = _expandedBuyerId === id ? null : id;
  renderBuyersView();
}

// ── SEARCH / SORT ─────────────────────────────────────────────────────────────

export function buyerSetSearch(val) {
  _buyerSearch = (val || '').toLowerCase();
  _buyerPage = 0;
  renderBuyersView();
}

export function buyerSetSort(val) {
  _buyerSort = val;
  _buyerPage = 0;
  renderBuyersView();
}

// ── GET OR CREATE BUYER (from sale flow) ─────────────────────────────────────

export function getOrCreateBuyer(name, platform) {
  if (!name) return null;
  const lname = name.toLowerCase().trim();
  // Try to find existing buyer by name or platform handle
  let buyer = _buyers.find(b =>
    b.name.toLowerCase() === lname ||
    Object.values(b.handles || {}).some(h => h && h.toLowerCase() === lname)
  );
  if (!buyer) {
    buyer = {
      id: uid(),
      name: name.trim(),
      handles: platform ? { [platform]: name.trim() } : {},
      email: '', phone: '', notes: '',
      createdAt: Date.now(),
    };
    _buyers.push(buyer);
    _saveBuyers();
  }
  return buyer;
}

// ── LINK SALE TO BUYER ────────────────────────────────────────────────────────

export function buyerLinkSale(buyerId, saleId) {
  const sale = sales.find(s => s.id === saleId);
  if (!sale) return;
  sale.buyerId = buyerId;
  save();
  toast('Sale linked to buyer');
}

// ── ADD COMMUNICATION LOG ─────────────────────────────────────────────────────

export function buyerAddComm(buyerId) {
  const typeEl = document.getElementById('comm_type_' + buyerId);
  const contentEl = document.getElementById('comm_content_' + buyerId);

  const type = typeEl?.value || 'note';
  const content = (contentEl?.value || '').trim();
  if (!content) { toast('Enter a message', true); return; }

  const buyer = _getBuyer(buyerId);
  if (!buyer) return;
  if (!buyer.comms) buyer.comms = [];
  buyer.comms.push({ type, content, date: Date.now() });
  _saveBuyers();

  if (contentEl) contentEl.value = '';
  toast('Note added');
  renderBuyersView();
}

// ── RENDER ────────────────────────────────────────────────────────────────────

export function renderBuyersView() {
  const container = document.getElementById('buyersView');
  if (!container) return;

  // Calculate stats
  const totalBuyers = _buyers.length;
  const repeatBuyers = _buyers.filter(b => {
    const count = sales.filter(s => s.buyerId === b.id).length;
    return count > 1;
  }).length;
  const totalSpent = _buyers.reduce((sum, b) => {
    const amount = sales
      .filter(s => s.buyerId === b.id)
      .reduce((t, s) => t + (s.price || 0), 0);
    return sum + amount;
  }, 0);
  const avgOrderValue = sales.length
    ? totalSpent / sales.length
    : 0;

  // Filter
  const filtered = _buyers.filter(b => {
    const search = _buyerSearch;
    if (!search) return true;
    return (
      b.name.toLowerCase().includes(search) ||
      b.email.toLowerCase().includes(search) ||
      b.phone.includes(search) ||
      Object.values(b.handles).some(h => h.toLowerCase().includes(search))
    );
  });

  // Sort
  filtered.sort((a, b) => {
    if (_buyerSort === 'name') return a.name.localeCompare(b.name);
    if (_buyerSort === 'recent') return b.createdAt - a.createdAt;
    // 'spent' (default)
    const aSpent = sales.filter(s => s.buyerId === a.id).reduce((t, s) => t + (s.price || 0), 0);
    const bSpent = sales.filter(s => s.buyerId === b.id).reduce((t, s) => t + (s.price || 0), 0);
    return bSpent - aSpent;
  });

  // Paginate
  const paged = filtered.slice(_buyerPage * _buyerPageSize, (_buyerPage + 1) * _buyerPageSize);

  let html = `
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Buyer CRM</div>
      </div>

      <!-- Stats Strip -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;padding:12px;background:var(--surface2);border-bottom:1px solid var(--border)">
        <div class="stat-card">
          <div style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Total Buyers</div>
          <div style="font-size:24px;font-weight:700;color:var(--accent);margin-top:4px">${totalBuyers}</div>
        </div>
        <div class="stat-card">
          <div style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Repeat</div>
          <div style="font-size:24px;font-weight:700;color:var(--accent2);margin-top:4px">${repeatBuyers}</div>
        </div>
        <div class="stat-card">
          <div style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Total Spent</div>
          <div style="font-size:18px;font-weight:700;color:var(--good);margin-top:4px">${fmt(totalSpent)}</div>
        </div>
        <div class="stat-card">
          <div style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Avg Order</div>
          <div style="font-size:18px;font-weight:700;color:var(--accent3);margin-top:4px">${fmt(avgOrderValue)}</div>
        </div>
      </div>

      <!-- Add Buyer Form -->
      <div style="padding:12px;background:var(--surface);border-bottom:1px solid var(--border)">
        <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:8px">Add Buyer</div>
        <div class="form-grid">
          <input id="buyer_name" placeholder="Full Name" class="fgrp" style="grid-column:1/-1">
          <input id="buyer_email" type="email" placeholder="Email" class="fgrp">
          <input id="buyer_phone" placeholder="Phone" class="fgrp">
          <input id="buyer_ebay" placeholder="eBay Handle" class="fgrp" style="grid-column:1/-1">
          <input id="buyer_posh" placeholder="Poshmark Handle" class="fgrp" style="grid-column:1/-1">
          <input id="buyer_merc" placeholder="Mercari Handle" class="fgrp" style="grid-column:1/-1">
          <textarea id="buyer_notes" placeholder="Notes" class="fgrp" style="grid-column:1/-1;height:60px;resize:none"></textarea>
          <button onclick="buyerAdd()" class="btn-primary" style="grid-column:1/-1;height:36px">Add</button>
        </div>
      </div>

      <!-- Search & Sort -->
      <div style="padding:12px;display:flex;gap:8px;border-bottom:1px solid var(--border)">
        <input
          type="search"
          placeholder="Search buyers..."
          class="fgrp"
          style="flex:1"
          onchange="buyerSetSearch(this.value)"
          oninput="buyerSetSearch(this.value)"
        >
        <select class="fgrp" style="width:120px" onchange="buyerSetSort(this.value)">
          <option value="spent">By Spent</option>
          <option value="recent">By Recent</option>
          <option value="name">By Name</option>
        </select>
      </div>

      <!-- Buyers List -->
      <div style="padding:12px">
        ${
          paged.length === 0
            ? '<div class="empty-state">No buyers yet</div>'
            : paged.map(buyer => {
              const spent = sales.filter(s => s.buyerId === buyer.id).reduce((t, s) => t + (s.price || 0), 0);
              const count = sales.filter(s => s.buyerId === buyer.id).length;
              const lastSale = sales.filter(s => s.buyerId === buyer.id).sort((a, b) => (b.date || 0) - (a.date || 0))[0];
              const isExpanded = _expandedBuyerId === buyer.id;
              const buySales = sales.filter(s => s.buyerId === buyer.id).sort((a, b) => (b.date || 0) - (a.date || 0));
              const tier = getBuyerTier(buyer.id);

              return `
                <div style="border:1px solid var(--border);border-radius:4px;margin-bottom:8px;overflow:hidden">
                  <!-- Header -->
                  <div
                    style="padding:12px;background:var(--surface2);cursor:pointer;display:flex;justify-content:space-between;align-items:center"
                    onclick="buyerExpand('${buyer.id}')"
                  >
                    <div>
                      <div style="display:flex;align-items:center;gap:8px">
                        <span style="font-weight:600;color:var(--text)">${escHtml(buyer.name)}</span>
                        <span style="font-size:9px;padding:2px 6px;background:${tier.color}20;color:${tier.color};border-radius:2px">${tier.icon} ${tier.name}</span>
                      </div>
                      <div style="font-size:11px;color:var(--muted);margin-top:2px">
                        ${buyer.email ? escHtml(buyer.email) + ' · ' : ''}
                        ${Object.entries(buyer.handles)
                          .filter(([, h]) => h)
                          .map(([plat, h]) => `${plat}: ${escHtml(h)}`)
                          .join(' · ')}
                      </div>
                    </div>
                    <div style="text-align:right">
                      <div style="font-size:14px;font-weight:700;color:var(--good)">${fmt(spent)}</div>
                      <div style="font-size:11px;color:var(--muted)">${count} purchase${count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  <!-- Expanded Content -->
                  ${
                    isExpanded
                      ? `
                    <div style="border-top:1px solid var(--border);padding:12px;background:var(--surface)">
                      ${buyer.notes ? `<div style="padding:8px;background:var(--surface2);border-radius:2px;margin-bottom:8px"><strong>Notes:</strong> ${escHtml(buyer.notes)}</div>` : ''}
                      <div style="font-size:11px;color:var(--muted);margin-bottom:8px;font-weight:600">Last Purchase: ${lastSale ? ds(lastSale.date || Date.now()) : '—'}</div>
                      ${count >= 3 ? `<div style="font-size:10px;color:var(--accent2);margin-bottom:8px">💡 Repeat buyer — consider offering ${count >= 5 ? '15%' : '10%'} loyalty discount</div>` : ''}

                      ${
                        buySales.length > 0
                          ? `
                        <div style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:6px">Purchase History:</div>
                        <div class="inv-table">
                          <div style="display:grid;grid-template-columns:1fr 80px 80px;gap:8px;font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;padding-bottom:4px;border-bottom:1px solid var(--border)">
                            <div>Item</div>
                            <div style="text-align:right">Price</div>
                            <div style="text-align:right">Date</div>
                          </div>
                          ${buySales.map(s => {
                            const item = getInvItem(s.itemId);
                            return `
                              <div style="display:grid;grid-template-columns:1fr 80px 80px;gap:8px;font-size:11px;padding:6px 0;border-bottom:1px solid var(--border);align-items:center">
                                <div style="color:var(--text)">${item ? escHtml(item.name) : 'Unknown Item'}</div>
                                <div style="text-align:right;color:var(--good);font-weight:600">${fmt(s.price || 0)}</div>
                                <div style="text-align:right;color:var(--muted);font-size:10px">${ds(s.date || Date.now())}</div>
                              </div>
                            `;
                          }).join('')}
                        </div>
                      `
                          : '<div style="font-size:11px;color:var(--muted)">No purchases linked</div>'
                      }

                      <!-- Communication Log -->
                      <div style="margin-top:12px">
                        <div style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:6px">Communication Log</div>
                        <div style="display:flex;gap:6px;margin-bottom:8px">
                          <select id="comm_type_${buyer.id}" class="fgrp" style="width:100px">
                            <option value="note">📝 Note</option>
                            <option value="message">💬 Message</option>
                            <option value="email">📧 Email</option>
                            <option value="call">📞 Call</option>
                          </select>
                          <input id="comm_content_${buyer.id}" placeholder="Add note..." class="fgrp" style="flex:1">
                          <button onclick="buyerAddComm('${buyer.id}')" class="btn-primary" style="height:32px;font-size:11px;padding:0 12px">Add</button>
                        </div>
                        ${(buyer.comms || []).slice().reverse().slice(0, 10).map(c => `
                          <div style="padding:6px 8px;background:var(--surface2);border-radius:2px;margin-bottom:4px;border-left:3px solid ${
                            c.type === 'message' ? 'var(--accent)' : c.type === 'email' ? 'var(--accent2)' : c.type === 'call' ? 'var(--good)' : 'var(--muted)'
                          }">
                            <div style="font-size:10px;color:var(--muted)">${
                              c.type === 'note' ? '📝' : c.type === 'message' ? '💬' : c.type === 'email' ? '📧' : '📞'
                            } ${ds(c.date)}</div>
                            <div style="font-size:11px;color:var(--text);margin-top:2px">${escHtml(c.content)}</div>
                          </div>
                        `).join('')}
                      </div>

                      <button onclick="buyerDelete('${buyer.id}')" class="btn-danger" style="margin-top:8px;width:100%;height:32px;font-size:11px">Delete Buyer</button>
                    </div>
                  `
                      : ''
                  }
                </div>
              `;
            }).join('')
        }
      </div>

      <!-- Pagination -->
      <div id="buyersPagination"></div>
    </div>
  `;

  container.innerHTML = html;

  // Render pagination
  const paginationEl = document.getElementById('buyersPagination');
  renderPagination(paginationEl, {
    page: _buyerPage,
    totalItems: filtered.length,
    pageSize: _buyerPageSize,
    onPage: (p) => { _buyerPage = p; renderBuyersView(); },
  });
}
