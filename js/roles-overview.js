// Roles Overview Grid Component

// Role data with icons, descriptions, gradients, and Anthropic pattern classifications
const roles = [
    {
        name: 'Orchestrator',
        icon: '🎭',
        agentCount: 1,
        description: 'Coordinates team activities and delegates tasks across all agents.',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        anthropicPattern: 'Lead Agent',
        responsibilities: [
            'Analyzes incoming issues and requirements',
            'Creates implementation plans and task breakdowns',
            'Delegates tasks to appropriate specialized agents',
            'Monitors overall project progress and coordination'
        ],
        patternRationale: 'Orchestrator follows the Lead Agent pattern by maintaining high-level project context, making strategic decisions about task delegation, and coordinating multiple worker agents without getting involved in implementation details.'
    },
    {
        name: 'Implementer',
        icon: '⚡',
        agentCount: 8,
        description: 'Executes development tasks and implements features according to specifications.',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        anthropicPattern: 'Worker Agent',
        responsibilities: [
            'Writes code for new features and functionality',
            'Follows specifications provided by orchestrator',
            'Implements changes in isolated worktrees',
            'Creates pull requests for completed work'
        ],
        patternRationale: 'Implementer is a classic Worker Agent, focused on executing specific, well-defined tasks. It operates with clear boundaries and objectives, implementing features without needing to make high-level strategic decisions.'
    },
    {
        name: 'Reviewer',
        icon: '🔍',
        agentCount: 3,
        description: 'Reviews code quality, identifies issues, and ensures adherence to standards.',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        anthropicPattern: 'Specialist Agent',
        responsibilities: [
            'Analyzes code for quality and best practices',
            'Identifies potential bugs and security issues',
            'Ensures coding standards compliance',
            'Provides detailed feedback and recommendations'
        ],
        patternRationale: 'Reviewer is a Specialist Agent with deep expertise in code quality assessment. It applies domain-specific knowledge to evaluate implementations, requiring specialized judgment rather than just following instructions.'
    },
    {
        name: 'Fixer',
        icon: '🔧',
        agentCount: 5,
        description: 'Resolves bugs and technical issues identified during development and testing.',
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        anthropicPattern: 'Worker Agent',
        responsibilities: [
            'Diagnoses and resolves reported bugs',
            'Fixes failing tests and build issues',
            'Addresses review feedback and requested changes',
            'Ensures fixes don\'t introduce new problems'
        ],
        patternRationale: 'Fixer operates as a Worker Agent with a specific mandate: resolve identified issues. While debugging requires problem-solving, the scope is bounded to fixing specific problems rather than making architectural decisions.'
    },
    {
        name: 'Manager',
        icon: '📊',
        agentCount: 2,
        description: 'Oversees project progress, resource allocation, and team performance metrics.',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        anthropicPattern: 'Meta Agent',
        responsibilities: [
            'Monitors team performance and productivity',
            'Tracks project metrics and KPIs',
            'Identifies process bottlenecks and inefficiencies',
            'Recommends workflow improvements'
        ],
        patternRationale: 'Manager functions as a Meta Agent, operating at a layer above the work itself. It observes and analyzes how other agents perform, tracking patterns and suggesting optimizations to the overall system rather than doing the work directly.'
    },
    {
        name: 'Tester',
        icon: '🧪',
        agentCount: 4,
        description: 'Conducts thorough testing to ensure functionality and quality of deliverables.',
        gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        anthropicPattern: 'Specialist Agent',
        responsibilities: [
            'Designs and executes test strategies',
            'Creates comprehensive test cases',
            'Performs integration and regression testing',
            'Validates functionality against requirements'
        ],
        patternRationale: 'Tester is a Specialist Agent focused on quality assurance. It requires specialized knowledge of testing methodologies, edge cases, and quality standards, going beyond simple task execution to apply testing expertise.'
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

    const responsibilitiesList = role.responsibilities
        .map(r => `<li>${escapeHtml(r)}</li>`)
        .join('');

    card.innerHTML = `
        <div class="role-card-icon">${role.icon}</div>
        <h3 class="role-card-name">${escapeHtml(role.name)}</h3>
        <div class="role-card-count">${role.agentCount} ${role.agentCount === 1 ? 'Agent' : 'Agents'}</div>
        <p class="role-card-description">${escapeHtml(role.description)}</p>

        <div class="role-card-expandable">
            <input type="checkbox" id="expand-${escapeHtml(role.name.toLowerCase())}" class="role-expand-checkbox">
            <label for="expand-${escapeHtml(role.name.toLowerCase())}" class="role-expand-label">
                <span class="expand-text">Show Details</span>
                <span class="collapse-text">Hide Details</span>
                <span class="expand-arrow" aria-hidden="true">▼</span>
            </label>
            <div class="role-expanded-content">
                <div class="role-detail-section">
                    <h4>Responsibilities</h4>
                    <ul class="role-responsibilities-list">
                        ${responsibilitiesList}
                    </ul>
                </div>
                <div class="role-detail-section">
                    <h4>Anthropic Pattern: <span class="pattern-badge">${escapeHtml(role.anthropicPattern)}</span></h4>
                </div>
                <div class="role-detail-section">
                    <h4>Why This Pattern?</h4>
                    <p class="pattern-rationale">${escapeHtml(role.patternRationale)}</p>
                </div>
            </div>
        </div>

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
