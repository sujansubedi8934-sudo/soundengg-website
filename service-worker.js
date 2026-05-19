const CACHE_NAME = 'soundengg-cache-v3.4';

// Critical assets to cache on install for full offline startup
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/app.html',
    '/manifest.json',
    '/assets/css/styles.css',
    '/assets/js/main.js',
    '/assets/js/blog-data.js',
    '/assets/img/logo.png',
    '/assets/img/logo-dark.png'
];

// Install Event: Cache critical assets
self.addEventListener('install', event => {
    self.skipWaiting(); // Force the waiting service worker to become active immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[Service Worker] Pre-caching offline assets...');
            // Resilient individual caching: prevents one 404 from failing the entire registration
            return Promise.allSettled(
                URLS_TO_CACHE.map(url => {
                    return cache.add(url).catch(err => {
                        console.warn(`[Service Worker] Failed to cache asset: ${url}`, err);
                    });
                })
            );
        })
    );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Claim all clients immediately so the new worker takes control
    );
});

// Fetch Event: Network-First strategy
// Always try to fetch the freshest files from the network when online.
// If the network request fails (user is offline), instantly fall back to the cached copy.
self.addEventListener('fetch', event => {
    // Only intercept local GET requests
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // If we get a valid response, update the cache copy in the background
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // Network failed (we are offline) -> instantly load from cache!
                console.log('[Service Worker] Offline mode - Loading from cache:', event.request.url);
                return caches.match(event.request);
            })
    );
});
