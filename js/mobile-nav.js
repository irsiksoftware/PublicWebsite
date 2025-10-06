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
});
