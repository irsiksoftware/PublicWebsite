# A/B Testing Framework Guide

## Overview

The A/B Testing Framework provides a simple yet powerful way to run experiments on your website to optimize user experience and conversion rates.

## Features

- **Easy Test Creation**: Simple API for creating and managing A/B tests
- **Weighted Variants**: Support for unequal traffic distribution across variants
- **Persistent Assignments**: User assignments stored in localStorage
- **Analytics Integration**: Automatic tracking of assignments and conversions
- **Flexible Application**: Apply variants through configuration or programmatically

## Quick Start

### 1. Include the Script

Add the A/B testing script to your HTML:

```html
<script src="js/ab-testing.js"></script>
```

### 2. Create a Test

```javascript
// Create a simple A/B test
ABTesting.createTest('button-color-test', {
    description: 'Test button color impact on clicks',
    variants: [
        { name: 'control', weight: 50 },
        { name: 'blue', weight: 50 }
    ],
    onAssignment: function(variant) {
        console.log('User assigned to:', variant.name);
    }
});
```

### 3. Get and Apply Variant

```javascript
// Get the assigned variant for the user
const variant = ABTesting.getVariant('button-color-test');

// Apply changes based on variant
if (variant.name === 'blue') {
    document.getElementById('cta-button').style.backgroundColor = '#0066cc';
}
```

### 4. Track Conversions

```javascript
// Track when user completes the goal
document.getElementById('cta-button').addEventListener('click', function() {
    ABTesting.trackConversion('button-color-test', 'button_click');
});
```

## API Reference

### Creating Tests

#### `createTest(testId, config)`

Creates a new A/B test.

**Parameters:**
- `testId` (string): Unique identifier for the test
- `config` (object):
  - `description` (string): Human-readable description
  - `variants` (array): Array of variant objects
    - `name` (string): Variant name
    - `weight` (number, optional): Traffic percentage (auto-distributed if omitted)
  - `onAssignment` (function, optional): Callback when variant is assigned

**Example:**
```javascript
ABTesting.createTest('pricing-test', {
    description: 'Test pricing page layout',
    variants: [
        { name: 'control', weight: 60 },
        { name: 'simplified', weight: 40 }
    ],
    onAssignment: (variant) => {
        console.log('Assigned to:', variant.name);
    }
});
```

### Getting Variants

#### `getVariant(testId)`

Gets or assigns a variant for the current user.

**Returns:** Variant object or null

**Example:**
```javascript
const variant = ABTesting.getVariant('pricing-test');
if (variant) {
    console.log('Current variant:', variant.name);
}
```

### Applying Variants

#### `applyVariant(testId, variantConfigs)`

Apply variant-specific changes using configuration object.

**Parameters:**
- `testId` (string): Test identifier
- `variantConfigs` (object): Object mapping variant names to functions

**Example:**
```javascript
ABTesting.applyVariant('headline-test', {
    control: () => {
        document.querySelector('h1').textContent = 'Welcome to Our Site';
    },
    variant: () => {
        document.querySelector('h1').textContent = 'Your Success Starts Here';
    }
});
```

#### `isInVariant(testId, variantName)`

Check if user is in a specific variant.

**Returns:** Boolean

**Example:**
```javascript
if (ABTesting.isInVariant('button-color-test', 'blue')) {
    // Apply blue variant styling
}
```

### Tracking Conversions

#### `trackConversion(testId, goalName, value)`

Track a conversion event.

**Parameters:**
- `testId` (string): Test identifier
- `goalName` (string): Name of the conversion goal
- `value` (number, optional): Value associated with conversion

**Example:**
```javascript
// Simple conversion
ABTesting.trackConversion('pricing-test', 'signup');

// Conversion with value
ABTesting.trackConversion('pricing-test', 'purchase', 99.99);
```

### Managing Tests

#### `resetTest(testId)`

Reset assignment for a specific test.

```javascript
ABTesting.resetTest('button-color-test');
```

#### `resetAllTests()`

Reset all test assignments.

```javascript
ABTesting.resetAllTests();
```

#### `getActiveTests()`

Get all active test assignments.

**Returns:** Object with test assignments

```javascript
const activeTests = ABTesting.getActiveTests();
console.log(activeTests);
// { 'button-color-test': { variant: 'blue', assignedAt: 1234567890 } }
```

## Best Practices

### 1. Statistical Significance

