/**
 * Web Animations API Controller
 * Provides reusable animation functions using the Web Animations API
 * Replaces CSS transitions with JavaScript-based animations for more control
 */

(function() {
  'use strict';

  // Check for Web Animations API support
  const hasWebAnimationsSupport = 'animate' in Element.prototype;

  /**
   * Animation presets for common effects
   */
  const ANIMATION_PRESETS = {
    fadeIn: {
      keyframes: [
        { opacity: 0 },
        { opacity: 1 }
      ],
      options: {
        duration: 600,
        easing: 'ease-out',
        fill: 'forwards'
      }
    },
    slideIn: {
      keyframes: [
        { transform: 'translateY(50px)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 }
      ],
      options: {
        duration: 600,
        easing: 'ease-out',
        fill: 'forwards'
      }
    },
    scaleUp: {
      keyframes: [
        { transform: 'scale(0.8)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 }
      ],
      options: {
        duration: 600,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        fill: 'forwards'
      }
    },
    slideLeft: {
      keyframes: [
        { transform: 'translateX(50px)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
      ],
      options: {
        duration: 600,
        easing: 'ease-out',
        fill: 'forwards'
      }
    },
    slideRight: {
      keyframes: [
        { transform: 'translateX(-50px)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
      ],
      options: {
        duration: 600,
        easing: 'ease-out',
        fill: 'forwards'
      }
    },
    zoomIn: {
      keyframes: [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 }
      ],
      options: {
        duration: 500,
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        fill: 'forwards'
      }
    },
    rotateIn: {
      keyframes: [
        { transform: 'rotate(-180deg) scale(0)', opacity: 0 },
        { transform: 'rotate(0) scale(1)', opacity: 1 }
      ],
      options: {
        duration: 800,
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        fill: 'forwards'
      }
    }
  };

  /**
   * Create a reusable fadeIn animation
   * @param {HTMLElement} element - Element to animate
   * @param {Object} customOptions - Optional custom animation options
   * @returns {Animation|null} Web Animation instance or null if not supported
   */
  function fadeIn(element, customOptions = {}) {
    if (!hasWebAnimationsSupport) {
      fallbackAnimation(element);
      return null;
    }

    const preset = ANIMATION_PRESETS.fadeIn;
    const options = { ...preset.options, ...customOptions };

    return element.animate(preset.keyframes, options);
  }

  /**
   * Create a reusable slideIn animation
   * @param {HTMLElement} element - Element to animate
   * @param {Object} customOptions - Optional custom animation options
   * @returns {Animation|null} Web Animation instance or null if not supported
   */
  function slideIn(element, customOptions = {}) {
    if (!hasWebAnimationsSupport) {
      fallbackAnimation(element);
      return null;
    }

    const preset = ANIMATION_PRESETS.slideIn;
    const options = { ...preset.options, ...customOptions };

    return element.animate(preset.keyframes, options);
  }

  /**
   * Create a reusable scaleUp animation
   * @param {HTMLElement} element - Element to animate
   * @param {Object} customOptions - Optional custom animation options
   * @returns {Animation|null} Web Animation instance or null if not supported
   */
  function scaleUp(element, customOptions = {}) {
    if (!hasWebAnimationsSupport) {
      fallbackAnimation(element);
      return null;
    }

    const preset = ANIMATION_PRESETS.scaleUp;
    const options = { ...preset.options, ...customOptions };

    return element.animate(preset.keyframes, options);
  }

  /**
   * Animate element using a preset
   * @param {HTMLElement} element - Element to animate
   * @param {string} presetName - Name of animation preset
   * @param {Object} customOptions - Optional custom animation options
   * @returns {Animation|null} Web Animation instance or null if not supported
   */
  function animateWithPreset(element, presetName, customOptions = {}) {
    if (!hasWebAnimationsSupport) {
      fallbackAnimation(element);
      return null;
    }

    const preset = ANIMATION_PRESETS[presetName];
    if (!preset) {
      console.warn(`Animation preset '${presetName}' not found`);
      return null;
    }

    const options = { ...preset.options, ...customOptions };
    return element.animate(preset.keyframes, options);
  }

  /**
   * Chain multiple animations sequentially
   * @param {Array} animationSteps - Array of {element, preset, options} objects
   * @returns {Promise} Promise that resolves when all animations complete
   */
  function chainAnimations(animationSteps) {
    if (!hasWebAnimationsSupport) {
      animationSteps.forEach(step => fallbackAnimation(step.element));
      return Promise.resolve();
    }

    return animationSteps.reduce((promise, step) => {
      return promise.then(() => {
        const animation = animateWithPreset(step.element, step.preset, step.options);
        return animation ? animation.finished : Promise.resolve();
      });
    }, Promise.resolve());
  }

  /**
   * Animate cards on scroll using IntersectionObserver
   */
  function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported');
      return;
    }

    const cards = document.querySelectorAll('.roster__card, .team-builder__card, .stats__card, .missions__card, .gallery__item');

    if (cards.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;

          // Animate card on scroll
          if (hasWebAnimationsSupport) {
            card.animate([
              { transform: 'translateY(30px)', opacity: 0 },
              { transform: 'translateY(0)', opacity: 1 }
            ], {
              duration: 600,
              easing: 'ease-out',
              fill: 'forwards'
            });
          } else {
            fallbackAnimation(card);
          }

          observer.unobserve(card);
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '-50px'
    });

    cards.forEach(card => {
      // Initially hide cards
      card.style.opacity = '0';
      observer.observe(card);
    });
  }

  /**
   * Fallback to CSS for unsupported browsers
   * @param {HTMLElement} element - Element to show
   */
  function fallbackAnimation(element) {
    element.style.opacity = '1';
    element.style.transform = 'none';
    element.style.transition = 'opacity 0.6s ease-out';
  }

  /**
   * Playback control wrapper
   * @param {Animation} animation - Web Animation instance
   * @returns {Object} Playback controls
   */
  function getPlaybackControls(animation) {
    if (!animation) return null;

    return {
      play: () => animation.play(),
      pause: () => animation.pause(),
      reverse: () => animation.reverse(),
      cancel: () => animation.cancel(),
      finish: () => animation.finish()
    };
  }

  /**
   * Stagger animation for multiple elements
   * @param {NodeList|Array} elements - Elements to animate
   * @param {string} presetName - Animation preset name
   * @param {number} staggerDelay - Delay between each element in ms
   * @returns {Array} Array of animation instances
   */
  function staggerAnimation(elements, presetName, staggerDelay = 100) {
    const animations = [];

    elements.forEach((element, index) => {
      setTimeout(() => {
        const animation = animateWithPreset(element, presetName);
        if (animation) animations.push(animation);
      }, index * staggerDelay);
    });

    return animations;
  }

  /**
   * Initialize module
   */
  function init() {
    if (!hasWebAnimationsSupport) {
      console.warn('Web Animations API not supported. Falling back to CSS transitions.');
    }

    // Initialize scroll animations for cards
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initScrollAnimations);
    } else {
      initScrollAnimations();
    }

    console.info('Web Animations API module initialized');
  }

  // Export public API
  window.WebAnimations = {
    fadeIn,
    slideIn,
    scaleUp,
    animateWithPreset,
    chainAnimations,
    getPlaybackControls,
    staggerAnimation,
    ANIMATION_PRESETS,
    hasSupport: hasWebAnimationsSupport
  };

  // Auto-initialize
  init();
})();
