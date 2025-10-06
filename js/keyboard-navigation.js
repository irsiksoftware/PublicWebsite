/**
 * Keyboard Navigation for Tables
 * Provides keyboard accessibility for table elements
 */

class TableKeyboardNavigation {
    constructor(tableId) {
        this.table = document.getElementById(tableId);
        if (!this.table) return;

        this.tbody = this.table.querySelector('tbody');
        this.currentRowIndex = -1;
        this.currentCellIndex = -1;
        this.navigationMode = 'row'; // 'row' or 'cell'

        this.init();
    }

    init() {
        this.makeTableAccessible();
        this.attachKeyboardHandlers();
    }

    makeTableAccessible() {
        // Make tbody focusable
        if (this.tbody) {
            this.tbody.setAttribute('tabindex', '0');
            this.tbody.setAttribute('role', 'grid');
            this.tbody.setAttribute('aria-label', 'Data table');
        }

        // Add role attributes to cells
        this.updateRowAttributes();
    }

    updateRowAttributes() {
        const rows = this.getRows();
        rows.forEach((row, index) => {
            row.setAttribute('role', 'row');
            row.setAttribute('tabindex', '-1');
            row.setAttribute('data-row-index', index);

            const cells = row.querySelectorAll('td');
            cells.forEach((cell, cellIndex) => {
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('data-cell-index', cellIndex);
            });
        });
    }

    getRows() {
        return Array.from(this.tbody?.querySelectorAll('tr') || []);
    }

