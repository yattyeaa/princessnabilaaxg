/**
 * BUCIN — Main Entry Script
 * DOM population, ambient particles, audio system, initialization
 */

// ─── DOM BUILDER ──────────────────────────────────────────────────────────────
const DOMBuilder = {
  buildTimeline() {
    const container = document.querySelector('.timeline__items');
    if (!container) return;

    CONFIG.timeline.forEach((item, i) => {
      const el = document.createElement('div');
      el.className = `timeline__item timeline__item--${i % 2 === 0 ? 'left' : 'right'}`;
      el.innerHTML = `
        <div class="timeline__icon">${item.icon}</div>
        <div class="timeline__card glass-card">
          <span class="timeline__date">${item.date}</span>
          <h3 class="timeline__title">${item.title}</h3>
          <p class="timeline__quote">${item.quote}</p>
        </div>
      `;
      container.appendChild(el);
    });
  },

  buildGallery() {
    const container = document.querySelector('.gallery__grid');
    if (!container) return;

    const gradients = [
      'linear-gradient(160deg, #1a0533 0%, #2d0b4e 50%, #0d1a3a 100%)',
      'linear-gradient(160deg, #0d1a2e 0%, #1e0533 60%, #330a1a 100%)',
      'linear-gradient(160deg, #1a0d2e 0%, #0d1a3a 50%, #3a0d1a 100%)',
      'linear-gradient(160deg, #0a1a33 0%, #1a0a2e 50%, #330d1a 100%)',
      'linear-gradient(160deg, #1a0d2e 0%, #2e0d1a 60%, #0d1a33 100%)',
      'linear-gradient(160deg, #2e0d1a 0%, #1a0d3a 50%, #0d2e1a 100%)',
    ];
    const patterns = ['✦', '◈', '✧', '♡', '◉', '★'];

    CONFIG.gallery.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'gallery__card';
      card.setAttribute('data-reveal', 'fade-up');

      const hasPhoto = item.img && item.img.trim() !== '';

      const mediaHTML = hasPhoto
        ? `<img class="gallery__photo" src="${item.img}" alt="${item.caption}" loading="lazy" />`
        : `<div class="gallery__card-bg" style="background:${gradients[i % gradients.length]}">
             <div class="gallery__pattern">${patterns[i % patterns.length]}</div>
           </div>`;

      card.innerHTML = `
        <div class="gallery__card-inner">
          ${mediaHTML}
          <div class="gallery__caption">
            <span class="gallery__caption-text">${item.caption}</span>
            <span class="gallery__caption-tag">#${item.tag}</span>
          </div>
        </div>`;

      container.appendChild(card);
    });
  },
};

