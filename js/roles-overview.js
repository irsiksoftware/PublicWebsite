// Roles Overview Grid Component

// Role data with icons, descriptions, and gradients
const roles = [
    {
        name: 'Orchestrator',
        icon: '🎭',
        agentCount: 1,
        description: 'Coordinates team activities and delegates tasks across all agents.',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
        name: 'Implementer',
        icon: '⚡',
        agentCount: 8,
        description: 'Executes development tasks and implements features according to specifications.',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
        name: 'Reviewer',
        icon: '🔍',
        agentCount: 3,
        description: 'Reviews code quality, identifies issues, and ensures adherence to standards.',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
        name: 'Fixer',
        icon: '🔧',
        agentCount: 5,
        description: 'Resolves bugs and technical issues identified during development and testing.',
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
        name: 'Manager',
        icon: '📊',
        agentCount: 2,
        description: 'Oversees project progress, resource allocation, and team performance metrics.',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
        name: 'Tester',
        icon: '🧪',
        agentCount: 4,
        description: 'Conducts thorough testing to ensure functionality and quality of deliverables.',
        gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    }
];

// Initialize the component
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('roles-overview-grid');
    if (!container) return;

    // Show skeleton loading state
    showRolesSkeleton(container);

    // Simulate loading delay to show skeleton
    setTimeout(() => {
        // Clear skeleton
        container.innerHTML = '';
        container.classList.remove('loading');

        // Create and append role cards
        roles.forEach(role => {
            const card = createRoleCard(role);
            container.appendChild(card);
        });
    }, 800);
});

function createRoleCard(role) {
    const card = document.createElement('div');
    card.className = 'role-card';
    card.style.setProperty('--role-gradient', role.gradient);

    card.innerHTML = `
        <div class="role-card-icon">${role.icon}</div>
        <h3 class="role-card-name">${escapeHtml(role.name)}</h3>
        <div class="role-card-count">${role.agentCount} ${role.agentCount === 1 ? 'Agent' : 'Agents'}</div>
        <p class="role-card-description">${escapeHtml(role.description)}</p>
        <a href="https://www.anthropic.com/research/building-effective-agents"
           target="_blank"
           rel="noopener noreferrer"
           class="role-card-learn-more">
            Learn More <span aria-hidden="true">↗</span>
        </a>
    `;

    return card;
}

// Utility function to escape HTML and prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showRolesSkeleton(container) {
    container.classList.add('loading');
    container.innerHTML = '';

    // Create 6 skeleton cards matching the number of roles
    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-role-card';
        skeleton.innerHTML = `
            <div class="skeleton skeleton-role-icon"></div>
            <div class="skeleton skeleton-role-title"></div>
            <div class="skeleton skeleton-role-count"></div>
            <div class="skeleton skeleton-role-description"></div>
            <div class="skeleton skeleton-role-description"></div>
            <div class="skeleton skeleton-role-description"></div>
            <div class="skeleton skeleton-role-button"></div>
        `;
        container.appendChild(skeleton);
    }
}
