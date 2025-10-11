# Component Documentation

## Overview
This document provides detailed documentation for all UI components and JavaScript modules in the AI Agent Swarm Dashboard application.

## Core Components

### Agent Components

#### Agent Selector
**File:** `js/agent-selector.js`

Provides agent selection interface for users to choose and view different AI agents.

**Features:**
- Agent list display
- Selection state management
- Filter and search capabilities

**Usage:**
```javascript
import { initAgentSelector } from './agent-selector.js';

// Initialize on page load
initAgentSelector();

// Select an agent programmatically
selectAgent('agent-123');
```

**Dependencies:**
- `data-loader.js` for agent data

#### Agent Profile
**File:** `js/agent-profile.js`

Displays detailed agent information including capabilities, performance metrics, and status.

**Features:**
- Profile rendering
- Metric visualization
- Real-time status updates

**Usage:**
```javascript
import { loadAgentProfile } from './agent-profile.js';

// Load agent profile
await loadAgentProfile('agent-123');
```

#### Agent Metrics Table
**File:** `js/agent-metrics-table.js`

Renders sortable, filterable table of agent metrics.

**Features:**
- Dynamic table rendering
- Column sorting
- Row filtering
- Keyboard navigation support

**Usage:**
```javascript
import { renderMetricsTable } from './agent-metrics-table.js';

const metrics = await fetchMetrics();
renderMetricsTable(metrics);
```

### Chart Components

#### Success Rate Chart
**File:** `js/success-rate-chart.js`

Visualizes agent success rates over time using Chart.js.

**Features:**
- Line chart visualization
- Time-series data
- Interactive tooltips
- Responsive design

**Configuration:**
```javascript
{
  type: 'line',
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: { min: 0, max: 100 }
  }
}
```

#### Token Usage Chart
**File:** `js/token-usage-chart.js`

Displays token consumption metrics for agents.

**Features:**
- Bar chart visualization
- Usage comparisons
- Cost calculations

#### Cache Performance Chart
**File:** `js/cache-performance-chart.js`

Visualizes cache hit/miss rates and performance metrics.

**Features:**
- Pie chart visualization
- Performance indicators
- Real-time updates

### Navigation Components

#### Mobile Navigation
**File:** `js/mobile-nav.js`

Responsive mobile navigation menu with hamburger toggle.

**Features:**
- Slide-out navigation
- Touch gesture support
- Accessibility features (ARIA labels)
- Keyboard navigation

**Structure:**
```html
<nav class="mobile-nav">
  <button class="hamburger" aria-label="Toggle menu">
    <span></span>
    <span></span>
    <span></span>
  </button>
  <div class="nav-menu">
    <!-- Navigation items -->
  </div>
</nav>
```

#### Sticky Header
**File:** `js/sticky-header.js`

Fixed header that appears/hides based on scroll direction.

**Features:**
- Scroll-based visibility
- Smooth transitions
- Shadow effects on scroll

**Configuration:**
```javascript
{
  scrollThreshold: 100,
  hideOnScrollDown: true,
  showOnScrollUp: true
}
```

#### Back to Top Button
**File:** `js/back-to-top.js`

Floating button to scroll back to page top.

**Features:**
- Smooth scroll animation
- Visibility based on scroll position
- Accessible button (keyboard support)

### UI Components

#### Theme Toggle
**File:** `js/theme-toggle.js`

Dark/light mode switcher with persistent preference.

**Features:**
- Theme switching
- LocalStorage persistence
- System preference detection
- Smooth transitions

**Usage:**
```javascript
import { initThemeToggle, setTheme } from './theme-toggle.js';

// Initialize
initThemeToggle();

// Set theme programmatically
setTheme('dark');
```

**CSS Variables:**
```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #000000;
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --text-primary: #ffffff;
}
```

#### Hero Carousel
**File:** `js/hero-carousel.js`

Auto-playing hero section carousel with manual controls.

**Features:**
- Auto-play functionality
- Manual navigation
- Touch/swipe support
- Pause on hover
- Indicator dots

**Configuration:**
```javascript
{
  autoPlay: true,
  interval: 5000,
  loop: true,
  swipe: true
}
```

### Form Components

#### Form Validation
**File:** `js/form-validation.js`

Comprehensive form validation with custom rules.

**Features:**
- Real-time validation
- Custom validation rules
- Error message display
- Field-level validation

**Validation Rules:**
```javascript
const rules = {
  required: (value) => value.trim() !== '',
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  minLength: (min) => (value) => value.length >= min,
  maxLength: (max) => (value) => value.length <= max,
  pattern: (regex) => (value) => regex.test(value)
};
```

#### Multi-Step Form
**File:** `js/multi-step-form.js`

Wizard-style multi-step form navigation.

**Features:**
- Step navigation
- Progress indicator
- Step validation
- Data persistence between steps

