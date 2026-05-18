const express = require('express');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const { getSettings, saveSettings, cleanText, cleanUrl, toBool, toInt, readCollection } = require('../helpers/settings');

const router = express.Router();
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const MESSAGE_FILE = path.join(DATA_DIR, 'messages.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(MESSAGE_FILE)) fs.writeFileSync(MESSAGE_FILE, JSON.stringify([], null, 2));

function getMessages() {
  try { return JSON.parse(fs.readFileSync(MESSAGE_FILE, 'utf8') || '[]'); }
  catch (err) { console.error('GET MESSAGE ERROR', err); return []; }
}
function saveMessages(data = []) {
  try {
    const tempFile = MESSAGE_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
    fs.renameSync(tempFile, MESSAGE_FILE);
  } catch (err) { console.error('SAVE MESSAGE ERROR', err); }
}

router.get('/login', async (req, res, next) => {
  try {
    if (req.session && req.session.admin === true) return res.redirect('/PINKTIGER8008');
    return res.render('admin/login', { layout: false, error: null, settings: await getSettings() });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '').trim();
    const adminId = String(process.env.ADMIN_ID || 'admin').trim();
    const adminPassword = String(process.env.ADMIN_PASSWORD || 'admin123').trim();
    if (username === adminId && password === adminPassword) {
      req.session.admin = true;
      return req.session.save(() => res.redirect('/PINKTIGER8008'));
    }
    return res.status(401).render('admin/login', { layout: false, error: 'ID atau password salah.', settings: await getSettings() });
  } catch (err) { next(err); }
});

router.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/PINKTIGER8008/login')));

router.get('/', auth, async (req, res, next) => {
  try {
    const settings = await getSettings();
    const messages = getMessages().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.render('admin/settings', { layout: 'layouts/main-admin', settings, messages });
  } catch (err) { next(err); }
});

router.post('/settings', auth, async (req, res, next) => {
  try {
    const old = await getSettings();

    const sliders = readCollection('slide', req.body, 10, (n) => ({
      id: cleanText(req.body[`slide${n}Id`]) || `slide-${Date.now()}-${n}`,
      title: cleanText(req.body[`slide${n}Title`]) || `Slide ${n}`,
      imageUrl: cleanUrl(req.body[`slide${n}ImageUrl`]),
      link: cleanUrl(req.body[`slide${n}Link`], '#'),
      order: toInt(req.body[`slide${n}Order`], n),
      active: toBool(req.body[`slide${n}Active`])
    })).filter(item => item.imageUrl || item.title).sort((a, b) => a.order - b.order);

    const buttons = readCollection('button', req.body, 12, (n) => ({
      id: cleanText(req.body[`button${n}Id`]) || `button-${Date.now()}-${n}`,
      title: cleanText(req.body[`button${n}Title`]),
      link: cleanUrl(req.body[`button${n}Link`], '#'),
      icon: cleanText(req.body[`button${n}Icon`]),
      color: cleanText(req.body[`button${n}Color`], 'silver'),
      order: toInt(req.body[`button${n}Order`], n),
      active: toBool(req.body[`button${n}Active`])
    })).filter(item => item.title).sort((a, b) => a.order - b.order);

    const navKeys = ['home', 'daftar', 'whatsapp', 'livechat'];
    const bottomNav = navKeys.map((key, index) => {
      const n = index + 1;
      return {
        id: cleanText(req.body[`nav${n}Id`]) || `nav-${n}`,
        key,
        title: cleanText(req.body[`nav${n}Title`], old.bottomNav?.[index]?.title || key.toUpperCase()),
        link: key === 'home' ? '/' : cleanUrl(req.body[`nav${n}Link`], '#'),
        order: n,
        active: toBool(req.body[`nav${n}Active`])
      };
    });

    const data = {
      ...old,
      siteName: cleanText(req.body.siteName, old.siteName),
      subtitle: cleanText(req.body.subtitle, old.subtitle),
      siteDescription: cleanText(req.body.siteDescription, old.siteDescription),
      siteKeywords: cleanText(req.body.siteKeywords, old.siteKeywords),
      logoUrl: cleanUrl(req.body.logoUrl),
      faviconUrl: cleanUrl(req.body.faviconUrl),
      footerText: cleanText(req.body.footerText, old.footerText),
      loaderLogoUrl: cleanUrl(req.body.loaderLogoUrl),
      loaderText: cleanText(req.body.loaderText, old.loaderText),
      backgroundMain: cleanUrl(req.body.backgroundMain),
      popupImageUrl: cleanUrl(req.body.popupImageUrl),
      popupLink: cleanUrl(req.body.popupLink, '#'),
      popupTimer: toInt(req.body.popupTimer, 1200),
      popupActive: toBool(req.body.popupActive),
      sliders: sliders.length ? sliders : old.sliders,
      buttons: buttons.length ? buttons : old.buttons,
      bottomNav
    };

    await saveSettings(data);
    return res.redirect('/PINKTIGER8008?saved=1');
  } catch (err) { next(err); }
});

router.post('/message/add', auth, async (req, res, next) => {
  try {
    const messages = getMessages();
    messages.unshift({
      id: Date.now().toString(),
      title: cleanText(req.body.title, 'Pesan OMTOGEL'),
      category: cleanText(req.body.category, 'INFO'),
      message: cleanText(req.body.message),
      imageUrl: cleanUrl(req.body.imageUrl),
      link: cleanUrl(req.body.link, '#'),
      createdAt: new Date().toISOString()
    });
    saveMessages(messages);
    return res.redirect('/PINKTIGER8008#messages');
  } catch (err) { next(err); }
});
router.post('/message/delete/:id', auth, async (req, res, next) => {
  try {
    saveMessages(getMessages().filter(item => item.id !== req.params.id));
    return res.redirect('/PINKTIGER8008#messages');
  } catch (err) { next(err); }
});
router.post('/messages/clear', auth, async (req, res, next) => {
  try { saveMessages([]); return res.redirect('/PINKTIGER8008#messages'); }
  catch (err) { next(err); }
});
module.exports = router;
