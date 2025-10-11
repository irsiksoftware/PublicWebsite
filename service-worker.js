const CACHE_NAME = 'irsiksoftware-v5';
const RUNTIME_CACHE = 'runtime-cache-v5';

const STATIC_ASSETS = [
  './',
  './index.html',
  './pages/contact.html',
  './games/browser/tetris.html',
  './pages/legal/terms-of-service.html',
  './pages/legal/privacy-policy.html',
  './offline.html',
  './css/variables.css',
  './css/reset.css',
  './css/styles.css',
  './css/nav.css',
  './css/accessibility.css',
  './css/responsive.css',
  './css/lazy-load.css',
  './css/theme-toggle.css',
  './css/services.css',
  './css/portfolio.css',
  './css/testimonials.css',
  './css/technologies.css',
  './css/footer.css',
  './css/cookie-consent.css',
  './js/back-to-top.js',
  './js/hero-carousel.js',
  './js/lazy-load-images.js',
  './js/mobile-nav.js',
  './js/sticky-header.js',
  './js/table-keyboard-navigation.js',
  './js/tetris.js',
  './js/tetromino-shapes.js',
  './js/theme-toggle.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache-first for static assets, network-first for API calls
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first strategy for API calls and data files
  if (url.pathname.includes('/api/') || url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Only cache successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response before caching
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('./offline.html');
            }
          });
      })
  );
});
