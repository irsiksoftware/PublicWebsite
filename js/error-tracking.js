/**
 * Error Tracking and Monitoring System
 * Captures and reports JavaScript errors for production monitoring
 */

class ErrorTracker {
    constructor(options = {}) {
        this.options = {
            endpoint: options.endpoint || '/api/errors',
            maxErrors: options.maxErrors || 50,
            enableConsoleLogging: options.enableConsoleLogging !== false,
            sampleRate: options.sampleRate || 1.0,
            ignorePatterns: options.ignorePatterns || [],
            additionalContext: options.additionalContext || {},
            ...options
        };

        this.errorQueue = [];
        this.errorCount = 0;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        // Global error handler
        window.addEventListener('error', (event) => {
            this.captureError({
                message: event.message,
                source: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                type: 'error'
            });
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.captureError({
                message: event.reason?.message || 'Unhandled Promise Rejection',
                error: event.reason,
                type: 'unhandledrejection'
            });
        });

        // Network error monitoring
        this.monitorNetworkErrors();

        this.initialized = true;
        this.log('Error tracking initialized');
    }

    captureError(errorData) {
        // Apply sampling rate
        if (Math.random() > this.options.sampleRate) {
            return;
        }

        // Check ignore patterns
        if (this.shouldIgnore(errorData)) {
            return;
        }

        this.errorCount++;

        const enrichedError = this.enrichErrorData(errorData);

        this.errorQueue.push(enrichedError);

        // Prevent memory overflow
        if (this.errorQueue.length > this.options.maxErrors) {
            this.errorQueue.shift();
        }

        this.log('Error captured:', enrichedError);

        // Attempt to send error
        this.sendError(enrichedError);
    }

    enrichErrorData(errorData) {
        return {
            ...errorData,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            errorCount: this.errorCount,
            stack: errorData.error?.stack || null,
            ...this.options.additionalContext,
            // Performance metrics
            performance: {
                memory: performance.memory ? {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize
                } : null,
                timing: performance.timing ? {
                    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart
                } : null
            }
        };
    }

    shouldIgnore(errorData) {
        const message = errorData.message || '';
        return this.options.ignorePatterns.some(pattern => {
            if (pattern instanceof RegExp) {
                return pattern.test(message);
            }
            return message.includes(pattern);
        });
    }

    sendError(errorData) {
        // Use sendBeacon for reliable error reporting (works even on page unload)
        if (navigator.sendBeacon && this.options.endpoint) {
            const blob = new Blob([JSON.stringify(errorData)], { type: 'application/json' });
            navigator.sendBeacon(this.options.endpoint, blob);
        } else if (this.options.endpoint) {
            // Fallback to fetch with keepalive
            fetch(this.options.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(errorData),
                keepalive: true
            }).catch(err => {
                this.log('Failed to send error:', err);
            });
        }
    }

    monitorNetworkErrors() {
        // Monitor fetch errors
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            return originalFetch(...args).catch(error => {
                this.captureError({
                    message: `Network fetch error: ${error.message}`,
                    error: error,
                    type: 'network',
                    url: args[0]
                });
                throw error;
            });
        };

        // Monitor resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window && event.target.src) {
                this.captureError({
                    message: `Resource failed to load: ${event.target.src}`,
                    type: 'resource',
                    resource: event.target.tagName,
                    src: event.target.src
                });
            }
        }, true);
    }

    // Manual error reporting
    logError(error, context = {}) {
        this.captureError({
            message: error.message || String(error),
            error: error,
            type: 'manual',
            context: context
        });
    }

    // Get error statistics
    getStats() {
        return {
            totalErrors: this.errorCount,
            queuedErrors: this.errorQueue.length,
            errors: this.errorQueue.slice()
        };
    }

    // Clear error queue
    clearQueue() {
        this.errorQueue = [];
    }

    log(...args) {
        if (this.options.enableConsoleLogging) {
            console.log('[ErrorTracker]', ...args);
        }
    }
}

// Create and export singleton instance
const errorTracker = new ErrorTracker({
    endpoint: '/api/errors',
    sampleRate: 1.0,
    ignorePatterns: [
        /Script error/i,
        /ResizeObserver loop/i
    ],
    additionalContext: {
        environment: window.location.hostname.includes('localhost') ? 'development' : 'production',
        version: '1.0.0'
    }
});

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => errorTracker.init());
} else {
    errorTracker.init();
}

// Export for manual usage
export default errorTracker;
export { ErrorTracker };
