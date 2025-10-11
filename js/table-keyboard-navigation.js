/**
 * @fileoverview Table Keyboard Navigation Component
 * Implements accessible keyboard navigation for all tables in the application.
 * Supports arrow keys, Home/End navigation, and Enter/Space for row selection.
 * Automatically observes DOM for dynamically added tables.
 *
 * @module table-keyboard-navigation
 *
 * @example
 * // Auto-initializes on DOMContentLoaded and dynamically observes new tables
 * // All <table> elements automatically get keyboard navigation
 * // Arrow keys navigate, Enter/Space activate rows
 */

/**
 * Initializes keyboard navigation for existing tables
 * @function
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeTableKeyboardNavigation();
});

/**
 * Initializes keyboard navigation for all tables on page
 * @function
 */
function initializeTableKeyboardNavigation() {
    const tables = document.querySelectorAll('table');

    tables.forEach(table => {
        makeTableNavigable(table);
    });
}

/**
 * Makes a table navigable with keyboard controls
 * @function
 * @param {HTMLTableElement} table - Table element to enhance
 */
function makeTableNavigable(table) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    // Make table rows focusable and add keyboard event listeners
    const rows = tbody.querySelectorAll('tr');

    rows.forEach((row, index) => {
        // Make row focusable
        row.setAttribute('tabindex', '0');
        row.setAttribute('role', 'button');

        // Add keyboard event handler
        row.addEventListener('keydown', function(event) {
            handleTableKeyboardNavigation(event, table, row, index);
        });

        // Add click handler for Enter key consistency
        row.addEventListener('click', function() {
            // Trigger any existing click handlers
            row.dispatchEvent(new CustomEvent('rowSelect', {
                detail: { row: row, index: index }
            }));
        });
    });
}

/**
 * Handles keyboard events for table navigation
 * @function
 * @param {KeyboardEvent} event - Keyboard event
 * @param {HTMLTableElement} table - Table element
 * @param {HTMLTableRowElement} currentRow - Currently focused row
 * @param {number} currentIndex - Index of current row
 */
function handleTableKeyboardNavigation(event, table, currentRow, currentIndex) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const cells = Array.from(currentRow.querySelectorAll('td, th'));

    switch(event.key) {
    case 'Enter':
    case ' ':
        // Activate row (trigger click)
        event.preventDefault();
        currentRow.click();
        break;

    case 'ArrowUp':
        event.preventDefault();
        if (currentIndex > 0) {
            rows[currentIndex - 1].focus();
        }
        break;

    case 'ArrowDown':
        event.preventDefault();
        if (currentIndex < rows.length - 1) {
            rows[currentIndex + 1].focus();
        }
        break;

    case 'ArrowLeft':
        event.preventDefault();
        navigateCells(cells, currentRow, -1);
        break;

    case 'ArrowRight':
        event.preventDefault();
        navigateCells(cells, currentRow, 1);
        break;

    case 'Home':
        event.preventDefault();
        if (event.ctrlKey) {
            // Go to first row
            rows[0].focus();
        } else {
            // Go to first cell in row
            cells[0]?.focus();
        }
        break;

    case 'End':
        event.preventDefault();
        if (event.ctrlKey) {
            // Go to last row
            rows[rows.length - 1].focus();
        } else {
            // Go to last cell in row
            cells[cells.length - 1]?.focus();
        }
        break;
    }
}

function navigateCells(cells, row, direction) {
    // Get currently focused element
    const activeElement = document.activeElement;

    // Check if we're in a cell or on the row
    if (activeElement === row || !row.contains(activeElement)) {
        // Focus first or last cell depending on direction
        if (direction > 0 && cells.length > 0) {
            cells[0].setAttribute('tabindex', '0');
            cells[0].focus();
        } else if (direction < 0 && cells.length > 0) {
            cells[cells.length - 1].setAttribute('tabindex', '0');
            cells[cells.length - 1].focus();
        }
        return;
    }

    // Find current cell index
    const currentCellIndex = cells.findIndex(cell => cell === activeElement || cell.contains(activeElement));

    if (currentCellIndex === -1) return;

    // Calculate next cell index
    const nextIndex = currentCellIndex + direction;

    if (nextIndex >= 0 && nextIndex < cells.length) {
        cells[nextIndex].setAttribute('tabindex', '0');
        cells[nextIndex].focus();

        // Remove tabindex from previous cell
        cells[currentCellIndex].setAttribute('tabindex', '-1');
    } else {
        // Return focus to row
        row.focus();
        cells.forEach(cell => cell.setAttribute('tabindex', '-1'));
    }
}

// Re-initialize navigation when tables are dynamically updated
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    if (node.tagName === 'TABLE') {
                        makeTableNavigable(node);
                    } else {
                        const tables = node.querySelectorAll?.('table');
                        tables?.forEach(table => makeTableNavigable(table));
                    }
                }
            });
        }
    });
});

// Observe the document body for table additions
observer.observe(document.body, {
    childList: true,
    subtree: true
});
