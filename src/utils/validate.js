/**
 * validate.js - Input validation for numeric and form fields
 * Validates on blur, prevents NaN/garbage data in the store.
 */

/**
 * Parse and validate a numeric input value. Returns the number or NaN.
 * @param {string|number} val
 * @param {Object} opts - { min, max, allowZero, integer }
 */
export function parseNum(val, opts = {}) {
  const { min = 0, max = Infinity, allowZero = true, integer = false } = opts;
  if (val === '' || val === null || val === undefined) return NaN;
  const n = integer ? parseInt(val, 10) : parseFloat(val);
  if (isNaN(n)) return NaN;
  if (!allowZero && n === 0) return NaN;
  if (n < min || n > max) return NaN;
  return Math.round(n * 100) / 100; // round to cents for currency
}

/**
 * Validate a numeric input element on blur.
 * Shows inline error styling and returns the validated number or null.
 * @param {HTMLInputElement} el
 * @param {Object} opts - { min, max, allowZero, integer, fieldName }
 */
export function validateNumericInput(el, opts = {}) {
  const val = parseNum(el.value, opts);
  if (isNaN(val)) {
    el.classList.add('input-error');
    el.setAttribute('aria-invalid', 'true');
    // Show inline hint
    let hint = el.parentElement.querySelector('.validation-hint');
    if (!hint) {
      hint = document.createElement('span');
      hint.className = 'validation-hint';
      hint.setAttribute('role', 'alert');
      el.parentElement.appendChild(hint);
    }
    const name = opts.fieldName || 'Value';
    if (el.value.trim() === '') hint.textContent = `${name} is required`;
    else if (opts.integer) hint.textContent = `${name} must be a whole number`;
    else hint.textContent = `${name} must be a valid number`;
    return null;
  }
  el.classList.remove('input-error');
  el.removeAttribute('aria-invalid');
  const hint = el.parentElement.querySelector('.validation-hint');
  if (hint) hint.remove();
  return val;
}

/**
 * Clear validation error from an input on focus.
 */
export function clearValidation(el) {
  el.classList.remove('input-error');
  el.removeAttribute('aria-invalid');
  const hint = el.parentElement?.querySelector('.validation-hint');
  if (hint) hint.remove();
}

/**
 * Attach blur/focus validation to a numeric input element.
 * @param {string} selector - CSS selector for the input(s)
 * @param {Object} opts - validation options
 */
export function attachNumericValidation(selector, opts = {}) {
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener('blur', () => validateNumericInput(el, opts));
    el.addEventListener('focus', () => clearValidation(el));
  });
}

/**
 * Validate all numeric fields in a form-like context.
 * Returns true if all valid, false if any invalid.
 * @param {Array<{el: HTMLInputElement, opts: Object}>} fields
 */
export function validateAllNumeric(fields) {
  let allValid = true;
  for (const { el, opts } of fields) {
    if (!el) continue;
    const val = validateNumericInput(el, opts);
    if (val === null && el.value.trim() !== '') allValid = false;
  }
  return allValid;
}
