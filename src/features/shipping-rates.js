/**
 * Shipping Rates & Package Estimation
 * Pure logic module: USPS rates, package suggestions, carrier selection.
 * No DOM imports or side effects.
 */

// ── USPS RATE TABLES (2024 prices, approximate) ─────────────────────────────

export const USPS_RATES = {
  firstClass: {
    label: 'First Class Mail',
    maxWeight: 13, // oz
    basePrice: 1.01,
    incrementalPrice: 0.24, // per additional oz
  },
  priorityMail: {
    label: 'Priority Mail',
    zones: {
      1: [4.30, 4.71, 5.20, 5.85, 6.50, 7.15, 7.80],
      2: [4.30, 4.71, 5.20, 5.85, 6.50, 7.15, 7.80],
      3: [4.33, 4.75, 5.32, 6.12, 6.92, 7.72, 8.52],
      4: [4.40, 4.88, 5.57, 6.56, 7.55, 8.54, 9.53],
      5: [4.57, 5.12, 5.98, 7.20, 8.42, 9.64, 10.86],
      6: [4.77, 5.43, 6.48, 8.00, 9.52, 11.04, 12.56],
      7: [5.02, 5.82, 7.10, 8.92, 10.74, 12.56, 14.38],
      8: [5.30, 6.25, 7.78, 9.92, 12.06, 14.20, 16.34],
    },
    weightBreaks: [1, 2, 3, 5, 10, 20, 70], // oz
  },
  mediaMail: {
    label: 'Media Mail (Books/Educational)',
    booksOnly: true,
    maxWeight: 70,
    basePrice: 2.96,
    incrementalPrice: 0.53, // per lb after 1 lb
  },
  flatRateSmall: {
    label: 'Small Flat Rate Box',
    maxWeight: Infinity,
    fixedPrice: 7.65,
  },
  flatRateMedium: {
    label: 'Medium Flat Rate Box',
    maxWeight: Infinity,
    fixedPrice: 14.75,
  },
  flatRateLarge: {
    label: 'Large Flat Rate Box',
    maxWeight: Infinity,
    fixedPrice: 20.85,
  },
};

export const FLAT_RATE_OPTIONS = [
  { name: 'Small Flat Rate Box', maxDim: { l: 11, w: 8.5, h: 5.5 }, price: 7.65 },
  { name: 'Medium Flat Rate Box', maxDim: { l: 11, w: 8.5, h: 5.5 }, price: 14.75 },
  { name: 'Large Flat Rate Box', maxDim: { l: 12, w: 12, h: 8 }, price: 20.85 },
];

// ── SHIPPING RATE ESTIMATION ────────────────────────────────────────────────

/**
 * Estimate shipping rate for an item based on weight and value.
 * Returns { carrier, service, estimatedCost, range }.
 */
export function estimateShippingRate(item) {
  if (!item) return null;

  const weight = parseFloat(item.weight) || 0;
  const dimUnit = item.dimUnit || 'oz';
  const isMetric = dimUnit === 'g' || dimUnit === 'kg';
  const weightOz = isMetric ? (weight * 0.035274) : weight;

  // First Class: cheap for light items under 13oz
  if (weightOz > 0 && weightOz <= 13) {
    const cost = USPS_RATES.firstClass.basePrice + (Math.max(0, weightOz - 1) * USPS_RATES.firstClass.incrementalPrice);
    return {
      carrier: 'USPS',
      service: 'First Class Mail',
      estimatedCost: Math.round(cost * 100) / 100,
      range: `${weightOz}oz`,
    };
  }

  // Priority Mail: default for medium items
  if (weightOz > 0) {
    const zone = 5; // default mid-zone
    const breaks = USPS_RATES.priorityMail.weightBreaks;
    let breakIdx = breaks.findIndex(b => weightOz <= b);
    if (breakIdx === -1) breakIdx = breaks.length - 1;

    const zoneRates = USPS_RATES.priorityMail.zones[zone];
    const cost = zoneRates[breakIdx];

    return {
      carrier: 'USPS',
      service: 'Priority Mail',
      estimatedCost: cost,
      range: `${weightOz.toFixed(1)}oz`,
    };
  }

  return {
    carrier: 'USPS',
    service: 'First Class Mail',
    estimatedCost: 1.01,
    range: 'light',
  };
}

// ── PACKAGE SUGGESTION ──────────────────────────────────────────────────────

/**
 * Suggest best package type based on item dimensions.
 * Returns { name, type, dimensions, estimatedCost, carrier }.
 */
export function suggestPackage(item) {
  if (!item) return null;

  const dimL = parseFloat(item.dimL) || 0;
  const dimW = parseFloat(item.dimW) || 0;
  const dimH = parseFloat(item.dimH) || 0;
  const weight = parseFloat(item.weight) || 0;
  const dimUnit = item.dimUnit || 'in';

  // Calculate volume (rough cubic inches)
  const volume = dimL * dimW * dimH;

  // If fits in small flat rate box (11 x 8.5 x 5.5)
  if (dimL <= 11 && dimW <= 8.5 && dimH <= 5.5) {
    return {
      name: 'Small Flat Rate',
      type: 'USPS Flat Rate',
      dimensions: `${dimL}" x ${dimW}" x ${dimH}"`,
      estimatedCost: 7.65,
      carrier: 'USPS',
    };
  }

  // If fits in medium flat rate box (11 x 8.5 x 5.5, same outer dims, larger inner)
  if (dimL <= 11 && dimW <= 8.5 && dimH <= 5.5) {
    return {
      name: 'Medium Flat Rate',
      type: 'USPS Flat Rate',
      dimensions: `${dimL}" x ${dimW}" x ${dimH}"`,
      estimatedCost: 14.75,
      carrier: 'USPS',
    };
  }

  // If fits in large flat rate box (12 x 12 x 8)
  if (dimL <= 12 && dimW <= 12 && dimH <= 8) {
    return {
      name: 'Large Flat Rate',
      type: 'USPS Flat Rate',
      dimensions: `${dimL}" x ${dimW}" x ${dimH}"`,
      estimatedCost: 20.85,
      carrier: 'USPS',
    };
  }

  // Default to Priority Mail with standard box
  const estimate = estimateShippingRate(item);
  return {
    name: 'Priority Mail Box',
    type: 'Priority Mail',
    dimensions: `${dimL}" x ${dimW}" x ${dimH}"`,
    estimatedCost: estimate ? estimate.estimatedCost : 7.50,
    carrier: 'USPS',
  };
}

