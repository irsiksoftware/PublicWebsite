# API Documentation

## Overview
This document provides comprehensive API documentation for the AI Agent Swarm Dashboard application.

## JavaScript Modules

### Agent Management

#### `agent-selector.js`
Agent selection and display functionality.

**Functions:**
- `initAgentSelector()`: Initializes the agent selection interface
- `selectAgent(agentId)`: Selects a specific agent by ID
- `getSelectedAgent()`: Returns the currently selected agent

#### `agent-profile.js`
Agent profile management and display.

**Functions:**
- `loadAgentProfile(agentId)`: Loads and displays agent profile data
- `updateAgentProfile(agentData)`: Updates agent profile information
- `getAgentMetrics(agentId)`: Retrieves metrics for a specific agent

#### `agent-metrics-table.js`
Agent metrics table rendering and management.

**Functions:**
- `renderMetricsTable(data)`: Renders the agent metrics table
- `updateTableRow(agentId, metrics)`: Updates a specific row in the metrics table
- `sortTable(column, direction)`: Sorts table by specified column

### Data Management

#### `data-loader.js`
Handles data loading and API communication.

**Functions:**
- `loadData(endpoint)`: Loads data from specified endpoint
- `refreshData()`: Refreshes all data from the server
- `getData(key)`: Retrieves cached data by key

**API Endpoints:**
```javascript
{
  agents: '/api/agents',
  metrics: '/api/metrics',
  sessions: '/api/sessions'
}
```

#### `data-refresh.js`
Automatic data refresh functionality.

**Functions:**
- `startAutoRefresh(interval)`: Starts automatic data refresh
- `stopAutoRefresh()`: Stops automatic data refresh
- `setRefreshInterval(interval)`: Sets the refresh interval in milliseconds

### Charts and Visualization

#### `charts.js`
Main chart rendering module.

**Functions:**
- `initCharts()`: Initializes all charts
- `updateChart(chartId, data)`: Updates a specific chart with new data
- `destroyChart(chartId)`: Destroys a chart instance

#### `success-rate-chart.js`
Success rate visualization.

**Functions:**
- `renderSuccessRateChart(data)`: Renders success rate chart
- `updateSuccessRateChart(data)`: Updates success rate chart with new data

#### `token-usage-chart.js`
Token usage visualization.

**Functions:**
- `renderTokenUsageChart(data)`: Renders token usage chart
- `updateTokenUsageChart(data)`: Updates token usage chart

#### `cache-performance-chart.js`
Cache performance metrics visualization.

**Functions:**
- `renderCachePerformanceChart(data)`: Renders cache performance chart
- `updateCachePerformance(metrics)`: Updates cache performance data

### UI Components

#### `mobile-nav.js`
Mobile navigation functionality.

**Functions:**
- `initMobileNav()`: Initializes mobile navigation
- `toggleMobileNav()`: Toggles mobile navigation visibility
- `closeMobileNav()`: Closes mobile navigation

#### `theme-toggle.js`
Dark/light theme switching.

**Functions:**
- `initThemeToggle()`: Initializes theme toggle functionality
- `toggleTheme()`: Toggles between light and dark themes
- `setTheme(theme)`: Sets a specific theme ('light' or 'dark')
- `getTheme()`: Returns the current theme

#### `hero-carousel.js`
Hero section carousel functionality.

**Functions:**
- `initCarousel(options)`: Initializes carousel with options
- `nextSlide()`: Advances to next slide
- `prevSlide()`: Goes to previous slide
- `goToSlide(index)`: Jumps to specific slide

#### `sticky-header.js`
Sticky header scroll behavior.

**Functions:**
- `initStickyHeader()`: Initializes sticky header functionality
- `updateHeaderState()`: Updates header state based on scroll position

#### `back-to-top.js`
Back to top button functionality.

**Functions:**
- `initBackToTop()`: Initializes back to top button
- `scrollToTop()`: Smoothly scrolls to top of page

### Forms

#### `form-validation.js`
Form validation utilities.

**Functions:**
- `validateForm(formElement)`: Validates an entire form
- `validateField(fieldElement)`: Validates a single field
- `addValidationRule(fieldName, rule)`: Adds custom validation rule
- `clearValidation(formElement)`: Clears validation errors

**Validation Rules:**
```javascript
{
  required: (value) => value.trim() !== '',
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  minLength: (min) => (value) => value.length >= min,
  maxLength: (max) => (value) => value.length <= max
}
```

#### `multi-step-form.js`
Multi-step form navigation.

**Functions:**
- `initMultiStepForm(formElement)`: Initializes multi-step form
- `nextStep()`: Advances to next form step
- `prevStep()`: Goes to previous form step
- `goToStep(stepIndex)`: Jumps to specific step

