/**
 * BUCIN — Performance Monitor
 * FPS tracking and adaptive quality degradation
 */

class PerformanceMonitor {
  constructor() {
    this._samples = [];
    this._lastTime = performance.now();
    this._frameCount = 0;
    this._raf = null;
    this._level = 3; // Start at max quality
    this._checkInterval = null;
  }

  start() {
    this._measure();
    this._checkInterval = setInterval(() => this._evaluate(), 4000);
  }

  _measure() {
    const now = performance.now();
    const delta = now - this._lastTime;
    this._lastTime = now;

    if (delta > 0) {
      const fps = 1000 / delta;
      this._samples.push(fps);
      if (this._samples.length > 60) this._samples.shift();
    }

    this._raf = requestAnimationFrame(() => this._measure());
  }

  _evaluate() {
    if (this._samples.length < 20) return;

    const avg = this._samples.reduce((a, b) => a + b, 0) / this._samples.length;
    State.set('fps', Math.round(avg));

    if (avg < CONFIG.performance.fpsLow && this._level > 1) {
      this._level--;
      this._degradeQuality(this._level);
    } else if (avg >= CONFIG.performance.fpsTarget - 5 && this._level < 3) {
      this._level++;
      this._upgradeQuality(this._level);
    }
  }

  _degradeQuality(level) {
    State.set('qualityLevel', level);
    State.set('performanceDegraded', true);

    document.documentElement.dataset.quality = level;

    if (level <= 1) {
      // Disable heavy effects
      document.querySelectorAll('.grain-overlay, .noise-overlay').forEach(el => {
        el.style.display = 'none';
      });
      // Reduce particle count
      if (window.App?.systems?.three) {
        window.App.systems.three.reduceQuality(level);
      }
    }

    if (CONFIG.debug) console.log(`[Perf] Quality degraded to level ${level}, FPS: ${State.get('fps')}`);
  }

  _upgradeQuality(level) {
    State.set('qualityLevel', level);
    document.documentElement.dataset.quality = level;
    if (CONFIG.debug) console.log(`[Perf] Quality upgraded to level ${level}`);
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    clearInterval(this._checkInterval);
  }
}

window.PerformanceMonitor = PerformanceMonitor;
