# Deployment Guide

## Overview

This guide covers deployment procedures for the AI Agent Swarm Dashboard application, including development, staging, and production environments.

## Prerequisites

### Required Software
- Node.js (v18 or higher)
- npm (v8 or higher)
- Git
- Modern web browser

### Required Accounts
- GitHub account (for version control)
- CDN provider account (Cloudflare, AWS CloudFront, etc.)
- Hosting provider account (Netlify, Vercel, GitHub Pages, etc.)
- Domain name (for production)

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# API Configuration
API_ENDPOINT=https://api.example.com
API_KEY=your_api_key_here
API_TIMEOUT=5000

# CRM Integration
CRM_API_KEY=your_crm_api_key
CRM_ENDPOINT=https://crm.example.com/api

# Analytics
ANALYTICS_ID=UA-XXXXXXXXX-X
ANALYTICS_DOMAIN=example.com

# CDN Configuration
CDN_URL=https://cdn.example.com
CDN_API_KEY=your_cdn_api_key

# Feature Flags
ENABLE_CHATBOT=true
ENABLE_AB_TESTING=true
ENABLE_LIVE_CHAT=true

# Build Configuration
NODE_ENV=production
BUILD_TARGET=modern
```

## Development Environment

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/PublicWebsite.git
cd PublicWebsite
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start development server:
```bash
npm start
```

The development server will start at `http://localhost:8080` with hot module replacement enabled.

### Development Scripts

```bash
# Start development server
npm start

# Build for development
npm run build:dev

# Watch mode (auto-rebuild)
npm watch

# Run linter
npm run lint

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run e2e

# Optimize CSS
npm run css:optimize

# Optimize images
npm run images:optimize

# Run accessibility audit
npm run a11y:audit
```

## Build Process

### Production Build

1. Ensure all tests pass:
```bash
npm test
npm run e2e:headless
```

2. Run linter:
```bash
npm run lint
```

3. Build for production:
```bash
npm run build
```

The build process will:
- Transpile JavaScript with Babel
- Bundle modules with Webpack
- Minify JavaScript with Terser
- Optimize CSS with PurgeCSS and cssnano
- Optimize images with Sharp
- Generate source maps
- Create content hashes for cache busting
- Output to `public/` directory

### Build Output

```
public/
├── css/
│   ├── main.[hash].css
│   └── main.[hash].css.map
├── js/
│   ├── main.[hash].js
│   ├── vendors.[hash].js
│   └── *.js.map
├── images/
│   ├── *.webp
│   └── *.jpg
└── index.html
```

## Deployment Methods

### Method 1: GitHub Pages

1. Configure GitHub Pages in repository settings
2. Update `package.json`:
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d public"
  }
}
```

3. Deploy:
```bash
npm run deploy
```

### Method 2: Netlify

#### Option A: Git Integration

1. Connect repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `public`
   - Environment variables: Add from `.env`

3. Deploy automatically on push to main branch

#### Option B: Manual Deploy

1. Build locally:
```bash
npm run build
```

2. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

3. Deploy:
```bash
netlify deploy --prod --dir=public
```

### Method 3: Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Configure `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "public"
      }
    }
  ],
  "routes": [
    {
      "src": "/service-worker.js",
      "headers": {
        "cache-control": "max-age=0, must-revalidate"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

3. Deploy:
```bash
vercel --prod
```

### Method 4: AWS S3 + CloudFront

1. Create S3 bucket:
```bash
aws s3 mb s3://your-bucket-name
```

2. Configure bucket for static website hosting:
```bash
aws s3 website s3://your-bucket-name --index-document index.html
```

3. Build and upload:
```bash
npm run build
aws s3 sync public/ s3://your-bucket-name --delete
```

4. Create CloudFront distribution:
```bash
aws cloudfront create-distribution \
  --origin-domain-name your-bucket-name.s3.amazonaws.com \
  --default-root-object index.html
```

5. Invalidate CloudFront cache after updates:
```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## CDN Deployment

### Configure CDN

Update `config/cdn.config.js`:

```javascript
export const CDN_CONFIG = {
  provider: 'cloudflare',
  apiKey: process.env.CDN_API_KEY,
  zoneId: process.env.CDN_ZONE_ID,
  baseUrl: 'https://cdn.example.com',
  regions: ['us-east', 'us-west', 'eu-west', 'ap-southeast'],
  caching: {
    static: {
      maxAge: 31536000, // 1 year
      patterns: ['*.js', '*.css', '*.woff2']
    },
    images: {
      maxAge: 2592000, // 30 days
      patterns: ['*.jpg', '*.png', '*.webp']
    },
    html: {
      maxAge: 3600, // 1 hour
      patterns: ['*.html']
    }
  },
  optimization: {
    minify: {
      js: true,
      css: true,
      html: true
    },
    compression: 'brotli',
    imageOptimization: true
  }
};
```

### Deploy to CDN

```bash
npm run cdn:deploy
```

This will:
1. Build optimized assets
2. Upload to CDN
3. Purge CDN cache
4. Verify deployment

## Database and Backend

### API Configuration

If using a backend API:

1. Configure API endpoint in `.env`:
```bash
API_ENDPOINT=https://api.example.com
```

2. Update CORS settings on backend:
```javascript
// Backend configuration
const corsOptions = {
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};
```

### Database Migrations

If using a database:

```bash
# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Backup database
npm run db:backup
```

## Monitoring Setup

### Error Tracking

Configure error tracking service (e.g., Sentry):

```javascript
// js/error-tracking.js
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,
  tracesSampleRate: 1.0
});
```

### Analytics

Configure analytics tracking:

```javascript
// js/analytics-events.js
window.dataLayer = window.dataLayer || [];

function gtag() {
  dataLayer.push(arguments);
}

gtag('js', new Date());
gtag('config', process.env.ANALYTICS_ID);
```

### Performance Monitoring

Enable performance monitoring:

```javascript
// js/performance-monitor.js
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // Send metrics to monitoring service
    sendMetric({
      name: entry.name,
      value: entry.value,
      rating: entry.rating
    });
  }
});

observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
```

## Domain Configuration

### DNS Settings

Configure DNS records:

```
# A Records
@       A       192.0.2.1
www     A       192.0.2.1

# CNAME (if using CDN)
cdn     CNAME   your-cdn.example.com

# TXT Record (for verification)
@       TXT     "verification-code"
```

### SSL/TLS Certificate

1. For Netlify/Vercel: SSL is automatic
2. For AWS/Custom server:

```bash
# Using Let's Encrypt with Certbot
certbot certonly --webroot \
  -w /var/www/html \
  -d example.com \
  -d www.example.com
```

## Continuous Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Run E2E tests
        run: npm run e2e:headless

      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
          API_ENDPOINT: ${{ secrets.API_ENDPOINT }}
          CDN_URL: ${{ secrets.CDN_URL }}

      - name: Deploy to CDN
        run: npm run cdn:deploy
        env:
          CDN_API_KEY: ${{ secrets.CDN_API_KEY }}

      - name: Deploy to hosting
        run: npm run deploy
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}

      - name: Notify success
        if: success()
        run: echo "Deployment successful!"

      - name: Notify failure
        if: failure()
        run: echo "Deployment failed!"
```

## Rollback Procedures

### Manual Rollback

1. Identify last working version:
```bash
git log --oneline
```

2. Checkout previous version:
```bash
git checkout <commit-hash>
```

3. Build and deploy:
```bash
npm run build
npm run deploy
```

### Automated Rollback

Configure automatic rollback in CI/CD:

```yaml
- name: Health check
  run: |
    response=$(curl -s -o /dev/null -w "%{http_code}" https://example.com)
    if [ $response -ne 200 ]; then
      echo "Health check failed, rolling back"
      git checkout HEAD~1
      npm run build
      npm run deploy
      exit 1
    fi
```

## Post-Deployment Checklist

### Verification Steps

- [ ] Site loads correctly
- [ ] All pages accessible
- [ ] Images loading properly
- [ ] JavaScript functionality working
- [ ] Forms submitting correctly
- [ ] Navigation working
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility
- [ ] SSL certificate valid
- [ ] Analytics tracking
- [ ] Error tracking active
- [ ] Performance within targets
- [ ] Accessibility compliance

### Performance Targets

- Lighthouse Score: > 90
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Total Blocking Time (TBT): < 200ms
- Cumulative Layout Shift (CLS): < 0.1
- Speed Index: < 3.4s

### Testing

```bash
# Run Lighthouse audit
npm run lighthouse

# Run accessibility audit
npm run a11y:audit

# Test service worker
npm run test:sw

# Test on multiple browsers
npm run test:browsers
```

## Troubleshooting

### Common Issues

#### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Service Worker Issues

```bash
# Unregister service worker
# Open DevTools > Application > Service Workers > Unregister

# Clear cache
# DevTools > Application > Clear storage
```

#### CDN Cache Issues

```bash
# Purge CDN cache
npm run cdn:purge

# Or manually:
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

#### DNS Propagation

```bash
# Check DNS propagation
dig example.com
nslookup example.com

# Wait up to 48 hours for full propagation
```

## Security Considerations

### Pre-Deployment Security Checklist

- [ ] All secrets in environment variables (not in code)
- [ ] CSP headers configured
- [ ] HTTPS enforced
- [ ] Security headers set (HSTS, X-Frame-Options, etc.)
- [ ] Dependencies updated
- [ ] Vulnerability scan completed
- [ ] Input validation implemented
- [ ] Output sanitization active
- [ ] Rate limiting configured
- [ ] CORS properly configured

### Security Headers

Configure in hosting provider or `.htaccess`:

```
# Security headers
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Backup and Recovery

### Backup Strategy

```bash
# Backup source code (already in Git)
git push origin main

# Backup build artifacts
tar -czf backup-$(date +%Y%m%d).tar.gz public/

# Upload to backup storage
aws s3 cp backup-$(date +%Y%m%d).tar.gz s3://backups/
```

### Disaster Recovery

1. Restore from Git:
```bash
git clone https://github.com/yourusername/repo.git
cd repo
npm install
npm run build
npm run deploy
```

2. Or restore from backup:
```bash
aws s3 cp s3://backups/backup-20250101.tar.gz .
tar -xzf backup-20250101.tar.gz
npm run deploy
```

## Maintenance

### Regular Tasks

#### Daily
- Monitor error logs
- Check performance metrics
- Review analytics

#### Weekly
- Update dependencies
- Review security alerts
- Backup data

#### Monthly
- Full security audit
- Performance optimization review
- Documentation updates
- User feedback review

### Updates

```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Update major versions carefully
npm install package@latest

# Test after updates
npm test
npm run e2e:headless
```

## Support and Resources

### Documentation
- [GitHub Repository](https://github.com/yourusername/repo)
- [API Documentation](./API.md)
- [Component Documentation](./COMPONENTS.md)
- [Architecture Overview](./ARCHITECTURE.md)

### Contact
- Technical Support: tech@example.com
- DevOps Team: devops@example.com
- Emergency: +1-555-0100

### External Resources
- [Webpack Documentation](https://webpack.js.org/)
- [Netlify Documentation](https://docs.netlify.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [AWS Documentation](https://docs.aws.amazon.com/)
