/**
 * Accessible Form Validation - WCAG 2.1 AA Compliant
 * Provides real-time validation feedback with proper ARIA support and keyboard navigation
 */

/* global FormData, fetch */

class AccessibleFormValidator {
    constructor(formSelector) {
        this.form = document.querySelector(formSelector);
        if (!this.form) return;

        this.init();
    }

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

    createErrorSummary() {
        const summary = document.createElement('div');
        summary.id = 'form-error-summary';
        summary.className = 'form-error-summary';
        summary.setAttribute('role', 'alert');
        summary.setAttribute('aria-live', 'polite');
        summary.setAttribute('aria-atomic', 'true');
        this.form.insertBefore(summary, this.form.firstChild);
    }

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

    async handleFormSubmit(e) {
        e.preventDefault();
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const statusDiv = document.getElementById('form-status');

        // Disable submit button during processing
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
        }

        try {
            // Submit form data to Formspree
            const formData = new FormData(this.form);
            const response = await fetch(this.form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Show success message
                if (statusDiv) {
                    statusDiv.className = 'form-status success-message';
                    statusDiv.textContent = 'Thank you! Your message has been sent successfully.';
                    statusDiv.style.display = 'block';
                }

                this.form.reset();

                // Focus status message for screen readers
                if (statusDiv) {
                    statusDiv.setAttribute('tabindex', '-1');
                    statusDiv.focus();
                }

                // Hide success message after 5 seconds
                setTimeout(() => {
                    if (statusDiv) {
                        statusDiv.style.display = 'none';
                        statusDiv.removeAttribute('tabindex');
                    }
                }, 5000);
            } else {
                // Handle error response
                const data = await response.json();
                const errorMsg = data.errors ? data.errors.map(e => e.message).join(', ') : 'There was a problem sending your message. Please try again.';

                if (statusDiv) {
                    statusDiv.className = 'form-status error-message';
                    statusDiv.textContent = errorMsg;
                    statusDiv.style.display = 'block';
                }
            }
        } catch (error) {
            // Handle network error
            if (statusDiv) {
                statusDiv.className = 'form-status error-message';
                statusDiv.textContent = 'There was a network error. Please check your connection and try again.';
                statusDiv.style.display = 'block';
            }
        } finally {
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
            }
        }
    }

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

    clearErrorSummary() {
        const summary = document.getElementById('form-error-summary');
        if (summary) {
            summary.innerHTML = '';
            summary.style.display = 'none';
        }
    }

    getFieldLabel(input) {
        const label = this.form.querySelector(`label[for="${input.id}"]`);
        return label ? label.textContent.replace('*', '').trim() : input.name;
    }

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

function initFormValidation() {
    // Validate contact form
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        new AccessibleFormValidator('.contact-form');
    }
}
