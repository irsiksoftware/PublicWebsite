let selectedAgent = null;
let allEnabledAgents = [];
let debounceTimer = null;

function filterAgents(searchTerm) {
    const select = document.getElementById('agent-selector');
    if (!select) return;

    const lowerSearch = searchTerm.toLowerCase().trim();

    const filteredAgents = lowerSearch === ''
        ? allEnabledAgents
        : allEnabledAgents.filter(agent =>
            agent.name.toLowerCase().includes(lowerSearch) ||
            agent.alias.toLowerCase().includes(lowerSearch) ||
            agent.role.toLowerCase().includes(lowerSearch)
        );

    select.innerHTML = filteredAgents.length === 0
        ? '<option value="">No matches found</option>'
        : '<option value="">Select an agent...</option>';

    filteredAgents.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent.name;
        option.textContent = `${agent.name} (${agent.alias}) - ${agent.role}`;
        select.appendChild(option);
    });
}

function setupSearchDebounce() {
    const searchInput = document.getElementById('agent-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (event) => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
            filterAgents(event.target.value);
        }, 300);
    });
}

async function loadAgents() {
    try {
        const response = await fetch('./data/agents.json');
        const data = await response.json();

        allEnabledAgents = data.agents.filter(agent => agent.enabled);

        const select = document.getElementById('agent-selector');
        if (!select) {
            console.error('Agent selector element not found');
            return;
        }

        filterAgents('');

        select.addEventListener('change', (event) => {
            selectedAgent = event.target.value || null;
            console.log('Selected agent:', selectedAgent);
        });

        setupSearchDebounce();

    } catch (error) {
        console.error('Failed to load agents:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAgents);
} else {
    loadAgents();
}
