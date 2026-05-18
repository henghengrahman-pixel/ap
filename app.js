require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
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
const io = new Server(server, { cors: { origin: process.env.SOCKET_ORIGIN || '*' } });
global.io = io;

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads');
[PUBLIC_DIR, UPLOAD_DIR, DATA_DIR].forEach((dir) => ensureDir(dir));

app.set('view engine', 'ejs');
app.set('views', path.join(ROOT_DIR, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: false
}));
app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(methodOverride('_method'));

const sessionOptions = {
  name: 'omtogel.sid',
  secret: process.env.SESSION_SECRET || 'change_this_session_secret_on_railway',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};

if (process.env.MONGO_URI) {
  sessionOptions.store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 60 * 60 * 24 * 7,
    autoRemove: 'native'
  });
} else if (process.env.NODE_ENV === 'production') {
  console.warn('WARNING: MONGO_URI belum diisi. Session memakai MemoryStore sementara. Untuk production Railway, isi MONGO_URI.');
}

app.use(session(sessionOptions));
app.use(csurf({ cookie: false, ignoreMethods: ['GET', 'HEAD', 'OPTIONS'] }));

app.use((req, res, next) => {
  res.locals.baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  res.locals.csrfToken = typeof req.csrfToken === 'function' ? req.csrfToken() : '';
  next();
});

app.use(express.static(PUBLIC_DIR, {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  etag: true,
  index: false
}));

io.on('connection', (socket) => console.log('SOCKET CONNECTED:', socket.id));
initFirebase();

app.get('/ping', (req, res) => res.send('OK'));
app.use('/api', apiLimiter, apiRoutes);
app.use('/', webRoutes);
app.use('/itsiregar8008', adminRoutes);

app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) return res.status(404).json({ success: false, message: 'API NOT FOUND' });
  return res.status(404).render('simple', { layout: 'layouts/main', title: '404 PAGE', message: 'Halaman tidak ditemukan.' });
});

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    if (req.originalUrl.startsWith('/api')) return res.status(403).json({ success: false, message: 'CSRF token tidak valid.' });
    return res.status(403).send('CSRF token tidak valid. Refresh halaman lalu coba lagi.');
  }
  console.error('SERVER ERROR:', err);
  return res.status(500).send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SERVER ERROR</title><style>body{margin:0;background:#050505;color:#fff;min-height:100vh;display:grid;place-items:center;font-family:Arial;padding:20px}.box{max-width:760px;background:#111;border:1px solid #333;border-radius:22px;padding:28px;text-align:center}h1{color:#ff4d4d}</style></head><body><div class="box"><h1>SERVER ERROR</h1><p>${String(err.message || 'Unknown error')}</p></div></body></html>`);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`OMTOGEL PREMIUM APP RUNNING ON ${PORT}`));
