// Roles Overview Grid Component

// Role data with icons, descriptions, and gradients
const roles = [
    {
        name: 'Orchestrator',
        icon: '🎭',
        agentCount: 1,
        description: 'Coordinates team activities and delegates tasks across all agents.',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        responsibilities: 'Analyzes incoming issues, breaks down complex requirements, assigns tasks to appropriate specialists, monitors overall progress, and ensures coordination between different team roles.',
        anthropicPattern: 'Lead Agent',
        patternRationale: 'Acts as the central coordinator with high-level reasoning capabilities. Maintains context across all operations and makes strategic decisions about task delegation and workflow orchestration.'
    },
    {
        name: 'Implementer',
        icon: '⚡',
        agentCount: 8,
        description: 'Executes development tasks and implements features according to specifications.',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        responsibilities: 'Writes new code features, implements specifications, creates components, and translates requirements into working functionality following established patterns and best practices.',
        anthropicPattern: 'Worker Agent',
        patternRationale: 'Focuses on execution of well-defined tasks. Takes clear instructions and delivers concrete implementations without requiring broad system-level decision making.'
    },
    {
        name: 'Reviewer',
        icon: '🔍',
        agentCount: 3,
        description: 'Reviews code quality, identifies issues, and ensures adherence to standards.',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        responsibilities: 'Analyzes code changes for quality, security, and best practices. Provides constructive feedback, identifies potential issues, and ensures consistency with project standards and conventions.',
        anthropicPattern: 'Specialist Agent',
        patternRationale: 'Possesses deep expertise in code quality assessment. Applies specialized knowledge in security, performance, and maintainability to provide expert-level evaluation.'
    },
    {
        name: 'Fixer',
        icon: '🔧',
        agentCount: 5,
        description: 'Resolves bugs and technical issues identified during development and testing.',
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        responsibilities: 'Diagnoses problems, debugs issues, applies targeted fixes, and validates solutions. Handles error resolution, edge cases, and technical debt remediation.',
        anthropicPattern: 'Worker Agent',
        patternRationale: 'Executes problem-solving tasks within a defined scope. Works reactively to address identified issues with focused, corrective implementations.'
    },
    {
        name: 'Manager',
        icon: '📊',
        agentCount: 2,
        description: 'Oversees project progress, resource allocation, and team performance metrics.',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        responsibilities: 'Tracks sprint progress, monitors team velocity, manages priorities, generates reports, and ensures timely delivery of milestones and project objectives.',
        anthropicPattern: 'Meta Agent',
        patternRationale: 'Operates at a higher abstraction level, monitoring and optimizing the overall system. Focuses on process improvement and team performance rather than direct task execution.'
    },
    {
        name: 'Tester',
        icon: '🧪',
        agentCount: 4,
        description: 'Conducts thorough testing to ensure functionality and quality of deliverables.',
        gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        responsibilities: 'Designs test cases, executes validation procedures, performs regression testing, identifies edge cases, and verifies that implementations meet acceptance criteria.',
        anthropicPattern: 'Specialist Agent',
        patternRationale: 'Applies specialized testing methodologies and quality assurance expertise. Uses domain knowledge to systematically validate correctness and reliability.'
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

    // Generate unique ID for checkbox hack
    const roleId = `role-${role.name.toLowerCase().replace(/\s+/g, '-')}`;

    card.innerHTML = `
        <div class="role-card-icon">${role.icon}</div>
        <h3 class="role-card-name">${escapeHtml(role.name)}</h3>
        <div class="role-card-count">${role.agentCount} ${role.agentCount === 1 ? 'Agent' : 'Agents'}</div>
        <p class="role-card-description">${escapeHtml(role.description)}</p>

        <div class="role-card-expandable">
            <input type="checkbox" id="${roleId}" class="role-expand-toggle" aria-label="Toggle role details for ${escapeHtml(role.name)}">
            <label for="${roleId}" class="role-expand-label">
                <span class="expand-text">Learn More</span>
                <span class="expand-icon" aria-hidden="true">▼</span>
            </label>

            <div class="role-expanded-content">
                <div class="role-detail-section">
                    <h4>Responsibilities</h4>
                    <p>${escapeHtml(role.responsibilities)}</p>
                </div>

                <div class="role-detail-section">
                    <h4>Anthropic Pattern: ${escapeHtml(role.anthropicPattern)}</h4>
                    <p>${escapeHtml(role.patternRationale)}</p>
                </div>

                <div class="role-detail-section">
                    <h4>Why This Pattern?</h4>
                    <p>${escapeHtml(role.patternRationale)}</p>
                </div>

                <a href="https://www.anthropic.com/research/building-effective-agents"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="role-card-external-link">
                    Anthropic Agent Patterns <span aria-hidden="true">↗</span>
                </a>
            </div>
        </div>
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
