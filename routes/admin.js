const express = require('express');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const { loginLimiter, sanitizeBody, sanitizeArticleHtml } = require('../middleware/security');
const { readJson, writeJson } = require('../helpers/json-db');
const { getSettings, DEFAULT_SLIDES, DEFAULT_QUICK_MENUS } = require('../helpers/settings');
const { sendBroadcast } = require('../services/fcm');

const router = express.Router();
const nowId = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const text = (body, key, fallback = '') => typeof body[key] === 'string' && body[key].trim() ? body[key].trim() : fallback;
const bool = (body, key, fallback = false) => Object.prototype.hasOwnProperty.call(body, key) ? body[key] === 'on' || body[key] === 'true' : !!fallback;
const slugify = (value) => String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 90) || `berita-${Date.now()}`;
function adminPasswordOk(password) { return process.env.ADMIN_PASSWORD_HASH ? bcrypt.compareSync(password || '', process.env.ADMIN_PASSWORD_HASH) : password === (process.env.ADMIN_PASSWORD || 'admin8008'); }
function adminUserOk(username) { return username === (process.env.ADMIN_ID || 'admin'); }
function requireUrl(value) { const v = String(value || '').trim(); if (!v || v === '#') return v; return /^(https?:\/\/|\/)/i.test(v) ? v : `https://${v}`; }

router.get('/login', (req, res) => res.render('admin/login', { layout: false, error: null, csrfToken: req.csrfToken ? req.csrfToken() : '' }));
router.post('/login', loginLimiter, sanitizeBody, (req, res) => {
  const username = text(req.body, 'username');
  const password = text(req.body, 'password');
  if (adminUserOk(username) && adminPasswordOk(password)) {
    req.session.admin = true;
    req.session.adminName = username;
    return req.session.save(() => res.redirect('/itsiregar8008'));
  }
  return res.status(401).render('admin/login', { layout: false, error: 'Login gagal. Admin ID atau password salah.', csrfToken: req.csrfToken ? req.csrfToken() : '' });
});
router.get('/logout', auth, (req, res) => req.session.destroy(() => res.redirect('/itsiregar8008/login')));

router.get('/', auth, (req, res) => res.redirect('/itsiregar8008/settings'));
router.get('/settings', auth, (req, res) => {
  res.render('admin/settings', { layout: 'layouts/main-admin', settings: getSettings(false), analytics: readJson('analytics.json', { clicks: {}, installs: 0 }), saved: req.query.saved === '1', error: req.query.error || '', csrfToken: req.csrfToken ? req.csrfToken() : '' });
});
router.post('/settings', auth, sanitizeBody, (req, res) => {
  try {
    const old = getSettings(false);
    const sliders = Array.from({ length: 6 }, (_, i) => {
      const n = i + 1; const prev = old.sliders[i] || DEFAULT_SLIDES[i] || {};
      return { id: prev.id || String(n), title: text(req.body, `slide${n}Title`, prev.title || `Slide ${n}`), imageUrl: requireUrl(text(req.body, `slide${n}ImageUrl`, prev.imageUrl || '')), link: requireUrl(text(req.body, `slide${n}Link`, prev.link || '#')), active: bool(req.body, `slide${n}Active`, prev.active !== false) };
    });
    const quickMenus = Array.from({ length: 8 }, (_, i) => {
      const n = i + 1; const prev = old.quickMenus[i] || DEFAULT_QUICK_MENUS[i] || {};
      return { id: prev.id || String(n), title: text(req.body, `menu${n}Title`, prev.title || `MENU ${n}`), imageUrl: requireUrl(text(req.body, `menu${n}ImageUrl`, prev.imageUrl || '')), link: requireUrl(text(req.body, `menu${n}Link`, prev.link || '#')), active: bool(req.body, `menu${n}Active`, prev.active !== false), featured: bool(req.body, `menu${n}Featured`, !!prev.featured) };
    });
    const data = { ...old,
      siteName: text(req.body, 'siteName', old.siteName || 'OMTOGEL'), siteSubtitle: text(req.body, 'siteSubtitle', old.siteSubtitle || ''), siteDescription: text(req.body, 'siteDescription', old.siteDescription || ''), siteKeywords: text(req.body, 'siteKeywords', old.siteKeywords || ''), footerText: text(req.body, 'footerText', old.footerText || ''), tickerText: text(req.body, 'tickerText', old.tickerText || ''),
      logoUrl: requireUrl(text(req.body, 'logoUrl', old.logoUrl || '')), faviconUrl: requireUrl(text(req.body, 'faviconUrl', old.faviconUrl || '')), backgroundUrl: requireUrl(text(req.body, 'backgroundUrl', old.backgroundUrl || old.backgroundDesktopUrl || '')), backgroundMobileUrl: requireUrl(text(req.body, 'backgroundMobileUrl', old.backgroundMobileUrl || '')),
      mainWebviewUrl: requireUrl(text(req.body, 'mainWebviewUrl', old.mainWebviewUrl || '/')), loginUrl: requireUrl(text(req.body, 'loginUrl', old.loginUrl || '#')), registerUrl: requireUrl(text(req.body, 'registerUrl', old.registerUrl || '#')), livescoreUrl: requireUrl(text(req.body, 'livescoreUrl', old.livescoreUrl || '/livescore')), newsUrl: requireUrl(text(req.body, 'newsUrl', old.newsUrl || '/berita')), whatsappUrl: requireUrl(text(req.body, 'whatsappUrl', old.whatsappUrl || '#')), liveChatUrl: requireUrl(text(req.body, 'liveChatUrl', old.liveChatUrl || '#')),
      themeColor: text(req.body, 'themeColor', old.themeColor || '#050505'), accentColor: text(req.body, 'accentColor', old.accentColor || '#c0c0c0'), goldColor: text(req.body, 'goldColor', old.goldColor || '#f5c542'), sliders, quickMenus, ads: old.ads || [] };
    writeJson('settings.json', data);
    if (global.io) global.io.emit('settings:update', data);
    return req.session.save(() => res.redirect('/itsiregar8008/settings?saved=1'));
  } catch (err) { console.error('SAVE SETTINGS ERROR:', err); return res.redirect('/itsiregar8008/settings?error=' + encodeURIComponent(err.message)); }
});

