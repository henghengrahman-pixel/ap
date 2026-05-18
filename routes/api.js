const express = require('express');
const router = express.Router();
const { readJson, writeJson } = require('../helpers/json-db');
const { getSettings } = require('../helpers/settings');
const { saveToken, subscribeTopic, sendBroadcast } = require('../services/fcm');

router.get('/settings', (req, res) => res.json({ success: true, settings: getSettings(true) }));

router.get('/messages', (req, res) => {
  const messages = readJson('messages.json', []);
  res.json({ success: true, unread: messages.filter((m) => !m.read).length, messages });
});

router.post('/messages/read-all', (req, res) => {
  const messages = readJson('messages.json', []).map((item) => ({ ...item, read: true }));
  writeJson('messages.json', messages);
  if (global.io) global.io.emit('messages:update', { unread: 0, messages });
  res.json({ success: true, unread: 0 });
});

router.get('/home-data', (req, res) => {
  res.json({
    success: true,
    settings: getSettings(true),
    messages: readJson('messages.json', []),
    analytics: readJson('analytics.json', { clicks: {}, installs: 0 })
  });
});

router.post('/track-click', (req, res) => {
  const key = String(req.body.key || 'unknown').slice(0, 80);
  const analytics = readJson('analytics.json', { clicks: {}, installs: 0 });
  analytics.clicks[key] = (analytics.clicks[key] || 0) + 1;
  analytics.lastClickAt = new Date().toISOString();
  writeJson('analytics.json', analytics);
  res.json({ success: true });
});

router.post('/push/token', (req, res) => {
  const token = String(req.body.token || '').trim();
  if (!token) return res.status(400).json({ success: false, message: 'Token kosong' });
  saveToken(token);
  subscribeTopic(token, 'all');
  res.json({ success: true });
});

router.post('/push/test', async (req, res) => {
  const result = await sendBroadcast(req.body.title || 'OMTOGEL', req.body.body || 'Notifikasi aktif', req.body.url || '/');
  res.json({ success: true, result });
});

module.exports = router;
