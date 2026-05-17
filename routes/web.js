const express = require('express');
const router = express.Router();
const { seedJson, writeJson } = require('../helpers/json-db');
const { defaultSettings, getSettings } = require('../helpers/settings');

function getHomeData() {
  const settings = getSettings(true);
  const messages = seedJson('messages.json', []);
  return { settings, messages };
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
  const settings = getSettings(false);
  return res.redirect(settings.liveDrawUrl || '/');
});

router.get('/whatsapp', (req, res) => {
  const settings = getSettings(false);
  return res.redirect(settings.whatsappUrl || '/');
});

module.exports = router;
