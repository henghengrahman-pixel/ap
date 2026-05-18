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
  const installPrompt = document.getElementById('installPrompt');
  const installBtn = document.getElementById('installBtn');
  const installClose = document.getElementById('installClose');
  const promoPopup = document.getElementById('promoPopup');
  const promoClose = document.getElementById('promoClose');
  let deferredPrompt = null;

  function usable(url){ return url && url !== '#'; }
  function showSkeleton(){ if(skeleton) skeleton.classList.add('active'); }
  function hideSkeleton(){ if(skeleton) skeleton.classList.remove('active'); if(loader) loader.classList.add('hide'); }
  function openPopup(){ if(menuPopup) menuPopup.classList.add('active'); if(popupBackdrop) popupBackdrop.classList.add('active'); if(openMenuBtn) openMenuBtn.classList.add('active'); }
  function closePopup(){ if(menuPopup) menuPopup.classList.remove('active'); if(popupBackdrop) popupBackdrop.classList.remove('active'); if(openMenuBtn) openMenuBtn.classList.remove('active'); }
  function setActive(btn){ document.querySelectorAll('.bottom-item').forEach(x => x.classList.remove('active')); if(btn) btn.classList.add('active'); }
  function track(key){
    if(!key) return;
    fetch('/api/track-click',{method:'POST',headers:{'Content-Type':'application/json','CSRF-Token':csrfToken},body:JSON.stringify({key})}).catch(()=>{});
  }
  function loadFrame(url, btn){
    if(!usable(url)) return;
    showSkeleton();
    if(btn) setActive(btn);
    if(frame) frame.src = url;
  }

  if(openMenuBtn) openMenuBtn.addEventListener('click', () => menuPopup && menuPopup.classList.contains('active') ? closePopup() : openPopup());
  if(closeMenuBtn) closeMenuBtn.addEventListener('click', closePopup);
  if(popupBackdrop) popupBackdrop.addEventListener('click', closePopup);
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closePopup(); });

  document.querySelectorAll('[data-frame-url]').forEach((btn)=>btn.addEventListener('click', function(){ closePopup(); track(this.dataset.track); loadFrame(this.dataset.frameUrl, this); }));
  document.querySelectorAll('[data-menu-link]').forEach((link)=>link.addEventListener('click', function(e){ const url=this.dataset.menuLink; if(usable(url)){ e.preventDefault(); track(this.dataset.track || 'menu'); loadFrame(url, null); closePopup(); } }));
  if(homeFrame) homeFrame.addEventListener('click', ()=>{ closePopup(); setActive(null); track('bottom:home'); loadFrame(HOME_URL, null); });
  if(frame) frame.addEventListener('load', hideSkeleton);
  setTimeout(hideSkeleton, 1800);
  if(location.hash === '#inbox') loadFrame(settings.inboxUrl || '/inbox-frame');
  if(promoClose) promoClose.addEventListener('click', ()=>{ if(promoPopup) promoPopup.classList.add('hide'); });

  try{
    if('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
    window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt=e; if(installPrompt && !localStorage.getItem('installClosed')) installPrompt.hidden=false; });
    if(installBtn) installBtn.addEventListener('click', async()=>{ if(deferredPrompt){ deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; installPrompt.hidden=true; } });
    if(installClose) installClose.addEventListener('click', ()=>{ localStorage.setItem('installClosed','1'); installPrompt.hidden=true; });
  }catch(e){}

  try{
    const socket = io();
    socket.on('messages:update', (data)=>{
      const badge = document.querySelector('[data-inbox-badge]');
      if(badge){ badge.textContent=data.unread||0; badge.style.display=(data.unread||0)>0?'grid':'none'; }
    });
  }catch(e){}

  async function setupFirebase(){
    if(!settings.firebaseApiKey || !settings.firebaseProjectId || !settings.firebaseMessagingSenderId || !settings.firebaseAppId || !settings.firebaseVapidKey) return;
    try{
      const appMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
      const msgMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging.js');
      const app = appMod.initializeApp({ apiKey: settings.firebaseApiKey, authDomain: settings.firebaseAuthDomain, projectId: settings.firebaseProjectId, storageBucket: settings.firebaseStorageBucket, messagingSenderId: settings.firebaseMessagingSenderId, appId: settings.firebaseAppId });
      const messaging = msgMod.getMessaging(app);
      const permission = await Notification.requestPermission();
      if(permission !== 'granted') return;
      const token = await msgMod.getToken(messaging,{ vapidKey: settings.firebaseVapidKey });
      if(token) await fetch('/api/push/token',{method:'POST',headers:{'Content-Type':'application/json','CSRF-Token':csrfToken},body:JSON.stringify({token})});
      msgMod.onMessage(messaging,(payload)=>{ if(payload.notification) new Notification(payload.notification.title || settings.siteName || 'OMTOGEL',{body:payload.notification.body || '', icon: settings.appIconUrl || settings.logoUrl || '/icons/icon-192.png'}); });
    }catch(e){ console.log('Firebase web push belum aktif:', e.message); }
  }
  setupFirebase();
})();
