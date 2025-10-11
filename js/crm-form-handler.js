/**
 * CRM Form Handler
 * Handles form submissions and sends lead data to CRM
 */

import CRMIntegration from './crm-integration.js';

class CRMFormHandler {
    constructor(formSelector, crmConfig) {
        this.form = document.querySelector(formSelector);
        this.crm = new CRMIntegration(crmConfig);
        this.submitButton = null;
        this.initialized = false;

        if (this.form) {
            this.init();
        }
    }

    /**
     * Initialize form handler
     */
    async init() {
        try {
            const crmInitialized = await this.crm.initialize();

            if (!crmInitialized) {
                console.warn('CRM not properly configured, form will not sync with CRM');
                return;
            }

            this.initialized = true;
            this.attachEventListeners();
            this.addFormIndicator();
        } catch (error) {
            console.error('Failed to initialize CRM form handler:', error);
        }
    }

    /**
     * Attach event listeners to form
     */
    attachEventListeners() {
        if (!this.form) return;

        this.form.addEventListener('submit', this.handleSubmit.bind(this));

        // Find submit button
        this.submitButton = this.form.querySelector('button[type="submit"]') ||
                           this.form.querySelector('input[type="submit"]');
    }

    /**
     * Add visual indicator that form is CRM-enabled
     */
    addFormIndicator() {
        if (!this.form || !this.initialized) return;

        const indicator = document.createElement('div');
        indicator.className = 'crm-indicator';
        indicator.setAttribute('role', 'status');
        indicator.setAttribute('aria-live', 'polite');
        indicator.innerHTML = `
            <span class="crm-badge">CRM Connected</span>
            <span class="sr-only">This form is connected to CRM system</span>
        `;

        this.form.insertBefore(indicator, this.form.firstChild);
    }

    /**
     * Handle form submission
     * @param {Event} event - Submit event
     */
    async handleSubmit(event) {
        event.preventDefault();

        if (!this.initialized) {
            console.warn('CRM not initialized, skipping CRM sync');
            this.showMessage('Form submitted (CRM sync disabled)', 'warning');
            return;
        }

        const formData = this.extractFormData();

        if (!this.validateFormData(formData)) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }

        this.setSubmitting(true);

        try {
            const result = await this.crm.createLead(formData);

            this.showMessage('Lead successfully created in CRM!', 'success');
            this.form.reset();

            // Dispatch custom event for analytics
            this.dispatchCRMEvent('crm:lead:created', result);
        } catch (error) {
            console.error('Failed to create lead:', error);
            this.showMessage('Failed to submit lead to CRM. Please try again.', 'error');

            // Dispatch error event
            this.dispatchCRMEvent('crm:lead:error', { error: error.message });
        } finally {
            this.setSubmitting(false);
        }
    }

    /**
     * Extract form data into lead object
     * @returns {Object}
     */
    extractFormData() {
        const formData = new FormData(this.form);
        const leadData = {};

        // Map common form field names to CRM fields
        const fieldMapping = {
            'first-name': 'firstName',
            'firstname': 'firstName',
            'fname': 'firstName',
            'last-name': 'lastName',
            'lastname': 'lastName',
            'lname': 'lastName',
            'email': 'email',
            'phone': 'phone',
            'telephone': 'phone',
            'company': 'company',
            'organization': 'company',
            'website': 'website',
            'url': 'website',
            'message': 'notes',
            'notes': 'notes',
            'comments': 'notes'
        };

        for (const [key, value] of formData.entries()) {
            const normalizedKey = key.toLowerCase().replace(/[_\s]/g, '-');
            const mappedKey = fieldMapping[normalizedKey] || key;

            if (value && value.trim()) {
                leadData[mappedKey] = value.trim();
            }
        }

        return leadData;
    }

    /**
     * Validate form data
     * @param {Object} formData - Form data to validate
     * @returns {boolean}
     */
    validateFormData(formData) {
        // At minimum, require email
        if (!formData.email) {
            return false;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            return false;
        }

        return true;
    }

    /**
     * Set form submitting state
     * @param {boolean} isSubmitting - Whether form is submitting
     */
    setSubmitting(isSubmitting) {
        if (this.submitButton) {
            this.submitButton.disabled = isSubmitting;
            this.submitButton.textContent = isSubmitting ?
                'Submitting...' :
                this.submitButton.dataset.originalText || 'Submit';

            if (!this.submitButton.dataset.originalText) {
                this.submitButton.dataset.originalText = this.submitButton.textContent;
            }
        }

        // Disable all form inputs while submitting
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.disabled = isSubmitting;
        });
    }

    /**
     * Show message to user
     * @param {string} message - Message text
     * @param {string} type - Message type (success, error, warning)
     */
    showMessage(message, type = 'info') {
        const existingMessage = this.form.querySelector('.crm-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageEl = document.createElement('div');
        messageEl.className = `crm-message crm-message--${type}`;
        messageEl.setAttribute('role', 'alert');
        messageEl.textContent = message;

        this.form.insertBefore(messageEl, this.form.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 5000);
    }

    /**
     * Dispatch custom CRM event
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail data
     */
    dispatchCRMEvent(eventName, detail) {
        const event = new CustomEvent(eventName, {
            bubbles: true,
            detail
        });

        this.form.dispatchEvent(event);
    }

    /**
     * Destroy form handler and clean up
     */
    destroy() {
        if (this.form) {
            this.form.removeEventListener('submit', this.handleSubmit);

            const indicator = this.form.querySelector('.crm-indicator');
            if (indicator) {
                indicator.remove();
            }
        }

        this.initialized = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CRMFormHandler;
}

export default CRMFormHandler;
