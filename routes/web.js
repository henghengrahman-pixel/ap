const express = require('express');
const router = express.Router();
const { readJson, seedJson } = require('../helpers/json-db');

const defaultSettings = {
  siteName: 'OMTOGEL',
  subtitle: 'Premium Sportsbook Experience',
  siteDescription: 'Portal aplikasi OMTOGEL dengan akses cepat, info terbaru, promo, dan inbox pesan member.',
  siteKeywords: 'omtogel, sportsbook, prediksi bola, live score, promo',
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
  primaryColor: '#c0c0c0',
  accentColor: '#f5c542'
};

const defaultMenus = [
  { id: 'm1', title: 'RTP SLOT', url: '/rtp', icon: '◆' },
  { id: 'm2', title: 'PROMOSI', url: '#', icon: '★' },
  { id: 'm3', title: 'PREDIKSI BOLA', url: '/prediksi-bola', icon: '⚽' },
  { id: 'm4', title: 'PREDIKSI TOGEL', url: '/prediksi-togel', icon: '♛' },
  { id: 'm5', title: 'LINK ALTERNATIF', url: '#', icon: '↗' },
  { id: 'm6', title: 'INBOX PESAN', url: '/inbox', icon: '✉' },
  { id: 'm7', title: 'WHATSAPP', url: '/whatsapp', icon: '☏' },
  { id: 'm8', title: 'LIVECHAT', url: '/livechat', icon: '●' }
];

function getHomeData() {
  const settings = seedJson('settings.json', defaultSettings);
  const sliders = seedJson('sliders.json', []);
  const popup = seedJson('popup.json', { active: false, title: '', description: '', link: '#', imageUrl: '' });
  const menus = seedJson('menus.json', defaultMenus);
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
