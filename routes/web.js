const express = require('express');
const router = express.Router();
const { getSettings } = require('../helpers/settings');
const { getDb, isMongoReady } = require('../helpers/db');

async function getMessages() {
  if (!isMongoReady()) return [];
  return getDb().collection('messages').find({}).sort({ createdAt: -1 }).limit(100).toArray();
}

router.get('/', async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.render('home', { layout: 'layouts/main', settings });
  } catch (err) { next(err); }
});

router.get('/inbox', async (req, res, next) => {
  try {
    const settings = await getSettings();
    const messages = await getMessages();
    res.render('inbox', { layout: 'layouts/main', settings, messages });
  } catch (err) { next(err); }
});

router.get('/go', async (req, res) => {
  const url = String(req.query.url || '').trim();
  if (!url || url === '#') return res.redirect('/');
  return res.redirect(url);
});

module.exports = router;
