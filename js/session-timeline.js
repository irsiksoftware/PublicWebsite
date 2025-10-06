/**
 * Session Timeline Component
 * Loads and displays agent audit sessions in a timeline format
 */

(function() {
    'use strict';

    const TIMELINE_CONTAINER_ID = 'timeline-container';
    const DATA_SOURCE = './data/audit-sessions-sample.json';

    /**
     * Format timestamp HH:MM:SS to HH:MM AM/PM
     */
    function formatTime(timestamp) {
        if (!timestamp || timestamp.length !== 6) return timestamp;

        const hours = parseInt(timestamp.substring(0, 2), 10);
        const minutes = timestamp.substring(2, 4);
        const seconds = timestamp.substring(4, 6);

        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;

        return `${displayHours}:${minutes}:${seconds} ${period}`;
    }

    /**
     * Format date YYYY-MM-DD to readable format
     */
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Calculate duration in minutes from timeout
     */
    function formatDuration(timeoutMinutes) {
        if (!timeoutMinutes) return 'N/A';
        return `${timeoutMinutes} min`;
    }

    /**
     * Determine productivity status class and label
     */
    function getProductivityInfo(session) {
        if (session.is_timeout) {
            return { class: 'timeout', label: 'Timeout' };
        } else if (session.is_productive) {
            return { class: 'productive', label: 'Productive' };
        } else {
            return { class: 'unproductive', label: 'Unproductive' };
        }
    }

    /**
     * Create timeline item HTML
     */
    function createTimelineItem(session) {
        const productivityInfo = getProductivityInfo(session);
        const time = formatTime(session.timestamp);
        const duration = formatDuration(session.timeout_minutes);

        const item = document.createElement('div');
        item.className = `timeline-item ${productivityInfo.class}`;

        item.innerHTML = `
            <div class="timeline-content">
                <div class="timeline-header">
                    <span class="timeline-role">${session.role}</span>
                    <span class="timeline-time">${time}</span>
                </div>
                <div class="timeline-info">
                    <span class="timeline-duration">${duration}</span>
                    <span class="timeline-status ${productivityInfo.class}">${productivityInfo.label}</span>
                </div>
            </div>
        `;

        return item;
    }

    /**
     * Create date marker HTML
     */
    function createDateMarker(dateStr) {
        const marker = document.createElement('div');
        marker.className = 'timeline-date';
        marker.textContent = formatDate(dateStr);
        return marker;
    }

    /**
     * Group sessions by date
     */
    function groupSessionsByDate(sessions) {
        const grouped = {};

        sessions.forEach(session => {
            if (!grouped[session.date]) {
                grouped[session.date] = [];
            }
            grouped[session.date].push(session);
        });

        return grouped;
    }

    /**
     * Render timeline
     */
    function renderTimeline(data) {
        const container = document.getElementById(TIMELINE_CONTAINER_ID);

        if (!container) {
            console.error(`Timeline container with id "${TIMELINE_CONTAINER_ID}" not found`);
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        if (!data.sessions || data.sessions.length === 0) {
            container.innerHTML = '<p>No audit sessions available.</p>';
            return;
        }

        // Group sessions by date
        const groupedSessions = groupSessionsByDate(data.sessions);

        // Sort dates in descending order (most recent first)
        const sortedDates = Object.keys(groupedSessions).sort((a, b) => b.localeCompare(a));

        // Render each date group
        sortedDates.forEach(date => {
            // Add date marker
            container.appendChild(createDateMarker(date));

            // Sort sessions within date by timestamp (most recent first)
            const sessions = groupedSessions[date].sort((a, b) =>
                b.timestamp.localeCompare(a.timestamp)
            );

            // Add session items
            sessions.forEach(session => {
                container.appendChild(createTimelineItem(session));
            });
        });
    }

    /**
     * Load timeline data
     */
    async function loadTimeline() {
        try {
            const response = await fetch(DATA_SOURCE);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            renderTimeline(data);
        } catch (error) {
            console.error('Error loading timeline data:', error);

            const container = document.getElementById(TIMELINE_CONTAINER_ID);
            if (container) {
                container.innerHTML = `<p>Error loading audit sessions: ${error.message}</p>`;
            }
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadTimeline);
    } else {
        loadTimeline();
    }
})();
