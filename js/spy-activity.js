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
    const rowsPerPage = 50;

    async function loadSpyActivity() {
        // Show skeleton loading state
        showTableSkeleton(tbody, 7);

        try {
            const response = await fetch('./data/spy-activity.json');
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Resource not found: ./data/spy-activity.json');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            activityData = await response.json();

            activityData = activityData.slice(0, 50);

            applyFilter();
        } catch (error) {
            console.error('Error loading spy activity:', error);

            // Clear existing content
            tbody.innerHTML = '';

            // Create error message
            const errorRow = document.createElement('tr');
            const errorCell = document.createElement('td');
            errorCell.colSpan = 7;
            errorCell.style.padding = '20px';

            const errorContainer = document.createElement('div');
            errorContainer.style.cssText = `
                padding: 20px;
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
                message.textContent = `Error loading spy activity data: ${error.message}`;
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
            retryButton.addEventListener('click', () => loadSpyActivity());
            retryButton.addEventListener('mouseenter', () => {
                retryButton.style.backgroundColor = '#0056b3';
            });
            retryButton.addEventListener('mouseleave', () => {
                retryButton.style.backgroundColor = '#007bff';
            });

            errorContainer.appendChild(title);
            errorContainer.appendChild(message);
            errorContainer.appendChild(retryButton);
            errorCell.appendChild(errorContainer);
            errorRow.appendChild(errorCell);
            tbody.appendChild(errorRow);
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
            tbody.innerHTML = '<tr><td colspan="7">No activity data available</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(entry => {
            const timestamp = new Date(entry.timestamp).toLocaleString();
            const cacheIcon = getCacheStatusIcon(entry.cacheStatus);
            return `
                <tr>
                    <td>${timestamp}</td>
                    <td>${escapeHtml(entry.agent)}</td>
                    <td>${escapeHtml(entry.tool || '')}</td>
                    <td>${escapeHtml(entry.command)}</td>
                    <td>${entry.exitCode}</td>
                    <td>${entry.duration}</td>
                    <td>${cacheIcon}</td>
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

    function showTableSkeleton(tbody, columnCount) {
        tbody.innerHTML = '';

        // Create 5 skeleton rows
        for (let i = 0; i < 5; i++) {
            const row = document.createElement('tr');
            row.className = 'skeleton-table-row';

            for (let j = 0; j < columnCount; j++) {
                const cell = document.createElement('td');
                const skeletonDiv = document.createElement('div');
                skeletonDiv.className = 'skeleton skeleton-table-cell skeleton-table-cell-medium';
                cell.appendChild(skeletonDiv);
                row.appendChild(cell);
            }

            tbody.appendChild(row);
        }
    }
});
