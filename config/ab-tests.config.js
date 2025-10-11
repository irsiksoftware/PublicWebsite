/**
 * A/B Testing Configuration
 * Define your A/B tests here
 */

export const abTestsConfig = {
    // Example test configuration
    examples: {
        // Example 1: CTA button color test
        'cta-button-color': {
            description: 'Test different CTA button colors',
            variants: [
                { name: 'control', weight: 50 },
                { name: 'blue', weight: 50 }
            ],
            goals: ['button_click', 'form_submission']
        },

        // Example 2: Headline copy test
        'homepage-headline': {
            description: 'Test different homepage headline copy',
            variants: [
                { name: 'control', weight: 33.33 },
                { name: 'variant-a', weight: 33.33 },
                { name: 'variant-b', weight: 33.34 }
            ],
            goals: ['page_engagement', 'cta_click']
        },

        // Example 3: Pricing display test
        'pricing-format': {
            description: 'Test different pricing display formats',
            variants: [
                { name: 'monthly', weight: 50 },
                { name: 'annual', weight: 50 }
            ],
            goals: ['pricing_click', 'conversion']
        }
    },

    // Active tests - Add your active tests here
    active: {
        // Format:
        // 'test-id': {
        //     description: 'Test description',
        //     variants: [
        //         { name: 'control', weight: 50 },
        //         { name: 'variant', weight: 50 }
        //     ],
        //     goals: ['goal1', 'goal2']
        // }
    },

    // Global settings
    settings: {
        // Enable/disable A/B testing globally
        enabled: true,

        // Cookie/localStorage expiration in days
        assignmentTTL: 30,

        // Enable debug logging
        debug: false,

        // Minimum sample size before making decisions
        minSampleSize: 100,

        // Confidence level for statistical significance (95% = 0.95)
        confidenceLevel: 0.95
    }
};
