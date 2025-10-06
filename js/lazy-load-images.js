// Lazy loading for images with IntersectionObserver

document.addEventListener('DOMContentLoaded', function() {
    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
        // Fallback: Load all images immediately
        loadAllImages();
        return;
    }

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                loadImage(img);
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.01
    });

    // Observe all lazy images
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
        imageObserver.observe(img);
    });
});

function loadImage(img) {
    const src = img.getAttribute('data-src');
    if (!src) return;

    // Add loaded class for fade-in transition
    img.addEventListener('load', () => {
        img.classList.add('loaded');
    });

    // Handle error
    img.addEventListener('error', () => {
        img.classList.add('error');
        console.error(`Failed to load image: ${src}`);
    });

    // Swap to full image
    img.src = src;
    img.removeAttribute('data-src');
}

function loadAllImages() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
        loadImage(img);
    });
}
