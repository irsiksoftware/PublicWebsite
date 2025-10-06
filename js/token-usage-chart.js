async function loadTokenUsageChart() {
    try {
        const response = await fetch('./data/audit-sessions-sample.json');
        const auditData = await response.json();

        const canvas = document.getElementById('token-usage-chart');
        if (!canvas) {
            console.error('Token usage chart canvas not found');
            return;
        }

        const ctx = canvas.getContext('2d');

        // Calculate token estimates by date
        const TOKENS_PER_SESSION = 70000;
        const tokensByDate = {};

        auditData.sessions.forEach(session => {
            if (!tokensByDate[session.date]) {
                tokensByDate[session.date] = 0;
            }
            tokensByDate[session.date] += TOKENS_PER_SESSION;
        });

        // Sort dates and prepare chart data
        const sortedDates = Object.keys(tokensByDate).sort();
        const chartData = sortedDates.map(date => ({
            date: date,
            tokens: tokensByDate[date]
        }));

        // Set canvas size
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = 400;

        // Chart dimensions
        const padding = { top: 40, right: 80, bottom: 60, left: 80 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw title
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('Token Usage Over Time', canvas.width / 2, 20);

        // Calculate max tokens for scaling
        const maxTokens = Math.max(...chartData.map(d => d.tokens));
        const yAxisMax = Math.ceil(maxTokens / 1000000) * 1000000; // Round up to nearest million

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

        const yAxisSteps = 5;
        for (let i = 0; i <= yAxisSteps; i++) {
            const y = padding.top + chartHeight - (i / yAxisSteps * chartHeight);
            const tokenValue = (i / yAxisSteps) * yAxisMax;

            // Format with commas
            const formattedValue = tokenValue.toLocaleString('en-US');

            // Label
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
        if (chartData.length > 0) {
            ctx.strokeStyle = '#2196F3';
            ctx.lineWidth = 3;
            ctx.beginPath();

            chartData.forEach((data, index) => {
                const x = padding.left + (index / (chartData.length - 1 || 1)) * chartWidth;
                const y = padding.top + chartHeight - (data.tokens / yAxisMax) * chartHeight;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();

            // Draw data points
            ctx.fillStyle = '#2196F3';
            chartData.forEach((data, index) => {
                const x = padding.left + (index / (chartData.length - 1 || 1)) * chartWidth;
                const y = padding.top + chartHeight - (data.tokens / yAxisMax) * chartHeight;

                ctx.beginPath();
                ctx.arc(x, y, 5, 0, 2 * Math.PI);
                ctx.fill();
            });
        }

        // Draw X-axis labels (dates)
        ctx.font = '12px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';

        chartData.forEach((data, index) => {
            const x = padding.left + (index / (chartData.length - 1 || 1)) * chartWidth;
            const y = padding.top + chartHeight + 20;

            // Format date (remove year if all same year)
            const dateStr = data.date;
            ctx.fillText(dateStr, x, y);
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
