const CACHE_NAME = 'audiomate-cache-v1';

// All critical assets needed to run the dashboard offline
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/app.html',
    '/manifest.json',
    '/assets/css/styles.css',
    '/assets/js/main.js',
    '/assets/js/blog-data.js',
    '/assets/img/logo.png',
    '/assets/img/logo-dark.png',
    '/assets/img/sponsor-placeholder.png',
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
];

// Install Event - Download all files into cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

// Activate Event - Clean up old caches if we update the version
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch Event - Serve from Cache first, fallback to Network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return the cached response immediately (Offline Support)
                if (response) {
                    return response;
                }
                
                // Not in cache - fetch from network
                return fetch(event.request).then(
                    function(response) {
                        // Check if we received a valid response
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response because it's a stream and can only be consumed once
                        var responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                // Add fetched asset to cache for next time
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});
