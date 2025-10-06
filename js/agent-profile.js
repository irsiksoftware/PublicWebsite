// Agent Profile Card Component

// Sample agent data
const agents = [
    {
        id: 1,
        name: 'Thor',
        fullName: 'Thor Odinson',
        alias: 'God of Thunder',
        role: 'Lead Developer',
        pattern: 'Lead Agent',
        description: 'Oversees the development team and ensures architectural decisions align with project goals. Expert in distributed systems and AI coordination.',
        email: 'thor@swarm.dev'
    },
    {
        id: 2,
        name: 'Loki',
        fullName: 'Loki Laufeyson',
        alias: 'The Trickster',
        role: 'Frontend Developer',
        pattern: 'Worker Agent',
        description: 'Specializes in user interface design and frontend architecture. Master of modern web technologies and responsive design patterns.',
        email: 'loki@swarm.dev'
    },
    {
        id: 3,
        name: 'Heimdall',
        fullName: 'Heimdall Guardian',
        alias: 'The Watcher',
        role: 'DevOps Engineer',
        pattern: 'Worker Agent',
        description: 'Monitors system performance and maintains infrastructure. Ensures continuous integration and deployment pipelines run smoothly.',
        email: 'heimdall@swarm.dev'
    },
    {
        id: 4,
        name: 'Freya',
        fullName: 'Freya Vanir',
        alias: 'The Wise',
        role: 'QA Engineer',
        pattern: 'Worker Agent',
        description: 'Ensures code quality and maintains testing standards. Expert in automated testing and quality assurance methodologies.',
        email: 'freya@swarm.dev'
    }
];

// Initialize the component
document.addEventListener('DOMContentLoaded', function() {
    const dropdown = document.getElementById('agent-dropdown');
    const profileCard = document.getElementById('agent-profile-card');

    // Populate dropdown
    agents.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent.id;
        option.textContent = agent.name;
        dropdown.appendChild(option);
    });

    // Handle dropdown change
    dropdown.addEventListener('change', function() {
        const agentId = parseInt(this.value);

        if (!agentId) {
            profileCard.classList.add('hidden');
            return;
        }

        const agent = agents.find(a => a.id === agentId);
        if (agent) {
            displayAgentProfile(agent);
        }
    });
});

function displayAgentProfile(agent) {
    const profileCard = document.getElementById('agent-profile-card');

    // Determine pattern class
    const patternClass = agent.pattern.toLowerCase().replace(' ', '-');

    // Build the card HTML
    const cardHTML = `
        <div class="agent-profile-content">
            <div class="agent-profile-header">
                <div class="agent-profile-title">
                    <h3>${escapeHtml(agent.name)}</h3>
                    <div class="agent-profile-fullname">${escapeHtml(agent.fullName)}</div>
                    <div class="agent-profile-alias">"${escapeHtml(agent.alias)}"</div>
                </div>
                <div class="agent-profile-badge ${patternClass}">
                    ${escapeHtml(agent.pattern)}
                </div>
            </div>
            <div class="agent-profile-role">
                ${escapeHtml(agent.role)}
            </div>
            <div class="agent-profile-description">
                ${escapeHtml(agent.description)}
            </div>
            <div class="agent-profile-email">
                <a href="mailto:${escapeHtml(agent.email)}">${escapeHtml(agent.email)}</a>
            </div>
        </div>
    `;

    // Update card content
    profileCard.innerHTML = cardHTML;

    // Update card gradient border class
    profileCard.className = `agent-profile-card ${patternClass}`;
}

// Utility function to escape HTML and prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
