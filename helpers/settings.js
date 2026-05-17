const { seedJson, readJson } = require('./json-db');

const DEFAULT_MENU_CARDS = Array.from({ length: 8 }, (_, index) => ({
  title: [
    'PREDIKSI TOGEL',
    'RTP SLOT',
    'KELUHAN MEMBER',
    'PROMO',
    'LIVE CASINO',
    'SPORTBOOK',
    'BUKTI JACKPOT',
    'JADWAL PASARAN'
  ][index] || `MENU ${index + 1}`,
  desc: [
    'Update angka dan info pilihan',
    'Cek performa game favorit',
    'Bantuan cepat untuk member',
    'Promo terbaru hari ini',
    'Masuk ke arena live casino',
    'Pasaran bola dan olahraga',
    'Kemenangan member terbaru',
    'Informasi pasaran lengkap'
  ][index] || 'Atur dari admin',
  image: '',
  link: '#'
}));

const defaultSettings = {
  siteName: 'OMTOGEL',
  siteDescription: 'OMTOGEL Premium Webview App',
  siteKeywords: 'omtogel, webview, live draw, whatsapp, inbox',
  logoUrl: '',
  faviconUrl: '',
  mainWebviewUrl: '/blank-frame',
  liveDrawUrl: '#',
  whatsappUrl: '#',
  inboxUrl: '/inbox-frame',
  menuCards: DEFAULT_MENU_CARDS
};

function normalizeSettings(raw = {}) {
  const legacyCards = DEFAULT_MENU_CARDS.map((card, i) => {
    const n = i + 1;
    return {
      title: raw[`menuCard${n}Title`] || card.title,
      desc: raw[`menuCard${n}Desc`] || card.desc,
      image: raw[`menuCard${n}Image`] || card.image,
      link: raw[`menuCard${n}Link`] || card.link
    };
  });

  const cards = Array.isArray(raw.menuCards) && raw.menuCards.length
    ? DEFAULT_MENU_CARDS.map((card, i) => ({ ...card, ...(raw.menuCards[i] || {}) }))
    : legacyCards;

  return {
    ...defaultSettings,
    ...raw,
    menuCards: cards.slice(0, 8)
  };
}

function getSettings(seed = true) {
  const raw = seed ? seedJson('settings.json', defaultSettings) : readJson('settings.json', defaultSettings);
  return normalizeSettings(raw);
}

module.exports = { defaultSettings, getSettings, normalizeSettings };
