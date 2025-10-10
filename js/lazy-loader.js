/**
 * Lazy Loader Module
 * Provides dynamic import functionality for code splitting and lazy loading
 */

/**
 * Lazy load a module with loading state management
 * @param {Function} importFunc - Dynamic import function
 * @param {Object} options - Loading options
 * @returns {Promise} - Promise that resolves with the module
 */
export async function lazyLoad(importFunc, options = {}) {
    const {
        onLoading = null,
        onSuccess = null,
        onError = null,
        timeout = 30000
    } = options;

    try {
        if (onLoading) onLoading();

        const loadPromise = importFunc();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Module load timeout')), timeout)
        );

        const module = await Promise.race([loadPromise, timeoutPromise]);

        if (onSuccess) onSuccess(module);
        return module;
    } catch (error) {
        console.error('Failed to load module:', error);
        if (onError) onError(error);
        throw error;
    }
}

/**
 * Lazy load multiple modules in parallel
 * @param {Array<Function>} importFuncs - Array of dynamic import functions
 * @returns {Promise<Array>} - Promise that resolves with all modules
 */
export async function lazyLoadMultiple(importFuncs) {
    try {
        return await Promise.all(importFuncs.map(func => func()));
    } catch (error) {
        console.error('Failed to load one or more modules:', error);
        throw error;
    }
}

/**
 * Lazy load a module when an element becomes visible
 * @param {HTMLElement} element - Element to observe
 * @param {Function} importFunc - Dynamic import function
 * @param {Object} options - IntersectionObserver options
 * @returns {Promise} - Promise that resolves when module is loaded
 */
export function lazyLoadOnVisible(element, importFunc, options = {}) {
    return new Promise((resolve, reject) => {
        const observerOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01,
            ...options
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(async (entry) => {
                if (entry.isIntersecting) {
                    observer.unobserve(element);
                    try {
                        const module = await importFunc();
                        resolve(module);
                    } catch (error) {
                        reject(error);
                    }
                }
            });
        }, observerOptions);

        observer.observe(element);
    });
}

/**
 * Lazy load a module on user interaction (click, hover, focus)
 * @param {HTMLElement} element - Element to attach listeners to
 * @param {Function} importFunc - Dynamic import function
 * @param {Array<string>} events - Events to listen for
 * @returns {Promise} - Promise that resolves when module is loaded
 */
export function lazyLoadOnInteraction(element, importFunc, events = ['click', 'mouseenter', 'focus']) {
    return new Promise((resolve, reject) => {
        let loaded = false;

        const loadModule = async () => {
            if (loaded) return;
            loaded = true;

            // Remove event listeners
            events.forEach(event => element.removeEventListener(event, loadModule));

            try {
                const module = await importFunc();
                resolve(module);
            } catch (error) {
                reject(error);
            }
        };

        // Attach event listeners
        events.forEach(event => element.addEventListener(event, loadModule, { once: true }));
    });
}

/**
 * Preload a module without executing it
 * @param {string} modulePath - Path to the module
 */
export function preloadModule(modulePath) {
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = modulePath;
    document.head.appendChild(link);
}

/**
 * Lazy load with retry logic
 * @param {Function} importFunc - Dynamic import function
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} - Promise that resolves with the module
 */
export async function lazyLoadWithRetry(importFunc, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await importFunc();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
}
