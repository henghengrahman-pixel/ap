const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const auth = require('../middleware/auth');
const { readJson, writeJson } = require('../helpers/json-db');

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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) return cb(new Error('File harus gambar.'));
    cb(null, true);
  }
});

function uploadUrl(req, field, oldValue = '') {
  if (req.files && req.files[field] && req.files[field][0]) {
    return `/uploads/${req.files[field][0].filename}`;
  }
  return req.body[field] || oldValue || '';
}

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
    settings: { ...defaultSettings, ...readJson('settings.json', {}) },
    messages: readJson('messages.json', [])
  });
});

router.post('/settings', auth, upload.fields([
  { name: 'logoUrl', maxCount: 1 },
  { name: 'faviconUrl', maxCount: 1 },
  { name: 'menuCard1Image', maxCount: 1 },
  { name: 'menuCard2Image', maxCount: 1 },
  { name: 'menuCard3Image', maxCount: 1 },
  { name: 'menuCard4Image', maxCount: 1 }
]), (req, res) => {
  const old = { ...defaultSettings, ...readJson('settings.json', {}) };
  const data = {
    ...old,
    siteName: req.body.siteName || old.siteName,
    siteDescription: req.body.siteDescription || '',
    siteKeywords: req.body.siteKeywords || '',
    logoUrl: uploadUrl(req, 'logoUrl', old.logoUrl),
    faviconUrl: uploadUrl(req, 'faviconUrl', old.faviconUrl),
    primaryColor: req.body.primaryColor || old.primaryColor,
    accentColor: req.body.accentColor || old.accentColor,
    mainWebviewUrl: req.body.mainWebviewUrl || '/blank-frame',
    liveDrawUrl: req.body.liveDrawUrl || '#',
    whatsappUrl: req.body.whatsappUrl || '#',
    inboxUrl: req.body.inboxUrl || '/inbox-frame',
    menuCard1Title: req.body.menuCard1Title || 'RTP SLOT GACOR',
    menuCard1Desc: req.body.menuCard1Desc || 'Provider Lengkap',
    menuCard1Image: uploadUrl(req, 'menuCard1Image', old.menuCard1Image),
    menuCard1Link: req.body.menuCard1Link || '#',
    menuCard2Title: req.body.menuCard2Title || 'PREDIKSI',
    menuCard2Desc: req.body.menuCard2Desc || 'Togel Jitu',
    menuCard2Image: uploadUrl(req, 'menuCard2Image', old.menuCard2Image),
    menuCard2Link: req.body.menuCard2Link || '#',
    menuCard3Title: req.body.menuCard3Title || 'BUKTI JACKPOT',
    menuCard3Desc: req.body.menuCard3Desc || 'Pasti Bayar',
    menuCard3Image: uploadUrl(req, 'menuCard3Image', old.menuCard3Image),
    menuCard3Link: req.body.menuCard3Link || '#',
    menuCard4Title: req.body.menuCard4Title || 'JADWAL PASARAN',
    menuCard4Desc: req.body.menuCard4Desc || 'Live Update',
    menuCard4Image: uploadUrl(req, 'menuCard4Image', old.menuCard4Image),
    menuCard4Link: req.body.menuCard4Link || '#'
  };
  writeJson('settings.json', data);
  if (global.io) global.io.emit('settings:update', data);
  res.redirect('/itsiregar8008');
});

router.post('/message/add', auth, upload.single('messageImageFile'), (req, res) => {
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
