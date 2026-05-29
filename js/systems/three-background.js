/**
 * BUCIN — Three.js Ambient Background
 * Floating particles, glowing orbs, mouse-reactive cinematic atmosphere
 */

class ThreeBackground {
  constructor() {
    this.canvas = document.getElementById('three-canvas');
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.particles = null;
    this.orbs = [];
    this.clock = null;
    this._raf = null;
    this._mouseX = 0;
    this._mouseY = 0;
    this._targetCamX = 0;
    this._targetCamY = 0;
    this._palette = 'hero';

    // Palette definitions
    this._palettes = {
      hero:        { primary: [1.0, 0.4, 0.6], secondary: [0.5, 0.2, 0.9], bg: 0x03000a },
      timeline:    { primary: [0.8, 0.3, 1.0], secondary: [0.2, 0.5, 0.9], bg: 0x010515 },
      gallery:     { primary: [1.0, 0.6, 0.3], secondary: [0.8, 0.2, 0.8], bg: 0x080206 },
      'love-letter': { primary: [1.0, 0.3, 0.5], secondary: [0.9, 0.5, 0.7], bg: 0x080010 },
      finale:      { primary: [1.0, 0.5, 0.7], secondary: [0.6, 0.3, 1.0], bg: 0x030008 },
    };
  }

  async init() {
    if (!window.THREE) return;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x030008, 0.04);

    this.clock = new THREE.Clock();

    this._initCamera();
    this._initRenderer();
    this._buildParticles();
    this._buildOrbs();
    this._bindMouse();
    this._bindResize();
    this._render();
  }

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.three.fov,
      window.innerWidth / window.innerHeight,
      CONFIG.three.near,
      CONFIG.three.far
    );
    this.camera.position.z = CONFIG.three.cameraZ;
  }

  _initRenderer() {
    if (!this.canvas) return;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
  }

  _buildParticles() {
    const cfg = State.particleConfig;
    const count = cfg.count;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Spherical distribution with some clustering
      const r = 3 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi) - 2;

      // Pink / purple / white palette
      const variant = Math.random();
      if (variant < 0.4) {
        colors[i3] = 1.0; colors[i3+1] = 0.5 + Math.random() * 0.3; colors[i3+2] = 0.7 + Math.random() * 0.3;
      } else if (variant < 0.7) {
        colors[i3] = 0.6 + Math.random() * 0.3; colors[i3+1] = 0.2; colors[i3+2] = 1.0;
      } else {
        colors[i3] = 1.0; colors[i3+1] = 1.0; colors[i3+2] = 1.0;
      }

      sizes[i] = cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]);
      speeds[i] = 0.1 + Math.random() * 0.6;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.045,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);

    // Store originals for animation
    this._origPositions = Float32Array.from(positions);
    this._particleCount = count;
  }

  _buildOrbs() {
    const count = State.orbCount;

    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.1 + Math.random() * 0.3, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.85 + Math.random() * 0.2, 0.9, 0.5),
        transparent: true,
        opacity: 0.03 + Math.random() * 0.04,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const orb = new THREE.Mesh(geo, mat);
      orb.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8,
        -2 - Math.random() * 4
      );

      // Store animation params
      orb.userData = {
        ox: orb.position.x,
        oy: orb.position.y,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.3,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.5 + Math.random() * 1.0,
        baseOpacity: mat.opacity,
      };

      this.orbs.push(orb);
      this.scene.add(orb);
    }
  }

  _bindMouse() {
    window.addEventListener('mousemove', (e) => {
      this._mouseX = (e.clientX / window.innerWidth - 0.5) * CONFIG.three.mouseInfluence;
      this._mouseY = -(e.clientY / window.innerHeight - 0.5) * CONFIG.three.mouseInfluence;
    }, { passive: true });
  }

  _bindResize() {
    window.addEventListener('resize', () => {
      if (!this.renderer || !this.camera) return;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }, { passive: true });
  }

  _render() {
    const animate = () => {
      this._raf = requestAnimationFrame(animate);
      const t = this.clock.getElapsedTime();
      const dt = this.clock.getDelta();

      this._updateParticles(t);
      this._updateOrbs(t);
      this._updateCamera(t);

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    animate();
  }

  _updateParticles(t) {
    if (!this.particles) return;
    const pos = this.particles.geometry.attributes.position;
    const orig = this._origPositions;
    const count = this._particleCount;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Gentle float
      const phase = (i / count) * Math.PI * 2;
      pos.array[i3 + 1] = orig[i3 + 1] + Math.sin(t * 0.3 + phase) * 0.25;
      pos.array[i3]     = orig[i3]     + Math.cos(t * 0.2 + phase * 1.3) * 0.15;
    }

    pos.needsUpdate = true;
    this.particles.rotation.y = t * 0.015;
    this.particles.rotation.x = t * 0.008;
  }

  _updateOrbs(t) {
    this.orbs.forEach((orb, i) => {
      const u = orb.userData;
      orb.position.x = u.ox + Math.sin(t * u.speedX + u.phase) * 1.5;
      orb.position.y = u.oy + Math.cos(t * u.speedY + u.phase * 0.7) * 1.2;
      orb.material.opacity = u.baseOpacity + Math.sin(t * u.pulseSpeed + u.phase) * u.baseOpacity * 0.5;
    });
  }

  _updateCamera(t) {
    this._targetCamX += (this._mouseX - this._targetCamX) * 0.05;
    this._targetCamY += (this._mouseY - this._targetCamY) * 0.05;

    const scrollInfluence = window.scrollY * CONFIG.three.scrollInfluence;

    this.camera.position.x = this._targetCamX * 2;
    this.camera.position.y = this._targetCamY * 2 - scrollInfluence * 0.5;
    this.camera.position.z = CONFIG.three.cameraZ + Math.sin(t * 0.1) * 0.3;
    this.camera.lookAt(0, 0, 0);
  }

  shiftPalette(sectionId) {
    const pal = this._palettes[sectionId] || this._palettes['hero'];
    if (!pal) return;

    // Shift particle colors
    if (this.particles) {
      const colors = this.particles.geometry.attributes.color;
      const count = this._particleCount;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const blend = 0.3;
        const variant = Math.random();
        if (variant < 0.5) {
          colors.array[i3]     += (pal.primary[0]   - colors.array[i3])     * blend;
          colors.array[i3 + 1] += (pal.primary[1]   - colors.array[i3 + 1]) * blend;
          colors.array[i3 + 2] += (pal.primary[2]   - colors.array[i3 + 2]) * blend;
        }
      }
      colors.needsUpdate = true;
    }
  }

  reduceQuality(level) {
    if (this.renderer) {
      this.renderer.setPixelRatio(level <= 1 ? 1 : Math.min(window.devicePixelRatio, 1.5));
    }
    // Hide half the orbs
    this.orbs.forEach((orb, i) => {
      if (i >= this.orbs.length / 2) orb.visible = false;
    });
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    this.renderer?.dispose();
  }
}

window.ThreeBackground = ThreeBackground;
