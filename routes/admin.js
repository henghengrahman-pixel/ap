const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const { loginLimiter, sanitizeBody } = require('../middleware/security');
const { readJson, writeJson } = require('../helpers/json-db');
const {
  getSettings,
  DEFAULT_LAUNCHER_BUTTONS,
  DEFAULT_SLIDES
} = require('../helpers/settings');
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
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_SIZE || 10 * 1024 * 1024)
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('File harus berupa gambar.'));
    }
    return cb(null, true);
  }
});

const settingUploadFields = [
  'logoUrl',
  'faviconUrl',
  'appIconUrl',
  'splashImageUrl',
  'backgroundDesktopUrl',
  'backgroundMobileUrl',
  'heroBannerUrl',
  ...Array.from({ length: 6 }, (_, i) => `slide${i + 1}Image`)
].map((name) => ({ name, maxCount: 1 }));

function runUpload(fields) {
  return (req, res, next) => {
    const handler = Array.isArray(fields) ? upload.fields(fields) : upload.single(fields);
    handler(req, res, (err) => {
      if (err) {
        console.error('UPLOAD ERROR:', err.message);
        return res.status(400).send(`Upload gagal: ${err.message}`);
      }
      return next();
    });
  };
}

function uploadUrl(req, field, oldValue = '') {
  if (req.files && req.files[field] && req.files[field][0]) {
    return `/uploads/${req.files[field][0].filename}`;
  }
  if (req.file && req.file.fieldname === field) {
    return `/uploads/${req.file.filename}`;
  }
  return typeof req.body[field] === 'string' && req.body[field].trim()
    ? req.body[field].trim()
    : oldValue || '';
}

function bodyValue(req, key, fallback = '') {
  if (typeof req.body[key] === 'string') return req.body[key].trim();
  return fallback;
}

function checkbox(req, key, fallback = false) {
  if (Object.prototype.hasOwnProperty.call(req.body, key)) return req.body[key] === 'on';
  return !!fallback;
}

function isValidAdminPassword(password) {
  if (process.env.ADMIN_PASSWORD_HASH) {
    return bcrypt.compareSync(password || '', process.env.ADMIN_PASSWORD_HASH);
  }
  return password === process.env.ADMIN_PASSWORD;
}

router.get('/login', (req, res) => {
  res.render('admin/login', {
    layout: false,
    error: null,
    csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : ''
  });
});

router.post('/login', loginLimiter, sanitizeBody, (req, res) => {
  const username = bodyValue(req, 'username');
  const password = bodyValue(req, 'password');

  if (username === process.env.ADMIN_ID && isValidAdminPassword(password)) {
    req.session.admin = true;
    return req.session.save(() => res.redirect('/itsiregar8008'));
  }

  return res.status(401).render('admin/login', {
    layout: false,
    error: 'Login gagal. Admin ID atau password salah.',
    csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : ''
  });
});

router.get('/logout', auth, (req, res) => {
  req.session.destroy(() => res.redirect('/itsiregar8008/login'));
});

router.get('/', auth, (req, res) => {
  const analytics = readJson('analytics.json', { clicks: {}, installs: 0 });

  res.render('admin/settings', {
    layout: 'layouts/main-admin',
    settings: getSettings(false),
    messages: readJson('messages.json', []),
    analytics,
    csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : '',
    saved: req.query.saved === '1',
    error: req.query.error || ''
  });
});

