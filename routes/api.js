const express = require('express');
const router = express.Router();
const { readJson, writeJson } = require('../helpers/json-db');

router.get('/settings', (req, res) => {
  res.json({ success: true, settings: readJson('settings.json', {}) });
});

router.get('/messages', (req, res) => {
  const messages = readJson('messages.json', []);
  res.json({ success: true, unread: messages.filter(m => !m.read).length, messages });
});

router.post('/messages/read-all', (req, res) => {
  const messages = readJson('messages.json', []).map(item => ({ ...item, read: true }));
  writeJson('messages.json', messages);
  if (global.io) global.io.emit('messages:update', { unread: 0, messages });
  res.json({ success: true, unread: 0 });
});

router.get('/home-data', (req, res) => {
  res.json({
    success: true,
    settings: readJson('settings.json', {}),
    sliders: readJson('sliders.json', []),
    popup: readJson('popup.json', {}),
    menus: readJson('menus.json', []),
    messages: readJson('messages.json', [])
  });
});

module.exports = router;