// ── CARRIER OPTIONS ────────────────────────────────────────────────────────

/**
 * Get available carrier/service options based on item characteristics.
 * Returns array of { carrier, service, estimatedCost, notes }.
 */
export function getCarrierOptions(item) {
  if (!item) return [];

  const weight = parseFloat(item.weight) || 0;
  const price = parseFloat(item.price) || 0;
  const dimUnit = item.dimUnit || 'oz';
  const isMetric = dimUnit === 'g' || dimUnit === 'kg';
  const weightOz = isMetric ? (weight * 0.035274) : weight;

  const options = [];

  // First Class: < 13oz, no sig req
  if (weightOz > 0 && weightOz <= 13) {
    const cost = USPS_RATES.firstClass.basePrice + (Math.max(0, weightOz - 1) * USPS_RATES.firstClass.incrementalPrice);
    options.push({
      carrier: 'USPS',
      service: 'First Class Mail',
      estimatedCost: Math.round(cost * 100) / 100,
      notes: 'Fast & cheap for light items',
    });
  }

  // Priority Mail: good middle ground
  if (weightOz > 0) {
    const zone = 5;
    const breaks = USPS_RATES.priorityMail.weightBreaks;
    let breakIdx = breaks.findIndex(b => weightOz <= b);
    if (breakIdx === -1) breakIdx = breaks.length - 1;
    const cost = USPS_RATES.priorityMail.zones[zone][breakIdx];

    options.push({
      carrier: 'USPS',
      service: 'Priority Mail',
      estimatedCost: cost,
      notes: '2-3 day delivery',
    });
  }

  // Media Mail: for books/DVDs (cheapest option)
  if (item.category && (item.category.toLowerCase().includes('book') || item.category.toLowerCase().includes('dvd'))) {
    options.push({
      carrier: 'USPS',
      service: 'Media Mail',
      estimatedCost: 2.96,
      notes: 'Cheapest for media',
    });
  }

  // Flat Rate options (price is fixed regardless of weight)
  const pkg = suggestPackage(item);
  if (pkg && pkg.type === 'USPS Flat Rate') {
    options.push({
      carrier: 'USPS',
      service: pkg.name,
      estimatedCost: pkg.estimatedCost,
      notes: 'Fixed price, any weight up to limit',
    });
  }

  // UPS Ground: for heavier items
  if (weightOz > 16) {
    const estimatedCost = 12.50 + (Math.max(0, (weightOz / 16) - 1) * 2.50);
    options.push({
      carrier: 'UPS',
      service: 'Ground',
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      notes: 'Good for heavy packages',
    });
  }

  // FedEx Ground: alternative carrier
  if (weightOz > 8) {
    const estimatedCost = 11.75 + (Math.max(0, (weightOz / 16) - 1) * 2.25);
    options.push({
      carrier: 'FedEx',
      service: 'Ground',
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      notes: 'Alternative carrier option',
    });
  }

  return options;
}

// ── WEIGHT CONVERSION HELPERS ──────────────────────────────────────────────

export function convertWeight(value, fromUnit, toUnit) {
  if (!value || fromUnit === toUnit) return value;

  const toGrams = {
    'oz': v => v * 28.3495,
    'lb': v => v * 453.592,
    'g': v => v,
    'kg': v => v * 1000,
  };

  const fromGrams = {
    'oz': v => v / 28.3495,
    'lb': v => v / 453.592,
    'g': v => v,
    'kg': v => v / 1000,
  };

  if (!toGrams[fromUnit] || !fromGrams[toUnit]) return value;
  const grams = toGrams[fromUnit](value);
  return Math.round(fromGrams[toUnit](grams) * 100) / 100;
}

// ── DIMENSION HELPERS ──────────────────────────────────────────────────────

export function convertDimension(value, fromUnit, toUnit) {
  if (!value || fromUnit === toUnit) return value;

  // Support: in (inches), cm (centimeters), mm (millimeters)
  const toMm = {
    'in': v => v * 25.4,
    'cm': v => v * 10,
    'mm': v => v,
  };

  const fromMm = {
    'in': v => v / 25.4,
    'cm': v => v / 10,
    'mm': v => v,
  };

  if (!toMm[fromUnit] || !fromMm[toUnit]) return value;
  const mm = toMm[fromUnit](value);
  return Math.round(fromMm[toUnit](mm) * 100) / 100;
}

/**
 * Calculate dimensional weight (DIM weight used by carriers for oversized items).
 * DIM weight = (L × W × H) / divisor
 * USPS/UPS/FedEx standard divisor = 166
 */
export function calculateDimWeight(length, width, height, unit = 'in') {
  if (!length || !width || !height) return 0;
  const divisor = 166;
  const volume = length * width * height;
  const dimWeight = volume / divisor;
  return Math.round(dimWeight * 100) / 100;
}

/**
 * Get billable weight = max(actual weight, dimensional weight)
 */
export function getBillableWeight(actualWeight, dimWeight) {
  return Math.max(actualWeight || 0, dimWeight || 0);
}
