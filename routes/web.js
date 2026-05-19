const express = require('express');
const router = express.Router();
const { getSettings, getSliders } = require('../helpers/storage');

router.get('/', (req, res) => {
  const settings = getSettings();
  const sliders = getSliders().filter(item => item.active !== false && item.imageUrl);
  res.render('index', { title: settings.siteName || 'OMTOGEL', settings, sliders });
});

router.get('/refresh', (req, res) => res.redirect('/'));

module.exports = router;
