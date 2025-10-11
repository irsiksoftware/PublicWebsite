/**
 * CDN Configuration for Global Content Delivery
 *
 * This configuration enables CDN integration for static assets
 * to improve global performance and reduce latency.
 */

const CDN_CONFIG = {
  // CDN provider settings
  provider: 'cloudflare', // Options: 'cloudflare', 'cloudfront', 'fastly', 'custom'

  // CDN domain for static assets
  domain: process.env.CDN_DOMAIN || 'cdn.irsik.software',

  // Enable/disable CDN
  enabled: process.env.NODE_ENV === 'production',

  // Asset types to serve from CDN
  assetTypes: {
    images: true,
    css: true,
    js: true,
    fonts: true,
    videos: true
  },

  // Cache control headers for different asset types
  cacheHeaders: {
    images: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*'
    },
    css: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*'
    },
    js: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*'
    },
    fonts: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*'
    },
    videos: {
      'Cache-Control': 'public, max-age=2592000',
      'Access-Control-Allow-Origin': '*'
    }
  },

  // CDN regions/edge locations
  regions: [
    'us-east',
    'us-west',
    'eu-west',
    'eu-central',
    'asia-pacific',
    'asia-northeast'
  ],

  // Purge/invalidation settings
  purge: {
    enabled: true,
    apiKey: process.env.CDN_PURGE_API_KEY,
    apiSecret: process.env.CDN_PURGE_API_SECRET
  },

  // Performance optimizations
  optimizations: {
    gzip: true,
    brotli: true,
    http2: true,
    http3: true,
    imageOptimization: true,
    minification: true
  },

  // Security settings
  security: {
    https: true,
    hsts: true,
    cors: true,
    hotlinkProtection: false
  },

  // Monitoring and analytics
  monitoring: {
    enabled: true,
    realUserMonitoring: true,
    cacheHitRate: true,
    bandwidth: true
  }
};

/**
 * Get the full CDN URL for an asset
 * @param {string} assetPath - Relative path to the asset
 * @returns {string} Full CDN URL
 */
function getCDNUrl(assetPath) {
  if (!CDN_CONFIG.enabled) {
    return assetPath;
  }

  // Remove leading slash if present
  const cleanPath = assetPath.startsWith('/') ? assetPath.substring(1) : assetPath;

  return `https://${CDN_CONFIG.domain}/${cleanPath}`;
}

/**
 * Get cache headers for a specific asset type
 * @param {string} assetType - Type of asset (images, css, js, fonts, videos)
 * @returns {object} Cache headers
 */
function getCacheHeaders(assetType) {
  return CDN_CONFIG.cacheHeaders[assetType] || {
    'Cache-Control': 'public, max-age=3600'
  };
}

/**
 * Check if an asset should be served from CDN
 * @param {string} assetPath - Path to the asset
 * @returns {boolean} Whether asset should use CDN
 */
function shouldUseCDN(assetPath) {
  if (!CDN_CONFIG.enabled) {
    return false;
  }

  const extension = assetPath.split('.').pop().toLowerCase();

  if (CDN_CONFIG.assetTypes.images && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'].includes(extension)) {
    return true;
  }
  if (CDN_CONFIG.assetTypes.css && extension === 'css') {
    return true;
  }
  if (CDN_CONFIG.assetTypes.js && extension === 'js') {
    return true;
  }
  if (CDN_CONFIG.assetTypes.fonts && ['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(extension)) {
    return true;
  }
  if (CDN_CONFIG.assetTypes.videos && ['mp4', 'webm', 'ogg'].includes(extension)) {
    return true;
  }

  return false;
}

/**
 * Purge/invalidate CDN cache for specific paths
 * @param {string[]} paths - Array of paths to purge
 * @returns {Promise} Purge operation promise
 */
async function purgeCDNCache(paths) {
  if (!CDN_CONFIG.purge.enabled || !CDN_CONFIG.enabled) {
    console.log('CDN purge not enabled');
    return;
  }

  // Implementation would depend on CDN provider
  console.log(`Purging CDN cache for paths: ${paths.join(', ')}`);

  // Example for Cloudflare
  if (CDN_CONFIG.provider === 'cloudflare') {
    // Would implement Cloudflare API call here
    return Promise.resolve();
  }

  // Example for CloudFront
  if (CDN_CONFIG.provider === 'cloudfront') {
    // Would implement CloudFront invalidation here
    return Promise.resolve();
  }

  return Promise.resolve();
}

module.exports = {
  CDN_CONFIG,
  getCDNUrl,
  getCacheHeaders,
  shouldUseCDN,
  purgeCDNCache
};
