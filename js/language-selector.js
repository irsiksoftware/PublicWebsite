/**
 * Language selector component
 */

class LanguageSelector {
    constructor() {
        this.selector = null;
        this.init();
    }

    init() {
    // Wait for i18n to be available
        if (typeof window.i18n === 'undefined') {
            setTimeout(() => this.init(), 100);
            return;
        }

        this.createSelector();
        this.attachEventListeners();

        // Update selector when language changes from other sources
        window.addEventListener('languageChanged', (e) => {
            this.updateSelector(e.detail.language);
        });
    }

    createSelector() {
    // Create language selector element
        this.selector = document.createElement('div');
        this.selector.className = 'language-selector';
        this.selector.setAttribute('role', 'navigation');
        this.selector.setAttribute('aria-label', 'Language selection');

        const label = document.createElement('label');
        label.htmlFor = 'language-select';
        label.textContent = window.i18n.t('languageSelector.label');
        label.className = 'language-label';

        const select = document.createElement('select');
        select.id = 'language-select';
        select.className = 'language-select';
        select.setAttribute('aria-label', 'Select language');

        const languages = [
            { code: 'en', name: 'languageSelector.english', native: 'English' },
            { code: 'es', name: 'languageSelector.spanish', native: 'Español' },
            { code: 'fr', name: 'languageSelector.french', native: 'Français' },
            { code: 'de', name: 'languageSelector.german', native: 'Deutsch' },
            { code: 'ja', name: 'languageSelector.japanese', native: '日本語' }
        ];

        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = lang.native;
            if (lang.code === window.i18n.getCurrentLanguage()) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        this.selector.appendChild(label);
        this.selector.appendChild(select);

        // Insert into header/navigation area
        const nav = document.querySelector('nav');
        if (nav) {
            nav.parentElement.insertBefore(this.selector, nav.nextSibling);
        } else {
            // Fallback: insert at top of body
            document.body.insertBefore(this.selector, document.body.firstChild);
        }
    }

    attachEventListeners() {
        const select = this.selector.querySelector('select');
        if (select) {
            select.addEventListener('change', (e) => {
                const newLang = e.target.value;
                window.i18n.setLanguage(newLang);
            });
        }
    }

    updateSelector(lang) {
        const select = this.selector.querySelector('select');
        if (select && select.value !== lang) {
            select.value = lang;
        }
    }
}

// Initialize language selector when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new LanguageSelector();
    });
} else {
    new LanguageSelector();
}
