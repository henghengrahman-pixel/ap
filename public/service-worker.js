const CACHE_NAME = 'omtogel-premium-v8';

const STATIC_ASSETS = [

  '/',

  '/offline',

  '/assets/css/style.css',

  '/assets/js/app.js',

  '/icons/icon-192.svg',

  '/icons/icon-512.svg'

];

/* =========================================
   INSTALL
========================================= */

self.addEventListener('install', (event) => {

  event.waitUntil(

    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())

  );

});

/* =========================================
   ACTIVATE
========================================= */

self.addEventListener('activate', (event) => {

  event.waitUntil(

    caches
      .keys()
      .then(keys =>

        Promise.all(

          keys.map(key => {

            if(key !== CACHE_NAME){

              return caches.delete(key);

            }

          })

        )

      )
      .then(() => self.clients.claim())

  );

});

/* =========================================
   FETCH
========================================= */

self.addEventListener('fetch', (event) => {

  if(event.request.method !== 'GET'){

    return;

  }

  const url =
    new URL(event.request.url);

  /* ======================================
     BYPASS LOGIN & API
  ====================================== */

  const bypassPaths = [

    '/login',
    '/register',
    '/signin',
    '/signup',
    '/deposit',
    '/withdraw',
    '/api'

  ];

  const shouldBypass =
    bypassPaths.some(path =>
      url.pathname.includes(path)
    );

  if(shouldBypass){

    event.respondWith(fetch(event.request));

    return;

  }

  /* ======================================
     STATIC FILE
  ====================================== */

  const isStaticAsset =

    url.pathname.includes('/assets/') ||

    url.pathname.includes('/icons/') ||

    url.pathname.endsWith('.css') ||

    url.pathname.endsWith('.js') ||

    url.pathname.endsWith('.png') ||

    url.pathname.endsWith('.jpg') ||

    url.pathname.endsWith('.svg') ||

    url.pathname.endsWith('.webp');

  /* ======================================
     STATIC CACHE FIRST
  ====================================== */

  if(isStaticAsset){

    event.respondWith(

      caches.match(event.request)
      .then(cached => {

        if(cached){

          return cached;

        }

        return fetch(event.request)
        .then(response => {

          const cloned =
            response.clone();

          caches
            .open(CACHE_NAME)
            .then(cache => {

              cache.put(
                event.request,
                cloned
              );

            });

          return response;

        });

      })

    );

    return;

  }

  /* ======================================
     HTML / PAGE NETWORK FIRST
  ====================================== */

  event.respondWith(

    fetch(event.request)

    .then(response => {

      return response;

    })

    .catch(() => {

      return caches
        .match(event.request)
        .then(cached => {

          return cached ||
          caches.match('/offline');

        });

    })

  );

});

/* =========================================
   PUSH
========================================= */

self.addEventListener('push', (event) => {

  let data = {};

  try{

    data =
      event.data
        ? event.data.json()
        : {};

  }catch(e){

    data = {

      notification: {

        title: 'OMTOGEL',

        body:
          event.data
            ? event.data.text()
            : ''

      }

    };

  }

  const n =
    data.notification || data;

  event.waitUntil(

    self.registration.showNotification(

      n.title || 'OMTOGEL',

      {

        body:
          n.body ||
          'Notifikasi baru',

        icon:
          '/icons/icon-192.svg',

        badge:
          '/icons/icon-192.svg',

        data:
          data.data || {

            url:'/'

          }

      }

    )

  );

});

/* =========================================
   CLICK NOTIFICATION
========================================= */

self.addEventListener(
  'notificationclick',
  (event) => {

    event.notification.close();

    const url =

      (
        event.notification.data &&
        event.notification.data.url
      ) || '/';

    event.waitUntil(

      clients
      .matchAll({

        type:'window',

        includeUncontrolled:true

      })

      .then(clientList => {

        for(const client of clientList){

          if('focus' in client){

            client.navigate(url);

            return client.focus();

          }

        }

        return clients.openWindow(url);

      })

    );

  }
);
