/**
 * onboarding-tour.js — Guided tour for first-time users
 * 5-step walkthrough: Dashboard → Add Item → Inventory → Insights → Export
 */

const TOUR_STEPS = [
  {
    target: '.stats-grid',
    title: 'Your Command Center',
    desc: 'Track inventory value, revenue, profit, and ROI at a glance. Cards update in real-time as you add items and record sales.',
    position: 'bottom',
  },
  {
    target: '#headerAddBtn',
    title: 'Add Your First Item',
    desc: 'Tap here to add inventory. Use the camera to auto-identify items, scan barcodes, or enter details manually.',
    position: 'bottom-left',
  },
  {
    target: '#headerIdBtn',
    title: 'AI-Powered Identification',
    desc: 'Snap a photo and FlipTrack identifies the item, suggests pricing, and finds comparable listings across platforms.',
    position: 'bottom-left',
  },
  {
    target: '#profitHeatmap',
    title: 'Profit Heatmap',
    desc: 'Visualize your daily profit and loss over the past year. Green = profit days, red = loss days. Spot trends at a glance.',
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
    if (_currentStep >= TOUR_STEPS.length - 1) endTour();
    else goToStep(_currentStep + 1);
  });
  document.getElementById('tourBackdrop').addEventListener('click', endTour);
}

function goToStep(idx) {
  if (idx < 0 || idx >= TOUR_STEPS.length) return;
  _currentStep = idx;
  const step = TOUR_STEPS[idx];

  const targetEl = document.querySelector(step.target);
  const spotlight = document.getElementById('tourSpotlight');
  const tooltip = document.getElementById('tourTooltip');

  if (targetEl) {
    // Scroll target into view
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      const rect = targetEl.getBoundingClientRect();
      const pad = 8;
      spotlight.style.cssText = `
        top: ${rect.top - pad + window.scrollY}px;
        left: ${rect.left - pad}px;
        width: ${rect.width + pad * 2}px;
        height: ${rect.height + pad * 2}px;
        display: block;
      `;

      // Position tooltip
      const ttW = 320;
      let ttTop, ttLeft;
      if (step.position === 'bottom' || step.position === 'bottom-left') {
        ttTop = rect.bottom + 16 + window.scrollY;
        ttLeft = step.position === 'bottom-left'
          ? Math.max(16, rect.right - ttW)
          : Math.max(16, rect.left + rect.width / 2 - ttW / 2);
      } else {
        ttTop = rect.top - 200 + window.scrollY;
        ttLeft = Math.max(16, rect.left + rect.width / 2 - ttW / 2);
      }
      ttLeft = Math.min(ttLeft, window.innerWidth - ttW - 16);
      tooltip.style.cssText = `top:${ttTop}px;left:${ttLeft}px;display:block;width:${ttW}px;`;
    }, 300);
  }

  document.getElementById('tourTitle').textContent = step.title;
  document.getElementById('tourDesc').textContent = step.desc;
  document.getElementById('tourBadge').textContent = `${idx + 1} of ${TOUR_STEPS.length}`;
  document.getElementById('tourPrev').style.display = idx === 0 ? 'none' : '';
  document.getElementById('tourNext').textContent = idx >= TOUR_STEPS.length - 1 ? 'Done ✓' : 'Next →';

  // Dots
  document.getElementById('tourDots').innerHTML = TOUR_STEPS.map((_, i) =>
    `<span class="tour-dot${i === idx ? ' active' : ''}"></span>`
  ).join('');
}

export function startTour() {
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