    attachKeyboardHandlers() {
        if (!this.tbody) return;

        this.tbody.addEventListener('keydown', (e) => {
            const rows = this.getRows();
            if (rows.length === 0) return;

            switch(e.key) {
                case 'Tab':
                    this.handleTabNavigation(e, rows);
                    break;
                case 'Enter':
                    this.handleEnterKey(e, rows);
                    break;
                case 'ArrowUp':
                case 'ArrowDown':
                    this.handleArrowUpDown(e, rows);
                    break;
                case 'ArrowLeft':
                case 'ArrowRight':
                    this.handleArrowLeftRight(e, rows);
                    break;
                case 'Home':
                    this.handleHome(e, rows);
                    break;
                case 'End':
                    this.handleEnd(e, rows);
                    break;
                case 'Escape':
                    this.handleEscape(e);
                    break;
            }
        });

        // Focus on first row when tbody gets focus
        this.tbody.addEventListener('focus', () => {
            if (this.currentRowIndex === -1) {
                this.focusRow(0);
            }
        });

        // Handle row clicks
        this.tbody.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (row) {
                const rowIndex = parseInt(row.getAttribute('data-row-index'));
                this.focusRow(rowIndex);
            }
        });
    }

    handleTabNavigation(e, rows) {
        e.preventDefault();

        if (this.navigationMode === 'cell' && this.currentCellIndex !== -1) {
            // In cell navigation mode, Tab moves to next cell
            this.moveToNextCell(e.shiftKey);
        } else {
            // In row navigation mode, Tab moves to next row
            if (e.shiftKey) {
                this.moveToPreviousRow(rows);
            } else {
                this.moveToNextRow(rows);
            }
        }
    }

    handleEnterKey(e, rows) {
        e.preventDefault();

        const row = rows[this.currentRowIndex];
        if (!row) return;

        // If row has session-row class, trigger click for modal
        if (row.classList.contains('session-row')) {
            row.click();
        } else {
            // Toggle cell navigation mode
            if (this.navigationMode === 'row') {
                this.navigationMode = 'cell';
                this.currentCellIndex = 0;
                this.focusCell(this.currentRowIndex, this.currentCellIndex);
            } else {
                this.navigationMode = 'row';
                this.currentCellIndex = -1;
                this.focusRow(this.currentRowIndex);
            }
        }
    }

    handleArrowUpDown(e, rows) {
        e.preventDefault();

        if (this.navigationMode === 'cell') {
            // Arrow up/down in cell mode moves between rows while keeping cell index
            if (e.key === 'ArrowUp' && this.currentRowIndex > 0) {
                this.focusCell(this.currentRowIndex - 1, this.currentCellIndex);
            } else if (e.key === 'ArrowDown' && this.currentRowIndex < rows.length - 1) {
                this.focusCell(this.currentRowIndex + 1, this.currentCellIndex);
            }
        } else {
            // Arrow up/down in row mode moves between rows
            if (e.key === 'ArrowUp') {
                this.moveToPreviousRow(rows);
            } else {
                this.moveToNextRow(rows);
            }
        }
    }

    handleArrowLeftRight(e, rows) {
        if (this.navigationMode !== 'cell') {
            // Enter cell navigation mode
            this.navigationMode = 'cell';
            this.currentCellIndex = e.key === 'ArrowLeft' ? this.getCellCount() - 1 : 0;
            this.focusCell(this.currentRowIndex, this.currentCellIndex);
            e.preventDefault();
            return;
        }

        e.preventDefault();

        if (e.key === 'ArrowLeft' && this.currentCellIndex > 0) {
            this.focusCell(this.currentRowIndex, this.currentCellIndex - 1);
        } else if (e.key === 'ArrowRight' && this.currentCellIndex < this.getCellCount() - 1) {
            this.focusCell(this.currentRowIndex, this.currentCellIndex + 1);
        }
    }

    handleHome(e, rows) {
        e.preventDefault();

        if (this.navigationMode === 'cell' && !e.ctrlKey) {
            // Home in cell mode goes to first cell in row
            this.focusCell(this.currentRowIndex, 0);
        } else if (e.ctrlKey) {
            // Ctrl+Home goes to first row, first cell
            this.focusRow(0);
        }
    }

    handleEnd(e, rows) {
        e.preventDefault();

        if (this.navigationMode === 'cell' && !e.ctrlKey) {
            // End in cell mode goes to last cell in row
            this.focusCell(this.currentRowIndex, this.getCellCount() - 1);
        } else if (e.ctrlKey) {
            // Ctrl+End goes to last row
            this.focusRow(rows.length - 1);
        }
    }

    handleEscape(e) {
        if (this.navigationMode === 'cell') {
            e.preventDefault();
            this.navigationMode = 'row';
            this.currentCellIndex = -1;
            this.focusRow(this.currentRowIndex);
        }
    }

    moveToNextRow(rows) {
        const nextIndex = Math.min(this.currentRowIndex + 1, rows.length - 1);
        this.focusRow(nextIndex);
    }

    moveToPreviousRow(rows) {
        const prevIndex = Math.max(this.currentRowIndex - 1, 0);
        this.focusRow(prevIndex);
    }

    moveToNextCell(reverse = false) {
        const cellCount = this.getCellCount();
        const rows = this.getRows();

        if (reverse) {
            if (this.currentCellIndex > 0) {
                this.focusCell(this.currentRowIndex, this.currentCellIndex - 1);
            } else if (this.currentRowIndex > 0) {
                this.focusCell(this.currentRowIndex - 1, cellCount - 1);
            }
        } else {
            if (this.currentCellIndex < cellCount - 1) {
                this.focusCell(this.currentRowIndex, this.currentCellIndex + 1);
            } else if (this.currentRowIndex < rows.length - 1) {
                this.focusCell(this.currentRowIndex + 1, 0);
            }
        }
    }

    focusRow(rowIndex) {
        const rows = this.getRows();
        if (rowIndex < 0 || rowIndex >= rows.length) return;

        // Remove focus from all rows
        rows.forEach(row => {
            row.classList.remove('keyboard-focus');
            row.setAttribute('tabindex', '-1');
        });

        // Focus the target row
        const targetRow = rows[rowIndex];
        targetRow.classList.add('keyboard-focus');
        targetRow.setAttribute('tabindex', '0');
        targetRow.focus();

        this.currentRowIndex = rowIndex;
        this.navigationMode = 'row';

        // Ensure row is visible
        targetRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    focusCell(rowIndex, cellIndex) {
        const rows = this.getRows();
        if (rowIndex < 0 || rowIndex >= rows.length) return;

        const row = rows[rowIndex];
        const cells = row.querySelectorAll('td');

        if (cellIndex < 0 || cellIndex >= cells.length) return;

        // Remove focus from all rows and cells
        rows.forEach(r => {
            r.classList.remove('keyboard-focus');
            r.querySelectorAll('td').forEach(c => c.classList.remove('keyboard-focus'));
        });

        // Focus the target cell
        const targetCell = cells[cellIndex];
        row.classList.add('keyboard-focus');
        targetCell.classList.add('keyboard-focus');
        targetCell.setAttribute('tabindex', '0');
        targetCell.focus();

        this.currentRowIndex = rowIndex;
        this.currentCellIndex = cellIndex;
        this.navigationMode = 'cell';

        // Ensure cell is visible
        targetCell.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });

        // Reset tabindex after focus
        setTimeout(() => {
            targetCell.setAttribute('tabindex', '-1');
        }, 0);
    }

    getCellCount() {
        const rows = this.getRows();
        if (rows.length === 0) return 0;
        return rows[0].querySelectorAll('td').length;
    }

    refresh() {
        // Call this when table content is updated
        this.updateRowAttributes();
        if (this.currentRowIndex >= this.getRows().length) {
            this.currentRowIndex = -1;
            this.currentCellIndex = -1;
        }
    }
}

// Initialize keyboard navigation for both tables
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for tables to be populated
    setTimeout(() => {
        window.spyTableKeyboard = new TableKeyboardNavigation('spy-activity-table');
        window.auditTableKeyboard = new TableKeyboardNavigation('audit-sessions-table');
    }, 100);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TableKeyboardNavigation;
}
