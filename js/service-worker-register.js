/**
 * @fileoverview Service Worker Registration
 * Registers the service worker for PWA functionality and offline support.
 * Handles automatic updates and controller changes.
 *
 * @module service-worker-register
 * @requires /service-worker.js
 *
 * @example
 * // Service worker automatically registers on page load
 * // Checks for updates every minute
 */

/**
 * Register service worker if supported by browser
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered successfully:', registration.scope);

                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });

        // Listen for updates
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker updated, reloading page...');
            window.location.reload();
        });
    });
}
