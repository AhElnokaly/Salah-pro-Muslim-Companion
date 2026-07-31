const CACHE_NAME = 'muslim-companion-cache-v5';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './muslim_companion_icon.jpg',
  './audio/azan1.mp3',
  './audio/azan2.mp3',
  './audio/azan3.mp3',
  './audio/azan4.mp3',
  './audio/azan8.mp3',
  './audio/azan20.mp3',
  './audio/azan22.mp3'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.error('[Service Worker] Pre-cache failed:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Only handle local GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Ignore chrome-extension or other non-http schemes
  if (!url.protocol.startsWith('http')) return;

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Silence network errors when offline
          });
          
          return cachedResponse || fetchPromise;
        });
      })
    );
  } else {
    // For external assets (like google fonts/unsplash images), try network first, then cache
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});

// Push Event
self.addEventListener('push', (event) => {
  let data = { title: 'رفيق المسلم 🕌', body: 'تنبيه طاعة جديد!' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || './icon-192.png',
    badge: './icon-192.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    data: data.data || { url: './' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const prayerName = event.notification.data?.prayerName;
  const urlToOpen = event.notification.data?.url || (prayerName ? `./?autoAthan=true&prayer=${prayerName}` : './');

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if (prayerName) {
            client.postMessage({
              type: 'TRIGGER_ATHAN_FROM_NOTIFICATION',
              prayerName: prayerName
            });
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// State for background exact prayer timers
let scheduledTimers = [];
let notifiedPrayerKeys = new Set();

const ARABIC_PRAYER_NAMES = {
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء'
};

function clearAllScheduledTimers() {
  for (const timerId of scheduledTimers) {
    clearTimeout(timerId);
  }
  scheduledTimers = [];
}

function triggerPrayerNotification(item, cityName) {
  const key = `${item.dateStr}_${item.prayerName}`;
  if (notifiedPrayerKeys.has(key)) return;
  notifiedPrayerKeys.add(key);

  const prayerArabic = ARABIC_PRAYER_NAMES[item.prayerName] || item.prayerName;
  const city = cityName || 'القاهرة';

  self.registration.showNotification(`🕌 حان الآن موعد صلاة ${prayerArabic}`, {
    body: `حسب توقيت مدينة ${city}. تقبل الله صلاتكم وطاعاتكم. اضغط هنا لسماع الأذان.`,
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: `athan-${item.prayerName}`,
    renotify: true,
    requireInteraction: true,
    dir: 'rtl',
    lang: 'ar',
    vibrate: [300, 100, 300, 100, 500],
    data: {
      url: `./?autoAthan=true&prayer=${item.prayerName}`,
      prayerName: item.prayerName
    },
    actions: [
      { action: 'open_athan', title: '🔊 فتح شاشة الأذان' },
      { action: 'dismiss', title: 'إغلاق' }
    ]
  });
}

function scheduleExactPrayerTimers(schedules, cityName, adhanEnabled) {
  clearAllScheduledTimers();
  if (!schedules || !Array.isArray(schedules)) return;

  const nowMs = Date.now();
  const validPrayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  // Max delay for JS setTimeout is 24 hours (86,400,000 ms) to prevent 32-bit int overflow (>2147483647ms)
  const MAX_DELAY_MS = 24 * 60 * 60 * 1000;

  for (const item of schedules) {
    if (!validPrayers.includes(item.prayerName)) continue;
    if (adhanEnabled && adhanEnabled[item.prayerName] === false) continue;

    const fireTimeMs = new Date(item.fireAtUtc).getTime();
    if (isNaN(fireTimeMs)) continue;

    const delayMs = fireTimeMs - nowMs;

    // Only schedule if the prayer is strictly in the FUTURE and within the next 24 hours
    if (delayMs > 0 && delayMs <= MAX_DELAY_MS) {
      const timerId = setTimeout(() => {
        triggerPrayerNotification(item, cityName);
      }, delayMs);
      scheduledTimers.push(timerId);
    }
  }
}

// Message listener from app client
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data.payload || {};
    if (title) {
      self.registration.showNotification(title, {
        icon: './icon-192.png',
        badge: './icon-192.png',
        dir: 'rtl',
        lang: 'ar',
        vibrate: [200, 100, 200],
        ...options
      });
    }
  } else if (event.data.type === 'SYNC_PRAYER_SCHEDULE') {
    const payload = event.data.payload || {};
    scheduleExactPrayerTimers(payload.schedule, payload.cityName, payload.adhanEnabled);
  }
});

// Periodic Sync / Background Sync listeners (as fallback when browser wakes)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'prayer-check') {
    // If browser periodic sync wakes, timers will re-validate
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'prayer-check') {
    // Background sync fallback
  }
});

