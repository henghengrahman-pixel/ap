const { getDb, isMongoReady } = require('./db');

const silver = 'silver';
const red = 'red';

const defaultSliders = [
  { id: 'slide-1', title: 'Promo Utama', imageUrl: '', link: '#', order: 1, active: true }
];

const defaultButtons = [
  { id: 'btn-1', title: 'RTP SLOT', link: '#', icon: '', color: silver, order: 1, active: true },
  { id: 'btn-2', title: 'PROMOSI', link: '#', icon: '', color: silver, order: 2, active: true },
  { id: 'btn-3', title: 'LOGIN', link: '#', icon: '', color: silver, order: 3, active: true },
  { id: 'btn-4', title: 'BUKTI JP', link: '#', icon: '', color: silver, order: 4, active: true },
  { id: 'btn-5', title: 'DAFTAR', link: '#', icon: '', color: red, order: 5, active: true },
  { id: 'btn-6', title: 'PREDIKSI TOGEL', link: '#', icon: '', color: silver, order: 6, active: true },
  { id: 'btn-7', title: 'LINK ALTERNATIF', link: '#', icon: '', color: silver, order: 7, active: true }
];

const defaultBottomNav = [
  { id: 'nav-home', title: 'HOME', icon: 'fa-solid fa-house', link: '/', colorActive: '#d21717', order: 1, active: true },
  { id: 'nav-daftar', title: 'DAFTAR', icon: 'fa-solid fa-user-plus', link: '#', colorActive: '#d21717', order: 2, active: true },
  { id: 'nav-whatsapp', title: 'WHATSAPP', icon: 'fa-brands fa-whatsapp', link: '#', colorActive: '#d21717', order: 3, active: true },
  { id: 'nav-livechat', title: 'LIVE CHAT', icon: 'fa-regular fa-comments', link: '#', colorActive: '#d21717', order: 4, active: true }
];

const defaultSettings = {
  siteName: 'OMTOGEL',
  subtitle: 'Aplikasi OMTOGEL',
  siteDescription: 'Aplikasi OMTOGEL mobile webview.',
  siteKeywords: 'omtogel, aplikasi, webview',
  logoUrl: '',
  faviconUrl: '',
  footerText: 'Copyright © 2024 Aplikasi OMTOGEL. All Right Reserved',
  loaderLogoUrl: '',
  loaderText: 'MEMUAT APLIKASI...',
  backgroundMain: '',
  backgroundMobile: '',
  backgroundDesktop: '',
  backgroundLogin: '',
  backgroundPopup: '',
  backgroundFooter: '',
  backgroundNavbar: '',
  backgroundLoading: '',
  popupImageUrl: '',
  popupLink: '#',
  popupTimer: 1200,
  popupActive: false,
  sliders: defaultSliders,
  buttons: defaultButtons,
  bottomNav: defaultBottomNav
};

function cleanText(v, fallback = '') { return String(v ?? fallback).trim(); }
function cleanUrl(v, fallback = '') { const s = cleanText(v, fallback); return s || fallback || ''; }
function toBool(v) { return v === true || v === 'true' || v === 'on' || v === '1'; }
function toInt(v, fallback = 0) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : fallback; }
function sortItems(items) { return [...items].sort((a,b) => (toInt(a.order,0) - toInt(b.order,0))); }

function normalizeSettings(raw = {}) {
  const merged = { ...defaultSettings, ...(raw || {}) };
  merged.sliders = Array.isArray(merged.sliders) && merged.sliders.length ? merged.sliders : defaultSliders;
  merged.buttons = Array.isArray(merged.buttons) && merged.buttons.length ? merged.buttons : defaultButtons;
  merged.bottomNav = Array.isArray(merged.bottomNav) && merged.bottomNav.length ? merged.bottomNav : defaultBottomNav;
  merged.sliders = sortItems(merged.sliders.map((s, i) => ({ id: s.id || `slide-${Date.now()}-${i}`, title: cleanText(s.title, `Slide ${i+1}`), imageUrl: cleanUrl(s.imageUrl), link: cleanUrl(s.link, '#'), order: toInt(s.order, i+1), active: s.active !== false })));
  merged.buttons = sortItems(merged.buttons.map((b, i) => ({ id: b.id || `btn-${Date.now()}-${i}`, title: cleanText(b.title, `MENU ${i+1}`), link: cleanUrl(b.link, '#'), icon: cleanText(b.icon), color: cleanText(b.color, 'silver'), order: toInt(b.order, i+1), active: b.active !== false })));
  merged.bottomNav = sortItems(merged.bottomNav.map((n, i) => ({ id: n.id || `nav-${Date.now()}-${i}`, title: cleanText(n.title, `NAV ${i+1}`), icon: cleanText(n.icon, 'fa-solid fa-circle'), link: cleanUrl(n.link, '#'), colorActive: cleanText(n.colorActive, '#d21717'), order: toInt(n.order, i+1), active: n.active !== false })));
  return merged;
}

async function getSettings() {
  if (!isMongoReady()) return normalizeSettings(defaultSettings);
  const doc = await getDb().collection('app_settings').findOne({ key: 'main' });
  if (!doc) {
    await saveSettings(defaultSettings);
    return normalizeSettings(defaultSettings);
  }
  return normalizeSettings(doc.value || {});
}

async function saveSettings(data) {
  const normalized = normalizeSettings(data);
  if (!isMongoReady()) return normalized;
  await getDb().collection('app_settings').updateOne({ key: 'main' }, { $set: { value: normalized, updatedAt: new Date() } }, { upsert: true });
  return normalized;
}

function readCollection(prefix, body, count, mapper) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const n = i + 1;
    const item = mapper(n, i);
    if (item) out.push(item);
  }
  return out;
}

module.exports = { defaultSettings, normalizeSettings, getSettings, saveSettings, cleanText, cleanUrl, toBool, toInt, readCollection };
