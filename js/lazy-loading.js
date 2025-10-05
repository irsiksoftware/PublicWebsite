// Lazy Loading with Intersection Observer
// Optimizes image loading performance by loading images only when they enter the viewport

(function() {
  'use strict';

  // Configuration
  const config = {
    threshold: 0.1,
    rootMargin: '50px'
  };

  // Check for IntersectionObserver support
  const supportsIntersectionObserver = 'IntersectionObserver' in window;

  /**
   * Callback when image intersects with viewport
   * @param {IntersectionObserverEntry[]} entries - Array of intersection entries
   * @param {IntersectionObserver} observer - The observer instance
   */
  function onIntersect(entries, observer) {
    entries.forEach(entry => {
      // Check if element is intersecting
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;

        if (src) {
          // Load the image
          img.src = src;

          // Add loaded class for fade-in animation
          img.classList.add('loaded');

          // Disconnect observer for this image after load
          observer.unobserve(img);
        }
      }
    });
  }

  /**
   * Fallback for browsers without IntersectionObserver support
   * Loads all images immediately
   */
  function fallbackLoad() {
    const lazyImages = document.querySelectorAll('img[data-src]');

    lazyImages.forEach(img => {
      const src = img.dataset.src;
      if (src) {
        img.src = src;
        img.classList.add('loaded');
      }
    });
  }

  /**
   * Initialize lazy loading
   */
  function initLazyLoading() {
    // Get all images with data-src attribute
    const lazyImages = document.querySelectorAll('img[data-src]');

    if (lazyImages.length === 0) {
      return; // No images to lazy load
    }

    if (supportsIntersectionObserver) {
      // Create IntersectionObserver
      const observer = new IntersectionObserver(onIntersect, config);

      // Observe all lazy images
      lazyImages.forEach(img => {
        observer.observe(img);
      });
    } else {
      // Fallback for old browsers: immediate load
      fallbackLoad();
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLazyLoading);
  } else {
    initLazyLoading();
  }
})();
