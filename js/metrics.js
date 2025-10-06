// Load and display agent performance metrics
let performanceData = {};

// Load performance data on page load
async function loadPerformanceData() {
    try {
        const response = await fetch('data/performance-sample.json');
        performanceData = await response.json();
        populateAgentSelector();
    } catch (error) {
        console.error('Error loading performance data:', error);
        document.getElementById('metrics-table-container').innerHTML =
            '<p class="error">Error loading performance data</p>';
    }
}

// Populate the agent selector dropdown
function populateAgentSelector() {
    const select = document.getElementById('agent-select');
    const agentNames = Object.keys(performanceData).sort();

    agentNames.forEach(agentName => {
        const option = document.createElement('option');
        option.value = agentName;
        option.textContent = agentName;
        select.appendChild(option);
    });

    select.addEventListener('change', handleAgentSelection);
}

// Handle agent selection
function handleAgentSelection(event) {
    const agentName = event.target.value;

    if (!agentName) {
        resetTable();
        return;
    }

    displayMetrics(agentName);
}

// Calculate success rate percentage
function calculateSuccessRate(totalRuns, productiveRuns) {
    if (totalRuns === 0) return 0;
    return Math.round((productiveRuns / totalRuns) * 100);
}

// Get success rate color class
function getSuccessRateClass(successRate) {
    if (successRate > 70) return 'success-high';
    if (successRate >= 40) return 'success-medium';
    return 'success-low';
}

// Display metrics for selected agent
function displayMetrics(agentName) {
    const metrics = performanceData[agentName];

    if (!metrics) {
        resetTable();
        return;
    }

    const successRate = calculateSuccessRate(metrics.total_runs, metrics.productive_runs);
    const successRateClass = getSuccessRateClass(successRate);

    const tbody = document.querySelector('#metrics-table tbody');
    tbody.innerHTML = `
        <tr>
            <td>${metrics.total_runs}</td>
            <td>${metrics.productive_runs}</td>
            <td class="${successRateClass}">${successRate}%</td>
            <td>${metrics.current_offense_streak}</td>
        </tr>
    `;
}

// Reset table to default state
function resetTable() {
    const tbody = document.querySelector('#metrics-table tbody');
    tbody.innerHTML = `
        <tr>
            <td colspan="4">Select an agent to view metrics</td>
        </tr>
    `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadPerformanceData);
