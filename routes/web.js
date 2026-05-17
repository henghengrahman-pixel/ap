const express = require('express');
const router = express.Router();
const { readJson, seedJson, writeJson } = require('../helpers/json-db');

const defaultSettings = {
  siteName: 'OMTOGEL',
  subtitle: 'Premium Webview App',
  siteDescription: 'Aplikasi webview premium dengan link utama, livedraw, WhatsApp, inbox, dan menu bawah permanen.',
  siteKeywords: 'omtogel, webview, live draw, whatsapp, inbox',
  logoUrl: '',
  faviconUrl: '',
  backgroundUrl: '',
  footer: '© OMTOGEL OFFICIAL',
  // URL utama yang langsung tampil di area atas
  mainWebviewUrl: 'https://omtogelblue.com/',
  // Tombol bawah, semua bisa diset dari admin
  bottomMenuUrl: 'https://omtogelblue.com/',
  liveDrawUrl: '#',
  whatsappUrl: '#',
  inboxUrl: '/inbox-frame',
  loginUrl: '#',
  registerUrl: '#',
  livechatUrl: '#',
  primaryColor: '#c0c0c0',
  accentColor: '#111111'
};

function getHomeData() {
  const settings = seedJson('settings.json', defaultSettings);
  const messages = seedJson('messages.json', []);
  return {
    settings: { ...defaultSettings, ...settings },
    messages
  };
}

router.get('/', (req, res) => {
  res.render('home', { layout: 'layouts/main', ...getHomeData() });
});

router.get('/inbox', (req, res) => {
  res.redirect('/#inbox');
});

router.get('/inbox-frame', (req, res) => {
  const data = getHomeData();
  const messages = data.messages.map(m => ({ ...m, read: true }));
  writeJson('messages.json', messages);
  res.render('inbox', { layout: 'layouts/main', ...data, messages });
});

router.get('/login', (req, res) => {
  const settings = readJson('settings.json', defaultSettings);
  return res.redirect(settings.loginUrl || settings.mainWebviewUrl || '#');
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

module.exports = router;
