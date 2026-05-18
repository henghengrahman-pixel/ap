const express = require('express');
const router = express.Router();
const { getSettings } = require('../helpers/settings');
const { getDb, isMongoReady } = require('../helpers/db');

router.get('/settings', async (req, res, next) => {
  try { res.json({ success: true, settings: await getSettings() }); } catch (err) { next(err); }
});

router.get('/home-data', async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({ success: true, settings, sliders: settings.sliders, menus: settings.buttons, popup: { imageUrl: settings.popupImageUrl, link: settings.popupLink, timer: settings.popupTimer, active: settings.popupActive }, bottomNav: settings.bottomNav });
  } catch (err) { next(err); }
});

router.get('/messages', async (req, res, next) => {
  try {
    const messages = isMongoReady() ? await getDb().collection('messages').find({}).sort({ createdAt: -1 }).limit(100).toArray() : [];
    res.json({ success: true, messages });
  } catch (err) { next(err); }
});

module.exports = router;
