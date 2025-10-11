/**
 * Mobile features initialization module
 * Initializes and manages all mobile-specific features
 * @module mobile/index
 */

import GestureDetector from './gestures.js';
import SwipeNavigation from './swipe-navigation.js';
import PullToRefresh from './pull-to-refresh.js';

class MobileFeatures {
  /**
   * Initialize mobile features with configuration
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      enableGestures: config.enableGestures !== false,
      enableSwipeNavigation: config.enableSwipeNavigation !== false,
      enablePullToRefresh: config.enablePullToRefresh !== false,
      gestureOptions: config.gestureOptions || {},
      swipeOptions: config.swipeOptions || {},
      refreshOptions: config.refreshOptions || {},
      ...config
    };

    this.gestureDetector = null;
    this.swipeNavigation = null;
    this.pullToRefresh = null;
    this.isMobile = this.detectMobile();
  }

  /**
   * Detect if device is mobile
   * @returns {boolean} True if mobile device
   */
  detectMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;

    return mobileRegex.test(userAgent.toLowerCase()) || (hasTouchScreen && isSmallScreen);
  }

  /**
   * Initialize all mobile features
   */
  init() {
    if (!this.isMobile && !this.config.forceEnable) {
      console.log('Mobile features disabled: not a mobile device');
      return;
    }

    if (this.config.enableGestures) {
      this.initGestures();
    }

    if (this.config.enableSwipeNavigation) {
      this.initSwipeNavigation();
    }

    if (this.config.enablePullToRefresh) {
      this.initPullToRefresh();
    }

    this.addMobileMetaTags();
    this.addMobileStyles();

    console.log('Mobile features initialized successfully');
  }

  /**
   * Initialize gesture detection
   */
  initGestures() {
    const targetElement = this.config.gestureOptions.element || document.body;
    this.gestureDetector = new GestureDetector(targetElement, this.config.gestureOptions);

    this.gestureDetector.on('tap', (data) => {
      this.handleGesture('tap', data);
    });

    this.gestureDetector.on('doubleTap', (data) => {
      this.handleGesture('doubleTap', data);
    });

    this.gestureDetector.on('longPress', (data) => {
      this.handleGesture('longPress', data);
    });

    this.gestureDetector.on('pinch', (data) => {
      this.handleGesture('pinch', data);
    });

    console.log('Gesture detection initialized');
  }

  /**
   * Initialize swipe navigation
   */
  initSwipeNavigation() {
    this.swipeNavigation = new SwipeNavigation(this.config.swipeOptions);

    this.swipeNavigation.on('swipeLeft', (data) => {
      this.handleSwipe('left', data);
    });

    this.swipeNavigation.on('swipeRight', (data) => {
      this.handleSwipe('right', data);
    });

    this.swipeNavigation.on('swipeUp', (data) => {
      this.handleSwipe('up', data);
    });

    this.swipeNavigation.on('swipeDown', (data) => {
      this.handleSwipe('down', data);
    });

    console.log('Swipe navigation initialized');
  }

  /**
   * Initialize pull-to-refresh
   */
  initPullToRefresh() {
    this.pullToRefresh = new PullToRefresh(this.config.refreshOptions);
    console.log('Pull-to-refresh initialized');
  }

  /**
   * Handle gesture events
   * @param {string} type - Gesture type
   * @param {Object} data - Gesture data
   */
  handleGesture(type, data) {
    const event = new CustomEvent(`mobile:gesture:${type}`, {
      detail: data,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(event);

    if (this.config.onGesture) {
      this.config.onGesture(type, data);
    }
  }

  /**
   * Handle swipe events
   * @param {string} direction - Swipe direction
   * @param {Object} data - Swipe data
   */
  handleSwipe(direction, data) {
    const event = new CustomEvent(`mobile:swipe:${direction}`, {
      detail: data,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(event);

    if (this.config.onSwipe) {
      this.config.onSwipe(direction, data);
    }
  }

  /**
   * Add mobile-specific meta tags
   */
  addMobileMetaTags() {
    const metaTags = [
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
    ];

    metaTags.forEach(tag => {
      let meta = document.querySelector(`meta[name="${tag.name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = tag.name;
        document.head.appendChild(meta);
      }
      meta.content = tag.content;
    });
  }

  /**
   * Add mobile-specific styles
   */
  addMobileStyles() {
    const style = document.createElement('style');
    style.id = 'mobile-features-styles';
    style.textContent = `
      * {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
      }

      body {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        touch-action: pan-x pan-y;
      }

      input, textarea, select, [contenteditable] {
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }

      @media (hover: none) and (pointer: coarse) {
        button, a, [role="button"] {
          min-height: 44px;
          min-width: 44px;
          padding: 8px 16px;
        }
      }
    `;

    if (!document.getElementById('mobile-features-styles')) {
      document.head.appendChild(style);
    }
  }

  /**
   * Enable all mobile features
   */
  enable() {
    if (this.gestureDetector) {
      this.gestureDetector.element.style.pointerEvents = 'auto';
    }
    if (this.swipeNavigation) {
      this.swipeNavigation.enable();
    }
    if (this.pullToRefresh) {
      this.pullToRefresh.enable();
    }
  }

  /**
   * Disable all mobile features
   */
  disable() {
    if (this.gestureDetector) {
      this.gestureDetector.element.style.pointerEvents = 'none';
    }
    if (this.swipeNavigation) {
      this.swipeNavigation.disable();
    }
    if (this.pullToRefresh) {
      this.pullToRefresh.disable();
    }
  }

  /**
   * Cleanup and remove all mobile features
   */
  destroy() {
    if (this.gestureDetector) {
      this.gestureDetector.destroy();
      this.gestureDetector = null;
    }
    if (this.swipeNavigation) {
      this.swipeNavigation.destroy();
      this.swipeNavigation = null;
    }
    if (this.pullToRefresh) {
      this.pullToRefresh.destroy();
      this.pullToRefresh = null;
    }

    const styleElement = document.getElementById('mobile-features-styles');
    if (styleElement) {
      styleElement.remove();
    }
  }

  /**
   * Get current mobile feature status
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      isMobile: this.isMobile,
      gesturesEnabled: !!this.gestureDetector,
      swipeNavigationEnabled: !!this.swipeNavigation,
      pullToRefreshEnabled: !!this.pullToRefresh
    };
  }
}

export default MobileFeatures;
export { GestureDetector, SwipeNavigation, PullToRefresh };