**Structure:**
```html
<form class="multi-step-form">
  <div class="step" data-step="1">
    <!-- Step 1 fields -->
  </div>
  <div class="step" data-step="2">
    <!-- Step 2 fields -->
  </div>
  <div class="form-controls">
    <button type="button" class="prev">Previous</button>
    <button type="button" class="next">Next</button>
    <button type="submit" class="submit">Submit</button>
  </div>
</form>
```

#### Newsletter Signup
**File:** `js/newsletter-signup.js`

Email newsletter subscription form.

**Features:**
- Email validation
- Duplicate prevention
- Success/error messaging
- Loading states

### CRM Components

#### CRM Integration
**File:** `js/crm-integration.js`

Integration with CRM systems for lead capture.

**Features:**
- Lead submission
- Contact updates
- Interaction tracking
- Error handling

**Configuration:**
```javascript
{
  apiEndpoint: '/api/crm',
  apiKey: process.env.CRM_API_KEY,
  timeout: 5000
}
```

#### CRM Form Handler
**File:** `js/crm-form-handler.js`

Handles form submissions to CRM system.

**Features:**
- Form data mapping
- Submission handling
- Response processing
- Error recovery

### Analytics Components

#### Analytics Events
**File:** `js/analytics-events.js`

Event tracking and analytics integration.

**Features:**
- Custom event tracking
- Page view tracking
- User property tracking
- Conversion tracking

**Usage:**
```javascript
import { trackEvent } from './analytics-events.js';

trackEvent('button_click', {
  button_name: 'Sign Up',
  location: 'hero'
});
```

#### A/B Testing
**File:** `js/ab-testing.js`

A/B test variant assignment and tracking.

**Features:**
- Variant assignment
- Consistent user experience
- Experiment tracking
- Statistical analysis support

**Usage:**
```javascript
import { getVariant } from './ab-testing.js';

const variant = getVariant('hero_cta_test');
if (variant === 'B') {
  // Show variant B
}
```

#### Performance Monitor
**File:** `js/performance-monitor.js`

Client-side performance monitoring.

**Features:**
- Performance metrics collection
- Core Web Vitals tracking
- Resource timing
- Custom metrics

**Metrics Tracked:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)

### Privacy Components

#### Cookie Consent
**File:** `js/cookie-consent.js`

GDPR-compliant cookie consent banner.

**Features:**
- Consent management
- Cookie categorization
- Preference persistence
- Granular controls

**Cookie Categories:**
- Essential (always enabled)
- Analytics
- Marketing
- Preferences

#### Privacy Compliance
**File:** `js/privacy-compliance.js`

GDPR and privacy law compliance features.

**Features:**
- Data export requests
- Data deletion requests
- Consent tracking
- Privacy policy management

**API:**
```javascript
{
  exportData: 'POST /api/privacy/export',
  deleteData: 'POST /api/privacy/delete',
  getConsent: 'GET /api/privacy/consent'
}
```

### Accessibility Components

#### Accessibility Audit
**File:** `js/accessibility-audit.js`

Automated accessibility testing and reporting.

**Features:**
- WCAG 2.1 compliance checking
- Issue detection
- Automated fixes (where possible)
- Audit reporting

**Tests:**
- Color contrast
- ARIA labels
- Keyboard navigation
- Screen reader compatibility

#### Table Keyboard Navigation
**File:** `js/table-keyboard-navigation.js`

Keyboard navigation for data tables.

**Features:**
- Arrow key navigation
- Focus management
- Screen reader announcements
- Cell selection

**Keyboard Controls:**
- Arrow keys: Navigate cells
- Home/End: First/last column
- Ctrl+Home/End: First/last cell
- Enter: Select cell

### Content Loading Components

#### Lazy Loader
**File:** `js/lazy-loader.js`

Generic lazy loading using Intersection Observer.

**Features:**
- Automatic element detection
- Configurable thresholds
- Placeholder support
- Error handling

**Usage:**
```html
<div class="lazy" data-src="content.html">
  <div class="placeholder">Loading...</div>
</div>
```

#### Image Lazy Loader
**File:** `js/lazy-load-images.js`

Specialized image lazy loading.

**Features:**
- Responsive image support
- Blur-up effect
- WebP support with fallback
- Loading animation

**HTML Structure:**
```html
<img class="lazy-image"
     data-src="image.jpg"
     data-srcset="image-small.jpg 480w, image-large.jpg 1200w"
     src="placeholder.jpg"
     alt="Description">
```

#### Component Loader
**File:** `js/component-loader.js`

Dynamic component loading for code splitting.

**Features:**
- On-demand loading
- Dependency management
- Loading states
- Error boundaries

### Internationalization Components

#### i18n
**File:** `js/i18n.js`

Internationalization and localization support.

**Features:**
- Translation management
- Locale switching
- Pluralization
- Date/number formatting

**Translation Format:**
```json
{
  "en": {
    "welcome": "Welcome",
    "button.submit": "Submit"
  },
  "es": {
    "welcome": "Bienvenido",
    "button.submit": "Enviar"
  }
}
```

#### Language Selector
**File:** `js/language-selector.js`

Language selection dropdown.

