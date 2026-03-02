/**
 * onboarding-tour.js — Guided tour for first-time users
 * 5-step walkthrough that adapts to viewport size.
 * Steps with hidden targets are automatically skipped.
 */

const TOUR_STEPS = [
  {
    target: '.stats-grid',
    title: 'Your Command Center',
    desc: 'Track inventory value, revenue, profit, and ROI at a glance. Cards update in real-time as you add items and record sales.',
    position: 'bottom',
  },
  {
    // Desktop: header add button, Mobile: FAB
    target: '#headerAddBtn',
    mobileTarget: '.bnav-fab',
    title: 'Add Your First Item',
    desc: 'Tap here to add inventory. Use the camera to auto-identify items, scan barcodes, or enter details manually.',
    position: 'bottom-left',
    mobilePosition: 'top',
  },
  {
    target: '#headerIdBtn',
    title: 'AI-Powered Identification',
    desc: 'Snap a photo and FlipTrack identifies the item, suggests pricing, and finds comparable listings across platforms.',
    position: 'bottom-left',
    // Skip entirely on mobile — button doesn't exist there
    desktopOnly: true,
  },
  {
    target: '#profitHeatmap',
    fallbackTarget: '.kpi-goals-wrap, #kpiGoalsSection',
    title: 'Track Your Progress',
    desc: 'Set monthly goals and view your profit heatmap. Green = profit days, red = loss days. Spot trends at a glance.',
    position: 'top',
  },
  {
    target: '#csvExportSection',
    title: 'Export Everywhere',
    desc: 'One-click CSV exports formatted for eBay, Poshmark, Mercari, and Depop. Plus full inventory and tax reports.',
    position: 'top',
  },
];

let _currentStep = -1;
let _overlayEl = null;
let _activeSteps = []; // filtered steps for current viewport

