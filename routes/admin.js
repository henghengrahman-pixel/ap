const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const auth = require('../middleware/auth');
const { readJson, writeJson } = require('../helpers/json-db');
const { defaultSettings, getSettings } = require('../helpers/settings');

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
  if (req.files && req.files[field] && req.files[field][0]) return `/uploads/${req.files[field][0].filename}`;
  return req.body[field] || oldValue || '';
}

const settingUploadFields = [
  { name: 'logoUrl', maxCount: 1 },
  { name: 'faviconUrl', maxCount: 1 },
  ...Array.from({ length: 8 }, (_, i) => ({ name: `menuCard${i + 1}Image`, maxCount: 1 }))
];

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
  res.render('admin/settings', {
    layout: 'layouts/main-admin',
    settings: getSettings(false),
    messages: readJson('messages.json', [])
  });
});

router.post('/settings', auth, upload.fields(settingUploadFields), (req, res) => {
  const old = getSettings(false);
  const menuCards = Array.from({ length: 8 }, (_, i) => {
    const n = i + 1;
    const oldCard = old.menuCards[i] || defaultSettings.menuCards[i] || {};
    return {
      title: req.body[`menuCard${n}Title`] || oldCard.title || `MENU ${n}`,
      desc: req.body[`menuCard${n}Desc`] || oldCard.desc || 'Atur dari admin',
      image: uploadUrl(req, `menuCard${n}Image`, oldCard.image),
      link: req.body[`menuCard${n}Link`] || oldCard.link || '#'
    };
  });

  const data = {
    siteName: req.body.siteName || old.siteName || 'OMTOGEL',
    siteDescription: req.body.siteDescription || '',
    siteKeywords: req.body.siteKeywords || '',
    logoUrl: uploadUrl(req, 'logoUrl', old.logoUrl),
    faviconUrl: uploadUrl(req, 'faviconUrl', old.faviconUrl),
    mainWebviewUrl: req.body.mainWebviewUrl || '/blank-frame',
    liveDrawUrl: req.body.liveDrawUrl || '#',
    whatsappUrl: req.body.whatsappUrl || '#',
    inboxUrl: req.body.inboxUrl || '/inbox-frame',
    menuCards
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
