/**
 * Packing Slip Generation
 * Creates printable packing slips with seller info, buyer details, item info.
 * Handles single and batch printing.
 */

import { getInvItem } from '../data/store.js';
import { fmt, ds, escHtml } from '../utils/format.js';

// ── SELLER INFO (localStorage) ──────────────────────────────────────────────

const SELLER_INFO_KEY = 'ft_seller_info';

export function getSellerInfo() {
  const stored = localStorage.getItem(SELLER_INFO_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return _getDefaultSellerInfo();
    }
  }
  return _getDefaultSellerInfo();
}

export function setSellerInfo(info) {
  const defaultInfo = _getDefaultSellerInfo();
  const merged = { ...defaultInfo, ...info };
  localStorage.setItem(SELLER_INFO_KEY, JSON.stringify(merged));
}

function _getDefaultSellerInfo() {
  return {
    businessName: 'FlipTrack Reseller',
    name: localStorage.getItem('ft_seller_name') || 'Your Name',
    address: localStorage.getItem('ft_seller_address') || '123 Main St',
    city: localStorage.getItem('ft_seller_city') || 'City',
    state: localStorage.getItem('ft_seller_state') || 'ST',
    zip: localStorage.getItem('ft_seller_zip') || '12345',
    phone: localStorage.getItem('ft_seller_phone') || '',
    email: localStorage.getItem('ft_seller_email') || '',
    website: localStorage.getItem('ft_seller_website') || '',
  };
}

// ── THANK YOU MESSAGE ──────────────────────────────────────────────────────

const THANK_YOU_KEY = 'ft_thank_you_message';

export function getThankYouMessage() {
  return localStorage.getItem(THANK_YOU_KEY) || _getDefaultThankYouMessage();
}

export function setThankYouMessage(msg) {
  localStorage.setItem(THANK_YOU_KEY, msg);
}

function _getDefaultThankYouMessage() {
  return 'Thank you for your purchase! Please leave feedback if you are satisfied with your order.';
}

// ── SINGLE PACKING SLIP ─────────────────────────────────────────────────────

/**
 * Print a single packing slip for a sale.
 * Opens in a new window with print-ready HTML.
 */
export function printPackingSlip(saleId, sale) {
  if (!sale) return;

  const item = getInvItem(sale.itemId);
  const seller = getSellerInfo();
  const thankYou = getThankYouMessage();

  const html = _buildPackingSlipHTML({
    sale,
    item,
    seller,
    thankYou,
    pageNumber: 1,
    totalPages: 1,
  });

  _openPrintWindow(html, `slip-${saleId}`);
}

// ── BATCH PACKING SLIPS ────────────────────────────────────────────────────

/**
 * Print multiple packing slips in one print job.
 * Opens all in single window with page breaks.
 */
export function printBatchSlips(saleIds, selectedSales) {
  if (!selectedSales || selectedSales.length === 0) return;

  const seller = getSellerInfo();
  const thankYou = getThankYouMessage();

  const slips = selectedSales.map((sale, idx) => {
    const item = getInvItem(sale.itemId);
    return _buildPackingSlipHTML({
      sale,
      item,
      seller,
      thankYou,
      pageNumber: idx + 1,
      totalPages: selectedSales.length,
      pageBreak: idx < selectedSales.length - 1, // break between slips
    });
  });

  const html = slips.join('');
  _openPrintWindow(html, `batch-slip-${Date.now()}`);
}

// ── PACKING SLIP HTML BUILDER ──────────────────────────────────────────────

