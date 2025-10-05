/**
 * Image Lightbox with Keyboard Navigation
 *
 * Features:
 * - Click image to open fullscreen lightbox
 * - Navigation with prev/next arrows
 * - Keyboard support (Esc to close, Left/Right arrows to navigate)
 * - Image counter display
 * - Prevents body scroll when open
 * - Preloads adjacent images
 * - Click outside image to close
 */

(function() {
  'use strict';

  // State
  let currentIndex = 0;
  let images = [];
  let isOpen = false;

  // DOM elements
  let lightbox = null;
  let lightboxImage = null;
  let lightboxCounter = null;
  let prevButton = null;
  let nextButton = null;

  /**
   * Initialize lightbox
   */
  function init() {
    // Get all gallery images
    const galleryImages = document.querySelectorAll('.gallery__image');
    images = Array.from(galleryImages);

    if (images.length === 0) return;

    // Create lightbox structure
    createLightboxDOM();

    // Add click handlers to gallery images
    images.forEach((img, index) => {
      img.addEventListener('click', () => openLightbox(index));
    });

    // Add event listeners
    setupEventListeners();
  }

  /**
   * Create lightbox DOM structure
   */
  function createLightboxDOM() {
    // Create lightbox container
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Image lightbox');

    // Create content container
    const content = document.createElement('div');
    content.className = 'lightbox__content';

    // Create image
    lightboxImage = document.createElement('img');
    lightboxImage.className = 'lightbox__image';
    lightboxImage.alt = 'Lightbox image';

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'lightbox__close';
    closeButton.innerHTML = '×';
    closeButton.setAttribute('aria-label', 'Close lightbox');
    closeButton.addEventListener('click', closeLightbox);

    // Create prev button
    prevButton = document.createElement('button');
    prevButton.className = 'lightbox__arrow lightbox__arrow--prev';
    prevButton.innerHTML = '‹';
    prevButton.setAttribute('aria-label', 'Previous image');
    prevButton.addEventListener('click', showPrevImage);

    // Create next button
    nextButton = document.createElement('button');
    nextButton.className = 'lightbox__arrow lightbox__arrow--next';
    nextButton.innerHTML = '›';
    nextButton.setAttribute('aria-label', 'Next image');
    nextButton.addEventListener('click', showNextImage);

    // Create counter
    lightboxCounter = document.createElement('div');
    lightboxCounter.className = 'lightbox__counter';
    lightboxCounter.setAttribute('aria-live', 'polite');

    // Assemble DOM
    content.appendChild(lightboxImage);
    lightbox.appendChild(content);
    lightbox.appendChild(closeButton);
    lightbox.appendChild(prevButton);
    lightbox.appendChild(nextButton);
    lightbox.appendChild(lightboxCounter);

    // Add to body
    document.body.appendChild(lightbox);

    // Click outside to close
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Keyboard navigation
    document.addEventListener('keydown', handleKeydown);
  }

  /**
   * Handle keyboard events
   */
  function handleKeydown(e) {
    if (!isOpen) return;

    switch(e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        showPrevImage();
        break;
      case 'ArrowRight':
        showNextImage();
        break;
    }
  }

  /**
   * Open lightbox at specific index
   */
  function openLightbox(index) {
    currentIndex = index;
    isOpen = true;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Show lightbox
    lightbox.classList.add('active');

    // Load image
    loadImage(currentIndex);

    // Update counter
    updateCounter();

    // Preload adjacent images
    preloadAdjacentImages();

    // Focus management
    lightbox.focus();
  }

  /**
   * Close lightbox
   */
  function closeLightbox() {
    isOpen = false;

    // Restore body scroll
    document.body.style.overflow = '';

    // Hide lightbox
    lightbox.classList.remove('active');
  }

  /**
   * Show previous image
   */
  function showPrevImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    loadImage(currentIndex, 'left');
    updateCounter();
    preloadAdjacentImages();
  }

  /**
   * Show next image
   */
  function showNextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    loadImage(currentIndex, 'right');
    updateCounter();
    preloadAdjacentImages();
  }

  /**
   * Load image at index with optional slide direction
   */
  function loadImage(index, direction = null) {
    const img = images[index];

    // Remove animation classes
    lightboxImage.classList.remove('slide-in-left', 'slide-in-right');

    // Add slide animation
    if (direction === 'left') {
      lightboxImage.classList.add('slide-in-left');
    } else if (direction === 'right') {
      lightboxImage.classList.add('slide-in-right');
    }

    // Set image source
    lightboxImage.src = img.src;
    lightboxImage.alt = img.alt;
  }

  /**
   * Update counter display
   */
  function updateCounter() {
    lightboxCounter.textContent = `${currentIndex + 1} / ${images.length}`;
  }

  /**
   * Preload adjacent images for smooth navigation
   */
  function preloadAdjacentImages() {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    const nextIndex = (currentIndex + 1) % images.length;

    // Preload previous image
    const prevImg = new Image();
    prevImg.src = images[prevIndex].src;

    // Preload next image
    const nextImg = new Image();
    nextImg.src = images[nextIndex].src;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
