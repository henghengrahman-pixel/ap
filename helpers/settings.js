const { seedJson, readJson } = require('./json-db');

const DEFAULT_LAUNCHER_BUTTONS = [
  { title: 'RTP SLOT', link: '#', active: true },
  { title: 'PROMOSI', link: '#', active: true },
  { title: 'LOGIN', link: '#', active: true },
  { title: 'BUKTI JP', link: '#', active: true },
  { title: 'DAFTAR', link: '#', active: true, featured: true },
  { title: 'PREDIKSI TOGEL', link: '#', active: true },
  { title: 'LINK ALTERNATIF', link: '#', active: true }
];

const DEFAULT_SLIDES = [
  { image: '', link: '#', active: true },
  { image: '', link: '#', active: true },
  { image: '', link: '#', active: true }
];

const DEFAULT_MENU_CARDS = DEFAULT_LAUNCHER_BUTTONS.map((btn) => ({
  title: btn.title,
  desc: 'Atur dari admin',
  image: '',
  icon: '',
  link: btn.link,
  active: btn.active,
  featured: !!btn.featured
}));

const defaultSettings = {
  siteName: 'OMTOGEL',
  siteDescription: 'OMTOGEL Premium Launcher App',
  siteKeywords: 'omtogel, launcher app, rtp slot, promo, login, daftar',
  footerText: 'Copyright © 2024 Aplikasi OMTOGEL. All Right Reserved',
  logoUrl: '',
  faviconUrl: '',
  appIconUrl: '',
  splashImageUrl: '',
  backgroundDesktopUrl: '',
  backgroundMobileUrl: '',
  heroBannerUrl: '',
  heroBannerLink: '#',
  mainWebviewUrl: '#',
  loginUrl: '#',
  registerUrl: '#',
  liveDrawUrl: '#',
  whatsappUrl: '#',
  liveChatUrl: '#',
  promoUrl: '#',
  rtpUrl: '#',
  buktiJpUrl: '#',
  prediksiUrl: '#',
  alternatifUrl: '#',
  inboxUrl: '/inbox-frame',
  themeColor: '#050505',
  accentColor: '#f5c542',
  buttonTextColor: '#ffffff',
  buttonFeaturedColor: '#d00000',
  radius: '24',
  animationSpeed: '180',
  bottomHomeUrl: '/',
  bottomDaftarUrl: '#',
  bottomWhatsappUrl: '#',
  bottomLiveChatUrl: '#',
  firebaseApiKey: '',
  firebaseAuthDomain: '',
  firebaseProjectId: '',
  firebaseStorageBucket: '',
  firebaseMessagingSenderId: '',
  firebaseAppId: '',
  firebaseVapidKey: '',
  sliders: DEFAULT_SLIDES,
  launcherButtons: DEFAULT_LAUNCHER_BUTTONS,
  menuCards: DEFAULT_MENU_CARDS
};

function toBool(value, fallback = true) {
  if (typeof value === 'boolean') return value;
  if (value === 'false' || value === '0' || value === '') return false;
  if (value === 'true' || value === '1' || value === 'on') return true;
  return fallback;
}

function normalizeSettings(raw = {}) {
  const sliders = Array.isArray(raw.sliders) && raw.sliders.length
    ? DEFAULT_SLIDES.map((item, i) => ({ ...item, ...(raw.sliders[i] || {}), active: toBool((raw.sliders[i] || {}).active, true) }))
    : DEFAULT_SLIDES.map((item, i) => ({
        ...item,
        image: raw[`slide${i + 1}Image`] || item.image,
        link: raw[`slide${i + 1}Link`] || item.link,
        active: toBool(raw[`slide${i + 1}Active`], true)
      }));

  const legacyButtons = DEFAULT_LAUNCHER_BUTTONS.map((btn, i) => {
    const n = i + 1;
    return {
      ...btn,
      title: raw[`button${n}Title`] || btn.title,
      link: raw[`button${n}Link`] || btn.link,
      active: toBool(raw[`button${n}Active`], true),
      featured: toBool(raw[`button${n}Featured`], !!btn.featured)
    };
  });

  const launcherButtons = Array.isArray(raw.launcherButtons) && raw.launcherButtons.length
    ? DEFAULT_LAUNCHER_BUTTONS.map((btn, i) => ({ ...btn, ...(raw.launcherButtons[i] || {}), active: toBool((raw.launcherButtons[i] || {}).active, true), featured: toBool((raw.launcherButtons[i] || {}).featured, !!btn.featured) }))
    : legacyButtons;

  const menuCards = Array.isArray(raw.menuCards) && raw.menuCards.length
    ? raw.menuCards
    : launcherButtons.map((btn) => ({ title: btn.title, desc: 'Atur dari admin', image: '', icon: '', link: btn.link, active: btn.active, featured: btn.featured }));

  return {
    ...defaultSettings,
    ...raw,
    themeColor: raw.themeColor || defaultSettings.themeColor,
    accentColor: raw.accentColor || defaultSettings.accentColor,
    sliders: sliders.slice(0, 6),
    launcherButtons: launcherButtons.slice(0, 12),
    menuCards: menuCards.slice(0, 12)
  };
}

function getSettings(seed = true) {
  const raw = seed ? seedJson('settings.json', defaultSettings) : readJson('settings.json', defaultSettings);
  return normalizeSettings(raw);
}

module.exports = { defaultSettings, getSettings, normalizeSettings, DEFAULT_LAUNCHER_BUTTONS, DEFAULT_SLIDES };
