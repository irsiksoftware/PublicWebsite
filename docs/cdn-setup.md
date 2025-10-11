# CDN Setup Guide

## Overview

This project is configured to use a Content Delivery Network (CDN) for serving static assets globally. The CDN integration improves website performance by:

- Reducing latency through edge server distribution
- Decreasing origin server load
- Providing automatic asset caching
- Enabling global content delivery

## Configuration

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
CDN_DOMAIN=cdn.irsik.software
NODE_ENV=production
CDN_PURGE_API_KEY=your_api_key
CDN_PURGE_API_SECRET=your_api_secret
```

### 2. CDN Provider Setup

The configuration supports multiple CDN providers:

#### Cloudflare (Default)
1. Add your domain to Cloudflare
2. Configure DNS records
3. Enable CDN features in dashboard
4. Update `CDN_DOMAIN` in `.env`

#### AWS CloudFront
1. Create CloudFront distribution
2. Configure origin settings
3. Set up SSL/TLS certificate
4. Update provider in `config/cdn.config.js`

#### Fastly
1. Create Fastly service
2. Configure origin and domains
3. Set up TLS
4. Update provider configuration

#### Custom CDN
1. Configure your CDN provider
2. Update `config/cdn.config.js` with custom settings

## Usage

### Automatic Asset CDN Integration

When building for production, assets are automatically configured to use CDN:

```bash
npm run build
```

This sets `publicPath` in webpack to use the CDN domain.

### Manual CDN URL Generation

Use the CDN utility functions in JavaScript:

```javascript
import { getCDNAssetUrl, preloadCDNAssets } from './js/cdn-utils.js';

// Get CDN URL for an asset
const imageUrl = getCDNAssetUrl('/images/hero.jpg');

// Preload critical assets
preloadCDNAssets([
  '/css/main.css',
  '/js/main.js',
  '/images/hero.webp'
]);
```

### Performance Monitoring

Monitor CDN performance in development:

```javascript
import { logCDNMetrics, getCDNPerformanceMetrics } from './js/cdn-utils.js';

// Log metrics to console
logCDNMetrics();

// Get metrics programmatically
const metrics = getCDNPerformanceMetrics();
console.log(`Average CDN response time: ${metrics.averageDuration}ms`);
```

## Asset Types Served via CDN

By default, the following asset types use CDN:

- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`
- **Stylesheets**: `.css`
- **Scripts**: `.js`
- **Fonts**: `.woff`, `.woff2`, `.ttf`, `.otf`
- **Videos**: `.mp4`, `.webm`, `.ogg`

Configure in `config/cdn.config.js`:

```javascript
assetTypes: {
  images: true,
  css: true,
  js: true,
  fonts: true,
  videos: true
}
```

## Cache Headers

Assets are served with optimized cache headers:

- **Images, CSS, JS, Fonts**: 1 year (`max-age=31536000, immutable`)
- **Videos**: 30 days (`max-age=2592000`)

Customize in `config/cdn.config.js`.

## CDN Regions

The configuration includes multiple edge regions:

- US East
- US West
- EU West
- EU Central
- Asia Pacific
- Asia Northeast

## Deployment Workflow

### 1. Build Assets

```bash
npm run build
```

This creates optimized, hashed assets in the `dist/` directory.

### 2. Upload to CDN

Upload the contents of `dist/` to your CDN origin:

#### Cloudflare
```bash
# Using wrangler CLI
wrangler pages publish dist/
```

#### AWS S3 + CloudFront
```bash
# Upload to S3
aws s3 sync dist/ s3://your-bucket-name/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

#### Fastly
```bash
# Upload via Fastly API or control panel
# Then purge cache
curl -X POST https://api.fastly.com/service/YOUR_SERVICE_ID/purge_all \
  -H "Fastly-Key: YOUR_API_KEY"
```

### 3. Cache Purging

Purge CDN cache when deploying updates:

```javascript
const { purgeCDNCache } = require('./config/cdn.config.js');

// Purge specific paths
await purgeCDNCache([
  '/js/main.*.js',
  '/css/main.*.css'
]);
```

## Performance Optimizations

The CDN configuration includes:

- **Gzip/Brotli compression**: Automatic compression for text assets
- **HTTP/2 & HTTP/3**: Modern protocol support
- **Image optimization**: Automatic format conversion and resizing
- **Minification**: CSS and JS minification

## Security Features

- **HTTPS only**: All assets served over HTTPS
- **CORS enabled**: Cross-origin resource sharing configured
- **HSTS**: HTTP Strict Transport Security enabled

## Troubleshooting

### CDN Not Loading Assets

1. Verify `CDN_DOMAIN` in `.env`
2. Check `NODE_ENV=production`
3. Ensure assets uploaded to CDN origin
4. Check browser console for errors

### Cache Not Updating

1. Purge CDN cache after deployment
2. Verify cache headers are correct
3. Use versioned/hashed filenames (automatic with webpack)

### CORS Errors

1. Ensure CORS headers are configured on CDN
2. Check `Access-Control-Allow-Origin` is set to `*` or your domain
3. Verify font files have proper CORS headers

## Monitoring

Enable CDN monitoring in `config/cdn.config.js`:

```javascript
monitoring: {
  enabled: true,
  realUserMonitoring: true,
  cacheHitRate: true,
  bandwidth: true
}
```

## Development vs Production

- **Development**: CDN disabled, assets served locally
- **Production**: CDN enabled, assets served from edge locations

Override by setting `CDN_CONFIG.enabled` in configuration.

## Support

For CDN-related issues:
1. Check CDN provider status page
2. Review `docs/cdn-setup.md` (this file)
3. Check application logs for CDN errors
4. Test with CDN disabled to isolate issues
