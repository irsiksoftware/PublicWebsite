/**
 * @fileoverview Chart.js Initialization and Examples
 * Demonstrates Chart.js v4 integration with example bar charts.
 * Provides sample implementation for creating responsive charts.
 *
 * @module charts
 * @requires chart.js
 *
 * @example
 * // Chart automatically initializes on DOMContentLoaded
 * // Ensure canvas element exists:
 * // <canvas id="exampleBarChart"></canvas>
 */

/**
 * Initializes example bar chart
 * @function
 */
document.addEventListener('DOMContentLoaded', function() {
    // Example bar chart
    const ctx = document.getElementById('exampleBarChart');

    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['January', 'February', 'March', 'April', 'May', 'June'],
                datasets: [{
                    label: 'Monthly Sales',
                    data: [12, 19, 3, 5, 2, 3],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
});
