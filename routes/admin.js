const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const auth = require('../middleware/auth');

const {
  readJson,
  writeJson
} = require('../helpers/json-db');

const {
  sendBroadcast
} = require('../services/fcm');

const router = express.Router();

const uploadDir = path.join(
  process.cwd(),
  'public',
  'uploads'
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true
  });
}

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {

    const safeName = file.originalname
      .replace(/\s+/g, '-')
      .replace(/[^\w.-]/g, '');

    cb(
      null,
      Date.now() + '-' + safeName
    );

  }

});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});


router.get('/login', (req, res) => {

  res.render('admin/login', {
    layout: false,
    error: null
  });

});


router.post('/login', (req, res) => {

  const {
    username,
    password
  } = req.body;

  if (
    username === process.env.ADMIN_ID &&
    password === process.env.ADMIN_PASSWORD
  ) {

    req.session.admin = true;

    return res.redirect('/itsiregar8008');

  }

  return res.render('admin/login', {
    layout: false,
    error: 'Login gagal'
  });

});


router.get('/logout', (req, res) => {

  req.session.destroy(() => {
    res.redirect('/itsiregar8008/login');
  });

});


router.get('/', auth, (req, res) => {

  const settings = readJson(
    'settings.json',
    {}
  );

  const sliders = readJson(
    'sliders.json',
    []
  );

  const popup = readJson(
    'popup.json',
    {}
  );

  const menus = readJson(
    'menus.json',
    []
  );

  res.render('admin/dashboard', {
    layout: 'layouts/main-admin',
    settings,
    sliders,
    popup,
    menus
  });

});


router.post(
  '/settings',
  auth,
  upload.fields([
    { name: 'logo' },
    { name: 'background' },
    { name: 'favicon' }
  ]),
  (req, res) => {

    const old = readJson(
      'settings.json',
      {}
    );

    const data = {
      ...old,
      ...req.body
    };

    if (
      req.files &&
      req.files.logo
    ) {

      data.logoUrl =
        '/uploads/' +
        req.files.logo[0].filename;

    }

    if (
      req.files &&
      req.files.background
    ) {

      data.backgroundUrl =
        '/uploads/' +
        req.files.background[0].filename;

    }

    if (
      req.files &&
      req.files.favicon
    ) {

      data.faviconUrl =
        '/uploads/' +
        req.files.favicon[0].filename;

    }

    writeJson(
      'settings.json',
      data
    );

    return res.redirect(
      '/itsiregar8008'
    );

  }
);


router.post(
  '/slider/add',
  auth,
  upload.single('image'),
  (req, res) => {

    const sliders = readJson(
      'sliders.json',
      []
    );

    if (!req.file) {
      return res.redirect(
        '/itsiregar8008'
      );
    }

    sliders.unshift({

      id: Date.now().toString(),

      title:
        req.body.title || '',

      link:
        req.body.link || '#',

      image:
        '/uploads/' +
        req.file.filename

    });

    writeJson(
      'sliders.json',
      sliders
    );

    return res.redirect(
      '/itsiregar8008'
    );

  }
);


router.post(
  '/slider/delete/:id',
  auth,
  (req, res) => {

    const sliders = readJson(
      'sliders.json',
      []
    );

    const target = sliders.find(
      item =>
        item.id === req.params.id
    );

    if (target && target.image) {

      const imagePath = path.join(
        process.cwd(),
        'public',
        target.image
      );

      if (
        fs.existsSync(imagePath)
      ) {

        try {
          fs.unlinkSync(imagePath);
        } catch (e) {
          console.log(e.message);
        }

      }

    }

    const filtered = sliders.filter(
      item =>
        item.id !== req.params.id
    );

    writeJson(
      'sliders.json',
      filtered
    );

    return res.redirect(
      '/itsiregar8008'
    );

  }
);


router.post(
  '/popup',
  auth,
  upload.single('image'),
  (req, res) => {

    const popup = {
      title:
        req.body.title || '',

      description:
        req.body.description || '',

      link:
        req.body.link || '#',

      image:
        req.file
          ? '/uploads/' +
            req.file.filename
          : ''
    };

    writeJson(
      'popup.json',
      popup
    );

    return res.redirect(
      '/itsiregar8008'
    );

  }
);


router.post(
  '/broadcast',
  auth,
  async (req, res) => {

    try {

      await sendBroadcast(
        req.body.title,
        req.body.message
      );

      return res.redirect(
        '/itsiregar8008'
      );

    } catch (err) {

      console.log(err);

      return res.redirect(
        '/itsiregar8008'
      );

    }

  }
);


module.exports = router;