router.get('/news', auth, (req, res) => res.render('admin/news', { layout: 'layouts/main-admin', news: readJson('news.json', []), saved: req.query.saved === '1', csrfToken: req.csrfToken ? req.csrfToken() : '' }));
router.get('/news/new', auth, (req, res) => res.render('admin/news-form', { layout: 'layouts/main-admin', article: null, csrfToken: req.csrfToken ? req.csrfToken() : '' }));
router.get('/news/:id/edit', auth, (req, res) => {
  const article = readJson('news.json', []).find(n => n.id === req.params.id);
  if (!article) return res.redirect('/itsiregar8008/news');
  res.render('admin/news-form', { layout: 'layouts/main-admin', article, csrfToken: req.csrfToken ? req.csrfToken() : '' });
});
router.post('/news/save', auth, (req, res, next) => { sanitizeArticleHtml(req, res, next); }, (req, res) => {
  const list = readJson('news.json', []); const id = text(req.body, 'id', nowId()); const index = list.findIndex(n => n.id === id);
  const title = text(req.body, 'title', 'Berita Bola'); let slug = slugify(text(req.body, 'slug', title));
  if (list.some(n => n.slug === slug && n.id !== id)) slug = `${slug}-${Date.now()}`;
  const article = { id, title, slug, category: text(req.body, 'category', 'Berita Bola'), author: text(req.body, 'author', 'Redaksi Bola'), excerpt: text(req.body, 'excerpt', ''), thumbnailUrl: requireUrl(text(req.body, 'thumbnailUrl', '')), coverUrl: requireUrl(text(req.body, 'coverUrl', '')), content: req.body.content || '', active: bool(req.body, 'active', true), publishedAt: text(req.body, 'publishedAt', new Date().toISOString().slice(0,16)), updatedAt: new Date().toISOString() };
  if (index >= 0) list[index] = article; else list.unshift(article);
  writeJson('news.json', list); res.redirect('/itsiregar8008/news?saved=1');
});
router.post('/news/:id/delete', auth, (req, res) => { writeJson('news.json', readJson('news.json', []).filter(n => n.id !== req.params.id)); res.redirect('/itsiregar8008/news?saved=1'); });

router.get('/ads', auth, (req, res) => res.render('admin/ads', { layout: 'layouts/main-admin', ads: getSettings(false).ads || [], csrfToken: req.csrfToken ? req.csrfToken() : '', saved: req.query.saved === '1' }));
router.post('/ads/save', auth, sanitizeBody, (req, res) => {
  const settings = getSettings(false); const id = text(req.body, 'id', nowId()); const ads = settings.ads || []; const index = ads.findIndex(a => a.id === id);
  const ad = { id, title: text(req.body, 'title', 'Iklan'), imageUrl: requireUrl(text(req.body, 'imageUrl', '')), link: requireUrl(text(req.body, 'link', '#')), position: text(req.body, 'position', 'home'), active: bool(req.body, 'active', true) };
  if (index >= 0) ads[index] = ad; else ads.unshift(ad); writeJson('settings.json', { ...settings, ads }); res.redirect('/itsiregar8008/ads?saved=1');
});
router.post('/ads/:id/delete', auth, (req, res) => { const settings = getSettings(false); writeJson('settings.json', { ...settings, ads: (settings.ads || []).filter(a => a.id !== req.params.id) }); res.redirect('/itsiregar8008/ads?saved=1'); });

router.post('/message/add', auth, sanitizeBody, async (req, res) => {
  const messages = readJson('messages.json', []); const msg = { id: nowId(), title: text(req.body, 'title', 'INFO'), message: text(req.body, 'message', ''), imageUrl: requireUrl(text(req.body, 'imageUrl', '')), link: requireUrl(text(req.body, 'link', '')), category: text(req.body, 'category', 'INFO'), read: false, date: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) };
  messages.unshift(msg); writeJson('messages.json', messages); await sendBroadcast(msg.title, msg.message, msg.link || '/#inbox'); if (global.io) global.io.emit('messages:update', { unread: messages.filter(m => !m.read).length, messages }); res.redirect('/itsiregar8008/settings?saved=1#messages');
});
router.post('/message/delete/:id', auth, (req, res) => { const messages = readJson('messages.json', []).filter(item => item.id !== req.params.id); writeJson('messages.json', messages); if (global.io) global.io.emit('messages:update', { unread: messages.filter(m => !m.read).length, messages }); res.redirect('/itsiregar8008/settings?saved=1#messages'); });
router.post('/messages/clear', auth, (req, res) => { writeJson('messages.json', []); if (global.io) global.io.emit('messages:update', { unread: 0, messages: [] }); res.redirect('/itsiregar8008/settings?saved=1#messages'); });
module.exports = router;
