// Pull-to-refresh functionality for mobile devices
class PullToRefresh {
    constructor(options = {}) {
        this.options = {
            threshold: options.threshold || 80,
            maxPullDistance: options.maxPullDistance || 150,
            animationDuration: options.animationDuration || 300,
            enabled: options.enabled !== undefined ? options.enabled : true,
            onRefresh: options.onRefresh || (() => window.location.reload()),
            ...options
        };

        this.pullStartY = 0;
        this.pullMoveY = 0;
        this.isPulling = false;
        this.isRefreshing = false;
        this.indicator = null;

        this.init();
    }

    init() {
        if (!this.isTouchDevice() || !this.options.enabled) {
            return;
        }

        this.createIndicator();
        this.bindEvents();
    }

    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    createIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.className = 'pull-to-refresh-indicator';
        this.indicator.innerHTML = `
            <div class="ptr-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
            </div>
            <div class="ptr-text">Pull to refresh</div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.id = 'pull-to-refresh-styles';
        style.textContent = `
            .pull-to-refresh-indicator {
                position: fixed;
                top: -80px;
                left: 50%;
                transform: translateX(-50%);
                width: 200px;
                height: 80px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: var(--bg-color, #fff);
                border-radius: 0 0 12px 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: top 0.3s ease-out;
                z-index: 10000;
                color: var(--text-color, #333);
            }

            .pull-to-refresh-indicator.pulling {
                top: 0;
            }

            .pull-to-refresh-indicator.refreshing .ptr-icon svg {
                animation: ptr-spin 1s linear infinite;
            }

            .pull-to-refresh-indicator .ptr-icon {
                margin-bottom: 8px;
            }

            .pull-to-refresh-indicator .ptr-text {
                font-size: 14px;
                font-weight: 500;
            }

            @keyframes ptr-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            @media (prefers-color-scheme: dark) {
                .pull-to-refresh-indicator {
                    --bg-color: #1a1a1a;
                    --text-color: #fff;
                }
            }

            body[data-theme="dark"] .pull-to-refresh-indicator {
                --bg-color: #1a1a1a;
                --text-color: #fff;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(this.indicator);
    }

    bindEvents() {
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    }

    handleTouchStart(e) {
        if (!this.options.enabled || this.isRefreshing) return;

        // Only trigger if at top of page
        if (window.scrollY === 0) {
            this.pullStartY = e.touches[0].clientY;
            this.isPulling = true;
        }
    }

    handleTouchMove(e) {
        if (!this.options.enabled || !this.isPulling || this.isRefreshing) return;

        this.pullMoveY = e.touches[0].clientY;
        const pullDistance = this.pullMoveY - this.pullStartY;

        // Only allow pulling down
        if (pullDistance > 0 && window.scrollY === 0) {
            e.preventDefault();

            // Apply resistance curve
            const resistance = Math.min(pullDistance, this.options.maxPullDistance);
            const position = Math.pow(resistance, 0.85);

            this.updateIndicator(position);
        }
    }

    handleTouchEnd() {
        if (!this.options.enabled || !this.isPulling || this.isRefreshing) return;

        const pullDistance = this.pullMoveY - this.pullStartY;

        if (pullDistance > this.options.threshold) {
            this.triggerRefresh();
        } else {
            this.resetIndicator();
        }

        this.isPulling = false;
        this.pullStartY = 0;
        this.pullMoveY = 0;
    }

    updateIndicator(distance) {
        const progress = Math.min(distance / this.options.threshold, 1);
        this.indicator.style.top = `${-80 + (80 * progress)}px`;

        if (progress >= 1) {
            this.indicator.querySelector('.ptr-text').textContent = 'Release to refresh';
            this.indicator.classList.add('pulling');
        } else {
            this.indicator.querySelector('.ptr-text').textContent = 'Pull to refresh';
            this.indicator.classList.remove('pulling');
        }
    }

    async triggerRefresh() {
        this.isRefreshing = true;
        this.indicator.style.top = '0';
        this.indicator.classList.add('refreshing');
        this.indicator.querySelector('.ptr-text').textContent = 'Refreshing...';

        try {
            await this.options.onRefresh();
        } catch (error) {
            console.error('Refresh failed:', error);
        }

        // Reset after a short delay
        setTimeout(() => {
            this.resetIndicator();
            this.isRefreshing = false;
        }, this.options.animationDuration);
    }

    resetIndicator() {
        this.indicator.style.top = '-80px';
        this.indicator.classList.remove('pulling', 'refreshing');
        this.indicator.querySelector('.ptr-text').textContent = 'Pull to refresh';
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

        if (this.indicator) {
            this.indicator.remove();
        }

        const styles = document.getElementById('pull-to-refresh-styles');
        if (styles) {
            styles.remove();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PullToRefresh;
}

// Initialize global instance
document.addEventListener('DOMContentLoaded', () => {
    window.pullToRefresh = new PullToRefresh({
        onRefresh: async () => {
            // Allow custom refresh handlers from other scripts
            const customRefreshEvent = new CustomEvent('pulltorefresh', {
                detail: { timestamp: Date.now() }
            });
            document.dispatchEvent(customRefreshEvent);

            // Default behavior: reload after a short delay
            await new Promise(resolve => setTimeout(resolve, 500));
            window.location.reload();
        }
    });
});
