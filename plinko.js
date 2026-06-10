// plinko.js — custom 2D physics + board rendering. window.PlinkoBoard
(function () {
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }

  const DEFAULTS = {
    accent: '#359652',
    accentBright: '#46cf72',
    gravityScale: 1,
    pegRows: 10,
    slots: 6,
  };

  class PlinkoBoard {
    constructor(canvas, opts) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.opt = Object.assign({}, DEFAULTS, opts || {});
      this.discs = [];
      this.onLandCb = null;
      this.running = false;
      this._raf = null;
      this._last = 0;
      this._acc = 0;
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.demoMode = false;
      this._demoTimer = 0;
      this.winningSlot = -1;
      this.layout();
    }

    setOnLand(cb) { this.onLandCb = cb; }
    setAccent(c) { this.opt.accent = c; this._deriveAccent(); }
    setGravityScale(s) { this.opt.gravityScale = s; }
    setPegRows(n) { this.opt.pegRows = Math.round(n); this.layout(); }

    _deriveAccent() {
      // build a brighter glow variant from accent
      const c = this.opt.accent;
      this.opt.accentBright = this._lighten(c, 0.35);
    }
    _lighten(hex, amt) {
      const m = /^#?([0-9a-f]{6})$/i.exec(hex);
      if (!m) return hex;
      const n = parseInt(m[1], 16);
      let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      r = Math.round(lerp(r, 255, amt));
      g = Math.round(lerp(g, 255, amt));
      b = Math.round(lerp(b, 255, amt));
      return `rgb(${r},${g},${b})`;
    }

    layout() {
      const W = 1080;
      const H = 1320;
      this.W = W; this.H = H;
      // hi-dpi backing store, CSS size fixed to logical
      this.canvas.width = Math.round(W * this.dpr);
      this.canvas.height = Math.round(H * this.dpr);
      this.canvas.style.width = W + 'px';
      this.canvas.style.height = H + 'px';

      this.wallL = 38;
      this.wallR = W - 38;
      this.playL = this.wallL;
      this.playR = this.wallR;
      this.playW = this.playR - this.playL;

      this.nSlots = this.opt.slots;
      this.slotW = this.playW / this.nSlots;

      this.slotFloor = H - 14;
      this.dividerTop = H - 232;
      this.funnelH = 132;
      this.pegBottom = this.dividerTop - this.funnelH;   // pegs run lower now
      this.pegTop = 168;

      this._buildPegs();
      this._deriveAccent();
    }

    _buildPegs() {
      const rows = clamp(this.opt.pegRows, 5, 14);
      const pegs = [];
      const top = this.pegTop;
      const bottom = this.pegBottom;
      const rowGap = (bottom - top) / (rows - 1);
      // horizontal peg spacing: align gaps with slot dividers (slotW/2)
      const hGap = this.slotW / 2;
      this.pegR = 9;
      for (let r = 0; r < rows; r++) {
        const y = top + r * rowGap;
        const offset = (r % 2 === 0) ? 0 : hGap / 2;
        // fill across play width with a small inset
        let x = this.playL + hGap * 0.5 + offset;
        while (x <= this.playR - hGap * 0.25) {
          // keep pegs off the very edges where the disc travels
          if (x > this.playL + 14 && x < this.playR - 14) {
            pegs.push({ x, y, hit: -1 });
          }
          x += hGap;
        }
      }
      this.pegs = pegs;
      this.rowGap = rowGap;
    }

    slotCenter(i) { return this.playL + this.slotW * (i + 0.5); }
    slotBounds(i) { return [this.playL + this.slotW * i, this.playL + this.slotW * (i + 1)]; }

    // n drop columns across the play area -> array of x centers
    getDropColumns(n) {
      const cols = [];
      const inset = 70;
      const usable = this.playW - inset * 2;
      for (let i = 0; i < n; i++) {
        cols.push(this.playL + inset + usable * (i + 0.5) / n);
      }
      return cols;
    }

    _makeDisc(x, target, demo) {
      return {
        x, y: this.pegTop - 70,
        vx: rand(-30, 30), vy: 0,
        r: demo ? 20 : 27,
        target, demo: !!demo,
        landed: false, restT: 0, done: false,
        trail: [], sparks: [],
      };
    }

    drop(startX, target) {
      this.winningSlot = -1;
      const d = this._makeDisc(clamp(startX, this.playL + 40, this.playR - 40), target, false);
      this.discs = [d];
      this.start();
      window.PlinkoAudio && window.PlinkoAudio.drop();
    }

    setDemo(on) {
      this.demoMode = on;
      if (on) {
        this.discs = [];
        this._demoTimer = 0;
        this.start();
      }
    }

    reset() {
      this.discs = [];
      this.winningSlot = -1;
    }

    start() {
      if (this.running) return;
      this.running = true;
      this._last = performance.now();
      const tick = (now) => {
        if (!this.running) return;
        let dt = (now - this._last) / 1000;
        this._last = now;
        dt = Math.min(0.05, dt);
        this._update(dt);
        this._draw();
        this._raf = requestAnimationFrame(tick);
      };
      this._raf = requestAnimationFrame(tick);
    }

    stop() {
      this.running = false;
      if (this._raf) cancelAnimationFrame(this._raf);
    }

    _update(dt) {
      // demo spawns
      if (this.demoMode) {
        this._demoTimer -= dt;
        if (this._demoTimer <= 0 && this.discs.length < 4) {
          this._demoTimer = rand(0.7, 1.4);
          const cols = this.getDropColumns(9);
          const x = cols[(Math.random() * cols.length) | 0];
          const t = (Math.random() * this.nSlots) | 0;
          this.discs.push(this._makeDisc(x, t, true));
        }
      }

      const steps = 3;
      const h = dt / steps;
      for (let s = 0; s < steps; s++) {
        for (const d of this.discs) this._stepDisc(d, h);
      }
      // sparks + trail bookkeeping, cull finished
      const keep = [];
      for (const d of this.discs) {
        d.trail.push({ x: d.x, y: d.y });
        if (d.trail.length > 10) d.trail.shift();
        for (const sp of d.sparks) { sp.life -= dt; sp.x += sp.vx * dt; sp.y += sp.vy * dt; }
        d.sparks = d.sparks.filter((sp) => sp.life > 0);
        if (d.done && d.demo) continue; // drop demo discs that finished
        keep.push(d);
      }
      this.discs = keep;
    }

    _stepDisc(d, h) {
      if (d.landed) {
        d.restT += h;
        // settle
        d.vy = 0; d.vx *= 0.6;
        d.x += d.vx * h;
        const [l, r] = this.slotBounds(d.target);
        d.x = clamp(d.x, l + d.r, r - d.r);
        if (!d.done && d.restT > 0.18) {
          d.done = true;
          if (!d.demo) {
            this.winningSlot = d.target;
            this.onLandCb && this.onLandCb(d.target);
          }
        }
        return;
      }

      const g = 2700 * this.opt.gravityScale;
      d.vy += g * h;

      const tx = this.slotCenter(d.target);
      // No force while falling in open space — the disc only changes direction
      // when it actually strikes a peg (below). That reads as real physics.
      if (d.y >= this.pegBottom) {
        // Funnel (below the pegs, no obstacles): gently ease onto the target
        // column, velocity-matched and clamped so there is never a sudden yank.
        const desiredVx = clamp((tx - d.x) * 2.2, -300, 300);
        d.vx += (desiredVx - d.vx) * Math.min(1, 4.5 * h);
      }

      // integrate
      d.x += d.vx * h;
      d.y += d.vy * h;

      // clamp speed
      const sp = Math.hypot(d.vx, d.vy);
      const maxSp = 1400;
      if (sp > maxSp) { d.vx *= maxSp / sp; d.vy *= maxSp / sp; }

      // peg collisions (only near disc's y band)
      const rp = this.pegR;
      for (const peg of this.pegs) {
        if (Math.abs(peg.y - d.y) > 60) continue;
        const dx = d.x - peg.x, dy = d.y - peg.y;
        const dist = Math.hypot(dx, dy);
        const min = rp + d.r;
        if (dist < min && dist > 0.0001) {
          const nx = dx / dist, ny = dy / dist;
          d.x = peg.x + nx * min;
          d.y = peg.y + ny * min;
          const vn = d.vx * nx + d.vy * ny;
          if (vn < 0) {
            // Real reflection off the peg: this gives the natural VERTICAL bounce.
            const e = 0.45;
            d.vx -= (1 + e) * vn * nx;
            d.vy -= (1 + e) * vn * ny;
            if (d.vy < -300) d.vy = -300;          // cap the upward pop
            // Horizontal: a struck peg sends the disc off to one side. We pick the
            // side (mostly toward the target slot, occasionally away so it still
            // reads as luck) and set a controlled, varied sideways speed. Vertical
            // momentum is preserved, so the disc keeps clattering DOWN naturally
            // while these many real bounces walk it toward the winning slot.
            const frac = clamp((d.y - this.pegTop) / (this.pegBottom - this.pegTop), 0, 1);
            const dir = (tx - d.x) >= 0 ? 1 : -1;
            const side = Math.random() < lerp(0.72, 0.99, frac) ? dir : -dir;
            d.vx = side * lerp(175, 250, frac) * (0.7 + 0.5 * Math.random());
            peg.hit = performance.now();
            if (!d.demo) this._spark(d, peg);
            window.PlinkoAudio && window.PlinkoAudio.peg();
          }
        }
      }

      // side walls
      if (d.x < this.wallL + d.r) {
        d.x = this.wallL + d.r; d.vx = Math.abs(d.vx) * 0.5;
        window.PlinkoAudio && window.PlinkoAudio.wall();
      } else if (d.x > this.wallR - d.r) {
        d.x = this.wallR - d.r; d.vx = -Math.abs(d.vx) * 0.5;
        window.PlinkoAudio && window.PlinkoAudio.wall();
      }

      // slot zone: constrain into target slot + divider bounce
      if (d.y > this.dividerTop - d.r) {
        const [l, r] = this.slotBounds(d.target);
        if (d.x < l + d.r) { d.x = l + d.r; d.vx = Math.abs(d.vx) * 0.35; }
        else if (d.x > r - d.r) { d.x = r - d.r; d.vx = -Math.abs(d.vx) * 0.35; }
      }

      // floor / land
      if (d.y >= this.slotFloor - d.r) {
        d.y = this.slotFloor - d.r;
        if (!d.landed) {
          d.landed = true; d.restT = 0;
          if (!d.demo) window.PlinkoAudio && window.PlinkoAudio.land();
        }
      }
    }

    _spark(d, peg) {
      for (let i = 0; i < 5; i++) {
        d.sparks.push({
          x: peg.x, y: peg.y,
          vx: rand(-180, 180), vy: rand(-180, 60),
          life: rand(0.2, 0.45),
        });
      }
    }

    // ---------- rendering ----------
    _draw() {
      const ctx = this.ctx;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.W, this.H);
      this._drawSlots();
      this._drawPegs();
      for (const d of this.discs) this._drawDisc(d);
    }

    _drawPegs() {
      const ctx = this.ctx;
      const now = performance.now();
      for (const peg of this.pegs) {
        const since = peg.hit > 0 ? now - peg.hit : 9999;
        const flash = clamp(1 - since / 220, 0, 1);
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, this.pegR + flash * 3, 0, Math.PI * 2);
        if (flash > 0.02) {
          ctx.shadowColor = this.opt.accentBright;
          ctx.shadowBlur = 18 * flash;
          ctx.fillStyle = this._lighten(this.opt.accent, 0.2 + 0.5 * flash);
        } else {
          ctx.shadowColor = 'rgba(70,207,114,0.35)';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#cfd6d2';
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        // inner dot
        ctx.beginPath();
        ctx.arc(peg.x - 2, peg.y - 2, this.pegR * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
      }
    }

    _drawSlots() {
      const ctx = this.ctx;
      const prizes = window.PRIZES || [];
      const now = performance.now();
      const top = this.dividerTop;
      const floor = this.slotFloor;
      // slot bays
      for (let i = 0; i < this.nSlots; i++) {
        const [l, r] = this.slotBounds(i);
        const isWin = this.winningSlot === i;
        const pulse = isWin ? 0.5 + 0.5 * Math.sin(now / 140) : 0;
        // bay background
        ctx.fillStyle = isWin
          ? `rgba(70,207,114,${0.18 + 0.2 * pulse})`
          : 'rgba(255,255,255,0.035)';
        this._roundRect(l + 7, top + 6, (r - l) - 14, floor - top - 6, 16);
        ctx.fill();
        if (isWin) {
          ctx.strokeStyle = this.opt.accentBright;
          ctx.lineWidth = 4;
          ctx.shadowColor = this.opt.accentBright;
          ctx.shadowBlur = 26 * (0.6 + pulse);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
        // emoji + label
        const cx = (l + r) / 2;
        const p = prizes[i];
        if (p) {
          ctx.textAlign = 'center';
          ctx.font = '56px serif';
          ctx.fillStyle = '#fff';
          ctx.fillText(p.emoji, cx, top + 78);
          ctx.font = '700 21px "Space Grotesk", system-ui, sans-serif';
          ctx.fillStyle = isWin ? '#fff' : 'rgba(255,255,255,0.78)';
          this._fitLabel(p.name.toUpperCase(), cx, top + 120, (r - l) - 18);
        }
      }
      // dividers
      for (let i = 1; i < this.nSlots; i++) {
        const x = this.playL + this.slotW * i;
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        this._roundRect(x - 5, top - 4, 10, floor - top + 4, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, top - 4, 9, 0, Math.PI * 2);
        ctx.fillStyle = this.opt.accent;
        ctx.shadowColor = this.opt.accentBright;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    _fitLabel(text, cx, y, maxW) {
      const ctx = this.ctx;
      let size = 21;
      ctx.font = `700 ${size}px "Space Grotesk", system-ui, sans-serif`;
      while (ctx.measureText(text).width > maxW && size > 12) {
        size -= 1;
        ctx.font = `700 ${size}px "Space Grotesk", system-ui, sans-serif`;
      }
      ctx.fillText(text, cx, y);
    }

    _drawDisc(d) {
      const ctx = this.ctx;
      // trail
      for (let i = 0; i < d.trail.length; i++) {
        const t = d.trail[i];
        const a = (i / d.trail.length) * 0.28;
        ctx.beginPath();
        ctx.arc(t.x, t.y, d.r * (0.4 + 0.5 * i / d.trail.length), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(70,207,114,${a})`;
        ctx.fill();
      }
      // sparks
      for (const sp of d.sparks) {
        ctx.globalAlpha = clamp(sp.life * 3, 0, 1);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.opt.accentBright;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // disc body
      ctx.save();
      ctx.shadowColor = this.opt.accentBright;
      ctx.shadowBlur = 26;
      const grd = ctx.createRadialGradient(d.x - d.r * 0.3, d.y - d.r * 0.4, d.r * 0.2, d.x, d.y, d.r);
      grd.addColorStop(0, this._lighten(this.opt.accent, 0.45));
      grd.addColorStop(0.6, this.opt.accent);
      grd.addColorStop(1, this._lighten(this.opt.accent, -0.001) === this.opt.accent ? this.opt.accent : this.opt.accent);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.restore();
      // rim
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.stroke();
      // inner emblem
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = '#06140c';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * 0.42, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.stroke();
      // gloss
      ctx.beginPath();
      ctx.arc(d.x - d.r * 0.32, d.y - d.r * 0.36, d.r * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fill();
    }

    _roundRect(x, y, w, h, r) {
      const ctx = this.ctx;
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
  }

  window.PlinkoBoard = PlinkoBoard;
})();
