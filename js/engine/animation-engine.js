/**
 * BUCIN — Animation Engine
 * GSAP orchestration, reusable timelines, cinematic utilities
 */

class AnimationEngine {
  constructor() {
    this.timelines = new Map();
    this.splitInstances = [];
    this._scrollTriggers = [];
  }

  init() {
    this._registerGSAPPlugins();
    this._initLenis();
    this._buildScrollAnimations();
    this._buildTimelineSection();
    this._buildGalleryAnimations();
    this._buildLoveLetterAnimation();
    this._buildFinalSection();
  }

  _registerGSAPPlugins() {
    gsap.registerPlugin(ScrollTrigger, TextPlugin);
    gsap.config({ nullTargetWarn: false });

    // Custom romantic ease
    CustomEase.create('romantic', 'M0,0 C0.14,0 0.242,0.438 0.272,0.561 0.313,0.728 0.354,0.963 1,1');
    CustomEase.create('silk', 'M0,0 C0.03,0 0.04,0.04 0.1,0.2 0.2,0.5 0.3,0.8 1,1');
  }

  _initLenis() {
    if (State.get('prefersReducedMotion')) return;

    this.lenis = new Lenis({
      duration: 1.4,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    this.lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      this.lenis?.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  // ─── HERO ENTRANCE ────────────────────────────────────────────────
  playHeroEntrance() {
    const tl = gsap.timeline({ delay: 0.3 });
    this.timelines.set('hero', tl);

    const heroSection = document.querySelector('.hero');
    const badge = document.querySelector('.hero__badge');
    const headlineLines = document.querySelectorAll('.hero__headline .line');
    const sub = document.querySelector('.hero__sub');
    const cta = document.querySelector('.hero__cta');
    const scroll = document.querySelector('.hero__scroll-hint');

    // Set initial states
    gsap.set([badge, headlineLines, sub, cta, scroll], {
      opacity: 0,
      y: 40,
      filter: 'blur(12px)',
    });
    gsap.set(heroSection, { opacity: 0 });

    tl
      .to(heroSection, { opacity: 1, duration: 0.01 })
      .to(badge, {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 1.1, ease: 'silk',
      })
      .to(headlineLines, {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 1.4, ease: 'romantic',
        stagger: 0.18,
      }, '-=0.7')
      .to(sub, {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 1.2, ease: CONFIG.easing.soft,
      }, '-=0.9')
      .to(cta, {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 1.0, ease: CONFIG.easing.soft,
      }, '-=0.8')
      .to(scroll, {
        opacity: 0.5, y: 0, filter: 'blur(0px)',
        duration: 0.8, ease: CONFIG.easing.soft,
      }, '-=0.5');

    // Ambient floating for headline
    gsap.to('.hero__headline', {
      y: -8,
      duration: 4,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: 2.5,
    });
  }

  // ─── SCROLL-TRIGGERED ANIMATIONS ─────────────────────────────────
  _buildScrollAnimations() {
    // Section headings generic reveal
    document.querySelectorAll('[data-reveal]').forEach(el => {
      const type = el.dataset.reveal || 'fade-up';
      let from = {};

      switch (type) {
        case 'fade-up':    from = { opacity: 0, y: 60, filter: 'blur(8px)' }; break;
        case 'fade-left':  from = { opacity: 0, x: -60, filter: 'blur(6px)' }; break;
        case 'fade-right': from = { opacity: 0, x: 60, filter: 'blur(6px)' }; break;
        case 'scale':      from = { opacity: 0, scale: 0.85, filter: 'blur(10px)' }; break;
        case 'letter':     this._buildLetterReveal(el); return;
      }

      gsap.set(el, from);
      const trigger = ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => {
          gsap.to(el, {
            opacity: 1, y: 0, x: 0,
            scale: 1, filter: 'blur(0px)',
            duration: 1.2,
            ease: CONFIG.easing.silk,
          });
        },
        once: true,
      });
      this._scrollTriggers.push(trigger);
    });
  }

  _buildLetterReveal(el) {
    const text = el.textContent;
    el.innerHTML = '';
    [...text].forEach(char => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.cssText = 'display:inline-block;opacity:0;transform:translateY(40px) rotate(-8deg);';
      el.appendChild(span);
    });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 82%',
      onEnter: () => {
        gsap.to(el.querySelectorAll('span'), {
          opacity: 1, y: 0, rotation: 0,
          duration: 0.7, ease: CONFIG.easing.bounce,
          stagger: 0.04,
        });
      },
      once: true,
    });
    this._scrollTriggers.push(trigger);
  }

  // ─── TIMELINE SECTION ─────────────────────────────────────────────
  _buildTimelineSection() {
    const items = document.querySelectorAll('.timeline__item');

    items.forEach((item, i) => {
      const card = item.querySelector('.timeline__card');
      const icon = item.querySelector('.timeline__icon');
      const isLeft = i % 2 === 0;

      gsap.set(card, {
        opacity: 0,
        x: isLeft ? -80 : 80,
        filter: 'blur(12px)',
        rotationY: isLeft ? -15 : 15,
      });
      gsap.set(icon, { opacity: 0, scale: 0, rotation: 180 });

      const trigger = ScrollTrigger.create({
        trigger: item,
        start: 'top 78%',
        onEnter: () => {
          const tl = gsap.timeline();
          tl.to(icon, {
            opacity: 1, scale: 1, rotation: 0,
            duration: 0.8, ease: CONFIG.easing.elastic,
          })
          .to(card, {
            opacity: 1, x: 0, filter: 'blur(0px)', rotationY: 0,
            duration: 1.3, ease: 'romantic',
          }, '-=0.5');
        },
        once: true,
      });
      this._scrollTriggers.push(trigger);
    });

    // Glow line draw animation
    const line = document.querySelector('.timeline__glow-line');
    if (line) {
      ScrollTrigger.create({
        trigger: '.timeline',
        start: 'top 70%',
        end: 'bottom 30%',
        onUpdate: (self) => {
          gsap.set(line, { scaleY: self.progress, transformOrigin: 'top center' });
        },
      });
    }
  }

  // ─── GALLERY ──────────────────────────────────────────────────────
  _buildGalleryAnimations() {
    const cards = document.querySelectorAll('.gallery__card');

    cards.forEach((card, i) => {
      gsap.set(card, {
        opacity: 0,
        y: 80,
        scale: 0.88,
        filter: 'blur(14px)',
      });

      const trigger = ScrollTrigger.create({
        trigger: card,
        start: 'top 88%',
        onEnter: () => {
          gsap.to(card, {
            opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
            duration: 1.2,
            ease: 'romantic',
            delay: (i % 3) * 0.12,
          });
        },
        once: true,
      });
      this._scrollTriggers.push(trigger);
    });
  }

  // ─── LOVE LETTER ──────────────────────────────────────────────────
  _buildLoveLetterAnimation() {
    const letter = document.querySelector('.letter__body');
    if (!letter) return;

    const paragraphs = letter.querySelectorAll('p');
    gsap.set(paragraphs, { opacity: 0, y: 30, filter: 'blur(6px)' });

    const trigger = ScrollTrigger.create({
      trigger: letter,
      start: 'top 75%',
      onEnter: () => {
        gsap.to(paragraphs, {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: 1.5,
          ease: CONFIG.easing.silk,
          stagger: 0.4,
        });
      },
      once: true,
    });
    this._scrollTriggers.push(trigger);

    // Spotlight effect on scroll
    ScrollTrigger.create({
      trigger: '.love-letter',
      start: 'top center',
      end: 'bottom center',
      onUpdate: self => {
        const spot = document.querySelector('.letter__spotlight');
        if (spot) {
          gsap.set(spot, {
            opacity: 0.15 + self.progress * 0.4,
          });
        }
      },
    });
  }

  // ─── FINAL SECTION ────────────────────────────────────────────────
  _buildFinalSection() {
    const finale = document.querySelector('.finale');
    if (!finale) return;

    const quote = finale.querySelector('.finale__quote');
    const sub = finale.querySelector('.finale__sub');
    const heart = finale.querySelector('.finale__heart');

    gsap.set([quote, sub, heart], { opacity: 0 });

    const trigger = ScrollTrigger.create({
      trigger: finale,
      start: 'top 60%',
      onEnter: () => {
        const tl = gsap.timeline();
        tl.to(heart, {
          opacity: 1, scale: 1,
          duration: 1.2, ease: CONFIG.easing.elastic,
        })
        .to(quote, {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: 2, ease: CONFIG.easing.silk,
        }, '-=0.5')
        .to(sub, {
          opacity: 1,
          duration: 1.5, ease: CONFIG.easing.soft,
        }, '-=1');
      },
      once: true,
    });

    // Particle explosion on finale enter
    ScrollTrigger.create({
      trigger: finale,
      start: 'top 65%',
      onEnter: () => {
        this._burstHeartParticles(finale);
      },
      once: true,
    });

    this._scrollTriggers.push(trigger);
  }

  // ─── HEART PARTICLE BURST ─────────────────────────────────────────
  _burstHeartParticles(container) {
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('div');
      p.className = 'heart-particle';
      p.textContent = ['♡', '✦', '◈', '✧', '★'][Math.floor(Math.random() * 5)];
      container.appendChild(p);

      const angle = (Math.random() * Math.PI * 2);
      const dist = 80 + Math.random() * 200;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      const size = 0.5 + Math.random() * 1.5;

      gsap.set(p, {
        position: 'absolute',
        left: '50%',
        top: '40%',
        opacity: 1,
        scale: size,
        x: 0, y: 0,
        fontSize: '20px',
        color: `hsl(${320 + Math.random() * 60}, 80%, 75%)`,
        pointerEvents: 'none',
        zIndex: 50,
      });

      gsap.to(p, {
        x, y,
        opacity: 0,
        scale: 0,
        duration: 1.8 + Math.random() * 1.2,
        ease: 'power2.out',
        delay: Math.random() * 0.6,
        onComplete: () => p.remove(),
      });
    }
  }

  destroy() {
    this._scrollTriggers.forEach(t => t?.kill());
    this.timelines.forEach(tl => tl?.kill());
    this.lenis?.destroy();
  }
}

window.AnimationEngine = AnimationEngine;
