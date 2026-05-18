const express = require('express');
const auth = require('../middleware/auth');
const { getDb, isMongoReady } = require('../helpers/db');
const { getSettings, saveSettings, cleanText, cleanUrl, toBool, toInt, readCollection } = require('../helpers/settings');

const router = express.Router();

function mustDb(req, res, next) {
  if (!isMongoReady()) return next(new Error('MongoDB belum terhubung. Isi MONGO_URI di Railway.'));
  next();
}

router.get('/login', async (req, res, next) => {
  try { res.render('admin/login', { layout: false, error: null, settings: await getSettings() }); } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const username = cleanText(req.body.username);
    const password = cleanText(req.body.password);
    if (username === process.env.ADMIN_ID && password === process.env.ADMIN_PASSWORD) {
      req.session.admin = true;
      return req.session.save(() => res.redirect('/PINKTIGER8008'));
    }
    return res.status(401).render('admin/login', { layout: false, error: 'ID atau password salah.', settings: await getSettings() });
  } catch (err) { next(err); }
});

router.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/PINKTIGER8008/login')));

router.get('/', auth, mustDb, async (req, res, next) => {
  try {
    const settings = await getSettings();
    const messages = await getDb().collection('messages').find({}).sort({ createdAt: -1 }).limit(100).toArray();
    res.render('admin/settings', { layout: 'layouts/main-admin', settings, messages });
  } catch (err) { next(err); }
});

router.post('/settings', auth, mustDb, async (req, res, next) => {
  try {
    const old = await getSettings();
    const sliders = readCollection('slide', req.body, 12, (n, i) => ({
      id: cleanText(req.body[`slide${n}Id`], `slide-${Date.now()}-${n}`),
      title: cleanText(req.body[`slide${n}Title`], `Slide ${n}`),
      imageUrl: cleanUrl(req.body[`slide${n}ImageUrl`]),
      link: cleanUrl(req.body[`slide${n}Link`], '#'),
      order: toInt(req.body[`slide${n}Order`], n),
      active: toBool(req.body[`slide${n}Active`])
    })).filter(s => s.title || s.imageUrl || s.link !== '#');

    const buttons = readCollection('button', req.body, 14, (n) => ({
      id: cleanText(req.body[`button${n}Id`], `btn-${Date.now()}-${n}`),
      title: cleanText(req.body[`button${n}Title`]),
      link: cleanUrl(req.body[`button${n}Link`], '#'),
      icon: cleanText(req.body[`button${n}Icon`]),
      color: cleanText(req.body[`button${n}Color`], 'silver'),
      order: toInt(req.body[`button${n}Order`], n),
      active: toBool(req.body[`button${n}Active`])
    })).filter(b => b.title);

    const bottomNav = readCollection('nav', req.body, 8, (n) => ({
      id: cleanText(req.body[`nav${n}Id`], `nav-${Date.now()}-${n}`),
      title: cleanText(req.body[`nav${n}Title`]),
      icon: cleanText(req.body[`nav${n}Icon`], 'fa-solid fa-circle'),
      link: cleanUrl(req.body[`nav${n}Link`], '#'),
      colorActive: cleanText(req.body[`nav${n}ColorActive`], '#d21717'),
      order: toInt(req.body[`nav${n}Order`], n),
      active: toBool(req.body[`nav${n}Active`])
    })).filter(n => n.title);

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
      backgroundMobile: cleanUrl(req.body.backgroundMobile),
      backgroundDesktop: cleanUrl(req.body.backgroundDesktop),
      backgroundLogin: cleanUrl(req.body.backgroundLogin),
      backgroundPopup: cleanUrl(req.body.backgroundPopup),
      backgroundFooter: cleanUrl(req.body.backgroundFooter),
      backgroundNavbar: cleanUrl(req.body.backgroundNavbar),
      backgroundLoading: cleanUrl(req.body.backgroundLoading),
      popupImageUrl: cleanUrl(req.body.popupImageUrl),
      popupLink: cleanUrl(req.body.popupLink, '#'),
      popupTimer: toInt(req.body.popupTimer, 1200),
      popupActive: toBool(req.body.popupActive),
      sliders: sliders.length ? sliders : old.sliders,
      buttons: buttons.length ? buttons : old.buttons,
      bottomNav: bottomNav.length ? bottomNav : old.bottomNav
    };
    await saveSettings(data);
    res.redirect('/PINKTIGER8008?saved=1');
  } catch (err) { next(err); }
});

router.post('/message/add', auth, mustDb, async (req, res, next) => {
  try {
    await getDb().collection('messages').insertOne({
      title: cleanText(req.body.title, 'Pesan OMTOGEL'),
      category: cleanText(req.body.category, 'INFO'),
      message: cleanText(req.body.message),
      imageUrl: cleanUrl(req.body.imageUrl),
      link: cleanUrl(req.body.link, '#'),
      createdAt: new Date()
    });
    res.redirect('/PINKTIGER8008#messages');
  } catch (err) { next(err); }
});

router.post('/message/delete/:id', auth, mustDb, async (req, res, next) => {
  try {
    const { ObjectId } = require('mongodb');
    await getDb().collection('messages').deleteOne({ _id: new ObjectId(req.params.id) });
    res.redirect('/PINKTIGER8008#messages');
  } catch (err) { next(err); }
});

router.post('/messages/clear', auth, mustDb, async (req, res, next) => {
  try { await getDb().collection('messages').deleteMany({}); res.redirect('/PINKTIGER8008#messages'); } catch (err) { next(err); }
});

module.exports = router;
