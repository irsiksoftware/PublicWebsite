/**
 * Session Detail Modal
 * Displays full session details in an overlay modal
 */

class SessionDetailModal {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createModal();
        this.attachEventListeners();
    }

    createModal() {
        const modalHTML = `
            <div id="session-detail-modal" class="session-modal" style="display: none;" role="dialog" aria-labelledby="modal-title" aria-modal="true">
                <div class="session-modal-overlay"></div>
                <div class="session-modal-content">
                    <button class="session-modal-close" aria-label="Close modal">&times;</button>
                    <div class="session-modal-body">
                        <h2 id="modal-title">Session Details</h2>
                        <div class="session-detail-grid">
                            <div class="session-detail-item">
                                <span class="session-detail-label">File Path:</span>
                                <span class="session-detail-value" id="modal-file-path"></span>
                            </div>
                            <div class="session-detail-item">
                                <span class="session-detail-label">Target Repo:</span>
                                <span class="session-detail-value" id="modal-target-repo"></span>
                            </div>
                            <div class="session-detail-item">
                                <span class="session-detail-label">Timeout:</span>
                                <span class="session-detail-value" id="modal-timeout"></span>
                            </div>
                            <div class="session-detail-item">
                                <span class="session-detail-label">Has Error:</span>
                                <span class="session-detail-value" id="modal-has-error"></span>
                            </div>
                            <div class="session-detail-item">
                                <span class="session-detail-label">Is Timeout:</span>
                                <span class="session-detail-value" id="modal-is-timeout"></span>
                            </div>
                        </div>
                        <div class="session-signals-section">
                            <h3>Signals</h3>
                            <div class="session-signals-grid" id="modal-signals"></div>
                        </div>
                        <div class="session-content-section">
                            <h3>Content Preview</h3>
                            <pre class="session-content-preview" id="modal-content-preview"></pre>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('session-detail-modal');
    }

    attachEventListeners() {
        const closeBtn = this.modal.querySelector('.session-modal-close');
        const overlay = this.modal.querySelector('.session-modal-overlay');
        const modalContent = this.modal.querySelector('.session-modal-content');

        closeBtn.addEventListener('click', () => this.close());
        overlay.addEventListener('click', () => this.close());

        // Prevent clicks on modal content from closing the modal
        modalContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Close modal on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Trap focus within modal
        this.modal.addEventListener('keydown', (e) => {
            if (!this.isOpen || e.key !== 'Tab') return;

            const focusableElements = this.modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const focusableArray = Array.from(focusableElements);
            const firstElement = focusableArray[0];
            const lastElement = focusableArray[focusableArray.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    }

    open(sessionData) {
        if (!sessionData) return;

        document.getElementById('modal-file-path').textContent = sessionData.file || 'N/A';
        document.getElementById('modal-target-repo').textContent = sessionData.target_repo || 'N/A';
        document.getElementById('modal-timeout').textContent = sessionData.timeout_minutes
            ? `${sessionData.timeout_minutes} minutes`
            : 'N/A';
        document.getElementById('modal-has-error').textContent = sessionData.has_error ? 'Yes' : 'No';
        document.getElementById('modal-is-timeout').textContent = sessionData.is_timeout ? 'Yes' : 'No';

        const signalsContainer = document.getElementById('modal-signals');
        signalsContainer.innerHTML = '';
        if (sessionData.signals) {
            Object.entries(sessionData.signals).forEach(([key, value]) => {
                const signalItem = document.createElement('div');
                signalItem.className = 'session-signal-item';
                signalItem.innerHTML = `
                    <span class="session-signal-label">${key.replace(/_/g, ' ')}:</span>
                    <span class="session-signal-value ${value ? 'signal-true' : 'signal-false'}">
                        ${value ? '✓' : '✗'}
                    </span>
                `;
                signalsContainer.appendChild(signalItem);
            });
        }

        const contentPreview = sessionData.content
            ? sessionData.content.substring(0, 500)
            : 'No content available';
        document.getElementById('modal-content-preview').textContent = contentPreview;

        this.modal.style.display = 'block';
        this.isOpen = true;
        document.body.style.overflow = 'hidden';

        // Store previously focused element
        this.previouslyFocusedElement = document.activeElement;

        // Focus close button when modal opens
        setTimeout(() => {
            const closeBtn = this.modal.querySelector('.session-modal-close');
            if (closeBtn) closeBtn.focus();
        }, 50);
    }

    close() {
        this.modal.style.display = 'none';
        this.isOpen = false;
        document.body.style.overflow = '';

        // Restore focus to previously focused element
        if (this.previouslyFocusedElement) {
            this.previouslyFocusedElement.focus();
        }
    }
}

if (typeof window !== 'undefined') {
    window.SessionDetailModal = SessionDetailModal;
}
