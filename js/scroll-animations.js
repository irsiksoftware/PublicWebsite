/**
 * @fileoverview Scroll-Triggered Animations Module
 * Provides fade-in animations, parallax effects, and animated number counters
 * triggered by scroll position using Intersection Observer API.
 *
 * @module scroll-animations
 *
 * @example
 * // Auto-initializes on DOMContentLoaded
 * // Add data attributes to elements:
 * // <div class="scroll-fade-in">Content</div>
 * // <div data-parallax="0.5">Parallax content</div>
 * // <span data-counter="1000" data-counter-suffix="+">1000+</span>
 */

/**
 * Scroll animations class implementing fade-in, parallax, and counter animations
 * @class
 */
class ScrollAnimations {
    /**
     * Initializes the scroll animations controller
     * @constructor
     */
    constructor() {
        /**
         * Intersection Observer options
         * @type {Object}
         */
        this.observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        this.observer = null;
        this.counters = new Map();
        this.parallaxElements = [];
        this.initialized = false;
    }

    /**
     * Initializes all scroll animations
     * @method
     */
    init() {
        if (this.initialized) return;

        // Create Intersection Observer for fade-in animations
        this.setupFadeInObserver();

        // Setup parallax effects
        this.setupParallax();

        // Setup number counters
        this.setupCounters();

        this.initialized = true;
    }

    setupFadeInObserver() {
        // Add fade-in class to animatable elements
        const elements = document.querySelectorAll(
            '.service-item, .portfolio-item, .testimonial, .technology-item, .leadership-profile, section'
        );

        elements.forEach(el => {
            if (!el.classList.contains('scroll-fade-in')) {
                el.classList.add('scroll-fade-in');
            }
        });

        // Create observer
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-visible');

                    // Trigger counter animation if element has counter
                    if (entry.target.hasAttribute('data-counter')) {
                        this.animateCounter(entry.target);
                    }
                }
            });
        }, this.observerOptions);

        // Observe all fade-in elements
        document.querySelectorAll('.scroll-fade-in').forEach(el => {
            this.observer.observe(el);
        });
    }

    setupParallax() {
        // Find elements with parallax data attribute
        this.parallaxElements = Array.from(
            document.querySelectorAll('[data-parallax]')
        );

        if (this.parallaxElements.length === 0) {
            // Add parallax to hero section if it exists
            const hero = document.querySelector('.hero-section, #hero');
            if (hero) {
                hero.setAttribute('data-parallax', '0.5');
                this.parallaxElements.push(hero);
            }
        }

        if (this.parallaxElements.length > 0) {
            // Use passive event listener for better performance
            window.addEventListener('scroll', () => this.handleParallax(), { passive: true });
            // Initial parallax calculation
            this.handleParallax();
        }
    }

    handleParallax() {
        const scrolled = window.pageYOffset;

        this.parallaxElements.forEach(element => {
            const speed = parseFloat(element.getAttribute('data-parallax')) || 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    }

    setupCounters() {
        // Find elements with counter data attribute
        const counterElements = document.querySelectorAll('[data-counter]');

        counterElements.forEach(el => {
            if (!el.classList.contains('scroll-fade-in')) {
                el.classList.add('scroll-fade-in');
            }
            this.observer.observe(el);
        });
    }

    /**
     * Animates a number counter from 0 to target value
     * @method
     * @param {HTMLElement} element - Element containing counter data attributes
     */
    animateCounter(element) {
        // Prevent re-animation
        if (this.counters.has(element)) return;

        const target = parseInt(element.getAttribute('data-counter'), 10);
        const duration = parseInt(element.getAttribute('data-counter-duration'), 10) || 2000;
        const suffix = element.getAttribute('data-counter-suffix') || '';
        const prefix = element.getAttribute('data-counter-prefix') || '';

        if (isNaN(target)) return;

        this.counters.set(element, true);

        const startTime = Date.now();
        const startValue = 0;

        const easeOutQuad = (t) => t * (2 - t);

        const updateCounter = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutQuad(progress);
            const currentValue = Math.floor(startValue + (target - startValue) * easedProgress);

            element.textContent = `${prefix}${currentValue.toLocaleString()}${suffix}`;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
            }
        };

        requestAnimationFrame(updateCounter);
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }

        window.removeEventListener('scroll', () => this.handleParallax());

        this.counters.clear();
        this.parallaxElements = [];
        this.initialized = false;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const scrollAnimations = new ScrollAnimations();
        scrollAnimations.init();
    });
} else {
    const scrollAnimations = new ScrollAnimations();
    scrollAnimations.init();
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrollAnimations;
}
