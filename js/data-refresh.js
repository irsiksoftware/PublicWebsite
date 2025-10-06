/**
 * Data refresh functionality
 * Provides a UI button to manually refresh all cached JSON data
 */

import { clearCache } from './data-loader.js';

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('success' or 'error')
 */
function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.data-refresh-toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `data-refresh-toast ${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');

  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Initializes the refresh button in the header
 */
function initRefreshButton() {
  const header = document.querySelector('header');
  if (!header) {
    console.error('Header element not found');
    return;
  }

  const refreshButton = document.createElement('button');
  refreshButton.className = 'data-refresh-btn';
  refreshButton.setAttribute('aria-label', 'Refresh data');
  refreshButton.setAttribute('title', 'Refresh data');
  refreshButton.innerHTML = '🔄';

  refreshButton.addEventListener('click', async () => {
    // Disable button and add loading state
    refreshButton.disabled = true;
    refreshButton.classList.add('loading');

    try {
      // Clear all cached data
      clearCache();

      // Reload the page to refetch all data
      await new Promise(resolve => setTimeout(resolve, 300)); // Brief delay for UX

      showToast('Data refreshed successfully');

      // Reload after showing toast
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error refreshing data:', error);
      showToast('Failed to refresh data', 'error');
      refreshButton.disabled = false;
      refreshButton.classList.remove('loading');
    }
  });

  header.appendChild(refreshButton);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRefreshButton);
} else {
  initRefreshButton();
}

export { showToast };
