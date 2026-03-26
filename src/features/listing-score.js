/**
 * listing-score.js — Listing Quality Score
 * Grades each listing based on title length, photo count, description
 * completeness, keyword density, and pricing. Suggests improvements.
 */

import { inv, getInvItem, getSalesForItem } from '../data/store.js';
import { fmt, escHtml, escAttr } from '../utils/format.js';

// ── SCORING CRITERIA ──────────────────────────────────────────────────────

const CRITERIA = [
  { key: 'title',       label: 'Title',       weight: 25, icon: '📝' },
  { key: 'photos',      label: 'Photos',      weight: 25, icon: '📸' },
  { key: 'description', label: 'Description', weight: 20, icon: '📋' },
  { key: 'pricing',     label: 'Pricing',     weight: 15, icon: '💰' },
  { key: 'metadata',    label: 'Metadata',    weight: 15, icon: '🏷️' },
];

/**
 * Score a single item. Returns { total, breakdown[], suggestions[] }
 */
export function scoreItem(item) {
  if (!item) return { total: 0, grade: 'F', breakdown: [], suggestions: [] };

  const breakdown = [];
  const suggestions = [];

  // 1. Title (25 pts)
  const name = (item.name || '').trim();
  let titleScore = 0;
  if (name.length >= 40) titleScore = 25;
  else if (name.length >= 25) titleScore = 20;
  else if (name.length >= 15) titleScore = 14;
  else if (name.length >= 5) titleScore = 8;
  else titleScore = 0;

  // Check for keywords resellers care about
  const hasColor = /\b(black|white|red|blue|green|pink|gray|grey|brown|navy|beige|cream|gold|silver)\b/i.test(name);
  const hasBrand = !!item.brand;
  const hasSize = /\b(xs|s|m|l|xl|xxl|\d+x\d+|\d+"|small|medium|large)\b/i.test(name);
  const colorCats = ['Clothing', 'Shoes', 'Accessories', 'Home & Decor', 'Sports & Outdoors', 'Toys & Games', 'Arts & Crafts'];
  if (!hasColor && name.length < 60 && colorCats.includes(item.category)) suggestions.push('Add color to title for better search visibility');
  if (!hasBrand && !item.brand) suggestions.push('Include brand name in title');
  if (!hasSize && ['Clothing', 'Shoes', 'Accessories'].includes(item.category)) suggestions.push('Add size info to title');
  if (name.length < 25) suggestions.push('Title is short — aim for 40+ characters with descriptive keywords');

  breakdown.push({ ...CRITERIA[0], score: titleScore });

  // 2. Photos (25 pts)
  const photoCount = _countPhotos(item);
  let photoScore = 0;
  if (photoCount >= 5) photoScore = 25;
  else if (photoCount >= 3) photoScore = 18;
  else if (photoCount >= 1) photoScore = 10;
  else photoScore = 0;

  if (photoCount === 0) suggestions.push('Add at least one photo — listings with photos sell 5x faster');
  else if (photoCount < 3) suggestions.push(`Add more photos (${photoCount}/5 recommended) — show multiple angles`);
  breakdown.push({ ...CRITERIA[1], score: photoScore });

  // 3. Description (20 pts)
  const notes = (item.notes || '').trim();
  let descScore = 0;
  if (notes.length >= 100) descScore = 20;
  else if (notes.length >= 50) descScore = 14;
  else if (notes.length >= 20) descScore = 8;
  else if (notes.length > 0) descScore = 4;
  else descScore = 0;

  if (notes.length === 0) suggestions.push('Add a description — include condition details, measurements, and defects');
  else if (notes.length < 50) suggestions.push('Description is thin — add measurements, condition details, and key features');
  breakdown.push({ ...CRITERIA[2], score: descScore });

  // 4. Pricing (15 pts)
  let pricingScore = 0;
  if (item.price && item.price > 0) {
    pricingScore += 8;
    if (item.cost && item.cost > 0) {
      const margin = (item.price - item.cost) / item.price;
      if (margin >= 0.3) pricingScore += 7;
      else if (margin >= 0.15) pricingScore += 4;
      else pricingScore += 1;
      if (margin < 0.15) suggestions.push('Low margin — consider raising price or this item may not be worth listing');
    } else {
      suggestions.push('Add cost to track profitability');
    }
  } else {
    suggestions.push('Set a listing price');
  }
  breakdown.push({ ...CRITERIA[3], score: pricingScore });

  // 5. Metadata (15 pts)
  let metaScore = 0;
  if (item.category) metaScore += 4;
  else suggestions.push('Set a category for better organization');
  if (item.condition) metaScore += 3;
  else suggestions.push('Set condition — buyers filter by condition');
  if (item.brand) metaScore += 3;
  if (item.platforms || item.platform) metaScore += 3;
  else suggestions.push('Select listing platforms');
  if (item.upc || item.isbn) metaScore += 2;
  breakdown.push({ ...CRITERIA[4], score: metaScore });

  const total = breakdown.reduce((s, b) => s + b.score, 0);
  const grade = total >= 90 ? 'A' : total >= 75 ? 'B' : total >= 60 ? 'C' : total >= 40 ? 'D' : 'F';

  return { total, grade, breakdown, suggestions };
}

function _countPhotos(item) {
  let count = 0;
  if (item.image) count++;
  if (item.images && Array.isArray(item.images)) count += item.images.length;
  if (item.photo) count++;
  if (item.photos && Array.isArray(item.photos)) count += item.photos.length;
  return count;
}

// ── COMPUTE AGGREGATE SCORES ──────────────────────────────────────────────

export function computeListingScores() {
  const unsold = inv.filter(i => !i.deleted && (i.qty || 0) > 0);
  const scored = unsold.map(item => ({
    id: item.id,
    name: item.name || 'Unnamed',
    category: item.category || '',
    price: item.price || 0,
    ...scoreItem(item),
  }));

  scored.sort((a, b) => a.total - b.total); // worst first

  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((s, i) => s + i.total, 0) / scored.length)
    : 0;

  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const s of scored) gradeDistribution[s.grade]++;

  return { scored, avgScore, gradeDistribution, total: scored.length };
}

