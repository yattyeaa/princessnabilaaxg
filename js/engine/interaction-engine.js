/**
 * BUCIN — Interaction Engine
 * Cursor trails, magnetic buttons, ripples, hover systems
 */

class InteractionEngine {
  constructor() {
    this.cursor = null;
    this.cursorFollower = null;
    this.magneticEls = [];
    this.trailParticles = [];
    this._raf = null;
    this._active = !State.get('touchDevice');
  }

  init() {
    if (this._active) {
      this._buildCustomCursor();
      this._initMagneticButtons();
      this._initCursorTrail();
    }
    this._initRippleClicks();
    this._initGalleryHover();
    this._initButtonHovers();
    this._initFloatingReactions();
  }

  // ─── CUSTOM CURSOR ────────────────────────────────────────────────
  _buildCustomCursor() {
    this.cursor = document.querySelector('.cursor');
    this.cursorFollower = document.querySelector('.cursor-follower');
    if (!this.cursor) return;

    document.body.style.cursor = 'none';

    let cx = 0, cy = 0, fx = 0, fy = 0;

    document.addEventListener('mousemove', e => {
      cx = e.clientX;
      cy = e.clientY;
    }, { passive: true });

    const animateCursor = () => {
      gsap.set(this.cursor, { x: cx, y: cy });

      fx += (cx - fx) * 0.1;
      fy += (cy - fy) * 0.1;
      gsap.set(this.cursorFollower, { x: fx, y: fy });

      State.patch({ cursorX: cx, cursorY: cy });
      this._raf = requestAnimationFrame(animateCursor);
    };
    animateCursor();

    // Cursor states
    document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => this._setCursorState('hover'));
      el.addEventListener('mouseleave', () => this._setCursorState('default'));
    });

    document.querySelectorAll('.gallery__card').forEach(el => {
      el.addEventListener('mouseenter', () => this._setCursorState('view'));
      el.addEventListener('mouseleave', () => this._setCursorState('default'));
    });
  }

  _setCursorState(state) {
    if (!this.cursor) return;
    this.cursor.dataset.state = state;
    this.cursorFollower.dataset.state = state;

    switch (state) {
      case 'hover':
        gsap.to(this.cursor, { scale: 1.8, opacity: 0.5, duration: 0.3, ease: 'back.out' });
        gsap.to(this.cursorFollower, { scale: 0.5, duration: 0.4 });
        break;
      case 'view':
        gsap.to(this.cursor, { scale: 2.5, opacity: 0.3, duration: 0.3 });
        gsap.to(this.cursorFollower, { scale: 3, opacity: 0.08, duration: 0.4 });
        break;
      default:
        gsap.to(this.cursor, { scale: 1, opacity: 0.9, duration: 0.3 });
        gsap.to(this.cursorFollower, { scale: 1, opacity: 0.35, duration: 0.4 });
    }
  }

  // ─── CURSOR TRAIL ─────────────────────────────────────────────────
  _initCursorTrail() {
    if (State.get('isMobile')) return;

    let lastTrailTime = 0;
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastTrailTime < 40) return;
      lastTrailTime = now;

      const trail = document.createElement('div');
      trail.className = 'cursor-trail-particle';
      document.body.appendChild(trail);

      const size = 4 + Math.random() * 6;
      gsap.set(trail, {
        x: e.clientX,
        y: e.clientY,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `hsl(${300 + Math.random() * 80}, 80%, 75%)`,
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9998,
        xPercent: -50,
        yPercent: -50,
        opacity: 0.6,
      });

      gsap.to(trail, {
        opacity: 0,
        scale: 0,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => trail.remove(),
      });
    }, { passive: true });
  }

  // ─── MAGNETIC BUTTONS ─────────────────────────────────────────────
  _initMagneticButtons() {
    this.magneticEls = Array.from(document.querySelectorAll('[data-magnetic]'));

    this.magneticEls.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * 0.4;
        const dy = (e.clientY - cy) * 0.4;

        gsap.to(el, {
          x: dx,
          y: dy,
          duration: 0.5,
          ease: 'power2.out',
        });
      });

      el.addEventListener('mouseleave', () => {
        gsap.to(el, {
          x: 0, y: 0,
          duration: 0.8,
          ease: CONFIG.easing.elastic,
        });
      });
    });
  }

  // ─── RIPPLE CLICKS ────────────────────────────────────────────────
  _initRippleClicks() {
    document.addEventListener('click', (e) => {
      const ripple = document.createElement('div');
      ripple.className = 'click-ripple';
      document.body.appendChild(ripple);

      gsap.set(ripple, {
        x: e.clientX,
        y: e.clientY,
        width: 0,
        height: 0,
        opacity: 0.6,
        position: 'fixed',
        top: 0,
        left: 0,
        borderRadius: '50%',
        border: '2px solid rgba(255,200,220,0.6)',
        pointerEvents: 'none',
        zIndex: 9990,
        xPercent: -50,
        yPercent: -50,
        transform: 'translate(-50%, -50%)',
      });

      gsap.to(ripple, {
        width: 100,
        height: 100,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
        onComplete: () => ripple.remove(),
      });
    });
  }

  // ─── GALLERY HOVER ────────────────────────────────────────────────
  _initGalleryHover() {
    document.querySelectorAll('.gallery__card').forEach(card => {
      const inner = card.querySelector('.gallery__card-inner');
      const glow = card.querySelector('.gallery__glow');
      const caption = card.querySelector('.gallery__caption');

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

        gsap.to(inner, {
          rotationY: x * 14,
          rotationX: -y * 14,
          duration: 0.5,
          ease: 'power2.out',
          transformPerspective: 800,
        });

        if (glow) {
          gsap.to(glow, {
            x: x * 30,
            y: y * 30,
            opacity: 0.6,
            duration: 0.4,
          });
        }
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(inner, {
          rotationY: 0, rotationX: 0,
          duration: 0.8, ease: CONFIG.easing.elastic,
        });
        if (glow) {
          gsap.to(glow, { opacity: 0, duration: 0.5 });
        }
      });

      card.addEventListener('mouseenter', () => {
        gsap.to(card, { scale: 1.04, duration: 0.4, ease: 'back.out(1.5)' });
        if (caption) gsap.to(caption, { y: 0, opacity: 1, duration: 0.4, ease: CONFIG.easing.soft });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, { scale: 1, duration: 0.5, ease: CONFIG.easing.elastic });
        if (caption) gsap.to(caption, { y: 20, opacity: 0, duration: 0.3 });
      });
    });
  }

  // ─── BUTTON HOVERS ────────────────────────────────────────────────
  _initButtonHovers() {
    document.querySelectorAll('.btn').forEach(btn => {
      const shimmer = document.createElement('div');
      shimmer.className = 'btn-shimmer';
      btn.appendChild(shimmer);

      btn.addEventListener('mouseenter', () => {
        gsap.fromTo(shimmer,
          { x: '-120%', opacity: 0.4 },
          { x: '120%', opacity: 0, duration: 0.7, ease: 'power2.out' }
        );
      });
    });
  }

  // ─── FLOATING REACTIONS ───────────────────────────────────────────
  _initFloatingReactions() {
    const heroArea = document.querySelector('.hero');
    if (!heroArea || State.get('isMobile')) return;

    heroArea.addEventListener('dblclick', (e) => {
      const icons = ['♡', '✦', '˚', '✧', '◈'];
      for (let i = 0; i < 5; i++) {
        const float = document.createElement('div');
        float.textContent = icons[Math.floor(Math.random() * icons.length)];
        float.style.cssText = `
          position: fixed;
          left: ${e.clientX}px;
          top: ${e.clientY}px;
          font-size: ${14 + Math.random() * 16}px;
          color: hsl(${320 + Math.random() * 60}, 80%, 80%);
          pointer-events: none;
          z-index: 9999;
          transform: translate(-50%, -50%);
        `;
        document.body.appendChild(float);

        gsap.to(float, {
          y: -(80 + Math.random() * 120),
          x: (Math.random() - 0.5) * 80,
          opacity: 0,
          scale: 1.5,
          duration: 1.4 + Math.random() * 0.6,
          ease: 'power2.out',
          onComplete: () => float.remove(),
        });
      }
    });
  }

  destroy() {
    cancelAnimationFrame(this._raf);
  }
}

window.InteractionEngine = InteractionEngine;
