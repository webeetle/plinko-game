// audio.js — synthesized arcade SFX via WebAudio. window.PlinkoAudio
(function () {
  let ctx = null;
  let master = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // basic oscillator blip
  function blip(freq, dur, type, vol, when) {
    if (muted) return;
    ensure();
    const t0 = (when || 0) + ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  // little noise burst (for thuds / sparkle)
  function noise(dur, vol, hp, when) {
    if (muted) return;
    ensure();
    const t0 = (when || 0) + ctx.currentTime;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp || 800;
    const g = ctx.createGain();
    g.gain.value = vol || 0.2;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0);
  }

  let lastPeg = 0;
  const PlinkoAudio = {
    setMuted(m) { muted = !!m; },
    isMuted() { return muted; },
    unlock() { ensure(); },

    peg() {
      // throttle so dense collisions don't machine-gun
      const now = performance.now();
      if (now - lastPeg < 28) return;
      lastPeg = now;
      const f = 520 + Math.random() * 620;
      blip(f, 0.07, 'triangle', 0.18);
    },
    wall() { blip(160 + Math.random() * 40, 0.09, 'sine', 0.16); },
    select() { blip(660, 0.06, 'square', 0.14); blip(990, 0.08, 'square', 0.12, 0.05); },

    drop() {
      blip(880, 0.06, 'square', 0.16);
      blip(1180, 0.08, 'square', 0.14, 0.06);
    },

    land() { blip(300, 0.12, 'sine', 0.25); noise(0.15, 0.12, 600); },

    // tiered win cues
    winNormal() {
      const seq = [523, 659, 784];
      seq.forEach((f, i) => blip(f, 0.18, 'triangle', 0.26, i * 0.09));
    },
    winRare() {
      const seq = [523, 659, 784, 1047];
      seq.forEach((f, i) => blip(f, 0.22, 'triangle', 0.28, i * 0.08));
      noise(0.4, 0.1, 1200, 0.1);
    },
    jackpot() {
      // rising arpeggio + sparkle + brass-ish stab
      const seq = [392, 523, 659, 784, 1047, 1319, 1568];
      seq.forEach((f, i) => {
        blip(f, 0.16, 'square', 0.22, i * 0.07);
        blip(f * 2, 0.16, 'triangle', 0.1, i * 0.07);
      });
      // sustained chord at the top
      [784, 988, 1175].forEach((f) => blip(f, 0.9, 'sawtooth', 0.12, 0.5));
      noise(0.8, 0.14, 2000, 0.45);
    },
  };

  window.PlinkoAudio = PlinkoAudio;
})();
