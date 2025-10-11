/**
 * A/B Testing Framework
 * Provides functionality for running A/B tests on the website
 */

(function() {
    'use strict';

    /**
     * A/B Testing Manager
     */
    class ABTestingFramework {
        constructor() {
            this.storageKey = 'ab_tests';
            this.tests = {};
            this.analyticsEnabled = this.isAnalyticsEnabled();
        }

        /**
         * Check if analytics is available and enabled
         */
        isAnalyticsEnabled() {
            return typeof gtag === 'function' &&
                   localStorage.getItem('cookieConsent') === 'accepted';
        }

        /**
         * Create and configure a new A/B test
         * @param {string} testId - Unique identifier for the test
         * @param {Object} config - Test configuration
         * @param {Array} config.variants - Array of variant objects with name and weight
         * @param {Function} config.onAssignment - Callback when variant is assigned
         * @param {string} config.description - Test description
         */
        createTest(testId, config) {
            if (!testId || !config || !config.variants) {
                console.error('Invalid test configuration');
                return null;
            }

            // Validate variants
            if (!Array.isArray(config.variants) || config.variants.length < 2) {
                console.error('Test must have at least 2 variants');
                return null;
            }

            // Normalize weights if not provided
            const variants = this.normalizeVariantWeights(config.variants);

            this.tests[testId] = {
                id: testId,
                description: config.description || '',
                variants: variants,
                onAssignment: config.onAssignment || null,
                createdAt: Date.now()
            };

            return this.tests[testId];
        }

        /**
         * Normalize variant weights to sum to 100
         * @param {Array} variants - Array of variant objects
         */
        normalizeVariantWeights(variants) {
            const hasWeights = variants.some(v => v.weight !== undefined);

            if (!hasWeights) {
                // Equal distribution
                const weight = 100 / variants.length;
                return variants.map(v => ({
                    ...v,
                    weight: weight
                }));
            }

            // Normalize existing weights to sum to 100
            const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 0), 0);
            return variants.map(v => ({
                ...v,
                weight: ((v.weight || 0) / totalWeight) * 100
            }));
        }

        /**
         * Get or assign a variant for a user
         * @param {string} testId - Test identifier
         * @returns {Object|null} - Assigned variant
         */
        getVariant(testId) {
            if (!this.tests[testId]) {
                console.error(`Test ${testId} not found`);
                return null;
            }

            // Check if user already has an assignment
            const assignments = this.getStoredAssignments();
            if (assignments[testId]) {
                const variant = this.tests[testId].variants.find(
                    v => v.name === assignments[testId].variant
                );
                return variant || null;
            }

            // Assign new variant
            const variant = this.assignVariant(testId);

            // Store assignment
            assignments[testId] = {
                variant: variant.name,
                assignedAt: Date.now()
            };
            this.saveAssignments(assignments);

            // Execute callback if provided
            if (this.tests[testId].onAssignment) {
                this.tests[testId].onAssignment(variant);
            }

            // Track assignment in analytics
            this.trackAssignment(testId, variant.name);

            return variant;
        }

        /**
         * Assign a variant based on weighted distribution
         * @param {string} testId - Test identifier
         */
        assignVariant(testId) {
            const test = this.tests[testId];
            const random = Math.random() * 100;
            let cumulative = 0;

            for (const variant of test.variants) {
                cumulative += variant.weight;
                if (random <= cumulative) {
                    return variant;
                }
            }

            // Fallback to first variant
            return test.variants[0];
        }

        /**
         * Get stored variant assignments from localStorage
         */
        getStoredAssignments() {
            try {
                const stored = localStorage.getItem(this.storageKey);
                return stored ? JSON.parse(stored) : {};
            } catch (e) {
                console.error('Error reading stored assignments:', e);
                return {};
            }
        }

        /**
         * Save variant assignments to localStorage
         */
        saveAssignments(assignments) {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(assignments));
            } catch (e) {
                console.error('Error saving assignments:', e);
            }
        }

        /**
         * Track variant assignment in analytics
         */
        trackAssignment(testId, variantName) {
            if (!this.analyticsEnabled) return;

            if (typeof gtag === 'function') {
                gtag('event', 'ab_test_assignment', {
                    test_id: testId,
                    variant: variantName,
                    test_description: this.tests[testId]?.description || ''
                });
            }
        }

        /**
         * Track a conversion event for a test
         * @param {string} testId - Test identifier
         * @param {string} goalName - Name of the conversion goal
         * @param {number} value - Optional value for the conversion
         */
        trackConversion(testId, goalName, value = 0) {
            const assignments = this.getStoredAssignments();
            const assignment = assignments[testId];

            if (!assignment) {
                console.warn(`No assignment found for test ${testId}`);
                return;
            }

            if (!this.analyticsEnabled) return;

            if (typeof gtag === 'function') {
                gtag('event', 'ab_test_conversion', {
                    test_id: testId,
                    variant: assignment.variant,
                    goal_name: goalName,
                    value: value,
                    test_description: this.tests[testId]?.description || ''
                });
            }
        }

        /**
         * Reset a specific test assignment
         * @param {string} testId - Test identifier
         */
        resetTest(testId) {
            const assignments = this.getStoredAssignments();
            delete assignments[testId];
            this.saveAssignments(assignments);
        }

        /**
         * Reset all test assignments
         */
        resetAllTests() {
            localStorage.removeItem(this.storageKey);
        }

        /**
         * Get all active test assignments
         */
        getActiveTests() {
            return this.getStoredAssignments();
        }

        /**
         * Check if user is in a specific variant
         * @param {string} testId - Test identifier
         * @param {string} variantName - Variant name to check
         */
        isInVariant(testId, variantName) {
            const variant = this.getVariant(testId);
            return variant && variant.name === variantName;
        }

        /**
         * Apply variant-specific changes to the page
         * @param {string} testId - Test identifier
         * @param {Object} variantConfigs - Object mapping variant names to functions
         */
        applyVariant(testId, variantConfigs) {
            const variant = this.getVariant(testId);

            if (!variant) {
                console.error(`Could not get variant for test ${testId}`);
                return;
            }

            const config = variantConfigs[variant.name];
            if (typeof config === 'function') {
                config(variant);
            } else {
                console.warn(`No configuration found for variant ${variant.name}`);
            }
        }
    }

    // Create global instance
    window.ABTesting = new ABTestingFramework();

    // Export for use in modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ABTestingFramework;
    }
})();
