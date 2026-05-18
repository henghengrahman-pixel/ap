const fs = require('fs');
const path = require('path');

const DATA_DIR =
  process.env.DATA_DIR ||
  path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SETTINGS_FILE = path.join(
  DATA_DIR,
  'settings.json'
);

const DEFAULT_SETTINGS = {

  siteName: 'OMTOGEL',

  subtitle: 'Premium Webview App',

  logoUrl: '',

  faviconUrl: '',

  footerText: '© OMTOGEL',

  loaderLogo: '',

  loaderText: 'MEMUAT APLIKASI...',

  backgroundMain: '',

  backgroundMobile: '',

  backgroundDesktop: '',

  backgroundLogin: '',

  backgroundPopup: '',

  backgroundFooter: '',

  backgroundNavbar: '',

  backgroundLoading: ''

};

function ensureSettingsFile() {

  if (!fs.existsSync(SETTINGS_FILE)) {

    fs.writeFileSync(
      SETTINGS_FILE,
      JSON.stringify(DEFAULT_SETTINGS, null, 2)
    );

  }

}

async function getSettings() {

  try {

    ensureSettingsFile();

    const raw = fs.readFileSync(
      SETTINGS_FILE,
      'utf8'
    );

    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(raw || '{}')
    };

  } catch (err) {

    console.error('GET SETTINGS ERROR', err);

    return DEFAULT_SETTINGS;

  }

}

async function saveSettings(data = {}) {

  try {

    ensureSettingsFile();

    const current = await getSettings();

    const updated = {
      ...current,
      ...data
    };

    fs.writeFileSync(
      SETTINGS_FILE,
      JSON.stringify(updated, null, 2)
    );

    return updated;

  } catch (err) {

    console.error('SAVE SETTINGS ERROR', err);

    return DEFAULT_SETTINGS;

  }

}

module.exports = {
  getSettings,
  saveSettings
};
