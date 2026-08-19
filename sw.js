const CACHE_NAME = 'ironrank-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

// ---------- Firebase Cloud Messaging: shows a notification when a push arrives while the app is closed ----------
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCDUiMfgHE4bEGkOvBERuH2wr2rlrgvcbQ",
  authDomain: "ironrank-fd81f.firebaseapp.com",
  projectId: "ironrank-fd81f",
  storageBucket: "ironrank-fd81f.firebasestorage.app",
  messagingSenderId: "681852528421",
  appId: "1:681852528421:web:b73dd109e51f720dd1dccc"
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  self.registration.showNotification(n.title || '🔥 IronRank', {
    body: n.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: 'streak-reminder'
  });
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({type: 'window', includeUncontrolled: true}).then((clients) => {
      for(const client of clients){
        if('focus' in client) return client.focus();
      }
      if(self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Never intercept Firebase/API calls — only cache our own static shell.
  if (!event.request.url.startsWith(self.location.origin)) return;
  // Network-first so edits show up immediately during development; fall back to cache when offline.
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
