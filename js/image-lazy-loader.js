/**
 * Image lazy loading utility with placeholder blur-up effect
 * @module image-lazy-loader
 */

/**
 * Initialize lazy loading for images with data-src attribute
 * Supports responsive images with srcset and placeholder blur-up
 */
export function initLazyLoading() {
  if ('IntersectionObserver' in window) {
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

    const lazyImages = document.querySelectorAll('img[data-src], picture source[data-srcset]');
    lazyImages.forEach(img => imageObserver.observe(img.tagName === 'SOURCE' ? img.parentElement.querySelector('img') : img));
  } else {
    // Fallback for browsers without IntersectionObserver
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => loadImage(img));
  }
}

/**
 * Load a lazy image and apply fade-in effect
 * @param {HTMLImageElement} img - The image element to load
 */
function loadImage(img) {
  const picture = img.closest('picture');

  if (picture) {
    // Load all sources in the picture element
    const sources = picture.querySelectorAll('source[data-srcset]');
    sources.forEach(source => {
      source.srcset = source.dataset.srcset;
      source.removeAttribute('data-srcset');
    });
  }

  if (img.dataset.src) {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
  }

  if (img.dataset.srcset) {
    img.srcset = img.dataset.srcset;
    img.removeAttribute('data-srcset');
  }

  img.addEventListener('load', () => {
    img.classList.add('loaded');
  }, { once: true });
}

/**
 * Create responsive picture element with lazy loading
 * @param {Object} options - Configuration options
 * @param {string} options.baseName - Base name of the image (without size suffix)
 * @param {string} options.alt - Alt text for the image
 * @param {string} [options.className] - Optional CSS class for the img element
 * @param {boolean} [options.eager=false] - Load eagerly instead of lazy
 * @returns {HTMLPictureElement} The picture element
 */
export function createResponsiveImage({ baseName, alt, className = '', eager = false }) {
  const picture = document.createElement('picture');

  // WebP sources with responsive sizes
  const webpSources = [
    { media: '(min-width: 1024px)', srcset: `./public/images/${baseName}-large.webp` },
    { media: '(min-width: 768px)', srcset: `./public/images/${baseName}-medium.webp` },
    { media: '(min-width: 480px)', srcset: `./public/images/${baseName}-small.webp` }
  ];

  webpSources.forEach(({ media, srcset }) => {
    const source = document.createElement('source');
    source.type = 'image/webp';
    source.media = media;
    if (eager) {
      source.srcset = srcset;
    } else {
      source.dataset.srcset = srcset;
    }
    picture.appendChild(source);
  });

  // Fallback img element
  const img = document.createElement('img');
  if (eager) {
    img.src = `./public/images/${baseName}.jpg`;
  } else {
    img.src = `./public/images/${baseName}-placeholder.webp`;
    img.dataset.src = `./public/images/${baseName}.jpg`;
    img.classList.add('lazy-image');
  }
  img.alt = alt;
  if (className) {
    img.className = className;
  }
  img.loading = eager ? 'eager' : 'lazy';

  picture.appendChild(img);

  return picture;
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLazyLoading);
} else {
  initLazyLoading();
}
