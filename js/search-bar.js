/**
 * Search Bar Component with Clear Functionality
 * Implements Issue #99 requirements
 */

document.addEventListener('DOMContentLoaded', () => {
  // Get all search bars on the page
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

    // Optional: Clear on Escape key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && input.value) {
        e.preventDefault();
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });
});
