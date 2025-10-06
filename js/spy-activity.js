document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('spy-activity-tbody');
    const table = document.getElementById('spy-activity-table');
    const toolFilter = document.getElementById('tool-filter');
    const filterCount = document.getElementById('filter-count');

    let activityData = [];
    let filteredData = [];
    let currentSort = { column: null, ascending: true };
    let currentFilter = 'all';
    let currentPage = 1;
    const rowsPerPage = 20;

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

        currentPage = 1;
        updateFilterCount();
        renderCurrentPage();
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

    function renderCurrentPage() {
        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);

        renderTable(pageData);
        updatePaginationControls(totalPages);
    }

    function updatePaginationControls(totalPages) {
        const pageInfo = document.getElementById('page-info');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    function goToPage(direction) {
        if (direction === 'prev' && currentPage > 1) {
            currentPage--;
        } else if (direction === 'next') {
            const totalPages = Math.ceil(filteredData.length / rowsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
            }
        }
        renderCurrentPage();
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

        filteredData.sort((a, b) => {
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

        currentPage = 1;
        renderCurrentPage();
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

    document.getElementById('prev-page').addEventListener('click', () => goToPage('prev'));
    document.getElementById('next-page').addEventListener('click', () => goToPage('next'));

    await loadSpyActivity();
});
