// confetti.js — canvas particle confetti + jackpot streamers. window.Confetti
(function () {
  function rand(a, b) { return a + Math.random() * (b - a); }

  class Confetti {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.parts = [];
      this.running = false;
      this._raf = null;
      this._last = 0;
    }

    _ensureLoop() {
      if (this.running) return;
      this.running = true;
      this._last = performance.now();
      const tick = (now) => {
        const dt = Math.min(0.05, (now - this._last) / 1000);
        this._last = now;
        this._step(dt);
        if (this.parts.length > 0) {
          this._raf = requestAnimationFrame(tick);
        } else {
          this.running = false;
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
      };
      this._raf = requestAnimationFrame(tick);
    }

    _step(dt) {
      const { ctx, canvas } = this;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const alive = [];
      for (const p of this.parts) {
        p.vy += p.g * dt;
        p.vx *= 0.99;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.life -= dt;
        const a = Math.max(0, Math.min(1, p.life / p.fade));
        if (p.life > 0 && p.y < canvas.height + 40) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color;
          if (p.shape === 'rect') {
            ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
          } else if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.s / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // strip
            ctx.fillRect(-p.s / 6, -p.s, p.s / 3, p.s * 2);
          }
          ctx.restore();
          alive.push(p);
        }
      }
      this.parts = alive;
    }

    _emit(n, opts) {
      const { canvas } = this;
      const colors = opts.colors || ['#46cf72', '#359652', '#ffffff', '#0fa55b'];
      const ox = opts.x != null ? opts.x : canvas.width / 2;
      const oy = opts.y != null ? opts.y : canvas.height / 2;
      for (let i = 0; i < n; i++) {
        const ang = rand(opts.angMin, opts.angMax);
        const spd = rand(opts.spdMin, opts.spdMax);
        this.parts.push({
          x: ox + rand(-opts.spread, opts.spread),
          y: oy + rand(-opts.spread / 3, opts.spread / 3),
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          g: rand(900, 1500),
          rot: rand(0, Math.PI * 2),
          vr: rand(-8, 8),
          s: rand(opts.sizeMin || 10, opts.sizeMax || 22),
          color: colors[(Math.random() * colors.length) | 0],
          shape: ['rect', 'circle', 'strip'][(Math.random() * 3) | 0],
          life: rand(opts.lifeMin || 1.4, opts.lifeMax || 2.6),
          fade: 0.8,
        });
      }
      this._ensureLoop();
    }

    // small burst near a point (normal prizes)
    burst(x, y, scale) {
      const k = scale || 1;
      this._emit(Math.round(60 * k), {
        x, y, spread: 30,
        angMin: -Math.PI * 0.9, angMax: -Math.PI * 0.1,
        spdMin: 300, spdMax: 760,
      });
    }

    // bigger, green-glow celebration (rare)
    celebrate(scale) {
      const k = scale || 1;
      const cx = this.canvas.width / 2;
      this._emit(Math.round(140 * k), {
        x: cx, y: this.canvas.height * 0.42, spread: 120,
        angMin: -Math.PI, angMax: 0,
        spdMin: 350, spdMax: 1000, sizeMax: 26,
      });
    }

    // full-screen rain + side cannons (epic / jackpot)
    jackpot(scale) {
      const k = scale || 1;
      const W = this.canvas.width;
      const gold = ['#ffd24a', '#46cf72', '#ffffff', '#359652', '#ffe9a8'];
      // top rain
      for (let i = 0; i < Math.round(220 * k); i++) {
        this.parts.push({
          x: rand(0, W), y: rand(-this.canvas.height * 0.4, 0),
          vx: rand(-60, 60), vy: rand(120, 360),
          g: rand(120, 320), rot: rand(0, 6.28), vr: rand(-9, 9),
          s: rand(12, 26), color: gold[(Math.random() * gold.length) | 0],
          shape: ['rect', 'circle', 'strip'][(Math.random() * 3) | 0],
          life: rand(2.6, 4.2), fade: 1.0,
        });
      }
      // side cannons
      this._emit(Math.round(90 * k), {
        x: 40, y: this.canvas.height * 0.62, spread: 20,
        angMin: -Math.PI * 0.55, angMax: -Math.PI * 0.2,
        spdMin: 700, spdMax: 1500, colors: gold,
      });
      this._emit(Math.round(90 * k), {
        x: W - 40, y: this.canvas.height * 0.62, spread: 20,
        angMin: -Math.PI * 0.8, angMax: -Math.PI * 0.45,
        spdMin: 700, spdMax: 1500, colors: gold,
      });
    }

    stop() {
      this.parts = [];
      if (this._raf) cancelAnimationFrame(this._raf);
      this.running = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  window.Confetti = Confetti;
})();
