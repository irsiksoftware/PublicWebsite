/**
 * Micro-interactions JavaScript Module
 * Adds subtle interactions for better UX
 */

class MicroInteractions {
    constructor() {
        this.init();
    }

    init() {
        this.initScrollReveal();
        this.initCountUp();
        this.initTooltips();
        this.initProgressBars();
        this.initImageZoom();
        this.initRippleEffect();
    }

    /**
     * Scroll reveal animation for elements
     */
    initScrollReveal() {
        const revealElements = document.querySelectorAll('.scroll-reveal');

        if (!revealElements.length) return;

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(element => {
            revealObserver.observe(element);
        });
    }

    /**
     * Animated count-up for numbers
     */
    initCountUp() {
        const countElements = document.querySelectorAll('.count-up');

        if (!countElements.length) return;

        const animateCount = (element) => {
            const target = parseInt(element.getAttribute('data-count') || element.textContent);
            const duration = parseInt(element.getAttribute('data-duration') || 2000);
            const start = 0;
            const increment = target / (duration / 16);
            let current = start;

            const updateCount = () => {
                current += increment;
                if (current < target) {
                    element.textContent = Math.floor(current);
                    requestAnimationFrame(updateCount);
                } else {
                    element.textContent = target;
                }
            };

            updateCount();
        };

        const countObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    entry.target.classList.add('counted');
                    animateCount(entry.target);
                }
            });
        }, {
            threshold: 0.5
        });

        countElements.forEach(element => {
            countObserver.observe(element);
        });
    }

    /**
     * Enhanced tooltips
     */
    initTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');

        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.classList.add('tooltip-active');
            });

            element.addEventListener('mouseleave', () => {
                element.classList.remove('tooltip-active');
            });
        });
    }

    /**
     * Animated progress bars
     */
    initProgressBars() {
        const progressBars = document.querySelectorAll('.progress-bar');

        if (!progressBars.length) return;

        const animateProgress = (progressBar) => {
            const fill = progressBar.querySelector('.progress-bar-fill');
            if (!fill) return;

            const targetWidth = fill.getAttribute('data-progress') || '0';

            setTimeout(() => {
                fill.style.width = targetWidth + '%';
            }, 100);
        };

        const progressObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                    entry.target.classList.add('animated');
                    animateProgress(entry.target);
                }
            });
        }, {
            threshold: 0.5
        });

        progressBars.forEach(bar => {
            progressObserver.observe(bar);
        });
    }

    /**
     * Image zoom effect
     */
    initImageZoom() {
        const imageZoomContainers = document.querySelectorAll('.image-zoom');

        imageZoomContainers.forEach(container => {
            const img = container.querySelector('img');
            if (!img) return;

            container.addEventListener('mouseenter', () => {
                img.style.transform = 'scale(1.1)';
            });

            container.addEventListener('mouseleave', () => {
                img.style.transform = 'scale(1)';
            });
        });
    }

    /**
     * Enhanced ripple effect for buttons
     */
    initRippleEffect() {
        const buttons = document.querySelectorAll('button:not(.no-micro-interaction), .btn, .cta-button');

        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                ripple.classList.add('ripple-effect');

                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.5);
                    pointer-events: none;
                    transform: scale(0);
                    animation: ripple 0.6s ease-out;
                `;

                this.appendChild(ripple);

                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });

        // Add ripple animation CSS if not already present
        if (!document.querySelector('#ripple-animation-style')) {
            const style = document.createElement('style');
            style.id = 'ripple-animation-style';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Add shake animation to element (useful for form validation errors)
     */
    static shake(element) {
        element.classList.add('shake');
        setTimeout(() => {
            element.classList.remove('shake');
        }, 500);
    }

    /**
     * Add success animation to element
     */
    static showSuccess(element) {
        element.classList.add('success-checkmark');
        setTimeout(() => {
            element.classList.remove('success-checkmark');
        }, 300);
    }

    /**
     * Add pulse animation to badge
     */
    static pulseBadge(badge) {
        badge.classList.add('badge-update');
        setTimeout(() => {
            badge.classList.remove('badge-update');
        }, 500);
    }

    /**
     * Stagger animation for multiple elements
     */
    static staggerAnimation(container) {
        container.classList.add('stagger-children');
    }
}

// Initialize micro-interactions when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new MicroInteractions();
    });
} else {
    new MicroInteractions();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MicroInteractions;
}
