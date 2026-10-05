let ctx = null;

/** Brauzer ovozni faqat foydalanuvchi bosgandan keyin ruxsat beradi */
export function unlockSound() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  } catch {
    return false;
  }
}

export function isSoundReady() {
  return Boolean(ctx && ctx.state === 'running');
}

/** Yangi buyurtma signali (uch notali "ding-ding-ding") */
export function playSignal(times = 1) {
  if (!ctx) return;
  for (let r = 0; r < times; r += 1) {
    [0, 0.18, 0.36].forEach((delay, i) => {
      const at = ctx.currentTime + r * 0.8 + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = [784, 988, 1175][i];
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.35, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.35);
    });
  }
}
