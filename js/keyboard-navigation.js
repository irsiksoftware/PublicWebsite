/**
 * Keyboard Navigation for Tables
 * Implements tab navigation, arrow key navigation, and Enter key activation
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeTableKeyboardNavigation();
});

function initializeTableKeyboardNavigation() {
    // Add keyboard navigation to all tables
    const tables = document.querySelectorAll('table');

    tables.forEach(table => {
        makeTableNavigable(table);
    });

    // Re-initialize when tables are dynamically updated
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'TABLE') {
                            makeTableNavigable(node);
                        } else if (node.querySelector) {
                            const tables = node.querySelectorAll('table');
                            tables.forEach(makeTableNavigable);
                        }
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function makeTableNavigable(table) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    // Make table rows focusable
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        // Skip error/loading rows
        if (row.querySelector('td[colspan]')) return;

        row.setAttribute('tabindex', '0');
        row.setAttribute('role', 'button');
        row.classList.add('keyboard-navigable');

        // Handle Enter key for row details
        row.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }

            // Arrow key navigation
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextRow = getNextNavigableRow(this);
                if (nextRow) nextRow.focus();
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevRow = getPreviousNavigableRow(this);
                if (prevRow) prevRow.focus();
            }

            // Arrow left/right for cell navigation
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                handleCellNavigation(e, this);
            }
        });

        // Add visual feedback on focus
        row.addEventListener('focus', function() {
            this.classList.add('keyboard-focused');
        });

        row.addEventListener('blur', function() {
            this.classList.remove('keyboard-focused');
        });
    });
}

function getNextNavigableRow(currentRow) {
    let next = currentRow.nextElementSibling;
    while (next) {
        if (next.classList.contains('keyboard-navigable')) {
            return next;
        }
        next = next.nextElementSibling;
    }
    return null;
}

function getPreviousNavigableRow(currentRow) {
    let prev = currentRow.previousElementSibling;
    while (prev) {
        if (prev.classList.contains('keyboard-navigable')) {
            return prev;
        }
        prev = prev.previousElementSibling;
    }
    return null;
}

function handleCellNavigation(e, row) {
    e.preventDefault();

    const cells = Array.from(row.querySelectorAll('td'));
    const currentCell = document.activeElement.closest('td');

    if (!currentCell) {
        // Focus first cell if no cell is focused
        if (cells[0]) {
            cells[0].setAttribute('tabindex', '0');
            cells[0].focus();
        }
        return;
    }

    const currentIndex = cells.indexOf(currentCell);

    if (e.key === 'ArrowRight' && currentIndex < cells.length - 1) {
        const nextCell = cells[currentIndex + 1];
        nextCell.setAttribute('tabindex', '0');
        nextCell.focus();
        currentCell.setAttribute('tabindex', '-1');
    }

    if (e.key === 'ArrowLeft' && currentIndex > 0) {
        const prevCell = cells[currentIndex - 1];
        prevCell.setAttribute('tabindex', '0');
        prevCell.focus();
        currentCell.setAttribute('tabindex', '-1');
    }
}
