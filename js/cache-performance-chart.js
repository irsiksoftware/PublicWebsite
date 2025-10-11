/**
 * @fileoverview Cache Performance Chart
 * Visualizes build cache hit/miss ratios using a pie chart rendered on canvas.
 * Loads data from spy-activity.json and displays cache performance metrics.
 *
 * @module cache-performance-chart
 * @requires data/spy-activity.json
 *
 * @example
 * // Chart automatically loads on DOMContentLoaded
 * // Requires canvas element:
 * // <canvas id="cache-performance-chart"></canvas>
 */

/**
 * Loads and renders the cache performance pie chart
 * @async
 * @function
 * @throws {Error} When spy-activity.json cannot be loaded
 */
async function loadCachePerformanceChart() {
    try {
        const response = await fetch('./data/spy-activity.json');
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Resource not found: ./data/spy-activity.json');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const spyData = await response.json();

        const canvas = document.getElementById('cache-performance-chart');
        if (!canvas) {
            console.error('Cache performance chart canvas not found');
            return;
        }

        const ctx = canvas.getContext('2d');

        // Count cache hits and misses
        let cacheHits = 0;
        let cacheMisses = 0;

        spyData.forEach(entry => {
            if (entry.cacheStatus === 'hit') {
                cacheHits++;
            } else if (entry.cacheStatus === 'miss') {
                cacheMisses++;
            }
            // Note: 'partial' status is not included per requirements
        });

        const total = cacheHits + cacheMisses;
        const hitPercentage = total > 0 ? (cacheHits / total * 100).toFixed(1) : 0;
        const missPercentage = total > 0 ? (cacheMisses / total * 100).toFixed(1) : 0;

        // Set canvas size
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = 400;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw title
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('Build Cache Performance', canvas.width / 2, 20);

        // Pie chart dimensions
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 + 10;
        const radius = Math.min(canvas.width, canvas.height) / 3;

        // Colors
        const hitColor = '#4caf50'; // green
        const missColor = '#ffc107'; // yellow

        // Draw pie slices
        let currentAngle = -Math.PI / 2; // Start at top

        if (total > 0) {
            // Draw Cache Hits slice
            const hitAngle = (cacheHits / total) * 2 * Math.PI;
            ctx.fillStyle = hitColor;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + hitAngle);
            ctx.closePath();
            ctx.fill();

            // Draw percentage label for hits
            if (cacheHits > 0) {
                const labelAngle = currentAngle + hitAngle / 2;
                const labelX = centerX + Math.cos(labelAngle) * radius * 0.7;
                const labelY = centerY + Math.sin(labelAngle) * radius * 0.7;
                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${hitPercentage}%`, labelX, labelY);
            }

            currentAngle += hitAngle;

            // Draw Cache Misses slice
            const missAngle = (cacheMisses / total) * 2 * Math.PI;
            ctx.fillStyle = missColor;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + missAngle);
            ctx.closePath();
            ctx.fill();

            // Draw percentage label for misses
            if (cacheMisses > 0) {
                const labelAngle = currentAngle + missAngle / 2;
                const labelX = centerX + Math.cos(labelAngle) * radius * 0.7;
                const labelY = centerY + Math.sin(labelAngle) * radius * 0.7;
                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${missPercentage}%`, labelX, labelY);
            }
        } else {
            // No data - draw empty circle
            ctx.fillStyle = '#e0e0e0';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw legend
        const legendY = canvas.height - 60;
        const legendSpacing = 150;

        // Cache Hits legend
        ctx.fillStyle = hitColor;
        ctx.fillRect(centerX - legendSpacing, legendY, 20, 20);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Cache Hits (${cacheHits})`, centerX - legendSpacing + 30, legendY + 10);

        // Cache Misses legend
        ctx.fillStyle = missColor;
        ctx.fillRect(centerX + 20, legendY, 20, 20);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Cache Misses (${cacheMisses})`, centerX + 50, legendY + 10);

    } catch (error) {
        console.error('Failed to load cache performance chart:', error);

        const canvas = document.getElementById('cache-performance-chart');
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
                message.textContent = 'The data file "spy-activity.json" is missing. Please run the aggregation tool to generate the required data files.';
            } else {
                message.textContent = `Error loading cache performance chart: ${error.message}`;
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
            retryButton.addEventListener('click', () => loadCachePerformanceChart());
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
        loadCachePerformanceChart();
    }, 250);
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCachePerformanceChart);
} else {
    loadCachePerformanceChart();
}
