/**
 * GEIO Core Module - Lightweight utilities and initialization
 * Runs on page load - optimized for minimal blocking time
 */

const GEIOCore = (() => {
  // ===== CONFIGURATION =====
  const config = {
    scrollThrottle: 100,
    debounceWait: 150,
    animationFrameBuffer: []
  };

  // ===== VISIBILITY TRACKING =====
  // Track if page is visible to pause animations when in background
  const visibilityState = {
    isVisible: !document.hidden,
    init() {
      document.addEventListener('visibilitychange', () => {
        this.isVisible = !document.hidden;
        this.broadcast();
      }, { passive: true });
    },
    broadcast() {
      window.dispatchEvent(new CustomEvent('geio:visibility', {
        detail: { isVisible: this.isVisible }
      }));
    },
    isPageVisible() {
      return this.isVisible;
    }
  };

  // ===== SCROLL POSITION TRACKING =====
  // Use passive listeners to prevent blocking scroll
  const scrollState = {
    position: 0,
    direction: 'down',
    prevPosition: 0,
    listeners: [],

    init() {
      window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
    },

    onScroll() {
      this.position = window.scrollY;
      this.direction = this.position > this.prevPosition ? 'down' : 'up';
      this.prevPosition = this.position;
      this.notifyListeners();
    },

    addListener(callback) {
      this.listeners.push(callback);
      return () => {
        this.listeners = this.listeners.filter(cb => cb !== callback);
      };
    },

    notifyListeners() {
      // Throttle listener calls to prevent excessive function invocations
      if (!this.throttling) {
        this.throttling = true;
        this.listeners.forEach(cb => {
          try {
            cb({
              position: this.position,
              direction: this.direction
            });
          } catch (e) {
            console.error('Scroll listener error:', e);
          }
        });
        setTimeout(() => {
          this.throttling = false;
        }, config.scrollThrottle);
      }
    }
  };

  // ===== EVENT DEBOUNCING & THROTTLING =====
  const timing = {
    debounce(fn, wait) {
      let timeoutId = null;
      return function debounced(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), wait);
      };
    },

    throttle(fn, wait) {
      let timeoutId = null;
      let lastRun = 0;
      return function throttled(...args) {
        const now = Date.now();
        if (now - lastRun >= wait) {
          fn.apply(this, args);
          lastRun = now;
        } else {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => fn.apply(this, args), wait - (now - lastRun));
        }
      };
    },

    // Schedule non-critical work during idle time
    scheduleIdleTask(callback) {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 2000 });
      } else {
        setTimeout(callback, 0);
      }
    }
  };

  // ===== LAZY ELEMENT DETECTION =====
  // Only initialize observers for elements that are actually in the document
  const elementDetection = {
    observer: null,
    callbacks: new Map(),

    init() {
      // Use IntersectionObserver for efficient visibility detection
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const id = entry.target.id;
          if (this.callbacks.has(id)) {
            const { onVisible, onHidden } = this.callbacks.get(id);
            if (entry.isIntersecting && onVisible) {
              onVisible();
            } else if (!entry.isIntersecting && onHidden) {
              onHidden();
            }
          }
        });
      }, {
        threshold: 0.01,
        rootMargin: '50px'
      });
    },

    observe(element, callbacks) {
      if (!element) return;
      element.id = element.id || `element-${Math.random().toString(36).substr(2, 9)}`;
      this.callbacks.set(element.id, callbacks);
      this.observer.observe(element);
    },

    unobserve(element) {
      if (!element) return;
      this.observer.unobserve(element);
      this.callbacks.delete(element.id);
    }
  };

  // ===== CLICK DELEGATION =====
  // Centralized event handler to reduce number of listeners
  const delegatedEvents = {
    handlers: new Map(),

    init() {
      document.addEventListener('click', this.handleClick.bind(this), true);
    },

    on(selector, callback) {
      if (!this.handlers.has(selector)) {
        this.handlers.set(selector, []);
      }
      this.handlers.get(selector).push(callback);
    },

    handleClick(event) {
      this.handlers.forEach((callbacks, selector) => {
        if (event.target.matches(selector)) {
          callbacks.forEach(cb => {
            try {
              cb(event);
            } catch (e) {
              console.error('Click handler error:', e);
            }
          });
        }
      });
    }
  };

  // ===== INITIALIZATION =====
  const init = () => {
    // Initialize in priority order
    visibilityState.init();
    scrollState.init();
    elementDetection.init();
    delegatedEvents.init();

    // Schedule non-critical initialization during idle time
    timing.scheduleIdleTask(() => {
      console.log('[GEIO Core] Ready - TBT optimized');
    });
  };

  // ===== PUBLIC API =====
  return {
    init,
    visibility: visibilityState,
    scroll: scrollState,
    timing,
    elements: elementDetection,
    events: delegatedEvents,
    config
  };
})();

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => GEIOCore.init());
} else {
  GEIOCore.init();
}
