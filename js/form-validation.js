/**
 * Accessible Form Validation - WCAG 2.1 AA Compliant
 * Provides real-time validation feedback with proper ARIA support and keyboard navigation
 *
 * @example
 * // Initialize validator for a form
 * const validator = new AccessibleFormValidator('.contact-form');
 */

class AccessibleFormValidator {
    /**
     * Creates a new form validator instance
     * @param {string} formSelector - CSS selector for the form element
     */
    constructor(formSelector) {
        this.form = document.querySelector(formSelector);
        if (!this.form) return;

        this.init();
    }

    /**
     * Initializes the form validation system
     * Sets up error containers, keyboard navigation, and event listeners
     */
    init() {
        // Add aria-live region for form-level errors
        this.createErrorSummary();

        // Set up field validation
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Add error container if not exists
            this.createErrorContainer(input);

            // Validation on blur for better UX
            input.addEventListener('blur', () => this.validateField(input));

            // Clear errors on input
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Enable keyboard navigation
        this.setupKeyboardNavigation();

        // Form submission validation
        this.form.addEventListener('submit', (e) => this.validateForm(e));
    }

    /**
     * Sets up keyboard navigation for the form
     * Enables Enter key to move between form fields
     */
    setupKeyboardNavigation() {
        const formGroups = Array.from(this.form.querySelectorAll('.form-group'));
        const submitBtn = this.form.querySelector('button[type="submit"]');

        this.form.addEventListener('keydown', (e) => {
            const currentInput = document.activeElement;

            // Move to next field with Enter key (unless in textarea)
            if (e.key === 'Enter' && currentInput.tagName !== 'TEXTAREA') {
                e.preventDefault();
                const currentIndex = formGroups.findIndex(group =>
                    group.contains(currentInput)
                );

                if (currentIndex !== -1 && currentIndex < formGroups.length - 1) {
                    const nextInput = formGroups[currentIndex + 1].querySelector('input, textarea, select');
                    if (nextInput) {
                        nextInput.focus();
                    }
                } else if (submitBtn) {
                    submitBtn.focus();
                }
            }
        });
    }

    /**
     * Creates an ARIA live region for form-level error messages
     */
    createErrorSummary() {
        const summary = document.createElement('div');
        summary.id = 'form-error-summary';
        summary.className = 'form-error-summary';
        summary.setAttribute('role', 'alert');
        summary.setAttribute('aria-live', 'polite');
        summary.setAttribute('aria-atomic', 'true');
        this.form.insertBefore(summary, this.form.firstChild);
    }

    /**
     * Creates an error message container for an input field
     * @param {HTMLElement} input - The input element
     */
    createErrorContainer(input) {
        const errorId = `${input.id}-error`;

        if (!document.getElementById(errorId)) {
            const errorContainer = document.createElement('span');
            errorContainer.id = errorId;
            errorContainer.className = 'field-error';
            errorContainer.setAttribute('role', 'alert');
            errorContainer.setAttribute('aria-live', 'polite');

            // Insert error container after the input
            input.parentNode.insertBefore(errorContainer, input.nextSibling);

            // Link input to error with aria-describedby
            const describedBy = input.getAttribute('aria-describedby') || '';
            const ids = describedBy ? describedBy.split(' ') : [];
            if (!ids.includes(errorId)) {
                ids.push(errorId);
                input.setAttribute('aria-describedby', ids.join(' '));
            }
        }
    }

    /**
     * Validates a single form field
     * @param {HTMLElement} input - The input element to validate
     * @returns {boolean} True if valid, false if invalid
     */
    validateField(input) {
        const value = input.value.trim();
        const type = input.type;
        let error = null;

        // Required field validation
        if (input.hasAttribute('required') && !value) {
            error = `${this.getFieldLabel(input)} is required`;
        }
        // Email validation
        else if (type === 'email' && value && !this.isValidEmail(value)) {
            error = 'Please enter a valid email address';
        }
        // Min length validation
        else if (input.hasAttribute('minlength') && value.length > 0) {
            const minLength = parseInt(input.getAttribute('minlength'));
            if (value.length < minLength) {
                error = `${this.getFieldLabel(input)} must be at least ${minLength} characters`;
            }
        }
        // Pattern validation
        else if (input.hasAttribute('pattern') && value) {
            const pattern = new RegExp(input.getAttribute('pattern'));
            if (!pattern.test(value)) {
                error = input.getAttribute('title') || 'Please match the requested format';
            }
        }

        if (error) {
            this.showFieldError(input, error);
            return false;
        } else {
            this.clearFieldError(input);
            return true;
        }
    }

