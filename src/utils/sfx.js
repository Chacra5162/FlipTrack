// Sound effects system using Web Audio API
export const sfx = (() => {
  let ctx = null;

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, type, vol, start, dur, fadeStart, fadeEnd) {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime + start);
    g.gain.linearRampToValueAtTime(0, c.currentTime + start + dur);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.01);
  }

  return {
    // Create item — bright ascending two-note chime
    create() {
      tone(523.25, 'sine', 0.18, 0,    0.10);  // C5
      tone(783.99, 'sine', 0.18, 0.10, 0.14);  // G5
      if (navigator.vibrate) navigator.vibrate([30, 40, 60]);  // two taps, second stronger
    },
    // Edit/save — soft single confirm click
    edit() {
      tone(440,    'sine', 0.14, 0,    0.08);  // A4
      tone(554.37, 'sine', 0.12, 0.07, 0.10);  // C#5
      if (navigator.vibrate) navigator.vibrate(25);  // single soft tap
    },
    // Sale — satisfying cash-register style ascending run
    sale() {
      tone(523.25, 'triangle', 0.15, 0,    0.07);  // C5
      tone(659.25, 'triangle', 0.15, 0.07, 0.07);  // E5
      tone(783.99, 'triangle', 0.16, 0.14, 0.07);  // G5
      tone(1046.5, 'triangle', 0.18, 0.21, 0.14);  // C6
      if (navigator.vibrate) navigator.vibrate([20, 30, 20, 30, 80]);  // quick rolls then a solid buzz
    },
    // Expense — low dull thud (money leaving)
    expense() {
      tone(220,  'sine',   0.20, 0,    0.06);  // A3
      tone(174.61,'sine',  0.16, 0.05, 0.12);  // F3
      if (navigator.vibrate) navigator.vibrate([60, 20, 30]);  // heavy-then-light, money going out
    },
  };
})();

export const _sfx = sfx;
