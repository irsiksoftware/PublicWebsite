// Roles Overview Grid Component

// Role data with icons, descriptions, and gradients
const roles = [
    {
        name: 'Orchestrator',
        icon: '🎭',
        agentCount: 1,
        description: 'Coordinates team activities and delegates tasks across all agents.',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        responsibilities: 'Breaks down complex projects into manageable tasks, assigns work to specialized agents, monitors overall progress, and ensures cohesive integration of all team outputs.',
        anthropicPattern: 'Lead Agent',
        patternRationale: 'Acts as the central coordinator with high-level planning capabilities, delegating to specialized workers while maintaining project coherence.',
        learnMoreUrl: 'https://www.anthropic.com/research/building-effective-agents'
    },
    {
        name: 'Implementer',
        icon: '⚡',
        agentCount: 8,
        description: 'Executes development tasks and implements features according to specifications.',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        responsibilities: 'Translates specifications into working code, follows established patterns and conventions, implements new features, and integrates components into the existing codebase.',
        anthropicPattern: 'Worker Agent',
        patternRationale: 'Focused on execution of well-defined tasks with clear specifications, operating independently within their scope of responsibility.',
        learnMoreUrl: 'https://www.anthropic.com/news/3-5-models-and-computer-use'
    },
    {
        name: 'Reviewer',
        icon: '🔍',
        agentCount: 3,
        description: 'Reviews code quality, identifies issues, and ensures adherence to standards.',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        responsibilities: 'Examines code for quality, security, and maintainability issues, verifies adherence to coding standards, provides constructive feedback, and approves or requests changes.',
        anthropicPattern: 'Specialist Agent',
        patternRationale: 'Deep expertise in code quality assessment and best practices, providing specialized evaluation that requires domain knowledge.',
        learnMoreUrl: 'https://www.anthropic.com/customers/lonely-planet'
    },
    {
        name: 'Fixer',
        icon: '🔧',
        agentCount: 5,
        description: 'Resolves bugs and technical issues identified during development and testing.',
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        responsibilities: 'Diagnoses root causes of bugs and technical issues, develops and tests fixes, ensures solutions don\'t introduce new problems, and documents resolution approaches.',
        anthropicPattern: 'Worker Agent',
        patternRationale: 'Task-focused problem solvers addressing specific issues, operating with autonomy within their debugging and fixing scope.',
        learnMoreUrl: 'https://www.anthropic.com/news/evaluating-ai-systems'
    },
    {
        name: 'Manager',
        icon: '📊',
        agentCount: 2,
        description: 'Oversees project progress, resource allocation, and team performance metrics.',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        responsibilities: 'Tracks project milestones and deadlines, monitors team capacity and workload, identifies bottlenecks or blockers, and provides status reports and insights.',
        anthropicPattern: 'Meta Agent',
        patternRationale: 'Operates at a higher level of abstraction, monitoring and optimizing the system itself rather than directly implementing features.',
        learnMoreUrl: 'https://www.anthropic.com/customers/bridgewater'
    },
    {
        name: 'Tester',
        icon: '🧪',
        agentCount: 4,
        description: 'Conducts thorough testing to ensure functionality and quality of deliverables.',
        gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        responsibilities: 'Designs and executes test cases, validates functionality against requirements, identifies edge cases and failure scenarios, and documents test results and coverage.',
        anthropicPattern: 'Specialist Agent',
        patternRationale: 'Specialized knowledge in testing methodologies and quality assurance, requiring expertise in test design and failure analysis.',
        learnMoreUrl: 'https://www.anthropic.com/customers/asana'
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

    const cardId = `role-${role.name.toLowerCase().replace(/\s+/g, '-')}`;

    card.innerHTML = `
        <div class="role-card-icon">${role.icon}</div>
        <h3 class="role-card-name">${escapeHtml(role.name)}</h3>
        <div class="role-card-count">${role.agentCount} ${role.agentCount === 1 ? 'Agent' : 'Agents'}</div>
        <p class="role-card-description">${escapeHtml(role.description)}</p>

        <input type="checkbox" id="${cardId}-toggle" class="role-details-toggle" />
        <label for="${cardId}-toggle" class="role-details-label">
            <span class="expand-text">Show Details</span>
            <span class="collapse-text">Hide Details</span>
        </label>

        <div class="role-details">
            <div class="role-details-section">
                <h4>Responsibilities</h4>
                <p>${escapeHtml(role.responsibilities)}</p>
            </div>

            <div class="role-details-section">
                <h4>Anthropic Pattern</h4>
                <p class="pattern-badge">${escapeHtml(role.anthropicPattern)}</p>
            </div>

            <div class="role-details-section">
                <h4>Why This Pattern?</h4>
                <p>${escapeHtml(role.patternRationale)}</p>
            </div>
        </div>

        <a href="${escapeHtml(role.learnMoreUrl)}"
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