router.post(
  '/settings',
  auth,
  runUpload(settingUploadFields),
  sanitizeBody,
  (req, res) => {
    try {
      const old = getSettings(false);

      const sliders = Array.from({ length: 6 }, (_, i) => {
        const n = i + 1;
        const oldSlide = (old.sliders && old.sliders[i]) || (DEFAULT_SLIDES && DEFAULT_SLIDES[i]) || {};
        return {
          image: uploadUrl(req, `slide${n}Image`, oldSlide.image),
          link: bodyValue(req, `slide${n}Link`, oldSlide.link || '#') || '#',
          active: checkbox(req, `slide${n}Active`, oldSlide.active !== false)
        };
      });

      const launcherButtons = Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const oldButton =
          (old.launcherButtons && old.launcherButtons[i]) ||
          (DEFAULT_LAUNCHER_BUTTONS && DEFAULT_LAUNCHER_BUTTONS[i]) ||
          {};
        return {
          title: bodyValue(req, `button${n}Title`, oldButton.title || `MENU ${n}`) || `MENU ${n}`,
          link: bodyValue(req, `button${n}Link`, oldButton.link || '#') || '#',
          active: checkbox(req, `button${n}Active`, oldButton.active !== false),
          featured: checkbox(req, `button${n}Featured`, !!oldButton.featured)
        };
      });

      const data = {
        ...old,

        siteName: bodyValue(req, 'siteName', old.siteName || 'OMTOGEL') || 'OMTOGEL',
        siteDescription: bodyValue(req, 'siteDescription', old.siteDescription || ''),
        siteKeywords: bodyValue(req, 'siteKeywords', old.siteKeywords || ''),
        footerText: bodyValue(req, 'footerText', old.footerText || ''),

        logoUrl: uploadUrl(req, 'logoUrl', old.logoUrl),
        faviconUrl: uploadUrl(req, 'faviconUrl', old.faviconUrl),
        appIconUrl: uploadUrl(req, 'appIconUrl', old.appIconUrl),
        splashImageUrl: uploadUrl(req, 'splashImageUrl', old.splashImageUrl),
        backgroundDesktopUrl: uploadUrl(req, 'backgroundDesktopUrl', old.backgroundDesktopUrl),
        backgroundMobileUrl: uploadUrl(req, 'backgroundMobileUrl', old.backgroundMobileUrl),
        heroBannerUrl: uploadUrl(req, 'heroBannerUrl', old.heroBannerUrl),
        heroBannerLink: bodyValue(req, 'heroBannerLink', old.heroBannerLink || '#') || '#',

        loginUrl: bodyValue(req, 'loginUrl', old.loginUrl || '#') || '#',
        registerUrl: bodyValue(req, 'registerUrl', old.registerUrl || '#') || '#',
        rtpUrl: bodyValue(req, 'rtpUrl', old.rtpUrl || '#') || '#',
        promoUrl: bodyValue(req, 'promoUrl', old.promoUrl || '#') || '#',
        buktiJpUrl: bodyValue(req, 'buktiJpUrl', old.buktiJpUrl || '#') || '#',
        prediksiUrl: bodyValue(req, 'prediksiUrl', old.prediksiUrl || '#') || '#',
        alternatifUrl: bodyValue(req, 'alternatifUrl', old.alternatifUrl || '#') || '#',
        liveDrawUrl: bodyValue(req, 'liveDrawUrl', old.liveDrawUrl || '#') || '#',
        whatsappUrl: bodyValue(req, 'whatsappUrl', old.whatsappUrl || '#') || '#',
        liveChatUrl: bodyValue(req, 'liveChatUrl', old.liveChatUrl || '#') || '#',
        inboxUrl: bodyValue(req, 'inboxUrl', old.inboxUrl || '/inbox-frame') || '/inbox-frame',

        bottomHomeUrl: bodyValue(req, 'bottomHomeUrl', old.bottomHomeUrl || '/') || '/',
        bottomDaftarUrl:
          bodyValue(req, 'bottomDaftarUrl', old.bottomDaftarUrl || '') ||
          bodyValue(req, 'registerUrl', old.registerUrl || '#') ||
          '#',
        bottomWhatsappUrl:
          bodyValue(req, 'bottomWhatsappUrl', old.bottomWhatsappUrl || '') ||
          bodyValue(req, 'whatsappUrl', old.whatsappUrl || '#') ||
          '#',
        bottomLiveChatUrl:
          bodyValue(req, 'bottomLiveChatUrl', old.bottomLiveChatUrl || '') ||
          bodyValue(req, 'liveChatUrl', old.liveChatUrl || '#') ||
          '#',

        themeColor: bodyValue(req, 'themeColor', old.themeColor || '#050505') || '#050505',
        accentColor: bodyValue(req, 'accentColor', old.accentColor || '#f5c542') || '#f5c542',
        buttonTextColor: bodyValue(req, 'buttonTextColor', old.buttonTextColor || '#ffffff') || '#ffffff',
        buttonFeaturedColor: bodyValue(req, 'buttonFeaturedColor', old.buttonFeaturedColor || '#d00000') || '#d00000',
        radius: bodyValue(req, 'radius', old.radius || '24') || '24',
        animationSpeed: bodyValue(req, 'animationSpeed', old.animationSpeed || '180') || '180',

        firebaseApiKey: bodyValue(req, 'firebaseApiKey', old.firebaseApiKey || ''),
        firebaseAuthDomain: bodyValue(req, 'firebaseAuthDomain', old.firebaseAuthDomain || ''),
        firebaseProjectId: bodyValue(req, 'firebaseProjectId', old.firebaseProjectId || ''),
        firebaseStorageBucket: bodyValue(req, 'firebaseStorageBucket', old.firebaseStorageBucket || ''),
        firebaseMessagingSenderId: bodyValue(req, 'firebaseMessagingSenderId', old.firebaseMessagingSenderId || ''),
        firebaseAppId: bodyValue(req, 'firebaseAppId', old.firebaseAppId || ''),
        firebaseVapidKey: bodyValue(req, 'firebaseVapidKey', old.firebaseVapidKey || ''),

        sliders,
        launcherButtons,
        menuCards: launcherButtons.map((btn) => ({
          title: btn.title,
          link: btn.link,
          active: btn.active,
          featured: btn.featured,
          desc: 'Launcher button',
          image: '',
          icon: ''
        }))
      };

      writeJson('settings.json', data);

      if (global.io) global.io.emit('settings:update', data);

      return req.session.save(() => res.redirect('/itsiregar8008?saved=1'));
    } catch (err) {
      console.error('SAVE SETTINGS ERROR:', err);
      return res.redirect('/itsiregar8008?error=' + encodeURIComponent('Setting gagal disimpan: ' + err.message));
    }
  }
);

