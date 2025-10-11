/**
 * Swipe navigation module for mobile devices
 * Enables horizontal and vertical swipe-based page navigation
 * @module mobile/swipe-navigation
 */

class SwipeNavigation {
  /**
   * Initialize swipe navigation
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      threshold: options.threshold || 50,
      velocity: options.velocity || 0.3,
      direction: options.direction || 'horizontal',
      allowedElements: options.allowedElements || ['BODY', 'DIV', 'SECTION', 'MAIN'],
      ...options
    };

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.touchStartTime = 0;
    this.isEnabled = true;

    this.handlers = {
      swipeLeft: [],
      swipeRight: [],
      swipeUp: [],
      swipeDown: []
    };

    this.init();
  }

  /**
   * Initialize swipe navigation event listeners
   */
  init() {
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }

  /**
   * Handle touch start event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchStart(e) {
    if (!this.isEnabled) return;

    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
  }

  /**
   * Handle touch move event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchMove(e) {
    if (!this.isEnabled) return;

    const touch = e.touches[0];
    this.touchEndX = touch.clientX;
    this.touchEndY = touch.clientY;
  }

  /**
   * Handle touch end event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchEnd(e) {
    if (!this.isEnabled) return;

    const target = e.target;
    if (!this.isSwipeableElement(target)) {
      return;
    }

    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const deltaTime = Date.now() - this.touchStartTime;

    const velocityX = Math.abs(deltaX) / deltaTime;
    const velocityY = Math.abs(deltaY) / deltaTime;

    if (this.options.direction === 'horizontal' || this.options.direction === 'both') {
      if (Math.abs(deltaX) > this.options.threshold && velocityX > this.options.velocity) {
        if (deltaX > 0) {
          this.trigger('swipeRight', {
            distance: deltaX,
            velocity: velocityX,
            target: e.target
          });
        } else {
          this.trigger('swipeLeft', {
            distance: Math.abs(deltaX),
            velocity: velocityX,
            target: e.target
          });
        }
      }
    }

    if (this.options.direction === 'vertical' || this.options.direction === 'both') {
      if (Math.abs(deltaY) > this.options.threshold && velocityY > this.options.velocity) {
        if (deltaY > 0) {
          this.trigger('swipeDown', {
            distance: deltaY,
            velocity: velocityY,
            target: e.target
          });
        } else {
          this.trigger('swipeUp', {
            distance: Math.abs(deltaY),
            velocity: velocityY,
            target: e.target
          });
        }
      }
    }

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
  }

  /**
   * Check if element is allowed for swipe gestures
   * @param {HTMLElement} element - Target element
   * @returns {boolean} True if element is swipeable
   */
  isSwipeableElement(element) {
    let current = element;
    while (current && current !== document.body) {
      if (current.hasAttribute('data-no-swipe')) {
        return false;
      }
      current = current.parentElement;
    }
    return this.options.allowedElements.includes(element.tagName);
  }

  /**
   * Register swipe handler
   * @param {string} direction - Swipe direction (swipeLeft, swipeRight, swipeUp, swipeDown)
   * @param {Function} handler - Handler function
   */
  on(direction, handler) {
    if (this.handlers[direction]) {
      this.handlers[direction].push(handler);
    }
  }

  /**
   * Trigger swipe handlers
   * @param {string} direction - Swipe direction
   * @param {Object} data - Swipe data
   */
  trigger(direction, data) {
    if (this.handlers[direction]) {
      this.handlers[direction].forEach(handler => handler(data));
    }
  }

  /**
   * Enable swipe navigation
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Disable swipe navigation
   */
  disable() {
    this.isEnabled = false;
  }

  /**
   * Navigate to previous page (swipe right action)
   */
  navigateBack() {
    if (window.history.length > 1) {
      window.history.back();
    }
  }

  /**
   * Navigate to next page (swipe left action)
   */
  navigateForward() {
    if (window.history.length > 1) {
      window.history.forward();
    }
  }

  /**
   * Remove all event listeners and cleanup
   */
  destroy() {
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
  }
}

export default SwipeNavigation;
