/**
 * Cookie Consent Management
 * Implements GDPR-compliant cookie consent banner and preferences
 */

export class CookieConsentManager {
    constructor() {
        this.consentKey = 'gdpr_cookie_consent';
        this.preferencesKey = 'gdpr_cookie_preferences';
        this.consentVersion = '1.0';
        this.cookieCategories = {
            necessary: { name: 'Necessary', required: true, enabled: true },
            analytics: { name: 'Analytics', required: false, enabled: false },
            marketing: { name: 'Marketing', required: false, enabled: false },
            functional: { name: 'Functional', required: false, enabled: false }
        };
        this.init();
    }

    init() {
        if (!this.hasConsent()) {
            this.showConsentBanner();
        } else {
            this.applyConsentPreferences();
        }
        this.setupEventListeners();
    }

    hasConsent() {
        const consent = localStorage.getItem(this.consentKey);
        if (!consent) return false;

        try {
            const data = JSON.parse(consent);
            return data.version === this.consentVersion && data.timestamp;
        } catch (e) {
            return false;
        }
    }

    getConsent() {
        try {
            const consent = localStorage.getItem(this.consentKey);
            return consent ? JSON.parse(consent) : null;
        } catch (e) {
            return null;
        }
    }

    getPreferences() {
        try {
            const prefs = localStorage.getItem(this.preferencesKey);
            return prefs ? JSON.parse(prefs) : this.cookieCategories;
        } catch (e) {
            return this.cookieCategories;
        }
    }

