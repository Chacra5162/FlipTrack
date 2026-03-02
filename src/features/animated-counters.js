/**
 * animated-counters.js — Animated stat counter effect
 * Numbers count up from 0 on dashboard load for visual polish.
 * Uses requestAnimationFrame for smooth 60fps animation.
 */

const DURATION = 800; // ms

/**
 * Animate a DOM element's text from 0 to the target value.
 * Supports dollar amounts ($1,234.56), percentages (45.2%), and plain numbers.
 */
function animateValue(el, targetText) {
  if (!el || !targetText) return;

  // Parse target value
  const isDollar = targetText.startsWith('$');
  const isPct = targetText.endsWith('%');
  const isDash = targetText === '—' || targetText === '—%';
  if (isDash) return; // Don't animate dashes

  const cleaned = targetText.replace(/[$,%]/g, '').replace(/,/g, '');
  const target = parseFloat(cleaned);
  if (isNaN(target) || target === 0) return;

  const isNegative = target < 0;
  const absTarget = Math.abs(target);
  const hasDecimals = targetText.includes('.') && !targetText.endsWith('d');

  const start = performance.now();

  function frame(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / DURATION, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);

    let current = absTarget * eased;

    // Format like original
    let formatted;
    if (hasDecimals) {
      const decimals = (targetText.split('.')[1] || '').replace(/[^0-9]/g, '').length;
      formatted = current.toFixed(decimals);
    } else {
      formatted = Math.round(current).toString();
    }

    // Add commas
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    formatted = parts.join('.');

    // Add prefix/suffix
    if (isDollar) formatted = '$' + formatted;
    if (isNegative) formatted = '-' + formatted;
    if (isPct) formatted += '%';

    // Append 'd' suffix for "days" values like "15d"
    if (targetText.endsWith('d') && !isPct) formatted += 'd';

    el.textContent = formatted;

    if (progress < 1) requestAnimationFrame(frame);
    else el.textContent = targetText; // Exact final value
  }

  el.textContent = isDollar ? '$0' : isPct ? '0%' : '0';
  requestAnimationFrame(frame);
}

/**
 * Animate all stat card values on the dashboard.
 * Call after updateStats() populates the values.
 */
export function animateStatCounters() {
  const ids = ['sInvVal', 'sRev', 'sProfit', 'sROI', 'sLow', 'sAvgDays'];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    const target = el.textContent;
    if (target && target !== '$0' && target !== '0' && target !== '—') {
      animateValue(el, target);
    }
  }
}