#### `newsletter-signup.js`
Newsletter subscription functionality.

**Functions:**
- `initNewsletterSignup()`: Initializes newsletter signup form
- `subscribe(email)`: Submits newsletter subscription
- `handleSubscriptionResponse(response)`: Handles subscription response

### CRM Integration

#### `crm-integration.js`
CRM system integration.

**Functions:**
- `initCRMIntegration()`: Initializes CRM integration
- `submitLead(leadData)`: Submits lead to CRM
- `updateContact(contactId, data)`: Updates contact in CRM
- `trackInteraction(interactionData)`: Tracks user interaction

**API:**
```javascript
{
  endpoint: '/api/crm',
  methods: {
    createLead: 'POST /leads',
    updateContact: 'PUT /contacts/:id',
    trackEvent: 'POST /events'
  }
}
```

#### `crm-form-handler.js`
CRM form submission handling.

**Functions:**
- `initCRMFormHandler()`: Initializes CRM form handlers
- `handleFormSubmit(event)`: Handles form submission to CRM
- `mapFormDataToCRM(formData)`: Maps form data to CRM format

### Analytics

#### `analytics-events.js`
Analytics event tracking.

**Functions:**
- `trackEvent(eventName, properties)`: Tracks custom event
- `trackPageView(page)`: Tracks page view
- `trackConversion(conversionData)`: Tracks conversion event
- `setUserProperties(properties)`: Sets user properties

#### `ab-testing.js`
A/B testing functionality.

**Functions:**
- `initABTesting()`: Initializes A/B testing
- `getVariant(testName)`: Gets variant for a test
- `trackExperiment(testName, variant)`: Tracks experiment exposure

#### `performance-monitor.js`
Performance monitoring.

**Functions:**
- `initPerformanceMonitor()`: Initializes performance monitoring
- `trackPerformance(metricName, value)`: Tracks performance metric
- `getPerformanceMetrics()`: Returns collected performance metrics

### Privacy & Compliance

#### `cookie-consent.js`
Cookie consent management.

**Functions:**
- `initCookieConsent()`: Initializes cookie consent banner
- `acceptCookies()`: Accepts all cookies
- `rejectCookies()`: Rejects non-essential cookies
- `updateConsent(preferences)`: Updates cookie preferences

#### `privacy-compliance.js`
GDPR and privacy compliance.

**Functions:**
- `initPrivacyCompliance()`: Initializes privacy compliance features
- `requestDataExport()`: Requests user data export
- `requestDataDeletion()`: Requests user data deletion
- `getConsentStatus()`: Returns current consent status

#### `data-processing-agreements.js`
Data processing agreement management.

**Functions:**
- `showDPA()`: Displays data processing agreement
- `acceptDPA()`: Records DPA acceptance
- `getDPAStatus()`: Returns DPA acceptance status

### Accessibility

#### `accessibility-audit.js`
Accessibility auditing tools.

**Functions:**
- `runAudit()`: Runs accessibility audit
- `getAuditResults()`: Returns audit results
- `fixAccessibilityIssue(issue)`: Attempts to fix accessibility issue

#### `table-keyboard-navigation.js`
Keyboard navigation for tables.

**Functions:**
- `initTableKeyboardNav(tableElement)`: Enables keyboard navigation
- `focusCell(row, col)`: Focuses specific cell
- `handleArrowKeys(event)`: Handles arrow key navigation

### Content Loading

#### `lazy-loader.js`
Lazy loading utilities.

**Functions:**
- `initLazyLoader(options)`: Initializes lazy loading
- `loadElement(element)`: Loads a specific element
- `unobserve(element)`: Stops observing an element

#### `lazy-load-images.js`
Image lazy loading.

**Functions:**
- `initImageLazyLoad()`: Initializes image lazy loading
- `loadImage(imgElement)`: Loads a specific image
- `preloadImage(src)`: Preloads an image

#### `component-loader.js`
Dynamic component loading.

**Functions:**
- `loadComponent(componentName)`: Loads a component dynamically
- `unloadComponent(componentName)`: Unloads a component
- `isComponentLoaded(componentName)`: Checks if component is loaded

### Internationalization

#### `i18n.js`
Internationalization support.

**Functions:**
- `initI18n(locale)`: Initializes i18n with locale
- `translate(key, params)`: Translates a key
- `setLocale(locale)`: Changes current locale
- `getLocale()`: Returns current locale

#### `language-selector.js`
Language selection UI.

**Functions:**
- `initLanguageSelector()`: Initializes language selector
- `changeLanguage(locale)`: Changes application language
- `getSupportedLanguages()`: Returns list of supported languages

### Social Media

#### `social-media-share.js`
Social media sharing functionality.

