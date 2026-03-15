/**
 * voice-add.js — Voice-Powered Batch Adding
 * Hands-free item entry via Web Speech API during sourcing.
 * Parses item names, prices, conditions, and categories from speech.
 */

import { toast, trapFocus, releaseFocus } from '../utils/dom.js';
import { escHtml } from '../utils/format.js';

let _recognition = null;
let _isListening = false;
let _pendingItems = [];

const PRICE_PATTERNS = [
  /\$(\d+(?:\.\d{1,2})?)/,                           // $20, $20.99
  /(\d+) dollars?(?: and (\d+) cents?)?/i,            // 20 dollars and 50 cents
  /(\d+) bucks?/i,                                     // 20 bucks
  /(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\s*(dollars?|bucks?)?/i,
];

const WORD_TO_NUM = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'fifteen': 15, 'twenty': 20,
  'twenty-five': 25, 'thirty': 30, 'forty': 40, 'fifty': 50,
  'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
  'hundred': 100,
};

const CONDITION_KEYWORDS = {
  'new': 'New', 'brand new': 'New', 'new with tags': 'NWT', 'nwt': 'NWT',
  'like new': 'Like New', 'excellent': 'EUC', 'good': 'Good',
  'fair': 'Fair', 'poor': 'Poor',
};

/**
 * Parse a speech transcript into item data.
 * @param {string} transcript
 * @returns {{ name: string, price: number|null, condition: string|null }}
 */
export function _parseSpeech(transcript) {
  let text = transcript.trim();
  let price = null;
  let condition = null;

  // Extract price
  for (const pat of PRICE_PATTERNS) {
    const m = text.match(pat);
    if (m) {
      if (m[1] && !isNaN(parseFloat(m[1]))) {
        price = parseFloat(m[1]);
        if (m[2] && !isNaN(parseInt(m[2]))) price += parseInt(m[2]) / 100;
      } else if (WORD_TO_NUM[m[1]?.toLowerCase()]) {
        price = WORD_TO_NUM[m[1].toLowerCase()];
      }
      text = text.replace(m[0], '').trim();
      break;
    }
  }

  // Extract condition
  for (const [kw, cond] of Object.entries(CONDITION_KEYWORDS)) {
    const re = new RegExp(`\\b${kw}\\b`, 'i');
    if (re.test(text)) {
      condition = cond;
      text = text.replace(re, '').trim();
      break;
    }
  }

  // Clean up name
  const name = text.replace(/\s+/g, ' ').replace(/^[\s,.-]+|[\s,.-]+$/g, '').trim();

  return { name, price, condition };
}

/**
 * Open voice add overlay.
 */
export function openVoiceAdd() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    toast('Voice input not supported in this browser', true);
    return;
  }

  _pendingItems = [];
  const ov = document.getElementById('voiceOv');
  if (!ov) return;
  ov.classList.add('on');
  trapFocus('#voiceOv');
  _renderVoiceUI();
  _startListening();
}

/**
 * Close voice add overlay.
 */
export function closeVoiceAdd() {
  _stopListening();
  releaseFocus();
  const ov = document.getElementById('voiceOv');
  if (ov) ov.classList.remove('on');
  _pendingItems = [];
}

function _startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  _recognition = new SpeechRecognition();
  _recognition.continuous = true;
  _recognition.interimResults = true;
  _recognition.lang = 'en-US';

  _recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        const transcript = event.results[i][0].transcript;
        const parsed = _parseSpeech(transcript);
        if (parsed.name) {
          _pendingItems.push({ ...parsed, transcript });
          _renderVoiceUI();
        }
      }
    }
    // Show interim text
    const interim = Array.from(event.results)
      .filter((r, idx) => idx >= event.resultIndex && !r.isFinal)
      .map(r => r[0].transcript)
      .join('');
    const el = document.getElementById('voiceInterim');
    if (el) el.textContent = interim;
  };

  _recognition.onerror = (event) => {
    if (event.error !== 'no-speech') {
      console.warn('Voice recognition error:', event.error);
    }
  };

  _recognition.onend = () => {
    // Auto-restart for continuous listening
    if (_isListening) {
      try { _recognition.start(); } catch {}
    }
  };

  try {
    _recognition.start();
    _isListening = true;
  } catch (e) {
    toast('Failed to start voice recognition', true);
  }
}

function _stopListening() {
  _isListening = false;
  if (_recognition) {
    try { _recognition.stop(); } catch {}
    _recognition = null;
  }
}

function _renderVoiceUI() {
  const list = document.getElementById('voiceItemList');
  if (!list) return;

  if (!_pendingItems.length) {
    list.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:20px">Speak item names with prices to add them…</div>';
    return;
  }

  list.innerHTML = _pendingItems.map((item, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:8px;border-bottom:1px solid var(--border)">
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500">${escHtml(item.name)}</div>
        <div style="font-size:10px;color:var(--muted)">${item.price ? '$' + item.price.toFixed(2) : 'No price'} ${item.condition ? '· ' + item.condition : ''}</div>
      </div>
      <button class="btn-secondary" style="font-size:10px;padding:3px 6px" onclick="voiceRemoveItem(${i})">✕</button>
    </div>
  `).join('');
}

/**
 * Remove a pending item.
 */
export function voiceRemoveItem(index) {
  _pendingItems.splice(index, 1);
  _renderVoiceUI();
}

/**
 * Add all pending items to inventory via the Add Item form.
 */
export function voiceAddAll() {
  if (!_pendingItems.length) { toast('No items to add', true); return; }

  // Transfer the first item to the add form
  const item = _pendingItems[0];
  closeVoiceAdd();

  if (window.openAddModal) window.openAddModal();

  setTimeout(() => {
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    set('f_name', item.name);
    if (item.price) set('f_price', item.price);
    if (item.condition) {
      set('f_condition', item.condition);
      const picker = document.getElementById('f_cond_picker');
      if (picker) {
        picker.querySelectorAll('.cond-chip').forEach(chip => {
          chip.classList.toggle('sel', chip.textContent.trim() === item.condition);
        });
      }
    }
    if (window.prevProfit) window.prevProfit();
    toast(`Pre-filled from voice: "${item.name}"${_pendingItems.length > 1 ? ` (+${_pendingItems.length - 1} more queued)` : ''}`);
  }, 200);
}
