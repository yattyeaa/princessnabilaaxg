/**
 * BUCIN — App Controller
 * Orchestrates system initialization and lifecycle
 */

class AppController {
  constructor() {
    this.systems = {};
    this.ready = false;
  }

  async init() {
    try {
      // 1. Performance monitor first
      this.systems.perf = new PerformanceMonitor();
      this.systems.perf.start();

      // 2. Galaxy background (Canvas 2D — fast, no WebGL needed)
      this.systems.galaxy = new GalaxyBackground();
      this.systems.galaxy.init();

      // 3. Three.js ambient background (additive particles on top)
      this.systems.three = new ThreeBackground();
      await this.systems.three.init();

      // 4. Preloader
      this.systems.preloader = new Preloader();
      await this.systems.preloader.run();

      // 5. Animation engine
      this.systems.anim = new AnimationEngine();
      this.systems.anim.init();

      // 6. Scene manager
      this.systems.scene = new SceneManager();
      this.systems.scene.init();

      // 7. Interaction engine
      this.systems.interaction = new InteractionEngine();
      this.systems.interaction.init();

      // 8. Mark ready
      this.ready = true;
      State.set('initialized', true);

      // 9. Kick off hero entrance
      this.systems.anim.playHeroEntrance();

      if (CONFIG.debug) console.log('[AppController] All systems go ✓');

    } catch (err) {
      console.error('[AppController] Init failed:', err);
      // Graceful degradation: hide preloader and show content
      document.getElementById('preloader')?.classList.add('done');
      document.body.classList.add('loaded');
    }
  }

  destroy() {
    Object.values(this.systems).forEach(sys => sys?.destroy?.());
  }
}

window.App = new AppController();
