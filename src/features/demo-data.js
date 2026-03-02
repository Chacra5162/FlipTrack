/**
 * demo-data.js — Demo seed data for investor showcases
 * Activated by triple-tapping the logo. Populates 18 realistic items,
 * 12 sales, and 6 expenses to showcase all dashboard features.
 */

import { inv, sales, expenses, save, refresh, rebuildInvIndex } from '../data/store.js';
import { uid } from '../utils/format.js';
import { toast } from '../utils/dom.js';

const DEMO_ITEMS = [
  { name: 'Nike Air Max 90 OG', category: 'Footwear', subcategory: 'Sneakers', platforms: ['eBay','StockX','Mercari'], cost: 45, price: 120, qty: 1, condition: 'Pre-Owned', sku: 'FT-NKE-001' },
  { name: 'Vintage Levi\'s 501 Jeans', category: 'Clothing', subcategory: 'Denim', platforms: ['Poshmark','eBay','Depop'], cost: 8, price: 65, qty: 2, condition: 'Pre-Owned', sku: 'FT-LEV-002' },
  { name: 'Canon EOS Rebel T7 Camera', category: 'Electronics', subcategory: 'Cameras', platforms: ['eBay','Facebook Marketplace'], cost: 180, price: 350, qty: 1, condition: 'Like New', sku: 'FT-CAN-003' },
  { name: 'First Edition Harry Potter GoF', category: 'Books', subcategory: 'Fiction', platforms: ['eBay','Amazon'], cost: 12, price: 85, qty: 1, condition: 'Good', sku: 'FT-HPB-004' },
  { name: 'Pyrex Vintage Mixing Bowl Set', category: 'Home & Garden', subcategory: 'Kitchen', platforms: ['eBay','Etsy'], cost: 15, price: 90, qty: 1, condition: 'Good', sku: 'FT-PYR-005' },
  { name: 'Supreme Box Logo Hoodie FW21', category: 'Clothing', subcategory: 'Streetwear', platforms: ['Grailed','StockX','Depop'], cost: 220, price: 480, qty: 1, condition: 'New with Tags', sku: 'FT-SUP-006' },
  { name: 'Sony WH-1000XM4 Headphones', category: 'Electronics', subcategory: 'Audio', platforms: ['eBay','Mercari','Amazon'], cost: 95, price: 175, qty: 1, condition: 'Refurbished', sku: 'FT-SNY-007' },
  { name: 'Pokémon Base Set Charizard PSA 7', category: 'Collectibles', subcategory: 'Trading Cards', platforms: ['eBay'], cost: 150, price: 420, qty: 1, condition: 'Graded', sku: 'FT-PKM-008' },
  { name: 'Le Creuset Dutch Oven 5.5qt', category: 'Home & Garden', subcategory: 'Kitchen', platforms: ['eBay','Facebook Marketplace','Mercari'], cost: 40, price: 145, qty: 1, condition: 'Pre-Owned', sku: 'FT-LCR-009' },
  { name: 'Jordan 4 Retro Thunder', category: 'Footwear', subcategory: 'Sneakers', platforms: ['StockX','GOAT','eBay'], cost: 190, price: 310, qty: 2, condition: 'Deadstock', sku: 'FT-JRD-010' },
  { name: 'Vintage Coach Crossbody Bag', category: 'Clothing', subcategory: 'Bags', platforms: ['Poshmark','eBay','Etsy'], cost: 18, price: 78, qty: 1, condition: 'Pre-Owned', sku: 'FT-CCH-011' },
  { name: 'KitchenAid Stand Mixer KSM150', category: 'Home & Garden', subcategory: 'Kitchen', platforms: ['eBay','Facebook Marketplace'], cost: 65, price: 185, qty: 1, condition: 'Pre-Owned', sku: 'FT-KAD-012' },
  { name: 'Nintendo Switch OLED Bundle', category: 'Electronics', subcategory: 'Gaming', platforms: ['eBay','Mercari','Facebook Marketplace'], cost: 230, price: 340, qty: 1, condition: 'Like New', sku: 'FT-NSW-013' },
  { name: 'Patagonia Better Sweater Vest', category: 'Clothing', subcategory: 'Outerwear', platforms: ['Poshmark','eBay','Depop'], cost: 22, price: 68, qty: 3, condition: 'Pre-Owned', sku: 'FT-PAT-014' },
  { name: 'Dyson V8 Cordless Vacuum', category: 'Home & Garden', subcategory: 'Appliances', platforms: ['eBay','Facebook Marketplace'], cost: 55, price: 165, qty: 1, condition: 'Refurbished', sku: 'FT-DYS-015' },
  { name: 'Vintage Star Wars Figure Lot', category: 'Collectibles', subcategory: 'Toys', platforms: ['eBay'], cost: 35, price: 125, qty: 1, condition: 'Pre-Owned', sku: 'FT-SWF-016' },
  { name: 'Anthropologie Table Runner', category: 'Home & Garden', subcategory: 'Decor', platforms: ['Poshmark','eBay','Etsy'], cost: 5, price: 42, qty: 2, condition: 'New without Tags', sku: 'FT-ANT-017' },
  { name: 'Apple AirPods Pro 2nd Gen', category: 'Electronics', subcategory: 'Audio', platforms: ['eBay','Mercari','Amazon'], cost: 140, price: 210, qty: 1, condition: 'Open Box', sku: 'FT-APL-018' },
];

