/**
 * Performance Monitoring Dashboard
 * Tracks and displays site performance metrics using the Performance API
 *
 * Features:
 * - Measures page load time, TTI, LCP, FID
 * - Uses PerformanceObserver for ongoing monitoring
 * - Debug mode logging (enabled via ?debug=true)
 * - Performance budget warnings
 * - Dashboard overlay (toggle with Ctrl+Shift+P)
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    THRESHOLDS: {
      LCP: 2500, // Largest Contentful Paint threshold (ms)
      FID: 100,  // First Input Delay threshold (ms)
      TTI: 3800, // Time to Interactive threshold (ms)
      LOAD: 3000 // Page load time threshold (ms)
    },
    DEBUG_PARAM: 'debug',
    TOGGLE_SHORTCUT: 'p' // Ctrl+Shift+P
  };

  // State
  const metrics = {
    pageLoadTime: null,
    timeToInteractive: null,
    largestContentfulPaint: null,
    firstInputDelay: null,
    navigationStart: null,
    domContentLoaded: null,
    loadComplete: null
  };

  let isDashboardVisible = false;
  const debugMode = new URLSearchParams(window.location.search).get(CONFIG.DEBUG_PARAM) === 'true';

  /**
   * Log to console in debug mode
   */
  function debugLog(...args) {
    if (debugMode) {
      console.log('[Performance Monitor]', ...args);
    }
  }

  /**
   * Warn about performance budget violations
   */
  function checkPerformanceBudget(metric, value, threshold) {
    if (value > threshold) {
      const message = `⚠️ Performance Budget Warning: ${metric} (${value.toFixed(0)}ms) exceeds threshold (${threshold}ms)`;
      console.warn(message);
      debugLog(message);
      return true;
    }
    return false;
  }

  /**
   * Collect Navigation Timing metrics
   */
  function collectNavigationTiming() {
    if (!window.performance || !window.performance.timing) {
      debugLog('Performance Timing API not supported');
      return;
    }

    const timing = window.performance.timing;
    metrics.navigationStart = timing.navigationStart;

    // Calculate metrics
    metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
    metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
    metrics.loadComplete = timing.loadEventEnd - timing.navigationStart;

    // Estimate Time to Interactive (simplified)
    // TTI is when the page is fully interactive
    metrics.timeToInteractive = timing.domInteractive - timing.navigationStart;

    debugLog('Navigation Timing Metrics:', {
      pageLoadTime: metrics.pageLoadTime,
      domContentLoaded: metrics.domContentLoaded,
      timeToInteractive: metrics.timeToInteractive
    });

    // Check budgets
    checkPerformanceBudget('Page Load Time', metrics.pageLoadTime, CONFIG.THRESHOLDS.LOAD);
    checkPerformanceBudget('Time to Interactive', metrics.timeToInteractive, CONFIG.THRESHOLDS.TTI);
  }

  /**
   * Set up PerformanceObserver for LCP (Largest Contentful Paint)
   */
  function observeLCP() {
    if (!window.PerformanceObserver) {
      debugLog('PerformanceObserver not supported');
      return;
    }

    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];

        metrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;

        debugLog('LCP:', metrics.largestContentfulPaint);
        checkPerformanceBudget('LCP', metrics.largestContentfulPaint, CONFIG.THRESHOLDS.LCP);

        updateDashboard();
      });

      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      debugLog('LCP observer registered');
    } catch (e) {
      debugLog('LCP observation not supported:', e.message);
    }
  }

  /**
   * Set up PerformanceObserver for FID (First Input Delay)
   */
  function observeFID() {
    if (!window.PerformanceObserver) {
      return;
    }

    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          metrics.firstInputDelay = entry.processingStart - entry.startTime;

          debugLog('FID:', metrics.firstInputDelay);
          checkPerformanceBudget('FID', metrics.firstInputDelay, CONFIG.THRESHOLDS.FID);

          updateDashboard();
        });
      });

      fidObserver.observe({ type: 'first-input', buffered: true });
      debugLog('FID observer registered');
    } catch (e) {
      debugLog('FID observation not supported:', e.message);
    }
  }

  /**
   * Create dashboard overlay HTML
   */
  function createDashboard() {
    const dashboard = document.createElement('div');
    dashboard.id = 'performance-dashboard';
    dashboard.className = 'perf-dashboard';
    dashboard.innerHTML = `
      <div class="perf-dashboard__header">
        <h3 class="perf-dashboard__title">⚡ Performance Metrics</h3>
        <button class="perf-dashboard__close" aria-label="Close dashboard">&times;</button>
      </div>
      <div class="perf-dashboard__metrics">
        <div class="perf-dashboard__metric" data-metric="load">
          <div class="perf-dashboard__metric-label">Page Load Time</div>
          <div class="perf-dashboard__metric-value" id="metric-load">--</div>
        </div>
        <div class="perf-dashboard__metric" data-metric="tti">
          <div class="perf-dashboard__metric-label">Time to Interactive</div>
          <div class="perf-dashboard__metric-value" id="metric-tti">--</div>
        </div>
        <div class="perf-dashboard__metric" data-metric="lcp">
          <div class="perf-dashboard__metric-label">Largest Contentful Paint</div>
          <div class="perf-dashboard__metric-value" id="metric-lcp">--</div>
        </div>
        <div class="perf-dashboard__metric" data-metric="fid">
          <div class="perf-dashboard__metric-label">First Input Delay</div>
          <div class="perf-dashboard__metric-value" id="metric-fid">--</div>
        </div>
      </div>
      <div class="perf-dashboard__footer">
        Press <kbd>Ctrl+Shift+P</kbd> to toggle
      </div>
    `;

    document.body.appendChild(dashboard);

    // Close button handler
    dashboard.querySelector('.perf-dashboard__close').addEventListener('click', toggleDashboard);

    debugLog('Dashboard created');
  }

  /**
   * Update dashboard with current metrics
   */
  function updateDashboard() {
    const loadEl = document.getElementById('metric-load');
    const ttiEl = document.getElementById('metric-tti');
    const lcpEl = document.getElementById('metric-lcp');
    const fidEl = document.getElementById('metric-fid');

    if (loadEl && metrics.pageLoadTime !== null) {
      loadEl.textContent = `${metrics.pageLoadTime.toFixed(0)}ms`;
      loadEl.parentElement.classList.toggle('perf-dashboard__metric--warning',
        metrics.pageLoadTime > CONFIG.THRESHOLDS.LOAD);
    }

    if (ttiEl && metrics.timeToInteractive !== null) {
      ttiEl.textContent = `${metrics.timeToInteractive.toFixed(0)}ms`;
      ttiEl.parentElement.classList.toggle('perf-dashboard__metric--warning',
        metrics.timeToInteractive > CONFIG.THRESHOLDS.TTI);
    }

    if (lcpEl && metrics.largestContentfulPaint !== null) {
      lcpEl.textContent = `${metrics.largestContentfulPaint.toFixed(0)}ms`;
      lcpEl.parentElement.classList.toggle('perf-dashboard__metric--warning',
        metrics.largestContentfulPaint > CONFIG.THRESHOLDS.LCP);
    }

    if (fidEl && metrics.firstInputDelay !== null) {
      fidEl.textContent = `${metrics.firstInputDelay.toFixed(0)}ms`;
      fidEl.parentElement.classList.toggle('perf-dashboard__metric--warning',
        metrics.firstInputDelay > CONFIG.THRESHOLDS.FID);
    }
  }

  /**
   * Toggle dashboard visibility
   */
  function toggleDashboard() {
    isDashboardVisible = !isDashboardVisible;
    const dashboard = document.getElementById('performance-dashboard');

    if (dashboard) {
      dashboard.classList.toggle('perf-dashboard--visible', isDashboardVisible);
      debugLog('Dashboard', isDashboardVisible ? 'shown' : 'hidden');
    }
  }

  /**
   * Set up keyboard shortcut (Ctrl+Shift+P)
   */
  function setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === CONFIG.TOGGLE_SHORTCUT) {
        e.preventDefault();
        toggleDashboard();
      }
    });
    debugLog('Keyboard shortcut registered: Ctrl+Shift+P');
  }

  /**
   * Initialize performance monitoring
   */
  function init() {
    debugLog('Initializing performance monitor', { debugMode });

    // Create dashboard UI
    createDashboard();

    // Set up keyboard shortcut
    setupKeyboardShortcut();

    // Collect metrics when page is loaded
    if (document.readyState === 'complete') {
      collectNavigationTiming();
      updateDashboard();
    } else {
      window.addEventListener('load', () => {
        // Use setTimeout to ensure timing metrics are available
        setTimeout(() => {
          collectNavigationTiming();
          updateDashboard();
        }, 0);
      });
    }

    // Set up observers for ongoing monitoring
    observeLCP();
    observeFID();

    debugLog('Performance monitor initialized successfully');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose metrics for debugging
  if (debugMode) {
    window.__performanceMetrics = metrics;
    debugLog('Metrics exposed at window.__performanceMetrics');
  }

})();
