// Service Worker for MythSeeker - Offline Support and Caching
const CACHE_NAME = 'mythseeker-v1.0.0';
const STATIC_CACHE = 'mythseeker-static-v1.0.0';
const DYNAMIC_CACHE = 'mythseeker-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Firebase and external API requests
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('googleapis') ||
      url.hostname.includes('vertex')) {
    return;
  }

  // Handle different types of requests
  if (request.destination === 'document' || request.destination === '') {
    // HTML pages - try cache first, then network
    event.respondWith(handlePageRequest(request));
  } else if (request.destination === 'script' || 
             request.destination === 'style' ||
             request.destination === 'image') {
    // Static assets - cache first, then network
    event.respondWith(handleStaticAssetRequest(request));
  } else {
    // Other requests - network first, then cache
    event.respondWith(handleDynamicRequest(request));
  }
});

// Handle page requests (HTML)
async function handlePageRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Error handling page request:', error);
    
    // Return offline page if available
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback to basic offline message
    return new Response(
      '<html><body><h1>MythSeeker</h1><p>You are offline. Please check your connection and try again.</p></body></html>',
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Handle static asset requests
async function handleStaticAssetRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Error handling static asset request:', error);
    throw error;
  }
}

// Handle dynamic requests (API calls, etc.)
async function handleDynamicRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Error handling dynamic request:', error);
    
    // Try cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// Handle background sync
async function handleBackgroundSync() {
  try {
    // Get stored offline actions
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        // Retry the action
        await retryOfflineAction(action);
        
        // Remove from offline storage if successful
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error('Service Worker: Failed to retry offline action:', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Error in background sync:', error);
  }
}

// Store offline action for later retry
async function storeOfflineAction(action) {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction('offlineActions', 'readwrite');
    const store = tx.objectStore('offlineActions');
    await store.add(action);
  } catch (error) {
    console.error('Service Worker: Error storing offline action:', error);
  }
}

// Get stored offline actions
async function getOfflineActions() {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction('offlineActions', 'readonly');
    const store = tx.objectStore('offlineActions');
    return await store.getAll();
  } catch (error) {
    console.error('Service Worker: Error getting offline actions:', error);
    return [];
  }
}

// Remove offline action
async function removeOfflineAction(actionId) {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction('offlineActions', 'readwrite');
    const store = tx.objectStore('offlineActions');
    await store.delete(actionId);
  } catch (error) {
    console.error('Service Worker: Error removing offline action:', error);
  }
}

// Open IndexedDB for offline storage
async function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MythSeekerOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store for offline actions
      if (!db.objectStoreNames.contains('offlineActions')) {
        const store = db.createObjectStore('offlineActions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Retry offline action
async function retryOfflineAction(action) {
  const { method, url, body, headers } = action;
  
  const fetchOptions = {
    method,
    headers: headers || {},
  };
  
  if (body && method !== 'GET') {
    fetchOptions.body = body;
  }
  
  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response;
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New adventure awaits!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.ico'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('MythSeeker', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'STORE_OFFLINE_ACTION') {
    event.waitUntil(storeOfflineAction(event.data.action));
  }
});

console.log('Service Worker: Loaded'); 