    /**
     * Displays an error message for a field
     * @param {HTMLElement} input - The input element
     * @param {string} message - The error message to display
     */
    showFieldError(input, message) {
        const errorId = `${input.id}-error`;
        const errorContainer = document.getElementById(errorId);

        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
        }

        // Mark field as invalid
        input.setAttribute('aria-invalid', 'true');
        input.classList.add('error');

        // Add visual error state to form group
        const formGroup = input.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('has-error');
        }
    }

    /**
     * Clears the error message for a field
     * @param {HTMLElement} input - The input element
     */
    clearFieldError(input) {
        const errorId = `${input.id}-error`;
        const errorContainer = document.getElementById(errorId);

        if (errorContainer) {
            errorContainer.textContent = '';
            errorContainer.style.display = 'none';
        }

        // Remove invalid state
        input.setAttribute('aria-invalid', 'false');
        input.classList.remove('error');

        // Remove error state from form group
        const formGroup = input.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('has-error');
        }
    }

    /**
     * Validates the entire form on submission
     * @param {Event} e - The form submit event
     * @returns {boolean} True if form is valid, false otherwise
     */
    validateForm(e) {
        const inputs = this.form.querySelectorAll('input, textarea, select');
        const errors = [];
        let firstErrorField = null;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                errors.push({
                    field: input,
                    label: this.getFieldLabel(input)
                });
                if (!firstErrorField) {
                    firstErrorField = input;
                }
            }
        });

        if (errors.length > 0) {
            e.preventDefault();

            // Show error summary
            this.showErrorSummary(errors);

            // Focus first error field
            if (firstErrorField) {
                firstErrorField.focus();
            }

            return false;
        }

        // Clear error summary on successful validation
        this.clearErrorSummary();

        // Handle successful form submission
        this.handleFormSubmit(e);
        return true;
    }

    /**
     * Handles successful form submission
     * @param {Event} e - The form submit event
     */
    handleFormSubmit(e) {
        e.preventDefault();
        const submitBtn = this.form.querySelector('button[type="submit"]');

        // Disable submit button during processing
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
        }

        // Show success message
        setTimeout(() => {
            const successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            successMsg.setAttribute('role', 'alert');
            successMsg.textContent = 'Your message has been sent successfully!';

            this.form.insertAdjacentElement('beforebegin', successMsg);
            this.form.reset();

            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
            }

            // Focus success message for screen readers
            successMsg.setAttribute('tabindex', '-1');
            successMsg.focus();

            // Remove success message after 5 seconds
            setTimeout(() => {
                successMsg.remove();
            }, 5000);
        }, 1000);
    }

    /**
     * Displays a summary of all form validation errors
     * @param {Array} errors - Array of error objects with field and label properties
     */
    showErrorSummary(errors) {
        const summary = document.getElementById('form-error-summary');
        if (!summary) return;

        const heading = document.createElement('h3');
        heading.textContent = `There ${errors.length === 1 ? 'is' : 'are'} ${errors.length} error${errors.length === 1 ? '' : 's'} with your submission:`;

        const list = document.createElement('ul');
        errors.forEach(error => {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${error.field.id}`;
            link.textContent = `${error.label} - ${error.field.nextElementSibling?.textContent || 'Invalid'}`;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                error.field.focus();
            });
            item.appendChild(link);
            list.appendChild(item);
        });

        summary.innerHTML = '';
        summary.appendChild(heading);
        summary.appendChild(list);
        summary.style.display = 'block';
    }

    /**
     * Clears the error summary display
     */
    clearErrorSummary() {
        const summary = document.getElementById('form-error-summary');
        if (summary) {
            summary.innerHTML = '';
            summary.style.display = 'none';
        }
    }

    /**
     * Gets the label text for an input field
     * @param {HTMLElement} input - The input element
     * @returns {string} The label text or field name
     */
    getFieldLabel(input) {
        const label = this.form.querySelector(`label[for="${input.id}"]`);
        return label ? label.textContent.replace('*', '').trim() : input.name;
    }

    /**
     * Validates an email address format
     * @param {string} email - The email address to validate
     * @returns {boolean} True if email format is valid
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}

// Initialize form validation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormValidation);
} else {
    initFormValidation();
}

/**
 * Initializes form validation for all forms on the page
 */
function initFormValidation() {
    // Validate contact form
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        new AccessibleFormValidator('.contact-form');
    }
}
