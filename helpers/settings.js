const { seedJson, readJson } = require('./json-db');

const DEFAULT_SLIDES = [
  { title: 'Promo Utama', imageUrl: '', link: '#', active: true },
  { title: 'Prediksi Bola', imageUrl: '', link: '/berita', active: true },
  { title: 'Live Score', imageUrl: '', link: '/livescore', active: true }
];

const DEFAULT_QUICK_MENUS = [
  { title: 'LOGIN', imageUrl: '', link: '#', active: true },
  { title: 'DAFTAR', imageUrl: '', link: '#', active: true, featured: true },
  { title: 'LIVESCORE', imageUrl: '', link: '/livescore', active: true },
  { title: 'BERITA BOLA', imageUrl: '', link: '/berita', active: true }
];

const defaultSettings = {
  siteName: 'OMTOGEL',
  siteSubtitle: 'Premium Sportsbook Webview',
  siteDescription: 'Portal berita bola dan prediksi pertandingan premium.',
  siteKeywords: 'omtogel, berita bola, prediksi bola, live score',
  footerText: '© 2026 OMTOGEL. All Rights Reserved.',
  logoUrl: '',
  faviconUrl: '',
  backgroundUrl: '',
  backgroundMobileUrl: '',
  tickerText: 'Selamat datang di OMTOGEL — portal berita bola, live score, dan prediksi pertandingan pilihan.',
  mainWebviewUrl: '/',
  loginUrl: '#',
  registerUrl: '#',
  livescoreUrl: '/livescore',
  newsUrl: '/berita',
  whatsappUrl: '#',
  liveChatUrl: '#',
  themeColor: '#050505',
  accentColor: '#c0c0c0',
  goldColor: '#f5c542',
  sliders: DEFAULT_SLIDES,
  quickMenus: DEFAULT_QUICK_MENUS,
  ads: []
};

function toBool(value, fallback = true) {
  if (typeof value === 'boolean') return value;
  if (['false', '0', '', 'off'].includes(String(value).toLowerCase())) return false;
  if (['true', '1', 'on'].includes(String(value).toLowerCase())) return true;
  return fallback;
}

function normalizeItem(item = {}, fallback = {}) {
  return {
    id: String(item.id || fallback.id || Date.now()),
    title: String(item.title || fallback.title || '').trim(),
    imageUrl: String(item.imageUrl || item.image || fallback.imageUrl || fallback.image || '').trim(),
    link: String(item.link || fallback.link || '#').trim() || '#',
    active: toBool(item.active, fallback.active !== false),
    featured: toBool(item.featured, !!fallback.featured)
  };
}

function normalizeSettings(raw = {}) {
  const merged = { ...defaultSettings, ...raw };
  const sliders = (Array.isArray(raw.sliders) && raw.sliders.length ? raw.sliders : DEFAULT_SLIDES)
    .slice(0, 10).map((s, i) => normalizeItem(s, DEFAULT_SLIDES[i] || {}));
  const quickMenus = (Array.isArray(raw.quickMenus) && raw.quickMenus.length ? raw.quickMenus : (raw.launcherButtons || DEFAULT_QUICK_MENUS))
    .slice(0, 12).map((m, i) => normalizeItem(m, DEFAULT_QUICK_MENUS[i] || {}));
  const ads = (Array.isArray(raw.ads) ? raw.ads : []).slice(0, 20).map((ad) => ({
    id: String(ad.id || Date.now()),
    title: String(ad.title || '').trim(),
    imageUrl: String(ad.imageUrl || ad.image || '').trim(),
    link: String(ad.link || '#').trim() || '#',
    position: String(ad.position || 'home').trim(),
    active: toBool(ad.active, true)
  }));
  return { ...merged, sliders, quickMenus, ads };
}

function getSettings(seed = true) {
  const raw = seed ? seedJson('settings.json', defaultSettings) : readJson('settings.json', defaultSettings);
  return normalizeSettings(raw);
}

module.exports = { defaultSettings, getSettings, normalizeSettings, DEFAULT_SLIDES, DEFAULT_QUICK_MENUS };
