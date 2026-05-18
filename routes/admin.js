const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const { loginLimiter, sanitizeBody } = require('../middleware/security');
const { readJson, writeJson } = require('../helpers/json-db');
const { defaultSettings, getSettings, DEFAULT_LAUNCHER_BUTTONS, DEFAULT_SLIDES } = require('../helpers/settings');
const { sendBroadcast } = require('../services/fcm');

const router = express.Router();
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
    const safe = (file.fieldname || 'image').replace(/[^a-z0-9_-]/gi, '').toLowerCase();
    cb(null, `${safe}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE || 10 * 1024 * 1024) },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) return cb(new Error('File harus gambar.'));
    cb(null, true);
  }
});

function uploadUrl(req, field, oldValue = '') {
  if (req.files && req.files[field] && req.files[field][0]) return `/uploads/${req.files[field][0].filename}`;
  if (req.file && req.file.fieldname === field) return `/uploads/${req.file.filename}`;
  return req.body[field] || oldValue || '';
}

function isValidAdminPassword(password) {
  if (process.env.ADMIN_PASSWORD_HASH) return bcrypt.compareSync(password || '', process.env.ADMIN_PASSWORD_HASH);
  return password === process.env.ADMIN_PASSWORD;
}

const settingUploadFields = [
  'logoUrl', 'faviconUrl', 'appIconUrl', 'splashImageUrl', 'backgroundDesktopUrl', 'backgroundMobileUrl', 'heroBannerUrl',
  ...Array.from({ length: 6 }, (_, i) => `slide${i + 1}Image`)
].map((name) => ({ name, maxCount: 1 }));

router.get('/login', (req, res) => {
  res.render('admin/login', { layout: false, error: null, csrfToken: req.csrfToken() });
});

router.post('/login', loginLimiter, sanitizeBody, (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_ID && isValidAdminPassword(password)) {
    req.session.admin = true;
    req.session.save(() => res.redirect('/itsiregar8008'));
    return;
  }
  res.status(401).render('admin/login', { layout: false, error: 'Login gagal. Admin ID atau password salah.', csrfToken: req.csrfToken() });
});

router.get('/logout', auth, (req, res) => req.session.destroy(() => res.redirect('/itsiregar8008/login')));

router.get('/', auth, (req, res) => {
  const analytics = readJson('analytics.json', { clicks: {}, installs: 0 });
  res.render('admin/settings', {
    layout: 'layouts/main-admin',
    settings: getSettings(false),
    messages: readJson('messages.json', []),
    analytics,
    csrfToken: req.csrfToken(),
    saved: req.query.saved === '1'
  });
});

router.post('/settings', auth, upload.fields(settingUploadFields), sanitizeBody, (req, res) => {
  const old = getSettings(false);

  const sliders = Array.from({ length: 6 }, (_, i) => {
    const n = i + 1;
    const oldSlide = (old.sliders && old.sliders[i]) || (DEFAULT_SLIDES && DEFAULT_SLIDES[i]) || {};
    return {
      image: uploadUrl(req, `slide${n}Image`, oldSlide.image),
      link: req.body[`slide${n}Link`] || oldSlide.link || '#',
      active: req.body[`slide${n}Active`] === 'on'
    };
  });

  const launcherButtons = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const oldButton = (old.launcherButtons && old.launcherButtons[i]) || (DEFAULT_LAUNCHER_BUTTONS && DEFAULT_LAUNCHER_BUTTONS[i]) || {};
    return {
      title: req.body[`button${n}Title`] || oldButton.title || `MENU ${n}`,
      link: req.body[`button${n}Link`] || oldButton.link || '#',
      active: req.body[`button${n}Active`] === 'on',
      featured: req.body[`button${n}Featured`] === 'on'
    };
  });

  const data = {
    ...old,
    siteName: req.body.siteName || old.siteName || 'OMTOGEL',
    siteDescription: req.body.siteDescription || '',
    siteKeywords: req.body.siteKeywords || '',
    footerText: req.body.footerText || old.footerText || '',
    logoUrl: uploadUrl(req, 'logoUrl', old.logoUrl),
    faviconUrl: uploadUrl(req, 'faviconUrl', old.faviconUrl),
    appIconUrl: uploadUrl(req, 'appIconUrl', old.appIconUrl),
    splashImageUrl: uploadUrl(req, 'splashImageUrl', old.splashImageUrl),
    backgroundDesktopUrl: uploadUrl(req, 'backgroundDesktopUrl', old.backgroundDesktopUrl),
    backgroundMobileUrl: uploadUrl(req, 'backgroundMobileUrl', old.backgroundMobileUrl),
    heroBannerUrl: uploadUrl(req, 'heroBannerUrl', old.heroBannerUrl),
    heroBannerLink: req.body.heroBannerLink || old.heroBannerLink || '#',
    loginUrl: req.body.loginUrl || '#',
    registerUrl: req.body.registerUrl || '#',
    rtpUrl: req.body.rtpUrl || '#',
    promoUrl: req.body.promoUrl || '#',
    buktiJpUrl: req.body.buktiJpUrl || '#',
    prediksiUrl: req.body.prediksiUrl || '#',
    alternatifUrl: req.body.alternatifUrl || '#',
    liveDrawUrl: req.body.liveDrawUrl || '#',
    whatsappUrl: req.body.whatsappUrl || '#',
    liveChatUrl: req.body.liveChatUrl || '#',
    inboxUrl: req.body.inboxUrl || '/inbox-frame',
    bottomHomeUrl: req.body.bottomHomeUrl || '/',
    bottomDaftarUrl: req.body.bottomDaftarUrl || req.body.registerUrl || '#',
    bottomWhatsappUrl: req.body.bottomWhatsappUrl || req.body.whatsappUrl || '#',
    bottomLiveChatUrl: req.body.bottomLiveChatUrl || req.body.liveChatUrl || '#',
    themeColor: req.body.themeColor || '#050505',
    accentColor: req.body.accentColor || '#f5c542',
    buttonTextColor: req.body.buttonTextColor || '#ffffff',
    buttonFeaturedColor: req.body.buttonFeaturedColor || '#d00000',
    radius: req.body.radius || '24',
    animationSpeed: req.body.animationSpeed || '180',
    firebaseApiKey: req.body.firebaseApiKey || '',
    firebaseAuthDomain: req.body.firebaseAuthDomain || '',
    firebaseProjectId: req.body.firebaseProjectId || '',
    firebaseStorageBucket: req.body.firebaseStorageBucket || '',
    firebaseMessagingSenderId: req.body.firebaseMessagingSenderId || '',
    firebaseAppId: req.body.firebaseAppId || '',
    firebaseVapidKey: req.body.firebaseVapidKey || '',
    sliders,
    launcherButtons,
    menuCards: launcherButtons.map((btn) => ({ title: btn.title, link: btn.link, active: btn.active, featured: btn.featured, desc: 'Launcher button', image: '', icon: '' }))
  };

  writeJson('settings.json', data);
  if (global.io) global.io.emit('settings:update', data);
  res.redirect('/itsiregar8008?saved=1');
});

router.post('/message/add', auth, upload.single('messageImageFile'), sanitizeBody, async (req, res) => {
  const messages = readJson('messages.json', []);
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || '');
  const msg = {
    id: Date.now().toString(),
    title: req.body.title || 'PESAN OMTOGEL',
    message: req.body.message || '',
    imageUrl,
    link: req.body.link || '',
    category: req.body.category || 'INFO',
    read: false,
    date: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
  };
  messages.unshift(msg);
  writeJson('messages.json', messages);
  await sendBroadcast(msg.title, msg.message, msg.link || '/#inbox');
  if (global.io) global.io.emit('messages:update', { unread: messages.filter((m) => !m.read).length, messages });
  res.redirect('/itsiregar8008#messages');
});

router.post('/message/delete/:id', auth, (req, res) => {
  const messages = readJson('messages.json', []).filter((item) => item.id !== req.params.id);
  writeJson('messages.json', messages);
  if (global.io) global.io.emit('messages:update', { unread: messages.filter((m) => !m.read).length, messages });
  res.redirect('/itsiregar8008#messages');
});

router.post('/messages/clear', auth, (req, res) => {
  writeJson('messages.json', []);
  if (global.io) global.io.emit('messages:update', { unread: 0, messages: [] });
  res.redirect('/itsiregar8008#messages');
});

module.exports = router;
