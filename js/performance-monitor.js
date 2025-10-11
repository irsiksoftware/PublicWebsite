/**
 * Performance Monitoring System
 * Tracks and reports performance metrics for production monitoring
 */

class PerformanceMonitor {
    constructor(options = {}) {
        this.options = {
            endpoint: options.endpoint || '/api/performance',
            reportInterval: options.reportInterval || 30000, // 30 seconds
            enableConsoleLogging: options.enableConsoleLogging !== false,
            trackResourceTiming: options.trackResourceTiming !== false,
            trackLongTasks: options.trackLongTasks !== false,
            longTaskThreshold: options.longTaskThreshold || 50, // ms
            ...options
        };

        this.metrics = {
            pageLoad: null,
            resources: [],
            interactions: [],
            longTasks: [],
            vitals: {}
        };

        this.observers = [];
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        this.trackPageLoad();
        this.trackWebVitals();

        if (this.options.trackResourceTiming) {
            this.trackResourcePerformance();
        }

        if (this.options.trackLongTasks) {
            this.trackLongTasksAPI();
        }

        this.trackUserInteractions();

        // Periodic reporting
        this.startPeriodicReporting();

        // Report on page unload
        window.addEventListener('beforeunload', () => {
            this.report();
        });

        this.initialized = true;
        this.log('Performance monitoring initialized');
    }

    trackPageLoad() {
        if (!window.performance || !window.performance.timing) {
            return;
        }

        window.addEventListener('load', () => {
            setTimeout(() => {
                const timing = performance.timing;
                const navigation = performance.getEntriesByType('navigation')[0];

                this.metrics.pageLoad = {
                    // Legacy timing API
                    dns: timing.domainLookupEnd - timing.domainLookupStart,
                    tcp: timing.connectEnd - timing.connectStart,
                    request: timing.responseStart - timing.requestStart,
                    response: timing.responseEnd - timing.responseStart,
                    domProcessing: timing.domComplete - timing.domLoading,
                    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                    loadComplete: timing.loadEventEnd - timing.navigationStart,

                    // Navigation timing API v2
                    navigationTiming: navigation ? {
                        type: navigation.type,
                        redirectCount: navigation.redirectCount,
                        transferSize: navigation.transferSize,
                        encodedBodySize: navigation.encodedBodySize,
                        decodedBodySize: navigation.decodedBodySize
                    } : null,

                    timestamp: new Date().toISOString()
                };

                this.log('Page load metrics captured:', this.metrics.pageLoad);
            }, 0);
        });
    }

    trackWebVitals() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.vitals.lcp = {
                        value: lastEntry.renderTime || lastEntry.loadTime,
                        timestamp: new Date().toISOString()
                    };
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                this.observers.push(lcpObserver);
            } catch (e) {
                this.log('LCP tracking not supported');
            }

            // First Input Delay (FID)
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.metrics.vitals.fid = {
                            value: entry.processingStart - entry.startTime,
                            timestamp: new Date().toISOString()
                        };
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
                this.observers.push(fidObserver);
            } catch (e) {
                this.log('FID tracking not supported');
            }

            // Cumulative Layout Shift (CLS)
            let clsValue = 0;
            try {
                const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                            this.metrics.vitals.cls = {
                                value: clsValue,
                                timestamp: new Date().toISOString()
                            };
                        }
                    }
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
                this.observers.push(clsObserver);
            } catch (e) {
                this.log('CLS tracking not supported');
            }
        }

        // First Contentful Paint (FCP)
        if (window.performance && window.performance.getEntriesByName) {
            window.addEventListener('load', () => {
                const paintEntries = performance.getEntriesByType('paint');
                paintEntries.forEach(entry => {
                    if (entry.name === 'first-contentful-paint') {
                        this.metrics.vitals.fcp = {
                            value: entry.startTime,
                            timestamp: new Date().toISOString()
                        };
                    }
                });
            });
        }
    }

    trackResourcePerformance() {
        if (!window.PerformanceObserver) return;

        try {
            const resourceObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.entryType === 'resource') {
                        this.metrics.resources.push({
                            name: entry.name,
                            type: entry.initiatorType,
                            duration: entry.duration,
                            size: entry.transferSize,
                            timestamp: new Date().toISOString()
                        });

                        // Limit stored resources
                        if (this.metrics.resources.length > 100) {
                            this.metrics.resources.shift();
                        }
                    }
                });
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
            this.observers.push(resourceObserver);
        } catch (e) {
            this.log('Resource timing not supported');
        }
    }

    trackLongTasksAPI() {
        if (!window.PerformanceObserver) return;

        try {
            const longTaskObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    this.metrics.longTasks.push({
                        duration: entry.duration,
                        startTime: entry.startTime,
                        timestamp: new Date().toISOString()
                    });

                    // Limit stored tasks
                    if (this.metrics.longTasks.length > 50) {
                        this.metrics.longTasks.shift();
                    }
                });
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });
            this.observers.push(longTaskObserver);
        } catch (e) {
            this.log('Long tasks API not supported');
        }
    }

    trackUserInteractions() {
        const interactionStart = new Map();

        ['click', 'keydown'].forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                const key = `${eventType}-${Date.now()}`;
                interactionStart.set(key, performance.now());

                requestAnimationFrame(() => {
                    const duration = performance.now() - interactionStart.get(key);

                    if (duration > this.options.longTaskThreshold) {
                        this.metrics.interactions.push({
                            type: eventType,
                            target: event.target.tagName,
                            duration: duration,
                            timestamp: new Date().toISOString()
                        });

                        // Limit stored interactions
                        if (this.metrics.interactions.length > 50) {
                            this.metrics.interactions.shift();
                        }
                    }

                    interactionStart.delete(key);
                });
            }, { passive: true });
        });
    }

    startPeriodicReporting() {
        setInterval(() => {
            this.report();
        }, this.options.reportInterval);
    }

    report() {
        const report = {
            ...this.metrics,
            memory: performance.memory ? {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            } : null,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };

        this.sendReport(report);
    }

    sendReport(report) {
        if (!this.options.endpoint) return;

        // Use sendBeacon for reliable reporting
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(report)], { type: 'application/json' });
            navigator.sendBeacon(this.options.endpoint, blob);
        } else {
            fetch(this.options.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(report),
                keepalive: true
            }).catch(err => {
                this.log('Failed to send performance report:', err);
            });
        }

        this.log('Performance report sent:', report);
    }

    getMetrics() {
        return { ...this.metrics };
    }

    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
    }

    log(...args) {
        if (this.options.enableConsoleLogging) {
            console.log('[PerformanceMonitor]', ...args);
        }
    }
}

// Create and export singleton instance
const performanceMonitor = new PerformanceMonitor({
    endpoint: '/api/performance',
    reportInterval: 30000,
    trackResourceTiming: true,
    trackLongTasks: true
});

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => performanceMonitor.init());
} else {
    performanceMonitor.init();
}

export default performanceMonitor;
export { PerformanceMonitor };
