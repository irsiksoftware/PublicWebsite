/**
 * Form Success Handler
 * Detects success parameter and displays success message
 */
(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkFormSuccess);
    } else {
        checkFormSuccess();
    }

    /**
     * Checks for success parameter in URL and displays success message
     */
    function checkFormSuccess() {
        const urlParams = new URLSearchParams(window.location.search);
        const success = urlParams.get('success');

        if (success === 'true') {
            const formSection = document.querySelector('.contact-form-section');

            if (formSection) {
                // Show success message
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
                        <button onclick="location.href='contact.html'" class="btn-primary">Send Another Message</button>
                    </div>
                `;

                // Clean URL by removing success parameter
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            }
        }
    }
})();
