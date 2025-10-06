document.addEventListener('DOMContentLoaded', async () => {
    const sessionsContainer = document.getElementById('audit-sessions-container');

    async function loadAuditSessions() {
        try {
            const response = await fetch('./data/audit-sessions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            renderSessions(data.sessions.slice(0, 50));
        } catch (error) {
            console.error('Error loading audit sessions:', error);
            sessionsContainer.innerHTML = '<p>Error loading audit session data</p>';
        }
    }

    function renderSessions(sessions) {
        if (!sessions || sessions.length === 0) {
            sessionsContainer.innerHTML = '<p>No session data available</p>';
            return;
        }

        sessionsContainer.innerHTML = sessions.map(session => {
            const timestamp = new Date(`${session.date}T${session.timestamp.slice(0,2)}:${session.timestamp.slice(2,4)}:${session.timestamp.slice(4,6)}`).toLocaleString();
            const badges = renderSignalBadges(session.signals);
            const productiveClass = session.is_productive ? '' : ' unproductive';

            return `
                <div class="session-card${productiveClass}">
                    <div class="session-header">
                        <span class="session-role">${escapeHtml(session.role)}</span>
                        <span class="session-timestamp">${timestamp}</span>
                    </div>
                    <div class="signal-badges">
                        ${badges}
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderSignalBadges(signals) {
        const signalConfig = [
            { key: 'pr_created', icon: '📝', label: 'PR Created' },
            { key: 'issue_claimed', icon: '🔨', label: 'Issue Claimed' },
            { key: 'pr_merged', icon: '✅', label: 'PR Merged' },
            { key: 'discord_call', icon: '💬', label: 'Discord Call' },
            { key: 'work_activity', icon: '🔧', label: 'Work Activity' }
        ];

        const activeBadges = signalConfig
            .filter(config => signals[config.key])
            .map(config => `<span class="signal-badge" title="${config.label}">${config.icon}</span>`)
            .join('');

        return activeBadges || '<span class="signal-badge inactive">No activity</span>';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    await loadAuditSessions();
});
