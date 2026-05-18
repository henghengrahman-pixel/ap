const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

function ensureDir(dir = DATA_DIR) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function filePath(name) {
  ensureDir();
  const safeName = path.basename(name);
  return path.join(DATA_DIR, safeName);
}

function readJson(name, fallback = []) {
  const target = filePath(name);
  if (!fs.existsSync(target)) return fallback;
  try {
    const raw = fs.readFileSync(target, 'utf8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.log('READ JSON ERROR:', name, err.message);
    return fallback;
  }
}

function writeJson(name, data) {
  ensureDir();
  const target = filePath(name);
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, target);
}

function seedJson(name, fallback) {
  const target = filePath(name);
  if (!fs.existsSync(target)) writeJson(name, fallback);
  return readJson(name, fallback);
}

module.exports = { readJson, writeJson, seedJson, DATA_DIR, ensureDir };
