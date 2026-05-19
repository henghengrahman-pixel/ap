require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const FileStoreFactory = require('session-file-store');
const helmet = require('helmet');
const { DATA_DIR } = require('./helpers/storage');

const app = express();
const FileStore = FileStoreFactory(session);
const isProduction = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(process.cwd(), 'public'), { maxAge: isProduction ? '7d' : 0 }));

app.use(session({
  name: 'omtogel.sid',
  secret: process.env.SESSION_SECRET || 'dev_secret_ganti_di_railway',
  resave: false,
  saveUninitialized: false,
  store: new FileStore({ path: path.join(DATA_DIR, 'sessions'), retries: 0 }),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use('/', require('./routes/web'));
app.use('/pinktiger8008', require('./routes/admin'));

app.use((req, res) => {
  res.status(404).render('404', { title: 'Halaman Tidak Ditemukan' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Terjadi error server. Cek log Railway.');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`OMTOGEL WEBVIEW APP RUNNING ON PORT ${PORT}`));
