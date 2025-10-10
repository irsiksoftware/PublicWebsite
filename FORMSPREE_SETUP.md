# Formspree Integration Setup

## Overview
The contact form has been integrated with Formspree, a third-party form backend service that handles form submissions without requiring a custom backend server.

## Setup Instructions

### 1. Create a Formspree Account
1. Go to [https://formspree.io](https://formspree.io)
2. Sign up for a free account (or use an existing account)

### 2. Create a New Form
1. Log into your Formspree dashboard
2. Click "New Form" or "+" button
3. Give your form a name (e.g., "Contact Form - Swarm Showcase")
4. Copy the form endpoint ID (it will look like: `xyzabc123`)

### 3. Update the Form Action
In `contact.html`, update the form action attribute:

```html
<form class="contact-form" action="https://formspree.io/f/YOUR_FORM_ID" method="post">
```

Replace `YOUR_FORM_ID` with your actual Formspree form ID.

### 4. Configure Form Settings (Optional)
In your Formspree dashboard, you can configure:
- **Email notifications**: Set where form submissions should be sent
- **reCAPTCHA**: Enable spam protection
- **Redirect URL**: Redirect users after successful submission (optional)
- **Custom response**: Customize the confirmation message

## Features Implemented

### Form Validation
- Client-side validation with accessible error messages
- Required field validation
- Email format validation
- Real-time error feedback
- WCAG 2.1 AA compliant error handling

### Backend Integration
- Asynchronous form submission using Fetch API
- No page reload on submission
- Success and error message display
- Network error handling
- Button state management (disabled during submission)

### Accessibility
- ARIA live regions for status messages
- Keyboard navigation support
- Screen reader compatible
- Focus management for better UX

## Alternative Options

If you prefer a different backend service, you can choose:

### Netlify Forms
- Free tier available
- Integrated with Netlify hosting
- Update form tag: `<form name="contact" netlify>`

### SendGrid
- Email delivery service
- Requires API integration and backend code
- Better for high-volume email sending

### AWS Lambda + SES
- Serverless solution
- More control and customization
- Requires AWS account and configuration

## Testing

1. **Local Testing**: Update the form ID and test submissions
2. **Check Formspree Dashboard**: Verify submissions appear in your dashboard
3. **Email Notifications**: Confirm you receive email notifications
4. **Error Handling**: Test with invalid data to verify error messages

## Cost

Formspree Free Tier:
- 50 submissions per month
- Basic spam filtering
- Email notifications

For higher volume, consider upgrading to a paid plan or using an alternative solution.

## Security

- Formspree uses HTTPS for secure data transmission
- Optional reCAPTCHA integration for spam protection
- CSRF protection built-in
- No sensitive data stored in frontend code

## Support

For issues or questions:
- Formspree Documentation: https://help.formspree.io
- Formspree Support: support@formspree.io
