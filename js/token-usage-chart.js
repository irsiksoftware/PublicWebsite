/**
 * @fileoverview Token Usage Chart
 * Visualizes token usage over time using a line chart rendered on canvas.
 * Aggregates session data by date and calculates estimated token counts.
 *
 * @module token-usage-chart
 * @requires data/audit-sessions-sample.json
 *
 * @example
 * // Chart automatically loads on DOMContentLoaded
 * // Requires canvas element:
 * // <canvas id="token-usage-chart"></canvas>
 */

/**
 * Loads and renders the token usage line chart
 * @async
 * @function
 * @throws {Error} When audit-sessions-sample.json cannot be loaded
 */
async function loadTokenUsageChart() {
    try {
        const response = await fetch('./data/audit-sessions-sample.json');
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Resource not found: ./data/audit-sessions-sample.json');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const sessions = data.sessions || [];

        const canvas = document.getElementById('token-usage-chart');
        if (!canvas) {
            console.error('Token usage chart canvas not found');
            return;
        }

        const ctx = canvas.getContext('2d');

        // Group sessions by date
        const sessionsByDate = {};
        sessions.forEach(session => {
            if (session.timestamp) {
                // Extract date from timestamp (YYYY-MM-DD)
                const date = session.timestamp.split('T')[0];
                if (!sessionsByDate[date]) {
                    sessionsByDate[date] = 0;
                }
                sessionsByDate[date]++;
            }
        });

        // Sort dates and calculate tokens
        const dates = Object.keys(sessionsByDate).sort();
        const tokenCounts = dates.map(date => sessionsByDate[date] * 70000);

        // Set canvas size
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = 400;

        // Chart dimensions
        const padding = { top: 40, right: 20, bottom: 80, left: 80 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw title
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('Token Usage Over Time', canvas.width / 2, 20);

        if (dates.length === 0) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#666';
            ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Calculate Y-axis range
        const maxTokens = Math.max(...tokenCounts, 1);
        const yAxisMax = Math.ceil(maxTokens / 100000) * 100000; // Round up to nearest 100k

        // Draw Y-axis
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, padding.top + chartHeight);
        ctx.stroke();

        // Draw X-axis
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + chartHeight);
        ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
        ctx.stroke();

        // Draw Y-axis labels and gridlines
        ctx.font = '12px Arial';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'right';
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;

        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const y = padding.top + chartHeight - (i / ySteps * chartHeight);
            const value = (i / ySteps * yAxisMax);

            // Format with commas
            const formattedValue = Math.round(value).toLocaleString();
            ctx.fillText(formattedValue, padding.left - 10, y + 4);

            // Gridline
            if (i > 0) {
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(padding.left + chartWidth, y);
                ctx.stroke();
            }
        }

        // Draw line chart
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 3;
        ctx.beginPath();

        const pointRadius = 4;
        const xStep = chartWidth / (dates.length - 1 || 1);

        dates.forEach((date, index) => {
            const x = padding.left + (index * xStep);
            const y = padding.top + chartHeight - (tokenCounts[index] / yAxisMax * chartHeight);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw data points
        dates.forEach((date, index) => {
            const x = padding.left + (index * xStep);
            const y = padding.top + chartHeight - (tokenCounts[index] / yAxisMax * chartHeight);

            ctx.fillStyle = '#2196F3';
            ctx.beginPath();
            ctx.arc(x, y, pointRadius, 0, 2 * Math.PI);
            ctx.fill();

            // Draw white border around point
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Draw X-axis labels (dates)
        ctx.font = '12px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';

        dates.forEach((date, index) => {
            const x = padding.left + (index * xStep);

            ctx.save();
            ctx.translate(x, padding.top + chartHeight + 10);
            ctx.rotate(-Math.PI / 4);
            ctx.textAlign = 'right';
            ctx.fillText(date, 0, 0);
            ctx.restore();
        });

        // Y-axis label
        ctx.save();
        ctx.translate(15, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('Token Count', 0, 0);
        ctx.restore();

        // X-axis label
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('Date', canvas.width / 2, canvas.height - 10);

    } catch (error) {
        console.error('Failed to load token usage chart:', error);

        const canvas = document.getElementById('token-usage-chart');
        if (canvas) {
            const container = canvas.parentElement;
            container.innerHTML = '';

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
                message.textContent = 'The data file "audit-sessions-sample.json" is missing. Please run the aggregation tool to generate the required data files.';
            } else {
                message.textContent = `Error loading token usage chart: ${error.message}`;
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
            retryButton.addEventListener('click', () => loadTokenUsageChart());
            retryButton.addEventListener('mouseenter', () => {
                retryButton.style.backgroundColor = '#0056b3';
            });
            retryButton.addEventListener('mouseleave', () => {
                retryButton.style.backgroundColor = '#007bff';
            });

            errorContainer.appendChild(title);
            errorContainer.appendChild(message);
            errorContainer.appendChild(retryButton);
            container.appendChild(errorContainer);
        }
    }
}

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        loadTokenUsageChart();
    }, 250);
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTokenUsageChart);
} else {
    loadTokenUsageChart();
}
