/**
 * GEIO Animations Module - GPU-accelerated animations with visibility control
 * Only runs when element is visible to reduce unnecessary main-thread work
 * Lazy loaded - use requestIdleCallback to defer until after critical rendering
 */

const GEIOAnimations = (() => {
  // ===== ANIMATION CONFIG =====
  const config = {
    enableAnimations: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    useGPU: true // Use transform/opacity for GPU acceleration
  };

  // ===== VISIBILITY-BASED ANIMATION CONTROL =====
  const visibilityControl = {
    animatingElements: new Map(),
    currentlyVisible: new Set(),

    init() {
      // Use Intersection Observer to track visible elements
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.currentlyVisible.add(entry.target);
            this.resumeAnimations(entry.target);
          } else {
            this.currentlyVisible.delete(entry.target);
            this.pauseAnimations(entry.target);
          }
        });
      }, { threshold: 0.1 });

      // Also listen to page visibility
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pauseAllAnimations();
        } else {
          this.resumeAllAnimations();
        }
      }, { passive: true });
    },

    register(element, animationState) {
      this.animatingElements.set(element, animationState);
      this.observer.observe(element);
    },

    resumeAnimations(element) {
      const state = this.animatingElements.get(element);
      if (state) {
        state.isPaused = false;
        if (state.animation) {
          state.animation.resume?.();
        }
      }
    },

    pauseAnimations(element) {
      const state = this.animatingElements.get(element);
      if (state) {
        state.isPaused = true;
        if (state.animation) {
          state.animation.pause?.();
        }
      }
    },

    pauseAllAnimations() {
      this.animatingElements.forEach(state => {
        state.isPaused = true;
        if (state.animation?.pause) {
          state.animation.pause();
        }
      });
    },

    resumeAllAnimations() {
      this.animatingElements.forEach(state => {
        state.isPaused = false;
        if (state.animation?.resume) {
          state.animation.resume();
        }
      });
    }
  };

  // ===== SIMPLE FADE-IN ANIMATIONS (CSS + JS hybrid) =====
  const fadeInAnimations = {
    init() {
      if (!config.enableAnimations) return;

      const elements = document.querySelectorAll('[data-animate-fade-in]');
      elements.forEach(el => {
        visibilityControl.register(el, { animation: null });
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.style.animation = 'fadeInUp 0.7s ease-out forwards';
              this.observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });
        this.observer.observe(el);
      });
    }
  };

  // ===== BUTTON HOVER EFFECTS (GPU-accelerated with will-change) =====
  const buttonEffects = {
    init() {
      const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
      buttons.forEach(btn => {
        btn.style.willChange = 'transform, box-shadow';
        btn.addEventListener('mouseenter', () => {
          btn.style.transform = 'translateY(-2px)';
        }, { passive: true });
        btn.addEventListener('mouseleave', () => {
          btn.style.transform = 'translateY(0)';
        }, { passive: true });
      });
    }
  };

  // ===== SCROLL-TRIGGERED ANIMATIONS (Optimized with requestAnimationFrame) =====
  const scrollAnimations = {
    elements: [],
    animationFrameId: null,
    scrolling: false,

    register(selector, callback) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        this.elements.push({ el, callback, triggered: false });
      });
    },

    init() {
      window.addEventListener('scroll', () => {
        if (!this.scrolling) {
          this.scrolling = true;
          this.animationFrameId = requestAnimationFrame(() => {
            this.checkElements();
            this.scrolling = false;
          });
        }
      }, { passive: true });
    },

    checkElements() {
      this.elements.forEach(({ el, callback, triggered }) => {
        if (!triggered) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.9) {
            callback(el);
            triggered = true;
          }
        }
      });
    }
  };

  // ===== MICRO-ANIMATIONS (No blocking) =====
  const microAnimations = {
    pulse: (element, duration = 1000) => {
      element.style.animation = `pulse-glow 3s ease-in-out infinite`;
    },

    bounce: (element, duration = 500) => {
      element.style.animation = `bounce ${duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`;
    }
  };

  // ===== CRITICAL CSS ANIMATIONS (Inline in HTML already) =====
  const criticalAnimations = () => {
    // These run from inline CSS - no JS needed
    // - fadeInUp: Hero title entrance
    // - pulse-glow: CTA button pulse
    // - scanline: Background effect
  };

  // ===== INITIALIZATION =====
  const init = () => {
    if (!config.enableAnimations) return;

    visibilityControl.init();
    fadeInAnimations.init();
    buttonEffects.init();
    scrollAnimations.init();
    criticalAnimations();

    console.log('[GEIO Animations] Initialized with GPU acceleration');
  };

  return {
    init,
    visibility: visibilityControl,
    microAnimations,
    config
  };
})();

// Lazy load animations after critical content
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => GEIOAnimations.init(), { timeout: 5000 });
} else {
  window.addEventListener('load', () => {
    setTimeout(() => GEIOAnimations.init(), 1000);
  }, { once: true });
}
