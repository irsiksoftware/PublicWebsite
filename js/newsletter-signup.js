/**
 * Newsletter Signup Module
 * Handles newsletter subscription form submission and validation
 */

class NewsletterSignup {
    constructor(formId = 'newsletter-form') {
        this.form = document.getElementById(formId);
        this.emailInput = null;
        this.submitButton = null;
        this.errorMessage = null;
        this.successMessage = null;

        if (this.form) {
            this.init();
        }
    }

    init() {
    // Get form elements
        this.emailInput = this.form.querySelector('input[type="email"]');
        this.submitButton = this.form.querySelector('button[type="submit"]');
        this.errorMessage = document.getElementById('newsletter-error');
        this.successMessage = document.getElementById('newsletter-success');

        // Bind event listeners
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.emailInput.addEventListener('input', this.clearMessages.bind(this));
    }

    /**
   * Validates email format
   * @param {string} email - Email address to validate
   * @returns {boolean} - True if valid, false otherwise
   */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
   * Clears all message displays
   */
    clearMessages() {
        if (this.errorMessage) {
            this.errorMessage.textContent = '';
            this.errorMessage.classList.remove('show');
        }
        if (this.successMessage) {
            this.successMessage.textContent = '';
            this.successMessage.classList.remove('show');
        }
    }

    /**
   * Displays error message
   * @param {string} message - Error message to display
   */
    showError(message) {
        this.clearMessages();
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.classList.add('show');
        }
    }

    /**
   * Displays success message
   * @param {string} message - Success message to display
   */
    showSuccess(message) {
        this.clearMessages();
        if (this.successMessage) {
            this.successMessage.textContent = message;
            this.successMessage.classList.add('show');
        }
    }

    /**
   * Sets form loading state
   * @param {boolean} isLoading - Whether form is in loading state
   */
    setLoading(isLoading) {
        if (this.submitButton) {
            this.submitButton.disabled = isLoading;
            this.submitButton.textContent = isLoading ? 'Subscribing...' : 'Subscribe';
        }
        if (this.emailInput) {
            this.emailInput.disabled = isLoading;
        }
    }

    /**
   * Submits newsletter subscription
   * @param {string} email - Email address to subscribe
   * @returns {Promise<Object>} - Response from API
   */
    async submitSubscription(email) {
    // For demo purposes, simulate API call with local storage
    // In production, this would call a backend API endpoint
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate API validation
                if (!this.validateEmail(email)) {
                    reject(new Error('Invalid email format'));
                    return;
                }

                // Store in local storage (demo only)
                try {
                    const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');

                    // Check if already subscribed
                    if (subscribers.includes(email)) {
                        reject(new Error('This email is already subscribed to our newsletter'));
                        return;
                    }

                    // Add new subscriber
                    subscribers.push(email);
                    localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));

                    // Track analytics event if available
                    if (window.trackEvent) {
                        window.trackEvent('Newsletter', 'Subscribe', email);
                    }

                    resolve({ success: true, message: 'Successfully subscribed!' });
                } catch (error) {
                    reject(new Error('Unable to process subscription. Please try again.'));
                }
            }, 1000); // Simulate network delay
        });
    }

    /**
   * Handles form submission
   * @param {Event} event - Form submit event
   */
    async handleSubmit(event) {
        event.preventDefault();

        const email = this.emailInput.value.trim();

        // Validate email
        if (!email) {
            this.showError('Please enter your email address');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        // Clear previous messages
        this.clearMessages();

        // Set loading state
        this.setLoading(true);

        try {
            // Submit subscription
            const response = await this.submitSubscription(email);

            // Show success message
            this.showSuccess(response.message || 'Thank you for subscribing! Check your email for confirmation.');

            // Reset form
            this.form.reset();

            // Focus back on input for accessibility
            setTimeout(() => {
                if (this.emailInput) {
                    this.emailInput.focus();
                }
            }, 3000);

        } catch (error) {
            // Show error message
            this.showError(error.message || 'An error occurred. Please try again later.');
        } finally {
            // Remove loading state
            this.setLoading(false);
        }
    }
}

// Initialize newsletter signup when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new NewsletterSignup();
    });
} else {
    new NewsletterSignup();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsletterSignup;
}
