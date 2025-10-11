/**
 * Hero Carousel - Auto-rotating background images
 * Automatically cycles through hero banner images with smooth transitions
 *
 * @example
 * // Automatically initializes on page load
 * // Requires .hero-section element and hero banner images in /pictures/
 */
(function() {
    const heroImages = [
        '/pictures/hero_banner_4.png',
        '/pictures/hero_banner_9.png',
        '/pictures/hero_banner_14.png',
        '/pictures/hero_banner_19.png',
        '/pictures/hero_banner_24.png'
    ];

    let currentIndex = 0;
    const heroSection = document.querySelector('.hero-section');

    if (!heroSection) return;

    /**
     * Sets the background image of the hero section
     * @param {number} index - Index of the hero image in the heroImages array
     */
    function setBackgroundImage(index) {
        if (heroSection) {
            heroSection.style.setProperty('--hero-bg-image', `url('${heroImages[index]}')`);
        }
    }

    /**
     * Rotates to the next image in the carousel
     * Cycles back to the first image after reaching the end
     */
    function rotateImage() {
        currentIndex = (currentIndex + 1) % heroImages.length;
        setBackgroundImage(currentIndex);
    }

    // Set initial image
    setBackgroundImage(0);

    // Rotate every 5 seconds
    setInterval(rotateImage, 5000);
})();
