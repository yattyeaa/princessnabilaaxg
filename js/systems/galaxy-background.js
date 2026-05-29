/**
 * BUCIN — Galaxy Background Engine v2
 * Dense, cinematic galaxy with nebula clouds, shooting stars,
 * twinkling stars, and depth layers — all GPU-efficient via Canvas 2D.
 * NO Three.js dependency, runs fully independent from three-background.js
 */

class GalaxyBackground {
  constructor() {
    this.canvas = document.getElementById('galaxy-canvas');
    this.ctx = null;
    this._raf = null;
    this._t = 0;
    this._mouse = { x: 0.5, y: 0.5 };
    this._targetMouse = { x: 0.5, y: 0.5 };
    this._W = 0;
    this._H = 0;

    // Star layers (depth)
    this._layers = [];
    // Nebula clouds
    this._nebulae = [];
    // Shooting stars
    this._shooters = [];
    // Twinkling bright stars
    this._brightStars = [];
    // Dust particles (very small, many)
    this._dust = [];
  }

  init() {
    if (!this.canvas) {
      // create canvas if not exist
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'galaxy-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(this.canvas, document.body.firstChild);
    }

    this.canvas.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      pointer-events: none;
    `;

    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this._resize();
    this._buildScene();
    this._bindEvents();
    this._render();
  }

  _resize() {
    this._W = window.innerWidth;
    this._H = window.innerHeight;
    this.canvas.width  = this._W;
    this.canvas.height = this._H;
    // Rebuild scene on resize
    if (this._layers.length) this._buildScene();
  }

  _buildScene() {
    const W = this._W, H = this._H;
    const isMobile = W < 768;
    const density = isMobile ? 0.55 : 1;

    // ── STAR LAYERS (3 depth layers) ──────────────────────────────
    this._layers = [];

    // Layer 0 — far/tiny stars (most)
    {
      const count = Math.floor(380 * density);
      const stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.3 + Math.random() * 0.6,
          alpha: 0.08 + Math.random() * 0.22,
          twinkleSpeed: 0.4 + Math.random() * 1.2,
          twinklePhase: Math.random() * Math.PI * 2,
          parallax: 0.01,
          color: _pickStarColor(),
        });
      }
      this._layers.push(stars);
    }

    // Layer 1 — mid stars
    {
      const count = Math.floor(180 * density);
      const stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.5 + Math.random() * 0.9,
          alpha: 0.15 + Math.random() * 0.28,
          twinkleSpeed: 0.3 + Math.random() * 0.9,
          twinklePhase: Math.random() * Math.PI * 2,
          parallax: 0.025,
          color: _pickStarColor(),
        });
      }
      this._layers.push(stars);
    }

    // Layer 2 — close/bright stars
    {
      const count = Math.floor(80 * density);
      const stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.9 + Math.random() * 1.4,
          alpha: 0.22 + Math.random() * 0.28,
          twinkleSpeed: 0.2 + Math.random() * 0.7,
          twinklePhase: Math.random() * Math.PI * 2,
          parallax: 0.05,
          color: _pickStarColor(),
        });
      }
      this._layers.push(stars);
    }

    // ── BRIGHT SPARKLE STARS (cross-shaped glow) ──────────────────
    {
      const count = Math.floor(35 * density);
      this._brightStars = [];
      for (let i = 0; i < count; i++) {
        this._brightStars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 1.2 + Math.random() * 2.2,
          alpha: 0.28 + Math.random() * 0.28,
          twinkleSpeed: 0.2 + Math.random() * 0.6,
          twinklePhase: Math.random() * Math.PI * 2,
          color: _pickBrightColor(),
          parallex: 0.03,
        });
      }
    }

    // ── NEBULA CLOUDS ─────────────────────────────────────────────
    this._nebulae = [];
    const nebulaConfig = [
      // { cx, cy as fraction of W/H, rx, ry as fraction, color, alpha }
      { cx: 0.18, cy: 0.25, rx: 0.38, ry: 0.28, color: '155,89,248',  alpha: 0.055 },
      { cx: 0.80, cy: 0.70, rx: 0.32, ry: 0.24, color: '255,110,180', alpha: 0.05  },
      { cx: 0.50, cy: 0.10, rx: 0.45, ry: 0.18, color: '74,158,255',  alpha: 0.038 },
      { cx: 0.75, cy: 0.20, rx: 0.28, ry: 0.22, color: '255,110,180', alpha: 0.042 },
      { cx: 0.22, cy: 0.78, rx: 0.30, ry: 0.20, color: '100,60,200',  alpha: 0.048 },
      { cx: 0.55, cy: 0.55, rx: 0.35, ry: 0.30, color: '200,80,150',  alpha: 0.032 },
    ];
    nebulaConfig.forEach(n => {
      this._nebulae.push({
        x:     n.cx * W,
        y:     n.cy * H,
        rx:    n.rx * W,
        ry:    n.ry * H,
        color: n.color,
        alpha: n.alpha,
        driftX: (Math.random() - 0.5) * 0.08,
        driftY: (Math.random() - 0.5) * 0.06,
        phase:  Math.random() * Math.PI * 2,
      });
    });

    // ── DUST (tiny floating specks) ───────────────────────────────
    {
      const count = Math.floor(120 * density);
      this._dust = [];
      for (let i = 0; i < count; i++) {
        this._dust.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.15 + Math.random() * 0.3,
          alpha: 0.03 + Math.random() * 0.06,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.09,
          color: _pickStarColor(),
        });
      }
    }

    // ── SHOOTING STARS pool ───────────────────────────────────────
    this._shooters = [];
    // spawn initial batch
    for (let i = 0; i < 3; i++) {
      this._shooters.push(this._newShooter(true));
    }
  }

  _newShooter(scattered) {
    const W = this._W, H = this._H;
    // Always spawn from top area
    const x = scattered ? Math.random() * W : -80 + Math.random() * (W + 160);
    const y = scattered ? Math.random() * H * 0.6 : -30;
    const angle = 0.35 + Math.random() * 0.55; // diagonal downward
    const speed = 5 + Math.random() * 9;
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: 60 + Math.random() * 120,
      alpha: 0,
      maxAlpha: 0.25 + Math.random() * 0.2,
      life: 0,
      maxLife: 55 + Math.random() * 45,
      dead: false,
      color: Math.random() < 0.7 ? '255,255,255' : '200,180,255',
    };
  }

  _bindEvents() {
    window.addEventListener('mousemove', e => {
      this._targetMouse.x = e.clientX / this._W;
      this._targetMouse.y = e.clientY / this._H;
    }, { passive: true });

    window.addEventListener('resize', () => {
      this._resize();
    }, { passive: true });
  }

  _render() {
    const loop = () => {
      this._raf = requestAnimationFrame(loop);
      this._t += 0.016;
      this._update();
      this._draw();
    };
    loop();
  }

  _update() {
    const t = this._t;
    // Smooth mouse
    this._mouse.x += (this._targetMouse.x - this._mouse.x) * 0.04;
    this._mouse.y += (this._targetMouse.y - this._mouse.y) * 0.04;

    // Update dust
    const W = this._W, H = this._H;
    this._dust.forEach(d => {
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0) d.x = W;
      if (d.x > W) d.x = 0;
      if (d.y < 0) d.y = H;
      if (d.y > H) d.y = 0;
    });

    // Update shooters
    const toAdd = [];
    this._shooters.forEach(s => {
      s.life++;
      const lifeRatio = s.life / s.maxLife;
      if (lifeRatio < 0.15) {
        s.alpha = (lifeRatio / 0.15) * s.maxAlpha;
      } else if (lifeRatio > 0.7) {
        s.alpha = ((1 - lifeRatio) / 0.3) * s.maxAlpha;
      } else {
        s.alpha = s.maxAlpha;
      }
      s.x += s.vx;
      s.y += s.vy;
      if (s.life >= s.maxLife) s.dead = true;
    });
    this._shooters = this._shooters.filter(s => !s.dead);

    // Randomly spawn new shooters (avg ~1 every 3-5s)
    if (Math.random() < 0.004 && this._shooters.length < 5) {
      this._shooters.push(this._newShooter(false));
    }
  }

  _draw() {
    const ctx = this.ctx;
    const W = this._W, H = this._H;
    const t = this._t;
    const mx = this._mouse.x, my = this._mouse.y;

    // ── Background fill ─────────────────────────────────────────
    ctx.fillStyle = '#030008';
    ctx.fillRect(0, 0, W, H);

    // ── Nebulae ─────────────────────────────────────────────────
    this._nebulae.forEach(n => {
      const drift = Math.sin(t * 0.08 + n.phase) * 18;
      const driftY = Math.cos(t * 0.06 + n.phase) * 12;
      const cx = n.x + drift + (mx - 0.5) * 22;
      const cy = n.y + driftY + (my - 0.5) * 14;

      ctx.save();
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(n.rx, n.ry));
      grad.addColorStop(0,   `rgba(${n.color},${n.alpha})`);
      grad.addColorStop(0.4, `rgba(${n.color},${n.alpha * 0.6})`);
      grad.addColorStop(1,   `rgba(${n.color},0)`);
      ctx.scale(1, n.ry / n.rx);
      ctx.beginPath();
      ctx.arc(cx, cy * (n.rx / n.ry), n.rx, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    });

    // ── Galactic core glow ──────────────────────────────────────
    {
      const coreX = W * 0.5 + (mx - 0.5) * 30;
      const coreY = H * 0.45 + (my - 0.5) * 20;
      const coreR = Math.min(W, H) * 0.42;
      const pulseFactor = 1 + Math.sin(t * 0.4) * 0.04;
      const grad = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, coreR * pulseFactor);
      grad.addColorStop(0,    'rgba(160,100,220,0.022)');
      grad.addColorStop(0.3,  'rgba(110,60,180,0.016)');
      grad.addColorStop(0.65, 'rgba(160,70,120,0.009)');
      grad.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(coreX, coreY, coreR * pulseFactor, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // ── Star layers ─────────────────────────────────────────────
    this._layers.forEach((layer, li) => {
      const parallaxStr = (li + 1) * 0.018;
      layer.forEach(star => {
        const twinkle = 0.5 + 0.5 * Math.sin(t * star.twinkleSpeed + star.twinklePhase);
        const a = star.alpha * (0.55 + twinkle * 0.45);
        const sx = (star.x + (mx - 0.5) * W * parallaxStr * star.parallax * 60) % W;
        const sy = (star.y + (my - 0.5) * H * parallaxStr * star.parallax * 60) % H;

        ctx.globalAlpha = a;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(
          (sx + W) % W,
          (sy + H) % H,
          star.r, 0, Math.PI * 2
        );
        ctx.fill();
      });
    });

    // ── Dust ────────────────────────────────────────────────────
    this._dust.forEach(d => {
      ctx.globalAlpha = d.alpha;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── Bright sparkle stars ─────────────────────────────────────
    this._brightStars.forEach(star => {
      const twinkle = 0.5 + 0.5 * Math.sin(t * star.twinkleSpeed + star.twinklePhase);
      const a = star.alpha * (0.4 + twinkle * 0.6);
      const sx = star.x + (mx - 0.5) * 40 * star.parallex;
      const sy = star.y + (my - 0.5) * 25 * star.parallex;
      const r = star.r * (0.88 + twinkle * 0.24);

      // Glow halo
      ctx.save();
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4);
      glow.addColorStop(0,   `rgba(${star.color},${a * 0.55})`);
      glow.addColorStop(0.5, `rgba(${star.color},${a * 0.18})`);
      glow.addColorStop(1,   `rgba(${star.color},0)`);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, r * 4, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
      ctx.restore();

      // Core dot
      ctx.globalAlpha = a;
      ctx.fillStyle = `rgb(${star.color})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();

      // Cross sparkle arms
      if (twinkle > 0.6) {
        const armLen = r * 5 * twinkle;
        const armA = a * (twinkle - 0.6) * 0.7;
        ctx.globalAlpha = armA;
        ctx.strokeStyle = `rgb(${star.color})`;
        ctx.lineWidth = r * 0.45;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx - armLen, sy); ctx.lineTo(sx + armLen, sy);
        ctx.moveTo(sx, sy - armLen * 0.65); ctx.lineTo(sx, sy + armLen * 0.65);
        ctx.stroke();
      }
    });

    // ── Shooting stars ───────────────────────────────────────────
    this._shooters.forEach(s => {
      if (s.alpha <= 0) return;
      const tailX = s.x - s.vx * (s.len / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * 0.85;
      const tailY = s.y - s.vy * (s.len / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * 0.85;

      const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      grad.addColorStop(0, `rgba(${s.color},0)`);
      grad.addColorStop(0.6, `rgba(${s.color},${s.alpha * 0.5})`);
      grad.addColorStop(1, `rgba(${s.color},${s.alpha})`);

      ctx.save();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();

      // Head glow
      const headGlow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 6);
      headGlow.addColorStop(0, `rgba(${s.color},${s.alpha})`);
      headGlow.addColorStop(1, `rgba(${s.color},0)`);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = headGlow;
      ctx.fill();
      ctx.restore();
    });

    // Reset globalAlpha
    ctx.globalAlpha = 1;
  }

  destroy() {
    cancelAnimationFrame(this._raf);
  }
}

/* ── Helpers ──────────────────────────────────────────────── */
function _pickStarColor() {
  const r = Math.random();
  if (r < 0.45) return '#ffffff';
  if (r < 0.62) return '#e8d4ff'; // pale violet
  if (r < 0.75) return '#ffd4ea'; // pale pink
  if (r < 0.86) return '#d4e8ff'; // pale blue
  if (r < 0.93) return '#ffe8b0'; // warm yellow
  return '#c0c8ff';                // blue-white
}

function _pickBrightColor() {
  const r = Math.random();
  if (r < 0.38) return '255,255,255';
  if (r < 0.58) return '220,190,255';
  if (r < 0.74) return '255,200,230';
  if (r < 0.86) return '180,210,255';
  return '255,240,190';
}

window.GalaxyBackground = GalaxyBackground;
