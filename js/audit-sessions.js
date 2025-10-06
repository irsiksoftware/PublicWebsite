/**
 * Audit Sessions Display
 * Loads and displays audit session data with modal integration
 */

let sessionModal;
let sessionsData = [];

async function loadAuditSessions() {
    const tbody = document.getElementById('audit-sessions-tbody');

    // Show skeleton loading state
    if (tbody) {
        showTableSkeleton(tbody, 6);
    }

    try {
        const response = await fetch('./data/audit-sessions-sample.json');
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Resource not found: ./data/audit-sessions-sample.json');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        sessionsData = data.sessions || [];
        renderSessionsTable(sessionsData);
    } catch (error) {
        console.error('Error loading audit sessions:', error);
        const tbody = document.getElementById('audit-sessions-tbody');
        if (tbody) {
            tbody.innerHTML = '';

            const errorRow = document.createElement('tr');
            const errorCell = document.createElement('td');
            errorCell.colSpan = 6;
            errorCell.style.padding = '20px';

            const errorContainer = document.createElement('div');
            errorContainer.style.cssText = `
                padding: 20px;
                background-color: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 4px;
                color: #856404;
            `;

            const title = document.createElement('h4');
            title.textContent = 'Data unavailable';
            title.style.cssText = 'margin: 0 0 10px 0; font-weight: bold;';

            const message = document.createElement('p');
            message.style.cssText = 'margin: 0 0 10px 0;';

            if (error.message.includes('not found') || error.message.includes('404')) {
                message.textContent = 'The data file "audit-sessions-sample.json" is missing. Please run the aggregation tool to generate the required data files.';
            } else {
                message.textContent = `Error loading audit sessions: ${error.message}`;
            }

            const retryButton = document.createElement('button');
            retryButton.textContent = 'Retry';
            retryButton.style.cssText = `
                padding: 8px 16px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            `;
            retryButton.addEventListener('click', () => loadAuditSessions());
            retryButton.addEventListener('mouseenter', () => {
                retryButton.style.backgroundColor = '#0056b3';
            });
            retryButton.addEventListener('mouseleave', () => {
                retryButton.style.backgroundColor = '#007bff';
            });

            errorContainer.appendChild(title);
            errorContainer.appendChild(message);
            errorContainer.appendChild(retryButton);
            errorCell.appendChild(errorContainer);
            errorRow.appendChild(errorCell);
            tbody.appendChild(errorRow);
        }
    }
}

function renderSessionsTable(sessions) {
    const tbody = document.getElementById('audit-sessions-tbody');
    if (!tbody) return;

    if (!sessions || sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No sessions found</td></tr>';
        return;
    }

    tbody.innerHTML = sessions.slice(0, 20).map(session => `
        <tr class="session-row" data-session-index="${sessionsData.indexOf(session)}">
            <td>${session.timestamp || 'N/A'}</td>
            <td>${session.role || 'N/A'}</td>
            <td title="${session.file || ''}">${truncateText(session.file || 'N/A', 50)}</td>
            <td>${session.has_error ? '✗' : '✓'}</td>
            <td>${session.is_timeout ? '✗' : '✓'}</td>
            <td>${session.is_productive ? '✓' : '✗'}</td>
        </tr>
    `).join('');

    attachSessionClickHandlers();
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function attachSessionClickHandlers() {
    const rows = document.querySelectorAll('.session-row');
    rows.forEach(row => {
        row.addEventListener('click', function() {
            const sessionIndex = parseInt(this.dataset.sessionIndex);
            const session = sessionsData[sessionIndex];
            if (session && sessionModal) {
                sessionModal.open(session);
            }
        });
    });
}

function showTableSkeleton(tbody, columnCount) {
    tbody.innerHTML = '';

    // Create 5 skeleton rows
    for (let i = 0; i < 5; i++) {
        const row = document.createElement('tr');
        row.className = 'skeleton-table-row';

        for (let j = 0; j < columnCount; j++) {
            const cell = document.createElement('td');
            const skeletonDiv = document.createElement('div');
            skeletonDiv.className = 'skeleton skeleton-table-cell skeleton-table-cell-medium';
            cell.appendChild(skeletonDiv);
            row.appendChild(cell);
        }

        tbody.appendChild(row);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    sessionModal = new SessionDetailModal();
    loadAuditSessions();
});
