# Google Analytics 4 Integration Setup Guide

## Overview
This project now includes Google Analytics 4 (GA4) tracking with cookie consent management and custom event tracking.

## Setup Instructions

### 1. Create Google Analytics 4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click "Admin" in the left sidebar
3. Click "Create Property"
4. Follow the setup wizard to create a GA4 property
5. Get your Measurement ID (format: `G-XXXXXXXXXX`)

### 2. Configure the Website

Edit `_config.yml` and add your Measurement ID:

```yaml
google_analytics_id: "G-XXXXXXXXXX"
```

### 3. Rebuild and Deploy

```bash
# If using Jekyll
bundle exec jekyll build

# Deploy your site
```

## Features

### Cookie Consent Banner
- Automatically displays on first visit
- Stores user preference in localStorage
- Compliant with privacy regulations
- Styled to match site theme

### Custom Event Tracking

The following events are automatically tracked:

- **Page Views**: Tracked on every page load
- **External Links**: Clicks on external links
- **File Downloads**: PDF, ZIP, DOC, DOCX files
- **Scroll Depth**: 25%, 50%, 75%, 100% milestones

### Manual Event Tracking

Use these JavaScript functions for custom tracking:

```javascript
// Track button clicks
trackButtonClick('Button Name', 'Button Location');

// Track link clicks
trackLinkClick('https://example.com', 'Link Text');

// Track form submissions
trackFormSubmission('Contact Form', 'contact-form-id');

// Track downloads
trackDownload('file.pdf', 'pdf');

// Track video interactions
trackVideo('play', 'Video Title');
trackVideo('pause', 'Video Title');

// Track search
trackSearch('search term', 10);

// Track custom conversions
trackConversion('signup', 99.99, 'USD');
```

### Conversion Tracking

To track conversions with Google Ads:

```javascript
trackConversion('AW-CONVERSION_ID/CONVERSION_LABEL', 100, 'USD');
```

## Privacy Features

- **IP Anonymization**: Enabled by default
- **Consent Mode**: Respects user privacy choices
- **Cookie Flags**: SameSite and Secure flags set
- **Storage Denial**: Analytics storage denied until consent given

## Testing

### Test Cookie Consent
1. Open site in incognito mode
2. Verify cookie banner appears
3. Click "Accept" or "Decline"
4. Refresh page - banner should not appear again

### Test Event Tracking
1. Open Chrome DevTools > Network tab
2. Filter by "google-analytics.com" or "analytics.js"
3. Interact with the site (scroll, click links, etc.)
4. Verify events are being sent

### Test in Google Analytics
1. Go to Analytics > Reports > Realtime
2. Open your website
3. Verify your visit appears in real-time report
4. Navigate around and verify events appear

## Files Created

- `_includes/google-analytics.html` - GA4 initialization with consent mode
- `_includes/cookie-consent.html` - Cookie consent banner HTML & JS
- `css/cookie-consent.css` - Banner styles (responsive, dark mode support)
- `js/analytics-events.js` - Custom event tracking functions
- `ANALYTICS_SETUP.md` - This setup guide

## Files Modified

- `_includes/head.html` - Added GA script and cookie consent CSS
- `_includes/scripts.html` - Added analytics events script
- `_layouts/default.html` - Added cookie consent banner
- `_config.yml` - Added google_analytics_id configuration

## Troubleshooting

### Events not tracking
- Verify `google_analytics_id` is set in `_config.yml`
- Check cookie consent is "accepted" in browser localStorage
- Open DevTools Console for any JavaScript errors
- Verify GA4 property is active

### Banner not appearing
- Clear localStorage: `localStorage.clear()`
- Verify `css/cookie-consent.css` is loading
- Check browser console for errors

### Dark mode styling issues
- Verify CSS variables are defined in `css/variables.css`
- Check browser supports `prefers-color-scheme`

## Resources

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [GA4 Event Reference](https://support.google.com/analytics/answer/9267735)
- [Consent Mode](https://support.google.com/analytics/answer/9976101)
