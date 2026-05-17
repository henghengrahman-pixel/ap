const express = require('express');
const router = express.Router();
const { readJson, seedJson, writeJson } = require('../helpers/json-db');

const defaultSettings = {
  siteName: 'OMTOGEL',
  siteDescription: 'OMTOGEL Premium Webview App',
  siteKeywords: 'omtogel, webview, live draw, whatsapp, inbox',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#c0c0c0',
  accentColor: '#111111',
  mainWebviewUrl: '/blank-frame',
  liveDrawUrl: '#',
  whatsappUrl: '#',
  inboxUrl: '/inbox-frame',
  menuCard1Title: 'RTP SLOT GACOR',
  menuCard1Desc: 'Provider Lengkap',
  menuCard1Image: '',
  menuCard1Link: '#',
  menuCard2Title: 'PREDIKSI',
  menuCard2Desc: 'Togel Jitu',
  menuCard2Image: '',
  menuCard2Link: '#',
  menuCard3Title: 'BUKTI JACKPOT',
  menuCard3Desc: 'Pasti Bayar',
  menuCard3Image: '',
  menuCard3Link: '#',
  menuCard4Title: 'JADWAL PASARAN',
  menuCard4Desc: 'Live Update',
  menuCard4Image: '',
  menuCard4Link: '#'
};

function getHomeData() {
  const settings = seedJson('settings.json', defaultSettings);
  const messages = seedJson('messages.json', []);
  return { settings: { ...defaultSettings, ...settings }, messages };
}

router.get('/', (req, res) => {
  res.render('home', { layout: 'layouts/main', ...getHomeData() });
});

router.get('/blank-frame', (req, res) => {
  const { settings } = getHomeData();
  res.render('blank-frame', { layout: false, settings });
});

router.get('/inbox', (req, res) => res.redirect('/#inbox'));

router.get('/inbox-frame', (req, res) => {
  const data = getHomeData();
  const messages = data.messages.map(m => ({ ...m, read: true }));
  writeJson('messages.json', messages);
  res.render('inbox', { layout: false, ...data, messages });
});

router.get('/livedraw', (req, res) => {
  const settings = readJson('settings.json', defaultSettings);
  return res.redirect(settings.liveDrawUrl || '/');
});

router.get('/whatsapp', (req, res) => {
  const settings = readJson('settings.json', defaultSettings);
  return res.redirect(settings.whatsappUrl || '/');
});

module.exports = router;
