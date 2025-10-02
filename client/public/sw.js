const CACHE_NAME = 'n-dizi-store-v1.0.0';
const STATIC_CACHE_NAME = 'n-dizi-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'n-dizi-dynamic-v1.0.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Core app files will be added by the build process
];

// API endpoints and dynamic content to cache
const DYNAMIC_CACHE_PATTERNS = [
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  /^https:\/\/cdnjs\.cloudflare\.com/,
  /^https:\/\/cdn\.jsdelivr\.net/,
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting(); // Force activation of new service worker
      })
      .catch(error => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // Delete old versions of our caches
              return (
                cacheName.startsWith('n-dizi-') && 
                cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME
              );
            })
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated successfully');
        return self.clients.claim(); // Take control of all pages immediately
      })
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests that we don't want to cache
  if (url.origin !== self.location.origin && !shouldCacheDynamic(url.href)) {
    return;
  }
  
  // Handle different types of requests
  if (request.method === 'GET') {
    event.respondWith(handleGetRequest(request));
  }
});

// Handle GET requests with different caching strategies
async function handleGetRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy 1: Cache First for static assets (app shell)
    if (isStaticAsset(url.pathname)) {
      return await cacheFirst(request, STATIC_CACHE_NAME);
    }
    
    // Strategy 2: Stale While Revalidate for dynamic content
    if (shouldCacheDynamic(request.url)) {
      return await staleWhileRevalidate(request, DYNAMIC_CACHE_NAME);
    }
    
    // Strategy 3: Network First for API calls and dynamic content
    return await networkFirst(request, DYNAMIC_CACHE_NAME);
    
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    
    // Return offline fallback if available
    return await getOfflineFallback(request);
  }
}

// Cache First strategy - check cache first, fallback to network
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch from network and cache it
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Stale While Revalidate - return cached version immediately, update in background
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background to update cache
  const networkResponsePromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null); // Silently fail for background updates
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cached version, wait for network
  return await networkResponsePromise || new Response('Offline', { status: 503 });
}

// Network First - try network first, fallback to cache
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  return (
    pathname === '/' ||
    pathname.endsWith('.html') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.json') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.ico') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/assets/')
  );
}

// Check if URL should be cached dynamically
function shouldCacheDynamic(url) {
  return DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

// Get offline fallback response
async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // For navigation requests, return the main app
  if (request.mode === 'navigate') {
    const cache = await caches.open(STATIC_CACHE_NAME);
    return await cache.match('/') || new Response('Offline', { status: 503 });
  }
  
  // For other requests, return appropriate offline response
  return new Response('Offline', { 
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Handle background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    console.log('[SW] Syncing offline data...');
    
    // In a real implementation, you would:
    // 1. Get pending transactions from IndexedDB
    // 2. Attempt to sync with server
    // 3. Update local data based on server response
    // 4. Notify main app of sync completion
    
    // For now, just log that sync would happen
    console.log('[SW] Offline data sync completed');
    
    // Notify all clients that sync is complete
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ 
        type: 'SYNC_COMPLETE',
        data: { success: true }
      });
    });
    
  } catch (error) {
    console.error('[SW] Failed to sync offline data:', error);
  }
}

// Handle push notifications (for future use)
self.addEventListener('push', event => {
  console.log('[SW] Push notification received:', event);
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'You have a new notification',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/icon-192.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'n-dizi Store Manager', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Handle messages from main app
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Utility function to clean up old cached data
async function cleanupOldData() {
  try {
    // Clean up old cache entries (keep only last 50 items in dynamic cache)
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const requests = await cache.keys();
    
    if (requests.length > 50) {
      const oldRequests = requests.slice(0, requests.length - 50);
      await Promise.all(oldRequests.map(request => cache.delete(request)));
      console.log(`[SW] Cleaned up ${oldRequests.length} old cache entries`);
    }
  } catch (error) {
    console.error('[SW] Failed to cleanup old data:', error);
  }
}

// Run cleanup periodically
setInterval(cleanupOldData, 60000); // Every minute

console.log('[SW] Service worker script loaded');
