export const PLATFORMS = [
  'eBay','Amazon','Etsy','Facebook Marketplace',
  'Depop','Poshmark','Mercari','Grailed','StockX','GOAT','Vinted','Tradesy','The RealReal','Vestiaire Collective',
  'Reverb','Discogs',
  'Craigslist','OfferUp','Nextdoor',
  'Whatnot','TikTok Shop','Instagram',
  'Shopify','Walmart Marketplace','Newegg','Bonanza','Ruby Lane','Chairish','1stDibs',
  'Swappa','Decluttr',
  'Unlisted','Other'
];

export const PLATFORM_GROUPS = [
  { label: 'General',   items: ['eBay','Amazon','Etsy','Facebook Marketplace'] },
  { label: 'Fashion',   items: ['Depop','Poshmark','Mercari','Grailed','StockX','GOAT','Vinted','Tradesy','The RealReal','Vestiaire Collective'] },
  { label: 'Music',     items: ['Reverb','Discogs'] },
  { label: 'Local',     items: ['Craigslist','OfferUp','Nextdoor'] },
  { label: 'Social',    items: ['Whatnot','TikTok Shop','Instagram'] },
  { label: 'Retail',    items: ['Shopify','Walmart Marketplace','Newegg','Bonanza','Ruby Lane','Chairish','1stDibs'] },
  { label: 'Tech',      items: ['Swappa','Decluttr'] },
  { label: 'Other',     items: ['Unlisted','Other'] },
];

export const platCls = p => ({
  'eBay':'plt-ebay','Amazon':'plt-amazon','Etsy':'plt-etsy','Facebook Marketplace':'plt-fb',
  'Depop':'plt-depop','Poshmark':'plt-poshmark','Mercari':'plt-mercari','Grailed':'plt-grailed',
  'StockX':'plt-stockx','GOAT':'plt-goat','Vinted':'plt-vinted','Tradesy':'plt-tradesy',
  'The RealReal':'plt-realreal','Vestiaire Collective':'plt-vestiaire',
  'Reverb':'plt-reverb','Discogs':'plt-discogs',
  'Craigslist':'plt-craigslist','OfferUp':'plt-offerup','Nextdoor':'plt-nextdoor',
  'Whatnot':'plt-whatnot','TikTok Shop':'plt-tiktok','Instagram':'plt-instagram',
  'Shopify':'plt-shopify','Walmart Marketplace':'plt-walmart','Newegg':'plt-newegg',
  'Bonanza':'plt-bonanza','Ruby Lane':'plt-bonanza','Chairish':'plt-chairish',
  '1stDibs':'plt-1stdibs','Swappa':'plt-swappa','Decluttr':'plt-decluttr',
}[p]||'plt-other');

// ── PLATFORM FEE SCHEDULES ────────────────────────────────────────────────
// Fees as percentage (0.13 = 13%). Some have flat fees added.
export const PLATFORM_FEES = {
  'eBay':                { pct: 0.1325, flat: 0.30, label: '13.25% + $0.30' },
  'Amazon':              { pct: 0.15,   flat: 0,    label: '15% referral' },
  'Etsy':                { pct: 0.065,  flat: 0.20, label: '6.5% + $0.20 + 3% processing', processing: 0.03 },
  'Facebook Marketplace':{ pct: 0.05,   flat: 0,    label: '5% (or $0.40 min)' },
  'Depop':               { pct: 0.10,   flat: 0,    label: '10%' },
  'Poshmark':            { pct: 0.20,   flat: 0,    label: '20% (or $2.95 if under $15)' },
  'Mercari':             { pct: 0.10,   flat: 0,    label: '10%' },
  'Grailed':             { pct: 0.09,   flat: 0,    label: '9% + 3.49% processing', processing: 0.0349 },
  'StockX':              { pct: 0.10,   flat: 0,    label: '~10% (varies by level)' },
  'GOAT':                { pct: 0.095,  flat: 5,    label: '9.5% + $5 cashout' },
  'Vinted':              { pct: 0,      flat: 0,    label: '0% seller fees (buyer pays)' },
  'Tradesy':             { pct: 0.198,  flat: 0,    label: '19.8%' },
  'The RealReal':        { pct: 0.45,   flat: 0,    label: '45% avg commission' },
  'Vestiaire Collective':{ pct: 0.15,   flat: 0,    label: '15%' },
  'Reverb':              { pct: 0.05,   flat: 0.25, label: '5% + $0.25' },
  'Discogs':             { pct: 0.08,   flat: 0,    label: '8%' },
  'Whatnot':             { pct: 0.089,  flat: 0,    label: '8.9%' },
  'TikTok Shop':         { pct: 0.08,   flat: 0,    label: '8%' },
  'Shopify':             { pct: 0.029,  flat: 0.30, label: '2.9% + $0.30 processing' },
  'Walmart Marketplace': { pct: 0.15,   flat: 0,    label: '15% referral' },
  'Newegg':              { pct: 0.12,   flat: 0,    label: '8-15% (avg 12%)' },
  'Swappa':              { pct: 0.03,   flat: 0,    label: '3% (buyer pays most)' },
};

export function calcPlatformFee(platform, salePrice) {
  const fee = PLATFORM_FEES[platform];
  if (!fee) return null;
  let total = (salePrice * fee.pct) + (fee.flat || 0);
  if (fee.processing) total += salePrice * fee.processing;
  // Poshmark minimum
  if (platform === 'Poshmark' && salePrice < 15) total = 2.95;
  // Facebook minimum
  if (platform === 'Facebook Marketplace') total = Math.max(total, 0.40);
  return Math.round(total * 100) / 100;
}