// ── RENDER ─────────────────────────────────────────────────────────────────

export function renderListingScores() {
  const el = document.getElementById('listingScoreContent');
  if (!el) return;

  const d = computeListingScores();

  if (!d.total) {
    el.innerHTML = '<div class="sa-empty">No active inventory to score.</div>';
    return;
  }

  // Overall grade
  const overallGrade = d.avgScore >= 90 ? 'A' : d.avgScore >= 75 ? 'B' : d.avgScore >= 60 ? 'C' : d.avgScore >= 40 ? 'D' : 'F';
  const gradeColors = { A: '#4caf50', B: '#8bc34a', C: '#ff9800', D: '#ff5722', F: '#f44336' };

  const summaryHtml = `
    <div class="ls-overview">
      <div class="ls-grade-circle" style="border-color:${gradeColors[overallGrade]}">
        <div class="ls-grade-letter" style="color:${gradeColors[overallGrade]}">${overallGrade}</div>
        <div class="ls-grade-score">${d.avgScore}/100</div>
      </div>
      <div class="ls-grade-dist">
        ${Object.entries(d.gradeDistribution).map(([g, count]) => `
          <div class="ls-dist-row">
            <span class="ls-dist-grade" style="color:${gradeColors[g]}">${g}</span>
            <div class="ls-dist-bar-wrap">
              <div class="ls-dist-bar" style="width:${d.total > 0 && count > 0 ? Math.max(4, (count / d.total) * 100) : 0}%;background:${gradeColors[g]}"></div>
            </div>
            <span class="ls-dist-count">${count}</span>
          </div>
        `).join('')}
      </div>
    </div>`;

  // Worst listings needing attention
  const worstHtml = `
    <div class="ih-section">
      <div class="ih-section-hdr">🔧 Needs Improvement (Lowest Scores)</div>
      <div class="comps-list" style="max-height:400px">
        ${d.scored.slice(0, 15).map(item => `
          <div class="comps-item" onclick="openDrawer('${escAttr(item.id)}')" style="cursor:pointer">
            <div class="ls-item-grade" style="background:${gradeColors[item.grade]}">${item.grade}</div>
            <div class="comps-item-info">
              <div class="comps-item-title">${escHtml(item.name)}</div>
              <div class="comps-item-meta">${item.total}/100 · ${escHtml(item.category)}${item.price ? ' · ' + fmt(item.price) : ''}</div>
              ${item.suggestions.length ? `<div class="ls-suggestion">💡 ${escHtml(item.suggestions[0])}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;

  // Common issues
  const issueCounts = {};
  for (const item of d.scored) {
    for (const s of item.suggestions) {
      issueCounts[s] = (issueCounts[s] || 0) + 1;
    }
  }
  const topIssues = Object.entries(issueCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  let issuesHtml = '';
  if (topIssues.length) {
    const maxIssue = topIssues[0][1];
    issuesHtml = `
      <div class="ih-section">
        <div class="ih-section-hdr">📊 Most Common Issues</div>
        ${topIssues.map(([issue, count]) => `
          <div class="sa-bar-row">
            <div class="sa-bar-name" style="flex:2">${escHtml(issue)}</div>
            <div class="sa-bar-wrap">
              <div class="sa-bar ih-ok" style="width:${Math.max(6, (count / maxIssue) * 100)}%"></div>
            </div>
            <div class="sa-bar-val">${count} items</div>
          </div>
        `).join('')}
      </div>`;
  }

  el.innerHTML = summaryHtml + worstHtml + issuesHtml;
}
