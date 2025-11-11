/**
 * Main entry point for common functionality
 * Implements code splitting and lazy loading for optimal performance
 *
 * @example
 * // Include this script as the main entry point
 * <script type="module" src="/js/main.js"></script>
 */

/**
 * Load internationalization first to enable language detection
 * This is critical functionality that should load immediately
 */
import('./i18n.js').catch(error => {
    console.error('Failed to load i18n:', error);
});

/**
 * Load language selector after i18n
 * This provides the UI for users to change languages
 */
import('./language-selector.js').catch(error => {
    console.error('Failed to load language-selector:', error);
});

/**
 * Initializes lazy loading for components
 * Dynamically imports component-loader module
 * @returns {Promise<void>}
 */
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

/**
 * Lazy loads the back-to-top button module when user scrolls
 * Only loads once when scroll position exceeds 300px
 */
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

/**
 * Lazy loads the sticky header module on first scroll
 * Only loads once when user starts scrolling
 */
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

/**
 * Lazy loads data refresh module if refresh elements exist on page
 * Checks for elements with [data-refresh] attribute
 */
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

/**
 * Lazy loads spy activity module if spy elements exist on page
 * Checks for elements with [data-component="spy-activity"] attribute
 */
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

/**
 * Loads privacy compliance modules
 * Includes cookie consent and privacy compliance functionality
 */
import('./cookie-consent.js').catch(error => {
    console.error('Failed to load cookie-consent:', error);
});

import('./privacy-compliance.js').catch(error => {
    console.error('Failed to load privacy-compliance:', error);
});

// Performance logging
if (window.performance && window.performance.mark) {
    window.performance.mark('main-js-loaded');
}

console.log('Main bundle loaded - lazy loading enabled');
