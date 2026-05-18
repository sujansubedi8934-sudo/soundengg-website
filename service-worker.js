// SoundEngg Self-Destructing Service Worker
// Permanently removes the PWA cache layer and unregisters itself to prevent stale cache loops.

self.addEventListener('install', event => {
    self.skipWaiting(); // Force activation immediately
});

self.addEventListener('activate', event => {
    event.waitUntil(
        // 1. Delete all PWA caches
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    console.log('Deleting cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        })
        // 2. Unregister from the browser
        .then(() => {
            console.log('Service Worker self-destruct complete. Unregistering...');
            return self.registration.unregister();
        })
        // 3. Claim clients and trigger a clean reload
        .then(() => {
            return self.clients.matchAll();
        })
        .then(clients => {
            clients.forEach(client => {
                if (client.url && 'navigate' in client) {
                    client.navigate(client.url);
                }
            });
        })
    );
});
