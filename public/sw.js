const CACHE_NAME =
  'omtogel-webview-v1';

const URLS = [

  '/',

  '/assets/css/style.css',

  '/manifest.webmanifest'

];

self.addEventListener(
  'install',
  event => {

    event.waitUntil(

      caches.open(CACHE_NAME)
      .then(cache => {

        return cache.addAll(URLS);

      })

    );

    self.skipWaiting();

  }
);

self.addEventListener(
  'activate',
  event => {

    event.waitUntil(

      caches.keys()
      .then(keys => {

        return Promise.all(

          keys.map(key => {

            if(key !== CACHE_NAME){

              return caches.delete(key);

            }

          })

        );

      })

    );

    self.clients.claim();

  }
);

self.addEventListener(
  'fetch',
  event => {

    if(
      event.request.method !== 'GET'
    ) return;

    event.respondWith(

      caches.match(event.request)
      .then(cacheRes => {

        return (

          cacheRes ||

          fetch(event.request)
          .then(fetchRes => {

            const clone =
              fetchRes.clone();

            caches.open(CACHE_NAME)
            .then(cache => {

              cache.put(
                event.request,
                clone
              );

            });

            return fetchRes;

          })

          .catch(() => {

            return caches.match('/');

          })

        );

      })

    );

  }
);
