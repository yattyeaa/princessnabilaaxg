/**
 * BUCIN — Reactive Global State
 */

class StateManager {
  constructor() {
    this._state = {
      // App lifecycle
      loaded: false,
      preloaderDone: false,
      initialized: false,

      // Device
      isMobile: window.innerWidth <= CONFIG.breakpoints.mobile,
      isTablet: window.innerWidth > CONFIG.breakpoints.mobile && window.innerWidth <= CONFIG.breakpoints.tablet,
      isDesktop: window.innerWidth > CONFIG.breakpoints.tablet,
      touchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,

      // Viewport
      vw: window.innerWidth,
      vh: window.innerHeight,

      // Scroll
      scrollY: 0,
      scrollDir: 'down',
      scrollVelocity: 0,
      lastScrollY: 0,

      // Mouse / Touch
      mouseX: 0,
      mouseY: 0,
      mouseNormX: 0,
      mouseNormY: 0,
      mouseDeltaX: 0,
      mouseDeltaY: 0,

      // Scene
      activeSection: 'hero',
      prevSection: null,
      sectionProgress: {},

      // Performance
      fps: 60,
      qualityLevel: 3,  // 3=high, 2=med, 1=low
      performanceDegraded: false,

      // Audio
      audioEnabled: false,
      audioPlaying: false,

      // UI
      cursorX: 0,
      cursorY: 0,
      cursorFollowerX: 0,
      cursorFollowerY: 0,
    };

    this._subscribers = new Map();
    this._prevState = { ...this._state };
  }

  get(key) {
    return key ? this._state[key] : { ...this._state };
  }

  set(key, value) {
    if (this._state[key] === value) return;
    this._prevState[key] = this._state[key];
    this._state[key] = value;
    this._notify(key, value, this._prevState[key]);
  }

  patch(updates) {
    Object.entries(updates).forEach(([key, value]) => this.set(key, value));
  }

  subscribe(key, callback) {
    if (!this._subscribers.has(key)) {
      this._subscribers.set(key, new Set());
    }
    this._subscribers.get(key).add(callback);
    return () => this._subscribers.get(key)?.delete(callback);
  }

  _notify(key, newVal, oldVal) {
    this._subscribers.get(key)?.forEach(cb => cb(newVal, oldVal));
    this._subscribers.get('*')?.forEach(cb => cb(key, newVal, oldVal));
  }

  // Derived helpers
  get particleConfig() {
    if (this._state.isMobile) return CONFIG.particles.mobile;
    if (this._state.isTablet) return CONFIG.particles.tablet;
    return CONFIG.particles.desktop;
  }

  get orbCount() {
    if (this._state.isMobile) return CONFIG.three.orbs.mobile;
    return CONFIG.three.orbs.desktop;
  }
}

window.State = new StateManager();

// Auto-update on resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    State.patch({
      vw,
      vh,
      isMobile: vw <= CONFIG.breakpoints.mobile,
      isTablet: vw > CONFIG.breakpoints.mobile && vw <= CONFIG.breakpoints.tablet,
      isDesktop: vw > CONFIG.breakpoints.tablet,
    });
  }, 100);
});

// Auto-update scroll
window.addEventListener('scroll', () => {
  const sy = window.scrollY;
  const delta = sy - State.get('lastScrollY');
  State.patch({
    scrollY: sy,
    scrollDir: delta >= 0 ? 'down' : 'up',
    scrollVelocity: Math.abs(delta),
    lastScrollY: sy,
  });
}, { passive: true });

// Auto-update mouse
window.addEventListener('mousemove', (e) => {
  const mx = e.clientX;
  const my = e.clientY;
  State.patch({
    mouseX: mx,
    mouseY: my,
    mouseNormX: (mx / window.innerWidth) * 2 - 1,
    mouseNormY: -(my / window.innerHeight) * 2 + 1,
    mouseDeltaX: mx - State.get('mouseX'),
    mouseDeltaY: my - State.get('mouseY'),
  });
}, { passive: true });
