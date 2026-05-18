const express = require('express');
const router = express.Router();
const { readJson, writeJson, seedJson } = require('../helpers/json-db');
const { getSettings } = require('../helpers/settings');
const { getPredictions } = require('../services/football');

function viewData(extra = {}) {
  const settings = getSettings(true);
  const messages = seedJson('messages.json', []);
  return { settings, messages, ...extra };
}

router.get('/', (req, res) => {
  res.render('home', viewData({ layout: 'layouts/main', predictions: getPredictions(), news: readJson('news.json', []).filter(n => n.active !== false).slice(0, 6) }));
});

router.get('/berita', (req, res) => {
  const news = readJson('news.json', []).filter(n => n.active !== false);
  res.render('news/index', viewData({ layout: 'layouts/main', title: 'Berita Bola', news }));
});

router.get('/berita/:slug', (req, res) => {
  const news = readJson('news.json', []);
  const article = news.find(n => n.slug === req.params.slug && n.active !== false);
  if (!article) return res.status(404).render('simple', viewData({ layout: 'layouts/main', title: '404', message: 'Berita tidak ditemukan.' }));
  res.render('news/detail', viewData({ layout: 'layouts/main', title: article.title, article, news: news.filter(n => n.slug !== article.slug && n.active !== false).slice(0, 4) }));
});

router.get('/livescore', (req, res) => res.render('livescore', viewData({ layout: 'layouts/main', title: 'Live Score' })));
router.get('/blank-frame', (req, res) => res.render('blank-frame', { layout: false, settings: getSettings(false) }));
router.get('/inbox', (req, res) => res.redirect('/#inbox'));
router.get('/inbox-frame', (req, res) => {
  const data = viewData();
  const messages = data.messages.map((m) => ({ ...m, read: true }));
  writeJson('messages.json', messages);
  if (global.io) global.io.emit('messages:update', { unread: 0, messages });
  res.render('inbox', { layout: false, ...data, messages });
});
router.get('/offline', (req, res) => res.render('simple', viewData({ layout: 'layouts/main', title: 'Offline', message: 'Koneksi internet tidak tersedia.' })));
router.get('/login', (req, res) => res.redirect(getSettings(false).loginUrl || '/'));
module.exports = router;
