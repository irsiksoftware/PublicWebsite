/**
 * Pull-to-refresh feature for mobile devices
 * Enables pull-down gesture to refresh content
 * @module mobile/pull-to-refresh
 */

class PullToRefresh {
  /**
   * Initialize pull-to-refresh functionality
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      container: options.container || document.body,
      threshold: options.threshold || 80,
      maxPullDistance: options.maxPullDistance || 150,
      refreshCallback: options.refreshCallback || this.defaultRefresh.bind(this),
      spinnerColor: options.spinnerColor || '#007bff',
      ...options
    };

    this.touchStartY = 0;
    this.touchCurrentY = 0;
    this.pullDistance = 0;
    this.isRefreshing = false;
    this.isPulling = false;
    this.isEnabled = true;

    this.refreshContainer = null;
    this.spinner = null;
    this.statusText = null;

    this.init();
  }

  /**
   * Initialize pull-to-refresh UI and event listeners
   */
  init() {
    this.createRefreshUI();
    this.attachEventListeners();
  }

  /**
   * Create refresh UI elements
   */
  createRefreshUI() {
    this.refreshContainer = document.createElement('div');
    this.refreshContainer.className = 'pull-to-refresh-container';
    this.refreshContainer.style.cssText = `
      position: fixed;
      top: -100px;
      left: 0;
      width: 100%;
      height: 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%);
      z-index: 9999;
      transition: transform 0.3s ease;
    `;

    this.spinner = document.createElement('div');
    this.spinner.className = 'pull-to-refresh-spinner';
    this.spinner.style.cssText = `
      width: 30px;
      height: 30px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid ${this.options.spinnerColor};
      border-radius: 50%;
      animation: pull-to-refresh-spin 1s linear infinite;
      display: none;
    `;

    this.statusText = document.createElement('div');
    this.statusText.className = 'pull-to-refresh-text';
    this.statusText.style.cssText = `
      margin-top: 8px;
      font-size: 14px;
      color: #666;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    `;
    this.statusText.textContent = 'Pull to refresh';

    this.refreshContainer.appendChild(this.spinner);
    this.refreshContainer.appendChild(this.statusText);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes pull-to-refresh-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    document.body.insertBefore(this.refreshContainer, document.body.firstChild);
  }

  /**
   * Attach touch event listeners
   */
  attachEventListeners() {
    this.options.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.options.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.options.container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }

  /**
   * Handle touch start event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchStart(e) {
    if (!this.isEnabled || this.isRefreshing) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop === 0) {
      this.touchStartY = e.touches[0].clientY;
      this.isPulling = true;
    }
  }

  /**
   * Handle touch move event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchMove(e) {
    if (!this.isEnabled || this.isRefreshing || !this.isPulling) return;

    this.touchCurrentY = e.touches[0].clientY;
    this.pullDistance = this.touchCurrentY - this.touchStartY;

    if (this.pullDistance > 0) {
      e.preventDefault();

      const adjustedDistance = Math.min(this.pullDistance * 0.5, this.options.maxPullDistance);
      this.refreshContainer.style.transform = `translateY(${adjustedDistance}px)`;

      if (adjustedDistance >= this.options.threshold) {
        this.statusText.textContent = 'Release to refresh';
        this.statusText.style.color = this.options.spinnerColor;
      } else {
        this.statusText.textContent = 'Pull to refresh';
        this.statusText.style.color = '#666';
      }
    }
  }

  /**
   * Handle touch end event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchEnd(e) {
    if (!this.isEnabled || this.isRefreshing || !this.isPulling) return;

    this.isPulling = false;

    const adjustedDistance = Math.min(this.pullDistance * 0.5, this.options.maxPullDistance);

    if (adjustedDistance >= this.options.threshold) {
      this.startRefresh();
    } else {
      this.resetUI();
    }

    this.touchStartY = 0;
    this.touchCurrentY = 0;
    this.pullDistance = 0;
  }

  /**
   * Start refresh animation and callback
   */
  async startRefresh() {
    this.isRefreshing = true;
    this.refreshContainer.style.transform = `translateY(${this.options.threshold}px)`;
    this.spinner.style.display = 'block';
    this.statusText.textContent = 'Refreshing...';
    this.statusText.style.color = this.options.spinnerColor;

    try {
      await this.options.refreshCallback();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      this.completeRefresh();
    }
  }

  /**
   * Complete refresh and reset UI
   */
  completeRefresh() {
    this.spinner.style.display = 'none';
    this.statusText.textContent = 'Refresh complete';
    this.statusText.style.color = '#28a745';

    setTimeout(() => {
      this.resetUI();
      this.isRefreshing = false;
    }, 500);
  }

  /**
   * Reset UI to initial state
   */
  resetUI() {
    this.refreshContainer.style.transform = 'translateY(-100px)';
    this.spinner.style.display = 'none';
    this.statusText.textContent = 'Pull to refresh';
    this.statusText.style.color = '#666';
  }

  /**
   * Default refresh callback
   */
  async defaultRefresh() {
    return new Promise(resolve => {
      setTimeout(() => {
        window.location.reload();
        resolve();
      }, 1000);
    });
  }

  /**
   * Enable pull-to-refresh
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Disable pull-to-refresh
   */
  disable() {
    this.isEnabled = false;
  }

  /**
   * Set custom refresh callback
   * @param {Function} callback - Refresh callback function
   */
  setRefreshCallback(callback) {
    this.options.refreshCallback = callback;
  }

  /**
   * Remove all event listeners and cleanup
   */
  destroy() {
    this.options.container.removeEventListener('touchstart', this.handleTouchStart);
    this.options.container.removeEventListener('touchmove', this.handleTouchMove);
    this.options.container.removeEventListener('touchend', this.handleTouchEnd);
    if (this.refreshContainer && this.refreshContainer.parentNode) {
      this.refreshContainer.parentNode.removeChild(this.refreshContainer);
    }
  }
}

export default PullToRefresh;
