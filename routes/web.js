const express = require('express');
const router = express.Router();
const { readJson, seedJson } = require('../helpers/json-db');

const defaultSettings = {
  siteName: 'OMTOGEL',
  subtitle: 'Premium Sportsbook Experience',
  siteDescription: 'Portal aplikasi OMTOGEL dengan akses cepat, info terbaru, promo, livedraw, WhatsApp, dan inbox pesan member.',
  siteKeywords: 'omtogel, sportsbook, prediksi bola, live draw, promo',
  logoUrl: '',
  faviconUrl: '',
  backgroundUrl: '',
  heroImageUrl: '',
  ticker: 'SELAMAT DATANG DI OMTOGEL PREMIUM OFFICIAL',
  footer: '© OMTOGEL OFFICIAL',
  loginUrl: '#',
  registerUrl: '#',
  whatsappUrl: '#',
  livechatUrl: '#',
  liveDrawUrl: '#',
  primaryColor: '#c0c0c0',
  accentColor: '#f5c542'
};

const defaultMenus = [
  {
    id: 'm1',
    title: 'RTP SLOT GACOR',
    subtitle: 'Provider Terlengkap',
    url: '/rtp',
    icon: '◆',
    imageUrl: ''
  },
  {
    id: 'm2',
    title: 'PREDIKSI',
    subtitle: 'Togel Jitu',
    url: '/prediksi-togel',
    icon: '★',
    imageUrl: ''
  },
  {
    id: 'm3',
    title: 'BUKTI JACKPOT',
    subtitle: 'Pasti Bayar',
    url: '#',
    icon: '♛',
    imageUrl: ''
  },
  {
    id: 'm4',
    title: 'JADWAL PASARAN',
    subtitle: 'Live Update',
    url: '#',
    icon: '◎',
    imageUrl: ''
  }
];

function normalizeMenus(menus = []) {
  return menus.map((menu, index) => ({
    id: menu.id || `m${index + 1}`,
    title: menu.title || 'MENU',
    subtitle: menu.subtitle || menu.desc || '',
    url: menu.url || '#',
    icon: menu.icon || '◆',
    imageUrl: menu.imageUrl || menu.bannerUrl || ''
  }));
}

function getHomeData() {
  const settings = seedJson('settings.json', defaultSettings);
  const sliders = seedJson('sliders.json', []);
  const popup = seedJson('popup.json', { active: false, title: '', description: '', link: '#', imageUrl: '' });
  const menus = normalizeMenus(seedJson('menus.json', defaultMenus));
  const messages = seedJson('messages.json', []);
  return { settings: { ...defaultSettings, ...settings }, sliders, popup, menus, messages };
}

router.get('/', (req, res) => {
  res.render('home', { layout: 'layouts/main', ...getHomeData() });
});

router.get('/inbox', (req, res) => {
  const data = getHomeData();
  res.render('inbox', { layout: 'layouts/main', ...data });
});

router.get('/login', (req, res) => {
  const settings = readJson('settings.json', defaultSettings);
  return res.redirect(settings.loginUrl || '#');
});

router.get('/daftar', (req, res) => {
  const settings = readJson('settings.json', defaultSettings);
  return res.redirect(settings.registerUrl || '#');
});

router.get('/whatsapp', (req, res) => {
  const settings = readJson('settings.json', defaultSettings);
  return res.redirect(settings.whatsappUrl || '#');
});

router.get('/livechat', (req, res) => {
  const settings = readJson('settings.json', defaultSettings);
  return res.redirect(settings.livechatUrl || '#');
});

router.get('/livedraw', (req, res) => {
  const settings = readJson('settings.json', defaultSettings);
  return res.redirect(settings.liveDrawUrl || '#');
});

router.get('/rtp', (req, res) => {
  const { settings } = getHomeData();
  res.render('simple', { layout: 'layouts/main', settings, title: 'RTP SLOT', message: 'Halaman RTP dapat diarahkan dari menu admin.' });
});

router.get('/prediksi-bola', (req, res) => {
  const { settings } = getHomeData();
  res.render('simple', { layout: 'layouts/main', settings, title: 'PREDIKSI BOLA', message: 'Konten prediksi bola dapat dikembangkan dari admin.' });
});

router.get('/prediksi-togel', (req, res) => {
  const { settings } = getHomeData();
  res.render('simple', { layout: 'layouts/main', settings, title: 'PREDIKSI TOGEL', message: 'Konten prediksi togel dapat dikembangkan dari admin.' });
});

module.exports = router;