function _buildPackingSlipHTML(opts) {
  const { sale, item, seller, thankYou, pageNumber, totalPages, pageBreak } = opts;

  const itemName = item ? escHtml(item.name) : 'Unknown Item';
  const sku = item ? escHtml(item.sku || item.id || '') : '';
  const buyerName = escHtml(sale.buyerName || 'Buyer');
  const buyerAddress = escHtml(sale.buyerAddress || '');
  const buyerCity = escHtml(sale.buyerCity || '');
  const buyerState = escHtml(sale.buyerState || '');
  const buyerZip = escHtml(sale.buyerZip || '');

  const sellerAddr = `${escHtml(seller.businessName)}<br>${escHtml(seller.name)}<br>${escHtml(seller.address)}<br>${escHtml(seller.city)}, ${escHtml(seller.state)} ${escHtml(seller.zip)}`;

  const html = `
    <div style="page-break-after:${pageBreak ? 'always' : 'avoid'};padding:40px;font-family:'Syne','DM Mono',monospace;max-width:600px;margin:0 auto;color:#000;background:#fff">
      <!-- Header -->
      <div style="border-bottom:2px solid #333;padding-bottom:20px;margin-bottom:20px">
        <h1 style="margin:0;font-size:28px;font-weight:900;letter-spacing:-1px">PACKING SLIP</h1>
        <p style="margin:4px 0 0 0;font-size:11px;color:#666">#${escHtml(sale.id.slice(0, 8).toUpperCase())}</p>
      </div>

      <!-- Two-column header: Seller | Date/Order -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:30px;font-size:11px">
        <div>
          <p style="margin:0 0 10px 0;font-weight:700;color:#666">FROM:</p>
          <div style="line-height:1.6;font-size:10px">${sellerAddr}</div>
        </div>
        <div>
          <p style="margin:0 0 6px 0;font-weight:700">Order Date</p>
          <p style="margin:0 0 12px 0;font-size:13px;font-weight:600">${ds(sale.date)}</p>

          <p style="margin:0 0 6px 0;font-weight:700">Qty</p>
          <p style="margin:0;font-size:13px;font-weight:600">${sale.qty || 1}</p>
        </div>
      </div>

      <!-- Shipping To -->
      <div style="background:#f5f5f5;padding:16px;margin-bottom:24px;border-left:3px solid #007bff">
        <p style="margin:0 0 8px 0;font-weight:700;font-size:12px">SHIP TO:</p>
        <p style="margin:0;font-weight:600;font-size:13px">${buyerName}</p>
        <p style="margin:4px 0 0 0;font-size:11px;line-height:1.5">
          ${buyerAddress}
          ${buyerCity ? '<br>' + buyerCity : ''}
          ${buyerState ? (buyerCity ? ', ' : '<br>') + buyerState : ''}
          ${buyerZip ? ' ' + buyerZip : ''}
        </p>
      </div>

      <!-- Item Details -->
      <div style="margin-bottom:24px">
        <p style="margin:0 0 10px 0;font-weight:700;font-size:12px">ITEMS INCLUDED:</p>
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead>
            <tr style="border-bottom:1px solid #ccc">
              <th style="text-align:left;padding:8px 0;font-weight:700">Description</th>
              <th style="text-align:center;padding:8px 0;font-weight:700;width:60px">Qty</th>
              <th style="text-align:left;padding:8px 0;font-weight:700;width:80px">SKU</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:10px 0;word-break:break-word">${itemName}</td>
              <td style="text-align:center;padding:10px 0">${sale.qty || 1}</td>
              <td style="padding:10px 0;font-family:'DM Mono',monospace;font-size:10px">${sku}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Summary -->
      <div style="background:#f9f9f9;padding:12px;border-left:3px solid #7b61ff;margin-bottom:24px;font-size:11px">
        <div style="display:grid;grid-template-columns:1fr auto;gap:16px;margin-bottom:8px">
          <span>Sale Price:</span>
          <span style="font-weight:600">${fmt(sale.price || 0)}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr auto;gap:16px;margin-bottom:8px">
          <span>Fees:</span>
          <span style="font-weight:600">${fmt(sale.fees || 0)}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr auto;gap:16px;border-top:1px solid #ddd;padding-top:8px">
          <span>Net (before ship):</span>
          <span style="font-weight:700;font-size:12px">${fmt((sale.price || 0) - (sale.fees || 0))}</span>
        </div>
      </div>

      <!-- Thank You Message -->
      <div style="background:#fffacd;padding:14px;border-left:3px solid #ffc107;margin-bottom:24px;font-size:11px;line-height:1.6;color:#333">
        <p style="margin:0;font-weight:600;margin-bottom:6px">Thank You!</p>
        <p style="margin:0">${escHtml(thankYou)}</p>
      </div>

      <!-- Platform & Tracking info (if shipped) -->
      ${sale.shipped ? `
        <div style="font-size:10px;color:#666;border-top:1px solid #eee;padding-top:12px">
          <p style="margin:0"><strong>Shipped via:</strong> ${escHtml(sale.carrier || '—')} ${sale.platform ? '(' + escHtml(sale.platform) + ')' : ''}</p>
          ${sale.trackingNumber ? `<p style="margin:4px 0 0 0"><strong>Tracking:</strong> ${escHtml(sale.trackingNumber)}</p>` : ''}
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="border-top:1px solid #ccc;margin-top:24px;padding-top:12px;font-size:9px;color:#999;text-align:center">
        <p style="margin:0">Generated by FlipTrack • Page ${pageNumber} of ${totalPages}</p>
        <p style="margin:4px 0 0 0">${new Date().toLocaleString()}</p>
      </div>
    </div>
  `;

  return html;
}

// ── PRINT WINDOW HELPER ────────────────────────────────────────────────────

function _openPrintWindow(html, windowName) {
  const printWindow = window.open('', windowName, 'height=800,width=600');
  if (!printWindow) {
    console.warn('Unable to open print window — popup may be blocked');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Packing Slip</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Syne', monospace;
          background: #f5f5f5;
          padding: 20px;
        }
        @media print {
          body { background: white; padding: 0; }
          @page { margin: 0.5in; }
        }
      </style>
    </head>
    <body>
      ${html}
      <script>
        window.addEventListener('load', () => {
          setTimeout(() => window.print(), 500);
        });
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}

// ── PACKING SLIP SETTINGS MODAL ────────────────────────────────────────────

/**
 * Initialize packing slip settings modal in DOM.
 * Should be called once from main initialization.
 */
export function initPackingSlipSettings() {
  const modalsContainer = document.getElementById('modals-root');
  if (!modalsContainer || document.getElementById('packingSlipSettingsModal')) return;

  const seller = getSellerInfo();

  modalsContainer.insertAdjacentHTML('beforeend', `
    <div id="packingSlipSettingsModal" class="overlay">
      <div class="modal" style="max-width:500px">
        <div class="modal-header">
          <h3>Packing Slip Settings</h3>
          <button onclick="closePackingSlipSettings()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px">✕</button>
        </div>
        <div class="modal-body" style="padding:14px;max-height:70vh;overflow-y:auto;display:grid;gap:12px">

          <div style="border-bottom:1px solid var(--border);padding-bottom:12px">
            <h4 style="font-size:12px;font-weight:700;margin-bottom:10px;color:var(--text)">Business Info</h4>

            <div class="fgrp" style="margin-bottom:10px">
              <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Business Name</label>
              <input id="ps_businessName" type="text" value="${escHtml(seller.businessName)}" placeholder="Your Shop Name" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
            </div>

            <div class="fgrp" style="margin-bottom:10px">
              <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Your Name</label>
              <input id="ps_name" type="text" value="${escHtml(seller.name)}" placeholder="Your Name" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
            </div>

            <div class="fgrp" style="margin-bottom:10px">
              <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Address</label>
              <input id="ps_address" type="text" value="${escHtml(seller.address)}" placeholder="123 Main St" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
            </div>

            <div style="display:grid;grid-template-columns:2fr 1fr 1.5fr;gap:8px">
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">City</label>
                <input id="ps_city" type="text" value="${escHtml(seller.city)}" placeholder="City" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
              </div>
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">State</label>
                <input id="ps_state" type="text" value="${escHtml(seller.state)}" placeholder="ST" maxlength="2" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
              </div>
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">ZIP</label>
                <input id="ps_zip" type="text" value="${escHtml(seller.zip)}" placeholder="12345" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Phone</label>
                <input id="ps_phone" type="text" value="${escHtml(seller.phone)}" placeholder="(555) 555-5555" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
              </div>
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Email</label>
                <input id="ps_email" type="email" value="${escHtml(seller.email)}" placeholder="you@example.com" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
              </div>
            </div>
          </div>

          <div>
            <h4 style="font-size:12px;font-weight:700;margin-bottom:10px;color:var(--text)">Thank You Message</h4>
            <textarea id="ps_thankYouMsg" placeholder="Thank you for your purchase!..." style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%;min-height:80px;resize:vertical">${escHtml(getThankYouMessage())}</textarea>
            <p style="font-size:9px;color:var(--muted);margin-top:4px">This message appears on all packing slips</p>
          </div>

        </div>
        <div class="modal-footer" style="padding:10px 14px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end">
          <button onclick="closePackingSlipSettings()" class="btn-secondary">Cancel</button>
          <button onclick="savePackingSlipSettings()" class="btn-primary">Save</button>
        </div>
      </div>
    </div>
  `);
}

export function openPackingSlipSettings() {
  const modal = document.getElementById('packingSlipSettingsModal');
  if (modal) modal.classList.add('on');
}

export function closePackingSlipSettings() {
  const modal = document.getElementById('packingSlipSettingsModal');
  if (modal) modal.classList.remove('on');
}

export function savePackingSlipSettings() {
  const newInfo = {
    businessName: document.getElementById('ps_businessName').value.trim(),
    name: document.getElementById('ps_name').value.trim(),
    address: document.getElementById('ps_address').value.trim(),
    city: document.getElementById('ps_city').value.trim(),
    state: document.getElementById('ps_state').value.trim().toUpperCase(),
    zip: document.getElementById('ps_zip').value.trim(),
    phone: document.getElementById('ps_phone').value.trim(),
    email: document.getElementById('ps_email').value.trim(),
  };

  const thankYouMsg = document.getElementById('ps_thankYouMsg').value.trim();

  setSellerInfo(newInfo);
  setThankYouMessage(thankYouMsg);

  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = 'Packing slip settings saved';
    toast.classList.remove('err');
    toast.classList.add('on');
    setTimeout(() => toast.classList.remove('on'), 2300);
  }

  closePackingSlipSettings();
}
