/**
 * Scroll-Triggered Animation Controller
 * Uses IntersectionObserver to trigger animations on scroll
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    animateSelector: '[data-animate]',
    threshold: 0.2,
    rootMargin: '-50px',
    activeClass: 'active',
    staggerDelay: 100 // Milliseconds between child animations
  };

  // Supported animation types
  const ANIMATION_TYPES = [
    'fade-in',
    'slide-left',
    'slide-right',
    'zoom-in',
    'rotate-in'
  ];

  /**
   * Create IntersectionObserver
   */
  function createObserver(callback) {
    return new IntersectionObserver(callback, {
      threshold: CONFIG.threshold,
      rootMargin: CONFIG.rootMargin
    });
  }

  /**
   * Get stagger delay for child elements
   */
  function getStaggerDelay(index) {
    return index * CONFIG.staggerDelay;
  }

  /**
   * Apply staggered animations to children
   */
  function applyStaggeredAnimations(element) {
    const children = element.querySelectorAll('[data-animate-child]');

    if (children.length === 0) return;

    children.forEach((child, index) => {
      const delay = getStaggerDelay(index);
      child.style.transitionDelay = `${delay}ms`;

      // Add active class after delay
      setTimeout(() => {
        child.classList.add(CONFIG.activeClass);
      }, delay);
    });
  }

  /**
   * Handle intersection
   */
  function handleIntersection(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;

        // Add active class to trigger CSS animations
        element.classList.add(CONFIG.activeClass);

        // Apply staggered animations to children if present
        applyStaggeredAnimations(element);

        // Disconnect observer for this element (performance optimization)
        observer.unobserve(element);
      }
    });
  }

  /**
   * Validate animation type
   */
  function validateAnimationType(type) {
    if (!type) return false;

    const types = type.split(' ');
    return types.some(t => ANIMATION_TYPES.includes(t));
  }

  /**
   * Initialize scroll animations
   */
  function init() {
    // Check for IntersectionObserver support
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported. Animations will not trigger on scroll.');
      // Fallback: add active class to all elements immediately
      const elements = document.querySelectorAll(CONFIG.animateSelector);
      elements.forEach(el => el.classList.add(CONFIG.activeClass));
      return;
    }

    // Get all elements with data-animate attribute
    const elements = document.querySelectorAll(CONFIG.animateSelector);

    if (elements.length === 0) {
      console.info('No elements with data-animate attribute found');
      return;
    }

    // Create observer
    const observer = createObserver(handleIntersection);

    // Observe each element
    elements.forEach(element => {
      const animationType = element.getAttribute('data-animate');

      // Validate animation type
      if (!validateAnimationType(animationType)) {
        console.warn(`Invalid animation type: ${animationType}. Supported types: ${ANIMATION_TYPES.join(', ')}`);
        return;
      }

      // Start observing
      observer.observe(element);
    });

    console.info(`Scroll animation controller initialized. Observing ${elements.length} elements.`);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
