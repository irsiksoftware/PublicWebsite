// Support Tickets Module
(function() {
    'use strict';

    // Mock tickets data
    const mockTickets = [
        {
            id: 127,
            subject: 'Login issue on mobile devices',
            status: 'resolved',
            priority: 'medium',
            category: 'technical',
            created: '2025-10-05',
            updated: '2025-10-08'
        },
        {
            id: 128,
            subject: 'Request for invoice copy',
            status: 'open',
            priority: 'low',
            category: 'billing',
            created: '2025-10-08',
            updated: '2025-10-08'
        },
        {
            id: 129,
            subject: 'Feature request: Dark mode',
            status: 'in-progress',
            priority: 'medium',
            category: 'feature',
            created: '2025-10-07',
            updated: '2025-10-09'
        },
        {
            id: 130,
            subject: 'API timeout errors',
            status: 'open',
            priority: 'high',
            category: 'technical',
            created: '2025-10-09',
            updated: '2025-10-09'
        }
    ];

    let currentFilter = 'all';

    // Load and display tickets
    function loadTickets() {
        const ticketList = document.getElementById('ticketList');
        if (!ticketList) return;

        setTimeout(() => {
            const filtered = currentFilter === 'all'
                ? mockTickets
                : mockTickets.filter(t => t.status === currentFilter);

            ticketList.innerHTML = '';

            if (filtered.length === 0) {
                ticketList.innerHTML = '<div class="loading">No tickets found</div>';
                return;
            }

            filtered.forEach(ticket => {
                const ticketItem = document.createElement('div');
                ticketItem.className = 'ticket-item';

                const priorityClass = 'priority-' + ticket.priority;
                const statusText = ticket.status.split('-').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');

                ticketItem.innerHTML = `
                    <div class="ticket-header">
                        <h3>#${ticket.id} - ${ticket.subject}</h3>
                        <span class="ticket-priority ${priorityClass}">${ticket.priority}</span>
                    </div>
                    <div class="ticket-meta">
                        <div>Status: <strong>${statusText}</strong></div>
                        <div>Created: ${new Date(ticket.created).toLocaleDateString()}</div>
                        <div>Last updated: ${new Date(ticket.updated).toLocaleDateString()}</div>
                    </div>
                `;

                ticketItem.addEventListener('click', () => viewTicket(ticket));
                ticketList.appendChild(ticketItem);
            });
        }, 500);
    }

    // View ticket details (mock)
    function viewTicket(ticket) {
        alert('In a production environment, this would show details for ticket #' + ticket.id);
        // In production: Open modal or navigate to ticket details page
    }

    // Filter tickets by status
    function filterTickets(status) {
        currentFilter = status;

        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-status="${status}"]`).classList.add('active');

        loadTickets();
    }

    // Submit new ticket
    function submitTicket(formData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newTicket = {
                    id: mockTickets.length + 100,
                    subject: formData.get('subject'),
                    status: 'open',
                    priority: formData.get('priority'),
                    category: formData.get('category'),
                    description: formData.get('description'),
                    created: new Date().toISOString().split('T')[0],
                    updated: new Date().toISOString().split('T')[0]
                };

                mockTickets.unshift(newTicket);
                resolve(newTicket);
            }, 800);
        });
    }

    // Initialize support page
    document.addEventListener('DOMContentLoaded', function() {
        loadTickets();

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                filterTickets(this.getAttribute('data-status'));
            });
        });

        // New ticket modal
        const modal = document.getElementById('newTicketModal');
        const newTicketBtn = document.getElementById('newTicketBtn');
        const closeModal = document.getElementById('closeModal');
        const cancelTicket = document.getElementById('cancelTicket');
        const newTicketForm = document.getElementById('newTicketForm');

        if (newTicketBtn) {
            newTicketBtn.addEventListener('click', function() {
                modal.style.display = 'flex';
            });
        }

        if (closeModal) {
            closeModal.addEventListener('click', function() {
                modal.style.display = 'none';
                newTicketForm.reset();
            });
        }

        if (cancelTicket) {
            cancelTicket.addEventListener('click', function() {
                modal.style.display = 'none';
                newTicketForm.reset();
            });
        }

        // Close modal on background click
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    newTicketForm.reset();
                }
            });
        }

        // Submit new ticket
        if (newTicketForm) {
            newTicketForm.addEventListener('submit', async function(e) {
                e.preventDefault();

                const formData = new FormData(this);
                const submitBtn = this.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';

                try {
                    const ticket = await submitTicket(formData);
                    modal.style.display = 'none';
                    this.reset();
                    loadTickets();
                    alert('Ticket #' + ticket.id + ' created successfully!');
                } catch (error) {
                    alert('Error creating ticket. Please try again.');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Ticket';
                }
            });
        }
    });
})();