    saveConsent(preferences) {
        const consentData = {
            version: this.consentVersion,
            timestamp: new Date().toISOString(),
            preferences: preferences
        };

        localStorage.setItem(this.consentKey, JSON.stringify(consentData));
        localStorage.setItem(this.preferencesKey, JSON.stringify(preferences));

        this.applyConsentPreferences();
        this.hideConsentBanner();

        // Dispatch event for other scripts to listen to
        window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
            detail: preferences
        }));
    }

    applyConsentPreferences() {
        const preferences = this.getPreferences();

        // Analytics cookies
        if (preferences.analytics?.enabled) {
            this.enableAnalytics();
        } else {
            this.disableAnalytics();
        }

        // Marketing cookies
        if (preferences.marketing?.enabled) {
            this.enableMarketing();
        } else {
            this.disableMarketing();
        }

        // Functional cookies
        if (preferences.functional?.enabled) {
            this.enableFunctional();
        } else {
            this.disableFunctional();
        }
    }

    enableAnalytics() {
    // Enable analytics scripts
        if (window.gtag) {
            window.gtag('consent', 'update', {
                analytics_storage: 'granted'
            });
        }
    }

    disableAnalytics() {
    // Disable analytics scripts
        if (window.gtag) {
            window.gtag('consent', 'update', {
                analytics_storage: 'denied'
            });
        }
        this.deleteCookiesByCategory('analytics');
    }

    enableMarketing() {
    // Enable marketing scripts
        if (window.gtag) {
            window.gtag('consent', 'update', {
                ad_storage: 'granted',
                ad_user_data: 'granted',
                ad_personalization: 'granted'
            });
        }
    }

    disableMarketing() {
    // Disable marketing scripts
        if (window.gtag) {
            window.gtag('consent', 'update', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
            });
        }
        this.deleteCookiesByCategory('marketing');
    }

    enableFunctional() {
    // Enable functional cookies
        if (window.gtag) {
            window.gtag('consent', 'update', {
                functionality_storage: 'granted'
            });
        }
    }

    disableFunctional() {
    // Disable functional cookies
        if (window.gtag) {
            window.gtag('consent', 'update', {
                functionality_storage: 'denied'
            });
        }
        this.deleteCookiesByCategory('functional');
    }

    deleteCookiesByCategory(category) {
        const categoryPrefixes = {
            analytics: ['_ga', '_gid', '_gat'],
            marketing: ['_fbp', '_gcl', 'IDE', 'test_cookie'],
            functional: ['pref', 'NID']
        };

        const prefixes = categoryPrefixes[category] || [];
        const cookies = document.cookie.split(';');

        cookies.forEach(cookie => {
            const cookieName = cookie.split('=')[0].trim();
            const shouldDelete = prefixes.some(prefix => cookieName.startsWith(prefix));

            if (shouldDelete) {
                this.deleteCookie(cookieName);
            }
        });
    }

    deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
    }

    showConsentBanner() {
        const existingBanner = document.getElementById('cookie-consent-banner');
        if (existingBanner) return;

        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.className = 'cookie-consent-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Cookie Consent');
        banner.innerHTML = `
      <div class="cookie-consent-content">
        <div class="cookie-consent-text">
          <h3>We value your privacy</h3>
          <p>We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
          By clicking "Accept All", you consent to our use of cookies. You can customize your preferences by clicking "Manage Preferences".</p>
        </div>
        <div class="cookie-consent-actions">
          <button id="cookie-accept-all" class="btn btn-primary">Accept All</button>
          <button id="cookie-reject-all" class="btn btn-secondary">Reject Non-Essential</button>
          <button id="cookie-manage" class="btn btn-link">Manage Preferences</button>
        </div>
      </div>
    `;

        document.body.appendChild(banner);

        // Add styles
        this.injectStyles();
    }

    hideConsentBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.remove();
        }
    }

    showPreferencesModal() {
        const preferences = this.getPreferences();

        const modal = document.createElement('div');
        modal.id = 'cookie-preferences-modal';
        modal.className = 'cookie-preferences-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-label', 'Cookie Preferences');
        modal.innerHTML = `
      <div class="cookie-preferences-content">
        <div class="cookie-preferences-header">
          <h2>Cookie Preferences</h2>
          <button id="cookie-modal-close" class="btn-close" aria-label="Close">&times;</button>
        </div>
        <div class="cookie-preferences-body">
          <p>We use cookies to improve your experience. You can choose which cookies to allow below.</p>

          <div class="cookie-category">
            <div class="cookie-category-header">
              <label>
                <input type="checkbox" id="pref-necessary" checked disabled>
                <strong>Necessary Cookies</strong>
              </label>
            </div>
            <p class="cookie-category-description">These cookies are essential for the website to function properly and cannot be disabled.</p>
          </div>

          <div class="cookie-category">
            <div class="cookie-category-header">
              <label>
                <input type="checkbox" id="pref-analytics" ${preferences.analytics?.enabled ? 'checked' : ''}>
                <strong>Analytics Cookies</strong>
              </label>
            </div>
            <p class="cookie-category-description">These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.</p>
          </div>

          <div class="cookie-category">
            <div class="cookie-category-header">
              <label>
                <input type="checkbox" id="pref-marketing" ${preferences.marketing?.enabled ? 'checked' : ''}>
                <strong>Marketing Cookies</strong>
              </label>
            </div>
            <p class="cookie-category-description">These cookies are used to track visitors across websites to display relevant advertisements.</p>
          </div>

          <div class="cookie-category">
            <div class="cookie-category-header">
              <label>
                <input type="checkbox" id="pref-functional" ${preferences.functional?.enabled ? 'checked' : ''}>
                <strong>Functional Cookies</strong>
              </label>
            </div>
            <p class="cookie-category-description">These cookies enable enhanced functionality and personalization, such as language preferences.</p>
          </div>
        </div>
        <div class="cookie-preferences-footer">
          <button id="cookie-save-preferences" class="btn btn-primary">Save Preferences</button>
          <button id="cookie-accept-all-modal" class="btn btn-secondary">Accept All</button>
        </div>
      </div>
    `;

        document.body.appendChild(modal);
    }

    hidePreferencesModal() {
        const modal = document.getElementById('cookie-preferences-modal');
        if (modal) {
            modal.remove();
        }
    }

    setupEventListeners() {
    // Accept all button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'cookie-accept-all' || e.target.id === 'cookie-accept-all-modal') {
                const preferences = {
                    necessary: { ...this.cookieCategories.necessary, enabled: true },
                    analytics: { ...this.cookieCategories.analytics, enabled: true },
                    marketing: { ...this.cookieCategories.marketing, enabled: true },
                    functional: { ...this.cookieCategories.functional, enabled: true }
                };
                this.saveConsent(preferences);
                this.hidePreferencesModal();
            }
        });

        // Reject all button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'cookie-reject-all') {
                const preferences = {
                    necessary: { ...this.cookieCategories.necessary, enabled: true },
                    analytics: { ...this.cookieCategories.analytics, enabled: false },
                    marketing: { ...this.cookieCategories.marketing, enabled: false },
                    functional: { ...this.cookieCategories.functional, enabled: false }
                };
                this.saveConsent(preferences);
            }
        });

        // Manage preferences button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'cookie-manage') {
                this.hideConsentBanner();
                this.showPreferencesModal();
            }
        });

        // Close modal button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'cookie-modal-close') {
                this.hidePreferencesModal();
                if (!this.hasConsent()) {
                    this.showConsentBanner();
                }
            }
        });

        // Save preferences button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'cookie-save-preferences') {
                const preferences = {
                    necessary: { ...this.cookieCategories.necessary, enabled: true },
                    analytics: {
                        ...this.cookieCategories.analytics,
                        enabled: document.getElementById('pref-analytics')?.checked || false
                    },
                    marketing: {
                        ...this.cookieCategories.marketing,
                        enabled: document.getElementById('pref-marketing')?.checked || false
                    },
                    functional: {
                        ...this.cookieCategories.functional,
                        enabled: document.getElementById('pref-functional')?.checked || false
                    }
                };
                this.saveConsent(preferences);
                this.hidePreferencesModal();
            }
        });
    }

    injectStyles() {
        if (document.getElementById('cookie-consent-styles')) return;

        const style = document.createElement('style');
        style.id = 'cookie-consent-styles';
        style.textContent = `
      .cookie-consent-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #1a1a1a;
        color: #fff;
        padding: 1.5rem;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }

      .cookie-consent-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1.5rem;
      }

      .cookie-consent-text {
        flex: 1;
        min-width: 300px;
      }

      .cookie-consent-text h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
      }

      .cookie-consent-text p {
        margin: 0;
        font-size: 0.9rem;
        line-height: 1.5;
        opacity: 0.9;
      }

      .cookie-consent-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .cookie-consent-actions .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        transition: all 0.2s;
      }

      .cookie-consent-actions .btn-primary {
        background: #007bff;
        color: white;
      }

      .cookie-consent-actions .btn-primary:hover {
        background: #0056b3;
      }

      .cookie-consent-actions .btn-secondary {
        background: #6c757d;
        color: white;
      }

      .cookie-consent-actions .btn-secondary:hover {
        background: #545b62;
      }

      .cookie-consent-actions .btn-link {
        background: transparent;
        color: #fff;
        text-decoration: underline;
      }

      .cookie-consent-actions .btn-link:hover {
        opacity: 0.8;
      }

      .cookie-preferences-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        animation: fadeIn 0.2s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .cookie-preferences-content {
        background: white;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .cookie-preferences-header {
        padding: 1.5rem;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .cookie-preferences-header h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #333;
      }

      .btn-close {
        background: none;
        border: none;
        font-size: 2rem;
        cursor: pointer;
        color: #666;
        line-height: 1;
        padding: 0;
        width: 2rem;
        height: 2rem;
      }

      .btn-close:hover {
        color: #333;
      }

      .cookie-preferences-body {
        padding: 1.5rem;
        color: #333;
      }

      .cookie-preferences-body > p {
        margin-top: 0;
        color: #666;
      }

      .cookie-category {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 4px;
      }

      .cookie-category-header label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
      }

      .cookie-category-header input[type="checkbox"] {
        width: 1.25rem;
        height: 1.25rem;
        cursor: pointer;
      }

      .cookie-category-header input[type="checkbox"]:disabled {
        cursor: not-allowed;
      }

      .cookie-category-description {
        margin: 0.5rem 0 0 2rem;
        font-size: 0.85rem;
        color: #666;
        line-height: 1.5;
      }

      .cookie-preferences-footer {
        padding: 1.5rem;
        border-top: 1px solid #ddd;
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }

      .cookie-preferences-footer .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        transition: all 0.2s;
      }

      .cookie-preferences-footer .btn-primary {
        background: #007bff;
        color: white;
      }

      .cookie-preferences-footer .btn-primary:hover {
        background: #0056b3;
      }

      .cookie-preferences-footer .btn-secondary {
        background: #6c757d;
        color: white;
      }

      .cookie-preferences-footer .btn-secondary:hover {
        background: #545b62;
      }

      @media (max-width: 768px) {
        .cookie-consent-content {
          flex-direction: column;
          align-items: stretch;
        }

        .cookie-consent-actions {
          justify-content: stretch;
        }

        .cookie-consent-actions .btn {
          flex: 1;
        }
      }
    `;

        document.head.appendChild(style);
    }

    // Public API for managing preferences from settings page
    openPreferences() {
        this.showPreferencesModal();
    }

    revokeConsent() {
        localStorage.removeItem(this.consentKey);
        localStorage.removeItem(this.preferencesKey);
        this.disableAnalytics();
        this.disableMarketing();
        this.disableFunctional();
        this.showConsentBanner();
    }
}

// Initialize on page load
if (typeof window !== 'undefined') {
    window.cookieConsentManager = new CookieConsentManager();
}
