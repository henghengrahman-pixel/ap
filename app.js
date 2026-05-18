require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const FileStoreFactory = require('session-file-store');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cors = require('cors');
const http = require('http');
const compression = require('compression');
const helmet = require('helmet');
const { Server } = require('socket.io');
const csurf = require('csurf');

const webRoutes = require('./routes/web');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');
const { DATA_DIR, ensureDir } = require('./helpers/json-db');
const { apiLimiter } = require('./middleware/security');
const { initFirebase } = require('./services/fcm');

const app = express();
const server = http.createServer(app);
const isProduction = process.env.NODE_ENV === 'production';
const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const SESSION_DIR = path.join(DATA_DIR, 'sessions');

[PUBLIC_DIR, DATA_DIR, SESSION_DIR].forEach(ensureDir);

const io = new Server(server, { cors: { origin: process.env.SOCKET_ORIGIN || '*', credentials: true } });
global.io = io;

app.set('view engine', 'ejs');
app.set('views', path.join(ROOT_DIR, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  frameguard: false
}));

app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Permissions-Policy', 'interest-cohort=()');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(express.json({ limit: '25mb' }));
app.use(methodOverride('_method'));

const sessionOptions = {
  name: 'omtogel.sid',
  secret: process.env.SESSION_SECRET || 'change-this-session-secret-in-railway',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  proxy: true,
  cookie: { secure: isProduction ? 'auto' : false, httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 }
};

if (process.env.MONGO_URI) {
  sessionOptions.store = MongoStore.create({ mongoUrl: process.env.MONGO_URI, ttl: 60 * 60 * 24 * 7, autoRemove: 'native' });
} else {
  const FileStore = FileStoreFactory(session);
  sessionOptions.store = new FileStore({ path: SESSION_DIR, ttl: 60 * 60 * 24 * 7, retries: 1, reapInterval: 60 * 60 });
}

app.use(session(sessionOptions));

const csrfProtection = csurf({ cookie: false, ignoreMethods: ['GET', 'HEAD', 'OPTIONS'] });
function shouldBypassCsrf(req) {
  const method = String(req.method || 'GET').toUpperCase();
  if (req.path.startsWith('/itsiregar8008')) return false;
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true;
  return req.path.startsWith('/api/') || req.path === '/api' || req.path.startsWith('/socket.io');
}
app.use((req, res, next) => shouldBypassCsrf(req) ? next() : csrfProtection(req, res, next));

app.use((req, res, next) => {
  res.locals.baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  res.locals.csrfToken = typeof req.csrfToken === 'function' ? req.csrfToken() : '';
  res.locals.currentPath = req.path;
  next();
});

app.use(express.static(PUBLIC_DIR, {
  maxAge: isProduction ? '1d' : 0,
  etag: true,
  index: false,
  setHeaders: (res, filePath) => {
    const f = filePath.replace(/\\/g, '/');
    if (f.endsWith('/service-worker.js') || f.endsWith('/firebase-messaging-sw.js') || f.endsWith('/manifest.json')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
  }
}));

io.on('connection', (socket) => console.log('SOCKET CONNECTED:', socket.id));
initFirebase();

app.get('/ping', (req, res) => res.send('OK'));
app.use('/api', apiLimiter, apiRoutes);
app.use('/itsiregar8008', adminRoutes);
app.use('/', webRoutes);

app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) return res.status(404).json({ success: false, message: 'API NOT FOUND' });
  return res.status(404).render('simple', { layout: 'layouts/main', title: '404', message: 'Halaman tidak ditemukan.', settings: require('./helpers/settings').getSettings(false) });
});

app.use((err, req, res, next) => {
  console.error('APP ERROR:', err);
  if (err && err.code === 'EBADCSRFTOKEN') {
    if (req.originalUrl.startsWith('/api')) return res.status(403).json({ success: false, message: 'CSRF token tidak valid.' });
    return res.status(403).send('Session form kadaluarsa. Silakan refresh halaman lalu coba lagi.');
  }
  if (req.originalUrl.startsWith('/api')) return res.status(500).json({ success: false, message: err.message || 'SERVER ERROR' });
  return res.status(500).render('simple', { layout: 'layouts/main', title: 'Error', message: isProduction ? 'Terjadi gangguan server.' : err.message, settings: require('./helpers/settings').getSettings(false) });
});

const PORT = Number(process.env.PORT || 8080);
server.listen(PORT, () => console.log(`OMTOGEL PREMIUM APP RUNNING ON PORT ${PORT}`));
