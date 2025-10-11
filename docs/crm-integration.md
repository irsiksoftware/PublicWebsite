# CRM Integration

This document describes the CRM integration system for lead management.

## Overview

The CRM integration module connects the website with popular CRM systems to automatically capture and manage leads from form submissions.

## Supported CRM Providers

- **HubSpot** - Marketing automation and CRM platform
- **Salesforce** - Enterprise CRM solution
- **Pipedrive** - Sales-focused CRM

## Installation

### 1. Import Required Modules

```javascript
import CRMIntegration from './js/crm-integration.js';
import CRMFormHandler from './js/crm-form-handler.js';
```

### 2. Include CSS

```html
<link rel="stylesheet" href="./css/crm-integration.css">
```

## Configuration

### Basic Setup

Create a configuration object with your CRM provider details:

```javascript
const crmConfig = {
    provider: 'hubspot',  // 'hubspot', 'salesforce', or 'pipedrive'
    apiKey: 'your-api-key-here'
};
```

### Form Handler Setup

Attach the CRM handler to your form:

```javascript
const formHandler = new CRMFormHandler('#contact-form', crmConfig);
```

## API Keys

### HubSpot

1. Log in to HubSpot
2. Navigate to Settings → Integrations → Private Apps
3. Create a new private app with contacts scope
4. Copy the access token

### Salesforce

1. Log in to Salesforce
2. Go to Setup → Apps → App Manager
3. Create a Connected App
4. Enable OAuth settings and get access token

### Pipedrive

1. Log in to Pipedrive
2. Navigate to Settings → Personal Preferences → API
3. Copy your personal API token

## Usage

### Direct API Usage

```javascript
// Initialize CRM
const crm = new CRMIntegration({
    provider: 'hubspot',
    apiKey: 'your-api-key'
});

await crm.initialize();

// Create a lead
const lead = await crm.createLead({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    company: 'Acme Inc',
    website: 'https://example.com',
    notes: 'Interested in product demo'
});

// Update a lead
await crm.updateLead(lead.id, {
    phone: '+0987654321'
});

// Get lead by ID
const leadData = await crm.getLead(lead.id);

// Search for leads
const results = await crm.searchLeads({
    email: 'john@example.com'
});
```

### Form Integration

The `CRMFormHandler` class automatically handles form submissions:

```html
<form id="contact-form">
    <input type="text" name="first-name" required>
    <input type="text" name="last-name" required>
    <input type="email" name="email" required>
    <input type="tel" name="phone">
    <input type="text" name="company">
    <textarea name="message"></textarea>
    <button type="submit">Submit</button>
</form>

<script type="module">
    import CRMFormHandler from './js/crm-form-handler.js';

    const handler = new CRMFormHandler('#contact-form', {
        provider: 'hubspot',
        apiKey: 'your-api-key'
    });
</script>
```

### Supported Form Fields

The form handler automatically maps common field names:

| Form Field Names | CRM Field |
|-----------------|-----------|
| first-name, firstname, fname | firstName |
| last-name, lastname, lname | lastName |
| email | email |
| phone, telephone | phone |
| company, organization | company |
| website, url | website |
| message, notes, comments | notes |

## Events

The form handler dispatches custom events for integration with analytics:

```javascript
// Listen for successful lead creation
form.addEventListener('crm:lead:created', (event) => {
    console.log('Lead created:', event.detail);
});

// Listen for errors
form.addEventListener('crm:lead:error', (event) => {
    console.error('CRM error:', event.detail.error);
});
```

## Security

- **API Keys**: Store API keys in environment variables or secure configuration files
- **Never commit API keys** to version control
- Use `.gitignore` to exclude configuration files containing sensitive data
- Implement server-side proxy for API calls in production environments

## Environment Variables

For production deployments, use environment variables:

```javascript
const crmConfig = {
    provider: process.env.CRM_PROVIDER || 'hubspot',
    apiKey: process.env.CRM_API_KEY
};
```

## Error Handling

All CRM methods throw errors that should be caught:

```javascript
try {
    await crm.createLead(leadData);
} catch (error) {
    console.error('Failed to create lead:', error.message);
    // Handle error appropriately
}
```

## Browser Compatibility

- Modern browsers with ES6+ support
- Requires Fetch API support
- Async/await syntax support

## Testing

Test the integration without making real API calls:

```javascript
// Mock mode for testing
const crm = new CRMIntegration({
    provider: 'hubspot',
    apiKey: 'test-key'
});

// Override makeRequest for testing
crm.makeRequest = async () => ({ success: true, id: 'test-123' });
```

## Troubleshooting

### API Connection Fails

- Verify API key is correct
- Check provider selection matches API key
- Ensure API key has necessary permissions

### Form Not Submitting

- Check browser console for errors
- Verify form selector matches actual form ID
- Ensure CRM is initialized before form submission

### CORS Errors

- CRM API calls should be proxied through your server
- Configure CORS headers on your API proxy
- Never expose API keys in client-side code in production

## Production Recommendations

1. **Use Server-Side Proxy**: Route CRM API calls through your backend
2. **Secure API Keys**: Store in environment variables, not client code
3. **Rate Limiting**: Implement rate limiting to avoid API quota issues
4. **Error Logging**: Log errors to monitoring service
5. **Validation**: Add server-side validation for form data

## Example Configuration File

Copy `config/crm-config.example.json` to `config/crm-config.json`:

```json
{
  "provider": "hubspot",
  "apiKey": "YOUR_API_KEY_HERE",
  "formSelector": "#contact-form",
  "options": {
    "autoSync": true,
    "validateEmail": true,
    "showIndicator": true
  }
}
```

## Support

For issues or questions:
- Check CRM provider documentation
- Review browser console for errors
- Verify API key permissions and quotas
