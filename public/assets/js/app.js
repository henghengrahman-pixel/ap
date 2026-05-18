(function(){

  const settings =
    window.__APP_SETTINGS__ || {};

  const HOME_URL =
    settings.mainWebviewUrl ||
    '/blank-frame';

  const csrfToken =
    window.__CSRF_TOKEN__ || '';

  const loader =
    document.getElementById('loader');

  const frame =
    document.getElementById('mainFrame');

  const skeleton =
    document.getElementById('frameSkeleton');

  const menuPopup =
    document.getElementById('menuPopup');

  const popupBackdrop =
    document.getElementById('popupBackdrop');

  const openMenuBtn =
    document.getElementById('openMenuBtn');

  const closeMenuBtn =
    document.getElementById('closeMenuBtn');

  const homeFrame =
    document.getElementById('homeFrame');

  const promoPopup =
    document.getElementById('promoPopup');

  const promoClose =
    document.getElementById('promoClose');

  /* =========================================
     UTIL
  ========================================= */

  function usable(url){

    return (
      url &&
      url !== '#'
    );

  }

  function showSkeleton(){

    if(skeleton){

      skeleton.classList.add('active');

    }

  }

  function hideSkeleton(){

    if(skeleton){

      skeleton.classList.remove('active');

    }

    if(loader){

      loader.classList.add('hide');

    }

  }

  function openPopup(){

    if(menuPopup){

      menuPopup.classList.add('active');

    }

    if(popupBackdrop){

      popupBackdrop.classList.add('active');

    }

    if(openMenuBtn){

      openMenuBtn.classList.add('active');

    }

  }

  function closePopup(){

    if(menuPopup){

      menuPopup.classList.remove('active');

    }

    if(popupBackdrop){

      popupBackdrop.classList.remove('active');

    }

    if(openMenuBtn){

      openMenuBtn.classList.remove('active');

    }

  }

  function setActive(btn){

    document
      .querySelectorAll('.bottom-item')
      .forEach(item => {

        item.classList.remove('active');

      });

    if(btn){

      btn.classList.add('active');

    }

  }

  /* =========================================
     TRACK
  ========================================= */

  function track(key){

    if(!key) return;

    fetch('/api/track-click',{

      method:'POST',

      headers:{

        'Content-Type':'application/json',

        'CSRF-Token':csrfToken

      },

      body:JSON.stringify({ key })

    }).catch(()=>{});

  }

  /* =========================================
     EXTERNAL PAGE
  ========================================= */

  const externalPages = [

    '/login',
    '/register',
    '/signin',
    '/signup',
    '/daftar',
    '/deposit',
    '/withdraw',
    '/account',
    '/profile',
    '/transaction'

  ];

  /* =========================================
     OPEN FRAME
  ========================================= */

  function loadFrame(url, btn){

    if(!usable(url)) return;

    closePopup();

    track(
      btn?.dataset?.track ||
      'navigation'
    );

    const lower =
      String(url).toLowerCase();

    const isExternal =
      externalPages.some(page =>
        lower.includes(page)
      );

    /* LOGIN / TRANSAKSI */

    if(isExternal){

      window.location.href = url;

      return;

    }

    /* DOMAIN LUAR */

    if(
      url.startsWith('http') &&
      !url.includes(location.hostname)
    ){

      window.location.href = url;

      return;

    }

    /* IFRAME */

    showSkeleton();

    if(btn){

      setActive(btn);

    }

    if(frame){

      frame.src = url;

    }

  }

  /* =========================================
     MENU BUTTON
  ========================================= */

  if(openMenuBtn){

    openMenuBtn.addEventListener(
      'click',
      ()=>{

        if(
          menuPopup &&
          menuPopup.classList.contains('active')
        ){

          closePopup();

        }else{

          openPopup();

        }

      }
    );

  }

  if(closeMenuBtn){

    closeMenuBtn.addEventListener(
      'click',
      closePopup
    );

  }

  if(popupBackdrop){

    popupBackdrop.addEventListener(
      'click',
      closePopup
    );

  }

  /* =========================================
     ESC CLOSE
  ========================================= */

  document.addEventListener(
    'keydown',
    (e)=>{

      if(e.key === 'Escape'){

        closePopup();

      }

    }
  );

  /* =========================================
     BOTTOM NAV
  ========================================= */

  document
    .querySelectorAll('[data-frame-url]')
    .forEach(btn => {

      btn.addEventListener(
        'click',
        function(){

          loadFrame(
            this.dataset.frameUrl,
            this
          );

        }
      );

    });

  /* =========================================
     MENU CARD
  ========================================= */

  document
    .querySelectorAll('[data-menu-link]')
    .forEach(link => {

      link.addEventListener(
        'click',
        function(e){

          const url =
            this.dataset.menuLink;

          if(!usable(url)) return;

          e.preventDefault();

          loadFrame(
            url,
            null
          );

        }
      );

    });

  /* =========================================
     HOME
  ========================================= */

  if(homeFrame){

    homeFrame.addEventListener(
      'click',
      ()=>{

        setActive(null);

        loadFrame(
          HOME_URL,
          null
        );

      }
    );

  }

  /* =========================================
     FRAME LOADED
  ========================================= */

  if(frame){

    frame.addEventListener(
      'load',
      ()=>{

        hideSkeleton();

      }
    );

  }

  /* =========================================
     FALLBACK LOADER
  ========================================= */

  window.addEventListener(
    'load',
    ()=>{

      setTimeout(()=>{

        hideSkeleton();

      },300);

    }
  );

  /* =========================================
     INBOX AUTO
  ========================================= */

  if(
    location.hash === '#inbox'
  ){

    loadFrame(
      settings.inboxUrl ||
      '/inbox-frame'
    );

  }

  /* =========================================
     PROMO
  ========================================= */

  if(promoClose){

    promoClose.addEventListener(
      'click',
      ()=>{

        if(promoPopup){

          promoPopup.classList.add('hide');

        }

      }
    );

  }

  /* =========================================
     SERVICE WORKER
  ========================================= */

  try{

    if('serviceWorker' in navigator){

      navigator
        .serviceWorker
        .register('/service-worker.js')
        .catch(()=>{});

    }

  }catch(e){}

  /* =========================================
     SOCKET
  ========================================= */

  try{

    const socket = io();

    socket.on(
      'messages:update',
      (data)=>{

        const badge =
          document.querySelector(
            '[data-inbox-badge]'
          );

        if(badge){

          badge.textContent =
            data.unread || 0;

          badge.style.display =
            (data.unread || 0) > 0
              ? 'grid'
              : 'none';

        }

      }
    );

  }catch(e){}

  /* =========================================
     FIREBASE
  ========================================= */

  async function setupFirebase(){

    if(
      !settings.firebaseApiKey ||
      !settings.firebaseProjectId ||
      !settings.firebaseMessagingSenderId ||
      !settings.firebaseAppId ||
      !settings.firebaseVapidKey
    ){
      return;
    }

    try{

      const appMod =
        await import(
          'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'
        );

      const msgMod =
        await import(
          'https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging.js'
        );

      const app =
        appMod.initializeApp({

          apiKey:
            settings.firebaseApiKey,

          authDomain:
            settings.firebaseAuthDomain,

          projectId:
            settings.firebaseProjectId,

          storageBucket:
            settings.firebaseStorageBucket,

          messagingSenderId:
            settings.firebaseMessagingSenderId,

          appId:
            settings.firebaseAppId

        });

      const messaging =
        msgMod.getMessaging(app);

      const permission =
        await Notification.requestPermission();

      if(permission !== 'granted'){

        return;

      }

      const token =
        await msgMod.getToken(
          messaging,
          {
            vapidKey:
              settings.firebaseVapidKey
          }
        );

      if(token){

        await fetch(
          '/api/push/token',
          {

            method:'POST',

            headers:{

              'Content-Type':'application/json',

              'CSRF-Token':csrfToken

            },

            body:JSON.stringify({
              token
            })

          }
        );

      }

      msgMod.onMessage(
        messaging,
        (payload)=>{

          if(payload.notification){

            new Notification(

              payload.notification.title ||
              settings.siteName ||
              'OMTOGEL',

              {

                body:
                  payload.notification.body || '',

                icon:
                  settings.appIconUrl ||
                  settings.logoUrl ||
                  '/icons/icon-192.png'

              }

            );

          }

        }
      );

    }catch(e){

      console.log(
        'Firebase belum aktif:',
        e.message
      );

    }

  }

  setupFirebase();

})();
