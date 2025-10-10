const CACHE_NAME = 'irsiksoftware-v1';
const RUNTIME_CACHE = 'runtime-cache';

const STATIC_ASSETS = [
  './',
  './index.html',
  './contact.html',
  './tetris.html',
  './terms-of-service.html',
  './privacy-policy.html',
  './session-timeline.html',
  './offline.html',
  './css/variables.css',
  './css/reset.css',
  './css/styles.css',
  './css/nav.css',
  './css/session-detail-modal.css',
  './css/accessibility.css',
  './css/responsive.css',
  './css/skeleton.css',
  './css/lazy-load.css',
  './css/agent-metrics-table.css',
  './css/roles-overview.css',
  './css/agent-profile-card.css',
  './css/agent-search.css',
  './css/theme-toggle.css',
  './css/services.css',
  './css/portfolio.css',
  './css/testimonials.css',
  './css/footer.css',
  './css/technologies.css',
  './js/agent-metrics-table.js',
  './js/agent-profile.js',
  './js/agent-selector.js',
  './js/token-usage-chart.js',
  './js/theme-toggle.js',
  './js/tetromino-shapes.js',
  './js/table-keyboard-navigation.js',
  './js/tetris.js',
  './js/success-rate-chart.js',
  './js/sticky-header.js',
  './js/spy-activity.js',
  './js/session-timeline.js',
  './js/session-detail-modal.js',
  './js/roles-overview.js',
  './js/mobile-nav.js',
  './js/lazy-load-images.js',
  './js/hero-carousel.js',
  './js/data-refresh.js',
  './js/data-loader.js',
  './js/charts.js',
  './js/back-to-top.js',
  './js/cache-performance-chart.js',
  './js/audit-sessions.js'
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
