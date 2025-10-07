// Hero Carousel - Auto-rotating background images
(function() {
    const heroImages = [
        './pictures/hero_banner_4.png',
        './pictures/hero_banner_9.png',
        './pictures/hero_banner_14.png',
        './pictures/hero_banner_19.png',
        './pictures/hero_banner_24.png'
    ];

    let currentIndex = 0;
    const heroSection = document.querySelector('.hero-section');

    if (!heroSection) return;

    function setBackgroundImage(index) {
        if (heroSection) {
            heroSection.style.setProperty('--hero-bg-image', `url('${heroImages[index]}')`);
        }
    }

    function rotateImage() {
        currentIndex = (currentIndex + 1) % heroImages.length;
        setBackgroundImage(currentIndex);
    }

    // Set initial image
    setBackgroundImage(0);

    // Rotate every 5 seconds
    setInterval(rotateImage, 5000);
})();
