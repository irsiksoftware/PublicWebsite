# Email Templates

This directory contains responsive email templates designed for various use cases. All templates are tested for compatibility across major email clients and support both light and dark modes.

## Templates

### 1. Base Template (`base-template.html`)
A foundational template with placeholder variables that can be customized for any email type.

**Variables:**
- `{{EMAIL_TITLE}}` - Email title for the subject
- `{{EMAIL_PREVIEW_TEXT}}` - Preview text shown in email clients
- `{{EMAIL_CONTENT}}` - Main email content (HTML)
- `{{COMPANY_NAME}}` - Your company name
- `{{COMPANY_ADDRESS}}` - Company physical address
- `{{WEBSITE_URL}}` - Main website URL
- `{{HELP_URL}}` - Help center URL
- `{{CONTACT_URL}}` - Contact page URL
- `{{UNSUBSCRIBE_URL}}` - Unsubscribe link
- `{{PREFERENCES_URL}}` - Email preferences link
- `{{SOCIAL_TWITTER}}` - Twitter profile URL
- `{{SOCIAL_LINKEDIN}}` - LinkedIn profile URL
- `{{SOCIAL_FACEBOOK}}` - Facebook profile URL

### 2. Welcome Email (`welcome.html`)
Sent to new users when they create an account.

**Variables:**
- `{{FIRST_NAME}}` - User's first name
- `{{DASHBOARD_URL}}` - Link to user dashboard
- `{{HELP_URL}}` - Help center URL
- `{{CONTACT_URL}}` - Contact page URL
- `{{UNSUBSCRIBE_URL}}` - Unsubscribe link
- `{{PREFERENCES_URL}}` - Email preferences link

**Features:**
- Welcome message with personalized greeting
- Feature highlights with icons
- Call-to-action button to get started
- Support information

### 3. Newsletter (`newsletter.html`)
Regular newsletter template for company updates and featured content.

**Variables:**
- `{{NEWSLETTER_TITLE}}` - Newsletter title
- `{{NEWSLETTER_PREVIEW_TEXT}}` - Preview text
- `{{FIRST_NAME}}` - User's first name
- `{{ARTICLE_1_TITLE}}` - First article title
- `{{ARTICLE_1_EXCERPT}}` - First article excerpt
- `{{ARTICLE_1_URL}}` - First article URL
- `{{ARTICLE_2_TITLE}}` - Second article title
- `{{ARTICLE_2_EXCERPT}}` - Second article excerpt
- `{{ARTICLE_2_URL}}` - Second article URL
- `{{ARTICLE_3_TITLE}}` - Third article title
- `{{ARTICLE_3_EXCERPT}}` - Third article excerpt
- `{{ARTICLE_3_URL}}` - Third article URL
- `{{WHATS_NEW_CONTENT}}` - What's new section content
- `{{BLOG_URL}}` - Blog URL
- `{{HELP_URL}}` - Help center URL
- `{{CONTACT_URL}}` - Contact page URL
- `{{UNSUBSCRIBE_URL}}` - Unsubscribe link
- `{{PREFERENCES_URL}}` - Email preferences link

**Features:**
- Multiple article cards with excerpts
- Featured stories section
- What's new section
- Call-to-action to visit blog

### 4. Notification (`notification.html`)
Generic notification template for system alerts, updates, or important information.

**Variables:**
- `{{NOTIFICATION_TITLE}}` - Notification title
- `{{NOTIFICATION_PREVIEW_TEXT}}` - Preview text
- `{{NOTIFICATION_TYPE}}` - Badge type (success, warning, error, or default)
- `{{NOTIFICATION_LABEL}}` - Badge label text
- `{{FIRST_NAME}}` - User's first name
- `{{NOTIFICATION_MESSAGE}}` - Main notification message
- `{{DETAIL_LABEL}}` - Detail section label
- `{{DETAIL_CONTENT}}` - Detail section content
- `{{ACTION_URL}}` - Action button URL
- `{{ACTION_BUTTON_TEXT}}` - Action button text
- `{{CONTACT_URL}}` - Contact page URL
- `{{HELP_URL}}` - Help center URL
- `{{UNSUBSCRIBE_URL}}` - Unsubscribe link
- `{{PREFERENCES_URL}}` - Email preferences link

