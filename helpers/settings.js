const { seedJson, readJson } = require('./json-db');

const DEFAULT_MENU_CARDS = Array.from({ length: 8 }, (_, index) => ({
  title: [
    'PREDIKSI TOGEL', 'RTP SLOT', 'KELUHAN MEMBER', 'PROMO',
    'LIVE CASINO', 'SPORTBOOK', 'BUKTI JACKPOT', 'JADWAL PASARAN'
  ][index] || `MENU ${index + 1}`,
  desc: [
    'Update angka dan info pilihan', 'Cek performa game favorit', 'Bantuan cepat untuk member', 'Promo terbaru hari ini',
    'Masuk ke arena live casino', 'Pasaran bola dan olahraga', 'Kemenangan member terbaru', 'Informasi pasaran lengkap'
  ][index] || 'Atur dari admin',
  image: '',
  icon: ['fa-chart-line','fa-fire','fa-headset','fa-gift','fa-dice','fa-futbol','fa-trophy','fa-calendar-days'][index] || 'fa-circle',
  link: '#',
  active: true
}));

const defaultSettings = {
  siteName: 'OMTOGEL',
  siteDescription: 'OMTOGEL Premium Mobile Webview App',
  siteKeywords: 'omtogel, sportsbook, webview app, live draw, promo',
  footerText: '© OMTOGEL Premium App',
  runningText: '',
  logoUrl: '',
  faviconUrl: '',
  appIconUrl: '',
  splashImageUrl: '',
  backgroundDesktopUrl: '',
  backgroundMobileUrl: '',
  popupPromoImageUrl: '',
  popupPromoLink: '',
  mainWebviewUrl: '/blank-frame',
  liveDrawUrl: '#',
  whatsappUrl: '#',
  inboxUrl: '/inbox-frame',
  registerUrl: '#',
  loginUrl: '#',
  socialTelegram: '',
  socialInstagram: '',
  socialWhatsapp: '',
  themeColor: '#050505',
  accentColor: '#f5c542',
  navbarColor: '#090909',
  menuColor: '#101114',
  glassOpacity: '0.78',
  radius: '22',
  animationSpeed: '220',
  firebaseApiKey: '',
  firebaseAuthDomain: '',
  firebaseProjectId: '',
  firebaseStorageBucket: '',
  firebaseMessagingSenderId: '',
  firebaseAppId: '',
  firebaseVapidKey: '',
  menuCards: DEFAULT_MENU_CARDS,
  quickMenus: [],
  sliders: []
};

function toBool(value, fallback = true) {
  if (typeof value === 'boolean') return value;
  if (value === 'false' || value === '0' || value === '') return false;
  if (value === 'true' || value === '1' || value === 'on') return true;
  return fallback;
}

function normalizeSettings(raw = {}) {
  const legacyCards = DEFAULT_MENU_CARDS.map((card, i) => {
    const n = i + 1;
    return {
      ...card,
      title: raw[`menuCard${n}Title`] || card.title,
      desc: raw[`menuCard${n}Desc`] || card.desc,
      image: raw[`menuCard${n}Image`] || card.image,
      icon: raw[`menuCard${n}Icon`] || card.icon,
      link: raw[`menuCard${n}Link`] || card.link,
      active: toBool(raw[`menuCard${n}Active`], true)
    };
  });

  const cards = Array.isArray(raw.menuCards) && raw.menuCards.length
    ? DEFAULT_MENU_CARDS.map((card, i) => ({ ...card, ...(raw.menuCards[i] || {}), active: toBool((raw.menuCards[i] || {}).active, true) }))
    : legacyCards;

  return {
    ...defaultSettings,
    ...raw,
    themeColor: raw.themeColor || defaultSettings.themeColor,
    accentColor: raw.accentColor || defaultSettings.accentColor,
    menuCards: cards.slice(0, 8)
  };
}

function getSettings(seed = true) {
  const raw = seed ? seedJson('settings.json', defaultSettings) : readJson('settings.json', defaultSettings);
  return normalizeSettings(raw);
}

module.exports = { defaultSettings, getSettings, normalizeSettings };
