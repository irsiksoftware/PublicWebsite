/**
 * Custom Analytics Event Tracking
 * Provides wrapper functions for tracking user interactions
 */

(function() {
    'use strict';

    /**
     * Checks if analytics is enabled and consent has been given
     * @returns {boolean} True if analytics is available and consent is accepted
     */
    function isAnalyticsEnabled() {
        return typeof gtag === 'function' &&
           localStorage.getItem('cookieConsent') === 'accepted';
    }

    /**
     * Tracks page views
     * @param {string} pageTitle - The title of the page being viewed
     * @param {string} [pagePath] - Optional path override, defaults to current pathname
     * @example
     * trackPageView('About Us', '/about');
     */
    window.trackPageView = function(pageTitle, pagePath) {
        if (!isAnalyticsEnabled()) return;

        gtag('event', 'page_view', {
            page_title: pageTitle,
            page_location: window.location.href,
            page_path: pagePath || window.location.pathname
        });
    };

    /**
     * Tracks button clicks
     * @param {string} buttonName - The name or label of the button
     * @param {string} buttonLocation - The location of the button on the page
     * @example
     * trackButtonClick('Sign Up', 'Hero Section');
     */
    window.trackButtonClick = function(buttonName, buttonLocation) {
        if (!isAnalyticsEnabled()) return;

        gtag('event', 'button_click', {
            button_name: buttonName,
            button_location: buttonLocation
        });
    };

    /**
     * Tracks link clicks (external links)
     * @param {string} linkUrl - The URL of the link
     * @param {string} linkText - The text content of the link
     * @example
     * trackLinkClick('https://example.com', 'Visit Example');
     */
    window.trackLinkClick = function(linkUrl, linkText) {
        if (!isAnalyticsEnabled()) return;

        gtag('event', 'link_click', {
            link_url: linkUrl,
            link_text: linkText,
            link_domain: new URL(linkUrl).hostname
        });
    };

    /**
     * Tracks form submissions
     * @param {string} formName - The name of the form
     * @param {string} formId - The ID of the form
     * @example
     * trackFormSubmission('Contact Form', 'contact-form');
     */
    window.trackFormSubmission = function(formName, formId) {
        if (!isAnalyticsEnabled()) return;

        gtag('event', 'form_submit', {
            form_name: formName,
            form_id: formId
        });
    };

    /**
     * Tracks file downloads
     * @param {string} fileName - The name of the file being downloaded
     * @param {string} fileType - The file extension/type
     * @example
     * trackDownload('brochure.pdf', 'pdf');
     */
    window.trackDownload = function(fileName, fileType) {
        if (!isAnalyticsEnabled()) return;

        gtag('event', 'file_download', {
            file_name: fileName,
            file_extension: fileType
        });
    };

    /**
     * Tracks video interactions
     * @param {string} action - The action performed (play, pause, complete)
     * @param {string} videoTitle - The title of the video
     * @example
     * trackVideo('play', 'Product Demo Video');
     */
    window.trackVideo = function(action, videoTitle) {
        if (!isAnalyticsEnabled()) return;

        gtag('event', 'video_' + action, {
            video_title: videoTitle
        });
    };

    /**
     * Tracks scroll depth
     * @param {number} percentage - The scroll depth percentage (0-100)
     * @example
     * trackScrollDepth(75);
     */
    window.trackScrollDepth = function(percentage) {
        if (!isAnalyticsEnabled()) return;

        gtag('event', 'scroll', {
            scroll_depth: percentage
        });
    };

    /**
     * Tracks search queries
     * @param {string} searchTerm - The search term entered
     * @param {number} searchResults - Number of search results returned
     * @example
     * trackSearch('javascript tutorials', 42);
     */
    window.trackSearch = function(searchTerm, searchResults) {
        if (!isAnalyticsEnabled()) return;

        gtag('event', 'search', {
            search_term: searchTerm,
            search_results: searchResults
        });
    };

    /**
     * Tracks custom conversion events
     * @param {string} conversionType - The type of conversion
     * @param {number} [value=0] - The monetary value of the conversion
     * @param {string} [currency='USD'] - The currency code
     * @example
     * trackConversion('newsletter_signup', 5, 'USD');
     */
    window.trackConversion = function(conversionType, value, currency) {
        if (!isAnalyticsEnabled()) return;

        gtag('event', 'conversion', {
            conversion_type: conversionType,
            value: value || 0,
            currency: currency || 'USD'
        });
    };

    // Auto-track external links
    document.addEventListener('DOMContentLoaded', function() {
    // Track all external links
        document.querySelectorAll('a[href^="http"]').forEach(function(link) {
            if (link.hostname !== window.location.hostname) {
                link.addEventListener('click', function() {
                    trackLinkClick(link.href, link.textContent.trim());
                });
            }
        });

        // Track file downloads
        document.querySelectorAll('a[download], a[href$=".pdf"], a[href$=".zip"], a[href$=".doc"], a[href$=".docx"]').forEach(function(link) {
            link.addEventListener('click', function() {
                var fileName = link.getAttribute('download') || link.href.split('/').pop();
                var fileExt = fileName.split('.').pop();
                trackDownload(fileName, fileExt);
            });
        });

        // Track scroll depth at 25%, 50%, 75%, 100%
        var scrollDepths = [25, 50, 75, 100];
        var scrollTracked = [];

        window.addEventListener('scroll', function() {
            var scrollPercentage = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);

            scrollDepths.forEach(function(depth) {
                if (scrollPercentage >= depth && scrollTracked.indexOf(depth) === -1) {
                    scrollTracked.push(depth);
                    trackScrollDepth(depth);
                }
            });
        });
    });
})();
