/**
 * Search Bar Component - Interactive Functionality
 * Handles clear button visibility and interaction
 */

(function() {
  'use strict';

  // Initialize all search bars on the page
  function initSearchBars() {
    const searchBars = document.querySelectorAll('.search-bar');

    searchBars.forEach(searchBar => {
      const input = searchBar.querySelector('.search-bar__input');
      const clearBtn = searchBar.querySelector('.search-bar__clear');

      if (!input || !clearBtn) return;

      // Clear button click handler
      clearBtn.addEventListener('click', () => {
        input.value = '';
        input.focus();
        // Trigger input event for any listeners
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });

      // Update clear button visibility on input
      input.addEventListener('input', () => {
        // The CSS handles visibility via :not(:placeholder-shown)
        // This is just for additional event handling if needed
      });

      // Handle Enter key for search
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          // Dispatch custom search event that other components can listen to
          const searchEvent = new CustomEvent('searchbar:search', {
            detail: { query: input.value },
            bubbles: true
          });
          searchBar.dispatchEvent(searchEvent);
        }
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchBars);
  } else {
    initSearchBars();
  }
})();
