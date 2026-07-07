/**
 * GEIO Navigation Module - Handles menu interactions
 * Optimized to avoid layout thrashing and repaints
 */

const GEIONavigation = (() => {
  const selectors = {
    blueprint: '#blueprint-menu',
    blueprintClose: '.bp-close',
    blueprintLinks: '.bp-link',
    navLinks: '.nav-link',
    menuToggle: '.menu-toggle',
    mainNav: '#mainNav'
  };

  let blueprintOpen = false;

  // ===== BLUEPRINT MENU =====
  const blueprint = {
    element: null,

    init() {
      this.element = document.querySelector(selectors.blueprint);
      if (!this.element) return;

      // Use event delegation for better performance
      document.addEventListener('click', this.handleClick.bind(this), true);

      // ESC key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && blueprintOpen) {
          this.close();
        }
      }, { passive: true });
    },

    handleClick(e) {
      const target = e.target;

      // Check if clicked element is a blueprint link
      if (target.matches(selectors.blueprintLinks) || target.closest(selectors.blueprintLinks)) {
        this.close();
        return;
      }

      // Check for close button
      if (target.matches(selectors.blueprintClose) || target.closest(selectors.blueprintClose)) {
        this.close();
        return;
      }
    },

    open() {
      if (blueprintOpen) return;
      blueprintOpen = true;
      this.element.style.display = 'flex';
      // Use requestAnimationFrame to ensure display change is painted before animation
      requestAnimationFrame(() => {
        this.element.classList.add('open');
      });
      document.body.style.overflow = 'hidden';
    },

    close() {
      if (!blueprintOpen) return;
      blueprintOpen = false;
      this.element.classList.remove('open');
      this.element.addEventListener('transitionend', () => {
        this.element.style.display = 'none';
      }, { once: true });
      document.body.style.overflow = '';
    }
  };

  // ===== NAVIGATION LINKS =====
  const links = {
    updateActive(href) {
      const navLinks = document.querySelectorAll(selectors.navLinks);
      navLinks.forEach(link => {
        if (link.getAttribute('href') === href) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    },

    init() {
      // Use passive listeners for better scroll performance
      document.addEventListener('click', (e) => {
        if (e.target.matches(selectors.navLinks)) {
          this.updateActive(e.target.getAttribute('href'));
        }
      }, { passive: true });
    }
  };

  // ===== INITIALIZATION =====
  const init = () => {
    blueprint.init();
    links.init();
  };

  // ===== GLOBAL FUNCTIONS (for inline onclick) =====
  if (typeof window !== 'undefined') {
    window.openBlueprint = () => blueprint.open();
    window.closeBlueprint = () => blueprint.close();
  }

  return {
    init,
    blueprint,
    links
  };
})();

// Initialize on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => GEIONavigation.init());
} else {
  GEIONavigation.init();
}
