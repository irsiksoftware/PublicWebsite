// Documents Module
(function() {
    'use strict';

    // Mock documents data
    const mockDocuments = [
        {
            id: 1,
            name: 'Service Agreement 2025',
            category: 'contracts',
            size: '256 KB',
            modified: '2025-10-01',
            type: 'pdf'
        },
        {
            id: 2,
            name: 'Project Requirements Specification',
            category: 'specifications',
            size: '1.2 MB',
            modified: '2025-09-28',
            type: 'pdf'
        },
        {
            id: 3,
            name: 'Monthly Progress Report - September',
            category: 'reports',
            size: '512 KB',
            modified: '2025-09-30',
            type: 'pdf'
        },
        {
            id: 4,
            name: 'Invoice INV-2025-045',
            category: 'invoices',
            size: '128 KB',
            modified: '2025-10-05',
            type: 'pdf'
        },
        {
            id: 5,
            name: 'Technical Architecture Document',
            category: 'specifications',
            size: '890 KB',
            modified: '2025-09-15',
            type: 'pdf'
        },
        {
            id: 6,
            name: 'NDA Agreement',
            category: 'contracts',
            size: '180 KB',
            modified: '2025-08-20',
            type: 'pdf'
        }
    ];

    let filteredDocuments = [...mockDocuments];

    // Get icon based on file type
    function getFileIcon(type) {
        const icons = {
            pdf: '\uD83D\uDCC4',
            doc: '\uD83D\uDCC3',
            xls: '\uD83D\uDCC8',
            txt: '\uD83D\uDCDD',
            zip: '\uD83D\uDDC4'
        };
        return icons[type] || '\uD83D\uDCC1';
    }

    // Load and display documents
    function loadDocuments() {
        const documentList = document.getElementById('documentList');
        if (!documentList) return;

        setTimeout(() => {
            documentList.innerHTML = '';

            if (filteredDocuments.length === 0) {
                documentList.innerHTML = '<div class="loading">No documents found</div>';
                return;
            }

            filteredDocuments.forEach(doc => {
                const docItem = document.createElement('div');
                docItem.className = 'document-item';
                docItem.innerHTML = `
                    <div class="document-icon">${getFileIcon(doc.type)}</div>
                    <h3>${doc.name}</h3>
                    <div class="document-meta">
                        <div>${doc.size}</div>
                        <div>Modified: ${new Date(doc.modified).toLocaleDateString()}</div>
                        <div style="margin-top: 0.5rem; text-transform: capitalize;">${doc.category}</div>
                    </div>
                `;
                docItem.addEventListener('click', () => downloadDocument(doc));
                documentList.appendChild(docItem);
            });
        }, 500);
    }

    // Filter documents
    function filterDocuments(searchTerm, category) {
        filteredDocuments = mockDocuments.filter(doc => {
            const matchesSearch = !searchTerm ||
                doc.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = !category || doc.category === category;
            return matchesSearch && matchesCategory;
        });
        loadDocuments();
    }

    // Download document (mock)
    function downloadDocument(doc) {
        alert('In a production environment, this would download: ' + doc.name);
        // In production: window.location.href = '/api/documents/download/' + doc.id;
    }

    // Initialize document page
    document.addEventListener('DOMContentLoaded', function() {
        loadDocuments();

        // Search functionality
        const searchInput = document.getElementById('searchDocs');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                const category = document.getElementById('filterCategory').value;
                filterDocuments(e.target.value, category);
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('filterCategory');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', function(e) {
                const searchTerm = document.getElementById('searchDocs').value;
                filterDocuments(searchTerm, e.target.value);
            });
        }
    });
})();