**Functions:**
- `initSocialShare()`: Initializes social sharing
- `share(platform, content)`: Shares content to platform
- `generateShareUrl(platform, url, title)`: Generates share URL

#### `social-media-feed.js`
Social media feed integration.

**Functions:**
- `initSocialFeed()`: Initializes social media feed
- `loadFeed(platform)`: Loads feed from platform
- `refreshFeed()`: Refreshes social media feed

### Interactive Features

#### `ai-chatbot.js`
AI chatbot integration.

**Functions:**
- `initChatbot()`: Initializes chatbot
- `sendMessage(message)`: Sends message to chatbot
- `receiveMessage(response)`: Handles chatbot response

#### `live-chat.js`
Live chat functionality.

**Functions:**
- `initLiveChat()`: Initializes live chat
- `openChat()`: Opens chat window
- `closeChat()`: Closes chat window
- `sendChatMessage(message)`: Sends chat message

### Animation

#### `scroll-animations.js`
Scroll-triggered animations.

**Functions:**
- `initScrollAnimations()`: Initializes scroll animations
- `animateOnScroll(element, animation)`: Animates element on scroll
- `resetAnimations()`: Resets all animations

#### `micro-interactions.js`
Micro-interaction animations.

**Functions:**
- `initMicroInteractions()`: Initializes micro-interactions
- `addInteraction(element, interaction)`: Adds interaction to element
- `removeInteraction(element)`: Removes interaction from element

### Games

#### `games-gallery.js`
Games gallery functionality.

**Functions:**
- `initGamesGallery()`: Initializes games gallery
- `loadGame(gameId)`: Loads a specific game
- `getAvailableGames()`: Returns list of available games

#### `tetris.js`
Tetris game implementation.

**Functions:**
- `initTetris()`: Initializes Tetris game
- `startGame()`: Starts new game
- `pauseGame()`: Pauses game
- `endGame()`: Ends game

#### `doom.js`
DOOM game integration.

**Functions:**
- `initDoom()`: Initializes DOOM game
- `loadDoom()`: Loads DOOM game assets

#### `unity-loader.js`
Unity game loader.

**Functions:**
- `loadUnityGame(gameConfig)`: Loads Unity game
- `unloadUnityGame()`: Unloads Unity game

### Utilities

#### `cdn-utils.js`
CDN utility functions.

**Functions:**
- `getCDNUrl(asset)`: Returns CDN URL for asset
- `preloadAsset(url)`: Preloads asset from CDN
- `checkCDNHealth()`: Checks CDN availability

#### `error-tracking.js`
Error tracking and reporting.

**Functions:**
- `initErrorTracking()`: Initializes error tracking
- `trackError(error)`: Tracks an error
- `setUserContext(context)`: Sets user context for errors

#### `csp-config.js`
Content Security Policy configuration.

**Functions:**
- `getCSPConfig()`: Returns CSP configuration
- `validateCSP()`: Validates CSP compliance

### Service Worker

#### `service-worker-register.js`
Service worker registration.

**Functions:**
- `registerServiceWorker()`: Registers service worker
- `unregisterServiceWorker()`: Unregisters service worker
- `updateServiceWorker()`: Updates service worker

## Events

### Custom Events

The application dispatches the following custom events:

```javascript
// Data events
'data:loaded' - Fired when data is loaded
'data:updated' - Fired when data is updated
'data:error' - Fired when data loading fails

// Theme events
'theme:changed' - Fired when theme changes

// Navigation events
'nav:open' - Fired when mobile nav opens
'nav:close' - Fired when mobile nav closes

// Form events
'form:valid' - Fired when form validation passes
'form:invalid' - Fired when form validation fails
'form:submit' - Fired when form is submitted

// Chart events
'chart:rendered' - Fired when chart is rendered
'chart:updated' - Fired when chart data is updated

// Agent events
'agent:selected' - Fired when agent is selected
'agent:updated' - Fired when agent data is updated
```

## Configuration

### Environment Variables

Create `.env` file based on `.env.example`:

```bash
API_ENDPOINT=https://api.example.com
CRM_API_KEY=your_api_key
ANALYTICS_ID=your_analytics_id
CDN_URL=https://cdn.example.com
```

### Build Configuration

See `config/webpack.config.cjs` for build configuration options.

## Error Handling

All API functions follow consistent error handling:

```javascript
try {
  const result = await apiFunction();
  return { success: true, data: result };
} catch (error) {
  console.error('Error:', error);
  return { success: false, error: error.message };
}
```

## Best Practices

1. Always initialize modules before use
2. Handle errors gracefully
3. Clean up event listeners when components unmount
4. Use lazy loading for non-critical resources
5. Follow accessibility guidelines (WCAG 2.1)
6. Respect user privacy and consent preferences
7. Track performance metrics for optimization
