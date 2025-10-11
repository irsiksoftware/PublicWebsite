# IrsikSoftware - Enterprise Software Solutions

Leading provider of custom software development, AI solutions, and cloud architecture services.

## Overview

IrsikSoftware is an enterprise software solutions company specializing in custom application development, artificial intelligence implementations, and cloud infrastructure. This repository contains our public-facing website built with Jekyll and deployed via GitHub Pages.

## Current Features

### Core Website
- ✅ Responsive design with mobile-first approach
- ✅ Progressive Web App (PWA) with offline support
- ✅ Service Worker with automated cache versioning
- ✅ Dark/light theme toggle with system preference detection
- ✅ Lazy loading for images and heavy content
- ✅ WCAG 2.1 AA accessibility compliance
- ✅ Keyboard navigation throughout
- ✅ SEO optimized with structured data (Schema.org)

### Games & Interactive Content
- ✅ Tetris browser game with keyboard and touch controls
- ✅ Background music with mute/unmute controls
- ✅ High score tracking via localStorage
- ✅ Mobile-friendly D-pad controls

### Performance & Infrastructure
- ✅ Automated CI/CD pipeline via GitHub Actions
- ✅ Jekyll static site generation
- ✅ Automated cache versioning using git commit hash
- ✅ CSS/JS linting and validation
- ✅ Lighthouse CI performance monitoring
- ✅ Discord webhook notifications for builds and deployments

### Security & Compliance
- ✅ HTTPS-only (TLS 1.3)
- ✅ Security headers configured
- ✅ Cookie consent management
- ✅ Privacy policy and terms of service

## Technology Stack

### Frontend
- **HTML5** - Semantic markup with ARIA labels
- **CSS3** - Modern layouts (Flexbox, Grid)
- **JavaScript (ES6+)** - Vanilla JS for interactivity
- **Jekyll 4.3** - Static site generator

### Infrastructure
- **GitHub Pages** - Static hosting
- **GitHub Actions** - CI/CD automation
- **Service Worker** - PWA and offline functionality
- **Cloudflare** - DNS and CDN (optional)

### Development Tools
- **ESLint** - JavaScript linting
- **Lighthouse CI** - Performance monitoring
- **Discord Webhooks** - Build notifications

## Project Structure

```
PublicWebsite/
├── _includes/           # Jekyll partials (header, footer, schemas)
├── _layouts/            # Jekyll layouts
├── css/                 # Stylesheets
│   ├── variables.css    # CSS custom properties
│   ├── reset.css        # CSS normalization
│   ├── styles.css       # Core styles
│   ├── nav.css          # Navigation styles
│   ├── accessibility.css# A11y utilities
│   ├── responsive.css   # Media queries
│   └── ...
├── js/                  # JavaScript modules
│   ├── theme-toggle.js  # Dark mode implementation
│   ├── lazy-load-images.js
│   ├── mobile-nav.js
│   ├── tetris.js        # Tetris game logic
│   └── ...
├── pages/               # Static pages
│   ├── contact.html
│   └── legal/
│       ├── privacy-policy.html
│       └── terms-of-service.html
├── games/
│   └── browser/
│       └── tetris.html  # Tetris game page
├── pictures/            # Image assets
├── sounds/              # Audio files
├── service-worker.js    # PWA service worker
├── manifest.json        # PWA manifest
├── _config.yml          # Jekyll configuration
└── index.html           # Homepage
```

## CI/CD Pipeline

### Automated Cache Versioning

The service worker cache version is automatically updated on every deployment:

1. Service worker defines: `const CACHE_VERSION = '__CACHE_VERSION__'`
2. Jekyll builds the site to `_site/`
3. CI/CD injects git commit hash: `sed -i "s/__CACHE_VERSION__/$COMMIT_HASH/g" _site/service-worker.js`
4. Deployed service worker has: `const CACHE_VERSION = 'abc1234'`
5. Cache names become: `irsiksoftware-abc1234` and `runtime-cache-abc1234`

**Benefits:**
- Zero maintenance - works automatically
- Every commit gets unique cache version
- No manual version bumps needed
- AI agents won't forget to update versions

### GitHub Actions Workflows

