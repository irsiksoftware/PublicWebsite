# Live Chat Integration

This project now includes support for live chat customer support through multiple platforms:
- Intercom
- Drift
- Zendesk Chat

## Features

- Multi-platform support with automatic platform detection
- Lazy loading for optimal performance
- Easy configuration through `_config.yml`
- Programmatic API for showing/hiding chat and tracking events
- Responsive design with mobile support
- Accessibility features (ARIA labels, keyboard navigation)
- Dark mode support

## Configuration

### 1. Update `_config.yml`

Add the following configuration to your `_config.yml` file:

```yaml
# Enable live chat support
live_chat:
  enabled: true
  platform: intercom  # Options: intercom, drift, zendesk

  # Intercom configuration (if using Intercom)
  intercom_app_id: YOUR_INTERCOM_APP_ID

  # Drift configuration (if using Drift)
  drift_app_id: YOUR_DRIFT_APP_ID

  # Zendesk Chat configuration (if using Zendesk)
  zendesk_key: YOUR_ZENDESK_KEY
```

### 2. Choose Your Platform

Set the `platform` field to one of:
- `intercom` - For Intercom
- `drift` - For Drift
- `zendesk` - For Zendesk Chat

### 3. Add Platform Credentials

Depending on your chosen platform, update the appropriate credentials:

#### Intercom
- Get your App ID from Intercom dashboard
- Set `intercom_app_id` in config

#### Drift
- Get your App ID from Drift dashboard
- Set `drift_app_id` in config

#### Zendesk Chat
- Get your Widget Key from Zendesk dashboard
- Set `zendesk_key` in config

## Usage

### Automatic Initialization

The live chat widget will automatically initialize when the page loads if configured in `_config.yml`.

### Programmatic API

You can interact with the chat widget programmatically:

```javascript
// Show the chat widget
window.liveChatManager.show();

// Hide the chat widget
window.liveChatManager.hide();

// Update user information
window.liveChatManager.updateUser({
  userId: '12345',
  email: 'user@example.com',
  name: 'John Doe'
});

// Track custom events
window.liveChatManager.trackEvent('feature_viewed', {
  feature: 'pricing_page'
});
```

### Custom Trigger Button (Optional)

If you want to add a custom chat trigger button, add this to your page:

```html
<button
  class="live-chat-trigger"
  onclick="window.liveChatManager.show()"
  data-tooltip="Chat with us"
  aria-label="Open live chat">
  💬
</button>
```

Don't forget to include the CSS:

```html
<link rel="stylesheet" href="/css/live-chat.css">
```

## Platform-Specific Features

### Intercom
- User tracking and identification
- Event tracking
- Custom launcher

### Drift
- Playbooks and campaigns
- Email capture
- Meeting scheduler

### Zendesk Chat
- Department routing
- Pre-chat forms
- Chat ratings

## Troubleshooting

### Chat widget not appearing

1. Verify `live_chat.enabled` is set to `true` in `_config.yml`
2. Check that the platform credentials are correct
3. Check browser console for errors
4. Ensure you've rebuilt the site after config changes

### Multiple chat widgets appearing

Ensure only one platform is enabled at a time. The system will prioritize in this order:
1. Intercom
2. Drift
3. Zendesk Chat

## Security Considerations

- All chat scripts are loaded from official CDNs
- Configuration is loaded server-side to prevent credential exposure
- CSP (Content Security Policy) may need to be updated to allow chat scripts

### CSP Updates

Add these domains to your CSP if needed:

**Intercom:**
- `https://widget.intercom.io`
- `https://api-iam.intercom.io`

**Drift:**
- `https://js.driftt.com`

**Zendesk Chat:**
- `https://v2.zopim.com`

## Performance

The live chat integration is designed for optimal performance:

- Scripts load asynchronously
- No render-blocking
- Lazy initialization
- Minimal JavaScript footprint

## Accessibility

The integration includes:
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast mode support
- Reduced motion preferences

## Support

For platform-specific support:
- Intercom: https://www.intercom.com/help
- Drift: https://help.drift.com
- Zendesk: https://support.zendesk.com

## License

This integration follows the same license as the main project.
