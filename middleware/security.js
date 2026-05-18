const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Terlalu banyak percobaan login. Coba lagi beberapa menit.'
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 160,
  standardHeaders: true,
  legacyHeaders: false
});

function clean(value) {
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach((key) => {
      if (Array.isArray(req.body[key])) req.body[key] = req.body[key].map(clean);
      else req.body[key] = clean(req.body[key]);
    });
  }
  next();
}

module.exports = { loginLimiter, apiLimiter, sanitizeBody };
