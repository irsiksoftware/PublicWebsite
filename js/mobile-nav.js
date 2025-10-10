// Mobile navigation functionality
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    const navUl = nav.querySelector('ul');

    // Create hamburger button
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    hamburger.setAttribute('aria-label', 'Toggle navigation menu');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.innerHTML = '☰';

    // Insert hamburger before nav ul
    nav.insertBefore(hamburger, navUl);

    // Toggle menu
    hamburger.addEventListener('click', () => {
        const isOpen = navUl.classList.contains('open');
        navUl.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', !isOpen);
    });

    // Close menu when clicking a link
    navUl.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navUl.classList.remove('open');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && navUl.classList.contains('open')) {
            navUl.classList.remove('open');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    });

    // Keyboard navigation for hamburger menu
    hamburger.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navUl.classList.contains('open')) {
            navUl.classList.remove('open');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.focus();
        }
    });

    // Trap focus within open menu
    navUl.addEventListener('keydown', (e) => {
        if (!navUl.classList.contains('open')) return;

        const links = Array.from(navUl.querySelectorAll('a'));
        const firstLink = links[0];
        const lastLink = links[links.length - 1];

        if (e.key === 'Escape') {
            navUl.classList.remove('open');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.focus();
        } else if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstLink) {
                    e.preventDefault();
                    hamburger.focus();
                }
            } else {
                if (document.activeElement === lastLink) {
                    e.preventDefault();
                    hamburger.focus();
                }
            }
        }
    });

    // Focus first link when menu opens via keyboard
    hamburger.addEventListener('click', () => {
        if (navUl.classList.contains('open')) {
            setTimeout(() => {
                const firstLink = navUl.querySelector('a');
                if (firstLink) firstLink.focus();
            }, 50);
        }
    });
});
