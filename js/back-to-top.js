// Back to Top button functionality
(function() {
    // Create button element
    const button = document.createElement('button');
    button.id = 'back-to-top';
    button.setAttribute('aria-label', 'Back to top');
    button.innerHTML = '↑';
    button.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        background-color: #007bff;
        color: white;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    `;

    // Add hover effect
    button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = '#0056b3';
    });
    button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = '#007bff';
    });

    // Append button to body
    document.body.appendChild(button);

    // Show/hide button based on scroll position
    function toggleButtonVisibility() {
        if (window.scrollY > 500) {
            button.style.opacity = '1';
            button.style.visibility = 'visible';
        } else {
            button.style.opacity = '0';
            button.style.visibility = 'hidden';
        }
    }

    // Scroll to top on click
    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Listen to scroll events
    window.addEventListener('scroll', toggleButtonVisibility);

    // Initial check
    toggleButtonVisibility();
})();