- Run tests until you reach statistical significance
- Minimum sample size: 100 per variant (configurable)
- Confidence level: 95% (configurable)
- Use external tools for significance calculation

### 2. Test Duration

- Run tests for at least 1-2 weeks to account for weekly patterns
- Don't stop tests early even if results look promising
- Consider seasonality and external factors

### 3. Test Design

- Test one variable at a time for clear results
- Have a clear hypothesis before starting
- Define success metrics upfront
- Document expected impact

### 4. Implementation

- Apply variants as early as possible to avoid flicker
- Use `onAssignment` callback for immediate changes
- Keep variant logic simple and maintainable
- Test thoroughly in development

### 5. Analytics

- Ensure analytics consent before tracking
- Track both assignment and conversion events
- Use meaningful goal names
- Monitor test performance regularly

## Common Use Cases

### 1. Button Color/Text Test

```javascript
ABTesting.createTest('cta-test', {
    variants: [
        { name: 'green-buy', weight: 33.33 },
        { name: 'blue-buy', weight: 33.33 },
        { name: 'green-start', weight: 33.34 }
    ]
});

ABTesting.applyVariant('cta-test', {
    'green-buy': () => {
        const btn = document.querySelector('.cta-button');
        btn.style.backgroundColor = '#28a745';
        btn.textContent = 'Buy Now';
    },
    'blue-buy': () => {
        const btn = document.querySelector('.cta-button');
        btn.style.backgroundColor = '#007bff';
        btn.textContent = 'Buy Now';
    },
    'green-start': () => {
        const btn = document.querySelector('.cta-button');
        btn.style.backgroundColor = '#28a745';
        btn.textContent = 'Get Started';
    }
});
```

### 2. Layout Test

```javascript
ABTesting.createTest('layout-test', {
    variants: [
        { name: 'sidebar-left', weight: 50 },
        { name: 'sidebar-right', weight: 50 }
    ]
});

const variant = ABTesting.getVariant('layout-test');
if (variant.name === 'sidebar-right') {
    document.body.classList.add('sidebar-right-layout');
}
```

### 3. Pricing Display Test

```javascript
ABTesting.createTest('pricing-display', {
    variants: [
        { name: 'monthly-first', weight: 50 },
        { name: 'annual-first', weight: 50 }
    ]
});

ABTesting.applyVariant('pricing-display', {
    'monthly-first': () => {
        document.querySelector('.pricing-toggle').setAttribute('data-default', 'monthly');
    },
    'annual-first': () => {
        document.querySelector('.pricing-toggle').setAttribute('data-default', 'annual');
    }
});

// Track conversion
document.querySelectorAll('.pricing-cta').forEach(btn => {
    btn.addEventListener('click', () => {
        ABTesting.trackConversion('pricing-display', 'pricing_click');
    });
});
```

## Debugging

Enable debug mode in the configuration:

```javascript
// In ab-tests.config.js
settings: {
    debug: true
}
```

Or use browser console:

```javascript
// View all active tests
console.log(ABTesting.getActiveTests());

// Check specific variant
console.log(ABTesting.getVariant('test-id'));

// View all tests
console.log(ABTesting.tests);
```

## Integration with Analytics

The framework automatically tracks events in Google Analytics (GA4) when available:

**Assignment Event:**
- Event name: `ab_test_assignment`
- Parameters:
  - `test_id`: Test identifier
  - `variant`: Assigned variant name
  - `test_description`: Test description

**Conversion Event:**
- Event name: `ab_test_conversion`
- Parameters:
  - `test_id`: Test identifier
  - `variant`: User's variant
  - `goal_name`: Conversion goal name
  - `value`: Conversion value (if provided)

## Configuration File

Use `config/ab-tests.config.js` to centrally manage all tests:

```javascript
export const abTestsConfig = {
    active: {
        'homepage-hero': {
            description: 'Test hero section variants',
            variants: [
                { name: 'video-bg', weight: 50 },
                { name: 'image-bg', weight: 50 }
            ],
            goals: ['cta_click', 'scroll_depth']
        }
    },
    settings: {
        enabled: true,
        assignmentTTL: 30,
        debug: false
    }
};
```

## Limitations

- Requires localStorage (falls back gracefully if unavailable)
- Analytics tracking requires user consent
- Client-side only (no server-side variant assignment)
- Assignments persist for 30 days by default

## Support

For issues, questions, or feature requests, please refer to the project documentation or contact the development team.
