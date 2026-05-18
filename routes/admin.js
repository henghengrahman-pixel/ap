const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const { loginLimiter, sanitizeBody } = require('../middleware/security');
const { readJson, writeJson } = require('../helpers/json-db');
const { defaultSettings, getSettings } = require('../helpers/settings');
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
  'logoUrl', 'faviconUrl', 'appIconUrl', 'splashImageUrl', 'backgroundDesktopUrl', 'backgroundMobileUrl', 'popupPromoImageUrl',
  ...Array.from({ length: 8 }, (_, i) => `menuCard${i + 1}Image`)
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
  const menuCards = Array.from({ length: 8 }, (_, i) => {
    const n = i + 1;
    const oldCard = old.menuCards[i] || defaultSettings.menuCards[i] || {};
    return {
      title: req.body[`menuCard${n}Title`] || oldCard.title || `MENU ${n}`,
      desc: req.body[`menuCard${n}Desc`] || oldCard.desc || 'Atur dari admin',
      icon: req.body[`menuCard${n}Icon`] || oldCard.icon || 'fa-circle',
      image: uploadUrl(req, `menuCard${n}Image`, oldCard.image),
      link: req.body[`menuCard${n}Link`] || oldCard.link || '#',
      active: req.body[`menuCard${n}Active`] === 'on'
    };
  });

  const data = {
    ...old,
    siteName: req.body.siteName || old.siteName || 'OMTOGEL',
    siteDescription: req.body.siteDescription || '',
    siteKeywords: req.body.siteKeywords || '',
    footerText: req.body.footerText || old.footerText || '',
    runningText: req.body.runningText || old.runningText || '',
    logoUrl: uploadUrl(req, 'logoUrl', old.logoUrl),
    faviconUrl: uploadUrl(req, 'faviconUrl', old.faviconUrl),
    appIconUrl: uploadUrl(req, 'appIconUrl', old.appIconUrl),
    splashImageUrl: uploadUrl(req, 'splashImageUrl', old.splashImageUrl),
    backgroundDesktopUrl: uploadUrl(req, 'backgroundDesktopUrl', old.backgroundDesktopUrl),
    backgroundMobileUrl: uploadUrl(req, 'backgroundMobileUrl', old.backgroundMobileUrl),
    popupPromoImageUrl: uploadUrl(req, 'popupPromoImageUrl', old.popupPromoImageUrl),
    popupPromoLink: req.body.popupPromoLink || old.popupPromoLink || '',
    mainWebviewUrl: req.body.mainWebviewUrl || '/blank-frame',
    liveDrawUrl: req.body.liveDrawUrl || '#',
    whatsappUrl: req.body.whatsappUrl || '#',
    inboxUrl: req.body.inboxUrl || '/inbox-frame',
    registerUrl: req.body.registerUrl || '#',
    loginUrl: req.body.loginUrl || '#',
    socialTelegram: req.body.socialTelegram || '',
    socialInstagram: req.body.socialInstagram || '',
    socialWhatsapp: req.body.socialWhatsapp || '',
    themeColor: req.body.themeColor || '#050505',
    accentColor: req.body.accentColor || '#f5c542',
    navbarColor: req.body.navbarColor || '#090909',
    menuColor: req.body.menuColor || '#101114',
    glassOpacity: req.body.glassOpacity || '0.78',
    radius: req.body.radius || '22',
    animationSpeed: req.body.animationSpeed || '220',
    firebaseApiKey: req.body.firebaseApiKey || '',
    firebaseAuthDomain: req.body.firebaseAuthDomain || '',
    firebaseProjectId: req.body.firebaseProjectId || '',
    firebaseStorageBucket: req.body.firebaseStorageBucket || '',
    firebaseMessagingSenderId: req.body.firebaseMessagingSenderId || '',
    firebaseAppId: req.body.firebaseAppId || '',
    firebaseVapidKey: req.body.firebaseVapidKey || '',
    menuCards
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
