/**
 * Multi-Step Contact Form
 * Handles step navigation, validation, and review functionality
 */
(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMultiStepForm);
    } else {
        initMultiStepForm();
    }

    function initMultiStepForm() {
        const form = document.querySelector('.multi-step-form');
        if (!form) return;

        const steps = form.querySelectorAll('.form-step');
        const progressSteps = document.querySelectorAll('.progress-step');
        const prevBtn = form.querySelector('.btn-prev');
        const nextBtn = form.querySelector('.btn-next');
        const submitBtn = form.querySelector('.btn-submit');
        const progressBar = document.querySelector('.form-progress');

        let currentStep = 1;
        const totalSteps = steps.length;

        // Initialize
        updateStepDisplay();

        // Event listeners
        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateStepDisplay();
            }
        });

        nextBtn.addEventListener('click', () => {
            if (validateCurrentStep()) {
                if (currentStep < totalSteps) {
                    currentStep++;
                    updateStepDisplay();

                    // If we're on the review step, populate review data
                    if (currentStep === totalSteps) {
                        populateReview();
                    }
                }
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateCurrentStep()) {
                handleFormSubmit();
            }
        });

        /**
         * Updates the step display and navigation buttons
         */
        function updateStepDisplay() {
            // Update form steps
            steps.forEach((step, index) => {
                step.classList.toggle('active', index + 1 === currentStep);
            });

            // Update progress steps
            progressSteps.forEach((step, index) => {
                const stepNum = index + 1;
                step.classList.toggle('active', stepNum === currentStep);
                step.classList.toggle('completed', stepNum < currentStep);
            });

            // Update progress bar aria attributes
            if (progressBar) {
                progressBar.setAttribute('aria-valuenow', currentStep);
            }

            // Update navigation buttons
            prevBtn.disabled = currentStep === 1;

            if (currentStep === totalSteps) {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'inline-block';
            } else {
                nextBtn.style.display = 'inline-block';
                submitBtn.style.display = 'none';
            }

            // Scroll to top of form
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        /**
         * Validates the current step's required fields
         */
        function validateCurrentStep() {
            const currentStepElement = steps[currentStep - 1];
            const requiredFields = currentStepElement.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                // Clear previous validation styles
                field.classList.remove('invalid');

                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('invalid');

                    // Add red border to invalid fields
                    field.style.borderColor = '#dc3545';

                    // Remove red border on focus
                    field.addEventListener('focus', function() {
                        this.style.borderColor = '';
                        this.classList.remove('invalid');
                    }, { once: true });
                } else {
                    field.style.borderColor = '';
                }
            });

            if (!isValid) {
                // Show validation message
                const firstInvalid = currentStepElement.querySelector('.invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                }
                showValidationMessage('Please fill in all required fields');
            }

            return isValid;
        }

        /**
         * Populates the review step with form data
         */
        function populateReview() {
            // Contact Reason
            const contactReason = document.getElementById('contact-reason');
            const urgency = document.getElementById('urgency');
            setReviewText('review-contact-reason', `Contact Reason: ${getSelectText(contactReason)}`);
            setReviewText('review-urgency', `Urgency: ${getSelectText(urgency)}`);

            // Basic Information
            setReviewText('review-name', `Name: ${document.getElementById('name').value}`);
            setReviewText('review-email', `Email: ${document.getElementById('email').value}`);
            setReviewText('review-phone', `Phone: ${document.getElementById('phone').value || 'Not provided'}`);
            setReviewText('review-company', `Company: ${document.getElementById('company').value || 'Not provided'}`);

            // Project Details
            setReviewText('review-project-title', `Title: ${document.getElementById('project-title').value}`);
            const projectType = document.getElementById('project-type');
            setReviewText('review-project-type', `Type: ${getSelectText(projectType)}`);
            setReviewText('review-project-description', `Description: ${document.getElementById('project-description').value}`);

            // Budget and Timeline
            const budget = document.getElementById('budget');
            const timeline = document.getElementById('timeline');
            setReviewText('review-budget', `Budget: ${getSelectText(budget)}`);
            setReviewText('review-timeline', `Timeline: ${getSelectText(timeline)}`);
            setReviewText('review-start-date', `Start Date: ${document.getElementById('start-date').value || 'Not specified'}`);
        }

        /**
         * Helper function to set review text
         */
        function setReviewText(elementId, text) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = text;
            }
        }

        /**
         * Helper function to get selected option text
         */
        function getSelectText(selectElement) {
            if (!selectElement || !selectElement.selectedOptions.length) {
                return '';
            }
            return selectElement.selectedOptions[0].text;
        }

        /**
         * Shows a validation message
         */
        function showValidationMessage(message) {
            // Remove existing message
            const existingMessage = form.querySelector('.validation-message');
            if (existingMessage) {
                existingMessage.remove();
            }

            // Create and show new message
            const messageDiv = document.createElement('div');
            messageDiv.className = 'validation-message';
            messageDiv.textContent = message;
            messageDiv.style.cssText = `
                background: #dc3545;
                color: white;
                padding: 1rem;
                border-radius: 4px;
                margin-bottom: 1rem;
                text-align: center;
                font-weight: 500;
            `;

            const currentStepElement = steps[currentStep - 1];
            currentStepElement.insertBefore(messageDiv, currentStepElement.firstChild);

            // Remove after 3 seconds
            setTimeout(() => {
                messageDiv.remove();
            }, 3000);
        }

        /**
         * Handles form submission
         */
        function handleFormSubmit() {
            // Disable submit button during processing
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            // Form will be submitted to Formspree
            // Show loading state
            console.log('Form submitted to Formspree');

            // The form will actually submit to Formspree
            // On success, user will be redirected to success page
            form.submit();
        }

        /**
         * Shows a success message after form submission
         */
        function showSuccessMessage() {
            const formSection = document.querySelector('.contact-form-section');

            formSection.innerHTML = `
                <div class="success-message" style="text-align: center; padding: 3rem 2rem;">
                    <div style="width: 80px; height: 80px; background: #28a745; border-radius: 50%; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <h3 style="color: var(--primary-blue); margin-bottom: 1rem;">Thank You!</h3>
                    <p style="color: var(--text-primary); font-size: 1.1rem; margin-bottom: 1.5rem;">
                        Your message has been successfully submitted. We'll get back to you as soon as possible.
                    </p>
                    <button onclick="location.reload()" class="btn-primary">Send Another Message</button>
                </div>
            `;
        }
    }
})();
