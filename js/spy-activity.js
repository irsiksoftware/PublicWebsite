document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('spy-activity-tbody');
    const table = document.getElementById('spy-activity-table');

    let activityData = [];
    let currentSort = { column: null, ascending: true };

    async function loadSpyActivity() {
        try {
            const response = await fetch('./data/spy-activity.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            activityData = await response.json();

            activityData = activityData.slice(0, 50);

            renderTable(activityData);
        } catch (error) {
            console.error('Error loading spy activity:', error);
            tbody.innerHTML = '<tr><td colspan="6">Error loading activity data</td></tr>';
        }
    }

    function renderTable(data) {
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No activity data available</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(entry => {
            const timestamp = new Date(entry.timestamp).toLocaleString();
            return `
                <tr>
                    <td>${timestamp}</td>
                    <td>${escapeHtml(entry.agent)}</td>
                    <td>${escapeHtml(entry.command)}</td>
                    <td>${entry.exitCode}</td>
                    <td>${entry.duration}</td>
                    <td>${escapeHtml(entry.cacheStatus)}</td>
                </tr>
            `;
        }).join('');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function sortData(column) {
        if (currentSort.column === column) {
            currentSort.ascending = !currentSort.ascending;
        } else {
            currentSort.column = column;
            currentSort.ascending = true;
        }

        const sortedData = [...activityData].sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            if (column === 'timestamp') {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            } else if (column === 'exitCode' || column === 'duration') {
                valA = Number(valA);
                valB = Number(valB);
            } else {
                valA = String(valA).toLowerCase();
                valB = String(valB).toLowerCase();
            }

            if (valA < valB) return currentSort.ascending ? -1 : 1;
            if (valA > valB) return currentSort.ascending ? 1 : -1;
            return 0;
        });

        renderTable(sortedData);
        updateSortIndicators(column);
    }

    function updateSortIndicators(activeColumn) {
        const headers = table.querySelectorAll('th');
        headers.forEach(th => {
            const arrow = th.querySelector('.sort-arrow');
            if (arrow) {
                const column = th.dataset.column;
                if (column === activeColumn) {
                    arrow.textContent = currentSort.ascending ? ' ▲' : ' ▼';
                    arrow.classList.add('active');
                } else {
                    arrow.textContent = '';
                    arrow.classList.remove('active');
                }
            }
        });
    }

    table.querySelectorAll('th[data-column]').forEach(th => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => {
            const column = th.dataset.column;
            sortData(column);
        });
    });

    await loadSpyActivity();
});
