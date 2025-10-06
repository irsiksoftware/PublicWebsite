let selectedAgent = null;

async function loadAgents() {
    try {
        const response = await fetch('./data/agents.json');
        const data = await response.json();

        const enabledAgents = data.agents.filter(agent => agent.enabled);

        const select = document.getElementById('agent-selector');
        if (!select) {
            console.error('Agent selector element not found');
            return;
        }

        select.innerHTML = '<option value="">Select an agent...</option>';

        enabledAgents.forEach(agent => {
            const option = document.createElement('option');
            option.value = agent.name;
            option.textContent = `${agent.name} (${agent.alias}) - ${agent.role}`;
            select.appendChild(option);
        });

        select.addEventListener('change', (event) => {
            selectedAgent = event.target.value || null;
            console.log('Selected agent:', selectedAgent);
        });

    } catch (error) {
        console.error('Failed to load agents:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAgents);
} else {
    loadAgents();
}
