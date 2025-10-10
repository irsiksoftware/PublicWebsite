# Code Splitting and Lazy Loading Guide

## Overview

This project implements advanced code splitting and lazy loading strategies to optimize initial page load performance and improve user experience.

## Key Components

### 1. Lazy Loader Module (`js/lazy-loader.js`)

Core utility module providing various lazy loading strategies:

- **`lazyLoad()`** - Basic dynamic import with loading state management
- **`lazyLoadOnVisible()`** - Load modules when elements become visible (Intersection Observer)
- **`lazyLoadOnInteraction()`** - Load modules on user interaction (click, hover, focus)
- **`lazyLoadWithRetry()`** - Retry logic for failed imports
- **`preloadModule()`** - Preload modules without executing them

### 2. Component Loader (`js/component-loader.js`)

Manages lazy loading of UI components with loading states:

- **Chart Components** - Loaded when visible in viewport
- **Agent Components** - Loaded based on visibility and interaction
- **Session Components** - Loaded on-demand
- **Game Components** - Loaded on user interaction
- **Roles Overview** - Loaded when visible

### 3. Main Entry Point (`js/main.js`)

Implements dynamic imports for optimal initial load:

- Component loader initialized asynchronously
- Scroll-based lazy loading for back-to-top and sticky header
- Conditional loading based on DOM elements

## Code Splitting Strategy

### Webpack Configuration

Enhanced `webpack.config.cjs` with advanced code splitting:

```javascript
splitChunks: {
  chunks: 'all',
  maxInitialRequests: 25,
  maxAsyncRequests: 25,
  minSize: 20000,
  maxSize: 244000,
  cacheGroups: {
    vendor: { /* node_modules */ },
    charts: { /* chart components */ },
    agents: { /* agent components */ },
    sessions: { /* session components */ },
    games: { /* game components */ },
    utils: { /* utility modules */ }
  }
}
```

### Cache Groups

1. **Vendor** (Priority 10) - Third-party dependencies
2. **Charts** (Priority 8) - All chart-related components
3. **Agents** (Priority 8) - Agent-related components
4. **Sessions** (Priority 8) - Session-related components
5. **Games** (Priority 8) - Game components (Tetris, Unity)
6. **Utils** (Priority 7) - Utility modules
7. **Common** (Priority 5) - Shared code across components

## Loading States

### CSS Classes

- `.component-loading` - Loading spinner container
- `.skeleton` - Skeleton loading animation
- `.component-error` - Error state display
- `.component-loaded` - Fade-in animation for loaded components

### Accessibility

- ARIA live regions for loading states
- Screen reader announcements
- Keyboard-accessible retry buttons
- Reduced motion support

## Usage Examples

### Lazy Load on Visibility

```javascript
import { lazyLoadOnVisible } from './lazy-loader.js';

const element = document.querySelector('[data-component="chart"]');
lazyLoadOnVisible(element, () => import('./charts.js'));
```

### Lazy Load on Interaction

```javascript
import { lazyLoadOnInteraction } from './lazy-loader.js';

const button = document.querySelector('.play-button');
lazyLoadOnInteraction(button, () => import('./game.js'));
```

### With Loading States

```javascript
import { lazyLoad } from './lazy-loader.js';

lazyLoad(() => import('./module.js'), {
  onLoading: () => showSpinner(),
  onSuccess: (module) => initializeModule(module),
  onError: (error) => showError(error)
});
```

## Performance Benefits

1. **Reduced Initial Bundle Size** - Main bundle only contains critical code
2. **Faster Time to Interactive** - Non-critical code loaded on-demand
3. **Improved Caching** - Separate chunks cached independently
4. **Better Resource Prioritization** - Critical resources loaded first
5. **Network Efficiency** - Only load what's needed when needed

## Best Practices

1. **Critical CSS/JS First** - Load essential resources immediately
2. **Visibility-Based Loading** - Use Intersection Observer for below-fold content
3. **Interaction-Based Loading** - Defer heavy features until user interaction
4. **Progressive Enhancement** - Ensure fallbacks for loading failures
5. **Performance Monitoring** - Track loading performance with Performance API

## Browser Support

- Modern browsers with ES6+ support
- Fallback for browsers without Intersection Observer
- Graceful degradation for older browsers

## Monitoring

Use the Performance API to track lazy loading:

```javascript
// Main.js marks when bundle is loaded
window.performance.mark('main-js-loaded');

// Measure time to interactive
window.performance.measure('time-to-interactive', 'navigationStart', 'main-js-loaded');
```

## Future Enhancements

1. **Prefetching** - Predict and preload likely-needed modules
2. **Service Worker Integration** - Cache lazy-loaded chunks
3. **Route-Based Splitting** - Split code by application routes
4. **A/B Testing** - Test different loading strategies
5. **Analytics Integration** - Track loading performance metrics
