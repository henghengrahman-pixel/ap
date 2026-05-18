(function(){
  const settings = window.__APP_SETTINGS__ || {};
  const csrfToken = window.__CSRF_TOKEN__ || '';
  const loader = document.getElementById('loader');

  function hideLoader(){
    if(loader) loader.classList.add('hide');
  }

  function usable(url){
    return url && url !== '#';
  }

  function openUrl(url){
    if(!usable(url)) return;
    window.location.href = url;
  }

  function track(key){
    if(!key) return;
    fetch('/api/track-click', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'CSRF-Token': csrfToken },
      body: JSON.stringify({ key })
    }).catch(()=>{});
  }

  window.addEventListener('load', () => setTimeout(hideLoader, 220));
  setTimeout(hideLoader, 900);

  document.querySelectorAll('[data-open-url]').forEach((el)=>{
    el.addEventListener('click', function(e){
      const url = this.dataset.openUrl || this.getAttribute('href');
      if(!usable(url)) {
        e.preventDefault();
        return;
      }
      track(this.textContent.trim() || this.dataset.track || 'launcher');
      e.preventDefault();
      openUrl(url);
    });
  });

  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  const dots = Array.from(document.querySelectorAll('[data-dot]'));
  let current = 0;
  function showSlide(index){
    if(!slides.length) return;
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i)=>slide.classList.toggle('active', i === current));
    dots.forEach((dot, i)=>dot.classList.toggle('active', i === current));
  }
  dots.forEach((dot)=>dot.addEventListener('click', ()=>showSlide(Number(dot.dataset.dot || 0))));
  if(slides.length > 1){
    setInterval(()=>showSlide(current + 1), 4200);
  }

  try{
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
    }
  }catch(e){}

  try{
    const socket = io();
    socket.on('messages:update', (data)=>{
      const badge = document.querySelector('.bottom-badge');
      if(badge){
        badge.textContent = data.unread || 0;
        badge.style.display = (data.unread || 0) > 0 ? 'grid' : 'none';
      }
    });
  }catch(e){}

  async function setupFirebase(){
    if(!settings.firebaseApiKey || !settings.firebaseProjectId || !settings.firebaseMessagingSenderId || !settings.firebaseAppId || !settings.firebaseVapidKey) return;
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
      if(!('Notification' in window)) return;
      const permission = await Notification.requestPermission();
      if(permission !== 'granted') return;
      const token = await msgMod.getToken(messaging, { vapidKey: settings.firebaseVapidKey });
      if(token){
        await fetch('/api/push/token', {
          method:'POST',
          headers:{ 'Content-Type':'application/json', 'CSRF-Token': csrfToken },
          body: JSON.stringify({ token })
        });
      }
      msgMod.onMessage(messaging, (payload)=>{
        if(payload.notification){
          new Notification(payload.notification.title || settings.siteName || 'OMTOGEL', {
            body: payload.notification.body || '',
            icon: settings.appIconUrl || settings.logoUrl || '/icons/icon-192.svg'
          });
        }
      });
    }catch(e){ console.log('Firebase belum aktif:', e.message); }
  }
  setupFirebase();
})();
