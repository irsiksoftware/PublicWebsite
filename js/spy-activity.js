document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('spy-activity-tbody');
    const table = document.getElementById('spy-activity-table');
    const toolFilter = document.getElementById('tool-filter');
    const filterCount = document.getElementById('filter-count');

    let activityData = [];
    let filteredData = [];
    let currentSort = { column: null, ascending: true };
    let currentFilter = 'all';

    async function loadSpyActivity() {
        try {
            const response = await fetch('./data/spy-activity.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            activityData = await response.json();

            activityData = activityData.slice(0, 50);

            applyFilter();
        } catch (error) {
            console.error('Error loading spy activity:', error);
            tbody.innerHTML = '<tr><td colspan="6">Error loading activity data</td></tr>';
        }
    }

    function applyFilter() {
        if (currentFilter === 'all') {
            filteredData = activityData;
        } else {
            filteredData = activityData.filter(entry => entry.tool === currentFilter);
        }

        updateFilterCount();
        renderTable(filteredData);
    }

    function updateFilterCount() {
        const total = activityData.length;
        const showing = filteredData.length;

        if (currentFilter === 'all' || showing === total) {
            filterCount.textContent = '';
        } else {
            filterCount.textContent = `Showing ${showing} of ${total} commands`;
        }
    }

    function getCacheStatusIcon(status) {
        if (!status) return '';

        const normalized = status.toLowerCase();
        let icon = '';
        let className = '';
        let tooltip = status;

        if (normalized === 'hit') {
            icon = '✓';
            className = 'cache-hit';
            tooltip = 'Cache Hit';
        } else if (normalized === 'miss') {
            icon = '-';
            className = 'cache-miss';
            tooltip = 'Cache Miss';
        } else if (normalized === 'partial' || normalized === 'static') {
            icon = 'S';
            className = 'cache-static';
            tooltip = 'Static Cache';
        }

        return `<span class="cache-icon ${className}" title="${tooltip}">${icon}</span>`;
    }

    function renderTable(data) {
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No activity data available</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(entry => {
            const timestamp = new Date(entry.timestamp).toLocaleString();
            const cacheIcon = getCacheStatusIcon(entry.cacheStatus);
            return `
                <tr>
                    <td>${timestamp}</td>
                    <td>${escapeHtml(entry.agent)}</td>
                    <td>${escapeHtml(entry.command)}</td>
                    <td>${entry.exitCode}</td>
                    <td>${entry.duration}</td>
                    <td>${cacheIcon}</td>
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

        const sortedData = [...filteredData].sort((a, b) => {
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

    toolFilter.addEventListener('change', () => {
        currentFilter = toolFilter.value;
        applyFilter();
    });

    await loadSpyActivity();
});
