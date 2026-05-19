const express = require('express');
const router = express.Router();
const { requireAdmin, redirectIfAdmin } = require('../middleware/auth');
const { getSettings, saveSettings, getSliders, saveSliders } = require('../helpers/storage');

function adminCredentialsValid(id, password) {
  return String(id || '') === String(process.env.ADMIN_ID || 'admin') &&
    String(password || '') === String(process.env.ADMIN_PASSWORD || '123456');
}

router.get('/login', redirectIfAdmin, (req, res) => {
  res.render('login', { title: 'Login Admin', error: req.query.error });
});

router.post('/login', redirectIfAdmin, (req, res) => {
  const { adminId, password } = req.body;
  if (!adminCredentialsValid(adminId, password)) return res.redirect('/pinktiger8008/login?error=1');
  req.session.isAdmin = true;
  req.session.adminId = adminId;
  res.redirect('/pinktiger8008');
});

router.post('/logout', requireAdmin, (req, res) => {
  req.session.destroy(() => res.redirect('/pinktiger8008/login'));
});

router.get('/', requireAdmin, (req, res) => {
  res.render('admin/dashboard', { title: 'Dashboard Admin', settings: getSettings(), sliders: getSliders() });
});

router.get('/settings', requireAdmin, (req, res) => {
  res.render('admin/settings', { title: 'Pengaturan Aplikasi', settings: getSettings(), saved: req.query.saved });
});

router.post('/settings', requireAdmin, (req, res) => {
  const old = getSettings();
  const body = req.body;
  const buttons = [];
  const names = Array.isArray(body.buttonName) ? body.buttonName : [body.buttonName];
  const links = Array.isArray(body.buttonLink) ? body.buttonLink : [body.buttonLink];
  const colors = Array.isArray(body.buttonColor) ? body.buttonColor : [body.buttonColor];
  const actives = body.buttonActive;
  for (let i = 0; i < names.length; i++) {
    if (!String(names[i] || '').trim()) continue;
    buttons.push({
      name: String(names[i] || '').trim(),
      link: String(links[i] || '#').trim() || '#',
      color: colors[i] === 'red' ? 'red' : 'silver',
      active: Array.isArray(actives) ? actives.includes(String(i)) : String(actives) === String(i)
    });
  }
  saveSettings({
    ...old,
    siteName: body.siteName || 'OMTOGEL',
    logoUrl: body.logoUrl || '',
    backgroundUrl: body.backgroundUrl || '',
    footerText: body.footerText || '',
    bottomHomeName: body.bottomHomeName || 'HOME',
    bottomHomeLink: body.bottomHomeLink || '/',
    bottomRegisterName: body.bottomRegisterName || 'DAFTAR',
    bottomRegisterLink: body.bottomRegisterLink || '#',
    bottomWhatsappName: body.bottomWhatsappName || 'WHATSAPP',
    bottomWhatsappLink: body.bottomWhatsappLink || '#',
    bottomLivechatName: body.bottomLivechatName || 'LIVE CHAT',
    bottomLivechatLink: body.bottomLivechatLink || '#',
    buttons: buttons.length ? buttons : old.buttons
  });
  res.redirect('/pinktiger8008/settings?saved=1');
});

router.get('/sliders', requireAdmin, (req, res) => {
  res.render('admin/sliders', { title: 'Slider Foto', sliders: getSliders(), saved: req.query.saved });
});

router.post('/sliders', requireAdmin, (req, res) => {
  const body = req.body;
  const titles = Array.isArray(body.title) ? body.title : [body.title];
  const imageUrls = Array.isArray(body.imageUrl) ? body.imageUrl : [body.imageUrl];
  const links = Array.isArray(body.link) ? body.link : [body.link];
  const orders = Array.isArray(body.order) ? body.order : [body.order];
  const actives = body.active;
  const sliders = [];
  for (let i = 0; i < imageUrls.length; i++) {
    if (!String(imageUrls[i] || '').trim()) continue;
    sliders.push({
      title: String(titles[i] || `Slide ${i + 1}`).trim(),
      imageUrl: String(imageUrls[i] || '').trim(),
      link: String(links[i] || '#').trim() || '#',
      order: Number(orders[i] || i + 1),
      active: Array.isArray(actives) ? actives.includes(String(i)) : String(actives) === String(i)
    });
  }
  saveSliders(sliders);
  res.redirect('/pinktiger8008/sliders?saved=1');
});

module.exports = router;
