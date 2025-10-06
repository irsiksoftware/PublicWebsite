async function loadSuccessRateChart() {
    try {
        const [agentsResponse, performanceResponse] = await Promise.all([
            fetch('./data/agents.json'),
            fetch('./data/performance-sample.json')
        ]);

        if (!agentsResponse.ok) {
            if (agentsResponse.status === 404) {
                throw new Error('Resource not found: ./data/agents.json');
            }
            throw new Error(`HTTP error! status: ${agentsResponse.status}`);
        }

        if (!performanceResponse.ok) {
            if (performanceResponse.status === 404) {
                throw new Error('Resource not found: ./data/performance-sample.json');
            }
            throw new Error(`HTTP error! status: ${performanceResponse.status}`);
        }

        const agentsData = await agentsResponse.json();
        const performanceData = await performanceResponse.json();

        const canvas = document.getElementById('success-rate-chart');
        if (!canvas) {
            console.error('Success rate chart canvas not found');
            return;
        }

        const ctx = canvas.getContext('2d');

        // Calculate success rates
        const chartData = agentsData.agents.map(agent => {
            const perfData = performanceData[agent.full_name];
            let successRate = 0;

            if (perfData && perfData.total_runs > 0) {
                successRate = (perfData.productive_runs / perfData.total_runs) * 100;
            }

            return {
                name: agent.name,
                successRate: successRate
            };
        });

        // Set canvas size
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = 400;

        // Chart dimensions
        const padding = { top: 40, right: 20, bottom: 80, left: 60 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw title
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('Agent Success Rates', canvas.width / 2, 20);

        // Calculate bar dimensions
        const barWidth = chartWidth / chartData.length;
        const barPadding = barWidth * 0.2;
        const actualBarWidth = barWidth - barPadding;

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

        for (let i = 0; i <= 10; i++) {
            const y = padding.top + chartHeight - (i / 10 * chartHeight);
            const percentage = i * 10;

            // Label
            ctx.fillText(`${percentage}%`, padding.left - 10, y + 4);

            // Gridline
            if (i > 0) {
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(padding.left + chartWidth, y);
                ctx.stroke();
            }
        }

        // Draw bars
        chartData.forEach((data, index) => {
            const barHeight = (data.successRate / 100) * chartHeight;
            const x = padding.left + (index * barWidth) + (barPadding / 2);
            const y = padding.top + chartHeight - barHeight;

            // Determine color based on success rate
            let color;
            if (data.successRate > 70) {
                color = '#4caf50'; // green
            } else if (data.successRate >= 40) {
                color = '#ffc107'; // yellow
            } else {
                color = '#f44336'; // red
            }

            // Draw bar
            ctx.fillStyle = color;
            ctx.fillRect(x, y, actualBarWidth, barHeight);

            // Draw percentage on top of bar
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#333';
            ctx.textAlign = 'center';
            ctx.fillText(
                `${data.successRate.toFixed(1)}%`,
                x + actualBarWidth / 2,
                y - 5
            );

            // Draw agent name (rotated)
            ctx.save();
            ctx.translate(x + actualBarWidth / 2, padding.top + chartHeight + 10);
            ctx.rotate(-Math.PI / 4);
            ctx.font = '12px Arial';
            ctx.fillStyle = '#333';
            ctx.textAlign = 'right';
            ctx.fillText(data.name, 0, 0);
            ctx.restore();
        });

        // Y-axis label
        ctx.save();
        ctx.translate(15, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('Success Rate (%)', 0, 0);
        ctx.restore();

    } catch (error) {
        console.error('Failed to load success rate chart:', error);

        const canvas = document.getElementById('success-rate-chart');
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
                const fileName = error.message.includes('agents.json') ? 'agents.json' : 'performance-sample.json';
                message.textContent = `The data file "${fileName}" is missing. Please run the aggregation tool to generate the required data files.`;
            } else {
                message.textContent = `Error loading success rate chart: ${error.message}`;
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
            retryButton.addEventListener('click', () => loadSuccessRateChart());
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
        loadSuccessRateChart();
    }, 250);
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSuccessRateChart);
} else {
    loadSuccessRateChart();
}
