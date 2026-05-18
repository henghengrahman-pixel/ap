(function(){
  const settings = window.__APP_SETTINGS__ || {};
  const HOME_URL = settings.mainWebviewUrl || '/blank-frame';
  const csrfToken = window.__CSRF_TOKEN__ || '';

  const loader = document.getElementById('loader');
  const frame = document.getElementById('mainFrame');
  const skeleton = document.getElementById('frameSkeleton');
  const menuPopup = document.getElementById('menuPopup');
  const popupBackdrop = document.getElementById('popupBackdrop');
  const openMenuBtn = document.getElementById('openMenuBtn');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const homeFrame = document.getElementById('homeFrame');
  const promoPopup = document.getElementById('promoPopup');
  const promoClose = document.getElementById('promoClose');

  const externalKeywords = [
    'login','signin','masuk','register','signup','daftar','deposit','withdraw','wd','transaksi','transaction','account','akun','profile','profil','member','wallet','cashier','bank'
  ];

  function usable(url){
    return typeof url === 'string' && url.trim() && url.trim() !== '#';
  }

  function normalizeUrl(url){
    return String(url || '').trim().replace(/\s+/g, '');
  }

  function hideLoader(){
    if(skeleton) skeleton.classList.remove('active');
    if(loader) loader.classList.add('hide');
  }

  function showSkeleton(){
    if(skeleton) skeleton.classList.add('active');
    window.setTimeout(hideLoader, 900);
  }

  function openPopup(){
    menuPopup && menuPopup.classList.add('active');
    popupBackdrop && popupBackdrop.classList.add('active');
    openMenuBtn && openMenuBtn.classList.add('active');
  }

  function closePopup(){
    menuPopup && menuPopup.classList.remove('active');
    popupBackdrop && popupBackdrop.classList.remove('active');
    openMenuBtn && openMenuBtn.classList.remove('active');
  }

  function setActive(btn){
    document.querySelectorAll('.bottom-item').forEach(item => item.classList.remove('active'));
    btn && btn.classList.add('active');
  }

  function track(key){
    if(!key) return;
    fetch('/api/track-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': csrfToken
      },
      body: JSON.stringify({ key })
    }).catch(function(){});
  }

  function shouldOpenTop(url){
    const clean = normalizeUrl(url).toLowerCase();
    if(!clean) return false;
    return externalKeywords.some(keyword => clean.includes(keyword));
  }

  function openTop(url){
    window.location.href = url;
  }

  function loadFrame(url, btn){
    url = normalizeUrl(url);
    if(!usable(url)) return;

    closePopup();
    track((btn && btn.dataset && btn.dataset.track) || 'navigation');

    if(shouldOpenTop(url)){
      openTop(url);
      return;
    }

    if(btn) setActive(btn);

    if(frame){
      showSkeleton();
      frame.src = url;
    }else{
      openTop(url);
    }
  }

  window.__OMTOGEL_LOAD_FRAME__ = loadFrame;

  if(openMenuBtn){
    openMenuBtn.addEventListener('click', function(){
      menuPopup && menuPopup.classList.contains('active') ? closePopup() : openPopup();
    });
  }

  closeMenuBtn && closeMenuBtn.addEventListener('click', closePopup);
  popupBackdrop && popupBackdrop.addEventListener('click', closePopup);

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closePopup();
  });

  document.querySelectorAll('[data-frame-url]').forEach(function(btn){
    btn.addEventListener('click', function(){
      loadFrame(this.dataset.frameUrl, this);
    });
  });

  document.querySelectorAll('[data-menu-link]').forEach(function(link){
    link.addEventListener('click', function(e){
      const url = normalizeUrl(this.dataset.menuLink || this.getAttribute('href'));
      if(!usable(url)) return;
      e.preventDefault();
      loadFrame(url, null);
    });
  });

  if(homeFrame){
    homeFrame.addEventListener('click', function(){
      setActive(null);
      loadFrame(HOME_URL, null);
    });
  }

  if(frame){
    frame.addEventListener('load', hideLoader);
  }

  window.addEventListener('load', function(){
    window.setTimeout(hideLoader, 250);
  });

  window.setTimeout(hideLoader, 1200);

  if(location.hash === '#inbox'){
    loadFrame(settings.inboxUrl || '/inbox-frame');
  }

  if(location.hash === '#live'){
    loadFrame(settings.liveDrawUrl || '#');
  }

  if(promoClose){
    promoClose.addEventListener('click', function(){
      promoPopup && promoPopup.classList.add('hide');
    });
  }

  try{
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' }).catch(function(){});
    }
  }catch(e){}

  try{
    if(typeof io === 'function'){
      const socket = io({ transports: ['websocket', 'polling'] });
      socket.on('messages:update', function(data){
        const badge = document.querySelector('[data-inbox-badge]');
        if(badge){
          badge.textContent = data.unread || 0;
          badge.style.display = (data.unread || 0) > 0 ? 'grid' : 'none';
        }
      });
    }
  }catch(e){}

  async function setupFirebase(){
    if(
      !settings.firebaseApiKey ||
      !settings.firebaseProjectId ||
      !settings.firebaseMessagingSenderId ||
      !settings.firebaseAppId ||
      !settings.firebaseVapidKey
    ) return;

    if(!('Notification' in window)) return;
    if(Notification.permission === 'denied') return;

    try{
      const appMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
      const msgMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging.js');
      const app = appMod.initializeApp({
        apiKey: settings.firebaseApiKey,
        authDomain: settings.firebaseAuthDomain,
        projectId: settings.firebaseProjectId,
        storageBucket: settings.firebaseStorageBucket,
        messagingSenderId: settings.firebaseMessagingSenderId,
        appId: settings.firebaseAppId
      });
      const messaging = msgMod.getMessaging(app);
      const permission = await Notification.requestPermission();
      if(permission !== 'granted') return;
      const token = await msgMod.getToken(messaging, { vapidKey: settings.firebaseVapidKey });
      if(token){
        await fetch('/api/push/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken
          },
          body: JSON.stringify({ token })
        });
      }
      msgMod.onMessage(messaging, function(payload){
        if(payload.notification){
          new Notification(payload.notification.title || settings.siteName || 'OMTOGEL', {
            body: payload.notification.body || '',
            icon: settings.appIconUrl || settings.logoUrl || '/icons/icon-192.svg'
          });
        }
      });
    }catch(e){
      console.log('Firebase belum aktif:', e.message);
    }
  }

  window.setTimeout(setupFirebase, 2000);
})();
