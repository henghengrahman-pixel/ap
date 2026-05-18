function cleanText(value = '') {

  return String(value)
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

}

function slugify(value = '') {

  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

}

function safeNumber(value, fallback = 0) {

  const num = Number(value);

  return Number.isNaN(num)
    ? fallback
    : num;

}

function safeArray(value) {

  return Array.isArray(value)
    ? value
    : [];

}

module.exports = {
  cleanText,
  slugify,
  safeNumber,
  safeArray
};
