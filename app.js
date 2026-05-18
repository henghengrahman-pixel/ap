require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const session = require('express-session');
const FileStore = require('session-file-store')(session);

const expressLayouts = require('express-ejs-layouts');

const methodOverride = require('method-override');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');

const webRoutes = require('./routes/web');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

const ROOT_DIR = __dirname;

const PUBLIC_DIR =
  path.join(ROOT_DIR, 'public');

const ASSET_DIR =
  path.join(PUBLIC_DIR, 'assets');

const DATA_DIR =
  process.env.DATA_DIR ||
  path.join(ROOT_DIR, 'data');

const SESSION_DIR =
  path.join(DATA_DIR, 'sessions');

const CACHE_DIR =
  path.join(DATA_DIR, 'cache');

const TEMP_DIR =
  path.join(DATA_DIR, 'temp');

[
  PUBLIC_DIR,
  ASSET_DIR,
  DATA_DIR,
  SESSION_DIR,
  CACHE_DIR,
  TEMP_DIR
].forEach(dir => {

  if (!fs.existsSync(dir)) {

    fs.mkdirSync(dir, {
      recursive: true
    });

  }

});

async function start() {

  const app = express();

  app.disable('x-powered-by');

  app.set('trust proxy', 1);

  app.set(
    'view engine',
    'ejs'
  );

  app.set(
    'views',
    path.join(ROOT_DIR, 'views')
  );

  app.use(expressLayouts);

  app.set(
    'layout',
    'layouts/main'
  );

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  );

  app.use(compression());

  app.use(cors());

  app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
  }));

  app.use(express.json({
    limit: '10mb'
  }));

  app.use(methodOverride('_method'));

  /*
  ==========================
  STATIC FILES
  ==========================
  */

  app.use(
    express.static(PUBLIC_DIR, {
      etag: true,
      maxAge:
        process.env.NODE_ENV === 'production'
          ? '7d'
          : 0,
      index: false
    })
  );

  /*
  ==========================
  SESSION
  ==========================
  */

  app.use(
    session({

      name: 'omtogel.sid',

      secret:
        process.env.SESSION_SECRET ||
        'OMTOGEL_SECRET',

      resave: false,

      saveUninitialized: false,

      store: new FileStore({

        path: SESSION_DIR,

        retries: 1,

        ttl:
          60 * 60 * 24 * 7,

        reapSyncFallback: true,

        logFn: () => {}

      }),

      cookie: {

        secure:
          process.env.NODE_ENV === 'production',

        httpOnly: true,

        sameSite: 'lax',

        maxAge:
          1000 *
          60 *
          60 *
          24 *
          7

      }

    })
  );

  /*
  ==========================
  GLOBAL
  ==========================
  */

  app.use((req, res, next) => {

    res.locals.baseUrl =
      process.env.BASE_URL ||
      `${req.protocol}://${req.get('host')}`;

    next();

  });

  /*
  ==========================
  HEALTH
  ==========================
  */

  app.get('/ping', (req, res) => {

    return res.status(200).send('OK');

  });

  app.get('/health', (req, res) => {

    return res.json({

      ok: true,

      uptime:
        process.uptime(),

      timestamp:
        Date.now()

    });

  });

  /*
  ==========================
  ROUTES
  ==========================
  */

  app.use('/api', apiRoutes);

  app.use(
    '/PINKTIGER8008',
    adminRoutes
  );

  app.use(
    '/pinktiger8008',
    (req, res) => {

      return res.redirect(
        '/PINKTIGER8008' +
        (
          req.url === '/'
            ? ''
            : req.url
        )
      );

    }
  );

  app.use('/', webRoutes);

  /*
  ==========================
  404
  ==========================
  */

  app.use((req, res) => {

    if (
      req.originalUrl.startsWith('/api')
    ) {

      return res.status(404).json({

        success: false,

        message:
          'API not found'

      });

    }

    return res.status(404).render(
      'simple',
      {
        title: '404',
        message:
          'Halaman tidak ditemukan.',
        settings: {}
      }
    );

  });

  /*
  ==========================
  ERROR
  ==========================
  */

  app.use((err, req, res, next) => {

    console.error(
      'SERVER ERROR:',
      err
    );

    if (
      req.originalUrl.startsWith('/api')
    ) {

      return res.status(500).json({

        success: false,

        message:
          err.message ||
          'Server error'

      });

    }

    return res.status(500).render(
      'simple',
      {
        title: 'SERVER ERROR',
        message:
          err.message ||
          'Server error',
        settings: {}
      }
    );

  });

  /*
  ==========================
  START
  ==========================
  */

  const PORT =
    process.env.PORT || 8080;

  app.listen(PORT, () => {

    console.log(
      '======================================'
    );

    console.log(
      `OMTOGEL WEBVIEW APP RUNNING ON ${PORT}`
    );

    console.log(
      `PUBLIC DIR : ${PUBLIC_DIR}`
    );

    console.log(
      `DATA DIR : ${DATA_DIR}`
    );

    console.log(
      `SESSION DIR : ${SESSION_DIR}`
    );

    console.log(
      '======================================'
    );

  });

}

start().catch(err => {

  console.error(
    'FAILED START APP'
  );

  console.error(err);

  process.exit(1);

});
