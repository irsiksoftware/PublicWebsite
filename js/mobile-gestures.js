// Mobile touch gestures support
class TouchGestureManager {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50;
        this.handlers = {
            swipeLeft: [],
            swipeRight: [],
            swipeUp: [],
            swipeDown: [],
            tap: [],
            doubleTap: [],
            longPress: []
        };
        this.lastTap = 0;
        this.longPressTimer = null;
        this.longPressDuration = 500;

        this.init();
    }

    init() {
        if (!this.isTouchDevice()) {
            return;
        }

        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    }

    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX;
        this.touchStartY = e.changedTouches[0].screenY;

        // Long press detection
        this.longPressTimer = setTimeout(() => {
            this.triggerHandlers('longPress', e);
        }, this.longPressDuration);
    }

    handleTouchMove() {
        // Cancel long press if user moves finger
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    handleTouchEnd(e) {
        // Clear long press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        this.touchEndX = e.changedTouches[0].screenX;
        this.touchEndY = e.changedTouches[0].screenY;

        this.handleGesture(e);
    }

    handleGesture(e) {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // Check for tap or double tap
        if (absDeltaX < 10 && absDeltaY < 10) {
            const now = Date.now();
            const timeSinceLastTap = now - this.lastTap;

            if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
                this.triggerHandlers('doubleTap', e);
                this.lastTap = 0;
            } else {
                this.triggerHandlers('tap', e);
                this.lastTap = now;
            }
            return;
        }

        // Horizontal swipe
        if (absDeltaX > absDeltaY && absDeltaX > this.minSwipeDistance) {
            if (deltaX > 0) {
                this.triggerHandlers('swipeRight', e);
            } else {
                this.triggerHandlers('swipeLeft', e);
            }
        }

        // Vertical swipe
        if (absDeltaY > absDeltaX && absDeltaY > this.minSwipeDistance) {
            if (deltaY > 0) {
                this.triggerHandlers('swipeDown', e);
            } else {
                this.triggerHandlers('swipeUp', e);
            }
        }
    }

    on(gesture, handler) {
        if (this.handlers[gesture]) {
            this.handlers[gesture].push(handler);
        }
    }

    off(gesture, handler) {
        if (this.handlers[gesture]) {
            const index = this.handlers[gesture].indexOf(handler);
            if (index > -1) {
                this.handlers[gesture].splice(index, 1);
            }
        }
    }

    triggerHandlers(gesture, event) {
        if (this.handlers[gesture]) {
            this.handlers[gesture].forEach(handler => {
                handler(event, {
                    startX: this.touchStartX,
                    startY: this.touchStartY,
                    endX: this.touchEndX,
                    endY: this.touchEndY
                });
            });
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TouchGestureManager;
}

// Initialize global instance
window.touchGestures = new TouchGestureManager();
