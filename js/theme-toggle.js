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
        if (theme === DARK_THEME) {
            document.documentElement.setAttribute('data-theme', DARK_THEME);
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem(THEME_KEY, theme);
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

            if (theme === DARK_THEME) {
                // Show sun icon for light mode switch
                if (sunIcon) sunIcon.style.display = 'block';
                if (moonIcon) moonIcon.style.display = 'none';
                button.setAttribute('aria-label', 'Switch to light theme');
            } else {
                // Show moon icon for dark mode switch
                if (sunIcon) sunIcon.style.display = 'none';
                if (moonIcon) moonIcon.style.display = 'block';
                button.setAttribute('aria-label', 'Switch to dark theme');
            }
        }
    }

    /**
     * Toggle between light and dark themes
     */
    function toggleTheme() {
        const currentTheme = getCurrentTheme();
        const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
        applyTheme(newTheme);
    }

    /**
     * Initialize the theme toggle functionality
     */
    function init() {
        // Apply initial theme
        const initialTheme = getCurrentTheme();
        applyTheme(initialTheme);

        // Add event listener to toggle button
        const button = document.getElementById('theme-toggle');
        if (button) {
            button.addEventListener('click', toggleTheme);
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Only apply system preference if user hasn't manually set a theme
                if (!localStorage.getItem(THEME_KEY)) {
                    applyTheme(e.matches ? DARK_THEME : LIGHT_THEME);
                }
            });
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
