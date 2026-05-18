const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULT_SETTINGS = {
  siteName: 'OMTOGEL', subtitle: 'Aplikasi OMTOGEL',
  siteDescription: 'OMTOGEL mobile webview app', siteKeywords: 'omtogel, rtp slot, promosi, daftar, prediksi togel',
  logoUrl: '', faviconUrl: '', footerText: 'Copyright © 2024 Aplikasi OMTOGEL. All Right Reserved',
  loaderLogoUrl: '', loaderText: 'MEMUAT APLIKASI...',
  backgroundMain: '', backgroundLogin: '', backgroundPopup: '', backgroundFooter: '', backgroundNavbar: '', backgroundLoading: '',
  popupImageUrl: '', popupLink: '#', popupTimer: 1200, popupActive: false,
  sliders: [{ id: 'slide-1', title: 'Promo Utama', imageUrl: '', link: '#', order: 1, active: true }],
  buttons: [
    { id: 'btn-1', title: 'RTP SLOT', link: '#', icon: '', color: 'silver', order: 1, active: true },
    { id: 'btn-2', title: 'PROMOSI', link: '#', icon: '', color: 'silver', order: 2, active: true },
    { id: 'btn-3', title: 'LOGIN', link: '#', icon: '', color: 'silver', order: 3, active: true },
    { id: 'btn-4', title: 'BUKTI JP', link: '#', icon: '', color: 'silver', order: 4, active: true },
    { id: 'btn-5', title: 'DAFTAR', link: '#', icon: '', color: 'red', order: 5, active: true },
    { id: 'btn-6', title: 'PREDIKSI TOGEL', link: '#', icon: '', color: 'silver', order: 6, active: true },
    { id: 'btn-7', title: 'LINK ALTERNATIF', link: '#', icon: '', color: 'silver', order: 7, active: true }
  ],
  featureCards: [],
  bottomNav: [
    { id: 'nav-1', title: 'HOME', icon: 'fa-solid fa-house', link: '/', colorActive: '#b31116', order: 1, active: true },
    { id: 'nav-2', title: 'DAFTAR', icon: 'fa-solid fa-user-plus', link: '#', colorActive: '#b31116', order: 2, active: true },
    { id: 'nav-3', title: 'WHATSAPP', icon: 'fa-brands fa-whatsapp', link: '#', colorActive: '#b31116', order: 3, active: true },
    { id: 'nav-4', title: 'LIVE CHAT', icon: 'fa-regular fa-comments', link: '#', colorActive: '#b31116', order: 4, active: true }
  ]
};
function ensureFile(){ if(!fs.existsSync(SETTINGS_FILE)) fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS,null,2)); }
function cleanText(value='', fallback=''){ const result=String(value||'').replace(/<[^>]*>?/gm,'').replace(/\s+/g,' ').trim(); return result || fallback; }
function cleanUrl(value='', fallback=''){ return cleanText(value) || fallback; }
function toBool(value){ return value===true || value==='true' || value==='1' || value==='on'; }
function toInt(value, fallback=0){ const num=parseInt(value,10); return Number.isNaN(num)?fallback:num; }
function readCollection(prefix, body, limit, callback){ const result=[]; for(let i=1;i<=limit;i++) result.push(callback(i)); return result; }
async function getSettings(){ try{ ensureFile(); const parsed=JSON.parse(fs.readFileSync(SETTINGS_FILE,'utf8')||'{}'); return { ...DEFAULT_SETTINGS, ...parsed, sliders:Array.isArray(parsed.sliders)?parsed.sliders:DEFAULT_SETTINGS.sliders, buttons:Array.isArray(parsed.buttons)?parsed.buttons:DEFAULT_SETTINGS.buttons, featureCards:Array.isArray(parsed.featureCards)?parsed.featureCards:DEFAULT_SETTINGS.featureCards, bottomNav:Array.isArray(parsed.bottomNav)?parsed.bottomNav:DEFAULT_SETTINGS.bottomNav }; } catch(err){ console.error('GET SETTINGS ERROR',err); return DEFAULT_SETTINGS; } }
async function saveSettings(data={}){ try{ ensureFile(); const current=await getSettings(); const updated={...current,...data,updatedAt:Date.now()}; const tempFile=SETTINGS_FILE+'.tmp'; fs.writeFileSync(tempFile, JSON.stringify(updated,null,2)); fs.renameSync(tempFile, SETTINGS_FILE); return updated; } catch(err){ console.error('SAVE SETTINGS ERROR',err); return DEFAULT_SETTINGS; } }
module.exports = { getSettings, saveSettings, cleanText, cleanUrl, toBool, toInt, readCollection, DEFAULT_SETTINGS };
