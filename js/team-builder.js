/**
 * Team Builder - Drag and Drop Interface
 * Allows users to build a team of Avengers using HTML5 Drag and Drop API
 */

(function() {
  'use strict';

  // Configuration
  const MAX_TEAM_SIZE = 6;
  const STORAGE_KEY = 'avengers_team';

  // DOM Elements
  let currentTeamSlots;
  let availableAvengersGrid;
  let resetButton;
  let validationDiv;

  // State
  let draggedElement = null;
  let draggedFromSlot = null;

  /**
   * Initialize the team builder
   */
  function init() {
    // Get DOM elements
    currentTeamSlots = document.querySelectorAll('.team-builder__slot');
    availableAvengersGrid = document.getElementById('availableAvengers');
    resetButton = document.getElementById('resetTeam');
    validationDiv = document.getElementById('teamValidation');

    if (!currentTeamSlots.length || !availableAvengersGrid || !resetButton) {
      return; // Team builder not on this page
    }

    // Set up event listeners
    setupDragAndDrop();
    setupResetButton();

    // Load saved team
    loadTeamFromStorage();

    // Initial validation
    validateTeam();
  }

  /**
   * Set up drag and drop event listeners
   */
  function setupDragAndDrop() {
    // Available Avengers - dragstart
    const availableCards = availableAvengersGrid.querySelectorAll('.team-builder__card');
    availableCards.forEach(card => {
      card.addEventListener('dragstart', handleDragStart);
      card.addEventListener('dragend', handleDragEnd);
    });

    // Team Slots - dragover, drop
    currentTeamSlots.forEach(slot => {
      slot.addEventListener('dragover', handleDragOver);
      slot.addEventListener('drop', handleDrop);
      slot.addEventListener('dragleave', handleDragLeave);
    });

    // Available grid - dragover, drop (for returning cards)
    availableAvengersGrid.addEventListener('dragover', handleDragOver);
    availableAvengersGrid.addEventListener('drop', handleDropToAvailable);
  }

  /**
   * Handle drag start
   */
  function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('team-builder__card--dragging');

    // Check if dragging from a team slot
    const parentSlot = this.closest('.team-builder__slot');
    if (parentSlot) {
      draggedFromSlot = parentSlot;
    }

    // Set opacity for visual feedback
    setTimeout(() => {
      this.style.opacity = '0.5';
    }, 0);

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
  }

  /**
   * Handle drag end
   */
  function handleDragEnd(e) {
    this.classList.remove('team-builder__card--dragging');
    this.style.opacity = '1';

    // Remove drag-over styles from all slots
    currentTeamSlots.forEach(slot => {
      slot.classList.remove('team-builder__slot--drag-over');
    });

    draggedElement = null;
    draggedFromSlot = null;
  }

  /**
   * Handle drag over
   */
  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }

    e.dataTransfer.dropEffect = 'move';

    // Add visual feedback for team slots
    if (this.classList.contains('team-builder__slot')) {
      this.classList.add('team-builder__slot--drag-over');
    }

    return false;
  }

  /**
   * Handle drag leave
   */
  function handleDragLeave(e) {
    if (this.classList.contains('team-builder__slot')) {
      this.classList.remove('team-builder__slot--drag-over');
    }
  }

  /**
   * Handle drop on team slot
   */
  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    e.preventDefault();

    const targetSlot = this;
    targetSlot.classList.remove('team-builder__slot--drag-over');

    if (!draggedElement) {
      return false;
    }

    // Check if slot already has a card
    const existingCard = targetSlot.querySelector('.team-builder__card');

    if (existingCard) {
      // Swap cards
      if (draggedFromSlot) {
        // Moving from slot to slot - swap
        draggedFromSlot.appendChild(existingCard);
        targetSlot.appendChild(draggedElement);
        draggedFromSlot.classList.add('team-builder__slot--filled');
      } else {
        // Moving from available to filled slot - move existing back to available
        moveCardToAvailable(existingCard);
        targetSlot.appendChild(draggedElement);
      }
    } else {
      // Empty slot - just add the card
      targetSlot.appendChild(draggedElement);
    }

    // Update slot filled state
    targetSlot.classList.add('team-builder__slot--filled');

    // If card came from available, hide it there
    if (!draggedFromSlot) {
      hideCardInAvailable(draggedElement.dataset.id);
    }

    // If card came from a slot, mark that slot as empty
    if (draggedFromSlot && draggedFromSlot !== targetSlot) {
      draggedFromSlot.classList.remove('team-builder__slot--filled');
    }

    // Save team and validate
    saveTeamToStorage();
    validateTeam();

    return false;
  }

  /**
   * Handle drop back to available grid
   */
  function handleDropToAvailable(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    e.preventDefault();

    if (!draggedElement || !draggedFromSlot) {
      return false;
    }

    // Remove card from slot and show in available
    moveCardToAvailable(draggedElement);

    // Mark slot as empty
    draggedFromSlot.classList.remove('team-builder__slot--filled');

    // Save and validate
    saveTeamToStorage();
    validateTeam();

    return false;
  }

  /**
   * Move a card back to the available grid
   */
  function moveCardToAvailable(card) {
    const cardId = card.dataset.id;

    // Show the original card in available grid
    showCardInAvailable(cardId);

    // Remove the card from the slot
    card.remove();
  }

  /**
   * Hide card in available grid
   */
  function hideCardInAvailable(cardId) {
    const availableCard = availableAvengersGrid.querySelector(`[data-id="${cardId}"]`);
    if (availableCard) {
      availableCard.classList.add('team-builder__card--hidden');
    }
  }

  /**
   * Show card in available grid
   */
  function showCardInAvailable(cardId) {
    const availableCard = availableAvengersGrid.querySelector(`[data-id="${cardId}"]`);
    if (availableCard) {
      availableCard.classList.remove('team-builder__card--hidden');
    }
  }

  /**
   * Set up reset button
   */
  function setupResetButton() {
    resetButton.addEventListener('click', resetTeam);
  }

  /**
   * Reset the team
   */
  function resetTeam() {
    // Remove all cards from slots
    currentTeamSlots.forEach(slot => {
      const card = slot.querySelector('.team-builder__card');
      if (card) {
        const cardId = card.dataset.id;
        card.remove();
        showCardInAvailable(cardId);
        slot.classList.remove('team-builder__slot--filled');
      }
    });

    // Clear storage
    localStorage.removeItem(STORAGE_KEY);

    // Validate
    validateTeam();
  }

  /**
   * Validate team composition
   */
  function validateTeam() {
    const team = getCurrentTeam();
    const teamSize = team.length;

    // Clear validation message
    validationDiv.className = 'team-builder__validation';
    validationDiv.innerHTML = '';

    if (teamSize === 0) {
      return;
    }

    // Check team composition
    const roles = team.map(member => member.role);
    const uniqueRoles = [...new Set(roles)];

    // Check for balanced team (at least 3 different roles for full team)
    if (teamSize === MAX_TEAM_SIZE) {
      if (uniqueRoles.length < 3) {
        showValidation('warning', '⚠️ Warning: Your team lacks role diversity. Consider adding different role types for optimal balance.');
      } else if (uniqueRoles.length >= 4) {
        showValidation('success', '✅ Excellent! Your team has great role diversity and is ready for any mission.');
      } else {
        showValidation('success', '✅ Team assembled! You have decent role coverage.');
      }
    } else {
      showValidation('warning', `Team size: ${teamSize}/${MAX_TEAM_SIZE}. Add more members for a complete strike team.`);
    }
  }

  /**
   * Show validation message
   */
  function showValidation(type, message) {
    validationDiv.className = `team-builder__validation team-builder__validation--${type}`;
    validationDiv.innerHTML = message;
  }

  /**
   * Get current team
   */
  function getCurrentTeam() {
    const team = [];

    currentTeamSlots.forEach(slot => {
      const card = slot.querySelector('.team-builder__card');
      if (card) {
        team.push({
          id: card.dataset.id,
          role: card.dataset.role,
          name: card.querySelector('.team-builder__card-name').textContent
        });
      }
    });

    return team;
  }

  /**
   * Save team to localStorage
   */
  function saveTeamToStorage() {
    const team = getCurrentTeam();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
    } catch (e) {
      console.error('Failed to save team to localStorage:', e);
    }
  }

  /**
   * Load team from localStorage
   */
  function loadTeamFromStorage() {
    try {
      const savedTeam = localStorage.getItem(STORAGE_KEY);
      if (!savedTeam) {
        return;
      }

      const team = JSON.parse(savedTeam);

      // Place each team member in a slot
      team.forEach((member, index) => {
        if (index < MAX_TEAM_SIZE) {
          const slot = currentTeamSlots[index];
          const availableCard = availableAvengersGrid.querySelector(`[data-id="${member.id}"]`);

          if (availableCard && slot) {
            // Clone the card to the slot
            const cardClone = availableCard.cloneNode(true);

            // Add drag listeners to the cloned card
            cardClone.addEventListener('dragstart', handleDragStart);
            cardClone.addEventListener('dragend', handleDragEnd);

            // Add to slot
            slot.appendChild(cardClone);
            slot.classList.add('team-builder__slot--filled');

            // Hide in available
            hideCardInAvailable(member.id);
          }
        }
      });

      validateTeam();
    } catch (e) {
      console.error('Failed to load team from localStorage:', e);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
