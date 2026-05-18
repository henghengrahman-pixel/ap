const fs = require('fs');
const path = require('path');

const DATA_DIR =
  process.env.DATA_DIR ||
  path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, {
    recursive: true
  });
}

const SETTINGS_FILE = path.join(
  DATA_DIR,
  'settings.json'
);

const DEFAULT_SETTINGS = {

  siteName: 'OMTOGEL',

  subtitle: 'Premium Webview App',

  siteDescription: '',

  siteKeywords: '',

  logoUrl: '',

  faviconUrl: '',

  footerText: '© OMTOGEL',

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

  sliders: [],

  buttons: [],

  bottomNav: []

};

function ensureFile() {

  if (!fs.existsSync(SETTINGS_FILE)) {

    fs.writeFileSync(
      SETTINGS_FILE,
      JSON.stringify(
        DEFAULT_SETTINGS,
        null,
        2
      )
    );

  }

}

function cleanText(value = '', fallback = '') {

  const result = String(value || '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

  return result || fallback;

}

function cleanUrl(value = '', fallback = '') {

  const url = cleanText(value);

  if (!url) {
    return fallback;
  }

  return url;

}

function toBool(value) {

  return (
    value === true ||
    value === 'true' ||
    value === '1' ||
    value === 'on'
  );

}

function toInt(value, fallback = 0) {

  const num = parseInt(value);

  return Number.isNaN(num)
    ? fallback
    : num;

}

function readCollection(
  prefix,
  body,
  limit,
  callback
) {

  const result = [];

  for (let i = 1; i <= limit; i++) {

    result.push(
      callback(i)
    );

  }

  return result;

}

async function getSettings() {

  try {

    ensureFile();

    const raw = fs.readFileSync(
      SETTINGS_FILE,
      'utf8'
    );

    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(raw || '{}')
    };

  } catch (err) {

    console.error(err);

    return DEFAULT_SETTINGS;

  }

}

async function saveSettings(data = {}) {

  try {

    ensureFile();

    const current =
      await getSettings();

    const updated = {
      ...current,
      ...data
    };

    fs.writeFileSync(
      SETTINGS_FILE,
      JSON.stringify(
        updated,
        null,
        2
      )
    );

    return updated;

  } catch (err) {

    console.error(err);

    return DEFAULT_SETTINGS;

  }

}

module.exports = {

  getSettings,

  saveSettings,

  cleanText,

  cleanUrl,

  toBool,

  toInt,

  readCollection

};
