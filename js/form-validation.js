/**
 * Form Validation and Keyboard Navigation
 * Enhances form accessibility with keyboard navigation and validation
 */

document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        const formGroups = Array.from(form.querySelectorAll('.form-group'));
        const submitBtn = form.querySelector('button[type="submit"]');

        // Enable keyboard navigation between form fields
        form.addEventListener('keydown', (e) => {
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

        // Real-time validation feedback
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Add validation on blur
            input.addEventListener('blur', () => {
                validateField(input);
            });

            // Clear error on focus
            input.addEventListener('focus', () => {
                clearFieldError(input);
            });
        });

        // Form submission validation
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            let isValid = true;
            const firstInvalidField = Array.from(inputs).find(input => {
                const valid = validateField(input);
                if (!valid) isValid = false;
                return !valid;
            });

            if (isValid) {
                // Form is valid, handle submission
                handleFormSubmit(form);
            } else if (firstInvalidField) {
                // Focus first invalid field
                firstInvalidField.focus();
            }
        });
    });
});

/**
 * Validate individual form field
 */
function validateField(input) {
    const value = input.value.trim();
    const type = input.type;
    const required = input.hasAttribute('required');

    // Clear previous error
    clearFieldError(input);

    // Required field validation
    if (required && !value) {
        showFieldError(input, 'This field is required');
        return false;
    }

    // Email validation
    if (type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(input, 'Please enter a valid email address');
            return false;
        }
    }

    // Minimum length validation
    const minLength = input.getAttribute('minlength');
    if (minLength && value.length < parseInt(minLength)) {
        showFieldError(input, `Minimum length is ${minLength} characters`);
        return false;
    }

    return true;
}

/**
 * Show field error message
 */
function showFieldError(input, message) {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;

    input.setAttribute('aria-invalid', 'true');
    input.classList.add('error');

    // Create or update error message
    let errorMsg = formGroup.querySelector('.error-message');
    if (!errorMsg) {
        errorMsg = document.createElement('span');
        errorMsg.className = 'error-message';
        errorMsg.setAttribute('role', 'alert');
        errorMsg.id = `${input.id}-error`;
        input.setAttribute('aria-describedby', errorMsg.id);
        formGroup.appendChild(errorMsg);
    }

    errorMsg.textContent = message;
}

/**
 * Clear field error message
 */
function clearFieldError(input) {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;

    input.removeAttribute('aria-invalid');
    input.classList.remove('error');

    const errorMsg = formGroup.querySelector('.error-message');
    if (errorMsg) {
        errorMsg.remove();
    }
}

/**
 * Handle form submission
 */
function handleFormSubmit(form) {
    const submitBtn = form.querySelector('button[type="submit"]');

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

        form.insertAdjacentElement('beforebegin', successMsg);
        form.reset();

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
