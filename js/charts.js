// Chart.js initialization for development metrics
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('metricsChart');

    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Agent A', 'Agent B', 'Agent C', 'Agent D', 'Agent E'],
                datasets: [{
                    label: 'Tasks Completed',
                    data: [12, 19, 8, 15, 22],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(255, 99, 132, 0.8)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 5
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Agent Performance Metrics'
                    }
                }
            }
        });
    }
});
