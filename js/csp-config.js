/**
 * Content Security Policy Configuration
 *
 * This file defines the CSP policy for the website.
 * Currently using report-only mode to monitor violations before enforcement.
 *
 * To enable enforcement mode:
 * 1. Review CSP violation reports
 * 2. Update policy directives as needed
 * 3. Change Content-Security-Policy-Report-Only to Content-Security-Policy
 */

const cspConfig = {
    // Modes: 'report-only' or 'enforce'
    mode: 'report-only',

    // CSP Directives
    directives: {
        'default-src': ['\'self\''],
        'script-src': [
            '\'self\'',
            '\'unsafe-inline\'', // Required for inline scripts - consider using nonces/hashes
            'https://cdn.jsdelivr.net',
            'https://www.googletagmanager.com',
            'https://www.google-analytics.com'
        ],
        'style-src': [
            '\'self\'',
            '\'unsafe-inline\'' // Required for inline styles - consider using nonces/hashes
        ],
        'img-src': [
            '\'self\'',
            'data:',
            'https:' // Allow images from any HTTPS source
        ],
        'font-src': [
            '\'self\'',
            'data:'
        ],
        'connect-src': [
            '\'self\'',
            'https://www.google-analytics.com'
        ],
        'frame-src': [
            '\'self\'',
            'https://unity.irsik.software' // Unity WebGL games
        ],
        'worker-src': ['\'self\''], // Service workers
        'manifest-src': ['\'self\''], // Web app manifest
        'base-uri': ['\'self\''],
        'form-action': ['\'self\''],
        'frame-ancestors': ['\'none\''], // Prevent clickjacking
        'report-uri': ['/csp-violation-report-endpoint']
    }
};

/**
 * Converts the CSP configuration to a policy string
 * @returns {string} CSP policy string
 */
function generateCSPString() {
    const directives = Object.entries(cspConfig.directives)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');
    return directives;
}

/**
 * Returns the appropriate CSP header name based on mode
 * @returns {string} Header name
 */
function getCSPHeaderName() {
    return cspConfig.mode === 'report-only'
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy';
}

// Export for use in server configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        cspConfig,
        generateCSPString,
        getCSPHeaderName
    };
}
