const express = require('express');
const auth = require('../middleware/auth');
const { readJson, writeJson } = require('../helpers/json-db');

const router = express.Router();

function toBool(value) {
  return value === 'on' || value === 'true' || value === true;
}

router.get('/login', (req, res) => {
  res.render('admin/login', { layout: false, error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_ID && password === process.env.ADMIN_PASSWORD) {
    req.session.admin = true;
    return res.redirect('/itsiregar8008');
  }
  return res.render('admin/login', { layout: false, error: 'Login gagal' });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/itsiregar8008/login'));
});

router.get('/', auth, (req, res) => {
  res.render('admin/dashboard', {
    layout: 'layouts/main-admin',
    settings: readJson('settings.json', {}),
    sliders: readJson('sliders.json', []),
    popup: readJson('popup.json', {}),
    menus: readJson('menus.json', []),
    messages: readJson('messages.json', [])
  });
});

router.post('/settings', auth, (req, res) => {
  const old = readJson('settings.json', {});
  const data = {
    ...old,
    siteName: req.body.siteName || old.siteName || 'OMTOGEL',
    subtitle: req.body.subtitle || '',
    siteDescription: req.body.siteDescription || '',
    siteKeywords: req.body.siteKeywords || '',
    ticker: req.body.ticker || '',
    footer: req.body.footer || '',
    loginUrl: req.body.loginUrl || '#',
    registerUrl: req.body.registerUrl || '#',
    whatsappUrl: req.body.whatsappUrl || '#',
    livechatUrl: req.body.livechatUrl || '#',
    logoUrl: req.body.logoUrl || '',
    faviconUrl: req.body.faviconUrl || '',
    backgroundUrl: req.body.backgroundUrl || '',
    heroImageUrl: req.body.heroImageUrl || '',
    primaryColor: req.body.primaryColor || '#c0c0c0',
    accentColor: req.body.accentColor || '#f5c542'
  };
  writeJson('settings.json', data);
  if (global.io) global.io.emit('settings:update', data);
  res.redirect('/itsiregar8008');
});

router.post('/slider/add', auth, (req, res) => {
  const sliders = readJson('sliders.json', []);
  if (!req.body.imageUrl) return res.redirect('/itsiregar8008');
  sliders.unshift({
    id: Date.now().toString(),
    title: req.body.title || '',
    link: req.body.link || '#',
    imageUrl: req.body.imageUrl
  });
  writeJson('sliders.json', sliders);
  if (global.io) global.io.emit('sliders:update', sliders);
  res.redirect('/itsiregar8008');
});

router.post('/slider/delete/:id', auth, (req, res) => {
  const sliders = readJson('sliders.json', []).filter(item => item.id !== req.params.id);
  writeJson('sliders.json', sliders);
  if (global.io) global.io.emit('sliders:update', sliders);
  res.redirect('/itsiregar8008');
});

router.post('/popup', auth, (req, res) => {
  const popup = {
    active: toBool(req.body.active),
    title: req.body.title || '',
    description: req.body.description || '',
    link: req.body.link || '#',
    imageUrl: req.body.imageUrl || ''
  };
  writeJson('popup.json', popup);
  if (global.io) global.io.emit('popup:update', popup);
  res.redirect('/itsiregar8008');
});

router.post('/menu/add', auth, (req, res) => {
  const menus = readJson('menus.json', []);
  menus.push({
    id: Date.now().toString(),
    title: req.body.title || 'MENU',
    url: req.body.url || '#',
    icon: req.body.icon || '◆'
  });
  writeJson('menus.json', menus);
  res.redirect('/itsiregar8008');
});

router.post('/menu/delete/:id', auth, (req, res) => {
  writeJson('menus.json', readJson('menus.json', []).filter(item => item.id !== req.params.id));
  res.redirect('/itsiregar8008');
});

router.post('/message/add', auth, (req, res) => {
  const messages = readJson('messages.json', []);
  const msg = {
    id: Date.now().toString(),
    title: req.body.title || 'PESAN OMTOGEL',
    message: req.body.message || '',
    imageUrl: req.body.imageUrl || '',
    link: req.body.link || '',
    category: req.body.category || 'INFO',
    read: false,
    date: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
  };
  messages.unshift(msg);
  writeJson('messages.json', messages);
  if (global.io) global.io.emit('messages:update', { unread: messages.filter(m => !m.read).length, messages });
  res.redirect('/itsiregar8008');
});

router.post('/message/delete/:id', auth, (req, res) => {
  const messages = readJson('messages.json', []).filter(item => item.id !== req.params.id);
  writeJson('messages.json', messages);
  if (global.io) global.io.emit('messages:update', { unread: messages.filter(m => !m.read).length, messages });
  res.redirect('/itsiregar8008');
});

router.post('/messages/clear', auth, (req, res) => {
  writeJson('messages.json', []);
  if (global.io) global.io.emit('messages:update', { unread: 0, messages: [] });
  res.redirect('/itsiregar8008');
});

module.exports = router;
