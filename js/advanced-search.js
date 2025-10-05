/**
 * Advanced Search with Multi-Filter System
 * Implements comprehensive filtering with debounced search
 */

(function() {
  'use strict';

  // DOM Elements
  const searchInput = document.getElementById('searchInput');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const resultCount = document.getElementById('resultCount');
  const rosterCards = document.querySelectorAll('.roster__card');

  // Get all filter checkboxes
  const teamFilters = document.querySelectorAll('input[name="team"]');
  const powerFilters = document.querySelectorAll('input[name="power"]');
  const threatFilters = document.querySelectorAll('input[name="threat"]');
  const statusFilters = document.querySelectorAll('input[name="status"]');

  // Debounce timer
  let debounceTimer = null;
  const DEBOUNCE_DELAY = 300; // milliseconds

  /**
   * Get active filters from checkboxes
   */
  function getActiveFilters() {
    return {
      teams: Array.from(teamFilters)
        .filter(cb => cb.checked)
        .map(cb => cb.value),
      powers: Array.from(powerFilters)
        .filter(cb => cb.checked)
        .map(cb => cb.value),
      threats: Array.from(threatFilters)
        .filter(cb => cb.checked)
        .map(cb => cb.value),
      statuses: Array.from(statusFilters)
        .filter(cb => cb.checked)
        .map(cb => cb.value),
      searchText: searchInput.value.toLowerCase().trim()
    };
  }

  /**
   * Check if a card matches all active filters (AND logic)
   */
  function cardMatchesFilters(card, filters) {
    const cardData = {
      team: card.dataset.team,
      power: card.dataset.power,
      threat: card.dataset.threat,
      status: card.dataset.status,
      name: card.querySelector('.roster__card-name')?.textContent.toLowerCase() || '',
      codename: card.querySelector('.roster__card-codename')?.textContent.toLowerCase() || ''
    };

    // Search text filter
    if (filters.searchText) {
      const matchesSearch = cardData.name.includes(filters.searchText) ||
                           cardData.codename.includes(filters.searchText);
      if (!matchesSearch) return false;
    }

    // Team filter
    if (filters.teams.length > 0) {
      if (!filters.teams.includes(cardData.team)) return false;
    }

    // Power type filter
    if (filters.powers.length > 0) {
      if (!filters.powers.includes(cardData.power)) return false;
    }

    // Threat level filter
    if (filters.threats.length > 0) {
      if (!filters.threats.includes(cardData.threat)) return false;
    }

    // Status filter
    if (filters.statuses.length > 0) {
      if (!filters.statuses.includes(cardData.status)) return false;
    }

    return true;
  }

  /**
   * Apply filters to roster cards with animation
   */
  function applyFilters() {
    const filters = getActiveFilters();
    let visibleCount = 0;
    const totalCount = rosterCards.length;

    rosterCards.forEach(card => {
      const matches = cardMatchesFilters(card, filters);

      if (matches) {
        visibleCount++;
        // Fade in card
        card.classList.remove('filtered-out');
        card.classList.add('filtered-in');
        card.style.display = '';
        card.style.position = '';
      } else {
        // Fade out card
        card.classList.remove('filtered-in');
        card.classList.add('filtered-out');
        // Hide after animation
        setTimeout(() => {
          if (card.classList.contains('filtered-out')) {
            card.style.display = 'none';
          }
        }, 300);
      }
    });

    // Update result count
    updateResultCount(visibleCount, totalCount);
  }

  /**
   * Update the result count display
   */
  function updateResultCount(visible, total) {
    resultCount.textContent = `Showing ${visible} of ${total} Avengers`;

    // Add visual feedback
    resultCount.style.transform = 'scale(1.05)';
    setTimeout(() => {
      resultCount.style.transform = 'scale(1)';
    }, 200);
  }

  /**
   * Debounced filter application
   */
  function debouncedApplyFilters() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      applyFilters();
    }, DEBOUNCE_DELAY);
  }

  /**
   * Clear all filters
   */
  function clearAllFilters() {
    // Uncheck all checkboxes
    document.querySelectorAll('.search__checkbox input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });

    // Clear search input
    searchInput.value = '';

    // Apply filters (will show all cards)
    applyFilters();

    // Visual feedback
    clearFiltersBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      clearFiltersBtn.style.transform = 'scale(1)';
    }, 150);
  }

  /**
   * Initialize event listeners
   */
  function init() {
    // Search input with debouncing
    searchInput.addEventListener('input', debouncedApplyFilters);

    // Filter checkboxes
    const allCheckboxes = [
      ...teamFilters,
      ...powerFilters,
      ...threatFilters,
      ...statusFilters
    ];

    allCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', applyFilters);
    });

    // Clear filters button
    clearFiltersBtn.addEventListener('click', clearAllFilters);

    // Initialize with all cards visible
    rosterCards.forEach(card => {
      card.classList.add('filtered-in');
    });

    // Set initial count
    updateResultCount(rosterCards.length, rosterCards.length);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
