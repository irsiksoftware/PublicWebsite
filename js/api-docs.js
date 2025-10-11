/**
 * API Documentation Portal JavaScript
 * Handles interactive features including code sample switching,
 * copy to clipboard functionality, and API playground modal
 */

(function() {
    'use strict';

    /**
     * Initialize all interactive features on page load
     */
    function init() {
        initCodeSampleTabs();
        initCopyButtons();
        initTryButtons();
        initPlaygroundModal();
    }

    /**
     * Initialize code sample language tabs
     */
    function initCodeSampleTabs() {
        const languageTabs = document.querySelectorAll('.language-tab');
        const codeSamples = document.querySelectorAll('.code-sample');

        languageTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const language = this.getAttribute('data-language');

                // Update active tab
                languageTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                // Show corresponding code sample
                codeSamples.forEach(sample => {
                    if (sample.getAttribute('data-language') === language) {
                        sample.style.display = 'block';
                    } else {
                        sample.style.display = 'none';
                    }
                });
            });
        });
    }

    /**
     * Initialize copy to clipboard functionality for all copy buttons
     */
    function initCopyButtons() {
        const copyButtons = document.querySelectorAll('.copy-button');

        copyButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.getAttribute('data-copy-target');
                const targetElement = document.getElementById(targetId);

                if (!targetElement) {
                    console.error('Copy target not found:', targetId);
                    return;
                }

                const textToCopy = targetElement.textContent;

                // Use Clipboard API if available
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(textToCopy)
                        .then(() => {
                            showCopySuccess(button);
                        })
                        .catch(err => {
                            console.error('Failed to copy:', err);
                            fallbackCopy(textToCopy, button);
                        });
                } else {
                    fallbackCopy(textToCopy, button);
                }
            });
        });
    }

    /**
     * Fallback copy method for browsers that don't support Clipboard API
     * @param {string} text - Text to copy
     * @param {HTMLElement} button - Button element to update
     */
    function fallbackCopy(text, button) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showCopySuccess(button);
            } else {
                console.error('Copy command failed');
            }
        } catch (err) {
            console.error('Failed to copy:', err);
        }

        document.body.removeChild(textarea);
    }

    /**
     * Show visual feedback when copy is successful
     * @param {HTMLElement} button - Button element to update
     */
    function showCopySuccess(button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied');

        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }

    /**
     * Initialize "Try It" buttons for API playground
     */
    function initTryButtons() {
        const tryButtons = document.querySelectorAll('.try-button');

        tryButtons.forEach(button => {
            button.addEventListener('click', function() {
                const endpoint = this.getAttribute('data-endpoint');
                openPlayground(endpoint);
            });
        });
    }

    /**
     * Open API playground modal with pre-filled endpoint data
     * @param {string} endpoint - Endpoint identifier
     */
    function openPlayground(endpoint) {
        const modal = document.getElementById('api-playground');
        if (!modal) return;

        const endpointData = getEndpointData(endpoint);

        if (endpointData) {
            document.getElementById('endpoint-input').value = endpointData.path;
            document.getElementById('method-input').value = endpointData.method;

            const bodyGroup = document.getElementById('body-group');
            const bodyInput = document.getElementById('body-input');

            if (endpointData.method === 'POST' || endpointData.method === 'PUT') {
                bodyGroup.style.display = 'block';
                bodyInput.value = endpointData.body || '';
            } else {
                bodyGroup.style.display = 'none';
                bodyInput.value = '';
            }
        }

        modal.style.display = 'block';
    }

    /**
     * Get endpoint data for API playground
     * @param {string} endpoint - Endpoint identifier
     * @returns {Object|null} Endpoint data object
     */
    function getEndpointData(endpoint) {
        const endpoints = {
            'get-users': {
                path: '/users?page=1&limit=20',
                method: 'GET'
            },
            'post-users': {
                path: '/users',
                method: 'POST',
                body: JSON.stringify({
                    email: 'newuser@example.com',
                    name: 'Jane Smith',
                    role: 'developer',
                    password: 'SecureP@ssw0rd'
                }, null, 2)
            },
            'get-user-id': {
                path: '/users/usr_1234567890',
                method: 'GET'
            },
            'put-user-id': {
                path: '/users/usr_1234567890',
                method: 'PUT',
                body: JSON.stringify({
                    name: 'Jane Doe',
                    role: 'admin'
                }, null, 2)
            },
            'delete-user-id': {
                path: '/users/usr_1234567890',
                method: 'DELETE'
            },
            'get-projects': {
                path: '/projects?status=active',
                method: 'GET'
            },
            'post-projects': {
                path: '/projects',
                method: 'POST',
                body: JSON.stringify({
                    name: 'Mobile App Development',
                    description: 'iOS and Android app',
                    owner_id: 'usr_1234567890',
                    status: 'active'
                }, null, 2)
            },
            'get-analytics': {
                path: '/analytics/metrics?start_date=2025-10-01T00:00:00Z&end_date=2025-10-11T23:59:59Z',
                method: 'GET'
            }
        };

        return endpoints[endpoint] || null;
    }

    /**
     * Initialize API playground modal functionality
     */
    function initPlaygroundModal() {
        const modal = document.getElementById('api-playground');
        if (!modal) return;

        const closeButton = modal.querySelector('.close-modal');
        const sendButton = document.getElementById('send-request');

        // Close modal when clicking X button
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                modal.style.display = 'none';
                clearPlaygroundResponse();
            });
        }

        // Close modal when clicking outside the modal content
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
                clearPlaygroundResponse();
            }
        });

        // Send API request
        if (sendButton) {
            sendButton.addEventListener('click', sendApiRequest);
        }

        // Close modal on Escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && modal.style.display === 'block') {
                modal.style.display = 'none';
                clearPlaygroundResponse();
            }
        });
    }

    /**
     * Send API request from playground (demo mode - simulated response)
     */
    function sendApiRequest() {
        const apiKey = document.getElementById('api-key-input').value;
        const endpoint = document.getElementById('endpoint-input').value;
        const method = document.getElementById('method-input').value;
        const body = document.getElementById('body-input').value;

        // Validate inputs
        if (!apiKey) {
            showPlaygroundResponse({
                error: 'API key is required',
                message: 'Please enter your API key to make requests'
            }, true);
            return;
        }

        // Show loading state
        const sendButton = document.getElementById('send-request');
        const originalText = sendButton.textContent;
        sendButton.textContent = 'Sending...';
        sendButton.disabled = true;

        // Simulate API request (in production, this would make a real API call)
        setTimeout(() => {
            const response = generateMockResponse(endpoint, method);
            showPlaygroundResponse(response, false);

            sendButton.textContent = originalText;
            sendButton.disabled = false;
        }, 1000);
    }

    /**
     * Generate mock API response for demonstration
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @returns {Object} Mock response object
     */
    function generateMockResponse(endpoint, method) {
        // This is a demo function that generates mock responses
        // In production, this would make actual API calls

        if (method === 'GET' && endpoint.includes('/users')) {
            return {
                data: [
                    {
                        id: 'usr_1234567890',
                        email: 'user@example.com',
                        name: 'John Doe',
                        role: 'developer',
                        created_at: '2025-01-15T10:30:00Z',
                        updated_at: '2025-01-20T14:45:00Z'
                    }
                ],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 150,
                    pages: 8
                }
            };
        } else if (method === 'POST' && endpoint === '/users') {
            return {
                id: 'usr_0987654321',
                email: 'newuser@example.com',
                name: 'Jane Smith',
                role: 'developer',
                created_at: new Date().toISOString()
            };
        } else if (method === 'GET' && endpoint.includes('/projects')) {
            return {
                data: [
                    {
                        id: 'prj_abc123',
                        name: 'E-Commerce Platform',
                        description: 'Modern e-commerce solution',
                        status: 'active',
                        owner_id: 'usr_1234567890',
                        created_at: '2025-08-01T00:00:00Z',
                        updated_at: '2025-10-10T18:30:00Z'
                    }
                ],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 45
                }
            };
        } else if (method === 'GET' && endpoint.includes('/analytics')) {
            return {
                metrics: {
                    total_requests: 125000,
                    total_users: 3420,
                    error_rate: 0.02,
                    avg_response_time: 145
                },
                period: {
                    start: '2025-10-01T00:00:00Z',
                    end: '2025-10-11T23:59:59Z'
                }
            };
        } else if (method === 'DELETE') {
            return {
                success: true,
                message: 'Resource deleted successfully'
            };
        } else {
            return {
                success: true,
                message: 'Request completed successfully'
            };
        }
    }

    /**
     * Display API response in the playground
     * @param {Object} response - Response object
     * @param {boolean} isError - Whether this is an error response
     */
    function showPlaygroundResponse(response, isError) {
        const responseOutput = document.getElementById('response-output');
        const responseContent = document.getElementById('response-content');

        if (!responseOutput || !responseContent) return;

        const formattedResponse = JSON.stringify(response, null, 2);
        responseContent.textContent = formattedResponse;

        if (isError) {
            responseContent.style.color = 'var(--method-delete, #f93e3e)';
        } else {
            responseContent.style.color = 'var(--code-text, #f8f8f2)';
        }

        responseOutput.style.display = 'block';

        // Scroll to response
        responseOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Clear playground response output
     */
    function clearPlaygroundResponse() {
        const responseOutput = document.getElementById('response-output');
        if (responseOutput) {
            responseOutput.style.display = 'none';
        }
    }

    /**
     * Add smooth scrolling for anchor links
     */
    function initSmoothScrolling() {
        const links = document.querySelectorAll('a[href^="#"]');

        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Update URL without jumping
                    if (history.pushState) {
                        history.pushState(null, null, targetId);
                    }
                }
            });
        });
    }

    /**
     * Initialize on DOM content loaded
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            init();
            initSmoothScrolling();
        });
    } else {
        init();
        initSmoothScrolling();
    }

})();
