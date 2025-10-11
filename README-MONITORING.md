# Error Tracking and Performance Monitoring

This document describes the error tracking and performance monitoring system implemented for production monitoring.

## Overview

The monitoring system consists of two main components:

1. **Error Tracking** (`js/error-tracking.js`) - Captures and reports JavaScript errors
2. **Performance Monitoring** (`js/performance-monitor.js`) - Tracks and reports performance metrics

Both systems automatically initialize when the page loads and send data to configurable endpoints.

## Error Tracking

### Features

- **Global Error Handling**: Automatically captures unhandled JavaScript errors
- **Promise Rejection Tracking**: Catches unhandled promise rejections
- **Network Error Monitoring**: Tracks failed fetch requests and resource loading errors
- **Error Sampling**: Configurable sampling rate to control reporting volume
- **Ignore Patterns**: Filter out known/expected errors
- **Context Enrichment**: Includes environment, user agent, viewport, and performance data
- **Reliable Reporting**: Uses `navigator.sendBeacon` for guaranteed delivery

### Configuration

```javascript
import errorTracker from './error-tracking.js';

// Default configuration
{
  endpoint: '/api/errors',
  sampleRate: 1.0,
  ignorePatterns: [
    /Script error/i,
    /ResizeObserver loop/i
  ],
  additionalContext: {
    environment: 'production',
    version: '1.0.0'
  }
}
```

### Manual Error Reporting

```javascript
import errorTracker from './error-tracking.js';

// Log errors manually
try {
  // risky operation
} catch (error) {
  errorTracker.logError(error, { context: 'custom-operation' });
}

// Get error statistics
const stats = errorTracker.getStats();
console.log(`Total errors: ${stats.totalErrors}`);
```

### Error Data Structure

Each error report includes:
- Error message and stack trace
- Timestamp and URL
- User agent and viewport dimensions
- Performance metrics (memory usage, load time)
- Custom context data
- Error type (error, unhandledrejection, network, resource, manual)

## Performance Monitoring

### Features

- **Page Load Metrics**: DNS, TCP, request/response times, DOM processing
- **Web Vitals Tracking**: LCP, FID, CLS, FCP
- **Resource Performance**: Track loading time and size of all resources
- **Long Task Detection**: Identify tasks blocking the main thread
- **User Interaction Tracking**: Measure interaction latency
- **Periodic Reporting**: Automatically send reports at configurable intervals
- **Memory Monitoring**: Track JavaScript heap usage

### Configuration

```javascript
import performanceMonitor from './performance-monitor.js';

// Default configuration
{
  endpoint: '/api/performance',
  reportInterval: 30000, // 30 seconds
  trackResourceTiming: true,
  trackLongTasks: true,
  longTaskThreshold: 50 // ms
}
```

### Manual Usage

```javascript
import performanceMonitor from './performance-monitor.js';

// Get current metrics
const metrics = performanceMonitor.getMetrics();

// Force a report
performanceMonitor.report();
```

### Performance Data Structure

Reports include:
- Page load timing breakdown
- Web Vitals (LCP, FID, CLS, FCP)
- Resource timing data
- Long task occurrences
- User interaction latency
- Memory usage statistics

## Integration

The monitoring modules are automatically included in the webpack bundle and loaded on all pages:

```javascript
// Webpack configuration includes:
chunks: [
  'main',
  'error-tracking',
  'performance-monitor',
  // ... other chunks
]
```

Both systems initialize automatically when the DOM is ready.

## Backend Implementation

To receive monitoring data, implement the following endpoints:

### Error Tracking Endpoint

```
POST /api/errors
Content-Type: application/json

{
  "message": "Error message",
  "stack": "Error stack trace",
  "type": "error",
  "timestamp": "2025-10-11T...",
  "url": "https://...",
  "userAgent": "...",
  "viewport": { "width": 1920, "height": 1080 },
  "performance": { ... },
  ...
}
```

### Performance Monitoring Endpoint

```
POST /api/performance
Content-Type: application/json

{
  "pageLoad": { ... },
  "vitals": {
    "lcp": { "value": 1234 },
    "fid": { "value": 56 },
    "cls": { "value": 0.12 },
    "fcp": { "value": 789 }
  },
  "resources": [ ... ],
  "longTasks": [ ... ],
  "interactions": [ ... ],
  "memory": { ... },
  "timestamp": "2025-10-11T..."
}
```

## Browser Support

- **Error Tracking**: All modern browsers
- **Performance Monitoring**:
  - Basic metrics: All modern browsers
  - Web Vitals: Chrome 77+, Edge 79+
  - Long Tasks API: Chrome 58+, Edge 79+

## Privacy Considerations

- No personally identifiable information (PII) is collected by default
- User agent and viewport data is included for debugging
- Configure `additionalContext` carefully to avoid sensitive data
- Implement appropriate backend sanitization and storage

## Production Recommendations

1. **Set up backend endpoints** to receive and store monitoring data
2. **Configure sampling rate** for high-traffic sites to reduce data volume
3. **Set up alerting** for critical errors and performance regressions
4. **Monitor endpoint health** to ensure monitoring system reliability
5. **Review ignore patterns** regularly to filter noise
6. **Implement data retention** policies for stored monitoring data

## Testing

The monitoring system is active in all environments. Test by:

1. Triggering errors: `throw new Error('test error')`
2. Checking browser console for monitoring logs
3. Verifying network requests to monitoring endpoints
4. Reviewing collected metrics using the JavaScript API

## Troubleshooting

### Errors not being captured

- Check browser console for initialization messages
- Verify `sampleRate` is not too low
- Check if error matches `ignorePatterns`
- Ensure error tracking initialized before error occurred

### Performance data missing

- Verify browser supports required APIs
- Check `reportInterval` configuration
- Ensure performance monitoring initialized
- Check for CSP restrictions on `navigator.sendBeacon`

## Future Enhancements

Potential additions:
- Source map integration for better stack traces
- Session replay capabilities
- Advanced error grouping and deduplication
- Real User Monitoring (RUM) dashboard
- Automated performance budgets and alerting
- Integration with third-party monitoring services
