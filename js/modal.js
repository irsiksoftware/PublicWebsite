/**
 * Modal Open/Close with Focus Trap
 * Handles accessible modal dialogs with keyboard navigation and focus management
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    modalSelector: '.modal',
    triggerSelector: '.modal-trigger',
    closeSelector: '.modal__close',
    overlaySelector: '.modal__overlay',
    activeClass: 'active',
    bodyScrollClass: 'modal-open'
  };

  // State
  let activeModal = null;
  let lastFocusedElement = null;
  let focusableElements = [];
  let firstFocusable = null;
  let lastFocusable = null;

  /**
   * Query for all focusable elements within a container
   */
  function getFocusableElements(container) {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    return Array.from(container.querySelectorAll(selectors.join(', ')))
      .filter(el => {
        return el.offsetParent !== null &&
               window.getComputedStyle(el).visibility !== 'hidden';
      });
  }

  /**
   * Update focusable elements cache
   */
  function updateFocusableElements(modal) {
    focusableElements = getFocusableElements(modal);
    firstFocusable = focusableElements[0];
    lastFocusable = focusableElements[focusableElements.length - 1];
  }

  /**
   * Prevent body scroll
   */
  function preventBodyScroll() {
    document.body.classList.add(CONFIG.bodyScrollClass);
    document.body.style.overflow = 'hidden';
  }

  /**
   * Restore body scroll
   */
  function restoreBodyScroll() {
    document.body.classList.remove(CONFIG.bodyScrollClass);
    document.body.style.overflow = '';
  }

  /**
   * Open modal
   */
  function openModal(modal) {
    if (!modal) return;

    // Store the element that triggered the modal
    lastFocusedElement = document.activeElement;

    // Add active class to show modal
    modal.classList.add(CONFIG.activeClass);

    // Prevent body scroll
    preventBodyScroll();

    // Update focusable elements
    updateFocusableElements(modal);

    // Focus first input or first focusable element
    const firstInput = modal.querySelector('input, textarea, select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    } else if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }

    // Set active modal
    activeModal = modal;
  }

  /**
   * Close modal
   */
  function closeModal(modal) {
    if (!modal) return;

    // Remove active class to hide modal
    modal.classList.remove(CONFIG.activeClass);

    // Restore body scroll
    restoreBodyScroll();

    // Return focus to trigger element
    if (lastFocusedElement) {
      setTimeout(() => {
        lastFocusedElement.focus();
        lastFocusedElement = null;
      }, 100);
    }

    // Clear active modal
    activeModal = null;
  }

  /**
   * Handle Tab key for focus trap
   */
  function handleTabKey(event, modal) {
    if (!firstFocusable || !lastFocusable) return;

    // Shift + Tab
    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    }
    // Tab
    else {
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  /**
   * Handle keyboard events
   */
  function handleKeydown(event) {
    if (!activeModal) return;

    // Escape key closes modal
    if (event.key === 'Escape' || event.key === 'Esc') {
      event.preventDefault();
      closeModal(activeModal);
    }

    // Tab key for focus trap
    if (event.key === 'Tab') {
      handleTabKey(event, activeModal);
    }
  }

  /**
   * Handle trigger click
   */
  function handleTriggerClick(event) {
    const trigger = event.currentTarget;
    const modalId = trigger.getAttribute('data-modal');

    if (!modalId) return;

    const modal = document.getElementById(modalId);
    if (modal) {
      openModal(modal);
    }
  }

  /**
   * Handle close button click
   */
  function handleCloseClick(event) {
    const closeButton = event.currentTarget;
    const modal = closeButton.closest(CONFIG.modalSelector);

    if (modal) {
      closeModal(modal);
    }
  }

  /**
   * Handle overlay click
   */
  function handleOverlayClick(event) {
    // Only close if clicking directly on overlay, not on content
    if (event.target.classList.contains('modal__overlay')) {
      const modal = event.target.closest(CONFIG.modalSelector);
      if (modal) {
        closeModal(modal);
      }
    }
  }

  /**
   * Initialize modal functionality
   */
  function init() {
    // Get all modal triggers
    const triggers = document.querySelectorAll(CONFIG.triggerSelector);
    triggers.forEach(trigger => {
      trigger.addEventListener('click', handleTriggerClick);
    });

    // Get all modals
    const modals = document.querySelectorAll(CONFIG.modalSelector);
    modals.forEach(modal => {
      // Add close button listeners
      const closeButtons = modal.querySelectorAll(CONFIG.closeSelector);
      closeButtons.forEach(button => {
        button.addEventListener('click', handleCloseClick);
      });

      // Add overlay click listener
      const overlay = modal.querySelector(CONFIG.overlaySelector);
      if (overlay) {
        overlay.addEventListener('click', handleOverlayClick);
      }
    });

    // Global keyboard listener
    document.addEventListener('keydown', handleKeydown);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
