const express = require('express');
const router = express.Router();
const { seedJson, writeJson } = require('../helpers/json-db');
const { getSettings } = require('../helpers/settings');

function getHomeData() {
  const settings = getSettings(true);
  const messages = seedJson('messages.json', []);
  return { settings, messages };
}

router.get('/', (req, res) => res.render('home', { layout: 'layouts/main', ...getHomeData() }));

router.get('/blank-frame', (req, res) => {
  const { settings } = getHomeData();
  res.render('blank-frame', { layout: false, settings });
});

router.get('/inbox', (req, res) => res.redirect('/#inbox'));

router.get('/inbox-frame', (req, res) => {
  const data = getHomeData();
  const messages = data.messages.map((m) => ({ ...m, read: true }));
  writeJson('messages.json', messages);
  if (global.io) global.io.emit('messages:update', { unread: 0, messages });
  res.render('inbox', { layout: false, ...data, messages });
});

router.get('/offline', (req, res) => res.render('simple', { layout: 'layouts/main', title: 'Offline', message: 'Koneksi internet tidak tersedia. Buka kembali saat jaringan normal.' }));

router.get('/livedraw', (req, res) => {
  const settings = getSettings(false);
  return res.redirect(settings.liveDrawUrl || '/');
});

router.get('/whatsapp', (req, res) => {
  const settings = getSettings(false);
  return res.redirect(settings.whatsappUrl || '/');
});

module.exports = router;
