/**
 * Main entry point for common functionality
 * Implements code splitting and lazy loading for optimal performance
 */

// Initialize lazy loading
import('./component-loader.js')
    .then(module => {
        if (module.initializeLazyComponents) {
            module.initializeLazyComponents();
        }
    })
    .catch(error => {
        console.error('Failed to initialize lazy components:', error);
    });

// Lazy loading enabled for non-critical modules

// Lazy load back-to-top button when user scrolls
let backToTopLoaded = false;
const loadBackToTop = () => {
    if (!backToTopLoaded && window.scrollY > 300) {
        backToTopLoaded = true;
        import('./back-to-top.js').catch(error => {
            console.error('Failed to load back-to-top:', error);
        });
        window.removeEventListener('scroll', loadBackToTop);
    }
};
window.addEventListener('scroll', loadBackToTop, { passive: true });

// Lazy load sticky header on scroll
let stickyHeaderLoaded = false;
const loadStickyHeader = () => {
    if (!stickyHeaderLoaded) {
        stickyHeaderLoaded = true;
        import('./sticky-header.js').catch(error => {
            console.error('Failed to load sticky-header:', error);
        });
        window.removeEventListener('scroll', loadStickyHeader);
    }
};
window.addEventListener('scroll', loadStickyHeader, { once: true, passive: true });

// Lazy load data refresh module when needed
const loadDataRefresh = () => {
    const refreshElements = document.querySelectorAll('[data-refresh]');
    if (refreshElements.length > 0) {
        import('./data-refresh.js').catch(error => {
            console.error('Failed to load data-refresh:', error);
        });
    }
};

// Check for data refresh elements when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDataRefresh);
} else {
    loadDataRefresh();
}

// Lazy load spy activity module
const loadSpyActivity = () => {
    const spyElements = document.querySelectorAll('[data-component="spy-activity"]');
    if (spyElements.length > 0) {
        import('./spy-activity.js').catch(error => {
            console.error('Failed to load spy-activity:', error);
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSpyActivity);
} else {
    loadSpyActivity();
}

// Performance logging
if (window.performance && window.performance.mark) {
    window.performance.mark('main-js-loaded');
}

console.log('Main bundle loaded - lazy loading enabled');
