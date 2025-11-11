/**
 * Theme Toggle Module
 * Handles switching between light and dark themes
 */

(function() {
    'use strict';

    const THEME_KEY = 'theme';
    const DARK_THEME = 'dark';
    const LIGHT_THEME = 'light';

    /**
     * Get the current theme from localStorage or system preference
     * @returns {string} The current theme ('light' or 'dark')
     */
    function getCurrentTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme) {
            return savedTheme;
        }

        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return DARK_THEME;
        }

        return LIGHT_THEME;
    }

    /**
     * Apply the theme to the document
     * @param {string} theme - The theme to apply
     */
    function applyTheme(theme) {
        console.log('[Theme Toggle] Applying theme:', theme);
        if (theme === DARK_THEME) {
            document.documentElement.setAttribute('data-theme', DARK_THEME);
            console.log('[Theme Toggle] Dark theme attribute set on document element');
        } else {
            document.documentElement.removeAttribute('data-theme');
            console.log('[Theme Toggle] Dark theme attribute removed from document element');
        }
        localStorage.setItem(THEME_KEY, theme);
        console.log('[Theme Toggle] Theme saved to localStorage:', theme);
        updateToggleButton(theme);
    }

    /**
     * Update the theme toggle button icon
     * @param {string} theme - The current theme
     */
    function updateToggleButton(theme) {
        const button = document.getElementById('theme-toggle');
        if (button) {
            const sunIcon = button.querySelector('.sun-icon');
            const moonIcon = button.querySelector('.moon-icon');

            console.log('[Theme Toggle] Updating button for theme:', theme);
            console.log('[Theme Toggle] Sun icon found:', !!sunIcon);
            console.log('[Theme Toggle] Moon icon found:', !!moonIcon);

            if (theme === DARK_THEME) {
                // Show sun icon for light mode switch
                if (sunIcon) sunIcon.style.display = 'block';
                if (moonIcon) moonIcon.style.display = 'none';
                button.setAttribute('aria-label', 'Switch to light theme');
                console.log('[Theme Toggle] Button updated to show sun icon (switch to light)');
            } else {
                // Show moon icon for dark mode switch
                if (sunIcon) sunIcon.style.display = 'none';
                if (moonIcon) moonIcon.style.display = 'block';
                button.setAttribute('aria-label', 'Switch to dark theme');
                console.log('[Theme Toggle] Button updated to show moon icon (switch to dark)');
            }
        } else {
            console.warn('[Theme Toggle] Could not update button - button not found');
        }
    }

    /**
     * Toggle between light and dark themes
     */
    function toggleTheme() {
        console.log('[Theme Toggle] Toggle button clicked');
        const currentTheme = getCurrentTheme();
        const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
        console.log('[Theme Toggle] Switching from', currentTheme, 'to', newTheme);
        applyTheme(newTheme);
    }

    /**
     * Initialize the theme toggle functionality
     */
    function init() {
        console.log('[Theme Toggle] Initializing theme toggle module');

        // Apply initial theme
        const initialTheme = getCurrentTheme();
        console.log('[Theme Toggle] Initial theme detected:', initialTheme);
        applyTheme(initialTheme);

        // Add event listener to toggle button
        const button = document.getElementById('theme-toggle');
        if (button) {
            console.log('[Theme Toggle] Theme toggle button found, attaching click listener');
            button.addEventListener('click', toggleTheme);
        } else {
            console.warn('[Theme Toggle] Theme toggle button not found in DOM');
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                console.log('[Theme Toggle] System theme preference changed:', e.matches ? 'dark' : 'light');
                // Only apply system preference if user hasn't manually set a theme
                if (!localStorage.getItem(THEME_KEY)) {
                    applyTheme(e.matches ? DARK_THEME : LIGHT_THEME);
                }
            });
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        console.log('[Theme Toggle] Waiting for DOMContentLoaded event');
        document.addEventListener('DOMContentLoaded', init);
    } else {
        console.log('[Theme Toggle] DOM already loaded, initializing immediately');
        init();
    }
})();