// ─── AMBIENT 2D PARTICLE CANVAS ───────────────────────────────────────────────
class AmbientParticles {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas?.getContext('2d');
    this.particles = [];
    this._raf = null;
  }

  init() {
    if (!this.canvas || !this.ctx) return;
    this._resize();
    this._spawn();
    this._render();
    window.addEventListener('resize', () => this._resize(), { passive: true });
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _spawn() {
    const count = State.get('isMobile') ? 30 : 70;
    this.particles = [];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.5,
        size: 1 + Math.random() * 2.5,
        opacity: 0.1 + Math.random() * 0.5,
        hue: 300 + Math.random() * 80,
        life: Math.random(),
        maxLife: 0.3 + Math.random() * 0.7,
      });
    }
  }

  _render() {
    const animate = () => {
      this._raf = requestAnimationFrame(animate);
      if (!this.ctx) return;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.003;

        // Fade in / fade out
        const lifeFrac = (p.life % p.maxLife) / p.maxLife;
        const alpha = lifeFrac < 0.5
          ? p.opacity * (lifeFrac / 0.5)
          : p.opacity * (1 - (lifeFrac - 0.5) / 0.5);

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${alpha})`;
        this.ctx.fill();

        // Wrap
        if (p.y < -10) p.y = this.canvas.height + 10;
        if (p.x < -10) p.x = this.canvas.width + 10;
        if (p.x > this.canvas.width + 10) p.x = -10;
      });
    };
    animate();
  }

  destroy() {
    cancelAnimationFrame(this._raf);
  }
}

// ─── AUDIO SYSTEM ─────────────────────────────────────────────────────────────
class AudioSystem {
  constructor() {
    this.btn = document.querySelector('.audio-btn');
    this.ctx = null;
    this.osc = null;
    this.gain = null;
    this.playing = false;
  }

  init() {
    if (!this.btn) return;

    this.btn.addEventListener('click', () => {
      if (!this.ctx) this._buildAmbient();
      this._toggle();
    });
  }

  _buildAmbient() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Drone chord: root + fifth + octave (love frequency 528hz vicinity)
    const freqs = [174, 261, 348, 432];
    this.nodes = freqs.map((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const reverb = this.ctx.createConvolver();
      const filter = this.ctx.createBiquadFilter();

      osc.type = ['sine', 'triangle', 'sine', 'sine'][i];
      osc.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.5;

      gain.gain.value = 0;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();

      return { osc, gain };
    });

    // Slow LFO for pulsing
    this.nodes.forEach((node, i) => {
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.05 + i * 0.02;
      lfoGain.gain.value = 0.002;
      lfo.connect(lfoGain);
      lfoGain.connect(node.osc.frequency);
      lfo.start();
    });
  }

  _toggle() {
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.playing = !this.playing;
    const volumes = [0.035, 0.025, 0.02, 0.015];

    if (this.playing) {
      this.nodes?.forEach((node, i) => {
        node.gain.gain.cancelScheduledValues(this.ctx.currentTime);
        node.gain.gain.linearRampToValueAtTime(volumes[i], this.ctx.currentTime + 2.5);
      });
      this.btn.classList.add('playing');
      this.btn.querySelector('.audio-icon').textContent = '♬';
    } else {
      this.nodes?.forEach(node => {
        node.gain.gain.cancelScheduledValues(this.ctx.currentTime);
        node.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
      });
      this.btn.classList.remove('playing');
      this.btn.querySelector('.audio-icon').textContent = '♩';
    }

    State.set('audioPlaying', this.playing);
  }

  destroy() {
    this.ctx?.close();
  }
}

// ─── SCROLL PROGRESS BAR ──────────────────────────────────────────────────────
function initScrollProgress() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = window.scrollY / max;
    bar.style.transform = `scaleX(${pct})`;
  }, { passive: true });
}

// ─── HEART FLOAT DECORATIONS ──────────────────────────────────────────────────
function initHeartFloaters() {
  const container = document.querySelector('.hero__particles');
  if (!container || State.get('isMobile')) return;

  const symbols = ['♡', '✦', '◈', '✧', '˚', '⋆'];
  const count = 15;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'hero-float-symbol';
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.cssText = `
      position: absolute;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      font-size: ${10 + Math.random() * 18}px;
      opacity: ${0.05 + Math.random() * 0.2};
      color: hsl(${310 + Math.random() * 70}, 80%, 80%);
      pointer-events: none;
      user-select: none;
    `;
    container.appendChild(el);

    gsap.to(el, {
      y: -(30 + Math.random() * 60),
      x: (Math.random() - 0.5) * 40,
      opacity: el.style.opacity,
      duration: 6 + Math.random() * 6,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: Math.random() * 6,
    });
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Build dynamic sections
  DOMBuilder.buildTimeline();
  // Gallery is static HTML in index.html — edit img src langsung di sana

  // Ambient 2D particles overlay
  const ambientParticles = new AmbientParticles('particle-canvas');
  ambientParticles.init();

  // Audio
  const audio = new AudioSystem();
  audio.init();

  // Scroll progress
  initScrollProgress();

  // Hero float symbols
  initHeartFloaters();

  // Boot app
  window.App.init();
});
