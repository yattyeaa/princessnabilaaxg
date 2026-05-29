/**
 * BUCIN — Scene Manager
 * Active section tracking, viewport logic, section transitions
 */

class SceneManager {
  constructor() {
    this.sections = [];
    this.observer = null;
    this._boundUpdate = this._update.bind(this);
  }

  init() {
    this._collectSections();
    this._initIntersectionObserver();
    this._initNavDots();
    this._initNavBar();
    this._trackProgress();
  }

  _collectSections() {
    this.sections = Array.from(document.querySelectorAll('section[data-scene]'));
  }

  _initIntersectionObserver() {
    const opts = {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.dataset.scene;
          const prev = State.get('activeSection');
          if (id !== prev) {
            State.set('prevSection', prev);
            State.set('activeSection', id);
            this._onSectionChange(id, prev);
          }
        }
      });
    }, opts);

    this.sections.forEach(s => this.observer.observe(s));
  }

  _onSectionChange(id, prev) {
    // Update nav dots
    document.querySelectorAll('.nav-dot').forEach(dot => {
      dot.classList.toggle('active', dot.dataset.target === id);
    });

    // Update nav bar bg
    const nav = document.querySelector('.nav');
    if (nav) {
      nav.classList.toggle('nav--visible', id !== 'hero');
    }

    // Trigger ambient color shift on Three.js bg
    if (window.App?.systems?.three) {
      window.App.systems.three.shiftPalette(id);
    }
  }

  _initNavDots() {
    const container = document.querySelector('.nav-dots');
    if (!container) return;

    this.sections.forEach(sec => {
      const dot = document.createElement('button');
      dot.className = 'nav-dot';
      dot.dataset.target = sec.dataset.scene;
      dot.setAttribute('aria-label', sec.dataset.scene);
      dot.addEventListener('click', () => {
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      container.appendChild(dot);
    });
  }

  _initNavBar() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 80);
    }, { passive: true });
  }

  _trackProgress() {
    // Per-section scroll progress
    this.sections.forEach(sec => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: self => {
          State._state.sectionProgress[sec.dataset.scene] = self.progress;
        },
      });
    });
  }

  _update() {}

  destroy() {
    this.observer?.disconnect();
  }
}

window.SceneManager = SceneManager;
