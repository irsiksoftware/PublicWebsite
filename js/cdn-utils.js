/**
 * CDN Utility Functions
 *
 * Helper functions for managing CDN asset loading and performance monitoring
 */

/**
 * Get the CDN URL for an asset
 * @param {string} assetPath - Relative path to the asset
 * @returns {string} Full CDN URL or original path
 */
export function getCDNAssetUrl(assetPath) {
    const cdnDomain = window.CDN_CONFIG?.domain || null;
    const cdnEnabled = window.CDN_CONFIG?.enabled || false;

    if (!cdnEnabled || !cdnDomain) {
        return assetPath;
    }

    // Remove leading slash if present
    const cleanPath = assetPath.startsWith('/') ? assetPath.substring(1) : assetPath;

    return `https://${cdnDomain}/${cleanPath}`;
}

/**
 * Preload critical assets from CDN
 * @param {string[]} assetPaths - Array of asset paths to preload
 */
export function preloadCDNAssets(assetPaths) {
    if (!Array.isArray(assetPaths)) {
        return;
    }

    assetPaths.forEach(assetPath => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = getCDNAssetUrl(assetPath);

        // Determine asset type
        const extension = assetPath.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
            link.as = 'image';
        } else if (extension === 'css') {
            link.as = 'style';
        } else if (extension === 'js') {
            link.as = 'script';
        } else if (['woff', 'woff2', 'ttf', 'otf'].includes(extension)) {
            link.as = 'font';
            link.crossOrigin = 'anonymous';
        }

        document.head.appendChild(link);
    });
}

/**
 * Monitor CDN performance for loaded assets
 * @returns {object} CDN performance metrics
 */
export function getCDNPerformanceMetrics() {
    if (!window.performance || !window.performance.getEntriesByType) {
        return null;
    }

    const resourceEntries = performance.getEntriesByType('resource');
    const cdnDomain = window.CDN_CONFIG?.domain;

    if (!cdnDomain) {
        return null;
    }

    const cdnResources = resourceEntries.filter(entry =>
        entry.name.includes(cdnDomain)
    );

    if (cdnResources.length === 0) {
        return null;
    }

    const metrics = {
        totalRequests: cdnResources.length,
        totalDuration: 0,
        averageDuration: 0,
        totalTransferSize: 0,
        resources: []
    };

    cdnResources.forEach(resource => {
        const duration = resource.responseEnd - resource.requestStart;
        metrics.totalDuration += duration;
        metrics.totalTransferSize += resource.transferSize || 0;

        metrics.resources.push({
            name: resource.name,
            duration: duration,
            size: resource.transferSize || 0,
            type: resource.initiatorType
        });
    });

    metrics.averageDuration = metrics.totalRequests > 0
        ? metrics.totalDuration / metrics.totalRequests
        : 0;

    return metrics;
}

/**
 * Dynamically load an image from CDN with fallback
 * @param {string} imagePath - Path to the image
 * @param {string} fallbackPath - Fallback path if CDN fails
 * @returns {Promise<HTMLImageElement>} Promise that resolves with the loaded image
 */
export function loadImageFromCDN(imagePath, fallbackPath = null) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const cdnUrl = getCDNAssetUrl(imagePath);

        img.onload = () => resolve(img);

        img.onerror = () => {
            // Try fallback if provided
            if (fallbackPath && fallbackPath !== imagePath) {
                img.src = fallbackPath;
                img.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
            } else {
                reject(new Error(`Failed to load image from CDN: ${imagePath}`));
            }
        };

        img.src = cdnUrl;
    });
}

/**
 * Log CDN performance metrics to console (development only)
 */
export function logCDNMetrics() {
    const metrics = getCDNPerformanceMetrics();

    if (!metrics) {
        console.log('CDN metrics not available');
        return;
    }

    console.group('CDN Performance Metrics');
    console.log(`Total CDN Requests: ${metrics.totalRequests}`);
    console.log(`Average Response Time: ${metrics.averageDuration.toFixed(2)}ms`);
    console.log(`Total Transfer Size: ${(metrics.totalTransferSize / 1024).toFixed(2)}KB`);

    if (metrics.resources.length > 0) {
        console.table(metrics.resources.map(r => ({
            Resource: r.name.split('/').pop(),
            Duration: `${r.duration.toFixed(2)}ms`,
            Size: `${(r.size / 1024).toFixed(2)}KB`,
            Type: r.type
        })));
    }

    console.groupEnd();
}

/**
 * Check if CDN is available and responsive
 * @returns {Promise<boolean>} Promise that resolves with CDN availability status
 */
export async function checkCDNAvailability() {
    const cdnDomain = window.CDN_CONFIG?.domain;
    const cdnEnabled = window.CDN_CONFIG?.enabled;

    if (!cdnEnabled || !cdnDomain) {
        return false;
    }

    try {
    // Try to fetch a small test resource (like a 1x1 pixel image)
        const testUrl = `https://${cdnDomain}/health-check`;
        await fetch(testUrl, {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache'
        });

        return true;
    } catch (error) {
        console.warn('CDN availability check failed:', error);
        return false;
    }
}

/**
 * Initialize CDN configuration from meta tags or inline config
 */
export function initializeCDNConfig() {
    // Check for CDN config in meta tags
    const cdnDomainMeta = document.querySelector('meta[name="cdn-domain"]');
    const cdnEnabledMeta = document.querySelector('meta[name="cdn-enabled"]');

    if (cdnDomainMeta || cdnEnabledMeta) {
        window.CDN_CONFIG = {
            domain: cdnDomainMeta?.content || 'cdn.irsik.software',
            enabled: cdnEnabledMeta?.content === 'true'
        };
    }

    // If already defined globally, use that
    if (!window.CDN_CONFIG) {
        window.CDN_CONFIG = {
            domain: 'cdn.irsik.software',
            enabled: false
        };
    }
}

// Auto-initialize on module load
if (typeof window !== 'undefined') {
    initializeCDNConfig();
}

export default {
    getCDNAssetUrl,
    preloadCDNAssets,
    getCDNPerformanceMetrics,
    loadImageFromCDN,
    logCDNMetrics,
    checkCDNAvailability,
    initializeCDNConfig
};