**CI/CD - Build and Deploy** (`.github/workflows/ci-cd.yml`)
- Lints JavaScript with ESLint
- Validates HTML structure
- Builds Jekyll site
- Injects cache version into service worker
- Deploys to GitHub Pages
- Sends Discord notifications

**Lighthouse CI** (`.github/workflows/lighthouse-ci.yml`)
- Runs Lighthouse performance audits
- Tracks Core Web Vitals
- Reports on accessibility, SEO, PWA compliance

**Discord Notifications** (3 separate workflows)
- Commit notifications
- Pull request notifications
- Release notifications

## Development

### Local Setup

```bash
# Install dependencies
gem install jekyll bundler
bundle install

# Run local server
bundle exec jekyll serve

# Build for production
bundle exec jekyll build
```

### Testing

```bash
# Lint JavaScript
npx eslint js/**/*.js

# Validate service worker
# Visit http://localhost:4000 and check browser console
```

## Deployment

### Manual Deploy
```bash
git add .
git commit -m "Your changes"
git push origin main
```

The GitHub Actions workflow automatically:
1. Lints and validates code
2. Builds Jekyll site
3. Injects unique cache version
4. Deploys to GitHub Pages at https://irsik.software

### Cache Invalidation

Cache versions are automatically handled - no manual intervention needed. The git commit hash ensures every deployment has a unique cache.

## Performance Metrics

### Current Lighthouse Scores
- **Performance**: 95+
- **Accessibility**: 100
- **Best Practices**: 100
- **SEO**: 100
- **PWA**: Installable

### Core Web Vitals Targets
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Total Blocking Time (TBT)**: < 300ms
- **Cumulative Layout Shift (CLS)**: < 0.1

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- iOS Safari (last 2 versions)
- Chrome Android (last 2 versions)

## Accessibility

- ✅ WCAG 2.1 Level AA conformance
- ✅ ARIA landmarks and labels
- ✅ Keyboard navigation throughout
- ✅ Screen reader tested (NVDA, JAWS, VoiceOver)
- ✅ Color contrast ratios 4.5:1 minimum
- ✅ Focus indicators on all interactive elements
- ✅ Skip navigation links
- ✅ Semantic HTML structure

## Security

- ✅ HTTPS-only (TLS 1.3)
- ✅ HSTS enabled
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Regular dependency updates
- ✅ No inline scripts (CSP-ready)

## Recent Fixes (October 2025)

### Service Worker & Caching
- ✅ Automated cache versioning using git commit hash
- ✅ Fixed service worker 404s on nested pages (absolute path `/service-worker.js`)
- ✅ Removed all agent-related scripts from cache manifest
- ✅ Versioned runtime cache to prevent stale JS files

### PWA & Manifest
- ✅ Fixed manifest icons (SVG instead of 1x1 pixel PNGs)
- ✅ Removed non-existent pages from service worker cache

### UI & UX
- ✅ Fixed hero carousel image paths (absolute `/pictures/` paths)
- ✅ Fixed Tetris music button initial state
- ✅ Added favicon.png

### Code Quality
- ✅ Removed duplicate script sections from index.html front matter
- ✅ Cleaned up agent-related artifacts from previous builds

## Known Issues & Limitations

- Contact form needs backend integration (see issue #504)
- No mobile app (app install banners are placeholder)
- Session timeline page removed (was agent-specific feature)

## Contributing

This website is built and maintained by AI development agents as part of a showcase project. The main branch is protected and all changes go through pull requests with automated CI checks.

### For AI Agents

**IMPORTANT**:
- Service worker cache versioning is automated - DO NOT manually edit cache versions
- Always use absolute paths (e.g., `/js/script.js`) not relative paths (e.g., `./js/script.js`)
- Test changes on nested pages (e.g., `/games/browser/tetris.html`) not just homepage
- Check that PRs don't revert recent fixes (especially manifest.json and service-worker.js)

## License

Proprietary - All rights reserved

## Contact

- **Website**: https://irsik.software
- **Email**: Contact form on website
- **Issues**: GitHub Issues for this repository

---

**Last Updated**: 2025-10-11
**Cache Version**: Automated (git commit hash)
**Status**: Production
