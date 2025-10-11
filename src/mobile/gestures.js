/**
 * Mobile touch gestures support module
 * Provides tap, double-tap, long-press, pinch, and multi-touch gesture detection
 * @module mobile/gestures
 */

class GestureDetector {
  /**
   * Initialize gesture detector with configuration
   * @param {HTMLElement} element - Target element for gesture detection
   * @param {Object} options - Configuration options
   */
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      doubleTapDelay: options.doubleTapDelay || 300,
      longPressDelay: options.longPressDelay || 500,
      swipeThreshold: options.swipeThreshold || 50,
      pinchThreshold: options.pinchThreshold || 0.1,
      ...options
    };

    this.touchStartTime = 0;
    this.touchStartPos = { x: 0, y: 0 };
    this.lastTapTime = 0;
    this.longPressTimer = null;
    this.initialDistance = 0;
    this.touches = [];

    this.handlers = {
      tap: [],
      doubleTap: [],
      longPress: [],
      swipe: [],
      pinch: []
    };

    this.init();
  }

  /**
   * Initialize touch event listeners
   */
  init() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
  }

  /**
   * Handle touch start event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchStart(e) {
    this.touchStartTime = Date.now();
    this.touches = Array.from(e.touches);

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.touchStartPos = { x: touch.clientX, y: touch.clientY };

      this.longPressTimer = setTimeout(() => {
        this.trigger('longPress', {
          x: touch.clientX,
          y: touch.clientY,
          target: e.target
        });
      }, this.options.longPressDelay);
    } else if (e.touches.length === 2) {
      this.initialDistance = this.getDistance(e.touches[0], e.touches[1]);
    }
  }

  /**
   * Handle touch move event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchMove(e) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (e.touches.length === 2 && this.initialDistance > 0) {
      const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / this.initialDistance;

      if (Math.abs(scale - 1) > this.options.pinchThreshold) {
        this.trigger('pinch', {
          scale,
          direction: scale > 1 ? 'out' : 'in',
          center: this.getCenter(e.touches[0], e.touches[1])
        });
      }
    }
  }

  /**
   * Handle touch end event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchEnd(e) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - this.touchStartTime;

    if (e.changedTouches.length === 1 && this.touches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - this.touchStartPos.x;
      const deltaY = touch.clientY - this.touchStartPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < 10 && touchDuration < 300) {
        const timeSinceLastTap = touchEndTime - this.lastTapTime;

        if (timeSinceLastTap < this.options.doubleTapDelay) {
          this.trigger('doubleTap', {
            x: touch.clientX,
            y: touch.clientY,
            target: e.target
          });
          this.lastTapTime = 0;
        } else {
          this.trigger('tap', {
            x: touch.clientX,
            y: touch.clientY,
            target: e.target
          });
          this.lastTapTime = touchEndTime;
        }
      }
    }

    this.initialDistance = 0;
    this.touches = [];
  }

  /**
   * Handle touch cancel event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchCancel(e) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    this.initialDistance = 0;
    this.touches = [];
  }

  /**
   * Get distance between two touch points
   * @param {Touch} touch1 - First touch point
   * @param {Touch} touch2 - Second touch point
   * @returns {number} Distance
   */
  getDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get center point between two touches
   * @param {Touch} touch1 - First touch point
   * @param {Touch} touch2 - Second touch point
   * @returns {Object} Center coordinates
   */
  getCenter(touch1, touch2) {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }

  /**
   * Register gesture handler
   * @param {string} gesture - Gesture type
   * @param {Function} handler - Handler function
   */
  on(gesture, handler) {
    if (this.handlers[gesture]) {
      this.handlers[gesture].push(handler);
    }
  }

  /**
   * Trigger gesture handlers
   * @param {string} gesture - Gesture type
   * @param {Object} data - Gesture data
   */
  trigger(gesture, data) {
    if (this.handlers[gesture]) {
      this.handlers[gesture].forEach(handler => handler(data));
    }
  }

  /**
   * Remove all event listeners and cleanup
   */
  destroy() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);
  }
}

export default GestureDetector;
