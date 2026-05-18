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

const SETTINGS_FILE =
  path.join(
    DATA_DIR,
    'settings.json'
  );

const DEFAULT_SETTINGS = {

  siteName:
    'OMTOGEL',

  subtitle:
    'Premium Webview App',

  siteDescription:
    '',

  siteKeywords:
    '',

  logoUrl:
    '',

  faviconUrl:
    '',

  footerText:
    '© OMTOGEL',

  loaderLogoUrl:
    '',

  loaderText:
    'MEMUAT APLIKASI...',

  /*
  =========================
  BACKGROUND
  =========================
  */

  backgroundMain:
    '',

  backgroundLogin:
    '',

  backgroundPopup:
    '',

  backgroundFooter:
    '',

  backgroundNavbar:
    '',

  backgroundLoading:
    '',

  /*
  =========================
  POPUP
  =========================
  */

  popupImageUrl:
    '',

  popupLink:
    '#',

  popupTimer:
    1200,

  popupActive:
    false,

  /*
  =========================
  SLIDER
  =========================
  */

  sliders: [

    {
      id: 'slide-1',
      title: 'Slide 1',
      imageUrl: '',
      link: '#',
      order: 1,
      active: true
    }

  ],

  /*
  =========================
  BUTTON
  =========================
  */

  buttons: [

    {
      id: 'btn-1',
      title: 'LOGIN',
      link: '#',
      icon: '',
      color: 'silver',
      order: 1,
      active: true
    },

    {
      id: 'btn-2',
      title: 'DAFTAR',
      link: '#',
      icon: '',
      color: 'red',
      order: 2,
      active: true
    }

  ],

  /*
  =========================
  FEATURE CARD
  =========================
  */

  featureCards: [

    {
      id: 'feature-1',
      title: 'BONUS MEMBER',
      image: '',
      link: '#',
      order: 1,
      active: true
    },

    {
      id: 'feature-2',
      title: 'APK DOWNLOAD',
      image: '',
      link: '#',
      order: 2,
      active: true
    },

    {
      id: 'feature-3',
      title: 'EVENT SLOT',
      image: '',
      link: '#',
      order: 3,
      active: true
    },

    {
      id: 'feature-4',
      title: 'RTP LIVE',
      image: '',
      link: '#',
      order: 4,
      active: true
    }

  ],

  /*
  =========================
  BOTTOM NAV
  =========================
  */

  bottomNav: [

    {
      id: 'nav-1',
      title: 'HOME',
      icon: 'fa-solid fa-house',
      link: '/',
      colorActive: '#d21717',
      order: 1,
      active: true
    },

    {
      id: 'nav-2',
      title: 'DAFTAR',
      icon: 'fa-solid fa-user-plus',
      link: '#',
      colorActive: '#d21717',
      order: 2,
      active: true
    },

    {
      id: 'nav-3',
      title: 'WHATSAPP',
      icon: 'fa-brands fa-whatsapp',
      link: '#',
      colorActive: '#d21717',
      order: 3,
      active: true
    },

    {
      id: 'nav-4',
      title: 'LIVE CHAT',
      icon: 'fa-regular fa-comments',
      link: '#',
      colorActive: '#d21717',
      order: 4,
      active: true
    }

  ]

};

/*
=========================
ENSURE FILE
=========================
*/

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

/*
=========================
SANITIZE
=========================
*/

function cleanText(
  value = '',
  fallback = ''
) {

  const result =
    String(value || '')
      .replace(/<[^>]*>?/gm, '')
      .replace(/\s+/g, ' ')
      .trim();

  return result || fallback;

}

function cleanUrl(
  value = '',
  fallback = ''
) {

  const url =
    cleanText(value);

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

function toInt(
  value,
  fallback = 0
) {

  const num =
    parseInt(value);

  return Number.isNaN(num)
    ? fallback
    : num;

}

/*
=========================
COLLECTION
=========================
*/

function readCollection(
  prefix,
  body,
  limit,
  callback
) {

  const result = [];

  for (
    let i = 1;
    i <= limit;
    i++
  ) {

    result.push(
      callback(i)
    );

  }

  return result;

}

/*
=========================
READ SETTINGS
=========================
*/

async function getSettings() {

  try {

    ensureFile();

    const raw =
      fs.readFileSync(
        SETTINGS_FILE,
        'utf8'
      );

    const parsed =
      JSON.parse(raw || '{}');

    return {

      ...DEFAULT_SETTINGS,

      ...parsed,

      sliders:
        Array.isArray(parsed.sliders)
          ? parsed.sliders
          : DEFAULT_SETTINGS.sliders,

      buttons:
        Array.isArray(parsed.buttons)
          ? parsed.buttons
          : DEFAULT_SETTINGS.buttons,

      featureCards:
        Array.isArray(parsed.featureCards)
          ? parsed.featureCards
          : DEFAULT_SETTINGS.featureCards,

      bottomNav:
        Array.isArray(parsed.bottomNav)
          ? parsed.bottomNav
          : DEFAULT_SETTINGS.bottomNav

    };

  } catch (err) {

    console.error(
      'GET SETTINGS ERROR'
    );

    console.error(err);

    return DEFAULT_SETTINGS;

  }

}

/*
=========================
SAVE SETTINGS
=========================
*/

async function saveSettings(
  data = {}
) {

  try {

    ensureFile();

    const current =
      await getSettings();

    const updated = {

      ...current,

      ...data,

      updatedAt:
        Date.now()

    };

    const tempFile =
      SETTINGS_FILE + '.tmp';

    fs.writeFileSync(
      tempFile,
      JSON.stringify(
        updated,
        null,
        2
      )
    );

    fs.renameSync(
      tempFile,
      SETTINGS_FILE
    );

    return updated;

  } catch (err) {

    console.error(
      'SAVE SETTINGS ERROR'
    );

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