**Features:**
- Language list display
- Current language indicator
- Smooth transitions
- URL parameter support

### Social Media Components

#### Social Media Share
**File:** `js/social-media-share.js`

Social sharing buttons and functionality.

**Supported Platforms:**
- Twitter/X
- Facebook
- LinkedIn
- Email
- Copy link

**Usage:**
```javascript
import { share } from './social-media-share.js';

share('twitter', {
  url: window.location.href,
  text: 'Check this out!',
  hashtags: ['ai', 'dashboard']
});
```

#### Social Media Feed
**File:** `js/social-media-feed.js`

Embedded social media feed display.

**Features:**
- Multiple platform support
- Feed aggregation
- Auto-refresh
- Filtering

### Interactive Components

#### AI Chatbot
**File:** `js/ai-chatbot.js`

AI-powered chatbot integration.

**Features:**
- Natural language processing
- Context awareness
- Multi-turn conversations
- Suggested responses

**Configuration:**
```javascript
{
  apiEndpoint: '/api/chatbot',
  welcomeMessage: 'How can I help you?',
  maxTurns: 10
}
```

#### Live Chat
**File:** `js/live-chat.js`

Real-time customer support chat.

**Features:**
- WebSocket connection
- Typing indicators
- File sharing
- Chat history

### Animation Components

#### Scroll Animations
**File:** `js/scroll-animations.js`

Scroll-triggered animations using Intersection Observer.

**Features:**
- Fade in animations
- Slide animations
- Stagger effects
- Custom timing

**CSS Classes:**
```css
.animate-on-scroll {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s, transform 0.6s;
}

.animate-on-scroll.animated {
  opacity: 1;
  transform: translateY(0);
}
```

#### Micro Interactions
**File:** `js/micro-interactions.js`

Small interactive animations for user feedback.

**Interactions:**
- Button ripple effects
- Hover animations
- Loading spinners
- Success checkmarks

### Game Components

#### Games Gallery
**File:** `js/games-gallery.js`

Gallery of embedded browser games.

**Features:**
- Game listing
- Game loading
- Fullscreen support
- Save states

**Supported Games:**
- Tetris
- DOOM
- Unity games

#### Tetris
**File:** `js/tetris.js`

Classic Tetris game implementation.

**Features:**
- Canvas rendering
- Keyboard controls
- Score tracking
- Level progression

**Controls:**
- Left/Right: Move piece
- Up: Rotate
- Down: Soft drop
- Space: Hard drop

#### DOOM
**File:** `js/doom.js`

DOOM game integration via WebAssembly.

**Features:**
- WebAssembly execution
- Save game support
- Configurable controls
- Audio support

### Utility Components

#### CDN Utils
**File:** `js/cdn-utils.js`

CDN integration utilities.

**Features:**
- Asset URL generation
- CDN health checks
- Fallback handling
- Preloading

**Usage:**
```javascript
import { getCDNUrl } from './cdn-utils.js';

const imageUrl = getCDNUrl('/images/logo.png');
```

#### Error Tracking
**File:** `js/error-tracking.js`

Client-side error tracking and reporting.

**Features:**
- Error capture
- Stack trace collection
- User context
- Integration with error tracking services

**Captured Errors:**
- JavaScript errors
- Unhandled promise rejections
- Resource loading errors
- API errors

### Service Worker

#### Service Worker Registration
**File:** `js/service-worker-register.js`

Service worker registration and management.

**Features:**
- Registration handling
- Update detection
- Offline support
- Cache management

**Cache Strategies:**
- Cache First: Static assets
- Network First: API calls
- Stale While Revalidate: Images

## Component Lifecycle

### Initialization Pattern
```javascript
// 1. Wait for DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // 2. Initialize component
  initComponent();
});

// 3. Set up event listeners
function initComponent() {
  const element = document.querySelector('.component');
  element.addEventListener('click', handleClick);
}

// 4. Clean up when needed
function destroyComponent() {
  const element = document.querySelector('.component');
  element.removeEventListener('click', handleClick);
}
```

## Best Practices

### Component Development
1. Keep components modular and reusable
2. Use semantic HTML
3. Follow accessibility guidelines
4. Implement proper error handling
5. Clean up event listeners
6. Use CSS custom properties for theming
7. Support keyboard navigation
8. Provide loading states
9. Handle edge cases
10. Document public APIs

### Performance
1. Use lazy loading for non-critical components
2. Debounce/throttle event handlers
3. Minimize DOM manipulation
4. Use CSS animations when possible
5. Implement virtual scrolling for long lists
6. Code split large components
7. Optimize images and assets
8. Cache API responses
9. Use Web Workers for heavy computation
10. Monitor performance metrics

### Accessibility
1. Use proper ARIA labels
2. Support keyboard navigation
3. Provide focus indicators
4. Use semantic HTML elements
5. Ensure color contrast
6. Provide text alternatives
7. Test with screen readers
8. Support reduced motion
9. Implement skip links
10. Provide clear error messages