function daysAgo(d) {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt.toISOString().slice(0, 10);
}

function buildDemoItems() {
  return DEMO_ITEMS.map((d, i) => ({
    id: uid(),
    name: d.name,
    category: d.category,
    subcategory: d.subcategory || '',
    subtype: '',
    platforms: d.platforms || [],
    cost: d.cost,
    price: d.price,
    fees: Math.round(d.price * 0.12 * 100) / 100,
    ship: Math.round((3 + Math.random() * 8) * 100) / 100,
    qty: d.qty,
    condition: d.condition || '',
    sku: d.sku || '',
    upc: '',
    notes: '',
    added: daysAgo(Math.floor(Math.random() * 60) + 5),
    image: '',
    images: [],
    bulk: d.qty > 1,
    lowAlert: 2,
  }));
}

function buildDemoSales(items) {
  // Sell 12 of the 18 items (varied dates)
  const soldIndices = [0, 2, 3, 5, 6, 7, 9, 10, 12, 14, 15, 17];
  return soldIndices.map(idx => {
    const it = items[idx];
    const salePrice = it.price + Math.round((Math.random() * 20 - 10) * 100) / 100;
    const fees = Math.round(salePrice * 0.12 * 100) / 100;
    const ship = Math.round((4 + Math.random() * 6) * 100) / 100;
    return {
      id: uid(),
      itemId: it.id,
      date: daysAgo(Math.floor(Math.random() * 30)),
      price: salePrice,
      qty: 1,
      fees,
      ship,
      platform: it.platforms[0] || 'eBay',
      buyer: '',
      notes: '',
    };
  });
}

function buildDemoExpenses() {
  return [
    { id: uid(), date: daysAgo(25), category: 'Shipping Supplies', desc: 'USPS Flat Rate Boxes (20)', amount: 16.80 },
    { id: uid(), date: daysAgo(18), category: 'Software', desc: 'eBay Store Subscription', amount: 21.95 },
    { id: uid(), date: daysAgo(12), category: 'Shipping Supplies', desc: 'Poly Mailers (50 pack)', amount: 12.99 },
    { id: uid(), date: daysAgo(8), category: 'Sourcing', desc: 'Goodwill thrift haul gas', amount: 8.50 },
    { id: uid(), date: daysAgo(4), category: 'Software', desc: 'Photo editing subscription', amount: 9.99 },
    { id: uid(), date: daysAgo(1), category: 'Shipping Supplies', desc: 'Bubble wrap roll', amount: 14.50 },
  ];
}

export function loadDemoData() {
  if (inv.length > 0 || sales.length > 0) {
    const ok = confirm('This will ADD demo data alongside your existing data. Continue?');
    if (!ok) return false;
  }

  const demoItems = buildDemoItems();
  const demoSales = buildDemoSales(demoItems);
  const demoExpenses = buildDemoExpenses();

  // Mark sold items as qty 0
  for (const s of demoSales) {
    const it = demoItems.find(i => i.id === s.itemId);
    if (it) it.qty = Math.max(0, it.qty - s.qty);
  }

  inv.push(...demoItems);
  sales.push(...demoSales);
  expenses.push(...demoExpenses);

  save();
  rebuildInvIndex();
  refresh();
  toast('Demo data loaded — 18 items, 12 sales, 6 expenses');
  return true;
}

export function clearDemoData() {
  // Remove items with FT- demo SKU prefix
  const demoIds = new Set(inv.filter(i => (i.sku || '').startsWith('FT-')).map(i => i.id));
  inv.length = 0;
  inv.push(...inv.filter(i => !demoIds.has(i.id)));
  sales.length = 0;
  sales.push(...sales.filter(s => !demoIds.has(s.itemId)));
  save();
  rebuildInvIndex();
  refresh();
  toast('Demo data cleared');
}

/** Triple-tap detection on logo */
export function initDemoTrigger() {
  const logo = document.querySelector('.logo');
  if (!logo) return;

  let tapCount = 0;
  let tapTimer = null;

  logo.addEventListener('click', () => {
    tapCount++;
    clearTimeout(tapTimer);

    if (tapCount >= 3) {
      tapCount = 0;
      const action = inv.some(i => (i.sku || '').startsWith('FT-'))
        ? confirm('Remove demo data?') ? 'clear' : null
        : 'load';

      if (action === 'load') loadDemoData();
      else if (action === 'clear') clearDemoData();
    } else {
      tapTimer = setTimeout(() => { tapCount = 0; }, 600);
    }
  });
}
