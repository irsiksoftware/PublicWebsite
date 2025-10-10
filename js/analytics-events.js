/**
 * Custom Analytics Event Tracking
 * Provides wrapper functions for tracking user interactions
 */

(function() {
    'use strict';

    // Check if analytics is loaded and consent given
    function isAnalyticsEnabled() {
        return typeof gtag === 'function' &&
           localStorage.getItem('cookieConsent') === 'accepted';
    }

    // Track page views (automatically tracked by GA4, but can be used for SPAs)
    window.trackPageView = function(pageTitle, pagePath) {
        if (!isAnalyticsEnabled()) return;

        gtag('event', 'page_view', {
            page_title: pageTitle,
            page_location: window.location.href,
            page_path: pagePath || window.location.pathname
        });
    };

    // Track button clicks
    window.trackButtonClick = function(buttonName, buttonLocation) {
        if (!isAnalyticsEnabled()) return;

        gtag('event', 'button_click', {
            button_name: buttonName,
            button_location: buttonLocation
        });
    };

    // Track link clicks (external links)
    window.trackLinkClick = function(linkUrl, linkText) {
        if (!isAnalyticsEnabled()) return;

        gtag('event', 'link_click', {
            link_url: linkUrl,
            link_text: linkText,
            link_domain: new URL(linkUrl).hostname
        });
    };

    // Track form submissions
    window.trackFormSubmission = function(formName, formId) {
        if (!isAnalyticsEnabled()) return;

        gtag('event', 'form_submit', {
            form_name: formName,
            form_id: formId
        });
    };

    // Track downloads
    window.trackDownload = function(fileName, fileType) {
        if (!isAnalyticsEnabled()) return;

        gtag('event', 'file_download', {
            file_name: fileName,
            file_extension: fileType
        });
    };

    // Track video interactions
    window.trackVideo = function(action, videoTitle) {
        if (!isAnalyticsEnabled()) return;

        gtag('event', 'video_' + action, {
            video_title: videoTitle
        });
    };

    // Track scroll depth
    window.trackScrollDepth = function(percentage) {
        if (!isAnalyticsEnabled()) return;

        gtag('event', 'scroll', {
            scroll_depth: percentage
        });
    };

    // Track search
    window.trackSearch = function(searchTerm, searchResults) {
        if (!isAnalyticsEnabled()) return;

        gtag('event', 'search', {
            search_term: searchTerm,
            search_results: searchResults
        });
    };

    // Track custom conversion events
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