router.post('/message/add', auth, runUpload('messageImageFile'), sanitizeBody, async (req, res) => {
  try {
    const messages = readJson('messages.json', []);
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : bodyValue(req, 'imageUrl', '');

    const msg = {
      id: Date.now().toString(),
      title: bodyValue(req, 'title', 'PESAN OMTOGEL') || 'PESAN OMTOGEL',
      message: bodyValue(req, 'message', ''),
      imageUrl,
      link: bodyValue(req, 'link', ''),
      category: bodyValue(req, 'category', 'INFO') || 'INFO',
      read: false,
      date: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    };

    messages.unshift(msg);
    writeJson('messages.json', messages);

    await sendBroadcast(msg.title, msg.message, msg.link || '/#inbox');

    if (global.io) {
      global.io.emit('messages:update', {
        unread: messages.filter((m) => !m.read).length,
        messages
      });
    }

    return req.session.save(() => res.redirect('/itsiregar8008?saved=1#messages'));
  } catch (err) {
    console.error('SAVE MESSAGE ERROR:', err);
    return res.redirect('/itsiregar8008?error=' + encodeURIComponent('Pesan gagal dikirim: ' + err.message));
  }
});

router.post('/message/delete/:id', auth, (req, res) => {
  const messages = readJson('messages.json', []).filter((item) => item.id !== req.params.id);
  writeJson('messages.json', messages);

  if (global.io) {
    global.io.emit('messages:update', {
      unread: messages.filter((m) => !m.read).length,
      messages
    });
  }

  return res.redirect('/itsiregar8008?saved=1#messages');
});

router.post('/messages/clear', auth, (req, res) => {
  writeJson('messages.json', []);

  if (global.io) {
    global.io.emit('messages:update', {
      unread: 0,
      messages: []
    });
  }

  return res.redirect('/itsiregar8008?saved=1#messages');
});

module.exports = router;
