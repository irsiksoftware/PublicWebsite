// Swipe navigation for mobile devices
class SwipeNavigation {
    constructor(options = {}) {
        this.options = {
            threshold: options.threshold || 75,
            maxVerticalMovement: options.maxVerticalMovement || 80,
            animationDuration: options.animationDuration || 300,
            enabled: options.enabled !== undefined ? options.enabled : true,
            ...options
        };

        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.isDragging = false;

        this.init();
    }

    init() {
        if (!this.isTouchDevice() || !this.options.enabled) {
            return;
        }

        this.bindEvents();
        this.setupPageNavigation();
    }

    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    bindEvents() {
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    }

    handleTouchStart(e) {
        if (!this.options.enabled) return;

        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.isDragging = false;
    }

    handleTouchMove(e) {
        if (!this.options.enabled) return;

        this.touchEndX = e.touches[0].clientX;
        this.touchEndY = e.touches[0].clientY;

        const deltaX = Math.abs(this.touchEndX - this.touchStartX);
        const deltaY = Math.abs(this.touchEndY - this.touchStartY);

        // If horizontal movement is greater than vertical, prevent default scrolling
        if (deltaX > deltaY && deltaX > 10) {
            this.isDragging = true;
            e.preventDefault();
        }
    }

    handleTouchEnd() {
        if (!this.options.enabled || !this.isDragging) return;

        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = Math.abs(this.touchEndY - this.touchStartY);

        // Check if swipe meets threshold requirements
        if (Math.abs(deltaX) > this.options.threshold && deltaY < this.options.maxVerticalMovement) {
            if (deltaX > 0) {
                this.handleSwipeRight();
            } else {
                this.handleSwipeLeft();
            }
        }

        this.isDragging = false;
    }

    handleSwipeRight() {
        // Navigate to previous page
        if (window.history.length > 1) {
            this.animateNavigation('right');
            setTimeout(() => {
                window.history.back();
            }, this.options.animationDuration / 2);
        }
    }

    handleSwipeLeft() {
        // Navigate forward if available
        if (window.history.length > 1) {
            this.animateNavigation('left');
            setTimeout(() => {
                window.history.forward();
            }, this.options.animationDuration / 2);
        }
    }

    animateNavigation(direction) {
        const overlay = document.createElement('div');
        overlay.className = 'swipe-navigation-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to ${direction === 'right' ? 'left' : 'right'}, rgba(0,0,0,0.1), transparent);
            pointer-events: none;
            z-index: 9999;
            animation: swipeNavFade ${this.options.animationDuration}ms ease-out;
        `;

        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.remove();
        }, this.options.animationDuration);
    }

    setupPageNavigation() {
        // Add CSS animation
        if (!document.getElementById('swipe-nav-styles')) {
            const style = document.createElement('style');
            style.id = 'swipe-nav-styles';
            style.textContent = `
                @keyframes swipeNavFade {
                    0% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    enable() {
        this.options.enabled = true;
    }

    disable() {
        this.options.enabled = false;
    }

    destroy() {
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SwipeNavigation;
}

// Initialize global instance
document.addEventListener('DOMContentLoaded', () => {
    window.swipeNavigation = new SwipeNavigation();
});
