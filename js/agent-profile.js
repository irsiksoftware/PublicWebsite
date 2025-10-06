// Agent Profile Card Component

let agents = [];

// Initialize the component
document.addEventListener('DOMContentLoaded', async function() {
    const dropdown = document.getElementById('agent-dropdown');
    const profileCard = document.getElementById('agent-profile-card');

    // Load agents from agents.json
    try {
        const response = await fetch('data/agents.json');
        const data = await response.json();
        agents = data.agents;

        // Populate dropdown
        agents.forEach((agent, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = agent.name;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load agents:', error);
        dropdown.innerHTML = '<option value="">Error loading agents</option>';
        return;
    }

    // Handle dropdown change
    dropdown.addEventListener('change', function() {
        const agentIndex = parseInt(this.value);

        if (isNaN(agentIndex)) {
            profileCard.classList.add('hidden');
            return;
        }

        const agent = agents[agentIndex];
        if (agent) {
            displayAgentProfile(agent);
        }
    });
});

function displayAgentProfile(agent) {
    const profileCard = document.getElementById('agent-profile-card');

    // Determine pattern class
    const patternClass = agent.anthropic_pattern.toLowerCase().replace(' ', '-');

    // Build prompt design badges
    const promptDesign = agent.prompt_design || {};
    const badgesHTML = `
        <div class="prompt-design-badges">
            <span class="feature-badge ${promptDesign.context_injection ? 'active' : 'inactive'}" data-tooltip="Context Injection: Provides issue context directly in the prompt">
                Context Injection
            </span>
            <span class="feature-badge ${promptDesign.worktree_support ? 'active' : 'inactive'}" data-tooltip="Worktree Support: Works in isolated git worktrees">
                Worktree Support
            </span>
            <span class="feature-badge ${promptDesign.discord_notifications ? 'active' : 'inactive'}" data-tooltip="Discord Notifications: Sends notifications to Discord channel">
                Discord Notifications
            </span>
            <span class="feature-badge ${promptDesign.audit_logging ? 'active' : 'inactive'}" data-tooltip="Audit Logging: Logs all actions for audit trail">
                Audit Logging
            </span>
        </div>
    `;

    // Build the card HTML
    const cardHTML = `
        <div class="agent-profile-content">
            <div class="agent-profile-header">
                <div class="agent-profile-title">
                    <h3>${escapeHtml(agent.name)}</h3>
                    <div class="agent-profile-fullname">${escapeHtml(agent.full_name)}</div>
                    <div class="agent-profile-alias">"${escapeHtml(agent.alias)}"</div>
                </div>
                <div class="agent-profile-badge ${patternClass}">
                    ${escapeHtml(agent.anthropic_pattern)}
                </div>
            </div>
            <div class="agent-profile-role">
                ${escapeHtml(agent.role)}
            </div>
            <div class="agent-profile-description">
                ${escapeHtml(agent.description)}
            </div>
            ${badgesHTML}
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
