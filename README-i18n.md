# Multi-Language Support (i18n)

This document describes the internationalization (i18n) implementation for the IrsikSoftware website.

## Features

- **5 Languages Supported**: English, Spanish, French, German, and Japanese
- **Automatic Language Detection**: Detects browser language on first visit
- **Persistent Language Preference**: Saves user's language choice in localStorage
- **Dynamic Content Updates**: Changes all translatable content without page reload
- **Accessible**: Fully keyboard navigable with proper ARIA labels
- **Dark Theme Compatible**: Styled for both light and dark themes
- **Responsive Design**: Works seamlessly on mobile and desktop

## Architecture

### Core Files

1. **`js/i18n.js`** - Core internationalization module
   - `I18n` class handles language management
   - Translation storage and retrieval
   - Automatic browser language detection
   - localStorage persistence
   - Dynamic content updates

2. **`js/language-selector.js`** - Language selector UI component
   - Creates dropdown selector
   - Handles language switching events
   - Updates UI when language changes

3. **`css/language-selector.css`** - Styling for language selector
   - Responsive design
   - Dark theme support
   - Accessibility features

## Usage

### Basic Translation

The i18n system is automatically initialized when the page loads. To add translatable content:

```html
<!-- Simple text translation -->
<span data-i18n="nav.home">Home</span>

<!-- Placeholder translation -->
<input type="text" data-i18n-placeholder="contact.name" placeholder="Name">

<!-- ARIA label translation -->
<button data-i18n-aria="nav.home" aria-label="Home">🏠</button>

<!-- Title attribute translation -->
<a href="#" data-i18n-title="nav.services" title="Services">Services</a>
```

### Programmatic Access

```javascript
// Get translated string
const text = window.i18n.t('nav.home');

// Change language
window.i18n.setLanguage('es');

// Get current language
const currentLang = window.i18n.getCurrentLanguage();

// Get available languages
const languages = window.i18n.getAvailableLanguages();
```

### Listen to Language Changes

```javascript
window.addEventListener('languageChanged', (e) => {
  console.log('Language changed to:', e.detail.language);
  // Update your component
});
```

## Adding New Languages

To add a new language, edit `js/i18n.js`:

1. Add translation object to the `translations` constant:

```javascript
const translations = {
  en: { /* existing English translations */ },
  es: { /* existing Spanish translations */ },
  // Add new language
  pt: {
    nav: {
      home: 'Início',
      services: 'Serviços',
      // ... more translations
    }
  }
};
```

2. Add language option in `js/language-selector.js`:

```javascript
const languages = [
  // existing languages
  { code: 'pt', name: 'languageSelector.portuguese', native: 'Português' }
];
```

3. Add translation key in all language objects:

```javascript
languageSelector: {
  label: 'Language',
  english: 'English',
  spanish: 'Español',
  portuguese: 'Português' // Add to all language objects
}
```

## Translation Structure

The translation object follows a nested structure:

```javascript
{
  nav: {
    home: 'Home',
    services: 'Services'
  },
  hero: {
    title: 'Page Title',
    subtitle: 'Subtitle text'
  },
  sections: {
    overview: 'Overview'
  }
  // ... more sections
}
```

Access translations using dot notation: `nav.home`, `hero.title`, etc.

## Browser Support

- Modern browsers with ES6 support
- localStorage for preference persistence (gracefully degrades if unavailable)
- CustomEvent API for component communication

## Accessibility

- Proper ARIA labels and roles
- Keyboard navigable language selector
- Screen reader friendly
- High contrast mode support
- Respects `prefers-reduced-motion`

## Performance

- Lightweight implementation (~15KB for all translations)
- No external dependencies
- Lazy initialization
- Efficient DOM updates

## Testing

To test the i18n implementation:

1. Open the website in a browser
2. Look for the language selector at the top of the page
3. Select different languages from the dropdown
4. Verify that:
   - Content updates without page reload
   - Selection persists after page refresh
   - All translatable elements update correctly
   - Dark theme works with language selector

## Future Enhancements

Potential improvements for the i18n system:

1. **Dynamic Translation Loading**: Load translations on-demand to reduce initial bundle size
2. **Pluralization Support**: Handle singular/plural forms
3. **Date/Number Formatting**: Locale-specific formatting
4. **RTL Language Support**: Right-to-left text for Arabic, Hebrew, etc.
5. **Translation Management**: CMS integration for non-technical translation updates
6. **Interpolation**: Variable substitution in translations
7. **Fallback Languages**: Graceful degradation for missing translations

## Maintenance

When adding new content to the website:

1. Add English text with a descriptive key
2. Add corresponding translations in all supported languages
3. Use `data-i18n` attributes for dynamic content
4. Test in all supported languages

## License

Part of the IrsikSoftware website project.
