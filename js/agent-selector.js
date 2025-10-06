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

    select.setAttribute('aria-live', 'polite');

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
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Resource not found: ./data/agents.json');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
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

        const select = document.getElementById('agent-selector');
        if (select) {
            select.innerHTML = '';

            const errorContainer = document.createElement('div');
            errorContainer.style.cssText = `
                padding: 20px;
                margin: 10px 0;
                background-color: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 4px;
                color: #856404;
            `;

            const title = document.createElement('h4');
            title.textContent = 'Data unavailable';
            title.style.cssText = 'margin: 0 0 10px 0; font-weight: bold;';

            const message = document.createElement('p');
            message.style.cssText = 'margin: 0 0 10px 0;';

            if (error.message.includes('not found') || error.message.includes('404')) {
                message.textContent = 'The data file "agents.json" is missing. Please run the aggregation tool to generate the required data files.';
            } else {
                message.textContent = `Error loading agents: ${error.message}`;
            }

            const retryButton = document.createElement('button');
            retryButton.textContent = 'Retry';
            retryButton.style.cssText = `
                padding: 8px 16px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            `;
            retryButton.addEventListener('click', () => loadAgents());
            retryButton.addEventListener('mouseenter', () => {
                retryButton.style.backgroundColor = '#0056b3';
            });
            retryButton.addEventListener('mouseleave', () => {
                retryButton.style.backgroundColor = '#007bff';
            });

            errorContainer.appendChild(title);
            errorContainer.appendChild(message);
            errorContainer.appendChild(retryButton);

            select.parentElement.insertBefore(errorContainer, select);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAgents);
} else {
    loadAgents();
}
