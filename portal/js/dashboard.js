// Dashboard Module
(function() {
    'use strict';

    // Mock data for demonstration
    const mockProjects = [
        {
            id: 1,
            name: 'Website Redesign',
            status: 'active',
            progress: 75,
            deadline: '2025-11-15'
        },
        {
            id: 2,
            name: 'Mobile App Development',
            status: 'active',
            progress: 45,
            deadline: '2025-12-01'
        },
        {
            id: 3,
            name: 'API Integration',
            status: 'completed',
            progress: 100,
            deadline: '2025-09-30'
        }
    ];

    const mockActivity = [
        {
            id: 1,
            type: 'document',
            message: 'New invoice uploaded: INV-2025-045',
            timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: 2,
            type: 'ticket',
            message: 'Support ticket #127 was resolved',
            timestamp: new Date(Date.now() - 7200000).toISOString()
        },
        {
            id: 3,
            type: 'project',
            message: 'Website Redesign updated to 75% complete',
            timestamp: new Date(Date.now() - 14400000).toISOString()
        }
    ];

    // Load projects
    function loadProjects() {
        const projectList = document.getElementById('projectList');
        if (!projectList) return;

        setTimeout(() => {
            projectList.innerHTML = '';

            mockProjects.forEach(project => {
                const statusClass = 'status-' + project.status;
                const statusText = project.status.charAt(0).toUpperCase() + project.status.slice(1);

                const projectItem = document.createElement('div');
                projectItem.className = 'project-item';
                projectItem.innerHTML = `
                    <h3>${project.name}</h3>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                        <span class="project-status-badge ${statusClass}">${statusText}</span>
                        <span style="font-size: 0.9rem; color: var(--text-secondary);">${project.progress}% complete</span>
                    </div>
                    <div style="margin-top: 0.75rem; font-size: 0.85rem; color: var(--text-secondary);">
                        Deadline: ${new Date(project.deadline).toLocaleDateString()}
                    </div>
                `;
                projectList.appendChild(projectItem);
            });
        }, 500);
    }

    // Load activity
    function loadActivity() {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;

        setTimeout(() => {
            activityList.innerHTML = '';

            mockActivity.forEach(activity => {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';

                const timeAgo = formatTimeAgo(new Date(activity.timestamp));

                activityItem.innerHTML = `
                    <h3>${activity.message}</h3>
                    <div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
                        ${timeAgo}
                    </div>
                `;
                activityList.appendChild(activityItem);
            });
        }, 600);
    }

    // Update stats
    function updateStats() {
        setTimeout(() => {
            const activeProjects = mockProjects.filter(p => p.status === 'active').length;
            const openTickets = 3; // Mock value
            const documents = 12; // Mock value

            document.getElementById('activeProjects').textContent = activeProjects;
            document.getElementById('openTickets').textContent = openTickets;
            document.getElementById('documents').textContent = documents;
        }, 400);
    }

    // Format timestamp to relative time
    function formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
        if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';

        return date.toLocaleDateString();
    }

    // Initialize dashboard
    document.addEventListener('DOMContentLoaded', function() {
        loadProjects();
        loadActivity();
        updateStats();
    });
})();