**Badge Types:**
- Default: Blue badge (no class needed)
- `.success`: Green badge for success notifications
- `.warning`: Yellow badge for warnings
- `.error`: Red badge for errors

**Features:**
- Color-coded notification badges
- Detail information box
- Customizable action button
- Support contact information

### 5. Password Reset (`password-reset.html`)
Secure password reset email with time-limited link.

**Variables:**
- `{{FIRST_NAME}}` - User's first name
- `{{EMAIL}}` - User's email address
- `{{RESET_URL}}` - Password reset URL with token
- `{{EXPIRY_HOURS}}` - Number of hours until link expires
- `{{CONTACT_URL}}` - Contact page URL
- `{{HELP_URL}}` - Help center URL
- `{{PREFERENCES_URL}}` - Email preferences link

**Features:**
- Clear call-to-action button
- Expiry notice
- Security warning for unsolicited requests
- Alternative link for copy/paste
- Security best practices

## Features

### Responsive Design
All templates are fully responsive and optimized for:
- Desktop email clients (Outlook, Apple Mail, Thunderbird)
- Webmail (Gmail, Yahoo, Outlook.com)
- Mobile devices (iOS Mail, Gmail app, Samsung Mail)

### Dark Mode Support
Templates automatically adapt to user's system preferences:
- Light mode: Default styling with light backgrounds
- Dark mode: Inverted colors with dark backgrounds and adjusted text colors

### Email Client Compatibility
Tested and compatible with:
- Gmail (Desktop and Mobile)
- Apple Mail (macOS and iOS)
- Outlook (2007, 2010, 2013, 2016, 2019, Office 365)
- Yahoo Mail
- Outlook.com
- Samsung Mail
- Thunderbird

### Accessibility
- Semantic HTML structure
- Proper heading hierarchy
- Alt text support for images
- High contrast text
- Large, tappable buttons (minimum 44x44px touch target)
- Screen reader friendly

## Usage

### 1. Choose a Template
Select the appropriate template for your use case.

### 2. Replace Variables
Replace all `{{VARIABLE}}` placeholders with actual values. This can be done through:
- Server-side templating engines (Handlebars, Mustache, Liquid)
- Backend email services (SendGrid, Mailchimp, AWS SES)
- Custom string replacement functions

### 3. Test Before Sending
Always test emails across different clients using tools like:
- [Litmus](https://litmus.com/)
- [Email on Acid](https://www.emailonacid.com/)
- [Mailtrap](https://mailtrap.io/)
- [PutsMail](https://putsmail.com/)

### 4. Send
Use your preferred email service provider to send the emails.

## Customization

### Colors
Main color variables used in templates:
```css
Primary: #007bff (blue)
Success: #28a745 (green)
Warning: #ffc107 (yellow)
Error: #dc3545 (red)
Dark: #1a1a1a
Light: #f4f4f4
```

### Fonts
Default font stack:
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
```

### Max Width
Email container max width: `600px` (optimal for most email clients)

## Best Practices

1. **Keep it Simple**: Use tables for layout (better email client support)
2. **Inline CSS**: While these templates use `<style>` tags, consider inlining CSS for production
3. **Test Thoroughly**: Always test across multiple email clients
4. **Alt Text**: Add descriptive alt text to images
5. **Plain Text Version**: Provide plain text alternatives for accessibility
6. **Unsubscribe Links**: Always include clear unsubscribe options
7. **Mobile First**: Design for mobile, enhance for desktop
8. **Load Time**: Optimize images and keep HTML size under 102KB
9. **Spam Filters**: Avoid spam trigger words and excessive capitalization
10. **Authentication**: Use SPF, DKIM, and DMARC for email authentication

## Support

For issues or questions about these templates, please contact the development team or open an issue in the project repository.

## License

These templates are part of the company's public website project and follow the same license.
