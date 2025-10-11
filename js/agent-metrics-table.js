/**
 * @fileoverview Agent Metrics Table Component
 * Displays performance metrics for agents including total runs, productive runs,
 * success rate, and offense streak. Data is loaded from performance-sample.json
 * and displayed in an interactive table with color-coded success rates.
 *
 * @module agent-metrics-table
 * @requires data/performance-sample.json
 *
 * @example
 * // The component auto-initializes on DOMContentLoaded
 * // Requires the following HTML elements:
 * // <select id="agent-dropdown"></select>
 * // <div id="agent-metrics-table"></div>
 */

/**
 * Stores performance data for all agents
 * @type {Object<string, Object>}
 */
let performanceData = {};

/**
 * Initializes the agent metrics table component
 * Loads performance data and sets up event listeners for agent selection
 * @async
 * @function
 */
document.addEventListener('DOMContentLoaded', async function() {
    const dropdown = document.getElementById('agent-dropdown');
    const metricsTableContainer = document.getElementById('agent-metrics-table');

    // Load performance data from performance-sample.json
    try {
        const response = await fetch('data/performance-sample.json');
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Resource not found: data/performance-sample.json');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        performanceData = await response.json();
    } catch (error) {
        console.error('Failed to load performance data:', error);
        showError(metricsTableContainer, error);
        return;
    }

    // Listen for agent selection changes
    if (dropdown) {
        dropdown.addEventListener('change', function() {
            const agentIndex = parseInt(this.value);

            if (isNaN(agentIndex)) {
                metricsTableContainer.classList.add('hidden');
                return;
            }

            // Get agent name from the dropdown option text
            const agentName = this.options[this.selectedIndex].textContent;
            displayMetricsTable(agentName);
        });
    }
});

/**
 * Displays performance metrics table for the selected agent
 * @param {string} agentName - Name of the agent to display metrics for
 * @example
 * displayMetricsTable('Task Agent');
 */
function displayMetricsTable(agentName) {
    const metricsTableContainer = document.getElementById('agent-metrics-table');

    // Check if we have performance data for this agent
    if (!performanceData[agentName]) {
        metricsTableContainer.classList.add('hidden');
        return;
    }

    const metrics = performanceData[agentName];

    // Calculate success rate
    const successRate = metrics.total_runs > 0
        ? (metrics.productive_runs / metrics.total_runs) * 100
        : 0;

    // Determine success rate color class
    let successRateClass = 'success-rate-red';
    if (successRate > 70) {
        successRateClass = 'success-rate-green';
    } else if (successRate >= 40) {
        successRateClass = 'success-rate-yellow';
    }

    // Build the table HTML
    const tableHTML = `
        <div class="metrics-table-wrapper">
            <h3>Performance Metrics</h3>
            <div class="table-container">
                <table class="metrics-table">
                    <thead>
                        <tr>
                            <th>Total Runs</th>
                            <th>Productive Runs</th>
                            <th>Success Rate</th>
                            <th>Offense Streak</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${metrics.total_runs}</td>
                            <td>${metrics.productive_runs}</td>
                            <td class="${successRateClass}">${successRate.toFixed(1)}%</td>
                            <td>${metrics.current_offense_streak}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Update table content
    metricsTableContainer.innerHTML = tableHTML;
    metricsTableContainer.classList.remove('hidden');
}

/**
 * Displays an error message in the container
 * @param {HTMLElement} container - Container element to display error in
 * @param {Error} error - Error object containing error details
 */
function showError(container, error) {
    const errorHTML = `
        <div class="error-container">
            <h4>Data unavailable</h4>
            <p>${error.message.includes('not found') || error.message.includes('404')
        ? 'The data file "performance-sample.json" is missing. Please run the aggregation tool to generate the required data files.'
        : `Error loading performance data: ${error.message}`
}</p>
            <button class="retry-button" onclick="location.reload()">Retry</button>
        </div>
    `;
    container.innerHTML = errorHTML;
    container.classList.remove('hidden');
}
