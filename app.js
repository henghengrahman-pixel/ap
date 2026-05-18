require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const { connectDb, MONGO_URI } = require('./helpers/db');
const webRoutes = require('./routes/web');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT_DIR, 'data');
[PUBLIC_DIR, DATA_DIR].forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });

async function start() {
  if (MONGO_URI) await connectDb();
  if (process.env.NODE_ENV === 'production' && !MONGO_URI) throw new Error('MONGO_URI wajib diisi di Railway agar session dan admin tersimpan stabil.');

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.set('view engine', 'ejs');
  app.set('views', path.join(ROOT_DIR, 'views'));
  app.use(expressLayouts);
  app.set('layout', 'layouts/main');

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(compression());
  app.use(cors());
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(express.json({ limit: '5mb' }));
  app.use(methodOverride('_method'));
  app.use(express.static(PUBLIC_DIR, { maxAge: '7d', etag: true, index: false }));

  app.use(session({
    name: 'omtogel.sid',
    secret: process.env.SESSION_SECRET || 'CHANGE_THIS_SESSION_SECRET',
    resave: false,
    saveUninitialized: false,
    store: MONGO_URI ? MongoStore.create({ mongoUrl: MONGO_URI, collectionName: 'sessions', ttl: 60 * 60 * 24 * 7 }) : undefined,
    cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 }
  }));

  app.use((req, res, next) => {
    res.locals.baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    next();
  });

  app.get('/ping', (req, res) => res.status(200).send('OK'));
  app.get('/health', (req, res) => res.json({ ok: true }));
  app.use('/api', apiRoutes);
  app.use('/PINKTIGER8008', adminRoutes);
  app.use('/pinktiger8008', (req, res) => res.redirect('/PINKTIGER8008' + (req.url === '/' ? '' : req.url)));
  app.use('/', webRoutes);

  app.use((req, res) => {
    if (req.originalUrl.startsWith('/api')) return res.status(404).json({ success: false, message: 'API not found' });
    res.status(404).render('simple', { title: '404', message: 'Halaman tidak ditemukan.', settings: {} });
  });

  app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    if (req.originalUrl.startsWith('/api')) return res.status(500).json({ success: false, message: err.message || 'Server error' });
    res.status(500).render('simple', { title: 'SERVER ERROR', message: err.message || 'Server error', settings: {} });
  });

  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => console.log(`OMTOGEL WEBVIEW APP RUNNING ON ${PORT}`));
}

start().catch(err => { console.error(err); process.exit(1); });
