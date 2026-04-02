const CACHE_NAME = 'hk-schools-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json'
];

// Install Event - Cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch Event - Serve from cache if available, fallback to network
self.addEventListener('fetch', event => {
    // We don't want to cache the API call responses forever, just the app shell.
    if (event.request.url.includes('api.allorigins.win')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});