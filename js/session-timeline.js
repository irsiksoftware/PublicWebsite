async function loadSessionTimeline() {
    const container = document.getElementById('timeline-container');

    try {
        const response = await fetch('./data/audit-sessions-sample.json');
        if (!response.ok) throw new Error('Failed to load audit sessions data');

        const data = await response.json();
        const sessions = data.sessions || [];

        if (sessions.length === 0) {
            container.innerHTML = '<div class="timeline-loading">No sessions available</div>';
            return;
        }

        // Group sessions by date
        const groupedByDate = {};
        sessions.forEach(session => {
            if (!groupedByDate[session.date]) {
                groupedByDate[session.date] = [];
            }
            groupedByDate[session.date].push(session);
        });

        // Sort dates in descending order
        const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

        // Build timeline HTML
        let timelineHTML = '<div class="timeline">';

        sortedDates.forEach(date => {
            const dateSessions = groupedByDate[date];

            // Add date marker
            timelineHTML += `
                <div class="date-group">
                    <div class="date-marker">
                        <h2>${formatDate(date)}</h2>
                    </div>
            `;

            // Sort sessions by timestamp within the date
            dateSessions.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

            // Add session items
            dateSessions.forEach(session => {
                const statusClass = getStatusClass(session);
                const statusText = getStatusText(session);
                const duration = session.size_bytes ? `${(session.size_bytes / 1024).toFixed(2)} KB` : 'N/A';
                const time = formatTime(session.timestamp);

                timelineHTML += `
                    <div class="session-item">
                        <div class="session-card">
                            <div class="session-time">${time}</div>
                            <div class="session-role">${session.role}</div>
                            <div class="session-duration">Duration: ${duration}</div>
                            <span class="session-status ${statusClass}">${statusText}</span>
                        </div>
                    </div>
                `;
            });

            timelineHTML += '</div>'; // Close date-group
        });

        timelineHTML += '</div>'; // Close timeline
        container.innerHTML = timelineHTML;

    } catch (error) {
        console.error('Error loading session timeline:', error);
        container.innerHTML = '<div class="timeline-loading">Error loading sessions</div>';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(timestamp) {
    // Format timestamp like "072501" to "07:25:01"
    if (timestamp.length === 6) {
        return `${timestamp.slice(0, 2)}:${timestamp.slice(2, 4)}:${timestamp.slice(4, 6)}`;
    }
    return timestamp;
}

function getStatusClass(session) {
    if (session.is_timeout) return 'status-timeout';
    if (session.has_error) return 'status-error';
    if (session.is_productive) return 'status-productive';
    return 'status-unproductive';
}

function getStatusText(session) {
    if (session.is_timeout) return 'Timeout';
    if (session.has_error) return 'Error';
    if (session.is_productive) return 'Productive';
    return 'Unproductive';
}

// Load timeline when page loads
document.addEventListener('DOMContentLoaded', loadSessionTimeline);
