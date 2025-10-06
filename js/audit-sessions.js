/**
 * Audit Sessions Display
 * Loads and displays audit session data with modal integration
 */

let sessionModal;
let sessionsData = [];

async function loadAuditSessions() {
    try {
        const response = await fetch('./data/audit-sessions-sample.json');
        const data = await response.json();
        sessionsData = data.sessions || [];
        renderSessionsTable(sessionsData);
    } catch (error) {
        console.error('Error loading audit sessions:', error);
        const tbody = document.getElementById('audit-sessions-tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6">Error loading sessions data</td></tr>';
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

    // Refresh keyboard navigation
    if (window.auditTableKeyboard) {
        window.auditTableKeyboard.refresh();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    sessionModal = new SessionDetailModal();
    loadAuditSessions();
});