function isElementVisible(el) {
  if (!el) return false;
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function isMobile() {
  return window.innerWidth <= 820;
}

function resolveTarget(step) {
  // On mobile, try mobileTarget first
  if (isMobile() && step.mobileTarget) {
    const el = document.querySelector(step.mobileTarget);
    if (isElementVisible(el)) return { el, position: step.mobilePosition || step.position };
  }
  // Try primary target
  const el = document.querySelector(step.target);
  if (isElementVisible(el)) return { el, position: step.position };
  // Try fallback
  if (step.fallbackTarget) {
    const selectors = step.fallbackTarget.split(',').map(s => s.trim());
    for (const sel of selectors) {
      const fb = document.querySelector(sel);
      if (isElementVisible(fb)) return { el: fb, position: step.position };
    }
  }
  return null;
}

function buildActiveSteps() {
  _activeSteps = [];
  for (const step of TOUR_STEPS) {
    // Skip desktop-only steps on mobile
    if (step.desktopOnly && isMobile()) continue;
    const resolved = resolveTarget(step);
    if (resolved) {
      _activeSteps.push({ ...step, _resolved: resolved });
    }
  }
}

function createOverlay() {
  if (_overlayEl) return;
  const div = document.createElement('div');
  div.id = 'tourOverlay';
  div.innerHTML = `
    <div class="tour-backdrop" id="tourBackdrop"></div>
    <div class="tour-spotlight" id="tourSpotlight"></div>
    <div class="tour-tooltip" id="tourTooltip">
      <div class="tour-tooltip-arrow" id="tourArrow"></div>
      <div class="tour-step-badge" id="tourBadge"></div>
      <div class="tour-title" id="tourTitle"></div>
      <div class="tour-desc" id="tourDesc"></div>
      <div class="tour-actions">
        <button class="tour-skip" id="tourSkip">Skip Tour</button>
        <div style="flex:1"></div>
        <button class="tour-prev" id="tourPrev">← Back</button>
        <button class="tour-next" id="tourNext">Next →</button>
      </div>
      <div class="tour-dots" id="tourDots"></div>
    </div>
  `;
  document.body.appendChild(div);
  _overlayEl = div;

  document.getElementById('tourSkip').addEventListener('click', endTour);
  document.getElementById('tourPrev').addEventListener('click', () => goToStep(_currentStep - 1));
  document.getElementById('tourNext').addEventListener('click', () => {
    if (_currentStep >= _activeSteps.length - 1) endTour();
    else goToStep(_currentStep + 1);
  });
  document.getElementById('tourBackdrop').addEventListener('click', endTour);
}

function goToStep(idx) {
  if (idx < 0 || idx >= _activeSteps.length) return;
  _currentStep = idx;
  const step = _activeSteps[idx];

  // Re-resolve target in case layout shifted
  const resolved = resolveTarget(step) || step._resolved;
  const targetEl = resolved?.el;
  const position = resolved?.position || step.position;

  const spotlight = document.getElementById('tourSpotlight');
  const tooltip = document.getElementById('tourTooltip');

  if (targetEl) {
    // Scroll target into view
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    setTimeout(() => {
      const rect = targetEl.getBoundingClientRect();
      const pad = 8;

      // Spotlight: use fixed positioning (matches the fixed overlay)
      spotlight.style.cssText = `
        position: fixed;
        top: ${rect.top - pad}px;
        left: ${rect.left - pad}px;
        width: ${rect.width + pad * 2}px;
        height: ${rect.height + pad * 2}px;
        display: block;
      `;

      // Tooltip: also fixed positioning
      const ttW = Math.min(320, window.innerWidth - 32);
      let ttTop, ttLeft;

      if (position === 'bottom' || position === 'bottom-left') {
        ttTop = rect.bottom + 16;
        ttLeft = position === 'bottom-left'
          ? Math.max(16, rect.right - ttW)
          : Math.max(16, rect.left + rect.width / 2 - ttW / 2);
      } else {
        // 'top' — place above
        ttTop = rect.top - 16;
        ttLeft = Math.max(16, rect.left + rect.width / 2 - ttW / 2);
      }

      // Keep tooltip in viewport
      ttLeft = Math.min(ttLeft, window.innerWidth - ttW - 16);
      ttTop = Math.max(16, ttTop);

      // If tooltip would go off bottom, flip to top
      if (position !== 'top' && ttTop + 180 > window.innerHeight) {
        ttTop = rect.top - 180;
      }
      // If position is 'top', place above the element and transform up
      if (position === 'top') {
        tooltip.style.cssText = `position:fixed;bottom:${window.innerHeight - rect.top + 16}px;left:${ttLeft}px;display:block;width:${ttW}px;`;
      } else {
        tooltip.style.cssText = `position:fixed;top:${ttTop}px;left:${ttLeft}px;display:block;width:${ttW}px;`;
      }
    }, 350);
  } else {
    // Target not found — hide spotlight, show tooltip centered
    spotlight.style.display = 'none';
    const ttW = Math.min(320, window.innerWidth - 32);
    tooltip.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);display:block;width:${ttW}px;`;
  }

  document.getElementById('tourTitle').textContent = step.title;
  document.getElementById('tourDesc').textContent = step.desc;
  document.getElementById('tourBadge').textContent = `${idx + 1} of ${_activeSteps.length}`;
  document.getElementById('tourPrev').style.display = idx === 0 ? 'none' : '';
  document.getElementById('tourNext').textContent = idx >= _activeSteps.length - 1 ? 'Done ✓' : 'Next →';

  // Dots
  document.getElementById('tourDots').innerHTML = _activeSteps.map((_, i) =>
    `<span class="tour-dot${i === idx ? ' active' : ''}"></span>`
  ).join('');
}

export function startTour() {
  buildActiveSteps();
  if (_activeSteps.length === 0) return;
  createOverlay();
  _overlayEl.style.display = '';
  _overlayEl.classList.add('on');
  goToStep(0);
  localStorage.setItem('ft_toured', '1');
}

export function endTour() {
  if (_overlayEl) {
    _overlayEl.classList.remove('on');
    _overlayEl.style.display = 'none';
    // Reset spotlight and tooltip
    const spotlight = document.getElementById('tourSpotlight');
    const tooltip = document.getElementById('tourTooltip');
    if (spotlight) spotlight.style.display = 'none';
    if (tooltip) tooltip.style.display = 'none';
  }
  _currentStep = -1;
  localStorage.setItem('ft_toured', '1');
}

/** Auto-start tour if user hasn't seen it */
export function maybeStartTour() {
  if (!localStorage.getItem('ft_toured') && !localStorage.getItem('ft_welcomed')) {
    // Wait for app to fully render
    setTimeout(() => startTour(), 1500);
  }
}
