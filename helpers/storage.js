const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DEFAULT_SETTINGS = {
  siteName: 'OMTOGEL',
  logoUrl: '',
  backgroundUrl: '',
  footerText: 'Copyright © 2026 Aplikasi OMTOGEL. All Right Reserved',
  bottomHomeName: 'HOME',
  bottomHomeLink: '/',
  bottomRegisterName: 'DAFTAR',
  bottomRegisterLink: '#',
  bottomWhatsappName: 'WHATSAPP',
  bottomWhatsappLink: '#',
  bottomLivechatName: 'LIVE CHAT',
  bottomLivechatLink: '#',
  buttons: [
    { name: 'RTP SLOT', link: '#', color: 'silver', active: true },
    { name: 'PROMOSI', link: '#', color: 'silver', active: true },
    { name: 'LOGIN', link: '#', color: 'silver', active: true },
    { name: 'BUKTI JP', link: '#', color: 'silver', active: true },
    { name: 'DAFTAR', link: '#', color: 'red', active: true },
    { name: 'PREDIKSI TOGEL', link: '#', color: 'silver', active: true },
    { name: 'LINK ALTERNATIF', link: '#', color: 'silver', active: true }
  ]
};
const DEFAULT_SLIDERS = [
  { imageUrl: '', link: '#', title: 'Promo Utama', active: true, order: 1 }
];

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
function filePath(file) {
  ensureDir();
  return path.join(DATA_DIR, file);
}
function safeReadJson(file, fallback) {
  ensureDir();
  const target = filePath(file);
  if (!fs.existsSync(target)) {
    safeWriteJson(file, fallback);
    return structuredCloneSafe(fallback);
  }
  try {
    const raw = fs.readFileSync(target, 'utf8');
    return Object.assign(Array.isArray(fallback) ? [] : {}, fallback, JSON.parse(raw || 'null') || fallback);
  } catch (err) {
    console.error(`Gagal baca ${file}:`, err.message);
    return structuredCloneSafe(fallback);
  }
}
function safeWriteJson(file, data) {
  ensureDir();
  const target = filePath(file);
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, target);
}
function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}
function getSettings() {
  const data = safeReadJson('settings.json', DEFAULT_SETTINGS);
  data.buttons = Array.isArray(data.buttons) && data.buttons.length ? data.buttons : DEFAULT_SETTINGS.buttons;
  return data;
}
function saveSettings(data) {
  safeWriteJson('settings.json', data);
}
function getSliders() {
  const data = safeReadJson('sliders.json', DEFAULT_SLIDERS);
  return Array.isArray(data) ? data.sort((a, b) => Number(a.order || 0) - Number(b.order || 0)) : [];
}
function saveSliders(data) {
  safeWriteJson('sliders.json', Array.isArray(data) ? data : []);
}

module.exports = { DATA_DIR, DEFAULT_SETTINGS, DEFAULT_SLIDERS, getSettings, saveSettings, getSliders, saveSliders };
